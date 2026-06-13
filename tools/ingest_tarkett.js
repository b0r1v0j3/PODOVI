const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { chromium } = require('playwright');
const core = require('./lib/ingest-core.js');
const parse = require('./lib/tarkett-parse.js');

const HOMO_JSON = path.join(process.cwd(), 'public', 'data', 'tarkett_homogeneous_vinyl_colors.json');
const LVT_JSON = path.join(process.cwd(), 'public', 'data', 'tarkett_lvt_products.json');
const IMAGES_BUCKET = 'product-images';
const DOCS_BUCKET = 'product-documents';
const MIN_SWATCH_WIDTH = 800; // XXL je 1920; štiti od poluzanih/placeholder slika

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

  const documents = args.dryRun ? parse.collectionDocsFromAssets(item)
    : await ingestDocuments(supabase, manifest, col, parse.collectionDocsFromAssets(item));
  const galleryUrls = args.dryRun ? parse.galleryImagesFromAssets(item)
    : await ingestGallery(supabase, manifest, col, parse.galleryImagesFromAssets(item));

  const colors = [];
  for (const d of designs) {
    const code = parse.colorCode(d);
    const name = parse.cleanColorName(d.product_name, item.collection_name);
    const fileBase = `${code}-${core.slugify(name)}`;
    let image = parse.mediaImageUrl(d.product_thumbnail);
    if (!args.dryRun) {
      try {
        image = await ingestSwatch(supabase, manifest, col, d, fileBase, `${col.slug}/${fileBase}`);
      } catch (err) { console.log(`   ⚠️ swatch ${fileBase}: ${err.message} — preskačem boju`); continue; }
    }
    colors.push({
      code,
      name,
      slug: `${col.slug}-color-${code}-${core.slugify(name)}`,
      image,
      description,
      characteristics: parse.homogeneousColorCharacteristics(d),
      brandId: '3',
    });
  }

  return {
    name: item.collection_name,
    slug: col.slug,
    brandId: '3',
    url: col.url,
    colorCount: colors.length,
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
  let homoData = null, lvtData = null;

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
            homoData = homoData || JSON.parse(fs.readFileSync(HOMO_JSON, 'utf8'));
            homoData.collections = homoData.collections.filter((c) => c.slug !== record.slug);
            homoData.collections.push(record);
          }
          summary.push({ key: col.key, kind: col.kind, colors: record.colors.length, docs: record.documents.length });
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
    if (homoData) {
      homoData.generatedAt = new Date().toISOString();
      core.writeJsonWithBackup(HOMO_JSON, homoData, 'tarkett-homogeneous-vinyl');
    }
    if (lvtData) {
      core.writeJsonWithBackup(LVT_JSON, lvtData, 'tarkett-lvt-products');
    }
    manifest.save();
  }

  console.log('\n===== REZIME =====');
  for (const row of summary) console.log(JSON.stringify(row));
})().catch((err) => { console.error('❌', err); process.exit(1); });
