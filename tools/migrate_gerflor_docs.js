// Migracija Gerflor cdn.gerflor.com dokumenata (PDF/docx/doc) u Supabase — dovršetak S4
// za „ostale izvore". Reuse ingest-core + hotlink-migrate (encodeFetchUrl/rewriteString).
// Worker-pool (8) + tvrdi per-asset 120s plafon + manifest resume (lekcije iz Tarkett migracije).
const fs = require('fs');
const path = require('path');
const core = require('./lib/ingest-core.js');
const hm = require('./lib/hotlink-migrate.js');

const DOCS_BUCKET = 'product-documents';
const IMAGES_BUCKET = 'product-images';
const DEST_PREFIX = 'products/gerflor-migrated';
const PENDING_PATH = path.join(process.cwd(), 'public', 'data', 'gerflor-migration-pending.json');
const CONCURRENCY = 8;

// Mešavina public/data JSON i lib/* TS — sve tekstualni fajlovi, string-rewrite radi.
const TARGET_FILES = [
  'public/data/gerflor_documents_raw.json',
  'public/data/documents_index.json',
  'public/data/welding_accessories.json',
  'lib/data/manual-collection-products.ts',
  'lib/utils/productDataLoader.ts',
];

// Hvata ceo URL do navodnika/backslash-a (uključujući LITERALNE razmake u putanji).
const HOST_RE = /https?:\/\/cdn\.gerflor\.com\/[^"'\\\n]+/g;

function parseArgs() {
  const a = { dryRun: false };
  for (const x of process.argv.slice(2)) if (x === '--dry-run') a.dryRun = true;
  return a;
}

// destPath: jedinstvena putanja iz /media/<segmenti>/<ime>.<ext>. Slike → product-images,
// ostalo → product-documents. id-segmenti čine putanju jedinstvenom bez obzira na strukturu.
function destPathFor(url) {
  const clean = url.split('?')[0];
  const decoded = decodeURIComponent(clean);
  const basename = decoded.split('/').pop() || 'asset';
  const after = clean.split('/media/')[1] || '';
  const idParts = after.split('/').slice(0, -1).join('-'); // sve sem fajla (npr. 2-55420)
  const dot = basename.lastIndexOf('.');
  const stem = dot > 0 ? basename.slice(0, dot) : basename;
  let ext = (dot > 0 ? basename.slice(dot + 1) : 'bin').toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  const isImg = /^(jpg|png|webp|gif)$/.test(ext);
  const prefix = isImg ? `${DEST_PREFIX}/img` : DEST_PREFIX;
  return { path: `${prefix}/${core.slugify(idParts)}-${core.slugify(stem)}.${ext}`, bucket: isImg ? IMAGES_BUCKET : DOCS_BUCKET };
}
function destPath(url) { return destPathFor(url).path; } // za grupisanje po asset-u

async function migrateDoc(supabase, manifest, url) {
  const mKey = `asset:${url}`;
  if (manifest.has(mKey)) return manifest.get(mKey).publicUrl;
  const buffer = await core.downloadAsset(hm.encodeFetchUrl(url));
  if (buffer.length < 100) throw new Error('prazan/nevalidan odgovor');
  const { path: dest, bucket } = destPathFor(url);
  const publicUrl = await core.uploadToBucket(supabase, bucket, dest, buffer);
  manifest.record(mKey, { publicUrl });
  return publicUrl;
}

(async () => {
  const args = parseArgs();
  const manifest = core.loadManifest('migrate-gerflor');
  const supabase = args.dryRun ? null : core.getSupabase();

  const fileStrings = new Map();
  const allUrls = new Set();
  for (const f of TARGET_FILES) {
    if (!fs.existsSync(f)) { console.log(`⚠️  nema ${f}`); continue; }
    const s = fs.readFileSync(f, 'utf8');
    fileStrings.set(f, s);
    const re = new RegExp(HOST_RE.source, 'g');
    let m;
    while ((m = re.exec(s))) allUrls.add(m[0]);
  }
  // Grupiši po destPath = jedinstven asset. Varijante istog URL-a (npr. sa ?__hstc query)
  // dele putanju → migriraju se jednom, ali se SVE varijante prepišu na isti Supabase URL.
  const byDest = new Map();
  for (const u of allUrls) {
    const d = destPath(u);
    if (!byDest.has(d)) byDest.set(d, { canonical: u, variants: [] });
    const e = byDest.get(d);
    e.variants.push(u);
    if (!u.includes('?') && e.canonical.includes('?')) e.canonical = u; // bez query kao canonical
  }
  const assets = [...byDest.values()];
  console.log(`🎯 jedinstvenih Gerflor asseta: ${assets.length} (URL varijanti: ${allUrls.size})${args.dryRun ? ' (DRY-RUN)' : ''}`);

  const urlMap = {};
  const pending = [];
  let idx = 0, done = 0;
  async function worker() {
    while (idx < assets.length) {
      const { canonical, variants } = assets[idx++];
      if (args.dryRun) { done++; continue; }
      try {
        const publicUrl = await core.withTimeout(migrateDoc(supabase, manifest, canonical), 120000, `doc ${canonical.slice(-30)}`);
        for (const v of variants) urlMap[v] = publicUrl;
        if (++done % 25 === 0) { manifest.save(); console.log(`   … ${done}/${assets.length} (pending ${pending.length})`); }
      } catch (err) {
        pending.push({ url: canonical, reason: err.message });
        console.log(`   ⚠️ ${decodeURIComponent(canonical.split('/').pop()).slice(0, 40)}: ${err.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: args.dryRun ? 1 : CONCURRENCY }, () => worker()));
  if (!args.dryRun) manifest.save();
  console.log(`✅ migrirano: ${Object.keys(urlMap).length} | pending: ${pending.length}`);
  if (args.dryRun) return;

  for (const f of TARGET_FILES) {
    const s = fileStrings.get(f);
    if (!s) continue;
    const out = hm.rewriteString(s, urlMap);
    if (out !== s) {
      fs.copyFileSync(f, path.join(process.cwd(), 'output', `${path.basename(f)}-gerflor-backup-${core.cacheBustStamp()}`));
      fs.writeFileSync(f, out);
      console.log(`   ✏️  prepisano: ${f}`);
    }
  }
  const prev = fs.existsSync(PENDING_PATH) ? JSON.parse(fs.readFileSync(PENDING_PATH, 'utf8')) : [];
  const byUrl = new Map(prev.map((x) => [x.url, x]));
  for (const x of pending) byUrl.set(x.url, x);
  for (const u of Object.keys(urlMap)) byUrl.delete(u);
  fs.writeFileSync(PENDING_PATH, JSON.stringify([...byUrl.values()], null, 2));
  console.log(`📝 pending: ${byUrl.size} (${PENDING_PATH})`);
})().catch((e) => { console.error('❌', e); process.exit(1); });
