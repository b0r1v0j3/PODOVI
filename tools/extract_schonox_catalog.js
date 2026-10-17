/* Official European/global floor/tile catalog. Run with --discover, then without
 * flags after reviewing tools/schonox-copy.json. Uploads images/PDFs to our Supabase buckets. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { parse } = require('next/dist/compiled/node-html-parser');
const { getSupabase, uploadToBucket } = require('./lib/ingest-core');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://deu.sika.com';
const ENTRY = ['floor-range', 'tile-range', 'marine-range'].map(p => `${BASE}/schonox-global/en/${p}.html`);
const CACHE = path.join(ROOT, 'output/schonox/pages');
const STAGE = path.join(ROOT, 'output/schonox/assets');
const BUCKETS = { image: 'product-images', document: 'product-documents' };
const MANIFEST = path.join(ROOT, 'docs/products/schonox-source-manifest.json');
const DATASET = path.join(ROOT, 'public/data/schonox_products.json');
const DOCUMENT_EXCLUSIONS = {
  'https://deu.sika.com/schonox-global/dam/dms/global-schoenox/g/ce-dop-schoenox-hs8-de211501-en138132002-dede.pdf': 'Manufacturer URL and MIME label say PDF but bytes are an Office ZIP package (PK header, [Content_Types].xml). Not rendered as a PDF. Verified 2026-10-17.',
  'https://deu.sika.com/schonox-global/dam/dms/global-schoenox/y/edc-marineconformschoenoxq9w.pdf': 'Manufacturer file is byte-identical to the SCHÖNOX Q6 marine conformity declaration and names only SCHÖNOX Q6, not Q9 W. Verified 2026-10-17.',
};
const clean = text => String(text || '').replace(/\s+/g, ' ').trim();
const text = node => clean(node?.structuredText || node?.textContent);
const slugify = value => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f®]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const absolute = value => new URL(value, BASE).href;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const allowedPage = url => /^https:\/\/deu\.sika\.com\/schonox-global\/en\/(floor-range|tile-range|marine-range)(\/[^?#]*)?\.html$/.test(url);
const writeJson = (file, data) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n'); };

function localizePackaging(value) {
  return clean(value).replace(/Material No\.\s*/gi, 'Broj materijala: ').replace(/EAN\s*/g, 'EAN: ')
    .replace(/Packsize\s*/g, 'Pakovanje: ').replace(/Packaging unit/g, 'Transportno pakovanje:')
    .replace(/-kg-(?:canister|jerry can|can)\b/g, ' kg, kanister').replace(/kg-jerry can/g, 'kg, kanister')
    .replace(/-?kg-(?:combined packaging|combined package|combined tin bucket)/g, ' kg, kombinovano pakovanje')
    .replace(/-?kg-(?:pail|bucket|tin bucket)/g, ' kg, kanta').replace(/-kg-tin can/g, ' kg, limenka')
    .replace(/-kg-(?:sack|bag|PE-bag)/g, ' kg, vreća').replace(/-kg-bottle/g, ' kg, boca')
    .replace(/-ml-cartridge/g, ' ml, kartuša').replace(/-m²\/(\d+)-rolls-pallet/g, ' m², rolna ($1 rolni/paleta)').replace(/-m²-roll/g, ' m², rolna').replace(/-m-roll/g, ' m, rolna')
    .replace(/\/pallet|\/rolls-pallet/g, '/paleta').replace(/\/box/g, '/kutija').replace(/\/roll?\b/g, '/rolna')
    .replace(/\bcomp\./g, 'komp.').replace(/\bcomponent\b/gi, 'komponenta').replace(/\bresin\b/g, 'smola')
    .replace(/\bhardener inside\b/g, 'učvršćivač je unutra').replace(/\bhardener\b/g, 'učvršćivač')
    .replace(/\bColour:?|\bcolor\b/gi, 'Boja:').replace(/\bwhite\b/gi, 'bela').replace(/\bsilvergrey\b/gi, 'srebrnosiva')
    .replace(/\btransparent\b/g, 'providna').replace(/\bpowder and\b/g, 'prah i').replace(/\bliquid\b/g, 'tečnost')
    .replace(/\bplastic bottles in a box\b/g, 'plastičnih boca u kutiji').replace(/\bin a case\b/g, 'u koferu')
    .replace(/\bin box\b/g, 'u kutiji').replace(/\bin pail\b/g, 'u kanti').replace(/\bbox:/gi, 'Kutija:')
    .replace(/\bset\b/gi, 'komplet').replace(/\bpiece\b/g, 'komad').replace(/\bTUBE\b/g, 'tuba')
    .replace(/\broll\b/g, 'rolna').replace(/\bwidth\b/g, 'širina').replace(/boxes with (\d+) rolls each/g, 'kutija sa po $1 rolni')
    .replace(/Container with (\d+) wipes/g, 'Posuda sa $1 krpa');
}

async function fetchBytes(url) {
  let failure;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) { failure = error; }
  }
  throw new Error(`${url}: ${failure.message}`);
}

async function page(url) {
  const file = path.join(CACHE, `${hash(url)}.html`);
  fs.mkdirSync(CACHE, { recursive: true });
  // Cache is an explicit same-run/retry staging area; --refresh refetches it.
  if (!fs.existsSync(file) || process.argv.includes('--refresh')) fs.writeFileSync(file, await fetchBytes(url));
  return parse(fs.readFileSync(file, 'utf8'));
}

async function mapLimit(items, fn, limit = 4) {
  let next = 0;
  const results = new Array(items.length);
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const index = next++; results[index] = await fn(items[index], index); }
  }));
  return results;
}

function productData(dom, url, groups) {
  const main = dom.querySelector('main');
  const name = text(main?.querySelector('h1'));
  assert(name, `Missing product title: ${url}`);
  const sections = {};
  for (const node of main.querySelectorAll('.productcontent')) {
    const title = text(node.querySelector('h3'));
    if (title) sections[title] = text(node.querySelector('span'));
  }
  const documents = main.querySelectorAll('input[data-document-path]').map(node => ({
    url: absolute(node.getAttribute('data-document-path')),
    title: node.getAttribute('data-document-title'),
    type: node.getAttribute('data-document-type'),
    language: node.getAttribute('data-document-language'),
    version: node.getAttribute('data-document-version'),
  }));
  return {
    name, slug: slugify(name).startsWith('schonox-') ? slugify(name) : `schonox-${slugify(name)}`, canonicalUrl: url, groups,
    shortDescription: text(main.querySelector('.cmp-product__description--short')),
    description: text(main.querySelector('[itemprop="description"]')),
    sections,
    images: [...new Set(main.querySelectorAll('.cmp-product__media img').map(node => node.getAttribute('src')).filter(Boolean))],
    documents: [...new Map(documents.map(doc => [doc.url, doc])).values()],
  };
}

async function discover() {
  const discoveredAt = new Date().toISOString();
  const groups = new Set();
  for (const url of ENTRY) {
    const dom = await page(url);
    for (const node of dom.querySelectorAll('main a[href]')) {
      const link = absolute(node.getAttribute('href'));
      if (allowedPage(link) && link.split('/').length === 7) groups.add(link);
    }
  }
  assert(groups.size >= 25, `Incomplete discovery: ${groups.size} category pages`);
  const listings = await mapLimit([...groups].sort(), async url => {
    const dom = await page(url);
    const urls = [...new Set(dom.querySelectorAll('main a[href]').map(node => absolute(node.getAttribute('href'))).filter(link => allowedPage(link) && link.split('/').length >= 8))];
    const inline = [];
    if (url.endsWith('/ancillaries.html')) {
      for (const heading of dom.querySelectorAll('main h2')) {
        if (!text(heading).includes('SCHÖNOX')) continue;
        const parent = heading.closest('.cell');
        assert(parent, `Missing ancillary content: ${text(heading)}`);
        const imageObjects = parent.querySelectorAll('script[type="application/ld+json"]').map(node => JSON.parse(node.textContent)).filter(value => value['@type'] === 'ImageObject');
        inline.push({ name: text(heading), slug: slugify(text(heading)), canonicalUrl: url, inlineHeading: text(heading), groups: [url], shortDescription: text(parent.querySelector('.cmp-text')), description: '', sections: {}, images: imageObjects.map(image => image.contentUrl), documents: [] });
      }
    }
    assert(dom.querySelector('main'), `Missing category main content: ${url}`);
    return { url, title: text(dom.querySelector('main h1')) || text(dom.querySelector('title')), productUrls: urls, inlineProducts: inline, status: urls.length || inline.length ? 'listed' : 'official_page_empty' };
  });
  const productGroups = new Map();
  for (const listing of listings) for (const url of listing.productUrls) productGroups.set(url, [...(productGroups.get(url) || []), listing.url]);
  const pages = await mapLimit([...productGroups], async ([url, itemGroups]) => productData(await page(url), url, itemGroups));
  const records = [...pages, ...listings.flatMap(listing => listing.inlineProducts)].sort((a, b) => Number(a.canonicalUrl.includes('marine-range')) - Number(b.canonicalUrl.includes('marine-range')));
  const byName = new Map();
  const duplicates = [];
  for (const record of records) {
    const previous = byName.get(record.slug);
    if (previous) {
      duplicates.push({ name: record.name, canonicalUrl: previous.canonicalUrl, alternateUrl: record.canonicalUrl });
      previous.alternateUrls.push(record.canonicalUrl);
      previous.groups = [...new Set([...previous.groups, ...record.groups])];
      previous.documents = [...new Map([...previous.documents, ...record.documents].map(doc => [doc.url, doc])).values()];
    } else byName.set(record.slug, { ...record, alternateUrls: [] });
  }
  const result = { discoveredAt, entryPoints: ENTRY, listings, duplicates, exclusions: [{ scope: 'US catalogs', reason: 'Different regional formulations are not mixed into this European/global dataset.' }], failures: [], products: [...byName.values()].sort((a, b) => a.name.localeCompare(b.name)) };
  writeJson(path.join(ROOT, 'output/schonox/source.json'), result);
  console.log(JSON.stringify({ groups: listings.length, sourceProductPages: pages.length, inlineEntries: records.length - pages.length, deduplicatedProducts: result.products.length, duplicates: duplicates.length }));
  return result;
}

// Dynamic Media content-negotiates AVIF behind .png URLs; store the format the extension promises
// (social-preview crawlers trust the extension and cannot decode AVIF).
const IMAGE_FORMATS = { '.png': ['89504e47', 'png'], '.jpg': ['ffd8ff', 'jpeg'] };
async function matchImageExtension(file) {
  const format = IMAGE_FORMATS[path.extname(file).toLowerCase()];
  assert(format, `Unsupported image extension: ${file}`);
  const bytes = fs.readFileSync(file);
  if (!bytes.subarray(0, 4).toString('hex').startsWith(format[0])) fs.writeFileSync(file, await require('sharp')(bytes)[format[1]]().toBuffer());
}

async function download(url, relativeFile, kind) {
  assert(/^https:\/\/(deu\.sika\.com|dynamicmedia\.sika\.com|sika\.scene7\.com)\//.test(url), `Unexpected asset host ${url}`);
  const file = path.join(STAGE, relativeFile);
  if (!fs.existsSync(file)) {
    const bytes = await fetchBytes(url);
    if (kind === 'document') assert(bytes.subarray(0, 5).toString() === '%PDF-', `Not a PDF: ${url}`);
    else assert(bytes.length > 100 && !bytes.subarray(0, 100).toString().includes('<html'), `Not an image: ${url}`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, bytes);
  }
  if (kind === 'image') await matchImageExtension(file);
  return { sourceUrl: url, relativeFile, sha256: hash(fs.readFileSync(file)), bytes: fs.statSync(file).size };
}

// Owner rule: product assets live in our Supabase buckets, never in public/ or as hotlinks.
let supabase;
async function publish(relativeFile, kind) {
  const file = path.join(STAGE, relativeFile);
  const storagePath = `schonox/${path.basename(file)}`;
  supabase ||= getSupabase();
  const { publicUrl } = supabase.storage.from(BUCKETS[kind]).getPublicUrl(storagePath).data;
  // shortcut: same byte size = already uploaded; a same-size replacement needs a manual re-upload.
  const head = await fetch(publicUrl, { method: 'HEAD' });
  if (head.ok && Number(head.headers.get('content-length')) === fs.statSync(file).size) return publicUrl;
  return uploadToBucket(supabase, BUCKETS[kind], storagePath, fs.readFileSync(file), { cacheBust: false });
}

async function build(source) {
  const copy = JSON.parse(fs.readFileSync(path.join(__dirname, 'schonox-copy.json'), 'utf8'));
  const previous = new Map((fs.existsSync(DATASET) ? JSON.parse(fs.readFileSync(DATASET, 'utf8')).products : []).map(product => [product.slug, product]));
  const failures = [];
  const assets = [];
  const groupLabels = { primers: 'Prajmeri', 'floor-levelling-compounds': 'Mase za nivelaciju i popravke', 'wall-levelling-compounds': 'Mase za zidove', membranes: 'Hidroizolacija', 'tile-adhesives': 'Lepkovi za pločice', 'floor-tile-adhesives': 'Lepkovi za pločice', 'joint-mortars': 'Mase za fugovanje', screeds: 'Estrisi', 'primary-deck-coveringsscreeds': 'Brodarski estrisi', underlayments: 'Podloge', ancillaries: 'Pomoćni pribor', 'floor-adhesives': 'Lepkovi za podove', 'parquet-adhesives': 'Lepkovi za parket' };
  const documentTitles = { safety_data_sheet: 'Bezbednosni list', product_data_sheet: 'Tehnički list', DOP: 'Izjava o performansama', ecolabel: 'Sertifikat emisija', environmental_product_declaration: 'Ekološka deklaracija (EPD)', declaration_of_conformity: 'Izjava o usaglašenosti' };
  const documentLabel = doc => `${documentTitles[doc.type] || 'Dokument proizvođača'} — ${doc.language?.toUpperCase() || 'EN'}`;
  const products = await mapLimit(source.products, async product => {
    assert(copy[product.slug], `Missing Serbian copy: ${product.slug}`);
    const groups = [...new Set(product.groups.map(url => groupLabels[url.split('/').pop().replace('.html', '')]))];
    assert(groups.every(Boolean), `Unknown product group: ${product.slug}`);
    const images = [];
    const reuse = ['schonox-kh', 'schonox-rm', 'schonox-zm'].includes(product.slug);
    if (reuse) {
      const code = product.slug.replace('schonox-', '');
      const original = path.join(ROOT, '../media-library/products/schoenox', code, `schoenox-${code}-transparent.png`);
      const relative = `images/products/schonox/${product.slug}.png`;
      const target = path.join(STAGE, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(original, target);
      const url = await publish(relative, 'image');
      images.push({ url, alt: product.name });
      assets.push({ productSlug: product.slug, reusedLibraryAsset: path.relative(ROOT, original), url, sha256: hash(fs.readFileSync(target)), bytes: fs.statSync(target).size });
    } else if (product.images.length) {
      try {
        const imageUrl = product.images[0];
        const extension = path.extname(new URL(imageUrl).pathname) || '.jpg';
        const { relativeFile, ...asset } = await download(imageUrl, `images/products/schonox/${product.slug}${extension}`, 'image');
        asset.url = await publish(relativeFile, 'image');
        images.push({ url: asset.url, alt: product.name }); assets.push({ productSlug: product.slug, ...asset });
      } catch (error) { failures.push({ productSlug: product.slug, kind: 'image', message: error.message }); }
    }
    const kept = [];
    for (const doc of product.documents) {
      if (DOCUMENT_EXCLUSIONS[doc.url]) continue;
      try {
        const fileName = `${hash(doc.url).slice(0, 10)}-${decodeURIComponent(new URL(doc.url).pathname.split('/').pop()).replace(/[^a-zA-Z0-9.-]/g, '-')}`;
        const { relativeFile, ...asset } = await download(doc.url, `documents/schonox/${fileName}`, 'document');
        // The manufacturer publishes some PDFs under two paths; list each file once per product.
        if (kept.some(item => item.asset.sha256 === asset.sha256)) continue;
        asset.url = await publish(relativeFile, 'document');
        kept.push({ doc, asset });
        assets.push({ productSlug: product.slug, ...doc, ...asset });
      } catch (error) { failures.push({ productSlug: product.slug, kind: 'document', sourceUrl: doc.url, message: error.message }); }
    }
    // Repeated labels (comp. A/B SDS, several DoPs) get the manufacturer title so links stay distinguishable.
    const documents = kept.map(({ doc, asset }) => {
      const label = documentLabel(doc);
      const repeated = doc.title && kept.filter(item => documentLabel(item.doc) === label).length > 1;
      return { title: repeated ? `${label} (${clean(doc.title).replace(/®/g, '')})` : label, url: asset.url, type: doc.type };
    });
    const packaging = localizePackaging(product.sections.Packaging);
    const programs = [['floor-range', 'Podovi'], ['tile-range', 'Keramika'], ['marine-range', 'Marine']].filter(([range]) => product.groups.some(url => url.includes(range))).map(([, label]) => label);
    const specifications = [{ key: 'type', label: 'Tip', value: groups[0] }, { key: 'program', label: 'Program', value: programs.join(', ') }, { key: 'manufacturer', label: 'Proizvođač', value: 'SCHÖNOX / Sika' }];
    if (packaging) specifications.push({ key: 'manufacturer_packaging', label: 'Pakovanja proizvođača', value: packaging });
    const documentationNote = documents.length ? 'Tehničke podatke i uslove primene proverite u priloženoj dokumentaciji proizvođača za konkretan proizvod.' : 'Za tehničke podatke i uslove primene obratite se Podovi prodaji.';
    const description = `${copy[product.slug]}\n\nNabavka preko Podovi uz potvrdu prodaje. Raspoloživost, odgovarajuće pakovanje i rok isporuke potvrđuju se ponudom. ${documentationNote}`;
    const existing = previous.get(product.slug);
    const price = existing && Number.isFinite(existing.price) && existing.price > 0 ? { price: existing.price, priceUnit: existing.priceUnit } : {};
    return { id: product.slug, name: product.name.replace('®', ''), slug: product.slug, sku: product.slug.toUpperCase(), categoryId: '15', brandId: '17', shortDescription: copy[product.slug], description, specs: specifications, images, documents, availability: 'on_request', inStock: false, priceUnit: 'pakovanje', ...price, featured: false, externalLink: product.canonicalUrl, detailsSections: packaging ? [{ title: 'Pakovanje i nabavka', items: ['Navedena su regionalna pakovanja sa zvaničnog evropskog/globalnog kataloga proizvođača. Pakovanje za konkretnu isporuku potvrđuje Podovi prodaja.'] }] : [], source: { canonicalUrl: product.canonicalUrl, alternateUrls: product.alternateUrls, groupUrls: product.groups, checkedAt: source.discoveredAt } };
  });
  const manifest = { ...source, exclusions: [...source.exclusions, ...Object.entries(DOCUMENT_EXCLUSIONS).map(([url, reason]) => ({ scope: 'document', url, reason }))], assets, failures, missingImages: products.filter(product => !product.images.length).map(product => ({ slug: product.slug, reason: 'No individual product image exposed by official source.' })), missingDocuments: products.filter(product => !product.documents.length).map(product => ({ slug: product.slug, reason: 'No downloadable product document exposed by official source.' })), productCount: products.length };
  writeJson(MANIFEST, manifest);
  assert.equal(failures.length, 0, `Asset failures recorded in ${MANIFEST}; dataset not replaced.`);
  writeJson(DATASET, { generatedAt: source.discoveredAt, sourceManifest: 'docs/products/schonox-source-manifest.json', products });
  console.log(JSON.stringify({ products: products.length, images: products.reduce((sum, product) => sum + product.images.length, 0), documents: products.reduce((sum, product) => sum + product.documents.length, 0), failures: failures.length }));
}

async function main() {
  if (process.argv.includes('--self-test')) {
    assert.equal(slugify('SCHÖNOX® ZM RAPID'), 'schonox-zm-rapid');
    assert(allowedPage(ENTRY[0])); assert(!allowedPage('https://schonox.us/products/kh'));
    assert(allowedPage(`${BASE}/schonox-global/en/marine-range/test.html`));
    const fixture = parse('<main><h1>SCHÖNOX® KH</h1><div class="productcontent"><h3>Packaging</h3><span>5 kg</span></div><input data-document-path="/kh.pdf" data-document-title="KH" data-document-type="product_data_sheet"></main>');
    const record = productData(fixture, ENTRY[0], []);
    assert.equal(record.sections.Packaging, '5 kg'); assert.equal(record.documents[0].url, `${BASE}/kh.pdf`);
    assert.equal(localizePackaging('Packsize 10.0-kg-canister 60/pallet'), 'Pakovanje: 10.0 kg, kanister 60/paleta');
    assert.equal(localizePackaging('Packsize 30-m²/40-rolls-pallet'), 'Pakovanje: 30 m², rolna (40 rolni/paleta)');
    assert.equal(localizePackaging('Packsize 5.50 kg box: 4.42 kg comp. A'), 'Pakovanje: 5.50 kg Kutija: 4.42 kg komp. A');
    const avif = path.join(require('node:os').tmpdir(), `schonox-self-test-${process.pid}.png`);
    fs.writeFileSync(avif, await require('sharp')({ create: { width: 2, height: 2, channels: 3, background: '#fff' } }).avif().toBuffer());
    try { await matchImageExtension(avif); assert.equal(fs.readFileSync(avif).subarray(0, 4).toString('hex'), '89504e47'); } finally { fs.rmSync(avif, { force: true }); }
    console.log('SCHÖNOX extractor self-check passed'); return;
  }
  const source = process.argv.includes('--from-source') ? JSON.parse(fs.readFileSync(path.join(ROOT, 'output/schonox/source.json'), 'utf8')) : await discover();
  if (!process.argv.includes('--discover')) await build(source);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
