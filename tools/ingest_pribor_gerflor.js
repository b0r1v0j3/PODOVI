const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const core = require('./lib/ingest-core.js');
const parse = require('./lib/gerflor-parse.js');

// S9 — Gerflor „Pribor" (šipke/elektrode za varenje, podloge, lepljiva traka) → NOVA kategorija
// „Pribor" (id 15) pod POSTOJEĆI Gerflor brend (id 6). Piše u public/data/pribor_products.json
// (DELJENO sa Tarkett pribor skriptom — upsert po sku-u, oba samo dodaju svoj deo).
//
// Gerflor accessory = standalone single-product (NE color-mapping kao vinil kolekcije).
// Svaki = JEDAN proizvod, sku 'PRIBOR-<slug>', slug 'gerflor-<slug>', categoryId '15', brandId '6'.
// Hero slike + spec/install PDF-ovi self-host na Supabase (product-images / product-documents),
// BEZ hotlinkova. Stranice se čitaju preko core.fetchPage + gerflor-parse (isti parser kao vinil).
//
// Slug-ovi su pretpostavke iz izviđanja; STVARNI URL se potvrđuje iz /sitemap.xml posle fetch-a
// (kao ingest_gerflor_cee.js). Ne-rešavajući slug → loguje se kao dead i preskače.

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const PRIBOR_JSON = path.join(DATA_DIR, 'pribor_products.json');
const IMAGES_BUCKET = 'product-images';
const DOCS_BUCKET = 'product-documents';
const CATEGORY_SLUG = 'pribor';
const CATEGORY_ID = '15';
const BRAND_ID = '6';
const SKU_PREFIX = 'PRIBOR-';
const ID_BASE = 15500;             // Gerflor pribor id prostor (Tarkett pribor 15000+); bez kolizije
const MIN_IMAGE_WIDTH = 300;

// 13 Gerflor pribor stavki (CEE slug). guessSlug = pretpostavka; tačan slug se potvrđuje iz sitemap-a.
// Grupisano: šipke/elektrode za varenje, podloge, lepljiva traka.
const PRIBOR_ITEMS = [
  // --- šipke / elektrode za varenje ---
  ['welding', 'cr-40', 'CR 40'],
  ['welding', 'cr-50', 'CR 50'],
  ['welding', 'mcr-40', 'MCR 40'],
  ['welding', 'bbr40', 'BBR 40'],
  ['welding', 'ecr-40', 'ECR 40 (PVC-free)'],
  ['welding', 'mat-40', 'MAT 40 (lino)'],
  ['welding', 'mat-40-multicolor', 'MAT 40 Multicolor'],
  // --- podloge ---
  ['underlay', 'acoustic-15db', 'Acoustic 15 dB'],
  ['underlay', 'acoustic-plus-19db', 'Acoustic Plus 19 dB'],
  ['underlay', 'silence-plus-19db', 'Silence Plus 19 dB'],
  ['underlay', 'smart-fix-16db', 'Smart Fix 16 dB'],
  ['underlay', 'tarafoam-16db', 'Tarafoam 16 dB'],
  // --- lepljiva traka ---
  ['tape', 'at7-single-sided-adhesive-tape', 'AT7 Single-Sided Adhesive Tape'],
].map(([group, guessSlug, displayName], index) => ({
  key: `pribor-gerflor-${guessSlug}`,
  group,
  guessSlug,
  displayName,
  id: String(ID_BASE + index),
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

async function uploadImage(supabase, storagePath, buffer, label) {
  const meta = await core.withTimeout(sharp(buffer).metadata(), 20000, `sharp ${label}`);
  if (!meta.width || meta.width < MIN_IMAGE_WIDTH) {
    throw new Error(`${label}: slika ${meta.width || '?'}px < ${MIN_IMAGE_WIDTH}px`);
  }
  return core.uploadToBucket(supabase, IMAGES_BUCKET, storagePath, buffer);
}

async function ingestDocuments(supabase, manifest, slug, docs) {
  const out = [];
  const seenTitles = new Set();
  for (const doc of docs) {
    const title = parse.mapDocumentTitle(doc.name, doc.category);
    if (seenTitles.has(title)) continue;
    seenTitles.add(title);
    const sourceUrl = parse.encodeAssetUrl(doc.url);
    const mKey = `doc:${sourceUrl}`;
    if (manifest.has(mKey)) { out.push({ title, url: manifest.get(mKey).publicUrl, type: 'pdf' }); continue; }
    try {
      const buffer = await core.downloadAsset(sourceUrl);
      if (!buffer.slice(0, 5).toString().startsWith('%PDF')) throw new Error('nije PDF');
      const fileName = `${core.slugify(title)}-${sourceUrl.match(/media\/2\/(\d+)\//)?.[1] || 'x'}.pdf`;
      const publicUrl = await core.uploadToBucket(
        supabase, DOCS_BUCKET, `products/${CATEGORY_SLUG}/${slug}/${fileName}`, buffer);
      out.push({ title, url: publicUrl, type: 'pdf' });
      manifest.record(mKey, { publicUrl, collection: slug });
    } catch (err) {
      console.log(`   ⚠️ dokument "${title}": ${err.message}`);
    }
  }
  return out;
}

// Razreši pravi CEE slug za stavku iz sitemap-a: tačno poklapanje guessSlug-a, pa prefiks poklapanje.
function resolveCeeSlug(item, productSlugs) {
  if (productSlugs.has(item.guessSlug)) return item.guessSlug;
  // Toleriši varijantni sufiks (npr. „...-0001-black-..."): uzmi najkraći slug koji počinje guessSlug-om.
  const matches = [...productSlugs].filter((s) => s === item.guessSlug || s.startsWith(item.guessSlug + '-'));
  matches.sort((a, b) => a.length - b.length);
  return matches[0] || null;
}

(async () => {
  const args = parseArgs();
  const manifest = core.loadManifest('ingest-pribor-gerflor');
  const supabase = args.dryRun ? null : core.getSupabase();
  const targets = PRIBOR_ITEMS.filter((c) => args.keys.length === 0 || args.keys.includes(c.key));
  console.log(`🎯 Gerflor pribor stavki za obradu: ${targets.length}${args.dryRun ? ' (DRY-RUN — bez mrežnih upisa)' : ''}`);
  if (args.dryRun) {
    console.log(`📋 ${targets.length} Gerflor pribor stavki (guessSlug → URL; tačan slug iz sitemap-a u realnom ingestu):`);
    for (const c of targets) {
      console.log(`   • [${c.group}] ${c.displayName}  → sku=${SKU_PREFIX}${c.guessSlug} slug=gerflor-${c.guessSlug}  ${parse.PUBLIC_HOST}/products/${c.guessSlug}`);
    }
    console.log('   (stavke koje se ne nalaze u sitemap-u se loguju kao dead i preskaču)');
    console.log('\n===== REZIME (Gerflor pribor, dry-run) =====');
    for (const c of targets) console.log(JSON.stringify({ key: c.key, sku: `${SKU_PREFIX}${c.guessSlug}`, slug: `gerflor-${c.guessSlug}`, dryRun: true }));
    return;
  }

  // Sitemap → skup svih /products/<slug> putanja (potvrda da stavka postoji).
  const sitemapXml = await core.fetchPage(`${parse.PUBLIC_HOST}/sitemap.xml`);
  const locs = parse.parseSitemapLocs(sitemapXml);
  const productSlugs = new Set();
  for (const loc of locs) {
    const m = loc.match(/\/products\/([a-z0-9-]+)$/);
    if (m) productSlugs.add(m[1]);
  }
  console.log(`🗺️  Sitemap: ${locs.length} URL-ova, ${productSlugs.size} /products/ putanja`);

  const summary = [];
  const dead = [];
  let priborList = fs.existsSync(PRIBOR_JSON) ? JSON.parse(fs.readFileSync(PRIBOR_JSON, 'utf8')) : [];

  for (const item of targets) {
    try {
      if (args.skipExisting && manifest.get(`item:${item.key}`)?.status === 'ok') {
        console.log(`\n⏭️  ${item.key}: već ingestovano — preskačem`);
        summary.push({ key: item.key, skipped: true });
        continue;
      }
      console.log(`\n📂 [${item.group}] ${item.displayName}`);
      const ceeSlug = resolveCeeSlug(item, productSlugs);
      if (!ceeSlug) {
        console.log(`   ⚰️  nije u sitemap-u (${item.guessSlug}) — dead, preskačem`);
        dead.push({ key: item.key, guessSlug: item.guessSlug });
        manifest.record(`item:${item.key}`, { status: 'dead' });
        manifest.save();
        continue;
      }
      const slug = `gerflor-${item.guessSlug}`;
      const sku = `${SKU_PREFIX}${item.guessSlug}`;
      const pageUrl = `${parse.PUBLIC_HOST}/products/${ceeSlug}`;
      const html = await core.fetchPage(pageUrl);

      // Opis (intro+body dialog ako postoji)
      const desc = parse.parseDescriptionDialog(html);
      const description = [desc?.intro, desc?.body].filter(Boolean).join('\n\n').trim() || item.displayName;

      // Specifikacije
      const specTable = parse.parseSpecTables(html);
      const specs = { Brend: 'Gerflor', Kolekcija: item.displayName, ...specTable };

      // Dokumenti (PDF) → self-host
      const rawDocs = parse.parseDocumentLinks(html);
      const documents = await ingestDocuments(supabase, manifest, slug, rawDocs);

      // Hero/ambijent slike → self-host (worker-pool nije nužan: malo slika po stavci)
      const slides = parse.parseHeroSlides(html);
      const images = [];
      for (let i = 0; i < slides.length; i++) {
        const mKey = `img:${slides[i].src}`;
        if (manifest.has(mKey)) {
          images.push({ url: manifest.get(mKey).publicUrl, alt: item.displayName, isPrimary: images.length === 0, order: images.length + 1 });
          continue;
        }
        try {
          const buf = await core.downloadAsset(slides[i].src);
          const fileBase = i === 0 ? 'hero' : `gallery-${i}`;
          const url = await uploadImage(supabase, `products/${CATEGORY_SLUG}/${slug}/${fileBase}.jpg`, buf, `${slug}/${fileBase}`);
          images.push({ url, alt: item.displayName, isPrimary: images.length === 0, order: images.length + 1 });
          manifest.record(mKey, { publicUrl: url, collection: slug });
        } catch (err) {
          console.log(`   ⚠️ slika #${i}: ${err.message} — preskačem`);
        }
      }
      if (images.length > 0 && !images.some((im) => im.isPrimary)) images[0].isPrimary = true;

      const record = {
        id: item.id,
        name: item.displayName,
        slug,
        url: pageUrl,
        brand: 'Gerflor',
        brandId: BRAND_ID,
        categoryId: CATEGORY_ID,
        sku,
        priceUnit: 'kom',
        description,
        shortDescription: desc?.intro || item.displayName,
        specs,
        images,
        documents,
      };
      console.log(`   → sku=${record.sku} slug=${record.slug} slika:${record.images.length} dok:${record.documents.length} specs:${Object.keys(record.specs).length}`);

      priborList = priborList.filter((p) => p.sku !== record.sku);
      priborList.push(record);
      summary.push({ key: item.key, sku: record.sku, slug: record.slug, images: record.images.length, docs: record.documents.length });
      manifest.record(`item:${item.key}`, { status: 'ok', sku: record.sku });
      manifest.save();
    } catch (err) {
      console.log(`⚠️ ${item.key}: ${err.message} — preskačem stavku`);
      manifest.record(`item:${item.key}`, { status: 'error', error: err.message });
      manifest.save();
    }
  }

  core.writeJsonWithBackup(PRIBOR_JSON, priborList, 'pribor-products');
  manifest.save();

  console.log('\n===== REZIME (Gerflor pribor) =====');
  for (const row of summary) console.log(JSON.stringify(row));
  if (dead.length) {
    console.log(`\n⚰️  DEAD (${dead.length}):`);
    for (const d of dead) console.log(JSON.stringify(d));
  }
})().catch((err) => { console.error('❌', err); process.exit(1); });
