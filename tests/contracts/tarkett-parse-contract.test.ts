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
  it('ModularT: skida brand prefiks (Modu70), format token (20X120) i finish kod (1I)', () => {
    // Realni ModularT 70 design[0] (upstream-pack.md §2): collection_name je "ModularT 70",
    // ali product_name nosi skraćeni "Modu70" prefiks koji se ne poklapa sa collection_name.
    expect(cleanColorName('Modu70 20X120 Elegant Oak LIGHT BEIGE 1I', 'ModularT 70')).toBe('Elegant Oak Light Beige');
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
  it('gradi /docs/ URL-ove iz collection_assets, koristi srpski document_role_translated, dedupe po URL-u', () => {
    const item = {
      collection_assets: [
        { document_role: 'DATASHEET', document_role_translated: 'Tehnički list', document_asset_url: 'DS_SEE_Deal_SPC_30_SRB.pdf', document_mime_type: 'application/pdf' },
        { document_role: 'INSTALLATION', document_role_translated: 'Uputstvo za instalaciju', document_asset_url: 'IG_Installation_Guide_Deal_SPC_30_ENG.pdf', document_mime_type: 'application/pdf' },
        // Pravi duplikat = isti document_asset_url -> uklanja se.
        { document_role: 'DATASHEET', document_role_translated: 'Tehnički list', document_asset_url: 'DS_SEE_Deal_SPC_30_SRB.pdf', document_mime_type: 'application/pdf' },
        { document_role: 'COVER', document_role_translated: 'Naslovna slika kolekcije', document_asset_url: 'IN_cover.jpg', document_mime_type: 'image/jpeg' },
      ],
    };
    const docs = collectionDocsFromAssets(item);
    expect(docs).toHaveLength(2); // dedupe isti URL (Tehnički list), izbaci sliku (image/*)
    expect(docs[0]).toEqual({ title: 'Tehnički list', sourceUrl: 'https://media.tarkett-image.com/docs/DS_SEE_Deal_SPC_30_SRB.pdf' });
    expect(docs[1].title).toBe('Uputstvo za instalaciju');
  });

  it('NE odbacuje dva različita PDF-a koja dele srpsku rolu (dedupe po URL-u, ne po naslovu)', () => {
    // Real SPC 50 (upstream-pack.md §5): dva odvojena INSTALLATION guide-a -> isti "Uputstvo za instalaciju".
    // Oba moraju preživeti (kao STANDARD PLUS koji u repou drži dva dokumenta "Sertifikat").
    const item = {
      collection_assets: [
        { document_role: 'INSTALLATION', document_role_translated: 'Uputstvo za instalaciju', document_asset_url: 'IG_Installation_Guide_Real_SPC_50_ENG.pdf', document_mime_type: 'application/pdf' },
        { document_role: 'INSTALLATION', document_role_translated: 'Uputstvo za instalaciju', document_asset_url: 'IG_Installation_Guide_Herringbone_Real_SPC_50.pdf', document_mime_type: 'application/pdf' },
        { document_role: 'DATASHEET', document_role_translated: 'Tehnički list', document_asset_url: 'DS_SEE_Real_SPC_50_SRB.pdf', document_mime_type: 'application/pdf' },
        // Pravi duplikat (isti asset URL) se i dalje uklanja.
        { document_role: 'DATASHEET', document_role_translated: 'Tehnički list', document_asset_url: 'DS_SEE_Real_SPC_50_SRB.pdf', document_mime_type: 'application/pdf' },
      ],
    };
    const docs = collectionDocsFromAssets(item);
    expect(docs).toHaveLength(3);
    expect(docs.map((d) => d.sourceUrl)).toEqual([
      'https://media.tarkett-image.com/docs/IG_Installation_Guide_Real_SPC_50_ENG.pdf',
      'https://media.tarkett-image.com/docs/IG_Installation_Guide_Herringbone_Real_SPC_50.pdf',
      'https://media.tarkett-image.com/docs/DS_SEE_Real_SPC_50_SRB.pdf',
    ]);
    expect(docs[0].title).toBe('Uputstvo za instalaciju');
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
