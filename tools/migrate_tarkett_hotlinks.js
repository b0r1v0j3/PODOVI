const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const core = require('./lib/ingest-core.js');
const hm = require('./lib/hotlink-migrate.js');

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const PENDING_PATH = path.join(DATA_DIR, 'tarkett-migration-pending.json');
const IMAGES_BUCKET = 'product-images';
const DOCS_BUCKET = 'product-documents';
const DEST_PREFIX = 'products/tarkett-migrated';
const MIN_IMG_WIDTH = 600;
const MAX_PDF_BYTES = 157_000_000; // ~149.7 MiB; Supabase globalni limit dignut na 150 MiB (2026-06-16)

// Redosled: LVT prvi (najveći), pa ostali. Samo fajlovi koji sadrže Tarkett hotlinkove.
const TARGET_FILES = [
  'tarkett_lvt_products.json',
  'tarkett_homogeneous_vinyl_colors.json',
  'tarkett_vinyl_home_colors.json',
  'tarkett_heterogeneous_vinyl_colors.json',
  'tarkett_sport_colors.json',
  'tarkett_documents_index.json',
  'tarkett_wood_collection_index.json',
  'tarkett_lajsne_variants.json',
];

function parseArgs() {
  const args = { dryRun: false, files: [], skipExisting: false };
  for (const a of process.argv.slice(2)) {
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--skip-existing') args.skipExisting = true;
    else if (a.startsWith('--file=')) args.files.push(a.split('=')[1]);
  }
  return args;
}

// Storage putanja iz info-a. Kolizijski-bezbedno (vidi hm.destPathFor): bez-ekstenzije
// Tarkett dokumenti dobijaju jedinstven stem iz putanje umesto deljenog 'specifications'.
function destPath(info) {
  return hm.destPathFor(info, DEST_PREFIX, core.slugify);
}

// Sanity guard: dva različita izvorna URL-a NE SMEJU mapirati na istu storage putanju
// (inače upsert:true prepisuje i servira pogrešan dokument). Pokreni pre migracije.
function assertNoDestCollisions(infos) {
  const byDest = new Map();
  for (const info of infos) {
    const dp = destPath(info);
    const prev = byDest.get(dp);
    if (prev && prev !== info.clean) {
      throw new Error(`destPath kolizija: "${prev}" i "${info.clean}" → ${dp}`);
    }
    byDest.set(dp, info.clean);
  }
}

async function migrateImage(supabase, manifest, info) {
  const mKey = `asset:${info.clean}`;
  if (manifest.has(mKey)) return manifest.get(mKey).publicUrl;
  // probaj XXL, fallback na original
  let buffer;
  try { buffer = await core.downloadAsset(info.xxlFetch || info.xxlUrl); }
  catch { buffer = await core.downloadAsset(info.fallbackFetch || info.fallbackUrl); }
  const meta = await core.withTimeout(sharp(buffer).metadata(), 20000, `sharp ${info.basename}`);
  if (!meta.width || meta.width < MIN_IMG_WIDTH) throw new Error(`slika ${meta.width || '?'}px < ${MIN_IMG_WIDTH}px`);
  const publicUrl = await core.uploadToBucket(supabase, IMAGES_BUCKET, destPath(info), buffer);
  manifest.record(mKey, { publicUrl });
  return publicUrl;
}

async function migratePdf(supabase, manifest, info) {
  const mKey = `asset:${info.clean}`;
  if (manifest.has(mKey)) return manifest.get(mKey).publicUrl;
  // HEAD provera veličine (da ne preuzimamo 50MB uzalud)
  let size = 0;
  const fetchUrl = info.cleanFetch || info.clean;
  try {
    const head = await core.withTimeout(fetch(fetchUrl, { method: 'HEAD', headers: core.BROWSER_HEADERS }), 20000, `head ${info.basename}`);
    size = Number(head.headers.get('content-length') || 0);
  } catch { /* ako HEAD padne, probaćemo download pa upload */ }
  if (size > MAX_PDF_BYTES) { const e = new Error(`PDF ${(size / 1048576).toFixed(1)}MB > limit`); e.oversized = true; throw e; }
  const buffer = await core.downloadAsset(fetchUrl);
  if (!buffer.slice(0, 5).toString().startsWith('%PDF')) throw new Error('nije PDF');
  if (buffer.length > MAX_PDF_BYTES) { const e = new Error(`PDF ${(buffer.length / 1048576).toFixed(1)}MB > limit`); e.oversized = true; throw e; }
  const publicUrl = await core.uploadToBucket(supabase, DOCS_BUCKET, destPath(info), buffer);
  manifest.record(mKey, { publicUrl });
  return publicUrl;
}

(async () => {
  const args = parseArgs();
  const manifest = core.loadManifest('migrate-tarkett');
  const supabase = args.dryRun ? null : core.getSupabase();
  const targets = TARGET_FILES.filter((f) => args.files.length === 0 || args.files.includes(f));

  // 1) Sakupi sve jedinstvene URL-ove iz ciljnih fajlova
  const fileStrings = new Map();
  const allUrls = new Set();
  for (const f of targets) {
    const p = path.join(DATA_DIR, f);
    if (!fs.existsSync(p)) { console.log(`⚠️  nema ${f}`); continue; }
    const s = fs.readFileSync(p, 'utf8');
    fileStrings.set(f, s);
    for (const u of hm.extractTarkettUrls(s)) allUrls.add(u);
  }
  console.log(`🎯 fajlova: ${targets.length} | jedinstvenih Tarkett URL-ova: ${allUrls.size}${args.dryRun ? ' (DRY-RUN)' : ''}`);

  // 1b) Fail-fast: nijedna dva izvora ne smeju mapirati na istu storage putanju.
  const migratableInfos = [...allUrls].map((u) => hm.classifyTarkettUrl(u)).filter((i) => i.type !== 'other');
  assertNoDestCollisions(migratableInfos);

  // 2) Migriraj svaki jedinstveni asset → URL mapa. Paralelno (worker-pool) jer je posao
  // mrežno-vezan (download+upload); CONCURRENCY radnika vuče iz zajedničkog reda. JS je
  // jednonitni → idx++/push/brojači su bezbedni bez zaključavanja.
  const urlMap = {};
  const pending = [];
  const urlList = [...allUrls];
  const CONCURRENCY = args.dryRun ? 1 : 8;
  let idx = 0, done = 0, img = 0, pdf = 0;

  async function worker() {
    while (idx < urlList.length) {
      const url = urlList[idx++];
      const info = hm.classifyTarkettUrl(url);
      if (info.type === 'other') { pending.push({ url, reason: 'nepoznat tip' }); continue; }
      if (args.dryRun) { (info.type === 'image' ? img++ : pdf++); continue; }
      try {
        // Tvrdi per-asset plafon (120s) povrh internih timeout-a: zastao socket body-read može
        // da prođe interne timeout-e; Promise.race vs setTimeout sigurno prekida (event loop živ).
        // PDF-ovi do 150MB (oversized brošure/grading book) sa sporog Akamai-ja traže duži plafon;
        // slike ostaju na 120s. (Zastao socket i dalje sigurno prekida, samo kasnije.)
        const publicUrl = await core.withTimeout(
          info.type === 'image'
            ? migrateImage(supabase, manifest, info)
            : migratePdf(supabase, manifest, info),
          info.type === 'image' ? 120000 : 600000,
          `asset ${info.basename}`,
        );
        urlMap[url] = publicUrl;
        info.type === 'image' ? img++ : pdf++;
        if (++done % 25 === 0) { manifest.save(); console.log(`   … ${done}/${urlList.length} (img ${img} pdf ${pdf} pending ${pending.length})`); }
      } catch (err) {
        if (err.oversized) pending.push({ url, reason: err.message });
        else { pending.push({ url, reason: err.message }); console.log(`   ⚠️ ${info.basename}: ${err.message}`); }
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  if (!args.dryRun) manifest.save();
  console.log(`✅ migrirano: slike ${img} | pdf ${pdf} | pending ${pending.length}`);

  if (args.dryRun) {
    console.log(`(dry-run: slike ${img}, pdf ${pdf}, other/pending ${pending.length})`);
    return;
  }

  // 3) Prepiši sve pojave u svakom fajlu preko mape (oversized/pending ostaju kako jesu)
  for (const f of targets) {
    const s = fileStrings.get(f);
    if (!s) continue;
    const out = hm.rewriteString(s, urlMap);
    if (out !== s) core.writeJsonWithBackup(path.join(DATA_DIR, f), JSON.parse(out), `migrate-${f.replace(/\.json$/, '')}`);
  }

  // 4) Upiši/azuriraj pending listu (dozvoljeni izuzetak za contract test)
  const prevPending = fs.existsSync(PENDING_PATH) ? JSON.parse(fs.readFileSync(PENDING_PATH, 'utf8')) : [];
  const mergedByUrl = new Map(prevPending.map((x) => [x.url, x]));
  for (const x of pending) mergedByUrl.set(x.url, x);
  // ukloni iz pending one koji su sada migrirani (re-run posle dizanja limita)
  for (const u of Object.keys(urlMap)) mergedByUrl.delete(u);
  fs.writeFileSync(PENDING_PATH, JSON.stringify([...mergedByUrl.values()], null, 2));
  console.log(`📝 pending lista: ${mergedByUrl.size} (public/data/tarkett-migration-pending.json)`);
})().catch((err) => { console.error('❌', err); process.exit(1); });
