// Primeni srpske prevode Gerflor engleskih opisa (iz translate-gerflor-descs workflow-a).
// Čita workflow .output, mapira {file,key,sr} → opis kolekcije + propagira na boje + short/category.
// Čisti HTML entitete (&lt;→<, &gt;→>, &amp;→&) i literalne \n.
const fs = require('fs');
const path = require('path');
const core = require('./lib/ingest-core.js');

const OUT = process.argv[2];
if (!OUT || !fs.existsSync(OUT)) { console.error('Daj putanju do workflow .output fajla'); process.exit(1); }

let raw = fs.readFileSync(OUT, 'utf8');
let parsed;
try { parsed = JSON.parse(raw); } catch (e) {
  const m = raw.match(/"translations"\s*:\s*\[[\s\S]*\]/);
  parsed = JSON.parse('{' + (m ? m[0] : '"translations":[]') + '}');
}
const translations = (parsed.result && parsed.result.translations) || parsed.translations || [];
console.log('prevoda učitano:', translations.length);

function clean(s) {
  return String(s || '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\\n/g, '\n')
    .trim();
}

const byFile = {};
for (const t of translations) { (byFile[t.file] = byFile[t.file] || []).push(t); }

let total = 0;
for (const [file, items] of Object.entries(byFile)) {
  const fp = path.join(process.cwd(), 'public', 'data', file);
  if (!fs.existsSync(fp)) { console.log('⚠️ nema fajla', file); continue; }
  const d = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const colls = Array.isArray(d.collections) ? d.collections : [];
  const cols = Array.isArray(d.colors) ? d.colors : [];
  let applied = 0;
  for (const t of items) {
    const sr = clean(t.sr);
    if (!sr) continue;
    // 1) collections[] po slug
    const c = colls.find((x) => x.slug === t.key);
    if (c) {
      c.description = sr;
      if (typeof c.shortDescription === 'string') c.shortDescription = sr;
      if (typeof c.categoryDescription === 'string') c.categoryDescription = sr;
      for (const col of (c.colors || [])) { if (col && typeof col.description === 'string') col.description = sr; }
      applied++; continue;
    }
    // 2) colors[] po collection / collection_slug / slug
    const matched = cols.filter((x) => x.collection === t.key || x.collection_slug === t.key || x.slug === t.key);
    if (matched.length) {
      for (const col of matched) { if (typeof col.description === 'string' || col.description === undefined) col.description = sr; }
      applied++; continue;
    }
    console.log('   ⚠️ nije nađena kolekcija', t.key, 'u', file);
  }
  if (applied > 0) {
    core.writeJsonWithBackup(fp, d, 'gerflor-translations-' + file.replace(/\.json$/, ''));
    console.log('✏️ ' + file + ': primenjeno ' + applied + '/' + items.length);
    total += applied;
  }
}
console.log('UKUPNO primenjeno:', total);
