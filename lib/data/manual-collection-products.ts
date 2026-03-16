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
  if (imageFromJson) {
    return imageFromJson;
  }

  return fallbackUrl;
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
      { title: 'Technical Data Sheet', url: 'https://cdn.gerflor.com/media/2/40901/mipolam%20biocontrol%20clean%20-%20technical%20data%20sheet.pdf', type: 'tech_datasheet' },
      { title: 'Life Sciences - Guide', url: 'https://cdn.gerflor.com/media/2/21058/life%20sciences%20-%20gb%20guide.pdf', type: 'guide' },
      { title: 'Installation Guidelines', url: 'https://cdn.gerflor.com/media/2/42987/tiles%20and%20rolls%20welding%20-%20installation%20guidelines.pdf', type: 'installation' },
      { title: 'Maintenance Instructions', url: 'https://cdn.gerflor.com/media/2/47406/%20maintenance%20for%20for%20mipolam%20flooring%20(evercare%20treatment)%20-%20maintenance%20inscructions%20.pdf', type: 'maintenance' },
      { title: 'Declaration of Performance', url: 'https://cdn.gerflor.com/media/2/42191/mipolam%20biocontrol%20clean%20-%20dop.pdf', type: 'dop' },
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
      { title: 'Technical Data Sheet', url: 'https://cdn.gerflor.com/media/2/40583/mipolam%20biocontrol%20performance%20-%20technical%20data%20sheet.pdf', type: 'tech_datasheet' },
      { title: 'Life Sciences - Guide', url: 'https://cdn.gerflor.com/media/2/21058/life%20sciences%20-%20gb%20guide.pdf', type: 'guide' },
      { title: 'Installation Guidelines', url: 'https://cdn.gerflor.com/media/2/42987/tiles%20and%20rolls%20welding%20-%20installation%20guidelines.pdf', type: 'installation' },
      { title: 'Maintenance Instructions', url: 'https://cdn.gerflor.com/media/2/47406/%20maintenance%20for%20for%20mipolam%20flooring%20(evercare%20treatment)%20-%20maintenance%20inscructions%20.pdf', type: 'maintenance' },
      { title: 'Declaration of Performance', url: 'https://cdn.gerflor.com/media/2/60431/mipolam%20biocontrol%20performance%20-%20declaration%20of%20performance.pdf', type: 'dop' },
      { title: 'Environmental Product Declaration', url: 'https://cdn.gerflor.com/media/2/47600/epd%20mipolam%20symbioz%20%E2%80%93%20mipolam%20biocontrol%20performance%20for%20europe.pdf', type: 'epd' },
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
      { title: 'Technical Datasheet', url: 'https://cdn.gerflor.com/media/2/43315/gti%20max%20-%20technical%20datasheet.pdf', type: 'tech_datasheet' },
      { title: 'Product Description', url: 'https://cdn.gerflor.com/media/2/58195/gti%20max%20cleantech%20-%20product%20description.doc', type: 'product_description' },
      { title: 'Maintenance Instruction', url: 'https://cdn.gerflor.com/media/2/67285/technical%20tiles%20-%20maintenance%20instruction.pdf', type: 'maintenance' },
      { title: 'Environmental Datasheet', url: 'https://cdn.gerflor.com/media/2/58974/gti%20max%20-%20environmental%20datasheet%20(europe).pdf', type: 'environmental_datasheet' },
      { title: 'EPD Europe', url: 'https://cdn.gerflor.com/media/2/58559/gti%20tiles%20-%20epd%20europe.pdf', type: 'epd' },
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
      { title: 'Technical Datasheet', url: 'https://cdn.gerflor.com/media/2/43315/gti%20max%20-%20technical%20datasheet.pdf', type: 'tech_datasheet' },
      { title: 'Installation Guidelines', url: 'https://cdn.gerflor.com/media/2/39401/gti%20max%20connect%20-%20installation%20guidelines.pdf', type: 'installation' },
      { title: 'Maintenance Instruction', url: 'https://cdn.gerflor.com/media/2/67285/technical%20tiles%20-%20maintenance%20instruction.pdf', type: 'maintenance' },
      { title: 'Environmental Product Declaration', url: 'https://cdn.gerflor.com/media/2/31664/gti%20max%20connect%20-%20environmental%20product%20declaration.pdf', type: 'epd' },
      { title: 'Product Description', url: 'https://cdn.gerflor.com/media/2/58194/gti%20max%20connect%20-%20product%20description.doc', type: 'product_description' },
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
      { title: 'Technical Datasheet', url: 'https://cdn.gerflor.com/media/2/43319/gti%20pure%20connect%20-%20technical%20datasheet.pdf', type: 'tech_datasheet' },
      { title: 'Installation Guidelines', url: 'https://cdn.gerflor.com/media/2/47534/gti%20pure%20-%20installation%20guidelines.pdf', type: 'installation' },
      { title: 'Maintenance Instruction', url: 'https://cdn.gerflor.com/media/2/67285/technical%20tiles%20-%20maintenance%20instruction.pdf', type: 'maintenance' },
      { title: 'Environmental Datasheet', url: 'https://cdn.gerflor.com/media/2/58975/gti%20pure%20-%20environmental%20datasheet%20(europe).pdf', type: 'environmental_datasheet' },
      { title: 'Declaration of Performance', url: 'https://cdn.gerflor.com/media/2/60429/gti%20pure%20-%20dop.pdf', type: 'dop' },
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
      { title: 'Technical Data Sheet', url: 'https://cdn.gerflor.com/media/2/41727/attraction%C2%AE%20-%20technical%20data%20sheet.pdf', type: 'tech_datasheet' },
      { title: 'Installation Guidelines', url: 'https://cdn.gerflor.com/media/2/17715/attraction%C2%AE%20-%20installation%20guidelines.pdf', type: 'installation' },
      { title: 'Maintenance Instruction', url: 'https://cdn.gerflor.com/media/2/67285/technical%20tiles%20-%20maintenance%20instruction.pdf', type: 'maintenance' },
      { title: 'Environmental Datasheet', url: 'https://cdn.gerflor.com/media/2/57316/attraction%20-%20environmental%20datasheet%20(europe).pdf', type: 'environmental_datasheet' },
      { title: 'Environmental Product Declaration', url: 'https://cdn.gerflor.com/media/2/56910/attraction%20-%20epd.pdf', type: 'epd' },
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
      { title: 'Technical Data Sheet', url: 'https://cdn.gerflor.com/media/2/68811/dlw%20colorette%20sport%20-%20technical%20data%20sheet.pdf', type: 'tech_datasheet' },
      { title: 'Sample Card', url: 'https://cdn.gerflor.com/media/2/45656/dlw%20colorette%20sport%20-%20sample%20card.pdf', type: 'sample_card' },
      { title: 'Maintenance Instructions', url: 'https://cdn.gerflor.com/media/2/18174/dlw%20linoleum%20floor%20-%20maintenance%20instructions.pdf', type: 'maintenance' },
      { title: 'Declaration of Performance', url: 'https://cdn.gerflor.com/media/2/34635/dlw%20colorette%20sport%20-%20dop.pdf', type: 'dop' },
      { title: 'Product Description', url: 'https://cdn.gerflor.com/media/2/34958/dlw%20colorette%20sport%20-%20product%20description.docx', type: 'product_description' },
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
      { title: 'C2C Certificate', url: 'https://cdn.gerflor.com/media/2/68300/dlw%20linoleum%20-%20c2c.pdf', type: 'certificate' },
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
      { title: 'Sample Card', url: 'https://cdn.gerflor.com/media/2/43411/linodur%20sport%20-%20sample%20card.pdf', type: 'sample_card' },
      { title: 'Maintenance Instruction', url: 'https://cdn.gerflor.com/media/2/37988/linodur%20sport%20-%20maintenance%20instruction.pdf', type: 'maintenance' },
      { title: 'Installation Guidelines', url: 'https://cdn.gerflor.com/media/2/60683/[802]%20game%20line%20marking%20guidelines%20-%20installation%20guidelines.pdf', type: 'installation' },
      { title: 'Fire Certificate', url: 'https://cdn.gerflor.com/media/2/37987/linodur%20sport%20-%20fire%20certificate.pdf', type: 'fire_certificate' },
      { title: 'Product Description', url: 'https://cdn.gerflor.com/media/2/38007/linodur%20sport%20-%20product%20description.docx', type: 'product_description' },
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
