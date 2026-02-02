/**
 * Validator: proverava da svaki images[].url (koji počinje sa /) ima odgovarajući fajl u public/.
 * Ako neki fajl nedostaje, izlaz sa greškom i listom (build/CI treba da padne).
 * NE DIRATI postojeće putanje parketa/laminata pri dodavanju novih kolekcija.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

// Izvorni fajlovi koji sadrže product images (url putanje)
const dataFiles = [
  path.join(projectRoot, 'lib/data/tarkett-products.ts'),
  path.join(projectRoot, 'lib/data/mock-data.ts'),
];

// Regex: "url": "/images/..." ili "url": "/products/..."
const urlRegex = /"url":\s*"(\/(?:images|products)\/[^"]+)"/g;

function extractUrls(content) {
  const urls = [];
  let m;
  while ((m = urlRegex.exec(content)) !== null) {
    const url = m[1];
    // samo lokalne putanje (ne https:)
    if (url.startsWith('/')) urls.push(url);
  }
  return urls;
}

const missing = [];
const checked = new Set();

for (const filePath of dataFiles) {
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  const urls = extractUrls(content);
  for (const url of urls) {
    if (checked.has(url)) continue;
    checked.add(url);
    const fullPath = path.join(publicDir, url.replace(/^\//, ''));
    if (!fs.existsSync(fullPath)) {
      missing.push({ url, file: path.basename(filePath) });
    }
  }
}

if (missing.length > 0) {
  console.error('validate-images: NEDOSTAJU SLIKE (404 na sajtu ako se deploy-uje):\n');
  missing.forEach(({ url, file }) => console.error(`  ${url}  (u ${file})`));
  console.error(`\nUkupno: ${missing.length} fajlova nedostaje. Vrati ih iz git-a ili dodaj u public/.`);
  process.exit(1);
}

console.log('validate-images: sve putanje slika postoje u public/.');
process.exit(0);
