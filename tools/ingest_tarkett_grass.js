const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { chromium } = require('playwright');
const core = require('./lib/ingest-core.js');
const parse = require('./lib/tarkett-parse.js');

// S10 — Tarkett „Veštačka trava" (tarkett.rs kategorija rs_C01024).
// 10 kolekcija idu u NOVU kategoriju „Veštačka trava" (id 14) pod POSTOJEĆI Tarkett brend (id 3).
// Pišu u public/data/tarkett_grass_products.json u DEKING obliku (ravna lista proizvoda),
// pa getAllGrassProducts() (loader) + prepare-colors.ts cat-14 grana surface-uju nove kolekcije.
//
// Proizvodi su KAO DEKING: single-design, colorless, „Cena na upit" (price 0), skriven prozor boja.
// Svaka kolekcija = JEDAN proizvod (zapis), sku 'GRASS-<slug>', slug 'tarkett-<slug>', categoryId '14',
// brandId '3'. Hero/galerija slike + install/spec PDF-ovi se SELF-HOSTUJU na Supabase
// (product-images / product-documents) — BEZ hotlinkova (worker-pool + withTimeout).
//
// Oblik zapisa (deking shape — public/data/tis_deking_products.json):
//   { id, name, slug, url, brand, brandId:'3', categoryId:'14', sku:'GRASS-<slug>',
//     description, specs:{...}, images:[{url,alt,isPrimary,order}], documents:[{title,url,type}] }

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const GRASS_JSON = path.join(DATA_DIR, 'tarkett_grass_products.json');
const IMAGES_BUCKET = 'product-images';
const DOCS_BUCKET = 'product-documents';
const CATEGORY_SLUG = 'grass';
const CATEGORY_ID = '14';
const BRAND_ID = '3';
const SKU_PREFIX = 'GRASS-';
const ID_BASE = 14000;             // GRASS id prostor (deking koristi 5000+); izbegava koliziju
const ASSET_CONCURRENCY = 6;       // worker-pool za galeriju (download+upload)
const ASSET_TIMEOUT_MS = 120000;   // tvrdi per-asset plafon (zastao socket → ne zamrzni run)
const MIN_IMAGE_WIDTH = 400;       // štiti od placeholdera

// 10 „Veštačka trava" kolekcija (rs_C01024). giardino C001880 je IZOSTAVLJEN (discontinued).
// Slug je SAMO pretpostavka iz izviđanja — STVARNI slug se izvodi iz NUXT `collection_name_slug`
// posle fetch-a (URL se gradi robustno preko `kolekcija-<ID>-x` jer ruter vodi po ID-u).
const GRASS_COLLECTIONS = [
  ['C002770', 'campo'],
  ['C002779', 'field'],
  ['C002933', 'field-cut'],
  ['C002778', 'glade'],
  ['C001186', 'greenfield'],
  ['C001883', 'greenland'],
  ['C002934', 'greenland-cut'],
  ['C001518', 'prado'],
  ['C002936', 'prado-cut'],
  ['C002935', 'premier'],
].map(([collectionId, guessSlug], index) => ({
  key: `grass-${guessSlug}`,
  collectionId,
  guessSlug,
  id: String(ID_BASE + index),
  url: `https://www.tarkett.rs/sr_RS/kolekcija-${collectionId}-${guessSlug}`,
}));

// Specifikacije bitne za veštačku travu (mapiraj srpske labele iz NUXT specs-a).
const GRASS_SPEC_LABELS = ['Visina flora', 'Težina', 'Garancija', 'UV stabilnost'];

function parseArgs() {
  const args = { dryRun: false, keys: [], skipExisting: false };
  for (const a of process.argv.slice(2)) {
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--skip-existing') args.skipExisting = true;
    else if (a.startsWith('--collection=')) args.keys.push(a.split('=')[1]);
  }
  return args;
}

function abs(u) { return String(u || '').startsWith('//') ? `https:${u}` : u; }

// Playwright: učitaj kolekcijsku stranicu i vrati __NUXT__ objekat (identično ingest_tarkett_lajsne.js).
async function fetchNuxt(browser, url) {
  const page = await browser.newPage({ userAgent: core.BROWSER_HEADERS['User-Agent'] });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    const nuxt = await page.evaluate(() => {
      let n = window.__NUXT__;
      if (typeof n === 'function') { try { n = n(); } catch (_) { n = null; } }
      if (!n) return null;
      try { return JSON.parse(JSON.stringify(n)); } catch (_) { return null; }
    });
    return nuxt;
  } finally {
    await page.close();
  }
}

// Per-dizajn JSON (pune specifikacije iz sku_technical_caracteristics) — za srpske karakteristike.
async function fetchDesignSpecs(productDataUrl) {
  if (!productDataUrl) return null;
  const text = await core.fetchPage(abs(productDataUrl));
  let j;
  try { j = JSON.parse(text); } catch (_) { return null; }
  const sku = j?.item?.product_collection?.collection_default_sku;
  return { rawSpecs: sku?.sku_technical_caracteristics || {} };
}

async function uploadImage(supabase, storagePath, buffer, label) {
  const meta = await core.withTimeout(sharp(buffer).metadata(), 20000, `sharp ${label}`);
  if (!meta.width || meta.width < MIN_IMAGE_WIDTH) {
    throw new Error(`${label}: slika ${meta.width || '?'}px < ${MIN_IMAGE_WIDTH}px`);
  }
  return core.uploadToBucket(supabase, IMAGES_BUCKET, storagePath, buffer);
}

// Skini + uploaduj kolekcione dokumente (install/spec PDF) u product-documents — BEZ hotlinkova.
// Vrati [{title,url,type:'pdf'}] sa Supabase URL-ovima (ogledalo ingest_tarkett_lajsne.js ingestDocuments).
async function ingestDocuments(supabase, manifest, slug, docs) {
  const out = [];
  for (const doc of docs) {
    const mKey = `doc:${doc.sourceUrl}`;
    if (manifest.has(mKey)) { out.push({ title: doc.title, url: manifest.get(mKey).publicUrl, type: 'pdf' }); continue; }
    try {
      const buffer = await core.downloadAsset(doc.sourceUrl);
      if (!buffer.slice(0, 5).toString().startsWith('%PDF')) throw new Error('nije PDF');
      const srcBase = (doc.sourceUrl.split('/').pop() || 'dokument').replace(/\.pdf$/i, '');
      const fileName = `${core.slugify(srcBase)}.pdf`;
      const publicUrl = await core.uploadToBucket(
        supabase, DOCS_BUCKET, `products/${CATEGORY_SLUG}/${slug}/${fileName}`, buffer);
      out.push({ title: doc.title, url: publicUrl, type: 'pdf' });
      manifest.record(mKey, { publicUrl, collection: slug });
    } catch (err) {
      console.log(`   ⚠️ dokument "${doc.title}": ${err.message}`);
    }
  }
  return out;
}

// Hero + galerija slike kolekcije. collection_picture prvo, pa COVER/GALLERY iz collection_assets.
function collectionImageUrls(item) {
  const urls = [];
  if (item.collection_picture) urls.push(parse.mediaImageUrl(item.collection_picture));
  for (const g of parse.galleryImagesFromAssets(item)) {
    if (!urls.includes(g)) urls.push(g);
  }
  // Fallback: prvi dizajn thumbnail ako kolekcija nema cover/gallery.
  if (urls.length === 0 && item.designs?.[0]?.product_thumbnail) {
    urls.push(parse.mediaImageUrl(item.designs[0].product_thumbnail));
  }
  return urls;
}

// Izvuci grass specs (Visina flora/Težina/Garancija/UV stabilnost) iz per-dizajn srpskih karakteristika.
// Sve dostupne karakteristike se zadržavaju (kao deking specs objekat), uz garantovan 'Kolekcija' ključ.
function grassSpecs(item, designSpecs) {
  const specs = {};
  specs['Brend'] = 'Tarkett';
  specs['Kolekcija'] = item.collection_name;
  if (designSpecs) {
    const sr = parse.toSerbianCharacteristics(designSpecs);
    // Prvo prioritetne grass labele (ako postoje pod istim imenom)...
    for (const k of GRASS_SPEC_LABELS) {
      if (sr[k]) specs[k] = sr[k];
    }
    // ...pa ostale dostupne karakteristike (graciozni fallback — ništa se ne gubi).
    for (const [k, v] of Object.entries(sr)) {
      if (!(k in specs)) specs[k] = v;
    }
  }
  return specs;
}

async function ingestGrassCollection(supabase, manifest, args, col, item) {
  const designs = item.designs || [];
  const description = parse.stripHtml(item.description) || parse.stripHtml(item.short_description);
  const shortDescription = parse.stripHtml(item.short_description) || description;
  const realSlug = item.collection_name_slug || col.guessSlug;
  const slug = `tarkett-${realSlug}`;
  const sku = `${SKU_PREFIX}${realSlug}`;

  // Specifikacije iz per-dizajn JSON-a (prvog dizajna).
  const firstSpecs = await fetchDesignSpecs(designs[0]?.productDataUrl).catch(() => null);
  const specs = grassSpecs(item, firstSpecs && firstSpecs.rawSpecs);

  // Dokumenti: realni collection_assets PDF-ovi (install/spec) → Supabase (BEZ hotlinka).
  const assetDocs = parse.collectionDocsFromAssets(item);
  const documents = args.dryRun
    ? assetDocs.map((d) => ({ title: d.title, url: d.sourceUrl, type: 'pdf' }))
    : await ingestDocuments(supabase, manifest, slug, assetDocs);

  // Hero + galerija slike (worker-pool). Promašaj jedne slike je ne-fatalan — preskoči je.
  const sourceUrls = collectionImageUrls(item);
  const imgResults = new Array(sourceUrls.length).fill(null);
  let cursor = 0;
  let saved = 0;
  async function imgWorker() {
    while (cursor < sourceUrls.length) {
      const idx = cursor++;
      const src = sourceUrls[idx];
      if (args.dryRun) {
        imgResults[idx] = { url: src, alt: item.collection_name, isPrimary: idx === 0, order: idx + 1 };
        continue;
      }
      try {
        const url = await core.withTimeout((async () => {
          const buf = await core.downloadAsset(src);
          const fileBase = idx === 0 ? 'hero' : `gallery-${idx}`;
          return uploadImage(supabase, `products/${CATEGORY_SLUG}/${slug}/${fileBase}.jpg`, buf, `${slug}/${fileBase}`);
        })(), ASSET_TIMEOUT_MS, `image ${slug}#${idx}`);
        imgResults[idx] = { url, alt: item.collection_name, isPrimary: idx === 0, order: idx + 1 };
        if (++saved % 10 === 0) manifest.save();
      } catch (err) {
        console.log(`   ⚠️ slika #${idx}: ${err.message} — preskačem`);
      }
    }
  }
  const poolSize = args.dryRun ? 1 : Math.min(ASSET_CONCURRENCY, sourceUrls.length || 1);
  await Promise.all(Array.from({ length: poolSize }, () => imgWorker()));
  let images = imgResults.filter(Boolean);
  // Garantuj da je tačno jedna slika isPrimary (ako je hero pao, promoviši prvu preživelu).
  if (images.length > 0 && !images.some((i) => i.isPrimary)) images[0].isPrimary = true;

  return {
    id: col.id,
    name: item.collection_name,
    slug,
    url: col.url,
    brand: 'Tarkett',
    brandId: BRAND_ID,
    categoryId: CATEGORY_ID,
    sku,
    description,
    shortDescription,
    specs,
    images,
    documents,
  };
}

// Idempotentno upiši/zameni proizvod u tarkett_grass_products.json (po sku-u).
function upsertProduct(list, record) {
  const filtered = list.filter((p) => p.sku !== record.sku);
  filtered.push(record);
  return filtered;
}

(async () => {
  const args = parseArgs();
  const manifest = core.loadManifest('ingest-tarkett-grass');
  const supabase = args.dryRun ? null : core.getSupabase();
  const targets = GRASS_COLLECTIONS.filter((c) => args.keys.length === 0 || args.keys.includes(c.key));
  console.log(`🎯 Veštačka trava kolekcija za obradu: ${targets.length}${args.dryRun ? ' (DRY-RUN — bez mrežnih upisa)' : ''}`);
  if (args.dryRun) {
    console.log('📋 10 kolekcija (giardino C001880 izostavljen — discontinued):');
    for (const c of targets) console.log(`   • ${c.collectionId}  ${c.guessSlug}  → sku=${SKU_PREFIX}${c.guessSlug} slug=tarkett-${c.guessSlug}  ${c.url}`);
  }

  const browser = await chromium.launch({ headless: true });
  const summary = [];
  let grassList = null;

  try {
    for (const col of targets) {
      try {
        if (args.skipExisting && !args.dryRun && manifest.get(`collection:${col.key}`)?.status === 'ok') {
          console.log(`\n⏭️  ${col.key}: već ingestovano (manifest ok) — preskačem`);
          summary.push({ key: col.key, skipped: true });
          continue;
        }
        console.log(`\n📂 ${col.key}`);
        const nuxt = await fetchNuxt(browser, col.url);
        const item = parse.extractCollectionItem(nuxt);
        if (!item) throw new Error('__NUXT__ item nije pronađen');
        const realSlug = item.collection_name_slug || col.guessSlug;
        console.log(`   kolekcija="${item.collection_name}" slug=${realSlug} dizajna=${(item.designs || []).length}`);

        const record = await ingestGrassCollection(supabase, manifest, args, col, item);
        console.log(`   → sku=${record.sku} slug=${record.slug} slika:${record.images.length} dok:${record.documents.length} specs:${Object.keys(record.specs).length}`);

        if (!args.dryRun) {
          grassList = grassList || (fs.existsSync(GRASS_JSON) ? JSON.parse(fs.readFileSync(GRASS_JSON, 'utf8')) : []);
          grassList = upsertProduct(grassList, record);
        }
        summary.push({
          key: col.key, sku: record.sku, slug: record.slug, name: record.name,
          images: record.images.length, docs: record.documents.length,
        });
        manifest.record(`collection:${col.key}`, { status: 'ok', sku: record.sku });
        if (!args.dryRun) manifest.save();
      } catch (err) {
        console.log(`⚠️ ${col.key}: ${err.message} — preskačem kolekciju`);
        manifest.record(`collection:${col.key}`, { status: 'error', error: err.message });
        if (!args.dryRun) manifest.save();
      }
    }
  } finally {
    await browser.close();
  }

  if (!args.dryRun && grassList) {
    core.writeJsonWithBackup(GRASS_JSON, grassList, 'tarkett-grass-products');
    manifest.save();
  }

  console.log('\n===== REZIME =====');
  for (const row of summary) console.log(JSON.stringify(row));
})().catch((err) => { console.error('❌', err); process.exit(1); });
