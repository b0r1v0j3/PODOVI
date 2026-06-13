// Čiste funkcije za normalizaciju Tarkett __NUXT__ payload-a (Nuxt2 state.collectionProductPage.item).
// BEZ mreže/Playwright/FS — sve to živi u tools/ingest_tarkett.js. Testira se verbatim fixturama.
const gerflor = require('./gerflor-parse.js'); // reuse decodeEntities + mapDocumentTitle (fallback naslova)

const MEDIA_HOST = 'https://media.tarkett-image.com';

// Najveća dostupna rezolucija swatch/ambijent slika je XXL (1920px); XXXL/original = 403.
function mediaImageUrl(thumbnail, size = 'XXL') {
  return `${MEDIA_HOST}/${size}/${String(thumbnail || '').trim()}`;
}

// PDF radi samo preko /docs/ prefiksa (svi ostali → 403).
function mediaDocUrl(assetUrl) {
  return `${MEDIA_HOST}/docs/${String(assetUrl || '').trim()}`;
}

function stripHtml(s) {
  return gerflor.decodeEntities(
    String(s || '')
      .replace(/<li>/gi, ' ')
      .replace(/<\/(p|div|li|ul|ol)>/gi, ' ')
      .replace(/<br\s*\/?>(?=)/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  );
}

function keyFeatureItems(html) {
  const items = [];
  const re = /<li>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = re.exec(String(html || '')))) {
    const t = gerflor.decodeEntities(m[1].replace(/<[^>]+>/g, ' '));
    if (t) items.push(t);
  }
  return items;
}

// Izvuci item iz Nuxt2 payload-a (primarno state.collectionProductPage.item, pa traversal).
function extractCollectionItem(nuxt) {
  if (!nuxt || typeof nuxt !== 'object') return null;
  const direct = nuxt.state?.collectionProductPage?.item;
  if (direct && (direct.collection_name || direct.collection_name_slug) && Array.isArray(direct.designs)) {
    return direct;
  }
  const stack = [nuxt];
  const seen = new Set();
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object' || seen.has(node)) continue;
    seen.add(node);
    const name = node.collection_name || node.collection?.name;
    if (name && Array.isArray(node.designs) && node.designs.length) return node;
    if (Array.isArray(node)) { stack.push(...node); continue; }
    for (const k of Object.keys(node)) stack.push(node[k]);
  }
  return null;
}

// Kod boje: 3-4 cifre sa kraja product_name; inače product_design_key (numerički SPC).
function colorCode(design) {
  const m = String(design.product_name || '').match(/(\d{3,4})\s*$/);
  if (m) return m[1];
  return String(design.product_design_key || '').trim();
}

// Očisti ime boje: skini trailing kod, skini ponovljeni prefiks naziva kolekcije, Title Case.
function cleanColorName(productName, collectionName) {
  let n = String(productName || '').replace(/\s*\d{3,4}\s*$/, '').trim();
  const coll = String(collectionName || '').trim();
  if (coll && n.toLowerCase().startsWith(coll.toLowerCase() + ' ')) {
    n = n.slice(coll.length).trim();
  }
  return n
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

// Per-boja karakteristike za homogeni vinil (isti oblik kao postojećih 20 kolekcija).
function homogeneousColorCharacteristics(design) {
  return {
    'HEX boja': String(design.product_hex_color_code || '').trim(),
    'NCS oznaka': String(design.product_ncs_color_code || '').trim(),
    'LRV': String(design.product_light_reflectance_value ?? '').trim(),
    'Porodica boja': String(design.product_color_families?.[0]?.code || '').trim(),
    'Šifra dekora': colorCode(design),
  };
}

// snake_case (sku_technical_caracteristics) -> srpski label (kao postojeći homogeni vinil).
// Nepoznati ključevi se humanizuju (Title Case od snake_case) — graciozni fallback, ništa se ne gubi.
const SPEC_LABEL_SR = {
  total_thickness: 'Ukupna debljina',
  wear_layer_thickness: 'Zaštitni sloj',
  classification_commercial_iso_10874: 'Komercijalna klasifikacija',
  classification_industrial_iso_10874: 'Industrijska klasifikacija',
  classification_domestic_iso_10874: 'Rezidencijalna klasifikacija',
  surface_treatment: 'Površinska obrada',
  slip_resistance_bs_79762: 'Otpornost na klizanje',
  slip_resistance_din_51130: 'Otpornost na klizanje (DIN 51130)',
  slip_resistance_en_13893: 'Otpornost na klizanje (EN 13893)',
  reaction_fire_en_13501: 'Reakcija na vatru',
  reaction_fire_en_119252: 'Reakcija na vatru (EN 11925-2)',
  underfloor_heating: 'Podno grejanje',
  installation_method: 'Način ugradnje',
  format: 'Format',
  format_type: 'Tip formata',
  length: 'Dužina',
  width: 'Širina',
  surface: 'Površina',
  residual_indentation: 'Rezidualni utisak',
  light_reflectance_value: 'Refleksija svetlosti',
  thermal_resistance: 'Termička otpornost',
  chemical_resistance_iso_26987: 'Hemijska otpornost',
  electrical_propensity: 'Elektrostatika',
  phtalate_content: 'Sadržaj ftalata',
  country_origin: 'Zemlja porekla',
  made_in: 'Proizvedeno u',
  product_type: 'Tip proizvoda',
  pattern: 'Dezen',
  pattern_type: 'Tip dezena',
  bacteria_resistance: 'Otpornost na bakterije',
  formaldehyde_emission_en_717: 'Emisija formaldehida',
  ease_of_decontamination: 'Lakoća dekontaminacije',
  green_building_certification: 'Sertifikat zelene gradnje',
};

function humanizeKey(key) {
  return String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function toSerbianCharacteristics(rawSpecs) {
  const out = {};
  for (const [key, value] of Object.entries(rawSpecs || {})) {
    const v = String(value ?? '').trim();
    if (!v) continue;
    const label = SPEC_LABEL_SR[key] || humanizeKey(key);
    if (!(label in out)) out[label] = v;
  }
  return out;
}

// Dokumenti iz collection_assets: samo PDF; srpski naslov iz document_role_translated
// (fallback na mapDocumentTitle); dedupe po finalnom naslovu (čuva prvu pojavu).
function collectionDocsFromAssets(item) {
  const docs = [];
  const seen = new Set();
  for (const a of item?.collection_assets || []) {
    if (!/pdf/i.test(a.document_mime_type || '') && !/\.pdf$/i.test(a.document_asset_url || '')) continue;
    const title = (a.document_role_translated && String(a.document_role_translated).trim())
      || gerflor.mapDocumentTitle(a.document_name || a.document_asset_url || '', a.document_role || '');
    if (seen.has(title)) continue;
    seen.add(title);
    docs.push({ title, sourceUrl: mediaDocUrl(a.document_asset_url) });
  }
  return docs;
}

// Ambijent/hero slike: COVER prvo, pa GALLERY (sve kao /XXL/ URL-ovi).
function galleryImagesFromAssets(item) {
  const cover = [];
  const gallery = [];
  for (const a of item?.collection_assets || []) {
    if (!/image\//i.test(a.document_mime_type || '') && !/\.(jpg|jpeg|png|webp)$/i.test(a.document_asset_url || '')) continue;
    const role = String(a.document_role || '').toUpperCase();
    if (role === 'COVER') cover.push(mediaImageUrl(a.document_asset_url));
    else if (role === 'GALLERY') gallery.push(mediaImageUrl(a.document_asset_url));
  }
  return [...cover, ...gallery];
}

module.exports = {
  MEDIA_HOST,
  mediaImageUrl,
  mediaDocUrl,
  stripHtml,
  keyFeatureItems,
  extractCollectionItem,
  colorCode,
  cleanColorName,
  homogeneousColorCharacteristics,
  toSerbianCharacteristics,
  SPEC_LABEL_SR,
  collectionDocsFromAssets,
  galleryImagesFromAssets,
};
