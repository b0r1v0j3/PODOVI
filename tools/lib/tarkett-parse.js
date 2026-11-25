// Čiste funkcije za normalizaciju Tarkett __NUXT__ payload-a (Nuxt2 state.collectionProductPage.item).
// BEZ mreže/Playwright/FS — sve to živi u tools/ingest_tarkett.js. Testira se verbatim fixturama.
const gerflor = require('./gerflor-parse.js'); // reuse decodeEntities + mapDocumentTitle (fallback naslova)

const MEDIA_HOST = 'https://media.tarkett-image.com';

// Percent-enkoduj ime/segmente fajla (čuva '/'). Bitno za npr. „xf²" (U+00B2) u linoleum
// dokumentima — sirovo ime daje HTTP 400, %C2%B2 daje 200. Idempotentno (decode pa encode),
// no-op za obične nazive (alfanumerik + - _ .), pa S3 asseti ostaju nepromenjeni.
function encodeAssetPath(s) {
  return String(s || '').trim().split('/').map((seg) => {
    try { return encodeURIComponent(decodeURIComponent(seg)); } catch { return encodeURIComponent(seg); }
  }).join('/');
}

// Najveća dostupna rezolucija swatch/ambijent slika je XXL (1920px); XXXL/original = 403.
function mediaImageUrl(thumbnail, size = 'XXL') {
  return `${MEDIA_HOST}/${size}/${encodeAssetPath(thumbnail)}`;
}

// PDF radi samo preko /docs/ prefiksa (svi ostali → 403).
function mediaDocUrl(assetUrl) {
  return `${MEDIA_HOST}/docs/${encodeAssetPath(assetUrl)}`;
}

function stripHtml(s) {
  return gerflor.decodeEntities(
    String(s || '')
      .replace(/<li>/gi, ' ')
      .replace(/<\/(p|div|li|ul|ol)>/gi, ' ')
      .replace(/<br\s*\/?>(?=)/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  // Izvor ponekad lepi rečenice bez razmaka („zaštitom.Somplan 350 je…"); skraćenice tipa „U.S." ostaju.
  ).replace(/([a-zčćšđž0-9][.!?])(?=[A-ZČĆŠĐŽ][a-zčćšđž])/g, '$1 ');
}

// Nuxt 3 (tarkett.rs od ~11/2026) više nema window.__NUXT__ nego devalue-serijalizovan payload u
// <script id="__NUXT_DATA__">: niz u kom su vrednosti objekata/nizova INDEKSI u isti niz, a tuple
// ["Reactive"|"Ref"|…, idx] su Vue/Nuxt omotači. Vraća običan JS objekat (Map→objekat, Set→niz,
// Date→ISO string). Kolekcija je u payload.pinia.collectionProduct.item.
const DEVALUE_SPECIAL = { '-1': undefined, '-2': undefined, '-3': NaN, '-4': Infinity, '-5': -Infinity, '-6': -0 };
function unflattenNuxtData(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const hydrated = new Array(values.length);
  function hydrate(index) {
    if (index < 0) return DEVALUE_SPECIAL[index];
    if (index in hydrated) return hydrated[index];
    const value = values[index];
    if (!value || typeof value !== 'object') return (hydrated[index] = value);
    if (Array.isArray(value) && typeof value[0] === 'string') {
      switch (value[0]) {
        case 'Date': { const t = new Date(value[1]); return (hydrated[index] = Number.isNaN(t.getTime()) ? null : t.toISOString()); }
        case 'Set': { const out = (hydrated[index] = []); for (let i = 1; i < value.length; i++) out.push(hydrate(value[i])); return out; }
        case 'Map': case 'null': {
          const out = (hydrated[index] = {});
          for (let i = 1; i < value.length; i += 2) out[value[0] === 'null' ? value[i] : String(hydrate(value[i]))] = hydrate(value[i + 1]);
          return out;
        }
        case 'RegExp': case 'BigInt': case 'Object': return (hydrated[index] = value[1]);
        case 'EmptyRef': case 'EmptyShallowRef': {
          const raw = hydrate(value[1]); // kao svi omotači: indeks literala ('_', 'null', 'false'…)
          if (raw === '_') return (hydrated[index] = undefined);
          try { return (hydrated[index] = JSON.parse(raw)); } catch (_) { return (hydrated[index] = raw); }
        }
        // Reactive / ShallowReactive / Ref / ShallowRef / NuxtError / Island i nepoznati omotači: sadržaj.
        default: return (hydrated[index] = hydrate(value[1]));
      }
    }
    if (Array.isArray(value)) {
      const out = (hydrated[index] = new Array(value.length));
      for (let i = 0; i < value.length; i++) out[i] = hydrate(value[i]);
      return out;
    }
    const out = (hydrated[index] = {});
    for (const key of Object.keys(value)) out[key] = hydrate(value[key]);
    return out;
  }
  return hydrate(0);
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

// Izvuci item iz Nuxt payload-a: Nuxt2 state.collectionProductPage.item, Nuxt3 (unflattenNuxtData)
// pinia.collectionProduct.item, pa traversal.
function extractCollectionItem(nuxt) {
  if (!nuxt || typeof nuxt !== 'object') return null;
  for (const direct of [nuxt.state?.collectionProductPage?.item, nuxt.pinia?.collectionProduct?.item]) {
    if (direct && (direct.collection_name || direct.collection_name_slug) && Array.isArray(direct.designs)) {
      return direct;
    }
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

// Očisti ime boje: skini trailing kod/finish, brand prefiks (Modu70…), format token (20X120),
// ponovljeni prefiks naziva kolekcije, pa Title Case.
// Bitan redosled: trailing finish kod (npr. "1I") i format token (npr. "20X120") se skidaju DOK
// su slova još velika — posle .toLowerCase() bi ih bilo nemoguće razlikovati od reči.
function cleanColorName(productName, collectionName) {
  let n = String(productName || '').trim();
  // ModularT brand/product prefiks — payload koristi sve varijante: "Modu70", "Modul 70",
  // "Modul70", "ModularT 70" (collectionName "ModularT 70" ne ufata skraćene oblike).
  n = n.replace(/^modul?(?:ar)?t?\s*\d*\s*/i, '');
  // Format/dimenzije token ("20X120", "50X100", "66,5X66,5", "20 x 120") — nije deo imena boje.
  // Decimalni zarez/tačka mora biti pokriven (inače "66,5X66,5" → garbled "66, ,5").
  n = n.replace(/\b\d+(?:[.,]\d+)?\s*[xX]\s*\d+(?:[.,]\d+)?\b/g, ' ');
  // Trailing finish kod ("1I") ili numerički kod ("0409", "278817001").
  n = n.replace(/\s+\d+[A-Za-z]$/, '').replace(/\s*\d{3,4}\s*$/, '').trim();
  // Širina rolne ("SOMPLAN 350 Middle Yellow 2m 3510") — format, ne deo imena boje.
  n = n.replace(/\s+\d+(?:[.,]\d+)?\s?m$/i, '').trim();
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

// Tarkett referenca dizajna (9 cifara, npr. 306007016 — kako je štampa i brošura proizvođača):
// numerički product_design_key, inače prvi 9-cifreni broj iz imena thumbnail-a
// ("TH_306007025_306036025.jpg" → 306007025). Prazno ako nema.
function designSku(design) {
  const key = String(design.product_design_key || '').trim();
  if (/^\d{9}$/.test(key)) return key;
  const m = String(design.product_thumbnail || '').match(/(?:^|\D)(\d{9})(?=\D|$)/);
  return m ? m[1] : '';
}

// Per-boja karakteristike za homogeni vinil (isti oblik kao postojećih 20 kolekcija).
function homogeneousColorCharacteristics(design, code = colorCode(design)) {
  return {
    'HEX boja': String(design.product_hex_color_code || '').trim(),
    'NCS oznaka': String(design.product_ncs_color_code || '').trim(),
    'LRV': String(design.product_light_reflectance_value ?? '').trim(),
    'Porodica boja': String(design.product_color_families?.[0]?.code || '').trim(),
    'Šifra dekora': code,
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
  dimensional_stability: 'Dimenzionalna stabilnost',
  surface_restoration: 'Obnova površine',
  seam_strength_average_value: 'Čvrstoća šava',
  reaction_fire_en_92391: 'Reakcija na vatru (EN 9239-1)',
  restart_ready: 'ReStart spreman',
  epd_A1_A3: 'EPD (A1–A3)',
  fdes_A1_A3: 'FDES (A1–A3)',
  epd_number: 'EPD broj',
  epd_carbon_recycling: 'EPD — recikliranje ugljenika',
  carbon_impact_DVR: 'Ugljenični otisak (DVR)',
  // Somplan 350 (11/2026) — labele kako ih Tarkett Srbija daje u collection_group_attributes.
  product_type_norm_iso: 'ISO vrsta proizvoda',
  ce_marking: 'CE oznaka',
  clean_room_iso_14644: 'Čista soba',
  castor_chair_effect_iso_4918: 'Otpornost na točkiće stolica',
  colour_fastness_light: 'Postojanost boje - svetlost', // isti label kao 19 postojećih homogenih kolekcija
  // Prodajni atribut (sečenje rolne) — Tarkett ga ne prikazuje među karakteristikama; null = ne prikazuj.
  is_cutable: null,
};

// Engleske vrednosti koje Tarkett ne prevodi (sajt je na srpskom). Samo tačna poklapanja.
const SPEC_VALUE_SR = {
  'Glue-Down': 'Lepljenje',
  'Resilient Flooring': 'Elastična podna obloga',
  '34 Very Heavy': '34 Veoma teška',
  Suitable: 'Pogodno',
};

// Fallback srpski naslov dokumenta po document_role (kad document_role_translated fali,
// npr. GREEN_BUILDING_CARD na iQ Motion). Tek ako rola nije poznata → mapDocumentTitle(ime fajla).
const DOCUMENT_ROLE_SR = {
  DATASHEET: 'Tehnički list',
  TENDERDATASHEET: 'Tenderski list',
  DOP: 'Izjava o svojstvima (DoP)',
  INSTALLATION: 'Uputstvo za ugradnju',
  MAINTENANCE: 'Uputstvo za održavanje',
  BROCHURE: 'Brošura',
  WARRANTY_GUARANTEE: 'Garancija',
  ENVIRONMENT_PRODUCT_DECLARATION: 'Izjava o uticaju proizvoda na životnu sredinu (EPD)',
  MATERIAL_HEALTH_STATEMENT: 'Izjava o uticaju na zdravlje (MHS)',
  GREEN_BUILDING_CARD: 'Sertifikat zelene gradnje (GBC)',
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
    if (!v || SPEC_LABEL_SR[key] === null) continue;
    const label = SPEC_LABEL_SR[key] || humanizeKey(key);
    if (!(label in out)) out[label] = SPEC_VALUE_SR[v] || v;
  }
  return out;
}

// Dokumenti iz collection_assets: samo PDF; srpski naslov iz document_role_translated
// (fallback na mapDocumentTitle); dedupe po IZVORNOM URL-u (document_asset_url), NE po naslovu.
// Dva različita PDF-a koja dele srpsku rolu (npr. Real SPC 50 ima dva „Uputstvo za instalaciju" —
// standardni i herringbone; STANDARD PLUS ima dva „Sertifikat") moraju oba preživeti.
function collectionDocsFromAssets(item) {
  const docs = [];
  const seen = new Set();
  for (const a of item?.collection_assets || []) {
    if (!/pdf/i.test(a.document_mime_type || '') && !/\.pdf$/i.test(a.document_asset_url || '')) continue;
    const assetUrl = String(a.document_asset_url || '').trim();
    if (!assetUrl || seen.has(assetUrl)) continue;
    seen.add(assetUrl);
    const role = String(a.document_role || '').toUpperCase();
    const title = (a.document_role_translated && String(a.document_role_translated).trim())
      || DOCUMENT_ROLE_SR[role]
      || gerflor.mapDocumentTitle(a.document_name || a.document_asset_url || '', a.document_role || '');
    docs.push({ title, sourceUrl: mediaDocUrl(assetUrl) });
  }
  return docs;
}

// Per-kolekcija korekcije dokumenata, po imenu izvornog fajla: `titles` daje jasan naslov kad
// dva PDF-a dele istu srpsku rolu (dve „Brošure"…), `skip` izbacuje neispravne (npr. istekli
// sertifikat), `order` stavlja navedene fajlove napred tim redom (ostali zadržavaju izvorni redosled).
function applyDocOverrides(docs, { titles = {}, skip = [], order = [] } = {}) {
  const fileOf = (doc) => decodeURIComponent(String(doc.sourceUrl).split('/').pop() || '');
  const rank = (doc) => { const i = order.indexOf(fileOf(doc)); return i === -1 ? order.length : i; };
  return docs
    .filter((doc) => !skip.includes(fileOf(doc)))
    .map((doc) => (titles[fileOf(doc)] ? { ...doc, title: titles[fileOf(doc)] } : doc))
    .sort((a, b) => rank(a) - rank(b)); // stabilan sort → nenavedeni ostaju u izvornom redosledu
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
  unflattenNuxtData,
  extractCollectionItem,
  colorCode,
  designSku,
  cleanColorName,
  homogeneousColorCharacteristics,
  toSerbianCharacteristics,
  SPEC_LABEL_SR,
  collectionDocsFromAssets,
  applyDocOverrides,
  galleryImagesFromAssets,
};
