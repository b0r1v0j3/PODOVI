# Faza 2 — S3: Tarkett ingest pipeline + 4 nove vinil/LVT kolekcije — Implementacioni plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (preporučeno) ili superpowers:executing-plans za izvršavanje task-po-task. Koraci koriste checkbox (`- [ ]`) sintaksu za praćenje.

**Goal:** Izgraditi Tarkett self-host ingest put (parser + orkestracija) i njime dodati 4 nove kolekcije (iQ Motion, Deal SPC 30, Real SPC 50, ModularT 70) sa SVIM assetima (slike + PDF) u našoj Supabase bazi — nula hotlinkova za nove kolekcije.

**Architecture:** Reuse generičkog `tools/lib/ingest-core.js` (env, fetch sa tvrdim `withTimeout`, Supabase upload, manifest, backup). Novi Tarkett-specifični sloj: čiste parse funkcije u `tools/lib/tarkett-parse.js` (TDD, verbatim fixtures) + orkestracija u `tools/ingest_tarkett.js` (Playwright čita `window.__NUXT__` → `state.collectionProductPage.item.designs[]`, preuzima `media.tarkett-image.com/XXL` slike i `/docs/` PDF-ove, uploaduje u Supabase, upisuje normalizovan zapis u ciljni JSON). Homogeni vinil ide u `tarkett_homogeneous_vinyl_colors.json` (nested `collections[]`), LVT/SPC u `tarkett_lvt_products.json` (flat niz stavki). `/cenovnik` auto-discovery (dokazan) → samo verifikacija.

**Tech Stack:** Node 24 (global fetch), Playwright ^1.58.2 (Nuxt 2 render), sharp ^0.34.5 (validacija slike), Supabase JS ^2.95.3, Vitest ^3.2.4 (`test:contract`). Bez novih zavisnosti.

---

## Ključne konstante i dokazi (referenca tokom celog plana)

- **Supabase javni prefiks:** `https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/`
- **Bucket-i:** `product-images`, `product-documents` (postoje od S2).
- **Slike (maks rezolucija):** `https://media.tarkett-image.com/XXL/<product_thumbnail>` = 1920×1920 (alias `large-high`). `XXXL`/`original` vraćaju **403**. `large`=`XL`=960px (grid fallback).
- **Dokumenti:** `https://media.tarkett-image.com/docs/<document_asset_url>` (PDF radi SAMO preko `/docs/`; `/large/`, `/documents/`, `/pdf/` → 403).
- **Per-dizajn JSON (pune specifikacije):** `https:` + `design.productDataUrl` → `{ item: { product_collection: { collection_default_sku: { sku_technical_caracteristics: {...} }}}}` (engleski snake_case ključevi, srpske vrednosti).
- **4 ciljne kolekcije (verbatim iz upstream izviđanja 2026-06-13):**

| Kolekcija | Tip | URL | collection_id | slug | boja |
|---|---|---|---|---|---|
| iQ Motion | homogeni vinil | `https://www.tarkett.rs/sr_RS/kolekcija-C003138-iq-motion` | C003138 | `iq-motion` | 16 |
| Deal SPC 30 | SPC klik (LVT) | `https://www.tarkett.rs/sr_RS/kolekcija-C003170-deal-spc-30` | C003170 | `deal-spc-30` | 2 |
| Real SPC 50 | SPC klik (LVT) | `https://www.tarkett.rs/sr_RS/kolekcija-C003193-real-spc-50` | C003193 | `real-spc-50` | 6 |
| ModularT 70 | LVT lepljeni | `https://www.tarkett.rs/sr_RS/kolekcija-C003148-modulart-70` | C003148 | `modulart-70` | 16 |

- **Payload oblik IDENTIČAN za sve 4** (Nuxt 2 `state.collectionProductPage.item` + `designs[]`); razlikuje se samo sadržaj (homogeni ima hex/LRV/color-family, SPC ima numerički `product_design_key` i prazna meta).
- **Auto-discovery u /cenovnik (dokazano):** homogeni vinil ulazi preko kategorije `vinil` (nested, `colors[0].brandId="3"`), LVT/SPC preko `lvt` (flat, `brandId:"3"` hardkodovan u `get-colors.ts`) → obe grane → grupisano pod **Tarkett (brand 3)**. **Nula novog koda** u `lib/cenovnik/tree.ts` ili `lib/colors/get-colors.ts` (osim ako verifikacija pokaže drugačije).

---

## File Structure

| Fajl | Odgovornost | Akcija |
|---|---|---|
| `tools/lib/tarkett-parse.js` | Čiste funkcije: izdvoji `item` iz `__NUXT__`, normalizuj `designs[]` → boje, prevedi spec ključeve u srpske, sklopi dokumente/slike iz `collection_assets`, gradi `media.tarkett-image.com` URL-ove. **Bez Playwright/mreže/FS.** | Create |
| `tools/ingest_tarkett.js` | Orkestracija: Playwright → `__NUXT__`, per-dizajn JSON fetch, download+upload slika/PDF u Supabase, upis u ciljni JSON. Flagovi `--dry-run`, `--collection=`, `--skip-existing`. Manifest `output/ingest-tarkett-manifest.json`. | Create |
| `tests/contracts/tarkett-parse-contract.test.ts` | TDD za `tarkett-parse.js` (verbatim fixtures). | Create |
| `tests/contracts/tarkett-new-collections-contract.test.ts` | Data contract: 4 nove kolekcije self-hostovane, bez upstream hotlinkova, `colorCount===colors.length`. | Create |
| `public/data/tarkett_homogeneous_vinyl_colors.json` | Dodaje se 21. kolekcija (iQ Motion). | Modify (ingest) |
| `public/data/tarkett_lvt_products.json` | Dodaju se flat stavke za Deal/Real SPC + ModularT 70. | Modify (ingest) |
| `docs/superpowers/runbooks/2026-06-13-s3-tarkett-ingest-runbook.md` | Kako pokrenuti ingest, resume, rollback. | Create |

**Pure/impure granica (kritično):** `tarkett-parse.js` je 100% čist (testira se bez mreže). Sav Playwright/fetch/upload/FS živi u `ingest_tarkett.js`. Orkestrator dohvati `nuxt` objekat pa ga prosledi čistim funkcijama.

---

## Normalizovani izlazni oblici (ugovor koji ingest mora da ispuni)

### A) Homogeni vinil — objekat dodat u `tarkett_homogeneous_vinyl_colors.json` → `collections[]`

```json
{
  "name": "iQ Motion",
  "slug": "tarkett-iq-motion",
  "brandId": "3",
  "url": "https://www.tarkett.rs/sr_RS/kolekcija-C003138-iq-motion",
  "colorCount": 16,
  "shortDescription": "<item.short_description, očišćen od HTML-a>",
  "description": "<item.description, očišćen>",
  "categoryDescription": "<item.short_description ili description>",
  "characteristics": { "Ukupna debljina": "2 mm", "Komercijalna klasifikacija": "34 Very Heavy", "...": "..." },
  "detailsSections": [{ "title": "Ključne karakteristike", "items": ["...", "..."] }],
  "documents": [{ "title": "Tehnički list", "url": "<SUPABASE product-documents URL>", "type": "pdf" }],
  "collection_image_url": "<SUPABASE product-images URL (COVER)>",
  "room_scene_images": ["<SUPABASE product-images URL (GALLERY)>", "..."],
  "colors": [
    {
      "code": "0409",
      "name": "Motion Blue",
      "slug": "tarkett-iq-motion-color-0409-motion-blue",
      "image": "<SUPABASE product-images XXL swatch URL>",
      "description": "<= collection description>",
      "characteristics": { "HEX boja": "BFB5AD", "NCS oznaka": "", "LRV": "50", "Porodica boja": "U", "Šifra dekora": "0409" },
      "brandId": "3"
    }
  ]
}
```

### B) LVT/SPC — flat stavke dodate u `tarkett_lvt_products.json` (niz)

```json
{
  "id": "deal-spc-30-natural-wood",
  "name": "Natural Wood",
  "collection": "deal-spc-30",
  "description": "<collection description>",
  "type": "SPC",
  "category": "lvt",
  "images": ["<SUPABASE XXL swatch>", "<SUPABASE gallery 1>", "<SUPABASE gallery 2>"],
  "specs": { "total_thickness": "...", "classification_commercial_iso_10874": "...", "collections": "Deal SPC 30", "collections-b2b": "C003170", "sap_sku_number": "278817001", "name": "Deal SPC 30 Natural Wood" },
  "brandId": "tarkett",
  "meta": { "sku": "278817001", "originalUrl": "//www.tarkett.rs/sr_RS/kolekcija-C003170-deal-spc-30/deal-spc-30-natural-wood", "documents": ["<SUPABASE product-documents URL>"] }
}
```

> `type` po kolekciji: Deal SPC 30 → `"SPC"`, Real SPC 50 → `"SPC"`, ModularT 70 → `"LVT"`. `brandId:"tarkett"` na stavci (loader override-uje na `"3"`). `collection` slug BEZ `tarkett-` prefiksa (kao postojeće LVT kolekcije). Homogeni vinil slug IMA `tarkett-` prefiks (kao postojećih 20).

---

## Task 1: `tarkett-parse.js` — čiste parse funkcije (TDD)

**Files:**
- Create: `tools/lib/tarkett-parse.js`
- Test: `tests/contracts/tarkett-parse-contract.test.ts`

- [ ] **Step 1: Napiši failing test sa verbatim fixturama**

Create `tests/contracts/tarkett-parse-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
const {
  extractCollectionItem,
  mediaImageUrl,
  toSerbianCharacteristics,
  homogeneousColorCharacteristics,
  cleanColorName,
  colorCode,
  collectionDocsFromAssets,
  galleryImagesFromAssets,
  stripHtml,
  keyFeatureItems,
} = require('../../tools/lib/tarkett-parse.js');

// --- Verbatim isečci iz output/tarkett-core-*.json (upstream izviđanje 2026-06-13) ---

const IQ_MOTION_DESIGN0 = {
  product_name_slug: 'motion-blue-0409',
  product_light_reflectance_value: '50',
  product_design_key: 'motion-blue-0409',
  product_hex_color_code: 'BFB5AD',
  product_thumbnail: 'TH_HO_iQ_Motion_Blue_409.jpg',
  product_ncs_color_code: null,
  product_color_families: [{ code: 'U' }],
  product_name: 'MOTION BLUE 0409',
  productUrl: '//www.tarkett.rs/sr_RS/kolekcija-C003138-iq-motion/motion-blue-0409',
  productDataUrl: '//www.tarkett.rs/sr_RS/json-collection-product/C003138-iq-motion/motion-blue-0409',
};

const DEAL_DESIGN0 = {
  product_name_slug: 'deal-spc-30-natural-wood',
  product_design_key: '278817001',
  product_hex_color_code: null,
  product_thumbnail: 'TH_Deal_SPC_30_Natural_Wood_278817001.jpg',
  product_color_families: [],
  product_name: 'Deal SPC 30 Natural Wood',
  productUrl: '//www.tarkett.rs/sr_RS/kolekcija-C003170-deal-spc-30/deal-spc-30-natural-wood',
  productDataUrl: '//www.tarkett.rs/sr_RS/json-collection-product/C003170-deal-spc-30/deal-spc-30-natural-wood',
};

// sku_technical_caracteristics iz per-dizajn JSON-a (iQ Motion default sku) — verbatim ključevi/vrednosti
const IQ_RAW_SPECS = {
  total_thickness: '2 mm',
  classification_commercial_iso_10874: '34 Very Heavy',
  classification_industrial_iso_10874: '43 Teška',
  format: 'Rolna 2x23m',
  format_type: 'Rolna',
  wear_layer_thickness: '2 mm',
  surface_treatment: 'iQ PUR',
  slip_resistance_bs_79762: 'LROS',
  light_reflectance_value: '15',
  country_origin: 'Sweden',
  product_type: 'Resilient Flooring',
};

describe('tarkett-parse: extractCollectionItem', () => {
  it('vadi item iz Nuxt2 state.collectionProductPage.item', () => {
    const nuxt = { state: { collectionProductPage: { item: { collection_name: 'iQ Motion', designs: [IQ_MOTION_DESIGN0] } } } };
    const item = extractCollectionItem(nuxt);
    expect(item.collection_name).toBe('iQ Motion');
    expect(item.designs).toHaveLength(1);
  });

  it('fallback traversal nalazi čvor sa collection_name + designs', () => {
    const nuxt = { foo: { bar: { collection_name: 'X', designs: [DEAL_DESIGN0] } } };
    expect(extractCollectionItem(nuxt).collection_name).toBe('X');
  });

  it('vraća null kad nema payload-a', () => {
    expect(extractCollectionItem({ state: {} })).toBeNull();
  });
});

describe('tarkett-parse: mediaImageUrl', () => {
  it('gradi XXL URL po default-u', () => {
    expect(mediaImageUrl('TH_HO_iQ_Motion_Blue_409.jpg'))
      .toBe('https://media.tarkett-image.com/XXL/TH_HO_iQ_Motion_Blue_409.jpg');
  });
  it('poštuje zadatu veličinu', () => {
    expect(mediaImageUrl('A.jpg', 'large')).toBe('https://media.tarkett-image.com/large/A.jpg');
  });
});

describe('tarkett-parse: colorCode / cleanColorName', () => {
  it('vadi 3-4 cifarni kod sa kraja imena', () => {
    expect(colorCode(IQ_MOTION_DESIGN0)).toBe('0409');
  });
  it('pada na product_design_key kad nema koda u imenu', () => {
    expect(colorCode(DEAL_DESIGN0)).toBe('278817001');
  });
  it('čisti ime: skida kod, Title Case', () => {
    expect(cleanColorName('MOTION BLUE 0409', 'iQ Motion')).toBe('Motion Blue');
  });
  it('skida ponovljeni prefiks naziva kolekcije', () => {
    expect(cleanColorName('Deal SPC 30 Natural Wood', 'Deal SPC 30')).toBe('Natural Wood');
  });
});

describe('tarkett-parse: homogeneousColorCharacteristics', () => {
  it('mapira design polja u srpske karakteristike boje', () => {
    expect(homogeneousColorCharacteristics(IQ_MOTION_DESIGN0)).toEqual({
      'HEX boja': 'BFB5AD',
      'NCS oznaka': '',
      'LRV': '50',
      'Porodica boja': 'U',
      'Šifra dekora': '0409',
    });
  });
});

describe('tarkett-parse: toSerbianCharacteristics', () => {
  it('prevodi poznate snake_case ključeve u srpske labele', () => {
    const out = toSerbianCharacteristics(IQ_RAW_SPECS);
    expect(out['Ukupna debljina']).toBe('2 mm');
    expect(out['Komercijalna klasifikacija']).toBe('34 Very Heavy');
    expect(out['Tip formata']).toBe('Rolna');
    expect(out['Površinska obrada']).toBe('iQ PUR');
    expect(out['Zemlja porekla']).toBe('Sweden');
  });
  it('nepoznate ključeve humanizuje (ne baca, ne gubi)', () => {
    const out = toSerbianCharacteristics({ some_unknown_key: 'X' });
    expect(out['Some Unknown Key']).toBe('X');
  });
  it('preskače prazne vrednosti', () => {
    const out = toSerbianCharacteristics({ total_thickness: '', format: 'Rolna' });
    expect(out['Ukupna debljina']).toBeUndefined();
    expect(out['Format']).toBe('Rolna');
  });
});

describe('tarkett-parse: collectionDocsFromAssets', () => {
  it('gradi /docs/ URL-ove iz collection_assets, koristi srpski document_role_translated, dedupe po naslovu', () => {
    const item = {
      collection_assets: [
        { document_role: 'DATASHEET', document_role_translated: 'Tehnički list', document_asset_url: 'DS_SEE_Deal_SPC_30_SRB.pdf', document_mime_type: 'application/pdf' },
        { document_role: 'INSTALLATION', document_role_translated: 'Uputstvo za instalaciju', document_asset_url: 'IG_Installation_Guide_Deal_SPC_30_ENG.pdf', document_mime_type: 'application/pdf' },
        { document_role: 'DATASHEET', document_role_translated: 'Tehnički list', document_asset_url: 'DS_dup.pdf', document_mime_type: 'application/pdf' },
        { document_role: 'COVER', document_role_translated: 'Naslovna slika kolekcije', document_asset_url: 'IN_cover.jpg', document_mime_type: 'image/jpeg' },
      ],
    };
    const docs = collectionDocsFromAssets(item);
    expect(docs).toHaveLength(2); // dedupe Tehnički list, izbaci sliku (image/*)
    expect(docs[0]).toEqual({ title: 'Tehnički list', sourceUrl: 'https://media.tarkett-image.com/docs/DS_SEE_Deal_SPC_30_SRB.pdf' });
    expect(docs[1].title).toBe('Uputstvo za instalaciju');
  });
});

describe('tarkett-parse: galleryImagesFromAssets', () => {
  it('vraća COVER prvo, pa GALLERY slike kao /XXL/ URL-ove', () => {
    const item = {
      collection_assets: [
        { document_role: 'GALLERY', document_asset_url: 'IN_room1.jpg', document_mime_type: 'image/jpeg' },
        { document_role: 'COVER', document_asset_url: 'IN_cover.jpg', document_mime_type: 'image/jpeg' },
        { document_role: 'DATASHEET', document_asset_url: 'DS.pdf', document_mime_type: 'application/pdf' },
      ],
    };
    const imgs = galleryImagesFromAssets(item);
    expect(imgs[0]).toBe('https://media.tarkett-image.com/XXL/IN_cover.jpg');
    expect(imgs[1]).toBe('https://media.tarkett-image.com/XXL/IN_room1.jpg');
    expect(imgs).toHaveLength(2);
  });
});

describe('tarkett-parse: stripHtml / keyFeatureItems', () => {
  it('skida HTML tagove i dekodira entitete', () => {
    expect(stripHtml('<p>Realistični&nbsp;dekori</p>')).toBe('Realistični dekori');
  });
  it('vadi <li> stavke iz key_features', () => {
    expect(keyFeatureItems('<ul><li>Click sistem</li><li>100% reciklabilno</li></ul>'))
      .toEqual(['Click sistem', '100% reciklabilno']);
  });
});
```

- [ ] **Step 2: Pokreni test — mora da padne**

Run: `npm run test:contract -- tarkett-parse-contract`
Expected: FAIL — `Cannot find module '../../tools/lib/tarkett-parse.js'`.

- [ ] **Step 3: Implementiraj `tools/lib/tarkett-parse.js`**

```js
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
```

- [ ] **Step 4: Pokreni test — mora da prođe**

Run: `npm run test:contract -- tarkett-parse-contract`
Expected: PASS (svi `describe` blokovi zeleni).

- [ ] **Step 5: Commit**

```bash
git add tools/lib/tarkett-parse.js tests/contracts/tarkett-parse-contract.test.ts
git commit -m "feat(s3): tarkett-parse ciste funkcije + contract testovi"
```

---

## Task 2: `ingest_tarkett.js` — orkestracija + dry-run

**Files:**
- Create: `tools/ingest_tarkett.js`

- [ ] **Step 1: Implementiraj orkestrator**

Create `tools/ingest_tarkett.js`:

```js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { chromium } = require('playwright');
const core = require('./lib/ingest-core.js');
const parse = require('./lib/tarkett-parse.js');

const HOMO_JSON = path.join(process.cwd(), 'public', 'data', 'tarkett_homogeneous_vinyl_colors.json');
const LVT_JSON = path.join(process.cwd(), 'public', 'data', 'tarkett_lvt_products.json');
const IMAGES_BUCKET = 'product-images';
const DOCS_BUCKET = 'product-documents';
const MIN_SWATCH_WIDTH = 800; // XXL je 1920; štiti od poluzanih/placeholder slika

// Konfiguracija 4 nove kolekcije (verbatim iz upstream izviđanja 2026-06-13).
const COLLECTIONS = [
  { key: 'iq-motion',    kind: 'homogeneous', collectionId: 'C003138', slug: 'tarkett-iq-motion', categorySlug: 'vinil',
    url: 'https://www.tarkett.rs/sr_RS/kolekcija-C003138-iq-motion' },
  { key: 'deal-spc-30',  kind: 'lvt', type: 'SPC', collectionId: 'C003170', slug: 'deal-spc-30', categorySlug: 'lvt',
    url: 'https://www.tarkett.rs/sr_RS/kolekcija-C003170-deal-spc-30' },
  { key: 'real-spc-50',  kind: 'lvt', type: 'SPC', collectionId: 'C003193', slug: 'real-spc-50', categorySlug: 'lvt',
    url: 'https://www.tarkett.rs/sr_RS/kolekcija-C003193-real-spc-50' },
  { key: 'modulart-70',  kind: 'lvt', type: 'LVT', collectionId: 'C003148', slug: 'modulart-70', categorySlug: 'lvt',
    url: 'https://www.tarkett.rs/sr_RS/kolekcija-C003148-modulart-70' },
];

function parseArgs() {
  const args = { dryRun: false, keys: [], skipExisting: false };
  for (const a of process.argv.slice(2)) {
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--skip-existing') args.skipExisting = true;
    else if (a.startsWith('--collection=')) args.keys.push(a.split('=')[1]);
  }
  return args;
}

function abs(u) { return String(u || '').startsWith('//') ? `https:${u}` : u; }

// Playwright: učitaj kolekcijsku stranicu i vrati __NUXT__ objekat.
async function fetchNuxt(browser, url) {
  const page = await browser.newPage({ userAgent: core.BROWSER_HEADERS['User-Agent'] });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    const nuxt = await page.evaluate(() => {
      let n = window.__NUXT__;
      if (typeof n === 'function') { try { n = n(); } catch (_) { n = null; } }
      if (!n) return null;
      try { return JSON.parse(JSON.stringify(n)); } catch (_) { return null; }
    });
    return nuxt;
  } finally {
    await page.close();
  }
}

// Per-dizajn JSON (pune specifikacije). Vraća sku_technical_caracteristics + osnovni meta.
async function fetchDesignSpecs(productDataUrl) {
  const text = await core.fetchPage(abs(productDataUrl));
  let j;
  try { j = JSON.parse(text); } catch (_) { return null; }
  const sku = j?.item?.product_collection?.collection_default_sku;
  return {
    rawSpecs: sku?.sku_technical_caracteristics || {},
    sapSku: sku?.sku_sap_number || j?.item?.product_collection?.collection_default_sku?.sku_id || null,
  };
}

async function uploadSwatch(supabase, storagePath, buffer, label) {
  const meta = await core.withTimeout(sharp(buffer).metadata(), 20000, `sharp ${label}`);
  if (!meta.width || meta.width < MIN_SWATCH_WIDTH) {
    throw new Error(`${label}: slika ${meta.width || '?'}px < ${MIN_SWATCH_WIDTH}px`);
  }
  return core.uploadToBucket(supabase, IMAGES_BUCKET, storagePath, buffer);
}

// Skini + uploaduj kolekcione dokumente (PDF). Vrati [{title,url,type}] sa Supabase URL-ovima.
async function ingestDocuments(supabase, manifest, col, docs) {
  const out = [];
  for (const doc of docs) {
    const mKey = `doc:${doc.sourceUrl}`;
    if (manifest.has(mKey)) { out.push({ title: doc.title, url: manifest.get(mKey).publicUrl, type: 'pdf' }); continue; }
    try {
      const buffer = await core.downloadAsset(doc.sourceUrl);
      if (!buffer.slice(0, 5).toString().startsWith('%PDF')) throw new Error('nije PDF');
      // Ime fajla iz izvornog basename-a (jedinstveno). Dva dokumenta sa istim srpskim
      // naslovom (npr. dva "Uputstvo za instalaciju": standard + riblja kost kod Real SPC 50)
      // NE smeju u istu putanju — inače se drugi prepisuje i parser dedupe-po-URL-u je uzaludan.
      const srcBase = (doc.sourceUrl.split('/').pop() || 'dokument').replace(/\.pdf$/i, '');
      const fileName = `${core.slugify(srcBase)}.pdf`;
      const publicUrl = await core.uploadToBucket(supabase, DOCS_BUCKET, `products/${col.categorySlug}/${col.slug}/${fileName}`, buffer);
      out.push({ title: doc.title, url: publicUrl, type: 'pdf' });
      manifest.record(mKey, { publicUrl, collection: col.slug });
    } catch (err) {
      console.log(`   ⚠️ dokument "${doc.title}": ${err.message}`);
    }
  }
  return out;
}

// Skini + uploaduj ambijent (hero/gallery) slike. Vrati niz Supabase URL-ova.
async function ingestGallery(supabase, manifest, col, imageUrls) {
  const out = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const mKey = `scene:${imageUrls[i]}`;
    if (manifest.has(mKey)) { out.push(manifest.get(mKey).publicUrl); continue; }
    try {
      const buffer = await core.downloadAsset(imageUrls[i]);
      const publicUrl = await uploadSwatch(supabase, `products/${col.categorySlug}/${col.slug}/ambience/scena-${i + 1}.jpg`, buffer, `${col.slug} scena ${i + 1}`);
      out.push(publicUrl);
      manifest.record(mKey, { publicUrl, collection: col.slug });
    } catch (err) {
      console.log(`   ⚠️ scena ${i + 1}: ${err.message}`);
    }
  }
  return out;
}

// Skini + uploaduj swatch sliku boje (XXL). Vrati Supabase URL ili null.
async function ingestSwatch(supabase, manifest, col, design, fileBase, label) {
  const srcUrl = parse.mediaImageUrl(design.product_thumbnail);
  const mKey = `swatch:${srcUrl}`;
  if (manifest.has(mKey)) return manifest.get(mKey).publicUrl;
  const buffer = await core.downloadAsset(srcUrl);
  const publicUrl = await uploadSwatch(supabase, `products/${col.categorySlug}/${col.slug}/decor/${fileBase}.jpg`, buffer, label);
  manifest.record(mKey, { publicUrl, collection: col.slug });
  return publicUrl;
}

async function ingestHomogeneous(supabase, manifest, args, col, item) {
  const designs = item.designs || [];
  const description = parse.stripHtml(item.description);
  const shortDescription = parse.stripHtml(item.short_description) || description;

  // Kolekcione karakteristike iz per-dizajn JSON-a (prvog dizajna).
  let characteristics = {};
  const firstSpecs = await fetchDesignSpecs(designs[0]?.productDataUrl).catch(() => null);
  if (firstSpecs) characteristics = parse.toSerbianCharacteristics(firstSpecs.rawSpecs);

  const documents = args.dryRun ? parse.collectionDocsFromAssets(item)
    : await ingestDocuments(supabase, manifest, col, parse.collectionDocsFromAssets(item));
  const galleryUrls = args.dryRun ? parse.galleryImagesFromAssets(item)
    : await ingestGallery(supabase, manifest, col, parse.galleryImagesFromAssets(item));

  const colors = [];
  for (const d of designs) {
    const code = parse.colorCode(d);
    const name = parse.cleanColorName(d.product_name, item.collection_name);
    const fileBase = `${code}-${core.slugify(name)}`;
    let image = parse.mediaImageUrl(d.product_thumbnail);
    if (!args.dryRun) {
      try {
        image = await ingestSwatch(supabase, manifest, col, d, fileBase, `${col.slug}/${fileBase}`);
      } catch (err) { console.log(`   ⚠️ swatch ${fileBase}: ${err.message} — preskačem boju`); continue; }
    }
    colors.push({
      code,
      name,
      slug: `${col.slug}-color-${code}-${core.slugify(name)}`,
      image,
      description,
      characteristics: parse.homogeneousColorCharacteristics(d),
      brandId: '3',
    });
  }

  return {
    name: item.collection_name,
    slug: col.slug,
    brandId: '3',
    url: col.url,
    colorCount: colors.length,
    shortDescription,
    description,
    categoryDescription: shortDescription,
    characteristics,
    detailsSections: [{ title: 'Ključne karakteristike', items: parse.keyFeatureItems(item.key_features) }],
    documents,
    collection_image_url: galleryUrls[0] || (colors[0] && colors[0].image) || '',
    room_scene_images: galleryUrls.slice(1),
    colors,
  };
}

async function ingestLvt(supabase, manifest, args, col, item) {
  const designs = item.designs || [];
  const description = parse.stripHtml(item.description);

  const docUrls = args.dryRun
    ? parse.collectionDocsFromAssets(item).map((d) => d.sourceUrl)
    : (await ingestDocuments(supabase, manifest, col, parse.collectionDocsFromAssets(item))).map((d) => d.url);
  const galleryUrls = args.dryRun ? parse.galleryImagesFromAssets(item)
    : await ingestGallery(supabase, manifest, col, parse.galleryImagesFromAssets(item));

  const items = [];
  for (const d of designs) {
    const code = parse.colorCode(d);
    const name = parse.cleanColorName(d.product_name, item.collection_name);
    const fileBase = core.slugify(name);
    let swatch = parse.mediaImageUrl(d.product_thumbnail);
    let specs = {};
    const ds = await fetchDesignSpecs(d.productDataUrl).catch(() => null);
    if (ds) specs = { ...ds.rawSpecs };
    specs.collections = item.collection_name;
    specs['collections-b2b'] = col.collectionId;
    specs.sap_sku_number = (ds && ds.sapSku) || d.product_design_key;
    specs.name = d.product_name;
    if (!args.dryRun) {
      try {
        swatch = await ingestSwatch(supabase, manifest, col, d, fileBase, `${col.slug}/${fileBase}`);
      } catch (err) { console.log(`   ⚠️ swatch ${fileBase}: ${err.message} — preskačem stavku`); continue; }
    }
    items.push({
      id: `${col.slug}-${core.slugify(name)}`,
      name,
      collection: col.slug,
      description,
      type: col.type,
      category: 'lvt',
      images: [swatch, ...galleryUrls],
      specs,
      brandId: 'tarkett',
      meta: { sku: specs.sap_sku_number, originalUrl: abs(d.productUrl).replace(/^https:/, ''), documents: docUrls },
    });
  }
  return items;
}

(async () => {
  const args = parseArgs();
  const manifest = core.loadManifest('ingest-tarkett');
  const supabase = args.dryRun ? null : core.getSupabase();
  const targets = COLLECTIONS.filter((c) => args.keys.length === 0 || args.keys.includes(c.key));
  console.log(`🎯 Kolekcija za obradu: ${targets.length}${args.dryRun ? ' (DRY-RUN)' : ''}`);

  const browser = await chromium.launch({ headless: true });
  const summary = [];
  // Lazy-load ciljnih JSON-ova (samo kad nisu dry-run, da se ne piše ništa u dry-run).
  let homoData = null, lvtData = null;

  try {
    for (const col of targets) {
      try {
        console.log(`\n📂 ${col.key} (${col.kind})`);
        const nuxt = await fetchNuxt(browser, col.url);
        const item = parse.extractCollectionItem(nuxt);
        if (!item) throw new Error('__NUXT__ item nije pronađen');
        console.log(`   kolekcija="${item.collection_name}" boja=${(item.designs || []).length}`);

        if (col.kind === 'homogeneous') {
          const record = await ingestHomogeneous(supabase, manifest, args, col, item);
          console.log(`   → boja:${record.colors.length} dok:${record.documents.length} ambijent:${record.room_scene_images.length + (record.collection_image_url ? 1 : 0)}`);
          if (!args.dryRun) {
            homoData = homoData || JSON.parse(fs.readFileSync(HOMO_JSON, 'utf8'));
            homoData.collections = homoData.collections.filter((c) => c.slug !== record.slug);
            homoData.collections.push(record);
          }
          summary.push({ key: col.key, kind: col.kind, colors: record.colors.length, docs: record.documents.length });
        } else {
          const items = await ingestLvt(supabase, manifest, args, col, item);
          console.log(`   → stavki:${items.length} (type=${col.type})`);
          if (!args.dryRun) {
            lvtData = lvtData || JSON.parse(fs.readFileSync(LVT_JSON, 'utf8'));
            lvtData = lvtData.filter((p) => p.collection !== col.slug);
            lvtData.push(...items);
          }
          summary.push({ key: col.key, kind: col.kind, items: items.length });
        }
        manifest.record(`collection:${col.key}`, { status: 'ok' });
        if (!args.dryRun) manifest.save();
      } catch (err) {
        console.log(`⚠️ ${col.key}: ${err.message} — preskačem kolekciju`);
        manifest.record(`collection:${col.key}`, { status: 'error', error: err.message });
        if (!args.dryRun) manifest.save();
      }
    }
  } finally {
    await browser.close();
  }

  if (!args.dryRun) {
    if (homoData) {
      homoData.generatedAt = new Date().toISOString();
      core.writeJsonWithBackup(HOMO_JSON, homoData, 'tarkett-homogeneous-vinyl');
    }
    if (lvtData) {
      core.writeJsonWithBackup(LVT_JSON, lvtData, 'tarkett-lvt-products');
    }
    manifest.save();
  }

  console.log('\n===== REZIME =====');
  for (const row of summary) console.log(JSON.stringify(row));
})().catch((err) => { console.error('❌', err); process.exit(1); });
```

- [ ] **Step 2: Pokreni dry-run za sve 4 (mreža, bez upisa/uploada)**

Run: `node tools/ingest_tarkett.js --dry-run`
Expected (približno; brojevi boja moraju da odgovaraju tabeli):
```
🎯 Kolekcija za obradu: 4 (DRY-RUN)
📂 iq-motion (homogeneous)
   kolekcija="iQ Motion" boja=16
   → boja:16 dok:>=4 ambijent:>=1
📂 deal-spc-30 (lvt)
   kolekcija="Deal SPC 30" boja=2
   → stavki:2 (type=SPC)
📂 real-spc-50 (lvt)
   kolekcija="Real SPC 50" boja=6
   → stavki:6 (type=SPC)
📂 modulart-70 (lvt)
   kolekcija="ModularT 70" boja=16
   → stavki:16 (type=LVT)
```
Ako neki broj boja ne odgovara (16/2/6/16) ili `__NUXT__ item nije pronađen` → STOP, ispitaj payload (`output/tarkett-core-*.json` dumpovi postoje iz izviđanja) pre nego što nastaviš.

- [ ] **Step 3: Commit (samo kod, JSON još netaknut)**

```bash
git add tools/ingest_tarkett.js
git commit -m "feat(s3): tarkett ingest orkestracija + dry-run"
```

---

## Task 3: Pilot — iQ Motion (homogeni vinil) pun ingest + vizuelna provera

> De-rizikovanje: prvo SAMO iQ Motion (najbogatija — hex/LRV/42 asseta). Potvrđuje parser + upload + PDP pre punog run-a.

**Files:**
- Modify (ingest): `public/data/tarkett_homogeneous_vinyl_colors.json`

- [ ] **Step 1: Proveri da `.env.local` ima Supabase ključeve**

> `loadLocalEnvFile()` puni `process.env` (ne vraća objekat) — proveri preko `process.env`.

Run: `node -e "const c=require('./tools/lib/ingest-core.js'); c.loadLocalEnvFile(); console.log('URL', !!process.env.NEXT_PUBLIC_SUPABASE_URL, 'KEY', !!process.env.SUPABASE_SERVICE_ROLE_KEY)"`
Expected: `URL true KEY true`. Ako false → STOP, ključevi nedostaju (vidi runbook).

- [ ] **Step 2: Pokreni pilot ingest (samo iQ Motion)**

Run: `node tools/ingest_tarkett.js --collection=iq-motion`
Expected:
```
📂 iq-motion (homogeneous)
   kolekcija="iQ Motion" boja=16
   → boja:16 dok:>=4 ambijent:>=1
===== REZIME =====
{"key":"iq-motion","kind":"homogeneous","colors":16,"docs":...}
```
Pri visenju (> 5 min bez napretka): tvrdi `withTimeout` iz ingest-core treba da prekine; ako ne, Ctrl-C, ispitaj poslednji URL. Manifest (`output/ingest-tarkett-manifest.json`) omogućava resume — ponovno pokretanje preskače već uploadovano.

- [ ] **Step 3: Verifikuj da je iQ Motion upisan sa Supabase URL-ovima**

Run:
```bash
node -e "const d=require('./public/data/tarkett_homogeneous_vinyl_colors.json'); const c=d.collections.find(x=>x.slug==='tarkett-iq-motion'); console.log('colors', c.colors.length, 'colorCount', c.colorCount); console.log('img0', c.colors[0].image); console.log('hero', c.collection_image_url); console.log('docs', c.documents.map(x=>x.title)); console.log('char keys', Object.keys(c.characteristics).slice(0,5));"
```
Expected: `colors 16 colorCount 16`; `img0` i `hero` počinju sa `https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/`; `docs` lista čistih srpskih naslova; `char keys` srpski (npr. `Ukupna debljina`).

- [ ] **Step 4: Vizuelna provera na dev-u**

Run: `npm run dev` (zaseban terminal), pa otvori `http://localhost:3000/proizvodi/tarkett-iq-motion`.
Proveri: (a) slike se učitavaju sa Supabase i oštre su; (b) prva boja je izabrana po otvaranju; (c) dokumenti (Tehnički list, Brošura, DoP…) su klikabilni; (d) breadcrumb pokazuje „iQ Motion". Ugasi `npm run dev` kad završiš (ne ostavljaj proces da visi).

- [ ] **Step 5: Commit pilota**

```bash
git add public/data/tarkett_homogeneous_vinyl_colors.json
git commit -m "feat(s3): pilot ingest iQ Motion (homogeni vinil) — self-hostovano"
```

---

## Task 4: Pun run — Deal SPC 30, Real SPC 50, ModularT 70 (LVT)

**Files:**
- Modify (ingest): `public/data/tarkett_lvt_products.json`

- [ ] **Step 1: Pokreni ingest za 3 LVT kolekcije**

Run: `node tools/ingest_tarkett.js --collection=deal-spc-30 --collection=real-spc-50 --collection=modulart-70`
Expected REZIME:
```
{"key":"deal-spc-30","kind":"lvt","items":2}
{"key":"real-spc-50","kind":"lvt","items":6}
{"key":"modulart-70","kind":"lvt","items":16}
```

- [ ] **Step 2: Verifikuj LVT stavke (Supabase + brojevi + type)**

Run:
```bash
node -e "const d=require('./public/data/tarkett_lvt_products.json'); for (const slug of ['deal-spc-30','real-spc-50','modulart-70']){const it=d.filter(p=>p.collection===slug); console.log(slug, it.length, it[0]?.type, it[0]?.images[0]?.slice(0,70), 'docs', it[0]?.meta.documents.length);}"
```
Expected: `deal-spc-30 2 SPC https://nnjmrfwepylrheykalik.supabase.co/... docs >=1`; `real-spc-50 6 SPC ...`; `modulart-70 16 LVT ...`. Sve slike/dokumenti na Supabase.

- [ ] **Step 3: Odluka o starom „ModularT 7" (vlasnik)**

Stari `modulart-7` (40 hotlinkovanih stavki) OSTAJE netaknut (po spec §8 „ne diramo postojeće Tarkett kolekcije"; migracija = S4). Novi `modulart-70` je zaseban unos. U katalogu će se privremeno videti obe (stara hotlinkovana + nova self-hostovana).
Verifikuj da stari nije obrisan: `node -e "const d=require('./public/data/tarkett_lvt_products.json'); console.log('modulart-7', d.filter(p=>p.collection==='modulart-7').length, '| modulart-70', d.filter(p=>p.collection==='modulart-70').length)"` → Expected `modulart-7 40 | modulart-70 16`.
**Pitati vlasnika** (posle deploya, ne blokira plan): da li sakriti/ukloniti stari „ModularT 7" sad ili u S4. Ne donositi tu odluku automatski.

- [ ] **Step 4: Vizuelna provera 3 LVT kolekcije na dev-u**

Run: `npm run dev`, otvori `/proizvodi` → kategorija LVT; otvori po jednu kolekciju (Deal SPC 30, Real SPC 50, ModularT 70). Proveri slike (Supabase, oštre), prva boja izabrana, dokumenti rade. Ugasi `npm run dev` posle.

- [ ] **Step 5: Commit**

```bash
git add public/data/tarkett_lvt_products.json
git commit -m "feat(s3): ingest Deal SPC 30 + Real SPC 50 + ModularT 70 (LVT) — self-hostovano"
```

---

## Task 5: Data contract test (gate — bez hotlinkova za nove kolekcije)

**Files:**
- Create: `tests/contracts/tarkett-new-collections-contract.test.ts`

- [ ] **Step 1: Napiši test (mora odmah da prođe na već-ingestovanim podacima)**

Create `tests/contracts/tarkett-new-collections-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import homoData from '@/public/data/tarkett_homogeneous_vinyl_colors.json';
import lvtData from '@/public/data/tarkett_lvt_products.json';

const SUPABASE_PREFIX = 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/';
// Asset hostovi koji NE smeju da se pojave u nove kolekcije (slike/dokumenti).
const UPSTREAM_ASSET = /media\.tarkett-image\.com|tarkett\.rs\/[a-z_]+\/pdf/i;

const homoCollections = (homoData as any).collections as any[];
const lvtItems = lvtData as any[];

const NEW_HOMO = ['tarkett-iq-motion'];
const NEW_LVT = [
  { slug: 'deal-spc-30', type: 'SPC', count: 2 },
  { slug: 'real-spc-50', type: 'SPC', count: 6 },
  { slug: 'modulart-70', type: 'LVT', count: 16 },
];

describe('S3: nove homogeni-vinil kolekcije self-hostovane', () => {
  it.each(NEW_HOMO)('%s postoji, colorCount===colors.length, sve na Supabase', (slug) => {
    const col = homoCollections.find((c) => c.slug === slug);
    expect(col, `kolekcija ${slug} mora postojati`).toBeTruthy();
    expect(col.colorCount).toBe(col.colors.length);
    expect(col.colors.length).toBeGreaterThan(0);
    expect(String(col.collection_image_url).startsWith(`${SUPABASE_PREFIX}product-images/`)).toBe(true);
    for (const doc of col.documents || []) {
      expect(String(doc.url).startsWith(`${SUPABASE_PREFIX}product-documents/`)).toBe(true);
      expect(doc.url).not.toMatch(UPSTREAM_ASSET);
    }
    for (const color of col.colors) {
      expect(String(color.image).startsWith(`${SUPABASE_PREFIX}product-images/`)).toBe(true);
      expect(color.image).not.toMatch(UPSTREAM_ASSET);
    }
    for (const scene of col.room_scene_images || []) {
      expect(String(scene).startsWith(`${SUPABASE_PREFIX}product-images/`)).toBe(true);
    }
  });

  it('dokumenti homogene kolekcije: jedinstveni izvorni URL-ovi, naslovi popunjeni', () => {
    // NB: naslovi NE moraju biti jedinstveni — utvrđeni format (npr. STANDARD PLUS) ima
    // dva dokumenta „Sertifikat"; dedupe je po izvoru (URL), ne po naslovu. Proveravamo
    // da nema dupliranih izvornih dokumenata i da svaki ima neprazan naslov.
    for (const slug of NEW_HOMO) {
      const col = homoCollections.find((c) => c.slug === slug);
      const urls = (col.documents || []).map((d: any) => d.url);
      expect(new Set(urls).size).toBe(urls.length);
      for (const d of col.documents || []) expect(String(d.title).trim().length).toBeGreaterThan(0);
    }
  });
});

describe('S3: nove LVT/SPC kolekcije self-hostovane', () => {
  it.each(NEW_LVT)('$slug: $count stavki, type=$type, sve slike+dokumenti na Supabase', ({ slug, type, count }) => {
    const items = lvtItems.filter((p) => p.collection === slug);
    expect(items).toHaveLength(count);
    for (const it of items) {
      expect(it.type).toBe(type);
      expect(it.category).toBe('lvt');
      expect(Array.isArray(it.images) && it.images.length > 0).toBe(true);
      for (const img of it.images) {
        expect(String(img).startsWith(`${SUPABASE_PREFIX}product-images/`)).toBe(true);
        expect(img).not.toMatch(UPSTREAM_ASSET);
      }
      for (const doc of it.meta?.documents || []) {
        expect(String(doc).startsWith(`${SUPABASE_PREFIX}product-documents/`)).toBe(true);
        expect(doc).not.toMatch(UPSTREAM_ASSET);
      }
    }
  });
});
```

- [ ] **Step 2: Pokreni test**

Run: `npm run test:contract -- tarkett-new-collections-contract`
Expected: PASS. Ako padne na `UPSTREAM_ASSET` → neki asset nije uploadovan (proveri manifest/log za taj `⚠️`), ponovo pokreni ingest za tu kolekciju (resume preskače gotovo), pa opet test.

- [ ] **Step 3: Commit**

```bash
git add tests/contracts/tarkett-new-collections-contract.test.ts
git commit -m "test(s3): data contract — nove Tarkett kolekcije bez hotlinkova"
```

---

## Task 6: /cenovnik verifikacija + puni gate (build + svi contract testovi + audit)

**Files:** (bez izmena koda osim ako verifikacija pokaže problem mapiranja)

- [ ] **Step 1: Verifikuj da se 4 nove kolekcije pojavljuju u /cenovnik stablu pod Tarkett-om**

Run:
```bash
npx tsx -e "import('./lib/cenovnik/tree.ts').then(async m=>{const t=await m.loadPriceEntryTree(); const tk=t.brands.find(b=>b.brandName==='Tarkett'); const want=['tarkett-iq-motion','deal-spc-30','real-spc-50','modulart-70']; const have=tk.collections.map(c=>c.slug); for(const w of want) console.log(w, have.includes(w)?'OK':'NEDOSTAJE'); });"
```
Expected: sve 4 → `OK` (pod brendom „Tarkett"). Ako neka legne pod „Ostali brendovi" ili nedostaje → to je JEDINI slučaj gde se dira `lib/cenovnik/tree.ts`/`lib/colors/get-colors.ts` mapiranje (vidi spec §6); inače bez izmena.

- [ ] **Step 2: Pokreni SVE contract testove**

Run: `npm run test:contract`
Expected: svi zeleni (uključujući 2 nova S3 testa; postojeći gerflor/resolver/image testovi netaknuti).

- [ ] **Step 3: Audit kvaliteta kataloga**

Run: `npx tsx scripts/audit-catalog-quality.ts`
Expected: bez NOVIH grešaka u odnosu na pre-S3 stanje (nove kolekcije ne uvode broken slike/prazne dokumente).

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: uspešan build (`validate:images` + `next build` prolaze). Ako `validate:images` prijavi nove kolekcije → proveri da su sve `image` URL putanje validne.

- [ ] **Step 5: Commit (ako je bilo ikakvih izmena mapiranja; inače preskoči)**

```bash
git add -A
git commit -m "chore(s3): /cenovnik verifikacija + gate zeleni"
```

---

## Task 7: Dokumentacija (runbook) + memorija + finalni review

**Files:**
- Create: `docs/superpowers/runbooks/2026-06-13-s3-tarkett-ingest-runbook.md`
- Update memorije: `podovi-galerija-redizajn-stanje.md`

- [ ] **Step 1: Napiši runbook**

Create `docs/superpowers/runbooks/2026-06-13-s3-tarkett-ingest-runbook.md` sa sekcijama:
- **Pokretanje:** `node tools/ingest_tarkett.js [--dry-run] [--collection=<key>] [--skip-existing]`; ključevi: `iq-motion`, `deal-spc-30`, `real-spc-50`, `modulart-70`.
- **Resume:** manifest `output/ingest-tarkett-manifest.json`; ponovno pokretanje preskače uploadovano (po `doc:`/`scene:`/`swatch:` ključu).
- **Rollback:** `writeJsonWithBackup` pravi backup u `output/` pre upisa; vrati backup preko ciljnog JSON-a i `git checkout`.
- **Dodavanje nove kolekcije:** nađi `kolekcija-CXXXXX-slug` preko kategorijske stranice (sitemap je nepotpun), dodaj red u `COLLECTIONS` u `ingest_tarkett.js` (`kind`, `type` za LVT, `categorySlug`), pokreni `--collection=<key>`.
- **Upozorenja:** slike samo `/XXL/` (XXXL/original=403); PDF samo `/docs/`; Playwright potreban za `__NUXT__`; tvrdi timeout-i sprečavaju visenja (S2 lekcija).

- [ ] **Step 2: Ažuriraj memoriju o stanju**

U `C:\Users\BORIVOJE\.claude\projects\C--GitHub-Repository-for-podovi\memory\podovi-galerija-redizajn-stanje.md` dodaj: S3 isporučen — Tarkett ingest put (`tools/lib/tarkett-parse.js` + `tools/ingest_tarkett.js`) + 4 nove kolekcije (iQ Motion homogeni; Deal/Real SPC + ModularT 70 LVT) self-hostovane; stari `modulart-7` ostaje do S4; otvoreno pitanje za vlasnika (sakriti stari ModularT 7?). Zadrži pravac S4 (migracija 16.835 hotlinkova).

- [ ] **Step 3: Finalni pregled svih izmena**

Run: `git log --oneline -8` i `git status`
Proveri: 6 commit-a (parse, orkestracija, pilot, LVT, contract, runbook/memorija); radno stablo čisto; `public/data/*.json` backup-i u `output/` (ne u git-u sem ciljnih JSON-ova).

- [ ] **Step 4: Commit dokumentacije**

```bash
git add docs/superpowers/runbooks/2026-06-13-s3-tarkett-ingest-runbook.md
git commit -m "docs(s3): runbook za Tarkett ingest + ažurirana memorija"
```

- [ ] **Step 5: Deploy odluka (vlasnik)**

Deploy na produkciju (`push main`) je RUČNA odluka vlasnika (kao i ranije). Sažmi: 4 nove kolekcije, sve self-hostovano, /cenovnik ih vidi, gate zelen. Pitaj da li push i da li sakriti stari ModularT 7.

---

## Self-Review

**1. Spec coverage** (`docs/superpowers/specs/2026-06-13-faza-2-s3-tarkett-ingest-design.md`):
- §4 reuse ingest-core → Task 2 (require netaknut). ✅
- §4 `tarkett-parse.js` čiste funkcije + contract fixtures → Task 1. ✅
- §4 `ingest_tarkett.js` orkestracija, flagovi `--dry-run/--collection=/--skip-existing`, manifest → Task 2. ✅
- §4 self-hosting (slike+PDF u Supabase, JSON samo Supabase URL-ovi, postojeće netaknuto) → Task 3/4 + contract Task 5. ✅
- §4 srpski nazivi dokumenata (reuse `mapDocumentTitle` + Tarkett `document_role_translated`) → Task 1 `collectionDocsFromAssets`. ✅
- §5 DB-first prikaz, prva boja, breadcrumb → besplatno (postojeći loader/resolver iz S2); vizuelna provera Task 3/4. ✅
- §6 /cenovnik auto-discovery → Task 6 verifikacija. ✅
- §7 gate (build + test:contract + novi data contract + audit + vizuelno + /cenovnik) → Task 5/6. ✅
- §9 pilot prvo (de-rizik Nuxt strukture) → Task 3 (iQ Motion). ✅; anti-bot/timeout → ingest-core timeout-i + fetchNuxt. ✅; SPC mapiranje → Task 6 Step 1 (verifikuje, dira samo ako treba). ✅

**2. Placeholder scan:** Nema „TBD"/„implement later"; sav kod je kompletan (parse modul + orkestrator + 2 testa). Brojevi boja (16/2/6/16), collection_id-evi, URL-ovi, Supabase prefiks — svi konkretni iz izviđanja.

**3. Type/ime konzistentnost:**
- Funkcije iz `tarkett-parse.js` korišćene u testu (Task 1) === eksportovane === pozvane u orkestratoru (Task 2): `extractCollectionItem`, `mediaImageUrl`, `colorCode`, `cleanColorName`, `homogeneousColorCharacteristics`, `toSerbianCharacteristics`, `collectionDocsFromAssets`, `galleryImagesFromAssets`, `stripHtml`, `keyFeatureItems`. ✅
- Ciljni JSON oblici (homogeni: `collections[]` sa `colorCount`/`colors`/`collection_image_url`/`documents`; LVT: flat `{id,name,collection,type,category,images,specs,brandId,meta.documents}`) === postojeći format iz repo-pack §1/§2 === contract test (Task 5) provere. ✅
- `brandId`: homogeni boje `"3"`, LVT stavke `"tarkett"` (loader override `"3"`) — usklađeno sa postojećim podacima i `get-colors.ts`. ✅
- Bucket/path konvencija `products/<categorySlug>/<slug>/{decor,ambience}` + docs `products/<categorySlug>/<slug>/<title>.pdf` === S2 konvencija. ✅

**Napomena (svesno van obima):** Per-boja „Tabela formata"/„Tehnički list" PDF-ovi (hotlink u postojećih 20 homogenih kolekcija) se NE prave za nove kolekcije — umesto toga kolekcioni self-hostovani dokumenti (čistiji, bez 40 hotlinkova), što direktiva zahteva. PDP ih prikazuje preko `collection.documents` (Task 3 Step 4 vizuelno potvrđuje).
