/* Official European/global floor/tile catalog. Run with --discover, then without
 * flags after reviewing tools/schonox-copy.json. Uploads images/PDFs to our Supabase buckets. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { parse } = require('next/dist/compiled/node-html-parser');
const { getSupabase, withTimeout } = require('./lib/ingest-core');
const sharp = require('sharp');
const parsePdf = require('pdf-parse/lib/pdf-parse');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://deu.sika.com';
const ENTRY = ['floor-range', 'tile-range', 'marine-range'].map(p => `${BASE}/schonox-global/en/${p}.html`);
const CACHE = path.join(ROOT, 'output/schonox/pages');
const STAGE = path.join(ROOT, 'output/schonox/assets');
const BUCKETS = { image: 'product-images', document: 'product-documents' };
const MANIFEST = path.join(ROOT, 'docs/products/schonox-source-manifest.json');
const DATASET = path.join(ROOT, 'public/data/schonox_products.json');
const LIBRARY = path.resolve(ROOT, '../media-library');
const checkedPages = new Map();
const DOCUMENT_EXCLUSIONS = {
  'https://deu.sika.com/schonox-global/dam/dms/global-schoenox/g/ce-dop-schoenox-hs8-de211501-en138132002-dede.pdf': 'Previously an Office ZIP package despite its PDF extension (verified 2026-10-17); the same manufacturer URL now returns HTTP 404 with an HTML body (verified 2026-10-22). Not rendered as a PDF.',
  'https://deu.sika.com/schonox-global/dam/dms/global-schoenox/y/edc-marineconformschoenoxq9w.pdf': 'Manufacturer file is byte-identical to the SCHÖNOX Q6 marine conformity declaration and names only SCHÖNOX Q6, not Q9 W. Reverified 2026-10-22.',
};
const clean = text => String(text || '').replace(/\s+/g, ' ').trim();
const text = node => clean(node?.structuredText || node?.textContent);
const slugify = value => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f®]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const absolute = value => new URL(value, BASE).href;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const allowedPage = url => /^https:\/\/deu\.sika\.com\/schonox-global\/en\/(floor-range|tile-range|marine-range)(\/[^?#]*)?\.html$/.test(url);
const atomicWrite = (file, bytes) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  try { fs.writeFileSync(temporary, bytes); fs.renameSync(temporary, file); }
  finally { fs.rmSync(temporary, { force: true }); }
};
const writeJson = (file, data) => atomicWrite(file, JSON.stringify(data, null, 2) + '\n');

function localizePackaging(value) {
  const rows = clean(value)
    .replace(/-m²\/\d+-rolls-pallet/g, '-m²-roll')
    .replace(/\s*(?:Material No\.\s*\d+|EAN\s*\d+)\s*/gi, '\n')
    .split(/\n|(?:Packaging unit\s*)?\d+\s*\/pallet\b/i)
    .map(row => row.replace(/^.*?Packsize\s*/i, '').replace(/\s+SCHÖNOX.*$/i, '').replace(/\s+Component\s*\/\s*color.*$/i, '').trim())
    .filter(row => /^(?:\d.*(?:kg|ml|m²|m[ /-]|\/box|piece|set|plastic bottles)|Box:|Container with|set\b|SCHÖNOX iFLOOR-SET|SCHÖNOX iLINE APP)/i.test(row));
  return [...new Set(rows.map(row => {
    let packaging = row
      .replace(/SCHÖNOX iFLOOR-SET /g, 'Komplet za ').replace(/SCHÖNOX iLINE APP EXCLUSIV \(in a case\)/g, 'Kofer')
      .replace(/\d+(?:[.,]\d+)?/g, number => String(Number(number.replace(',', '.'))).replace('.', ','))
      .replace(/(\d)\s*x\s*(?=\d|comp\.)/gi, '$1 × ')
      .replace(/-?kg-(?:combined packaging|combined package|combined tin bucket)/g, ' kg, kombinovano pakovanje')
      .replace(/-?kg-(?:canister|jerry can|can)\b/g, ' kg, kanister')
      .replace(/-?kg-(?:pail|bucket|tin bucket)/g, ' kg, kanta').replace(/-?kg-tin can/g, ' kg, limenka')
      .replace(/-?kg-(?:sack|bag|PE-bag)/g, ' kg, vreća').replace(/-?kg-bottle/g, ' kg, boca')
      .replace(/-ml-cartridge/g, ' ml, kartuša').replace(/[- ](m²|m)(?:-roll|\/roll?| roll)\b/g, ' $1, rolna')
      .replace(/(\d+ cm) width/g, 'širina $1').replace(/ - \d+ boxes with (\d+) rolls each/g, ' ($1 rolni u kutiji)')
      .replace(/ - 1 roll in box/g, ' (1 rolna u kutiji)')
      .replace(/^([\d,]+)\/box$/, '$1 komada, kutija')
      .replace(/ - (\d+)\/box/g, ' ($1 komada u kutiji)').replace(/(\d+)\/box/g, '$1 komada u kutiji').replace(/\/box/g, ' u kutiji')
      .replace(/\bcomp\.|\bcomponent\b/gi, 'komponenta').replace(/\bresin\b/g, 'smola')
      .replace(/\bhardener inside\b/g, 'učvršćivač je uključen').replace(/\bhardener\b/g, 'učvršćivač')
      .replace(/\bpowder and\b/g, 'praha +').replace(/\bliquid\b/g, 'tečnosti')
      .replace(/\bplastic bottles in a box\b/g, 'plastičnih boca u kutiji')
      .replace(/\bin box\b/g, 'u kutiji').replace(/\bin pail\b/g, 'u kanti').replace(/kg box:/gi, 'kg, kutija:').replace(/^box:/i, 'Kutija:')
      .replace(/^1 set$/i, 'Komplet').replace(/\bset\b/gi, 'Komplet').replace(/\bpiece\b/g, 'komad').replace(/ TUBE\b/g, ', tube')
      .replace(/Container with (\d+) wipes/g, 'Posuda sa $1 krpe');
    if (/^\d+ ×/.test(packaging)) packaging = packaging.replace(/, kanta\b/g, ', kante').replace(/, vreća\b/g, ', vreće');
    // The CF DESIGN source omits the closing bracket around its component breakdown.
    const unclosed = (packaging.match(/\(/g) || []).length - (packaging.match(/\)/g) || []).length;
    return clean(packaging + ')'.repeat(Math.max(0, unclosed)));
  }))].join('\n');
}

async function fetchBytes(url) {
  let failure;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await withTimeout((async () => {
        const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
        if (!response.ok) { await response.body?.cancel(); throw new Error(`HTTP ${response.status}`); }
        return Buffer.from(await response.arrayBuffer());
      })(), 35000, `fetch ${url}`);
    } catch (error) { failure = error; }
  }
  throw new Error(`${url}: ${failure.message}`);
}

async function page(url) {
  const file = path.join(CACHE, `${hash(url)}.html`);
  fs.mkdirSync(CACHE, { recursive: true });
  // Cache is an explicit same-run/retry staging area; --refresh refetches it.
  if (!fs.existsSync(file) || process.argv.includes('--refresh')) {
    const bytes = await fetchBytes(url);
    assert(parse(bytes.toString()).querySelector('main'), `Missing main content: ${url}`);
    atomicWrite(file, bytes);
  }
  checkedPages.set(url, fs.statSync(file).mtime.toISOString());
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
    name, slug: slugify(name).startsWith('schonox-') ? slugify(name) : `schonox-${slugify(name)}`, canonicalUrl: url, checkedAt: checkedPages.get(url), groups,
    shortDescription: text(main.querySelector('.cmp-product__description--short')),
    description: text(main.querySelector('[itemprop="description"]')),
    sections,
    images: [...new Set(main.querySelectorAll('.cmp-product__media img').map(node => node.getAttribute('src')).filter(Boolean))],
    documents: [...new Map(documents.map(doc => [doc.url, doc])).values()],
  };
}

async function discover() {
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
        inline.push({ name: text(heading), slug: slugify(text(heading)), canonicalUrl: url, checkedAt: checkedPages.get(url), inlineHeading: text(heading), groups: [url], shortDescription: text(parent.querySelector('.cmp-text')), description: '', sections: {}, images: imageObjects.map(image => image.contentUrl), documents: [] });
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
  const discoveredAt = new Date(Math.max(...[...checkedPages.values()].map(value => Date.parse(value)))).toISOString();
  const result = { discoveredAt, entryPoints: ENTRY, listings, duplicates, exclusions: [{ scope: 'US catalogs', reason: 'Different regional formulations are not mixed into this European/global dataset.' }], failures: [], products: [...byName.values()].sort((a, b) => a.name.localeCompare(b.name)) };
  writeJson(path.join(ROOT, 'output/schonox/source.json'), result);
  console.log(JSON.stringify({ groups: listings.length, sourceProductPages: pages.length, inlineEntries: records.length - pages.length, deduplicatedProducts: result.products.length, duplicates: duplicates.length }));
  return result;
}

// Dynamic Media content-negotiates AVIF behind .png URLs; store the format the extension promises
// (social-preview crawlers trust the extension and cannot decode AVIF).
const IMAGE_FORMATS = { '.png': ['89504e47', 'png'], '.jpg': ['ffd8ff', 'jpeg'] };
async function validateAsset(bytes, file, kind) {
  if (kind === 'document') {
    assert(bytes.subarray(0, 5).toString() === '%PDF-', `Not a PDF: ${file}`);
    let decodedPages = 0;
    // Legacy PDF.js can misread pooled Node Buffers after image decoding; pass an exact byte copy.
    const document = await withTimeout(parsePdf(Uint8Array.from(bytes), { pagerender: async page => {
      await page.getTextContent();
      decodedPages++;
      return '';
    } }), 20000, `PDF decode ${file}`);
    // pdf-parse silently skips page errors; count only pages that actually decoded.
    assert(document.numpages > 0 && decodedPages === document.numpages, `Incomplete PDF: ${file}`);
    return { bytes };
  }
  const format = IMAGE_FORMATS[path.extname(file).toLowerCase()];
  assert(format, `Unsupported image extension: ${file}`);
  const original = await withTimeout(sharp(bytes).metadata(), 20000, `image metadata ${file}`);
  assert(original.width > 0 && original.height > 0, `Invalid image dimensions: ${file}`);
  // Decode the full raster as well as its header before replacing a valid cached image.
  await withTimeout(sharp(bytes).stats(), 20000, `image decode ${file}`);
  if (original.format !== format[1]) bytes = await withTimeout(sharp(bytes)[format[1]]().toBuffer(), 20000, `image format ${file}`);
  const metadata = await sharp(bytes).metadata();
  return { bytes, width: metadata.width, height: metadata.height, format: metadata.format, alpha: metadata.hasAlpha };
}

async function download(url, relativeFile, kind) {
  assert(/^https:\/\/(deu\.sika\.com|dynamicmedia\.sika\.com|sika\.scene7\.com)\//.test(url), `Unexpected asset host ${url}`);
  const file = path.join(STAGE, relativeFile);
  const receiptFile = `${file}.json`;
  const receipt = fs.existsSync(receiptFile) ? JSON.parse(fs.readFileSync(receiptFile, 'utf8')) : null;
  const refresh = !fs.existsSync(file) || process.argv.includes('--refresh') || (receipt && receipt.sourceUrl !== url);
  const validated = await validateAsset(refresh ? await fetchBytes(url) : fs.readFileSync(file), file, kind);
  const { bytes, ...metadata } = validated;
  const checkedAt = refresh ? new Date().toISOString() : receipt?.checkedAt || fs.statSync(file).mtime.toISOString();
  if (refresh || hash(fs.readFileSync(file)) !== hash(bytes)) atomicWrite(file, bytes);
  const asset = { sourceUrl: url, sha256: hash(bytes), bytes: bytes.length, checkedAt, ...metadata };
  writeJson(receiptFile, asset);
  return { ...asset, relativeFile };
}

// Owner rule: product assets live in our Supabase buckets, never in public/ or as hotlinks.
let supabase;
const published = new Map();
function storagePathFor(file, bytes) {
  const extension = path.extname(file);
  return `schonox/${path.basename(file, extension)}-${hash(bytes)}${extension}`;
}
async function publish(relativeFile, kind) {
  const file = path.join(STAGE, relativeFile);
  const bytes = fs.readFileSync(file);
  const storagePath = storagePathFor(file, bytes);
  supabase ||= getSupabase();
  const { publicUrl } = supabase.storage.from(BUCKETS[kind]).getPublicUrl(storagePath).data;
  if (!published.has(publicUrl)) published.set(publicUrl, (async () => {
    const head = await withTimeout(fetch(publicUrl, { method: 'HEAD', signal: AbortSignal.timeout(30000) }), 35000, `HEAD ${publicUrl}`);
    if (!head.ok) {
      assert([400, 404].includes(head.status), `Storage HEAD failed: ${head.status}`);
      const { error } = await withTimeout(supabase.storage.from(BUCKETS[kind]).upload(storagePath, bytes, {
        contentType: kind === 'document' ? 'application/pdf' : path.extname(file) === '.png' ? 'image/png' : 'image/jpeg',
        upsert: false,
      }), 60000, `upload ${storagePath}`);
      if (error) throw new Error(`Upload ${storagePath}: ${error.message}`);
    }
    assert.equal(hash(await fetchBytes(publicUrl)), hash(bytes), `Storage content mismatch: ${storagePath}`);
    return publicUrl;
  })());
  return published.get(publicUrl);
}

function highResolutionUrl(source) {
  const url = new URL(source);
  // The manufacturer's native asset preserves the complete packshot; smartcrop can trim it.
  url.search = 'width=1600&height=1600';
  return url.href;
}

function documentationNote(documents) {
  return documents.some(document => document.type === 'product_data_sheet')
    ? 'Tehničke podatke i uslove primene proverite u priloženom tehničkom listu proizvođača za konkretan proizvod.'
    : 'Zatražite tehnički list od Podovi prodaje pre izbora i primene proizvoda.';
}

function productPackaging(product) {
  let packaging = product.sections.Packaging;
  // These tables append a different product, not another package of this product.
  if (['schonox-con-boden', 'schonox-xp-15', 'schonox-mse'].includes(product.slug)) packaging = packaging?.split(/(?:SCHÖNOX )?(?:QUARZSAND|MONOKORN)\b/i)[0];
  // GEA's source table also lists QUARZSAND (488270); that row is a separate product.
  if (product.slug === 'schonox-gea') packaging = packaging?.split('Material No. 488270')[0];
  // Product-specific PDS packaging takes precedence over the conflicting web table.
  if (product.slug === 'schonox-2k-pu-solid') return '5 kg, kombinovano pakovanje (4,17 kg komponenta A + 0,83 kg komponenta B)';
  if (product.slug === 'schonox-1k-ds-premium') return '18 kg, vreća';
  // iFIX puts its explicit set sizes after each logistics row, outside the Packsize cell.
  if (product.slug === 'schonox-ifix') return [...(packaging || '').matchAll(/SCHÖNOX iFIX® SET (\d+(?:[.,]\d+)?) kg/g)].map(([, size]) => `${size.replace('.', ',')} kg, komplet`).join('\n');
  // LEB and LEF are distinct system components, not alternative bag sizes.
  if (product.slug === 'schonox-leichtestrich-system') return [...(packaging || '').matchAll(/SCHÖNOX (LEB|LEF) (.*?)(?=SCHÖNOX |$)/g)].map(([, component, row]) => `SCHÖNOX ${component} — ${localizePackaging(row)}`).join('\n');
  return localizePackaging(packaging);
}

function presentationSpecs(product) {
  const packaging = productPackaging(product);
  return packaging ? [{ key: 'manufacturer_packaging', label: 'Pakovanja proizvođača', value: packaging }] : [];
}

function applyPresentation(products, sourceProducts) {
  const sourceBySlug = new Map(sourceProducts.map(product => [product.slug, product]));
  return products.map(product => {
    const source = sourceBySlug.get(product.slug);
    assert(source, `Missing presentation source: ${product.slug}`);
    const updated = presentationSpecs(source);
    const specs = product.specs.flatMap(spec => ['program', 'manufacturer_packaging'].includes(spec.key) ? updated.filter(item => item.key === spec.key) : [spec]);
    for (const spec of updated) if (!specs.some(item => item.key === spec.key)) specs.push(spec);
    return { ...product, specs };
  });
}

function applyApprovedPrices(products, priceList = JSON.parse(fs.readFileSync(path.join(__dirname, 'schonox-prices.json'), 'utf8'))) {
  assert(typeof priceList.sourceTitle === 'string' && priceList.sourceTitle.trim(), 'Missing price-list source');
  assert.equal(priceList.currency, 'RSD');
  assert.equal(priceList.vatRate, 20);
  assert.equal(priceList.discountPercent, 0, 'Only regular list prices may be published');
  for (const date of [priceList.listDate, priceList.validThrough]) {
    assert(/^\d{4}-\d{2}-\d{2}$/.test(date) && new Date(date).toISOString().slice(0, 10) === date, 'Invalid price-list date');
  }
  assert(priceList.validThrough >= priceList.listDate, 'Price list expires before its start');
  const catalogSlugs = new Set(products.map(product => product.slug));
  const prices = new Map();
  const skus = new Set();
  for (const product of priceList.products) {
    assert(catalogSlugs.has(product.slug), `Unknown priced product: ${product.slug}`);
    assert(!prices.has(product.slug), `Duplicate priced product: ${product.slug}`);
    assert(product.packages.length, `No priced packages: ${product.slug}`);
    const priceOptions = product.packages.map(item => {
      assert(/^\d+$/.test(item.manufacturerSku) && !skus.has(item.manufacturerSku), `Invalid or duplicate price SKU: ${item.manufacturerSku}`);
      assert(typeof item.packagingLabel === 'string' && item.packagingLabel.trim(), `Missing package label: ${item.manufacturerSku}`);
      assert(Number.isSafeInteger(item.listPriceNetMinor) && item.listPriceNetMinor > 0 && Number.isSafeInteger(item.listPriceNetMinor * 120), `Invalid package price: ${item.manufacturerSku}`);
      assert(Array.isArray(item.sourcePages) && item.sourcePages.length && item.sourcePages.every(page => Number.isSafeInteger(page) && page > 0), `Missing price-list page: ${item.manufacturerSku}`);
      skus.add(item.manufacturerSku);
      return { manufacturerSku: item.manufacturerSku, packagingLabel: item.packagingLabel, price: Math.round(item.listPriceNetMinor * 120 / 100) / 100, priceWithoutVat: item.listPriceNetMinor / 100 };
    });
    prices.set(product.slug, {
      price: Math.min(...priceOptions.map(option => option.price)),
      priceUnit: priceOptions.length === 1 ? `pakovanje (${priceOptions[0].packagingLabel})` : 'pakovanje',
      priceFrom: new Set(priceOptions.map(option => option.price)).size > 1,
      priceIncludesVat: true,
      priceValidUntil: priceList.validThrough,
      priceOptions,
    });
  }
  return products.map(product => {
    const { price, priceFrom, priceIncludesVat, priceValidUntil, priceOptions, ...record } = product;
    return { ...record, priceUnit: 'pakovanje', ...prices.get(product.slug) };
  });
}

async function build(source) {
  const copy = JSON.parse(fs.readFileSync(path.join(__dirname, 'schonox-copy.json'), 'utf8'));
  const details = JSON.parse(fs.readFileSync(path.join(__dirname, 'schonox-details.json'), 'utf8'));
  const library = JSON.parse(fs.readFileSync(path.join(LIBRARY, 'catalog.json'), 'utf8')).assets;
  const failures = [];
  const assets = [];
  const imageLimitations = [];
  const groupLabels = { primers: 'Prajmeri', 'floor-levelling-compounds': 'Mase za nivelaciju i popravke', 'wall-levelling-compounds': 'Mase za zidove', membranes: 'Hidroizolacija', 'tile-adhesives': 'Lepkovi za pločice', 'floor-tile-adhesives': 'Lepkovi za pločice', 'joint-mortars': 'Mase za fugovanje', screeds: 'Estrisi', 'primary-deck-coveringsscreeds': 'Brodarski estrisi', underlayments: 'Podloge', ancillaries: 'Pomoćni pribor', 'floor-adhesives': 'Lepkovi za podove', 'parquet-adhesives': 'Lepkovi za parket' };
  const documentTitles = { safety_data_sheet: 'Bezbednosni list', product_data_sheet: 'Tehnički list', DOP: 'Izjava o performansama', ecolabel: 'Sertifikat emisija', environmental_product_declaration: 'Ekološka deklaracija (EPD)', declaration_of_conformity: 'Izjava o usaglašenosti' };
  const documentLabel = doc => `${documentTitles[doc.type] || 'Dokument proizvođača'} — ${doc.language?.toUpperCase() || 'EN'}`;
  const products = await mapLimit(source.products, async product => {
    assert(copy[product.slug], `Missing Serbian copy: ${product.slug}`);
    assert(details[product.slug], `Missing Serbian detailed description: ${product.slug}`);
    const groups = [...new Set(product.groups.map(url => groupLabels[url.split('/').pop().replace('.html', '')]))];
    assert(groups.every(Boolean), `Unknown product group: ${product.slug}`);
    const images = [];
    try {
      // Search exact-product library candidates before acquiring a larger official master.
      const originals = await Promise.all(library.filter(item => slugify(item.entity) === product.slug && item.type === 'image').map(async item => {
        const file = path.join(LIBRARY, item.path);
        const bytes = fs.readFileSync(file);
        assert.equal(hash(bytes), item.sha256, `Library hash mismatch: ${item.path}`);
        const validated = await validateAsset(bytes, file, 'image');
        return { ...item, ...validated, sha256: hash(validated.bytes) };
      }));
      originals.sort((a, b) => b.width * b.height - a.width * a.height || Number(b.alpha) - Number(a.alpha));
      const original = originals[0];
      let selected;
      let limitation;
      const requestedUrl = product.images[0] && highResolutionUrl(product.images[0]);
      try {
        assert(requestedUrl, `No official image URL: ${product.slug}`);
        const extension = path.extname(new URL(requestedUrl).pathname) || '.jpg';
        const relativeFile = `images/products/schonox/${product.slug}-1600${extension}`;
        const stagedFile = path.join(STAGE, relativeFile);
        if (original?.source_uri === requestedUrl && !process.argv.includes('--refresh') && !fs.existsSync(stagedFile)) {
          atomicWrite(stagedFile, original.bytes);
          writeJson(`${stagedFile}.json`, { sourceUrl: requestedUrl, checkedAt: original.retrieved_at });
        }
        selected = await download(requestedUrl, relativeFile, 'image');
        if (original && selected.width * selected.height < original.width * original.height) {
          limitation = 'Official 1600 request returned fewer pixels than the existing library master.';
          selected = null;
        }
      } catch (error) { limitation = error.message; }
      if (!selected) {
        assert(original, `No validated image fallback: ${product.slug}; ${limitation}`);
        const relativeFile = `images/products/schonox/${product.slug}-library${path.extname(original.path)}`;
        atomicWrite(path.join(STAGE, relativeFile), original.bytes);
        selected = { relativeFile, sourceUrl: original.source_uri, sha256: original.sha256, bytes: original.bytes.length, width: original.width, height: original.height, format: original.format, alpha: original.alpha, checkedAt: original.retrieved_at, reusedLibraryAsset: path.relative(ROOT, path.join(LIBRARY, original.path)) };
      }
      if (selected.width < 1600 && selected.height < 1600) limitation ||= 'Official source does not expose a larger native image; kept the best available resolution without upscaling.';
      if (limitation) imageLimitations.push({ productSlug: product.slug, requestedUrl, width: selected.width, height: selected.height, reason: limitation });
      const { relativeFile, ...asset } = selected;
      asset.url = await publish(relativeFile, 'image');
      images.push({ url: asset.url, alt: product.name });
      assets.push({ productSlug: product.slug, ...asset });
    } catch (error) { failures.push({ productSlug: product.slug, kind: 'image', message: error.message }); }
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
    const packaging = productPackaging(product);
    const specifications = [{ key: 'type', label: 'Tip', value: groups[0] }, { key: 'manufacturer', label: 'Proizvođač', value: 'SCHÖNOX / Sika' }, ...presentationSpecs(product)];
    const description = `${details[product.slug]}\n\nNabavka preko Podovi uz potvrdu prodaje. Raspoloživost, odgovarajuće pakovanje i rok isporuke potvrđuju se ponudom. ${documentationNote(documents)}`;
    return { id: product.slug, name: product.name.replace('®', ''), slug: product.slug, sku: product.slug.toUpperCase(), categoryId: '15', brandId: '17', shortDescription: copy[product.slug], description, specs: specifications, images, documents, availability: 'on_request', inStock: false, priceUnit: 'pakovanje', featured: false, externalLink: product.canonicalUrl, detailsSections: packaging ? [{ title: 'Pakovanje i nabavka', items: ['Navedena su regionalna pakovanja sa zvaničnog evropskog/globalnog kataloga proizvođača. Pakovanje za konkretnu isporuku potvrđuje Podovi prodaja.'] }] : [], source: { canonicalUrl: product.canonicalUrl, alternateUrls: product.alternateUrls, groupUrls: product.groups, checkedAt: product.checkedAt || source.discoveredAt } };
  });
  const manifest = { ...source, exclusions: [...source.exclusions, ...Object.entries(DOCUMENT_EXCLUSIONS).map(([url, reason]) => ({ scope: 'document', url, reason }))], assets, failures, imageLimitations, missingImages: products.filter(product => !product.images.length).map(product => ({ slug: product.slug, reason: 'No individual product image exposed by official source.' })), missingDocuments: products.filter(product => !product.documents.length).map(product => ({ slug: product.slug, reason: 'No downloadable product document exposed by official source.' })), missingTechnicalDataSheets: products.filter(product => !product.documents.some(document => document.type === 'product_data_sheet')).map(product => ({ slug: product.slug, reason: 'No product_data_sheet attached; request the technical data sheet before selection or application.' })), productCount: products.length };
  manifest.sourceClarifications = [
    ['schonox-fpl-plus', 'Source advantages distinguish 3–50 mm without aggregates and 10–60 mm with aggregates; do not flatten this into 3–60 mm.'],
    ['schonox-d-8-15-21-35-65', 'Source page repeats generic sealing-tape text; D8/D15/D21/D35/D65 are stretchable wall sealing sleeves for pipe penetrations (also identified in the 1K DS PREMIUM PDS).'],
    ['schonox-gea', 'Packaging row 488270 / 25 kg identifies separate SCHÖNOX QUARZSAND; excluded from GEA packaging.'],
    ['schonox-2k-pu-solid', 'The web table says 4.5 kg, but the attached product data sheet explicitly specifies a 5 kg combined package (4.17 kg A + 0.83 kg B). Public manufacturer packaging follows that PDS; the conflicting raw web table is retained here for traceability.'],
    ['schonox-1k-ds-premium', 'The web table says 28 kg, but the attached product data sheet explicitly specifies an 18 kg paper sack, also shown on the product photo and Sika Austria product page. Public manufacturer packaging follows that PDS. Mixing/class differences remain internal source notes; no conflicting application number is published.'],
  ].map(([productSlug, reason]) => {
    const product = source.products.find(item => item.slug === productSlug);
    return { productSlug, reason, sourceUrl: product.canonicalUrl, checkedAt: product.checkedAt || source.discoveredAt };
  });
  writeJson(MANIFEST, manifest);
  assert.equal(failures.length, 0, `Asset failures recorded in ${MANIFEST}; dataset not replaced.`);
  writeJson(DATASET, { generatedAt: source.discoveredAt, sourceManifest: 'docs/products/schonox-source-manifest.json', products: applyApprovedPrices(products) });
  console.log(JSON.stringify({ products: products.length, images: products.reduce((sum, product) => sum + product.images.length, 0), documents: products.reduce((sum, product) => sum + product.documents.length, 0), failures: failures.length }));
}

async function main() {
  if (process.argv.includes('--presentation-only')) {
    const dataset = JSON.parse(fs.readFileSync(DATASET, 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    dataset.products = applyPresentation(dataset.products, manifest.products);
    writeJson(DATASET, dataset);
    console.log(JSON.stringify({ products: dataset.products.length, presentationOnly: true }));
    return;
  }
  if (process.argv.includes('--prices-only')) {
    const dataset = JSON.parse(fs.readFileSync(DATASET, 'utf8'));
    dataset.products = applyApprovedPrices(dataset.products);
    writeJson(DATASET, dataset);
    console.log(JSON.stringify({ products: dataset.products.length, pricedProducts: dataset.products.filter(product => product.price).length, priceOptions: dataset.products.reduce((sum, product) => sum + (product.priceOptions?.length || 0), 0) }));
    return;
  }
  if (process.argv.includes('--self-test')) {
    assert.notEqual(storagePathFor('same.pdf', Buffer.from('%PDF-one')), storagePathFor('same.pdf', Buffer.from('%PDF-two')));
    assert.match(documentationNote([{ type: 'product_data_sheet' }]), /priloženom tehničkom listu/);
    assert.match(documentationNote([{ type: 'safety_data_sheet' }]), /Zatražite tehnički list/);
    assert.equal(productPackaging({ slug: 'schonox-gea', sections: { Packaging: 'Packsize 4.5-kg-combined packaging Material No. 488270 Packsize 25.0-kg-sack' } }), '4,5 kg, kombinovano pakovanje');
    assert.equal(productPackaging({ slug: 'schonox-2k-pu-solid', sections: { Packaging: 'Packsize 4.5-kg-combined packaging' } }), '5 kg, kombinovano pakovanje (4,17 kg komponenta A + 0,83 kg komponenta B)');
    assert.equal(productPackaging({ slug: 'schonox-1k-ds-premium', sections: { Packaging: 'Packsize 28.0-kg-sack' } }), '18 kg, vreća');
    assert.equal(slugify('SCHÖNOX® ZM RAPID'), 'schonox-zm-rapid');
    assert(allowedPage(ENTRY[0])); assert(!allowedPage('https://schonox.us/products/kh'));
    assert(allowedPage(`${BASE}/schonox-global/en/marine-range/test.html`));
    const fixture = parse('<main><h1>SCHÖNOX® KH</h1><div class="productcontent"><h3>Packaging</h3><span>5 kg</span></div><input data-document-path="/kh.pdf" data-document-title="KH" data-document-type="product_data_sheet"></main>');
    const record = productData(fixture, ENTRY[0], []);
    assert.equal(record.sections.Packaging, '5 kg'); assert.equal(record.documents[0].url, `${BASE}/kh.pdf`);
    assert.equal(localizePackaging('Packsize 10.0-kg-canister 60/pallet'), '10 kg, kanister');
    assert.equal(localizePackaging('Packsize 30-m²/40-rolls-pallet'), '30 m², rolna');
    assert.equal(localizePackaging('Packsize 5.50 kg box: 4.42 kg comp. A'), '5,5 kg, kutija: 4,42 kg komponenta A');
    const avif = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#fff' } }).avif().toBuffer();
    const converted = await validateAsset(avif, 'fixture.png', 'image');
    assert.equal(converted.bytes.subarray(0, 4).toString('hex'), '89504e47');
    assert.deepEqual([converted.width, converted.height, converted.format], [2, 2, 'png']);
    const truncatedPng = converted.bytes.subarray(0, 64);
    assert.equal((await sharp(truncatedPng).metadata()).format, 'png');
    await assert.rejects(validateAsset(truncatedPng, 'fixture.png', 'image'));
    await assert.rejects(validateAsset(Buffer.from('<html>error</html>'), 'fixture.png', 'image'));
    await assert.rejects(validateAsset(Buffer.from('PK fake PDF'), 'fixture.pdf', 'document'));
    const originalFetch = global.fetch;
    const originalArgv = [...process.argv];
    process.argv = process.argv.filter(argument => argument !== '--refresh');
    const relative = `self-test-${process.pid}.pdf`;
    const file = path.join(STAGE, relative);
    // A real one-page PDF; the equal-size second version exercises content-based cache identity.
    const firstPdf = Buffer.from('JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAyMDAgMjAwXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCAzNCA+PgpzdHJlYW0KQlQgL0YxIDEyIFRmIDEwIDEwMCBUZCAoT25lKSBUaiBFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyNDEgMDAwMDAgbiAKMDAwMDAwMDMyNSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9Sb290IDEgMCBSIC9TaXplIDYgPj4Kc3RhcnR4cmVmCjM5NQolJUVPRgo=', 'base64');
    const secondPdf = Buffer.from(firstPdf.toString('ascii').replace('(One)', '(Two)'));
    assert.equal(firstPdf.length, secondPdf.length);
    const missingPagePdf = Buffer.from(firstPdf.toString('ascii').replace('/Count 1', '/Count 2'));
    await assert.rejects(validateAsset(missingPagePdf, 'missing-page.pdf', 'document'), /Incomplete PDF/);
    let response = firstPdf;
    let calls = 0;
    global.fetch = async () => { calls++; return new Response(response); };
    try {
      const first = await download(`${BASE}/fixture.pdf`, relative, 'document');
      response = secondPdf;
      await download(`${BASE}/fixture.pdf`, relative, 'document');
      assert.equal(calls, 1, 'Unchanged staging retry must use the validated cache');
      process.argv.push('--refresh');
      const second = await download(`${BASE}/fixture.pdf`, relative, 'document');
      assert.equal(calls, 2, '--refresh must fetch even an existing same-size file');
      assert.notEqual(first.sha256, second.sha256);
      assert.notEqual(storagePathFor(file, firstPdf), storagePathFor(file, secondPdf));
      const receipt = fs.readFileSync(`${file}.json`);
      response = firstPdf.subarray(0, 64); // Still has %PDF-, but the rest of the document is missing.
      await assert.rejects(download(`${BASE}/fixture.pdf`, relative, 'document'));
      assert.deepEqual(fs.readFileSync(file), secondPdf, 'A bad refresh must preserve the validated cache');
      assert.deepEqual(fs.readFileSync(`${file}.json`), receipt, 'A bad refresh must preserve the cache receipt');
    } finally {
      global.fetch = originalFetch;
      process.argv = originalArgv;
      fs.rmSync(file, { force: true }); fs.rmSync(`${file}.json`, { force: true });
    }
    console.log('SCHÖNOX extractor self-check passed'); return;
  }
  const source = process.argv.includes('--from-source') ? JSON.parse(fs.readFileSync(path.join(ROOT, 'output/schonox/source.json'), 'utf8')) : await discover();
  if (!process.argv.includes('--discover')) await build(source);
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { applyApprovedPrices, applyPresentation, download, highResolutionUrl, mapLimit, productPackaging, documentationNote, storagePathFor, validateAsset };
