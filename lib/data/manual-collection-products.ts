import { Product, ProductSpec } from '@/types';
import vinylSpecialColorsData from '@/public/data/vinyl_special_colors.json';
import industrialColorsData from '@/public/data/industrial_colors.json';
import sportColorsData from '@/public/data/sport_colors.json';
import { selectPreferredCollectionHeroAsset } from '@/lib/utils/catalog-assets';

const DEFAULT_DATE = new Date('2024-01-01');

type ManualCollectionConfig = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  imageUrl?: string;
  externalLink: string;
  specs: ProductSpec[];
  documents?: Product['documents'];
  detailsSections?: Product['detailsSections'];
};

type CollectionImageSource = {
  slug?: string;
  collection_image_url?: string;
};

const manualCollectionImageSources = [
  ...((((vinylSpecialColorsData as any)?.collections || []) as CollectionImageSource[])),
  ...((((industrialColorsData as any)?.collections || []) as CollectionImageSource[])),
  ...((((sportColorsData as any)?.collections || []) as CollectionImageSource[])),
];

function isRemoteImageUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function resolveCollectionImageUrl(productSlug: string, fallbackUrl?: string) {
  const collectionSlug = productSlug.replace(/^gerflor-/, '');
  const imageFromJson = manualCollectionImageSources.find((collection) => collection.slug === collectionSlug)?.collection_image_url;
  return selectPreferredCollectionHeroAsset(imageFromJson, fallbackUrl);
}

function normalizeDocumentUrl(url: string) {
  return String(url || '').split('?')[0];
}

function createCollectionProduct(config: ManualCollectionConfig): Product {
  const imageUrl = resolveCollectionImageUrl(config.slug, config.imageUrl);

  return {
    id: config.id,
    name: config.name,
    slug: config.slug,
    sku: config.sku,
    categoryId: config.categoryId,
    brandId: '6',
    shortDescription: config.shortDescription,
    description: config.description,
    images: imageUrl ? [
      {
        id: `${config.id}-img`,
        url: imageUrl,
        alt: config.name,
        isPrimary: true,
        order: 0,
      },
    ] : [],
    specs: config.specs,
    documents: config.documents?.map((document) => ({
      ...document,
      url: normalizeDocumentUrl(document.url),
    })),
    externalLink: config.externalLink,
    detailsSections: config.detailsSections,
    inStock: true,
    featured: false,
    createdAt: DEFAULT_DATE,
    updatedAt: DEFAULT_DATE,
  };
}

export const manualCollectionProducts: Product[] = [
  createCollectionProduct({
    id: 'manual-vinyl-mipolam-biocontrol-clean',
    name: 'Mipolam Biocontrol Clean',
    slug: 'gerflor-mipolam-biocontrol-clean',
    sku: 'VINIL-MIPOLAM-BIOCONTROL-CLEAN',
    categoryId: '2',
    shortDescription: 'Homogeni vinil za clean room i visoko kontrolisane prostore.',
    description:
      'Mipolam Biocontrol Clean je homogeni vinil razvijen za farmaceutske pogone, laboratorije i druge clean room prostore gde su higijena, zavarljivost i dugorocna cistoca podloge presudni.',
    imageUrl: '/images/products/vinyl/mipolam-biocontrol-clean/collection.jpg',
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-biocontrol-clean',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Biocontrol Clean' },
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'thickness', label: 'Ukupna debljina', value: '2.00 mm' },
      { key: 'format', label: 'Format', value: 'Rola' },
      { key: 'application', label: 'Namena', value: 'Clean room, laboratorije, farmacija' },
    ],
    documents: [
      { title: 'Technical Data Sheet', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/40901-mipolam-biocontrol-clean-technical-data-sheet.pdf?v=20260616042226', type: 'tech_datasheet' },
      { title: 'Life Sciences - Guide', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/21058-life-sciences-gb-guide.pdf?v=20260616042230', type: 'guide' },
      { title: 'Installation Guidelines', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/42987-tiles-and-rolls-welding-installation-guidelines.pdf?v=20260616042229', type: 'installation' },
      { title: 'Maintenance Instructions', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/47406-maintenance-for-for-mipolam-flooring-evercare-treatment-maintenance-inscructions.pdf?v=20260616042224', type: 'maintenance' },
      { title: 'Declaration of Performance', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/42191-mipolam-biocontrol-clean-dop.pdf?v=20260616042229', type: 'dop' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Pogodan za prostore sa vrlo visokim higijenskim zahtevima.',
          'Mat povrsina i laka dekontaminacija u clean room okruzenjima.',
          'Fleksibilan materijal za preciznu obradu, zavare i holkere.',
          'Projektovan za dugotrajan rad u farmaciji i laboratorijama.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-vinyl-mipolam-biocontrol-performance',
    name: 'Mipolam Biocontrol Performance',
    slug: 'gerflor-mipolam-biocontrol-performance',
    sku: 'VINIL-MIPOLAM-BIOCONTROL-PERFORMANCE',
    categoryId: '2',
    shortDescription: 'Specijalni homogeni vinil za zahtevne clean room i tehnicke prostore.',
    description:
      'Mipolam Biocontrol Performance je homogeni vinil za prostore u kojima se traze hemijska otpornost, otpornost na dekontaminaciju i visoka postojanost pri intenzivnom koriscenju.',
    imageUrl: '/images/products/vinyl/mipolam-biocontrol-performance/collection.jpg',
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-biocontrol-performance',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Biocontrol Performance' },
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'thickness', label: 'Ukupna debljina', value: '2.00 mm' },
      { key: 'format', label: 'Format', value: 'Rola' },
      { key: 'application', label: 'Namena', value: 'Clean room, nuklearni i tehnicki prostori' },
    ],
    documents: [
      { title: 'Technical Data Sheet', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/40583-mipolam-biocontrol-performance-technical-data-sheet.pdf?v=20260616042227', type: 'tech_datasheet' },
      { title: 'Life Sciences - Guide', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/21058-life-sciences-gb-guide.pdf?v=20260616042230', type: 'guide' },
      { title: 'Installation Guidelines', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/42987-tiles-and-rolls-welding-installation-guidelines.pdf?v=20260616042229', type: 'installation' },
      { title: 'Maintenance Instructions', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/47406-maintenance-for-for-mipolam-flooring-evercare-treatment-maintenance-inscructions.pdf?v=20260616042224', type: 'maintenance' },
      { title: 'Declaration of Performance', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/60431-mipolam-biocontrol-performance-declaration-of-performance.pdf?v=20260616042229', type: 'dop' },
      { title: 'Environmental Product Declaration', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/47600-epd-mipolam-symbioz-mipolam-biocontrol-performance-for-europe.pdf?v=20260616042231', type: 'epd' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Odlicna otpornost na procese dekontaminacije.',
          'Visoka otpornost na hemikalije, mrlje i mikroorganizme.',
          'Projektovan za teske uslove rada i visok saobracaj.',
          'Pogodan za clean room i tehnicke objekte sa visokim standardima.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-industrial-gti-max-cleantech',
    name: 'GTI Max Cleantech',
    slug: 'gerflor-gti-max-cleantech',
    sku: 'IND-GTI-MAX-CLEANTECH',
    categoryId: '9',
    shortDescription: 'Modularne industrijske ploce za renovacije i ciste tehnicke prostore.',
    description:
      'GTI Max Cleantech su industrijske loose-lay ploce velikog formata za brzu renovaciju, visok saobracaj i tehnicke prostore gde je vazna cistoca, otpornost i minimalan zastoj objekta.',
    imageUrl: '/images/products/industrial/gti-max-cleantech/collection.jpg',
    externalLink: 'https://www.gerflor-cee.com/products/gti-max-cleantech',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'GTI Max Cleantech' },
      { key: 'type', label: 'Tip', value: 'Industrijske ploce' },
      { key: 'thickness', label: 'Ukupna debljina', value: '6.00 mm' },
      { key: 'format', label: 'Format', value: 'Ploce 63.5 x 63.5 cm' },
      { key: 'installation', label: 'Ugradnja', value: 'Loose lay / Connect' },
    ],
    documents: [
      { title: 'Technical Datasheet', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/43315-gti-max-technical-datasheet.pdf?v=20260616042230', type: 'tech_datasheet' },
      { title: 'Product Description', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/58195-gti-max-cleantech-product-description.doc?v=20260616042230', type: 'product_description' },
      { title: 'Maintenance Instruction', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/67285-technical-tiles-maintenance-instruction.pdf?v=20260616042218', type: 'maintenance' },
      { title: 'Environmental Datasheet', url: 'https://cdn.gerflor.com/media/2/58974/gti%20max%20-%20environmental%20datasheet%20(europe).pdf', type: 'environmental_datasheet' },
      { title: 'EPD Europe', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/58559-gti-tiles-epd-europe.pdf?v=20260616042233', type: 'epd' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Brza renovacija bez dugog zastoja prostora.',
          'Visoka otpornost na intenzivan saobracaj i habanje.',
          'Modularan sistem za tehnicke i ciste radne zone.',
          'Povrsina laka za odrzavanje u zahtevnim objektima.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-industrial-gti-max-connect',
    name: 'GTI Max Connect',
    slug: 'gerflor-gti-max-connect',
    sku: 'IND-GTI-MAX-CONNECT',
    categoryId: '9',
    shortDescription: 'Modularne ploce za industriju, renovacije i zone visokog saobracaja.',
    description:
      'GTI Max Connect je sistem industrijskih ploca za fastrack renovacije, objekte sa velikim opterecenjem i prostore gde je bitno brzo pustanje u rad bez komplikovane pripreme.',
    imageUrl: '/images/products/industrial/gti-max-connect/collection.jpg',
    externalLink: 'https://www.gerflor-cee.com/products/gti-max-connect',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'GTI Max Connect' },
      { key: 'type', label: 'Tip', value: 'Industrijske ploce' },
      { key: 'thickness', label: 'Ukupna debljina', value: '6.00 mm' },
      { key: 'format', label: 'Format', value: 'Ploce 63.5 x 63.5 cm' },
      { key: 'installation', label: 'Ugradnja', value: 'Loose lay / Connect' },
    ],
    documents: [
      { title: 'Technical Datasheet', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/43315-gti-max-technical-datasheet.pdf?v=20260616042230', type: 'tech_datasheet' },
      { title: 'Installation Guidelines', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/39401-gti-max-connect-installation-guidelines.pdf?v=20260616042231', type: 'installation' },
      { title: 'Maintenance Instruction', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/67285-technical-tiles-maintenance-instruction.pdf?v=20260616042218', type: 'maintenance' },
      { title: 'Environmental Product Declaration', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/31664-gti-max-connect-environmental-product-declaration.pdf?v=20260616042231', type: 'epd' },
      { title: 'Product Description', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/58194-gti-max-connect-product-description.doc?v=20260616042231', type: 'product_description' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Loose lay ugradnja bez lepljenja na celoj povrsini.',
          'Pogodan za industrijske i logisticke prostore.',
          'Jak habajuci sloj za dug radni vek.',
          'Dobra opcija kada objekat mora brzo nazad u funkciju.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-industrial-gti-pure-connect',
    name: 'GTI Pure Connect',
    slug: 'gerflor-gti-pure-connect',
    sku: 'IND-GTI-PURE-CONNECT',
    categoryId: '9',
    shortDescription: 'Tehnicke ploce za renovacije, zoniranje i intenzivnu komercijalnu upotrebu.',
    description:
      'GTI Pure Connect je modularni sistem ploca za brze renovacije i zone visokog saobracaja, sa jacim habajucim slojem i formatom pogodnim za tehnicke i komercijalne objekte.',
    imageUrl: '/images/products/industrial/gti-pure-connect/collection.jpg',
    externalLink: 'https://www.gerflor-cee.com/products/gti-pure-connect',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'GTI Pure Connect' },
      { key: 'type', label: 'Tip', value: 'Industrijske ploce' },
      { key: 'thickness', label: 'Ukupna debljina', value: '6.00 mm' },
      { key: 'format', label: 'Format', value: 'Ploce 63.5 x 63.5 cm' },
      { key: 'installation', label: 'Ugradnja', value: 'Loose lay / Connect' },
    ],
    documents: [
      { title: 'Technical Datasheet', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/43319-gti-pure-connect-technical-datasheet.pdf?v=20260616042231', type: 'tech_datasheet' },
      { title: 'Installation Guidelines', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/47534-gti-pure-installation-guidelines.pdf?v=20260616042233', type: 'installation' },
      { title: 'Maintenance Instruction', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/67285-technical-tiles-maintenance-instruction.pdf?v=20260616042218', type: 'maintenance' },
      { title: 'Environmental Datasheet', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/58975-gti-pure-environmental-datasheet-europe.pdf?v=20260616042232', type: 'environmental_datasheet' },
      { title: 'Declaration of Performance', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/60429-gti-pure-dop.pdf?v=20260616042232', type: 'dop' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Pogodan za brzo osvezavanje i podelu radnih zona.',
          'Visoka otpornost na svakodnevni intenzivni prolaz.',
          'Jednostavno odrzavanje zahvaljujuci PUR+ povrsini.',
          'Modularni format olaksava zamenu pojedinacnih ploca.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-industrial-attraction-connect',
    name: 'Attraction Connect',
    slug: 'gerflor-attraction-connect',
    sku: 'IND-ATTRACTION-CONNECT',
    categoryId: '9',
    shortDescription: 'Dekorativne industrijske ploce za renovacije bez velikog zastoja.',
    description:
      'Attraction Connect je tehnicka ploca za renovacije i brzu ugradnju u objektima gde su vazni estetika, jednostavno odrzavanje i minimalan prekid rada prostora.',
    imageUrl: '/images/products/industrial/attraction-connect/collection.jpg',
    externalLink: 'https://www.gerflor-cee.com/products/attraction-connect',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Attraction Connect' },
      { key: 'type', label: 'Tip', value: 'Industrijske ploce' },
      { key: 'thickness', label: 'Ukupna debljina', value: '5.00 mm' },
      { key: 'format', label: 'Format', value: 'Ploce 63.5 x 63.5 cm' },
      { key: 'installation', label: 'Ugradnja', value: 'Loose lay / Connect' },
    ],
    documents: [
      { title: 'Technical Data Sheet', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/41727-attraction-technical-data-sheet.pdf?v=20260616042233', type: 'tech_datasheet' },
      { title: 'Installation Guidelines', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/17715-attraction-installation-guidelines.pdf?v=20260616042233', type: 'installation' },
      { title: 'Maintenance Instruction', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/67285-technical-tiles-maintenance-instruction.pdf?v=20260616042218', type: 'maintenance' },
      { title: 'Environmental Datasheet', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/57316-attraction-environmental-datasheet-europe.pdf?v=20260616042233', type: 'environmental_datasheet' },
      { title: 'Environmental Product Declaration', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/56910-attraction-epd.pdf?v=20260616042234', type: 'epd' },
      { title: 'Declaration of Performance', url: 'https://cdn.gerflor.com/media/2/28959/attraction%C2%AE%20-%20declaration%20of%20performance%20%20d%C3%A9claration%20de%20performance.pdf', type: 'dop' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Brza renovacija bez zatvaranja prostora na duzi period.',
          'Trendi paleta boja za zoniranje i vizuelnu signalizaciju.',
          'Pogodan za objekte sa visokim prolazom.',
          'Jednostavno odrzavanje i zamena pojedinacnih elemenata.',
        ],
      },
    ],
  }),
  // ── S9: Gerflor R-Tile + Design Tile (PVC interlocking industrijske ploče, cat 9) ──
  // Boje/PDP swatch-evi se resolve-uju iz public/data/industrial_colors.json preko
  // prepare-colors cat-9 grane (slug strip 'gerflor-' → industrialCollections.find).
  // SKU prefiks IND- (vec u hasCollectionSku obe instance) → kartice na /kategorije/industrijske-ploce.
  createCollectionProduct({
    id: 'manual-industrial-r-tile-4mm',
    name: 'R-Tile 4mm',
    slug: 'gerflor-r-tile-4mm',
    sku: 'IND-R-TILE-4MM',
    categoryId: '9',
    shortDescription: 'PVC modularne ploče sa klik spojem, 4 mm, za brzu ugradnju bez lepka.',
    description:
      'R-Tile 4mm su PVC industrijske ploče sa interlocking (klik) spojem za brzu ugradnju bez lepljenja, pogodne za radionice, garaze, izlozbene i lake industrijske prostore gde je vazno brzo pustanje u rad.',
    imageUrl: '/images/products/industrial/r-tile-4mm/collection.jpg',
    externalLink: 'https://www.gerflor-cee.com/products/r-tile-4mm',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'R-Tile 4mm' },
      { key: 'type', label: 'Tip', value: 'Industrijske ploce' },
      { key: 'thickness', label: 'Ukupna debljina', value: '4.00 mm' },
      { key: 'installation', label: 'Ugradnja', value: 'Interlocking (klik), bez lepka' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Interlocking spoj — ugradnja bez lepka i brzo pustanje u rad.',
          'Pogodno za radionice, garaze i lake industrijske prostore.',
          'Modularan sistem za laku zamenu ostecenih ploca.',
          'Otpornost na svakodnevni saobracaj i habanje.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-industrial-r-tile-5mm',
    name: 'R-Tile 5mm',
    slug: 'gerflor-r-tile-5mm',
    sku: 'IND-R-TILE-5MM',
    categoryId: '9',
    shortDescription: 'PVC modularne ploče sa klik spojem, 5 mm, za jaci saobracaj.',
    description:
      'R-Tile 5mm su PVC industrijske ploče sa klik spojem i vecom debljinom za zone sa jacim opterecenjem, ugradnja je bez lepljenja a sistem omogucava brzu renovaciju i zamenu pojedinacnih elemenata.',
    imageUrl: '/images/products/industrial/r-tile-5mm/collection.jpg',
    externalLink: 'https://www.gerflor-cee.com/products/r-tile-5mm',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'R-Tile 5mm' },
      { key: 'type', label: 'Tip', value: 'Industrijske ploce' },
      { key: 'thickness', label: 'Ukupna debljina', value: '5.00 mm' },
      { key: 'installation', label: 'Ugradnja', value: 'Interlocking (klik), bez lepka' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Veca debljina za zone sa jacim saobracajem.',
          'Interlocking spoj — ugradnja bez lepka.',
          'Brza renovacija i zamena pojedinacnih ploca.',
          'Otpornost na habanje u industrijskim uslovima.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-industrial-r-tile-7mm',
    name: 'R-Tile 7mm',
    slug: 'gerflor-r-tile-7mm',
    sku: 'IND-R-TILE-7MM',
    categoryId: '9',
    shortDescription: 'PVC modularne ploče sa klik spojem, 7 mm, za teze opterecenje.',
    description:
      'R-Tile 7mm su PVC industrijske ploče sa klik spojem i pojacanom debljinom za teze opterecenje, namenjene proizvodnim halama, servisima i prostorima sa visokim saobracajem gde se trazi izdrzljiv pod bez lepljenja.',
    imageUrl: '/images/products/industrial/r-tile-7mm/collection.jpg',
    externalLink: 'https://www.gerflor-cee.com/products/r-tile-7mm',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'R-Tile 7mm' },
      { key: 'type', label: 'Tip', value: 'Industrijske ploce' },
      { key: 'thickness', label: 'Ukupna debljina', value: '7.00 mm' },
      { key: 'installation', label: 'Ugradnja', value: 'Interlocking (klik), bez lepka' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Pojacana debljina za teze industrijsko opterecenje.',
          'Interlocking spoj — ugradnja bez lepka.',
          'Pogodno za proizvodne hale i servise.',
          'Modularna zamena ostecenih ploca.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-industrial-r-tile-9mm',
    name: 'R-Tile 9mm',
    slug: 'gerflor-r-tile-9mm',
    sku: 'IND-R-TILE-9MM',
    categoryId: '9',
    shortDescription: 'PVC modularne ploče sa klik spojem, 9 mm, za najteze uslove.',
    description:
      'R-Tile 9mm su najdeblje R-Tile PVC ploče sa klik spojem, namenjene najtezim industrijskim uslovima i zonama sa izuzetno visokim opterecenjem, uz ugradnju bez lepka i modularnu zamenu elemenata.',
    imageUrl: '/images/products/industrial/r-tile-9mm/collection.jpg',
    externalLink: 'https://www.gerflor-cee.com/products/r-tile-9mm',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'R-Tile 9mm' },
      { key: 'type', label: 'Tip', value: 'Industrijske ploce' },
      { key: 'thickness', label: 'Ukupna debljina', value: '9.00 mm' },
      { key: 'installation', label: 'Ugradnja', value: 'Interlocking (klik), bez lepka' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Maksimalna debljina za najteze industrijsko opterecenje.',
          'Interlocking spoj — ugradnja bez lepka.',
          'Visoka otpornost na udare i tezak saobracaj.',
          'Modularan sistem za brzu zamenu ploca.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-industrial-r-tile-excel-5mm',
    name: 'R-Tile Excel 5mm',
    slug: 'gerflor-r-tile-excel-5mm',
    sku: 'IND-R-TILE-EXCEL-5MM',
    categoryId: '9',
    shortDescription: 'PVC modularne ploče Excel sa klik spojem, 5 mm, glatka povrsina.',
    description:
      'R-Tile Excel 5mm su PVC industrijske ploče sa klik spojem i Excel povrsinom (glatkiji izgled) za prostore gde se trazi cistija estetika uz brzu ugradnju bez lepka i otpornost na intenzivan saobracaj.',
    imageUrl: '/images/products/industrial/r-tile-excel-5mm/collection.jpg',
    externalLink: 'https://www.gerflor-cee.com/products/r-tile-excel-5mm',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'R-Tile Excel 5mm' },
      { key: 'type', label: 'Tip', value: 'Industrijske ploce' },
      { key: 'thickness', label: 'Ukupna debljina', value: '5.00 mm' },
      { key: 'installation', label: 'Ugradnja', value: 'Interlocking (klik), bez lepka' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Excel povrsina za glatkiji, cistiji izgled.',
          'Interlocking spoj — ugradnja bez lepka.',
          'Pogodno za izlozbene i komercijalno-industrijske zone.',
          'Otpornost na intenzivan saobracaj.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-industrial-r-tile-excel-7mm',
    name: 'R-Tile Excel 7mm',
    slug: 'gerflor-r-tile-excel-7mm',
    sku: 'IND-R-TILE-EXCEL-7MM',
    categoryId: '9',
    shortDescription: 'PVC modularne ploče Excel sa klik spojem, 7 mm, glatka povrsina.',
    description:
      'R-Tile Excel 7mm su PVC industrijske ploče sa klik spojem, Excel povrsinom i vecom debljinom za teze opterecenje, kombinuju cistiju estetiku sa izdrzljivoscu i ugradnjom bez lepka.',
    imageUrl: '/images/products/industrial/r-tile-excel-7mm/collection.jpg',
    externalLink: 'https://www.gerflor-cee.com/products/r-tile-excel-7mm',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'R-Tile Excel 7mm' },
      { key: 'type', label: 'Tip', value: 'Industrijske ploce' },
      { key: 'thickness', label: 'Ukupna debljina', value: '7.00 mm' },
      { key: 'installation', label: 'Ugradnja', value: 'Interlocking (klik), bez lepka' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Excel povrsina sa vecom debljinom za teze opterecenje.',
          'Interlocking spoj — ugradnja bez lepka.',
          'Cistiji izgled za reprezentativne industrijske prostore.',
          'Visoka otpornost na habanje.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-industrial-r-tile-slate',
    name: 'R-Tile Slate',
    slug: 'gerflor-r-tile-slate',
    sku: 'IND-R-TILE-SLATE',
    categoryId: '9',
    shortDescription: 'PVC modularne ploče sa klik spojem i slate (skriljac) teksturom povrsine.',
    description:
      'R-Tile Slate su PVC industrijske ploče sa klik spojem i slate (skriljac) teksturom povrsine za bolji izgled i prijanjanje, pogodne za prostore gde se uz izdrzljivost trazi i dekorativna povrsina, uz ugradnju bez lepka.',
    imageUrl: '/images/products/industrial/r-tile-slate/collection.jpg',
    externalLink: 'https://www.gerflor-cee.com/products/r-tile-slate',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'R-Tile Slate' },
      { key: 'type', label: 'Tip', value: 'Industrijske ploce' },
      { key: 'installation', label: 'Ugradnja', value: 'Interlocking (klik), bez lepka' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Slate (skriljac) tekstura povrsine za bolji izgled i prijanjanje.',
          'Interlocking spoj — ugradnja bez lepka.',
          'Modularan sistem za brzu ugradnju i zamenu.',
          'Otpornost na svakodnevni saobracaj.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-industrial-design-tile',
    name: 'Design Tile',
    slug: 'gerflor-design-tile',
    sku: 'IND-DESIGN-TILE',
    categoryId: '9',
    shortDescription: 'Dekorativne PVC modularne ploče sa klik spojem i dezenima kamena i drveta.',
    description:
      'Design Tile su dekorativne PVC industrijske ploče sa klik spojem i dezenima koji oponasaju kamen, beton i drvo, za prostore gde se uz izdrzljivost i brzu ugradnju bez lepka trazi i atraktivan izgled poda.',
    imageUrl: '/images/products/industrial/design-tile/collection.jpg',
    externalLink: 'https://www.gerflor-cee.com/products/design-tile',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Design Tile' },
      { key: 'type', label: 'Tip', value: 'Industrijske ploce' },
      { key: 'installation', label: 'Ugradnja', value: 'Interlocking (klik), bez lepka' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Dekorativni dezeni kamena, betona i drveta.',
          'Interlocking spoj — ugradnja bez lepka.',
          'Spoj estetike i industrijske izdrzljivosti.',
          'Modularna zamena pojedinacnih ploca.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-sport-dlw-colorette-sport',
    name: 'DLW Colorette Sport',
    slug: 'gerflor-dlw-colorette-sport',
    sku: 'SPORT-DLW-COLORETTE',
    categoryId: '10',
    shortDescription: 'Sportski linoleum za sale i fiskulturne prostore sa jacom debljinom.',
    description:
      'DLW Colorette Sport je sportski linoleum za sale, fiskulturne dvorane i vise-namenske sportske prostore, sa prirodnim sastavom, neocare povrsinom i bojama prilagodjenim sportskim enterijerima.',
    imageUrl: '/images/products/sport/dlw-colorette-sport/collection.jpg',
    externalLink: 'https://www.gerflor-cee.com/products/dlw-colorette-sport',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'DLW Colorette Sport' },
      { key: 'type', label: 'Tip', value: 'Sportski linoleum' },
      { key: 'thickness', label: 'Ukupna debljina', value: '4.00 mm' },
      { key: 'format', label: 'Format', value: 'Rola' },
      { key: 'application', label: 'Namena', value: 'Sportske sale i gimnazije' },
    ],
    documents: [
      { title: 'Technical Data Sheet', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/68811-dlw-colorette-sport-technical-data-sheet.pdf?v=20260616042234', type: 'tech_datasheet' },
      { title: 'Sample Card', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/45656-dlw-colorette-sport-sample-card.pdf?v=20260616042236', type: 'sample_card' },
      { title: 'Maintenance Instructions', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/18174-dlw-linoleum-floor-maintenance-instructions.pdf?v=20260616042235', type: 'maintenance' },
      { title: 'Declaration of Performance', url: 'https://cdn.gerflor.com/media/2/34635/dlw%20colorette%20sport%20-%20dop.pdf', type: 'dop' },
      { title: 'Product Description', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/34958-dlw-colorette-sport-product-description.docx?v=20260616042234', type: 'product_description' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Prirodni sportski pod za sale i vise-namenske dvorane.',
          'Neocare povrsina za lakse odrzavanje i kontrolisan grip.',
          '4 mm debljina za sportske primene.',
          'Pogodan za iscrtavanje sportskih linija nakon ugradnje.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-sport-dlw-marmorette-sport-32mm',
    name: 'DLW Marmorette Sport 3.2mm',
    slug: 'gerflor-dlw-marmorette-sport-32mm',
    sku: 'SPORT-DLW-MARMORETTE-32',
    categoryId: '10',
    shortDescription: 'Sportski linoleum sa mramornim dekorom za sale i gimnasticke prostore.',
    description:
      'DLW Marmorette Sport 3.2mm je sportski linoleum sa mramornim izgledom, razvijen za sportske sale i objekte gde je potreban prirodan pod sa mogucnoscu iscrtavanja linija posle ugradnje.',
    imageUrl: '/images/products/sport/dlw-marmorette-sport-32mm/collection.jpg',
    externalLink: 'https://www.gerflor-cee.com/products/dlw-marmorette-sport-32mm',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'DLW Marmorette Sport 3.2mm' },
      { key: 'type', label: 'Tip', value: 'Sportski linoleum' },
      { key: 'thickness', label: 'Ukupna debljina', value: '3.20 mm' },
      { key: 'format', label: 'Format', value: 'Rola' },
      { key: 'application', label: 'Namena', value: 'Sportske sale i gimnasticki prostori' },
    ],
    documents: [
      { title: 'Sample Card', url: 'https://cdn.gerflor.com/media/2/21670/marmorette%20sport%20-%20sample%20card.pdf', type: 'sample_card' },
      { title: 'Product Description', url: 'https://cdn.gerflor.com/media/2/22526/dlw%20marmorette%20sport%20-%20product%20description.docx', type: 'product_description' },
      { title: 'Fire Certificate', url: 'https://cdn.gerflor.com/media/2/24267/dlw%20linoleum%20marmorette%20sport%203,2mm%20-%20fire%20certificate.pdf', type: 'fire_certificate' },
      { title: 'Declaration of Performance', url: 'https://cdn.gerflor.com/media/2/40414/marmorette%20sport%20-%20declaration%20of%20performance.pdf', type: 'dop' },
      { title: 'C2C Certificate', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/68300-dlw-linoleum-c2c.pdf?v=20260616042234', type: 'certificate' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Mramorni dekor prilagodjen sportskom okruzenju.',
          '3.2 mm debljina i lepljena ugradnja.',
          'Prirodan sastav sa visokim udelom obnovljivih sirovina.',
          'Linije za sport mogu da se iscrtavaju nakon postavljanja.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-sport-dlw-linodur-sport',
    name: 'DLW Linodur Sport',
    slug: 'gerflor-dlw-linodur-sport',
    sku: 'SPORT-DLW-LINODUR',
    categoryId: '10',
    shortDescription: 'Prirodni sportski linoleum za intenzivnu upotrebu u salama i dvoranama.',
    description:
      'DLW Linodur Sport je sportski linoleum za sale i dvorane koje traze prirodan materijal, dobru mehanicku otpornost i moderniji, suptilno zrnast izgled povrsine.',
    imageUrl: '/images/products/sport/dlw-linodur-sport/collection.jpg',
    externalLink: 'https://www.gerflor-cee.com/products/dlw-linodur-sport',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'DLW Linodur Sport' },
      { key: 'type', label: 'Tip', value: 'Sportski linoleum' },
      { key: 'thickness', label: 'Ukupna debljina', value: '4.00 mm' },
      { key: 'format', label: 'Format', value: 'Rola' },
      { key: 'application', label: 'Namena', value: 'Sportske sale i skolske dvorane' },
    ],
    documents: [
      { title: 'Sample Card', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/43411-linodur-sport-sample-card.pdf?v=20260616042236', type: 'sample_card' },
      { title: 'Maintenance Instruction', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/37988-linodur-sport-maintenance-instruction.pdf?v=20260616042235', type: 'maintenance' },
      { title: 'Installation Guidelines', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/60683-802-game-line-marking-guidelines-installation-guidelines.pdf?v=20260616042234', type: 'installation' },
      { title: 'Fire Certificate', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/37987-linodur-sport-fire-certificate.pdf?v=20260616042235', type: 'fire_certificate' },
      { title: 'Product Description', url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/products/gerflor-migrated/38007-linodur-sport-product-description.docx?v=20260616042235', type: 'product_description' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          '4 mm sportski linoleum za intenzivnu upotrebu.',
          'Neocare povrsina za odrzavanje i sportski grip.',
          'Moderan izgled sa finom zrnastom teksturom.',
          'Prirodna baza pogodna za sportske i skolske objekte.',
        ],
      },
    ],
  }),
  // ── Gerflor Taraflex (sport, cat 10) — S6 ingest ───────────────────────────
  // Ogledalo DLW Colorette Sport bloka. Slug u JSON-u (sport_colors.json) je BEZ
  // gerflor- prefiksa (taraflex-*); product slug ima gerflor- prefiks. imageUrl/documents
  // se popunjavaju iz sport_colors.json (collection_image_url) nakon realnog S6 ingest-a;
  // resolveCollectionImageUrl strip-uje gerflor- i čita collection_image_url po slug-u.
  createCollectionProduct({
    id: 'manual-sport-gerflor-taraflex-comfort-2',
    name: 'Taraflex Comfort 2',
    slug: 'gerflor-taraflex-comfort-2',
    sku: 'SPORT-TARAFLEX-COMFORT-2',
    categoryId: '10',
    shortDescription: 'Sportski vinilni pod sa visokom apsorpcijom udara za multi-sport sale.',
    description:
      'Taraflex Comfort 2 je sportski vinilni pod sa visokom apsorpcijom udara, razvijen za multi-sport sale i skolske dvorane gde su komfor i zastita igraca prioritet.',
    externalLink: 'https://www.gerflor-cee.com/products/taraflex-comfort-2',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Taraflex Comfort 2' },
      { key: 'type', label: 'Tip', value: 'Sportski vinil' },
      { key: 'format', label: 'Format', value: 'Rola' },
      { key: 'application', label: 'Namena', value: 'Multi-sport sale i skolske dvorane' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Visoka apsorpcija udara za zastitu igraca.',
          'Pogodan za vise sportova u istom prostoru.',
          'Otporna povrsina sa kontrolisanim gripom.',
          'Linije terena mogu se nanositi nakon ugradnje.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-sport-gerflor-taraflex-evolution-2',
    name: 'Taraflex Evolution 2',
    slug: 'gerflor-taraflex-evolution-2',
    sku: 'SPORT-TARAFLEX-EVOLUTION-2',
    categoryId: '10',
    shortDescription: 'Sportski vinilni pod za sale sa balansiranom apsorpcijom udara.',
    description:
      'Taraflex Evolution 2 je sportski vinilni pod za sportske sale, sa balansiranom apsorpcijom udara i izdrzljivom povrsinom za intenzivnu upotrebu.',
    externalLink: 'https://www.gerflor-cee.com/products/taraflex-evolution-2',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Taraflex Evolution 2' },
      { key: 'type', label: 'Tip', value: 'Sportski vinil' },
      { key: 'format', label: 'Format', value: 'Rola' },
      { key: 'application', label: 'Namena', value: 'Sportske sale' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Balansirana apsorpcija udara za sportske sale.',
          'Izdrzljiva povrsina za intenzivnu upotrebu.',
          'Pogodan za vise sportova.',
          'Linije terena mogu se nanositi nakon ugradnje.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-sport-gerflor-taraflex-evolution-2-drytex',
    name: 'Taraflex Evolution 2 Drytex',
    slug: 'gerflor-taraflex-evolution-2-drytex',
    sku: 'SPORT-TARAFLEX-EVOLUTION-2-DRYTEX',
    categoryId: '10',
    shortDescription: 'Sportski vinil sa Drytex podlogom za bolju otpornost na vlagu.',
    description:
      'Taraflex Evolution 2 Drytex je verzija Evolution 2 poda sa Drytex podlogom, koja pruza bolju otpornost na vlagu i pogodnija je za objekte sa povisenim nivoom vlage.',
    externalLink: 'https://www.gerflor-cee.com/products/taraflex-evolution-2-drytex',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Taraflex Evolution 2 Drytex' },
      { key: 'type', label: 'Tip', value: 'Sportski vinil' },
      { key: 'format', label: 'Format', value: 'Rola' },
      { key: 'application', label: 'Namena', value: 'Sportske sale (povisena vlaga)' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Drytex podloga za bolju otpornost na vlagu.',
          'Balansirana apsorpcija udara za sportske sale.',
          'Izdrzljiva sportska povrsina.',
          'Linije terena mogu se nanositi nakon ugradnje.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-sport-gerflor-taraflex-evolution-2-sl',
    name: 'Taraflex Evolution 2 SL',
    slug: 'gerflor-taraflex-evolution-2-sl',
    sku: 'SPORT-TARAFLEX-EVOLUTION-2-SL',
    categoryId: '10',
    shortDescription: 'Sportski vinil Evolution 2 u samostojecoj (self-laying) varijanti.',
    description:
      'Taraflex Evolution 2 SL je samostojeca (self-laying) varijanta Evolution 2 poda, namenjena brzoj instalaciji i privremenim ili polustalnim sportskim postavkama.',
    externalLink: 'https://www.gerflor-cee.com/products/taraflex-evolution-2-sl',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Taraflex Evolution 2 SL' },
      { key: 'type', label: 'Tip', value: 'Sportski vinil' },
      { key: 'format', label: 'Format', value: 'Rola' },
      { key: 'application', label: 'Namena', value: 'Sportske sale (brza instalacija)' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Samostojeca (self-laying) instalacija.',
          'Balansirana apsorpcija udara za sportske sale.',
          'Pogodno za privremene i polustalne postavke.',
          'Linije terena mogu se nanositi nakon ugradnje.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-sport-gerflor-taraflex-multi-use-62',
    name: 'Taraflex Multi-Use 6.2',
    slug: 'gerflor-taraflex-multi-use-62',
    sku: 'SPORT-TARAFLEX-MULTI-USE-62',
    categoryId: '10',
    shortDescription: 'Vise-namenski sportski vinil za sale sa mesovitom upotrebom.',
    description:
      'Taraflex Multi-Use 6.2 je vise-namenski sportski vinilni pod za sale sa mesovitom upotrebom, koji kombinuje sportske performanse sa otpornoscu na svakodnevni saobracaj i razlicite namene prostora.',
    externalLink: 'https://www.gerflor-cee.com/products/taraflex-multi-use-62',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Taraflex Multi-Use 6.2' },
      { key: 'type', label: 'Tip', value: 'Sportski vinil' },
      { key: 'format', label: 'Format', value: 'Rola' },
      { key: 'application', label: 'Namena', value: 'Vise-namenske sale' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Vise-namenska upotreba u istom prostoru.',
          'Sportske performanse uz otpornost na svakodnevni saobracaj.',
          'Izdrzljiva povrsina za mesovitu upotrebu.',
          'Linije terena mogu se nanositi nakon ugradnje.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-sport-gerflor-taraflex-performance-2',
    name: 'Taraflex Performance 2',
    slug: 'gerflor-taraflex-performance-2',
    sku: 'SPORT-TARAFLEX-PERFORMANCE-2',
    categoryId: '10',
    shortDescription: 'Profesionalni sportski vinil za takmicarske dvorane.',
    description:
      'Taraflex Performance 2 je profesionalni sportski vinilni pod za takmicarske dvorane, sa visokim sportskim performansama i povrsinom prilagodjenom zahtevnoj upotrebi i takmicenjima.',
    externalLink: 'https://www.gerflor-cee.com/products/taraflex-performance-2',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Taraflex Performance 2' },
      { key: 'type', label: 'Tip', value: 'Sportski vinil' },
      { key: 'format', label: 'Format', value: 'Rola' },
      { key: 'application', label: 'Namena', value: 'Takmicarske sportske dvorane' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Visoke sportske performanse za takmicenja.',
          'Povrsina prilagodjena zahtevnoj upotrebi.',
          'Pogodno za vise sportova u takmicarskim dvoranama.',
          'Linije terena mogu se nanositi nakon ugradnje.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-sport-gerflor-taraflex-performance-2-drytex',
    name: 'Taraflex Performance 2 Drytex',
    slug: 'gerflor-taraflex-performance-2-drytex',
    sku: 'SPORT-TARAFLEX-PERFORMANCE-2-DRYTEX',
    categoryId: '10',
    shortDescription: 'Profesionalni sportski vinil sa Drytex podlogom za vlazne objekte.',
    description:
      'Taraflex Performance 2 Drytex je verzija Performance 2 poda sa Drytex podlogom, koja zadrzava takmicarske sportske performanse uz bolju otpornost na vlagu.',
    externalLink: 'https://www.gerflor-cee.com/products/taraflex-performance-2-drytex',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Taraflex Performance 2 Drytex' },
      { key: 'type', label: 'Tip', value: 'Sportski vinil' },
      { key: 'format', label: 'Format', value: 'Rola' },
      { key: 'application', label: 'Namena', value: 'Takmicarske dvorane (povisena vlaga)' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Drytex podloga za bolju otpornost na vlagu.',
          'Visoke takmicarske sportske performanse.',
          'Povrsina prilagodjena zahtevnoj upotrebi.',
          'Linije terena mogu se nanositi nakon ugradnje.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-sport-gerflor-taraflex-performance-2-sl',
    name: 'Taraflex Performance 2 SL',
    slug: 'gerflor-taraflex-performance-2-sl',
    sku: 'SPORT-TARAFLEX-PERFORMANCE-2-SL',
    categoryId: '10',
    shortDescription: 'Profesionalni sportski vinil Performance 2 u samostojecoj varijanti.',
    description:
      'Taraflex Performance 2 SL je samostojeca (self-laying) varijanta Performance 2 poda, namenjena brzoj instalaciji za takmicenja i dogadjaje uz zadrzane sportske performanse.',
    externalLink: 'https://www.gerflor-cee.com/products/taraflex-performance-2-sl',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Taraflex Performance 2 SL' },
      { key: 'type', label: 'Tip', value: 'Sportski vinil' },
      { key: 'format', label: 'Format', value: 'Rola' },
      { key: 'application', label: 'Namena', value: 'Takmicenja i dogadjaji (brza instalacija)' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Samostojeca (self-laying) instalacija.',
          'Visoke takmicarske sportske performanse.',
          'Pogodno za dogadjaje i privremene postavke.',
          'Linije terena mogu se nanositi nakon ugradnje.',
        ],
      },
    ],
  }),
  createCollectionProduct({
    id: 'manual-sport-gerflor-taraflex-surface-2',
    name: 'Taraflex Surface 2',
    slug: 'gerflor-taraflex-surface-2',
    sku: 'SPORT-TARAFLEX-SURFACE-2',
    categoryId: '10',
    shortDescription: 'Sportski vinil za sale sa naglaskom na izdrzljivost povrsine.',
    description:
      'Taraflex Surface 2 je sportski vinilni pod za sale sa naglaskom na izdrzljivu povrsinu i dobre sportske performanse, pogodan za skolske i rekreativne objekte.',
    externalLink: 'https://www.gerflor-cee.com/products/taraflex-surface-2',
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Taraflex Surface 2' },
      { key: 'type', label: 'Tip', value: 'Sportski vinil' },
      { key: 'format', label: 'Format', value: 'Rola' },
      { key: 'application', label: 'Namena', value: 'Skolske i rekreativne sale' },
    ],
    detailsSections: [
      {
        title: 'Ključne karakteristike',
        items: [
          'Izdrzljiva sportska povrsina.',
          'Dobre sportske performanse za sale.',
          'Pogodno za skolske i rekreativne objekte.',
          'Linije terena mogu se nanositi nakon ugradnje.',
        ],
      },
    ],
  }),
];

function cloneManualCollectionProduct(product: Product): Product {
  return {
    ...product,
    images: (product.images || []).map((image) => ({ ...image })),
    specs: (product.specs || []).map((spec) => ({ ...spec })),
    documents: product.documents?.map((document) => ({ ...document })),
    detailsSections: product.detailsSections?.map((section) => ({
      ...section,
      items: [...section.items],
    })),
    compatibleAccessories: product.compatibleAccessories ? [...product.compatibleAccessories] : undefined,
  };
}

export function getManualCollectionProducts(): Product[] {
  return manualCollectionProducts.map(cloneManualCollectionProduct);
}
