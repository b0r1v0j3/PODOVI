/**
 * S6 ingest — Gerflor VIRTUO (LVT, cat 6) + TARAFLEX (sport, cat 10) sa gerflor-cee.com.
 *
 * Model: tools/ingest_gerflor_cee.js (enrichment-only, hardcoded slug map), ali generalizovan
 * na EKSPLICITNU listu kolekcija sa dva tipa:
 *   - 'lvt-flat'         → upis u public/data/lvt_colors_complete.json (flat colors[])
 *   - 'sport-nested'     → upis u public/data/sport_colors.json (nested collections[])
 *   - 'vinyl-nested'     → upis u public/data/vinyl_colors_complete.json (nested collections[])
 *   - 'industrial-nested'→ upis u public/data/industrial_colors.json (nested collections[], cat 9)
 *
 * Tvrda pravila (S4/S7 lekcija — zastali socket prodje interni timeout i obesi ceo run):
 *   - SVI asseti se self-host-uju na Supabase (nema hotlinkova).
 *   - Worker-pool 8 + tvrdi core.withTimeout(asset, 120000, label) po svakom assetu.
 *   - Manifest resume + save na svakih 25 zapisa.
 *   - --dry-run preskace SVU mrezu/upise (samo lista kolekcije + color counts iz sitemap-a).
 *
 * Gerflor blokira headless Playwright + WebFetch (403); core.fetchPage() prolazi.
 *
 * NAPOMENA: ovaj skript NE menja prepare-colors.ts (cat-6 gerflor-LVT i cat-10 sport grane
 * vec pokrivaju Virtuo/Taraflex). Za Taraflex se rucno dodaju createCollectionProduct
 * unosi u lib/data/manual-collection-products.ts (zaseban korak, vidi REZIME ispod).
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const core = require('./lib/ingest-core.js');
const parse = require('./lib/gerflor-parse.js');

const LVT_JSON_PATH = path.join(process.cwd(), 'public', 'data', 'lvt_colors_complete.json');
const SPORT_JSON_PATH = path.join(process.cwd(), 'public', 'data', 'sport_colors.json');
const VINYL_JSON_PATH = path.join(process.cwd(), 'public', 'data', 'vinyl_colors_complete.json');
const INDUSTRIAL_JSON_PATH = path.join(process.cwd(), 'public', 'data', 'industrial_colors.json');
const IMAGES_BUCKET = 'product-images';
const DOCS_BUCKET = 'product-documents';
const MIN_DECOR_WIDTH = 800;

const ASSET_TIMEOUT_MS = 120000; // tvrdi backstop po assetu (download+sharp+upload)
const WORKER_POOL_SIZE = 8;
const SAVE_EVERY = 25; // manifest checkpoint na svakih N novih zapisa

// ── Eksplicitna konfiguracija kolekcija ──────────────────────────────────────
// Slug = CEE slug (sitemap). Url se izvodi iz tmp/s6-cee-urls.json (PUBLIC_HOST + /products/<slug>).
// Izvor: tmp/s6-recon.md §2 + tmp/s6-cee-urls.json (provereno 2026-06-16).

const VIRTUO = [
  'virtuo-30',
  'virtuo-30-rigid-acoustic',
  'virtuo-55',
  'virtuo-55-herringbone',
  'virtuo-55-rigid-acoustic',
  'virtuo-55-rigid-acoustic-herringbone',
].map((slug) => ({
  kind: 'lvt-flat',
  categoryId: '6',
  bucketDir: 'lvt',
  slug,
  url: `${parse.PUBLIC_HOST}/products/${slug}`,
}));

const TARAFLEX = [
  'taraflex-comfort-2',
  'taraflex-evolution-2',
  'taraflex-evolution-2-drytex',
  'taraflex-evolution-2-sl',
  'taraflex-multi-use-62',
  'taraflex-performance-2',
  'taraflex-performance-2-drytex',
  'taraflex-performance-2-sl',
  'taraflex-surface-2',
].map((slug) => ({
  kind: 'sport-nested',
  categoryId: '10',
  bucketDir: 'sport',
  slug,
  url: `${parse.PUBLIC_HOST}/products/${slug}`,
}));

// S5 — Gerflor Tarasafe (protivklizni / sigurnosni vinil). Heterogeni safety vinyl koji ide
// u POSTOJEĆU Vinil kategoriju (cat 2). Reuse istog sitemap → varijacije mehanizma kao Taraflex,
// ali ciljani fajl je public/data/vinyl_colors_complete.json (nested collections[]) i svaka
// kolekcija nosi protivklizno:true. Slugovi = CEE slugovi (tarasafe-*), provereno u
// tmp/s6-cee-urls.json (classifyProductPath ih klasifikuje kao 'variation').
const TARASAFE = [
  'tarasafe-ultra-compact-sparclean',
  'tarasafe-compact-standard',
  'tarasafe-h2o',
  'tarasafe-compact-design-2022',
  'tarasafe-ultra-h2o',
  'tarasafe-plus',
  'tarasafe-super',
].map((slug) => ({
  kind: 'vinyl-nested',
  categoryId: '2',
  bucketDir: 'vinyl',
  protivklizno: true,
  slug,
  url: `${parse.PUBLIC_HOST}/products/${slug}`,
}));

// S9 — Gerflor R-Tile + Design Tile (PVC interlocking industrijske ploče). Idu u POSTOJEĆU
// Industrijske ploče kategoriju (cat 9). Reuse istog sitemap → varijacije mehanizma kao Taraflex
// (kind 'industrial-nested'), ali ciljani fajl je public/data/industrial_colors.json (nested
// collections[], isti oblik kao GTI Max Cleantech/Connect/Pure i Attraction Connect).
// Slugovi = CEE slugovi, provereno u tmp/s6-cee-urls.json (classifyProductPath ih klasifikuje
// kao 'variation'; r-tile-slate nema varijacije u sitemap-u → colors[] = [], kolekcija se i dalje
// upisuje). design-tile-access-corner (akcesoar) je EKSPLICITNO izostavljen.
// S9 — Gerflor Mural (zidne obloge / wall coverings). Heterogeni zidni vinil koji ide u
// POSTOJEĆU Vinil kategoriju (cat 2). Reuse istog 'vinyl-nested' mehanizma kao Tarasafe
// (upis u public/data/vinyl_colors_complete.json, nested collections[]), ali umesto
// protivklizno:true nosi zidneObloge:true → "Zidna obloga":"Da" u characteristics i na svakoj
// boji. getVinylCollectionProducts (firstColor.characteristics) i CategoryTabs
// (color.characteristics) automatski izlože spec 'zidna_obloga' (characteristicLabelToKey)
// za NOVI ?zidne=1 filter — kao što Tarasafe izlaže 'protivklizno' za ?safety=1.
// Slugovi = CEE slugovi (mural-*), provereno u tmp/s6-cee-urls.json (classifyProductPath ih
// klasifikuje kao 'variation'). --dry-run potvrđuje color count iz živog sitemap-a; slug bez
// varijacija u sitemap-u izlistava se sa 0 boja (signal mrtvog/pogrešnog sluga).
const MURAL = [
  'mural-revela',
  'mural-calypso',
  'mural-club',
  'mural-ultra-design',
].map((slug) => ({
  kind: 'vinyl-nested',
  categoryId: '2',
  bucketDir: 'vinyl',
  zidneObloge: true,
  slug,
  url: `${parse.PUBLIC_HOST}/products/${slug}`,
}));

const R_TILE = [
  'r-tile-4mm',
  'r-tile-5mm',
  'r-tile-7mm',
  'r-tile-9mm',
  'r-tile-excel-5mm',
  'r-tile-excel-7mm',
  'r-tile-slate',
  'design-tile',
].map((slug) => ({
  kind: 'industrial-nested',
  categoryId: '9',
  bucketDir: 'industrial',
  slug,
  url: `${parse.PUBLIC_HOST}/products/${slug}`,
}));

const ALL_COLLECTIONS = [...VIRTUO, ...TARAFLEX, ...TARASAFE, ...MURAL, ...R_TILE];

// Eksplicitno SKIPOVANO (moguci kasniji follow-up, vidi tmp/s6-recon.md §2):
//  - my-taraflex-* landing/configurator stranice (4)
//  - subflex-taraflex-* underlayment akcesori (10)
//  - single-color specialty/portable sistemi (taraflex-table-tennis-*, taraflexr-badminton-*,
//    taraflexr-bateco, taraflexr-isolsport) (6)
const SKIPPED_FOLLOWUP = [
  'my-taraflex-* landing/configurator pages (4)',
  'subflex-taraflex-* underlayment accessories (10)',
  'single-color specialty/portable systems: taraflex-table-tennis-2-62, taraflexr-badminton-45, ' +
    'taraflexr-badminton-portable, taraflexr-bateco, taraflexr-isolsport, taraflexr-table-tennis-portable (6)',
  'design-tile-access-corner (R-Tile/Design-Tile pristupni ugaoni akcesoar — S9 SKIP) (1)',
];

function parseArgs() {
  const args = { dryRun: false, only: [], skipExisting: false };
  for (const a of process.argv.slice(2)) {
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--skip-existing') args.skipExisting = true;
    else if (a.startsWith('--collection=')) args.only.push(a.split('=')[1]);
  }
  return args;
}

function variationKey(v) {
  return v.code ? `code:${v.code}` : `name:${v.nameSlug}`;
}

// ── Worker pool (8) ──────────────────────────────────────────────────────────
// Svaki task je async fn; tvrdi per-asset timeout je UNUTAR taska (label-ovan).
async function runPool(items, size, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function loop() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, loop));
  return results;
}

// sharp.metadata() je jedini await bez sopstvenog timeout-a (libvips moze da zaglavi
// worker thread na neispravnoj slici). uploadImageChecked se ceo wrap-uje u ASSET_TIMEOUT.
async function uploadImageChecked(supabase, storagePath, buffer, label) {
  const meta = await core.withTimeout(sharp(buffer).metadata(), 20000, `sharp ${label}`);
  if (!meta.width || meta.width < MIN_DECOR_WIDTH) {
    throw new Error(`${label}: slika ${meta.width || '?'}px < ${MIN_DECOR_WIDTH}px`);
  }
  return core.uploadToBucket(supabase, IMAGES_BUCKET, storagePath, buffer);
}

// ── Sitemap → varijacije po koloni (color counts + URL-ovi varijacija) ────────
function buildVariationMap(allLocs, collections) {
  const ceeSlugs = collections.map((c) => c.slug);
  const byCol = new Map();
  for (const loc of allLocs) {
    const m = loc.match(/\/products\/([a-z0-9-]+)$/);
    if (!m) continue;
    const cls = parse.classifyProductPath(m[1], ceeSlugs);
    if (cls?.type === 'variation') {
      if (!byCol.has(cls.ceeSlug)) byCol.set(cls.ceeSlug, []);
      byCol.get(cls.ceeSlug).push({ ...cls, url: loc });
    }
  }
  // dedupe po istom kljucu (npr. performance-2-drytex ima 23 URL-a, 6350 light-cherry-design x2)
  const out = new Map();
  for (const [slug, arr] of byCol.entries()) {
    const seen = new Set();
    out.set(
      slug,
      arr.filter((v) => {
        const k = variationKey(v);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
    );
  }
  return out;
}

// ── Dokumenti kolekcije (dedupe po finalnom srpskom naslovu) ──────────────────
function collectDocuments(pageHtml) {
  const rawDocs = parse.parseDocumentLinks(pageHtml);
  const documents = [];
  const seenTitles = new Set();
  for (const doc of rawDocs) {
    const title = parse.mapDocumentTitle(doc.name, doc.category);
    if (seenTitles.has(title)) continue;
    seenTitles.add(title);
    documents.push({ title, sourceUrl: parse.encodeAssetUrl(doc.url) });
  }
  return documents;
}

function displayNameFromVariation(v) {
  return v.nameSlug.replace(/-/g, ' ').toUpperCase();
}

// ── Glavni tok po kolekciji ───────────────────────────────────────────────────
(async () => {
  const args = parseArgs();
  const manifest = core.loadManifest('ingest-gerflor-s6');
  const supabase = args.dryRun ? null : core.getSupabase();

  const targets = ALL_COLLECTIONS.filter(
    (c) => args.only.length === 0 || args.only.includes(c.slug)
  );

  console.log(
    `🎯 S6 ingest — kolekcija za obradu: ${targets.length} ` +
      `(${targets.filter((c) => c.kind === 'lvt-flat').length} Virtuo + ` +
      `${targets.filter((c) => c.kind === 'sport-nested').length} Taraflex + ` +
      `${targets.filter((c) => c.kind === 'vinyl-nested' && c.protivklizno).length} Tarasafe + ` +
      `${targets.filter((c) => c.kind === 'vinyl-nested' && c.zidneObloge).length} Mural + ` +
      `${targets.filter((c) => c.kind === 'industrial-nested').length} R-Tile/Design-Tile)` +
      `${args.dryRun ? ' (DRY-RUN)' : ''}`
  );
  console.log(`⏭️  Eksplicitno skipovano (moguci follow-up): ${SKIPPED_FOLLOWUP.length} grupa:`);
  for (const s of SKIPPED_FOLLOWUP) console.log(`     • ${s}`);

  // 1) Sitemap → mapa CEE slug → varijacije (color counts)
  const sitemapXml = await core.fetchPage(`${parse.PUBLIC_HOST}/sitemap.xml`);
  const allLocs = parse.parseSitemapLocs(sitemapXml);
  const variationsByCol = buildVariationMap(allLocs, targets);
  console.log(`🗺️  Sitemap: ${allLocs.length} URL-ova`);

  // Učitavanje ciljnih JSON fajlova (čitaju se uvek, da bismo izveštaj o color count-u
  // mogli da poredimo sa postojećim; pišu se samo van dry-run-a).
  const lvtData = JSON.parse(fs.readFileSync(LVT_JSON_PATH, 'utf8'));
  if (!Array.isArray(lvtData.colors)) lvtData.colors = [];
  const sportData = JSON.parse(fs.readFileSync(SPORT_JSON_PATH, 'utf8'));
  if (!Array.isArray(sportData.collections)) sportData.collections = [];
  const vinylData = JSON.parse(fs.readFileSync(VINYL_JSON_PATH, 'utf8'));
  if (!Array.isArray(vinylData.collections)) vinylData.collections = [];
  const industrialData = JSON.parse(fs.readFileSync(INDUSTRIAL_JSON_PATH, 'utf8'));
  if (!Array.isArray(industrialData.collections)) industrialData.collections = [];

  const summary = [];
  let unsavedWrites = 0;
  const maybeSave = (force = false) => {
    if (args.dryRun) return;
    if (force || unsavedWrites >= SAVE_EVERY) {
      manifest.save();
      unsavedWrites = 0;
    }
  };

  for (const col of targets) {
    try {
      const variations = variationsByCol.get(col.slug) || [];

      // DRY-RUN: samo color count iz sitemap-a, bez mreže ka product stranici.
      if (args.dryRun) {
        console.log(
          `\n📂 ${col.slug} [${col.kind}, cat ${col.categoryId}] → varijacija (boja): ${variations.length}`
        );
        summary.push({ slug: col.slug, kind: col.kind, categoryId: col.categoryId, colors: variations.length, protivklizno: col.protivklizno || false, zidneObloge: col.zidneObloge || false });
        continue;
      }

      console.log(`\n📂 ${col.slug} [${col.kind}, cat ${col.categoryId}]`);
      const pageHtml = await core.fetchPage(col.url);
      const colorCountHeader = parse.parseColorCount(pageHtml);
      const slides = parse.parseHeroSlides(pageHtml);
      const specs = parse.parseSpecTables(pageHtml);
      const descDialog = parse.parseDescriptionDialog(pageHtml);
      const documents = collectDocuments(pageHtml);

      console.log(
        `   🎨 varijacija: ${variations.length} (header: ${colorCountHeader ?? '?'}) | ` +
          `🖼️ ambijent: ${slides.length} | 📄 dokumenta: ${documents.length} | spec: ${Object.keys(specs).length}`
      );

      // ── 2) Dokumenti (PDF) → product-documents/products/<dir>/gerflor-<slug>/... ──
      const docTasks = documents.map((doc) => async () => {
        const manifestKey = `doc:${col.slug}:${doc.sourceUrl}`;
        if (manifest.has(manifestKey)) {
          return { title: doc.title, url: manifest.get(manifestKey).publicUrl, type: 'pdf' };
        }
        return core.withTimeout(
          (async () => {
            const buffer = await core.downloadAsset(doc.sourceUrl);
            if (!buffer.slice(0, 5).toString().startsWith('%PDF')) throw new Error('nije PDF');
            const fileName = `${core.slugify(doc.title)}-${doc.sourceUrl.match(/media\/2\/(\d+)\//)?.[1] || 'x'}.pdf`;
            const publicUrl = await core.uploadToBucket(
              supabase,
              DOCS_BUCKET,
              `products/${col.bucketDir}/gerflor-${col.slug}/${fileName}`,
              buffer
            );
            manifest.record(manifestKey, { publicUrl, collection: col.slug });
            unsavedWrites++;
            maybeSave();
            return { title: doc.title, url: publicUrl, type: 'pdf' };
          })(),
          ASSET_TIMEOUT_MS,
          `doc ${col.slug}/${doc.title}`
        );
      });

      const uploadedDocs = [];
      for (const res of await runPool(docTasks, WORKER_POOL_SIZE, (task) =>
        task().catch((err) => ({ __error: err.message, title: '?' }))
      )) {
        if (res.__error) console.log(`   ⚠️ dokument: ${res.__error}`);
        else uploadedDocs.push(res);
      }

      // ── 3) Ambijentalne / room-scene slike → product-images/.../ambience/ ──
      const sceneTasks = slides.map((slide, i) => async () => {
        const manifestKey = `scene:${col.slug}:${slide.src}`;
        if (manifest.has(manifestKey)) return { i, url: manifest.get(manifestKey).publicUrl };
        return core.withTimeout(
          (async () => {
            const buffer = await core.downloadAsset(slide.src);
            const publicUrl = await uploadImageChecked(
              supabase,
              `products/${col.bucketDir}/gerflor-${col.slug}/ambience/scena-${i + 1}.jpg`,
              buffer,
              `${col.slug} scena ${i + 1}`
            );
            manifest.record(manifestKey, { publicUrl, collection: col.slug });
            unsavedWrites++;
            maybeSave();
            return { i, url: publicUrl };
          })(),
          ASSET_TIMEOUT_MS,
          `scene ${col.slug}/${i + 1}`
        );
      });

      const sceneResults = (
        await runPool(sceneTasks, WORKER_POOL_SIZE, (task) =>
          task().catch((err) => ({ __error: err.message }))
        )
      )
        .filter((r) => !r.__error)
        .sort((a, b) => a.i - b.i);
      const sceneUrls = sceneResults.map((r) => r.url);

      // ── 4) Dekor (swatch) slike po boji: stranica varijacije → hero[0] (>=800px) ──
      const decorTasks = variations.map((variation) => async () => {
        const manifestKey = `decor:${col.slug}:${variation.url}`;
        const cached = manifest.get(manifestKey);
        const fileBase = variation.code
          ? `${variation.code}-${variation.nameSlug}`
          : variation.nameSlug;
        if (cached?.publicUrl) {
          return { variation, publicUrl: cached.publicUrl, displayName: cached.displayName || displayNameFromVariation(variation) };
        }
        return core.withTimeout(
          (async () => {
            const varHtml = await core.fetchPage(variation.url);
            let displayName = displayNameFromVariation(variation);
            const h1 = varHtml.match(/<h1>([^<]+)<\/h1>/);
            if (h1) displayName = parse.decodeEntities(h1[1]).replace(/^\d{4}\s+/, '');
            const hero = parse.parseHeroSlides(varHtml)[0];
            if (!hero) throw new Error('hero slika nije nadjena');
            const buffer = await core.downloadAsset(hero.src);
            const publicUrl = await uploadImageChecked(
              supabase,
              `products/${col.bucketDir}/gerflor-${col.slug}/colors/${fileBase}.jpg`,
              buffer,
              `${col.slug}/${fileBase}`
            );
            manifest.record(manifestKey, { publicUrl, collection: col.slug, displayName });
            unsavedWrites++;
            maybeSave();
            return { variation, publicUrl, displayName };
          })(),
          ASSET_TIMEOUT_MS,
          `decor ${col.slug}/${fileBase}`
        );
      });

      const decorResults = [];
      for (const res of await runPool(decorTasks, WORKER_POOL_SIZE, (task) =>
        task().catch((err) => ({ __error: err.message }))
      )) {
        if (res.__error) console.log(`   ⚠️ dekor: ${res.__error}`);
        else decorResults.push(res);
      }

      // ── 5) Upis u ciljni JSON ──
      const collectionName = humanizeCollectionName(col.slug);
      const descriptionText = descDialog
        ? [descDialog.intro, descDialog.body].filter(Boolean).join('\n\n')
        : '';
      const heroForCollection = sceneUrls[0] || null;

      if (col.kind === 'lvt-flat') {
        // Virtuo → flat colors[], collection = '<slug>' BEZ gerflor- prefiksa
        // (poklapa kako postojeci Gerflor LVT colors cuvaju `collection`: creation-30 itd.).
        // Uklanjamo stare Virtuo redove pa upisujemo ponovo (idempotentno).
        lvtData.colors = lvtData.colors.filter((c) => c.collection !== col.slug);
        const flatChars = buildCharacteristicsFromSpecTable(specs);
        for (const r of decorResults) {
          lvtData.colors.push({
            collection: col.slug,
            collection_name: collectionName,
            code: r.variation.code || '',
            name: r.displayName,
            full_name: r.variation.code ? `${r.variation.code} ${r.displayName}` : r.displayName,
            slug: `${r.variation.nameSlug}-${r.variation.sku}`,
            image_url: r.publicUrl,
            texture_url: r.publicUrl,
            image_count: 1,
            lifestyle_url: heroForCollection || r.publicUrl,
            // dimension/format/overall_thickness MORAJU postojati (kao creation-* boje) da
            // colors[] niz ostane homogen — inače `lvtColorsData as {colors?}` cast u
            // color-helpers.ts puca (heterogena unija). Deriviraj iz spec tabele, fallback null.
            dimension: flatChars['Dimenzije'] || flatChars['Format'] || null,
            format: flatChars['Format'] || null,
            overall_thickness: flatChars['Ukupna debljina'] || flatChars['Debljina'] || null,
            description: descriptionText,
            specs: {},
            collection_specs: buildCollectionSpecsFromSpecTable(specs, collectionName),
            characteristics: flatChars,
          });
        }
        if (uploadedDocs.length) {
          // dokumenti se na LVT cuvaju na nivou kolekcije (auto-derived product ih ne cita,
          // ali ih ostavljamo na prvoj boji za eventualnu kasniju upotrebu / PDP fallback).
        }
      } else if (col.kind === 'sport-nested') {
        // Taraflex → nested collections[], slug = '<slug>' (npr. taraflex-comfort-2)
        // BEZ gerflor- prefiksa (poklapa postojeci DLW sport: 'dlw-colorette-sport';
        // cat-10 prepare-colors grana strip-uje gerflor-/tarkett- pa matchuje na ovaj slug).
        const colors = decorResults.map((r) => ({
          code: r.variation.code || '',
          name: r.displayName,
          image: r.publicUrl,
        }));
        const entry = {
          name: collectionName,
          slug: col.slug,
          url: col.url,
          colorCount: colors.length,
          description: descriptionText,
          characteristics: buildCharacteristicsFromSpecTable(specs),
          colors,
          collection_image_url: heroForCollection,
        };
        if (sceneUrls.length > 1) entry.room_scene_images = sceneUrls.slice(1);
        if (uploadedDocs.length) entry.documents = uploadedDocs;
        const idx = sportData.collections.findIndex((c) => c.slug === col.slug);
        if (idx >= 0) sportData.collections[idx] = entry;
        else sportData.collections.push(entry);
      } else if (col.kind === 'industrial-nested') {
        // S9 R-Tile / Design Tile → nested collections[] u public/data/industrial_colors.json,
        // ISTI oblik kao postojeci GTI Max Cleantech/Connect, GTI Pure i Attraction Connect:
        // { name, slug, url, colorCount, description, characteristics, colors:[{code,name,image}],
        //   collection_image_url }. slug = CEE '<slug>' BEZ gerflor- prefiksa — cat-9 prepare-colors
        // grana strip-uje gerflor- pa matchuje na ovaj slug (industrialCollections.find).
        // r-tile-slate nema varijacije u sitemap-u → colors = [] (kolekcija se i dalje upisuje,
        // kartica se renderuje preko IND- manual unosa, PDP samo nema swatch-eve).
        const colors = decorResults.map((r) => ({
          code: r.variation.code || '',
          name: r.displayName,
          image: r.publicUrl,
        }));
        const entry = {
          name: collectionName,
          slug: col.slug,
          url: col.url,
          colorCount: colors.length,
          description: descriptionText,
          characteristics: buildCharacteristicsFromSpecTable(specs),
          colors,
          collection_image_url: heroForCollection,
        };
        // room_scene_images / documents su opcioni dodaci (postojeci industrijski unosi ih nemaju,
        // ali cat-9 citac ih ignorise pa ne kvare shape) — dodajemo ih samo ako postoje.
        if (sceneUrls.length > 1) entry.room_scene_images = sceneUrls.slice(1);
        if (uploadedDocs.length) entry.documents = uploadedDocs;
        const idx = industrialData.collections.findIndex((c) => c.slug === col.slug);
        if (idx >= 0) industrialData.collections[idx] = entry;
        else industrialData.collections.push(entry);
      } else if (col.kind === 'vinyl-nested') {
        // S5 Tarasafe / S9 Mural → vinyl-nested: nested collections[] u vinyl_colors_complete.json
        // (isti oblik kao postojece Gerflor vinil kolekcije: taralay-*/mipolam-*).
        // slug = CEE '<slug>'; getVinylCollectionProducts() dodaje 'gerflor-' prefiks.
        // Tarasafe nosi protivklizno:true → "Protivklizno":"Da" (spec 'protivklizno', ?safety=1).
        // Mural nosi zidneObloge:true → "Zidna obloga":"Da" (spec 'zidna_obloga', ?zidne=1).
        // Tag se upisuje u characteristics i na svakoj boji → getVinylCollectionProducts
        // (firstColor.characteristics) i CategoryTabs (color.characteristics) automatski izlože
        // odgovarajući spec za pripadni filter.
        const collChars = buildCharacteristicsFromSpecTable(specs);
        if (col.protivklizno) collChars['Protivklizno'] = 'Da';
        if (col.zidneObloge) collChars['Zidna obloga'] = 'Da';
        const colors = decorResults.map((r) => {
          const code = r.variation.code || '';
          const colorChars = { ...collChars };
          return {
            code,
            name: r.displayName,
            sku: r.variation.sku,
            href: r.variation.url,
            collection_slug: col.slug,
            image: r.publicUrl,
            description: descriptionText,
            characteristics: colorChars,
          };
        });
        const entry = {
          name: collectionName,
          slug: col.slug,
          url: col.url,
          colorCount: colors.length,
          categoryId: col.categoryId,
          protivklizno: col.protivklizno || false,
          zidneObloge: col.zidneObloge || false,
          description: descriptionText,
          characteristics: collChars,
          colors,
          collection_image_url: heroForCollection,
          room_scene_images: sceneUrls.length > 1 ? sceneUrls.slice(1) : [],
        };
        if (uploadedDocs.length) entry.documents = uploadedDocs;
        const idx = vinylData.collections.findIndex((c) => c.slug === col.slug);
        if (idx >= 0) vinylData.collections[idx] = entry;
        else vinylData.collections.push(entry);
      }

      manifest.record(`collection:${col.slug}`, {
        status: 'ok',
        kind: col.kind,
        colors: decorResults.length,
        headerCount: colorCountHeader,
        documents: uploadedDocs.length,
        scenes: sceneUrls.length,
      });
      unsavedWrites++;
      maybeSave();

      summary.push({
        slug: col.slug,
        kind: col.kind,
        categoryId: col.categoryId,
        colors: decorResults.length,
        headerCount: colorCountHeader,
        documents: uploadedDocs.length,
        scenes: sceneUrls.length,
        protivklizno: col.protivklizno || false,
        zidneObloge: col.zidneObloge || false,
      });
    } catch (err) {
      console.log(`⚠️ ${col.slug}: ${err.message} — preskačem kolekciju`);
      manifest.record(`collection:${col.slug}`, { status: 'error', error: err.message });
      unsavedWrites++;
      maybeSave(true);
      continue;
    }
  }

  if (!args.dryRun) {
    lvtData.totalColors = lvtData.colors.length;
    lvtData.total = new Set(lvtData.colors.map((c) => c.collection)).size;
    lvtData.generatedAt = new Date().toISOString();
    core.writeJsonWithBackup(LVT_JSON_PATH, lvtData, 'lvt-colors-complete');
    core.writeJsonWithBackup(SPORT_JSON_PATH, sportData, 'sport-colors');
    vinylData.totalColors = vinylData.collections.reduce(
      (sum, c) => sum + ((c.colors && c.colors.length) || 0),
      0
    );
    vinylData.generatedAt = new Date().toISOString();
    core.writeJsonWithBackup(VINYL_JSON_PATH, vinylData, 'vinyl-colors-complete');
    industrialData.totalColors = industrialData.collections.reduce(
      (sum, c) => sum + ((c.colors && c.colors.length) || 0),
      0
    );
    industrialData.generatedAt = new Date().toISOString();
    core.writeJsonWithBackup(INDUSTRIAL_JSON_PATH, industrialData, 'industrial-colors');
    maybeSave(true);
  }

  console.log('\n===== REZIME =====');
  for (const row of summary) console.log(JSON.stringify(row));
  console.log(
    `\nVirtuo: ${summary.filter((r) => r.kind === 'lvt-flat').length} kol. | ` +
      `Taraflex: ${summary.filter((r) => r.kind === 'sport-nested').length} kol. | ` +
      `Tarasafe: ${summary.filter((r) => r.kind === 'vinyl-nested' && r.protivklizno).length} kol. | ` +
      `Mural: ${summary.filter((r) => r.kind === 'vinyl-nested' && r.zidneObloge).length} kol. | ` +
      `R-Tile/Design-Tile: ${summary.filter((r) => r.kind === 'industrial-nested').length} kol.`
  );
  if (!args.dryRun) {
    console.log(
      'PODSETNIK: za svaku Taraflex kolekciju dodati createCollectionProduct unos u ' +
        'lib/data/manual-collection-products.ts (cat 10, slug gerflor-taraflex-*).'
    );
    console.log(
      'PODSETNIK: za svaku R-Tile/Design-Tile kolekciju postoji createCollectionProduct unos u ' +
        'lib/data/manual-collection-products.ts (cat 9, slug gerflor-<slug>, SKU IND-<SLUG>).'
    );
  }
})().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});

// ── Helperi za spec tabelu → naš shape ────────────────────────────────────────
function humanizeCollectionName(slug) {
  return String(slug || '')
    .split('-')
    .map((w) => (/^\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

function buildCharacteristicsFromSpecTable(specs) {
  const out = {};
  for (const [k, v] of Object.entries(specs || {})) {
    if (k && v) out[k] = v;
  }
  return out;
}

function buildCollectionSpecsFromSpecTable(specs, collectionName) {
  const list = [{ key: 'collection', label: 'Kolekcija', value: collectionName }];
  for (const [k, v] of Object.entries(specs || {})) {
    if (k && v) list.push({ key: core.slugify(k), label: k, value: String(v) });
  }
  return list;
}
