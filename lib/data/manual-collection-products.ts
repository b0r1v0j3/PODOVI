import { Product, ProductSpec } from '@/types';
import vinylSpecialColorsData from '@/public/data/vinyl_special_colors.json';
import industrialColorsData from '@/public/data/industrial_colors.json';
import sportColorsData from '@/public/data/sport_colors.json';

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
  if (imageFromJson) {
    return imageFromJson;
  }

  return fallbackUrl;
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
];

export function getManualCollectionProducts(): Product[] {
  return manualCollectionProducts;
}
