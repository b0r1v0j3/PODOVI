// Migracija lajsne portal-dokumenata (www.tarkett.rs) → naša Supabase baza.
// Dva tipa: /specifications (čist PDF) i /format-table (PDF base64-umotan u JSON string).
// Princip projekta: preuzimamo SVE u našu bazu, bez hotlinkova.
//   node tools/migrate_lajsne_portal_docs.js [--dry-run]
const fs = require('fs');
const path = require('path');
const core = require('./lib/ingest-core.js');

const DATA = path.join(process.cwd(), 'public', 'data', 'tarkett_lajsne_variants.json');
const DOCS_BUCKET = 'product-documents';
const DEST_PREFIX = 'products/tarkett-migrated';
const PORTAL_RE = /^https?:\/\/www\.tarkett\.rs\/.*\/pdf\/collection-(C\d+)-([^/]+)\/(specifications|format-table)\b/i;
const DRY = process.argv.includes('--dry-run');

// Vrati PDF bafer za portal URL: /specifications je čist PDF; /format-table je JSON
// string sa base64 PDF-om unutra.
async function fetchPdf(url, kind) {
  const r = await core.withTimeout(fetch(url, { headers: core.BROWSER_HEADERS }), 60000, `fetch ${kind}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  if (kind === 'format-table') {
    const txt = await r.text();
    const b64 = JSON.parse(txt); // bare JSON string = base64 PDF
    if (typeof b64 !== 'string') throw new Error('format-table nije base64 string');
    const buf = Buffer.from(b64, 'base64');
    if (!buf.slice(0, 5).toString().startsWith('%PDF')) throw new Error('dekodirano nije PDF');
    return buf;
  }
  const buf = Buffer.from(await r.arrayBuffer());
  if (!buf.slice(0, 5).toString().startsWith('%PDF')) throw new Error('odgovor nije PDF');
  return buf;
}

(async () => {
  const d = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const supabase = DRY ? null : core.getSupabase();
  const manifest = core.loadManifest('migrate-lajsne-portal');

  // Sakupi sve (doc, collection) parove koji su još na portalu.
  const jobs = [];
  for (const c of d.collections) {
    for (const doc of (c.documents || [])) {
      const m = (doc.url || '').match(PORTAL_RE);
      if (m) jobs.push({ doc, ccode: m[1], cslug: m[2], kind: m[3].toLowerCase() });
    }
  }
  console.log(`🎯 portal dokumenata za migraciju: ${jobs.length}${DRY ? ' (DRY-RUN)' : ''}`);

  // Kolizijski-bezbedna putanja: C-kod je jedinstven po kolekciji + tip dokumenta.
  const seen = new Map();
  for (const j of jobs) {
    j.dest = `${DEST_PREFIX}/lajsne-${j.ccode.toLowerCase()}-${core.slugify(j.cslug).slice(0, 60)}-${j.kind}.pdf`;
    const prev = seen.get(j.dest);
    if (prev && prev !== j.doc.url) throw new Error(`destPath kolizija: ${j.dest}`);
    seen.set(j.dest, j.doc.url);
  }

  let ok = 0, fail = 0;
  const CONC = DRY ? 1 : 6;
  let idx = 0;
  async function worker() {
    while (idx < jobs.length) {
      const j = jobs[idx++];
      const mKey = `lajsne:${j.doc.url}`;
      if (manifest.has(mKey)) { j.doc.url = manifest.get(mKey).publicUrl; ok++; continue; }
      if (DRY) { ok++; continue; }
      try {
        const buf = await fetchPdf(j.doc.url, j.kind);
        const publicUrl = await core.uploadToBucket(supabase, DOCS_BUCKET, j.dest, buf);
        j.doc.url = publicUrl;
        manifest.record(mKey, { publicUrl });
        ok++;
        if (ok % 10 === 0) { manifest.save(); console.log(`   … ${ok}/${jobs.length}`); }
      } catch (e) {
        fail++; console.log(`   ⚠️ ${j.ccode}/${j.kind}: ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONC }, () => worker()));
  if (!DRY) manifest.save();
  console.log(`✅ migrirano: ${ok} | greške: ${fail}`);

  if (!DRY && ok > 0) {
    core.writeJsonWithBackup(DATA, d, 'migrate-lajsne-portal');
    console.log('💾 tarkett_lajsne_variants.json ažuriran');
  }
})().catch((e) => { console.error('❌', e); process.exit(1); });
