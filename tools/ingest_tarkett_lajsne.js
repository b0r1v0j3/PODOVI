const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { chromium } = require('playwright');
const core = require('./lib/ingest-core.js');
const parse = require('./lib/tarkett-parse.js');

// S9 — Tarkett „Završne i prelazne lajsne" (tarkett.rs kategorija rs_C01034).
// 18 kolekcija idu u POSTOJEĆU kategoriju „Lajsne" (id 11) pod POSTOJEĆI Tarkett brend (id 3).
// Pišu u public/data/tarkett_lajsne_variants.json .collections[] (idempotentni upsert po slug-u),
// u ISTOM obliku kao 12 postojećih kolekcija — pa getTarkettLajsneCollections() (loader) i
// prepare-colors.ts cat-11 grana surface-uju nove kolekcije BEZ izmena.
//
// Oblik kolekcijskog zapisa (verbatim iz postojećeg tarkett_lajsne_variants.json):
//   { name, slug:`tarkett-<collection_name_slug>`, brandId:'3', url, colorCount,
//     shortDescription, description, categoryDescription, characteristics{...,'Tip proizvoda'},
//     documents:[{title,url,type:'pdf'}], detailsSections:[{title,items[]}],
//     collection_image_url, colors:[{code,name,slug,image,description,characteristics{},documents:[],brandId:'3'}] }
//
// Razlika prema homogenom vinilu (ingest_tarkett.js ingestHomogeneous): lajsne su
// KOLEKCIJSKI-NIVO entiteti (cena/info red) — characteristics + colorCount + documents
// nose težinu; colors[] može biti prazan (kolekcija bez per-boja swatch-eva i dalje listuje).
// HEX je obično null kod lajsni, pa boje nose 'Dizajn'/'Tip dezena' iz per-dizajn specs umesto HEX.

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const LAJSNE_JSON = path.join(DATA_DIR, 'tarkett_lajsne_variants.json');
const TAXONOMY_JSON = path.join(DATA_DIR, 'catalog_listing_taxonomy.json');
const IMAGES_BUCKET = 'product-images';
const CATEGORY_SLUG = 'lajsne';
const SWATCH_CONCURRENCY = 8;     // worker-pool za per-boja petlju (download+upload)
const SWATCH_TIMEOUT_MS = 120000; // tvrdi per-boja plafon (zastao socket → ne zamrzni run)
const MIN_SWATCH_WIDTH = 400;     // lajsne swatch-evi su manji od podnih (800px); 400 štiti od placeholdera

// Zajednička kategorijska napomena (verbatim iz postojećih lajsne zapisa) — categoryDescription.
const CATEGORY_DESCRIPTION =
  'Da biste vašem podu dali savršen završni dodatak, odaberite iz našeg asortimana Tarkett lajsni i pratećeg pribora. U ponudi su dekorativne i furnirane lajsne, sportske lajsne, MDF rešenja i kompatibilni dodaci za različite podne sisteme.';

// 18 kolekcija „Završne i prelazne lajsne" (rs_C01034). Slug je SAMO pretpostavka iz izviđanja —
// STVARNI slug se izvodi iz NUXT `collection_name_slug` posle fetch-a (URL se gradi robustno
// preko `kolekcija-<ID>-x` jer ruter na tarkett.rs vodi po ID-u, ne po slug repu). Borderline
// kolekcije (taktilne trake, anti-static, reparacija) nose accessory:true → tag u taksonomiji.
const LAJSNE_COLLECTIONS = [
  ['C000002', 'dva-u-jedan-holker-i-zavrsna-lajsna'],
  ['C001511', 'fleksibilne-zavrsne-lajsne'],
  ['C001468', 'lajsne-za-stepenice'],
  ['C001512', 'metalni-profili'],
  ['C000234', 'polusavitljive-zidne-lajsne'],
  ['C001528', 'reparacija-parketa', { accessory: true }],
  ['C001498', 'protectwall-set-on-uglovi'],
  ['C001286', 'prsten-za-cevi'],
  ['C000195', 'pvc-holkeri'],
  ['C000192', 'pvc-lajsne'],
  ['C000204', 'pvc-lajsne-za-stepenice'],
  ['C001480', 'pvc-profili'],
  ['C000210', 'rigid-decorative-set-on-lajsne'],
  ['C000285', 'taktilne-trake-za-slabovide', { accessory: true }],
  ['C001438', 'taktilne-trake-za-upozorenje', { accessory: true }],
  ['C001484', 'trake-za-kontrolu-statickog-elektriciteta', { accessory: true }],
  ['C001997', 'ugao-za-ciste-sobe'],
  ['C000211', 'zidne-lajsne'],
].map(([collectionId, guessSlug, opts]) => ({
  key: `lajsne-${guessSlug}`,
  collectionId,
  guessSlug,
  accessory: Boolean(opts && opts.accessory),
  // URL po ID-u; slug rep je nebitan za ruter (potvrđeno izviđanjem). Stvarni slug iz NUXT-a.
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

// Playwright: učitaj kolekcijsku stranicu i vrati __NUXT__ objekat (identično ingest_tarkett.js).
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

// Per-dizajn JSON (pune specifikacije). Vraća sku_technical_caracteristics (za srpske karakteristike).
async function fetchDesignSpecs(productDataUrl) {
  if (!productDataUrl) return null;
  const text = await core.fetchPage(abs(productDataUrl));
  let j;
  try { j = JSON.parse(text); } catch (_) { return null; }
  const sku = j?.item?.product_collection?.collection_default_sku;
  return { rawSpecs: sku?.sku_technical_caracteristics || {} };
}

async function uploadSwatch(supabase, storagePath, buffer, label) {
  const meta = await core.withTimeout(sharp(buffer).metadata(), 20000, `sharp ${label}`);
  if (!meta.width || meta.width < MIN_SWATCH_WIDTH) {
    throw new Error(`${label}: slika ${meta.width || '?'}px < ${MIN_SWATCH_WIDTH}px`);
  }
  return core.uploadToBucket(supabase, IMAGES_BUCKET, storagePath, buffer);
}

// Skini + uploaduj kolekcione dokumente (PDF) u product-documents bucket — BEZ hotlinkova.
// Vrati [{title,url,type:'pdf'}] sa Supabase URL-ovima (ogledalo ingest_tarkett.js ingestDocuments).
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
        supabase, 'product-documents', `products/${CATEGORY_SLUG}/${slug}/${fileName}`, buffer);
      out.push({ title: doc.title, url: publicUrl, type: 'pdf' });
      manifest.record(mKey, { publicUrl, collection: slug });
    } catch (err) {
      console.log(`   ⚠️ dokument "${doc.title}": ${err.message}`);
    }
  }
  return out;
}

// Portal PDF-ovi (tarkett.rs „specifications" + „format-table") — dinamički generisani na
// tarkett.rs (NISU media.tarkett-image.com hotlink), mirroring postojećih lajsne zapisa.
function portalDocs(item, col) {
  const out = [];
  const specUrl = item.specifications_pdf_url
    || `https://www.tarkett.rs/sr_RS/pdf/collection-${col.collectionId}-${item.collection_name_slug}/specifications`;
  const fmtUrl = item.format_table_pdf_url
    || `https://www.tarkett.rs/sr_RS/pdf/collection-${col.collectionId}-${item.collection_name_slug}/format-table`;
  out.push({ title: 'Tehnički list', url: abs(specUrl), type: 'pdf' });
  out.push({ title: 'Tabela formata', url: abs(fmtUrl), type: 'pdf' });
  return out;
}

// Hero/cover slika kolekcije. Prvo collection_picture, pa COVER iz collection_assets.
function collectionHeroUrl(item) {
  if (item.collection_picture) return parse.mediaImageUrl(item.collection_picture);
  const gallery = parse.galleryImagesFromAssets(item);
  return gallery[0] || '';
}

// Per-boja karakteristike za lajsnu. HEX je obično null kod lajsni → koristimo
// dizajn/dezen + porodicu boja iz per-dizajn specs; HEX/NCS/LRV samo ako postoje.
function lajsnaColorCharacteristics(design, designSpecs) {
  const out = {};
  const hex = String(design.product_hex_color_code || '').trim();
  const ncs = String(design.product_ncs_color_code || '').trim();
  const lrv = String(design.product_light_reflectance_value ?? '').trim();
  const family = String(design.product_color_families?.[0]?.label || design.product_color_families?.[0]?.code || '').trim();
  if (designSpecs) {
    const sr = parse.toSerbianCharacteristics(designSpecs);
    // Zadrži samo „opisne" ključeve relevantne za pojedinačnu lajsnu (dezen/profil/format/dim).
    for (const k of ['Dizajn', 'Tip dezena', 'Profil', 'Format', 'Ukupna debljina', 'Visina', 'Dužina',
      'Širina', 'Komada u pakovanju', 'Dužina po pakovanju', 'Kutija na paleti', 'Može da se seče']) {
      if (sr[k]) out[k] = sr[k];
    }
  }
  if (hex) out['HEX boja'] = hex;
  if (ncs) out['NCS oznaka'] = ncs;
  if (lrv) out['LRV'] = lrv;
  if (family) out['Porodica boje'] = family;
  out['Šifra dekora'] = parse.colorCode(design);
  return out;
}

async function ingestLajsneCollection(supabase, manifest, args, col, item) {
  const designs = item.designs || [];
  const description = parse.stripHtml(item.description) || parse.stripHtml(item.short_description);
  const shortDescription = parse.stripHtml(item.short_description) || description;
  const slug = `tarkett-${item.collection_name_slug || col.guessSlug}`;

  // Kolekcione karakteristike iz per-dizajn JSON-a (prvog dizajna) — uvek uključi 'Tip proizvoda'.
  let characteristics = {};
  const firstSpecs = await fetchDesignSpecs(designs[0]?.productDataUrl).catch(() => null);
  if (firstSpecs) characteristics = parse.toSerbianCharacteristics(firstSpecs.rawSpecs);
  // Garantuj 'Tip proizvoda' ključ (loader ga čita za `type` spec). Fallback: accessory/Wall base.
  if (!characteristics['Tip proizvoda']) {
    characteristics['Tip proizvoda'] = col.accessory ? 'Accessory' : 'Wall base';
  }

  // Dokumenti: realni collection_assets PDF-ovi → Supabase (BEZ hotlinka) + portal PDF-ovi.
  const assetDocs = parse.collectionDocsFromAssets(item);
  const uploadedDocs = args.dryRun
    ? assetDocs.map((d) => ({ title: d.title, url: d.sourceUrl, type: 'pdf' }))
    : await ingestDocuments(supabase, manifest, slug, assetDocs);
  const documents = [...uploadedDocs, ...portalDocs(item, col)];

  // Hero slika kolekcije.
  let collection_image_url = '';
  const heroSrc = collectionHeroUrl(item);
  if (heroSrc) {
    if (args.dryRun) {
      collection_image_url = heroSrc;
    } else {
      try {
        const buf = await core.downloadAsset(heroSrc);
        collection_image_url = await uploadSwatch(
          supabase, `products/${CATEGORY_SLUG}/${slug}/collection.jpg`, buf, `${slug} hero`);
      } catch (err) { console.log(`   ⚠️ hero: ${err.message}`); }
    }
  }

  // Per-boja petlja (worker-pool). Lajsne često imaju HEX=null i mali/nepostojeći swatch — promašaj
  // swatch-a ostavlja null pa se boja preskače; kolekcija i dalje listuje sa colorCount=preživele.
  const results = new Array(designs.length).fill(null);
  let cursor = 0;
  let saved = 0;
  async function swatchWorker() {
    while (cursor < designs.length) {
      const idx = cursor++;
      const d = designs[idx];
      const code = parse.colorCode(d);
      const name = parse.cleanColorName(d.product_name, item.collection_name);
      const fileBase = `${code}-${core.slugify(name)}`;
      let image = parse.mediaImageUrl(d.product_thumbnail);
      // Per-boja specs (za dizajn/dezen/dim) — best-effort.
      const ds = await fetchDesignSpecs(d.productDataUrl).catch(() => null);
      if (!args.dryRun && d.product_thumbnail) {
        try {
          image = await core.withTimeout((async () => {
            const buf = await core.downloadAsset(parse.mediaImageUrl(d.product_thumbnail));
            return uploadSwatch(supabase, `products/${CATEGORY_SLUG}/${slug}/${fileBase}.jpg`, buf, `${slug}/${fileBase}`);
          })(), SWATCH_TIMEOUT_MS, `swatch ${fileBase}`);
        } catch (err) { console.log(`   ⚠️ swatch ${fileBase}: ${err.message} — preskačem boju`); continue; }
        if (++saved % 25 === 0) manifest.save();
      }
      results[idx] = {
        code,
        name,
        slug: `${slug}-color-${code}-${core.slugify(name)}`,
        image,
        description,
        characteristics: lajsnaColorCharacteristics(d, ds && ds.rawSpecs),
        documents: [],
        brandId: '3',
      };
    }
  }
  const poolSize = args.dryRun ? 1 : Math.min(SWATCH_CONCURRENCY, designs.length || 1);
  await Promise.all(Array.from({ length: poolSize }, () => swatchWorker()));
  const colors = results.filter(Boolean);

  return {
    name: item.collection_name,
    slug,
    brandId: '3',
    url: col.url,
    colorCount: colors.length,
    shortDescription,
    description,
    categoryDescription: CATEGORY_DESCRIPTION,
    characteristics,
    documents,
    detailsSections: [{ title: 'Ključne karakteristike', items: parse.keyFeatureItems(item.key_features) }],
    collection_image_url,
    colors,
  };
}

// Idempotentno upiši/zameni kolekciju u tarkett_lajsne_variants.json (po slug-u).
function upsertCollection(lajsneData, record) {
  if (!Array.isArray(lajsneData.collections)) lajsneData.collections = [];
  lajsneData.collections = lajsneData.collections.filter((c) => c.slug !== record.slug);
  lajsneData.collections.push(record);
}

// Tag-uj borderline (accessory) slug-ove u catalog_listing_taxonomy.json (mirror genius-traka/tarkodry).
function tagAccessorySlugs(slugs) {
  const tax = JSON.parse(fs.readFileSync(TAXONOMY_JSON, 'utf8'));
  const lajsne = tax.categories?.lajsne;
  if (!lajsne) throw new Error('catalog_listing_taxonomy.json: categories.lajsne nije pronađen');
  if (!Array.isArray(lajsne.accessoryCollectionSlugs)) lajsne.accessoryCollectionSlugs = [];
  let added = 0;
  for (const s of slugs) {
    if (!lajsne.accessoryCollectionSlugs.includes(s)) { lajsne.accessoryCollectionSlugs.push(s); added++; }
  }
  if (added > 0) fs.writeFileSync(TAXONOMY_JSON, JSON.stringify(tax, null, 2) + '\n', 'utf8');
  return added;
}

(async () => {
  const args = parseArgs();
  const manifest = core.loadManifest('ingest-tarkett-lajsne');
  const supabase = args.dryRun ? null : core.getSupabase();
  const targets = LAJSNE_COLLECTIONS.filter((c) => args.keys.length === 0 || args.keys.includes(c.key));
  console.log(`🎯 Lajsne kolekcija za obradu: ${targets.length}${args.dryRun ? ' (DRY-RUN — bez mrežnih upisa)' : ''}`);

  const browser = await chromium.launch({ headless: true });
  const summary = [];
  const accessoryTagged = [];
  let lajsneData = null;

  try {
    for (const col of targets) {
      try {
        if (args.skipExisting && !args.dryRun && manifest.get(`collection:${col.key}`)?.status === 'ok') {
          console.log(`\n⏭️  ${col.key}: već ingestovano (manifest ok) — preskačem`);
          summary.push({ key: col.key, skipped: true });
          continue;
        }
        console.log(`\n📂 ${col.key}${col.accessory ? ' [accessory]' : ''}`);
        const nuxt = await fetchNuxt(browser, col.url);
        const item = parse.extractCollectionItem(nuxt);
        if (!item) throw new Error('__NUXT__ item nije pronađen');
        const realSlug = item.collection_name_slug || col.guessSlug;
        console.log(`   kolekcija="${item.collection_name}" slug=${realSlug} boja=${(item.designs || []).length}`);

        const record = await ingestLajsneCollection(supabase, manifest, args, col, item);
        console.log(`   → slug=${record.slug} boja:${record.colors.length} dok:${record.documents.length} hero:${record.collection_image_url ? 'da' : 'ne'}`);

        if (col.accessory) accessoryTagged.push(record.slug);

        if (!args.dryRun) {
          lajsneData = lajsneData || JSON.parse(fs.readFileSync(LAJSNE_JSON, 'utf8'));
          upsertCollection(lajsneData, record);
        }
        summary.push({
          key: col.key, slug: record.slug, name: record.name,
          colorCount: record.colorCount, docs: record.documents.length, accessory: col.accessory,
        });
        manifest.record(`collection:${col.key}`, { status: 'ok', slug: record.slug });
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

  if (!args.dryRun) {
    if (lajsneData) {
      lajsneData.generatedAt = new Date().toISOString();
      core.writeJsonWithBackup(LAJSNE_JSON, lajsneData, 'tarkett-lajsne-variants');
    }
    if (accessoryTagged.length) {
      const added = tagAccessorySlugs(accessoryTagged);
      console.log(`🏷️  Accessory tagovano u taksonomiji: +${added} (${accessoryTagged.join(', ')})`);
    }
    manifest.save();
  } else if (accessoryTagged.length) {
    console.log(`🏷️  [DRY-RUN] Accessory slug-ovi za tag: ${accessoryTagged.join(', ')}`);
  }

  console.log('\n===== REZIME =====');
  for (const row of summary) console.log(JSON.stringify(row));
})().catch((err) => { console.error('❌', err); process.exit(1); });
