// Migracija Gerflor cdn.gerflor.com dokumenata (PDF/docx/doc) u Supabase — dovršetak S4
// za „ostale izvore". Reuse ingest-core + hotlink-migrate (encodeFetchUrl/rewriteString).
// Worker-pool (8) + tvrdi per-asset 120s plafon + manifest resume (lekcije iz Tarkett migracije).
const fs = require('fs');
const path = require('path');
const core = require('./lib/ingest-core.js');
const hm = require('./lib/hotlink-migrate.js');

const DOCS_BUCKET = 'product-documents';
const DEST_PREFIX = 'products/gerflor-migrated';
const PENDING_PATH = path.join(process.cwd(), 'public', 'data', 'gerflor-migration-pending.json');
const CONCURRENCY = 8;

// Mešavina public/data JSON i lib/data TS — sve tekstualni fajlovi, string-rewrite radi.
const TARGET_FILES = [
  'public/data/gerflor_documents_raw.json',
  'public/data/documents_index.json',
  'public/data/welding_accessories.json',
  'lib/data/manual-collection-products.ts',
];

const HOST_RE = /https?:\/\/cdn\.gerflor\.com\/[^"'\\ ]+/g;

function parseArgs() {
  const a = { dryRun: false };
  for (const x of process.argv.slice(2)) if (x === '--dry-run') a.dryRun = true;
  return a;
}

// destPath: /media/2/<id>/<ime>.<ext> → <id>-<slug>.<ext> (id čini putanju jedinstvenom).
function destPath(url) {
  const clean = url.split('?')[0];
  const decoded = decodeURIComponent(clean);
  const basename = decoded.split('/').pop() || 'dokument';
  const idMatch = clean.match(/\/media\/\d+\/(\d+)\//);
  const id = idMatch ? idMatch[1] : 'x';
  const dot = basename.lastIndexOf('.');
  const stem = dot > 0 ? basename.slice(0, dot) : basename;
  const ext = (dot > 0 ? basename.slice(dot + 1) : 'bin').toLowerCase();
  return `${DEST_PREFIX}/${id}-${core.slugify(stem)}.${ext}`;
}

async function migrateDoc(supabase, manifest, url) {
  const mKey = `asset:${url}`;
  if (manifest.has(mKey)) return manifest.get(mKey).publicUrl;
  const buffer = await core.downloadAsset(hm.encodeFetchUrl(url));
  if (buffer.length < 100) throw new Error('prazan/nevalidan odgovor');
  const publicUrl = await core.uploadToBucket(supabase, DOCS_BUCKET, destPath(url), buffer);
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
