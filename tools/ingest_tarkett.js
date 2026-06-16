const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { chromium } = require('playwright');
const core = require('./lib/ingest-core.js');
const parse = require('./lib/tarkett-parse.js');

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const LVT_JSON = path.join(DATA_DIR, 'tarkett_lvt_products.json');
const DEFAULT_HOMO_TARGET = 'tarkett_homogeneous_vinyl_colors.json';
const SWATCH_CONCURRENCY = 8;     // worker-pool za per-boja petlju (mrežno-vezano: download+upload)
const SWATCH_TIMEOUT_MS = 120000; // tvrdi per-boja plafon (zastao socket može proći interne timeout-e)
const IMAGES_BUCKET = 'product-images';
const DOCS_BUCKET = 'product-documents';
const MIN_SWATCH_WIDTH = 800; // XXL je 1920; štiti od poluzanih/placeholder slika

function dataJsonPath(name) { return path.join(DATA_DIR, String(name || DEFAULT_HOMO_TARGET)); }

// 24 Tarkett linoleum (xf²) kolekcije (verbatim iz tmp/s7-linoleum-recon.md / output/*.json dump-ova).
// Oblik je identičan homogenom vinilu (hex popunjen, slug design_key) → kind:'homogeneous'.
// LinoWall (C000833) je ZIDNA OBLOGA, ne pod → isključeno iz floor liste (recon §2/§5). Ostaje 23.
const LINOLEUM_COLLECTIONS = [
  ['C000834', 'originale-essenza-2-5-mm'],
  ['C000342', 'veneto-xf2-2-5-mm'],
  ['C000060', 'etrusco-xf2-2-5-mm'],
  ['C000845', 'etrusco-xf2-bfl-2-5-mm'],
  ['C002561', 'linomarine'],
  ['C002231', 'originale-silencio-xf2-19db-3-8mm'],
  ['C002230', 'originale-xf2-2-5mm'],
  ['C002232', 'originale-xf2-bfl-2-5mm'],
  ['C000276', 'style-elle-silencio-xf2-19db-3-8mm'],
  ['C000277', 'style-elle-xf2-2-5-mm'],
  ['C000847', 'style-elle-xf2-bfl-2-5-mm'],
  ['C000279', 'style-emme-silencio-xf2-19-db'],
  ['C000280', 'style-emme-xf2-2-5-mm'],
  ['C000846', 'style-emme-xf2-bfl-2-5-mm'],
  ['C000848', 'trentino-xf2-2-5-mm'],
  ['C000850', 'trentino-xf2-bfl-2-5-mm'],
  ['C000336', 'veneto-acoustic-cork-xf2-15-db-4-4-mm'],
  ['C000338', 'veneto-essenza-2-5-mm'],
  ['C000339', 'veneto-sicuro-xf2-r10-2-5mm'],
  ['C000340', 'veneto-silencio-xf2-19db-3-8mm'],
  ['C000341', 'veneto-xf2-2-0-mm'],
  ['C000343', 'veneto-xf2-3-2-mm'],
  ['C000344', 'veneto-xf2-bfl-2-5-mm'],
].map(([collectionId, slug]) => ({
  key: `linoleum-${slug}`,
  kind: 'homogeneous',
  collectionId,
  slug: `tarkett-${slug}`,
  categorySlug: 'linoleum',
  categoryId: '7',
  targetJson: 'tarkett_linoleum_colors.json',
  url: `https://www.tarkett.rs/sr_RS/kolekcija-${collectionId}-${slug}`,
}));

// S5 — Tarkett protivklizni / sigurnosni vinil (tarkett.rs kategorija rs_C01005-protivklizni-podovi).
// Oblik je IDENTIČAN homogenom vinilu (iq-motion) — potvrđeno: per-dizajn JSON nosi
// slip_resistance_din_51130 = "R10"/"R11"; designs[] sa product_hex_color_code/product_thumbnail.
// → kind:'homogeneous', categorySlug:'vinil', categoryId:'2', protivklizno:true.
// Pišu u DEFAULT_HOMO_TARGET (tarkett_homogeneous_vinyl_colors.json) uz iQ Motion.
// Stvarni protivklizni opseg na tarkett.rs = kolekcije koje JOŠ postoje (imaju __NUXT__ payload).
// Provereno DOM-scrape-om kategorije `kategorija-rs_C01005-protivklizni-podovi` + per-kolekcija
// ekstrakcijom (2026-06-16): dekorativni Safetred Design/Ion/Spectrum/Transport/Aqua/Rail opseg
// je DISKONTINUISAN na srpskom sajtu (stari C-ID-evi iz all_kolekcije.txt sad redirektuju na
// kategoriju → nema podataka). Ostaje 6 realnih homogenih safety kolekcija; dekorativnu
// raznolikost daje Gerflor Tarasafe (7 kol). Vidi docs/.../runbooks S5.
const TARKETT_SAFETY_COLLECTIONS = [
  ['C000226', 'safetred-universal'],
  ['C000227', 'safetred-universal-r11'],
  ['C000096', 'granit-safe-t'],
  ['C000095', 'granit-multisafe'],
  ['C000159', 'multisafe-aqua'],
  ['C000180', 'primo-safe-t'],
].map(([collectionId, slug]) => ({
  key: `safety-${slug}`,
  kind: 'homogeneous',
  collectionId,
  slug: `tarkett-${slug}`,
  categorySlug: 'vinil',
  categoryId: '2',
  protivklizno: true,
  url: `https://www.tarkett.rs/sr_RS/kolekcija-${collectionId}-${slug}`,
}));

// Konfiguracija 4 nove kolekcije (verbatim iz upstream izviđanja 2026-06-13).
const COLLECTIONS = [
  { key: 'iq-motion',    kind: 'homogeneous', collectionId: 'C003138', slug: 'tarkett-iq-motion', categorySlug: 'vinil',
    url: 'https://www.tarkett.rs/sr_RS/kolekcija-C003138-iq-motion' },
  { key: 'deal-spc-30',  kind: 'lvt', type: 'SPC', collectionId: 'C003170', slug: 'deal-spc-30', categorySlug: 'lvt',
    url: 'https://www.tarkett.rs/sr_RS/kolekcija-C003170-deal-spc-30' },
  { key: 'real-spc-50',  kind: 'lvt', type: 'SPC', collectionId: 'C003193', slug: 'real-spc-50', categorySlug: 'lvt',
    url: 'https://www.tarkett.rs/sr_RS/kolekcija-C003193-real-spc-50' },
  { key: 'modulart-70',  kind: 'lvt', type: 'LVT', collectionId: 'C003148', slug: 'modulart-70', categorySlug: 'lvt',
    url: 'https://www.tarkett.rs/sr_RS/kolekcija-C003148-modulart-70' },
  ...LINOLEUM_COLLECTIONS,
  ...TARKETT_SAFETY_COLLECTIONS,
];

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

// Playwright: učitaj kolekcijsku stranicu i vrati __NUXT__ objekat.
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

// Per-dizajn JSON (pune specifikacije). Vraća sku_technical_caracteristics + osnovni meta.
async function fetchDesignSpecs(productDataUrl) {
  const text = await core.fetchPage(abs(productDataUrl));
  let j;
  try { j = JSON.parse(text); } catch (_) { return null; }
  const sku = j?.item?.product_collection?.collection_default_sku;
  return {
    rawSpecs: sku?.sku_technical_caracteristics || {},
    sapSku: sku?.sku_sap_number || j?.item?.product_collection?.collection_default_sku?.sku_id || null,
  };
}

async function uploadSwatch(supabase, storagePath, buffer, label) {
  const meta = await core.withTimeout(sharp(buffer).metadata(), 20000, `sharp ${label}`);
  if (!meta.width || meta.width < MIN_SWATCH_WIDTH) {
    throw new Error(`${label}: slika ${meta.width || '?'}px < ${MIN_SWATCH_WIDTH}px`);
  }
  return core.uploadToBucket(supabase, IMAGES_BUCKET, storagePath, buffer);
}

// Skini + uploaduj kolekcione dokumente (PDF). Vrati [{title,url,type}] sa Supabase URL-ovima.
async function ingestDocuments(supabase, manifest, col, docs) {
  const out = [];
  for (const doc of docs) {
    const mKey = `doc:${doc.sourceUrl}`;
    if (manifest.has(mKey)) { out.push({ title: doc.title, url: manifest.get(mKey).publicUrl, type: 'pdf' }); continue; }
    try {
      const buffer = await core.downloadAsset(doc.sourceUrl);
      if (!buffer.slice(0, 5).toString().startsWith('%PDF')) throw new Error('nije PDF');
      // Ime fajla iz izvornog basename-a (jedinstveno). Dva dokumenta sa istim srpskim
      // naslovom (npr. dva "Uputstvo za instalaciju": standard + riblja kost kod Real SPC 50)
      // NE smeju u istu putanju — inače se drugi prepisuje i parser dedupe-po-URL-u je uzaludan.
      const srcBase = (doc.sourceUrl.split('/').pop() || 'dokument').replace(/\.pdf$/i, '');
      const fileName = `${core.slugify(srcBase)}.pdf`;
      const publicUrl = await core.uploadToBucket(supabase, DOCS_BUCKET, `products/${col.categorySlug}/${col.slug}/${fileName}`, buffer);
      out.push({ title: doc.title, url: publicUrl, type: 'pdf' });
      manifest.record(mKey, { publicUrl, collection: col.slug });
    } catch (err) {
      console.log(`   ⚠️ dokument "${doc.title}": ${err.message}`);
    }
  }
  return out;
}

// Skini + uploaduj ambijent (hero/gallery) slike. Vrati niz Supabase URL-ova.
async function ingestGallery(supabase, manifest, col, imageUrls) {
  const out = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const mKey = `scene:${imageUrls[i]}`;
    if (manifest.has(mKey)) { out.push(manifest.get(mKey).publicUrl); continue; }
    try {
      const buffer = await core.downloadAsset(imageUrls[i]);
      const publicUrl = await uploadSwatch(supabase, `products/${col.categorySlug}/${col.slug}/ambience/scena-${i + 1}.jpg`, buffer, `${col.slug} scena ${i + 1}`);
      out.push(publicUrl);
      manifest.record(mKey, { publicUrl, collection: col.slug });
    } catch (err) {
      console.log(`   ⚠️ scena ${i + 1}: ${err.message}`);
    }
  }
  return out;
}

// Skini + uploaduj swatch sliku boje (XXL). Vrati Supabase URL ili null.
async function ingestSwatch(supabase, manifest, col, design, fileBase, label) {
  const srcUrl = parse.mediaImageUrl(design.product_thumbnail);
  const mKey = `swatch:${srcUrl}`;
  if (manifest.has(mKey)) return manifest.get(mKey).publicUrl;
  const buffer = await core.downloadAsset(srcUrl);
  const publicUrl = await uploadSwatch(supabase, `products/${col.categorySlug}/${col.slug}/decor/${fileBase}.jpg`, buffer, label);
  manifest.record(mKey, { publicUrl, collection: col.slug });
  return publicUrl;
}

async function ingestHomogeneous(supabase, manifest, args, col, item) {
  const designs = item.designs || [];
  const description = parse.stripHtml(item.description);
  const shortDescription = parse.stripHtml(item.short_description) || description;

  // Kolekcione karakteristike iz per-dizajn JSON-a (prvog dizajna).
  let characteristics = {};
  const firstSpecs = await fetchDesignSpecs(designs[0]?.productDataUrl).catch(() => null);
  if (firstSpecs) characteristics = parse.toSerbianCharacteristics(firstSpecs.rawSpecs);

  // S5 — sigurnosne (protivklizne) kolekcije nose eksplicitnu "Protivklizno": "Da" karakteristiku.
  // productDataLoader.buildSpecsFromCharacteristicRecord onda automatski proizvede spec
  // { key:'protivklizno', value:'Da' } na kolekcijskom headeru, a CategoryTabs gradi isti spec
  // iz svake boje (color.characteristics). Filter ?safety=1 bira po tom specu — kao "type" filter.
  if (col.protivklizno) characteristics['Protivklizno'] = 'Da';

  const documents = args.dryRun ? parse.collectionDocsFromAssets(item)
    : await ingestDocuments(supabase, manifest, col, parse.collectionDocsFromAssets(item));
  const galleryUrls = args.dryRun ? parse.galleryImagesFromAssets(item)
    : await ingestGallery(supabase, manifest, col, parse.galleryImagesFromAssets(item));

  // Per-boja petlja paralelizovana worker-pool-om (mrežno-vezano: download+upload swatch-a).
  // 511 boja sekvencijalno je presporo/rizično; svaki swatch ima tvrdi core.withTimeout plafon
  // jer zastao socket može da prođe interne ingest-core timeout-e i zamrzne ceo run.
  // Rezultati u pre-dimenzionisan niz po indeksu → redosled boja ostaje stabilan; svaki
  // promašaj swatch-a (dry-run nikad) ostavlja null pa se filtrira (boja se preskače).
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
      if (!args.dryRun) {
        try {
          image = await core.withTimeout(
            ingestSwatch(supabase, manifest, col, d, fileBase, `${col.slug}/${fileBase}`),
            SWATCH_TIMEOUT_MS,
            `swatch ${fileBase}`,
          );
        } catch (err) { console.log(`   ⚠️ swatch ${fileBase}: ${err.message} — preskačem boju`); continue; }
        if (++saved % 25 === 0) manifest.save();
      }
      const colorCharacteristics = parse.homogeneousColorCharacteristics(d);
      // S5 — propagiraj sigurnosni tag na nivo boje, da CategoryTabs (koji gradi specs iz
      // color.characteristics) izloži spec 'protivklizno' i na pojedinačnim bojama (Boje tab).
      if (col.protivklizno) colorCharacteristics['Protivklizno'] = 'Da';
      results[idx] = {
        code,
        name,
        slug: `${col.slug}-color-${code}-${core.slugify(name)}`,
        image,
        description,
        characteristics: colorCharacteristics,
        brandId: '3',
      };
    }
  }
  const poolSize = args.dryRun ? 1 : Math.min(SWATCH_CONCURRENCY, designs.length || 1);
  await Promise.all(Array.from({ length: poolSize }, () => swatchWorker()));
  const colors = results.filter(Boolean);

  return {
    name: item.collection_name,
    slug: col.slug,
    brandId: '3',
    url: col.url,
    colorCount: colors.length,
    // S5 — eksplicitni record-level flag (izvor istine za sigurnosne kolekcije).
    protivklizno: col.protivklizno || false,
    shortDescription,
    description,
    categoryDescription: shortDescription,
    characteristics,
    detailsSections: [{ title: 'Ključne karakteristike', items: parse.keyFeatureItems(item.key_features) }],
    documents,
    collection_image_url: galleryUrls[0] || (colors[0] && colors[0].image) || '',
    room_scene_images: galleryUrls.slice(1),
    colors,
  };
}

async function ingestLvt(supabase, manifest, args, col, item) {
  const designs = item.designs || [];
  const description = parse.stripHtml(item.description);

  const docUrls = args.dryRun
    ? parse.collectionDocsFromAssets(item).map((d) => d.sourceUrl)
    : (await ingestDocuments(supabase, manifest, col, parse.collectionDocsFromAssets(item))).map((d) => d.url);
  const galleryUrls = args.dryRun ? parse.galleryImagesFromAssets(item)
    : await ingestGallery(supabase, manifest, col, parse.galleryImagesFromAssets(item));

  const items = [];
  for (const d of designs) {
    const code = parse.colorCode(d);
    const name = parse.cleanColorName(d.product_name, item.collection_name);
    const fileBase = core.slugify(name);
    let swatch = parse.mediaImageUrl(d.product_thumbnail);
    let specs = {};
    const ds = await fetchDesignSpecs(d.productDataUrl).catch(() => null);
    if (ds) specs = { ...ds.rawSpecs };
    specs.collections = item.collection_name;
    specs['collections-b2b'] = col.collectionId;
    specs.sap_sku_number = (ds && ds.sapSku) || d.product_design_key;
    specs.name = d.product_name;
    if (!args.dryRun) {
      try {
        swatch = await ingestSwatch(supabase, manifest, col, d, fileBase, `${col.slug}/${fileBase}`);
      } catch (err) { console.log(`   ⚠️ swatch ${fileBase}: ${err.message} — preskačem stavku`); continue; }
    }
    items.push({
      id: `${col.slug}-${core.slugify(name)}`,
      name,
      collection: col.slug,
      description,
      type: col.type,
      category: 'lvt',
      images: [swatch, ...galleryUrls],
      specs,
      brandId: 'tarkett',
      meta: { sku: specs.sap_sku_number, originalUrl: abs(d.productUrl).replace(/^https:/, ''), documents: docUrls },
    });
  }
  return items;
}

(async () => {
  const args = parseArgs();
  const manifest = core.loadManifest('ingest-tarkett');
  const supabase = args.dryRun ? null : core.getSupabase();
  const targets = COLLECTIONS.filter((c) => args.keys.length === 0 || args.keys.includes(c.key));
  console.log(`🎯 Kolekcija za obradu: ${targets.length}${args.dryRun ? ' (DRY-RUN)' : ''}`);

  const browser = await chromium.launch({ headless: true });
  const summary = [];
  // Lazy-load ciljnih JSON-ova (samo kad nisu dry-run, da se ne piše ništa u dry-run).
  // homoDataByFile: ime ciljnog JSON-a (col.targetJson) → učitan {collections} objekat.
  // Vinil kolekcije idu u tarkett_homogeneous_vinyl_colors.json (default), linoleum u
  // tarkett_linoleum_colors.json — isti homogeni record oblik, različit fajl.
  const homoDataByFile = new Map();
  let lvtData = null;

  try {
    for (const col of targets) {
      try {
        // --skip-existing: preskoči kolekciju koja je već uspešno ingestovana (manifest ok).
        // Asset-level resume (doc:/scene:/swatch:) ionako preskače uploadovano; ovo dodatno
        // preskače i mrežni re-fetch __NUXT__/per-dizajn JSON-a za gotove kolekcije.
        if (args.skipExisting && !args.dryRun && manifest.get(`collection:${col.key}`)?.status === 'ok') {
          console.log(`\n⏭️  ${col.key}: već ingestovano (manifest ok) — preskačem (--skip-existing)`);
          summary.push({ key: col.key, kind: col.kind, skipped: true });
          continue;
        }
        console.log(`\n📂 ${col.key} (${col.kind})`);
        const nuxt = await fetchNuxt(browser, col.url);
        const item = parse.extractCollectionItem(nuxt);
        if (!item) throw new Error('__NUXT__ item nije pronađen');
        console.log(`   kolekcija="${item.collection_name}" boja=${(item.designs || []).length}`);

        if (col.kind === 'homogeneous') {
          const record = await ingestHomogeneous(supabase, manifest, args, col, item);
          console.log(`   → boja:${record.colors.length} dok:${record.documents.length} ambijent:${record.room_scene_images.length + (record.collection_image_url ? 1 : 0)}`);
          if (!args.dryRun) {
            const targetName = col.targetJson || DEFAULT_HOMO_TARGET;
            let homoData = homoDataByFile.get(targetName);
            if (!homoData) {
              homoData = JSON.parse(fs.readFileSync(dataJsonPath(targetName), 'utf8'));
              homoDataByFile.set(targetName, homoData);
            }
            homoData.collections = homoData.collections.filter((c) => c.slug !== record.slug);
            homoData.collections.push(record);
          }
          summary.push({ key: col.key, kind: col.kind, colors: record.colors.length, docs: record.documents.length, protivklizno: record.protivklizno });
        } else {
          const items = await ingestLvt(supabase, manifest, args, col, item);
          console.log(`   → stavki:${items.length} (type=${col.type})`);
          if (!args.dryRun) {
            lvtData = lvtData || JSON.parse(fs.readFileSync(LVT_JSON, 'utf8'));
            lvtData = lvtData.filter((p) => p.collection !== col.slug);
            lvtData.push(...items);
          }
          summary.push({ key: col.key, kind: col.kind, items: items.length });
        }
        manifest.record(`collection:${col.key}`, { status: 'ok' });
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
    for (const [targetName, homoData] of homoDataByFile) {
      homoData.generatedAt = new Date().toISOString();
      core.writeJsonWithBackup(
        dataJsonPath(targetName),
        homoData,
        `tarkett-${targetName.replace(/\.json$/, '').replace(/_/g, '-')}`,
      );
    }
    if (lvtData) {
      core.writeJsonWithBackup(LVT_JSON, lvtData, 'tarkett-lvt-products');
    }
    manifest.save();
  }

  console.log('\n===== REZIME =====');
  for (const row of summary) console.log(JSON.stringify(row));
})().catch((err) => { console.error('❌', err); process.exit(1); });
