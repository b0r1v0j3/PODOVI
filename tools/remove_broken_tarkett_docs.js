// Uklanja POLOMLJENE generisane Tarkett doc-linkove iz public/data/*.json.
// Ciljani su samo /docs/<locale>/pdf/... endpoint-i iz pending liste koji NISU oversized
// (format-table = JSON, deo specifikacija = ne-PDF/404 — već polomljeni na sajtu, nisu pravi fajlovi).
// Oversized PDF-ovi i prolazne greške (timeout/upload) se NE diraju (migriraju se kasnije).
// Uklanja i string-reference i {title,url,type} objekte. Backup preko writeJsonWithBackup.
const fs = require('fs');
const path = require('path');
const core = require('./lib/ingest-core.js');

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const PENDING_PATH = path.join(DATA_DIR, 'tarkett-migration-pending.json');

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

const pending = fs.existsSync(PENDING_PATH) ? JSON.parse(fs.readFileSync(PENDING_PATH, 'utf8')) : [];
// Skup za uklanjanje: generisani /docs/<locale>/pdf/ endpoint-i (format-table/specifications),
// koji NISU oversized (oversized se zadržava za migraciju posle dizanja limita).
const GENERATED_RE = /\/docs\/[a-z]{2}_[A-Z]{2}\/pdf\//;
const removeSet = new Set(
  pending.filter((x) => GENERATED_RE.test(x.url) && !/> limit/.test(x.reason || '')).map((x) => x.url),
);

function isRemovableUrl(u) {
  return typeof u === 'string' && removeSet.has(u);
}

let removed = 0;
function clean(node) {
  if (Array.isArray(node)) {
    const kept = [];
    for (const el of node) {
      if (isRemovableUrl(el)) { removed++; continue; }
      if (el && typeof el === 'object' && !Array.isArray(el) && isRemovableUrl(el.url)) { removed++; continue; }
      kept.push(clean(el));
    }
    return kept;
  }
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) node[k] = clean(node[k]);
    return node;
  }
  return node;
}

(function main() {
  console.log(`🧹 polomljenih generisanih doc-URL-ova za uklanjanje (jedinstvenih): ${removeSet.size}`);
  let totalRemoved = 0;
  for (const f of TARGET_FILES) {
    const p = path.join(DATA_DIR, f);
    if (!fs.existsSync(p)) continue;
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    removed = 0;
    const cleaned = clean(data);
    if (removed > 0) {
      core.writeJsonWithBackup(p, cleaned, `remove-broken-docs-${f.replace(/\.json$/, '')}`);
      console.log(`   ${f}: uklonjeno ${removed} referenci`);
      totalRemoved += removed;
    }
  }
  // Ukloni te URL-ove iz pending liste (više nisu u katalogu).
  const remainingPending = pending.filter((x) => !removeSet.has(x.url));
  fs.writeFileSync(PENDING_PATH, JSON.stringify(remainingPending, null, 2));
  console.log(`✅ ukupno uklonjeno referenci: ${totalRemoved} | pending sada: ${remainingPending.length}`);
})();
