const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { chromium } = require('playwright');
const core = require('./lib/ingest-core.js');
const parse = require('./lib/tarkett-parse.js');

// S9 — Tarkett „Pribor" (lepkovi / podloge / elektrode / nega) → NOVA kategorija „Pribor" (id 15)
// pod POSTOJEĆI Tarkett brend (id 3). Klon ingest_tarkett_grass.js, ali piše u
// public/data/pribor_products.json (deljeno sa Gerflor pribor skriptom, upsert po sku-u).
//
// Pribor = DEKING/GRASS obrazac: single-design, colorless, „Cena na upit" (price 0), skriven prozor boja.
// Svaka kolekcija (C-kod) = JEDAN proizvod, sku 'PRIBOR-<slug>', slug 'tarkett-<slug>',
// categoryId '15', brandId '3'. Hero/galerija slike + spec/install PDF-ovi se SELF-HOSTUJU na
// Supabase (product-images / product-documents) — BEZ hotlinkova (worker-pool + withTimeout).
//
// VAŽNO: neke C-kod stranice mogu da preusmere na kategoriju (mrtve) — kao S5 sigurnosno otkriće.
// Stvarni slug se izvodi iz NUXT `collection_name_slug` posle fetch-a; ako item nema designs ili
// se preusmeri na kategoriju (collection_name fali) → loguj kao redirect/dead i preskoči.

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const PRIBOR_JSON = path.join(DATA_DIR, 'pribor_products.json');
const IMAGES_BUCKET = 'product-images';
const DOCS_BUCKET = 'product-documents';
const CATEGORY_SLUG = 'pribor';
const CATEGORY_ID = '15';
const BRAND_ID = '3';
const SKU_PREFIX = 'PRIBOR-';
const ID_BASE = 15000;             // PRIBOR id prostor (grass 14000+, deking 5000+); bez kolizije
const ASSET_CONCURRENCY = 6;
const ASSET_TIMEOUT_MS = 120000;
const MIN_IMAGE_WIDTH = 300;       // pribor slike (paketi/etikete) često manje od dekora

// 18 Tarkett pribor kolekcija (real slug iz tmp/all_kolekcije.txt, provereno 2026-06-16).
// Grupisano: lepkovi/hladno-varenje, podloge, nega, elektrode.
const PRIBOR_COLLECTIONS = [
  // --- lepkovi / hladno varenje ---
  ['C000037', 'hladno-varenje'],
  ['C000308', 'lepak-u-spreju'],
  ['C001278', 'hladno-varenje'],                 // drugi „hladno-varenje" (drugi C-kod) → slug dobija -<kod> sufiks ako se sudari
  ['C002125', 'lepak-za-vinil'],
  ['C002126', 'cicak-lepak'],
  ['C002127', 'lepak-za-parket'],
  // --- podloge ---
  ['C000303', 'tarkolay-podloga'],
  ['C001282', 'podloga-od-plute'],
  ['C001292', 'podloga-tarkoflex'],
  ['C001442', 'podloga-za-zvucnu-izolaciju'],
  ['C001443', 'podloga-za-neravne-povrsine'],
  ['C001472', 'podloga-za-laminat'],
  // --- nega / parket asortiman ---
  ['C001294', 'tarkett-cleaner'],
  ['C001586', 'prateci-asortiman-za-parket-nega-odrzavanje'],
  ['C001587', 'prateci-asortiman-za-parket-postavljanje-i-ugradnja'],
  // --- elektrode za varenje ---
  ['C001280', 'elektrode-za-varenje'],
  ['C001401', 'elektrode-za-varenje-sportski-podovi'],
  ['C001403', 'elektode-za-varenje-termoplasticnih-podova-koji-nisu-od-pvc-a'],
].map(([collectionId, guessSlug], index) => ({
  key: `pribor-${collectionId.toLowerCase()}-${guessSlug}`,
  collectionId,
  guessSlug,
  id: String(ID_BASE + index),
  url: `https://www.tarkett.rs/sr_RS/kolekcija-${collectionId}-${guessSlug}`,
}));

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

// Playwright: učitaj kolekcijsku stranicu i vrati __NUXT__ objekat (identično grass/lajsne skripti).
async function fetchNuxt(browser, url) {
  const page = await browser.newPage({ userAgent: core.BROWSER_HEADERS['User-Agent'] });
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    const finalUrl = page.url();
    const nuxt = await page.evaluate(() => {
      let n = window.__NUXT__;
      if (typeof n === 'function') { try { n = n(); } catch (_) { n = null; } }
      if (!n) return null;
      try { return JSON.parse(JSON.stringify(n)); } catch (_) { return null; }
    });
    return { nuxt, finalUrl, status: response ? response.status() : 0 };
  } finally {
    await page.close();
  }
}

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

function collectionImageUrls(item) {
  const urls = [];
  if (item.collection_picture) urls.push(parse.mediaImageUrl(item.collection_picture));
  for (const g of parse.galleryImagesFromAssets(item)) {
    if (!urls.includes(g)) urls.push(g);
  }
  if (urls.length === 0 && item.designs?.[0]?.product_thumbnail) {
    urls.push(parse.mediaImageUrl(item.designs[0].product_thumbnail));
  }
  return urls;
}

// Pribor specs: zadrži SVE dostupne karakteristike (graciozni fallback), uz garantovan 'Kolekcija'.
function priborSpecs(item, designSpecs) {
  const specs = {};
  specs['Brend'] = 'Tarkett';
  specs['Kolekcija'] = item.collection_name;
  if (designSpecs) {
    const sr = parse.toSerbianCharacteristics(designSpecs);
    for (const [k, v] of Object.entries(sr)) {
      if (!(k in specs)) specs[k] = v;
    }
  }
  return specs;
}

async function ingestPriborCollection(supabase, manifest, args, col, item) {
  const designs = item.designs || [];
  const description = parse.stripHtml(item.description) || parse.stripHtml(item.short_description);
  const shortDescription = parse.stripHtml(item.short_description) || description;
  const realSlug = item.collection_name_slug || col.guessSlug;
  // Sudar slug-a (dve „hladno-varenje" kolekcije): dodaj C-kod sufiks da sku/slug ostanu jedinstveni.
  const slug = `tarkett-${realSlug}`;
  const sku = `${SKU_PREFIX}${realSlug}`;

  const firstSpecs = await fetchDesignSpecs(designs[0]?.productDataUrl).catch(() => null);
  const specs = priborSpecs(item, firstSpecs && firstSpecs.rawSpecs);

  const assetDocs = parse.collectionDocsFromAssets(item);
  const documents = args.dryRun
    ? assetDocs.map((d) => ({ title: d.title, url: d.sourceUrl, type: 'pdf' }))
    : await ingestDocuments(supabase, manifest, slug, assetDocs);

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
          // Pribor/accessory slike često 403 na XXL (Akamai), ali rade na 'large'/'medium'.
          // Probaj XXL pa fallback na manje rezolucije pre nego što odustaneš.
          let buf;
          for (const candidate of [src, src.replace('/XXL/', '/large/'), src.replace('/XXL/', '/medium/')]) {
            try { buf = await core.downloadAsset(candidate); break; } catch (e) { /* probaj sledeću velicinu */ }
          }
          if (!buf) throw new Error('sve velicine slike nedostupne (XXL/large/medium)');
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
    priceUnit: 'kom',
    description,
    shortDescription,
    specs,
    images,
    documents,
  };
}

function upsertProduct(list, record) {
  const filtered = list.filter((p) => p.sku !== record.sku);
  filtered.push(record);
  return filtered;
}

(async () => {
  const args = parseArgs();
  const manifest = core.loadManifest('ingest-pribor-tarkett');
  const supabase = args.dryRun ? null : core.getSupabase();
  const targets = PRIBOR_COLLECTIONS.filter((c) => args.keys.length === 0 || args.keys.includes(c.key));
  console.log(`🎯 Tarkett pribor kolekcija za obradu: ${targets.length}${args.dryRun ? ' (DRY-RUN — bez mrežnih upisa)' : ''}`);
  if (args.dryRun) {
    console.log(`📋 ${targets.length} Tarkett pribor kolekcija (real slug iz all_kolekcije.txt):`);
    for (const c of targets) console.log(`   • ${c.collectionId}  ${c.guessSlug}  → sku=${SKU_PREFIX}${c.guessSlug} slug=tarkett-${c.guessSlug}  ${c.url}`);
    console.log('   (stvarni slug/sku se finalizuje iz NUXT collection_name_slug posle fetch-a; redirect/dead kolekcije se loguju i preskaču)');
  }

  const browser = await chromium.launch({ headless: true });
  const summary = [];
  const dead = [];
  let priborList = null;

  try {
    for (const col of targets) {
      try {
        if (args.skipExisting && !args.dryRun && manifest.get(`collection:${col.key}`)?.status === 'ok') {
          console.log(`\n⏭️  ${col.key}: već ingestovano (manifest ok) — preskačem`);
          summary.push({ key: col.key, skipped: true });
          continue;
        }
        console.log(`\n📂 ${col.key}`);
        if (args.dryRun) {
          // Bez mreže u dry-run-u: prijavi samo nameru (resolve provera je deo realnog ingesta).
          summary.push({ key: col.key, sku: `${SKU_PREFIX}${col.guessSlug}`, slug: `tarkett-${col.guessSlug}`, dryRun: true });
          continue;
        }
        const { nuxt, finalUrl, status } = await fetchNuxt(browser, col.url);
        const item = parse.extractCollectionItem(nuxt);
        // Mrtva/preusmerena kolekcija: nema item-a ili je URL pao na kategoriju (S5 obrazac).
        if (!item || !item.collection_name) {
          console.log(`   ⚰️  redirect/dead (status=${status}, finalUrl=${finalUrl}) — preskačem`);
          dead.push({ key: col.key, collectionId: col.collectionId, finalUrl, status });
          manifest.record(`collection:${col.key}`, { status: 'dead', finalUrl });
          if (!args.dryRun) manifest.save();
          continue;
        }
        const realSlug = item.collection_name_slug || col.guessSlug;
        console.log(`   kolekcija="${item.collection_name}" slug=${realSlug} dizajna=${(item.designs || []).length}`);

        const record = await ingestPriborCollection(supabase, manifest, args, col, item);
        // Garantuj jedinstven sku/slug ako se realSlug sudari sa već obrađenom kolekcijom.
        priborList = priborList || (fs.existsSync(PRIBOR_JSON) ? JSON.parse(fs.readFileSync(PRIBOR_JSON, 'utf8')) : []);
        if (priborList.some((p) => p.sku === record.sku && p.id !== record.id)) {
          record.sku = `${record.sku}-${col.collectionId.toLowerCase()}`;
          record.slug = `${record.slug}-${col.collectionId.toLowerCase()}`;
          console.log(`   ↻ slug sudar — jedinstveni sku=${record.sku}`);
        }
        console.log(`   → sku=${record.sku} slug=${record.slug} slika:${record.images.length} dok:${record.documents.length} specs:${Object.keys(record.specs).length}`);

        priborList = upsertProduct(priborList, record);
        summary.push({
          key: col.key, sku: record.sku, slug: record.slug, name: record.name,
          images: record.images.length, docs: record.documents.length,
        });
        manifest.record(`collection:${col.key}`, { status: 'ok', sku: record.sku });
        manifest.save();
      } catch (err) {
        console.log(`⚠️ ${col.key}: ${err.message} — preskačem kolekciju`);
        manifest.record(`collection:${col.key}`, { status: 'error', error: err.message });
        if (!args.dryRun) manifest.save();
      }
    }
  } finally {
    await browser.close();
  }

  if (!args.dryRun && priborList) {
    core.writeJsonWithBackup(PRIBOR_JSON, priborList, 'pribor-products');
    manifest.save();
  }

  console.log('\n===== REZIME (Tarkett pribor) =====');
  for (const row of summary) console.log(JSON.stringify(row));
  if (dead.length) {
    console.log(`\n⚰️  REDIRECT/DEAD (${dead.length}):`);
    for (const d of dead) console.log(JSON.stringify(d));
  }
})().catch((err) => { console.error('❌', err); process.exit(1); });
