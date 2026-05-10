import { Category, Brand, Product } from '@/types';
import { gerflor_products } from './gerflor-products-generated';
import linoleumProducts from './linoleum-products';

export const categories: Category[] = [
  {
    id: '3',
    name: 'Parket',
    slug: 'parket',
    description: 'Prirodni drveni parketi za elegantne prostore',
    image: '/images/products/galloni-oak.jpg',
    order: 1,
  },
  {
    id: '1',
    name: 'Laminat',
    slug: 'laminat',
    description: 'Visokokvalitetni laminat podovi za svaki prostor',
    image: '/images/products/frontier-1033-4v-polar.jpg',
    order: 2,
  },
  {
    id: '6',
    name: 'LVT',
    slug: 'lvt',
    description: 'Luxury Vinyl Tile - Premium vinil podovi sa autentičnim dizajnom',
    image: '/images/collections/kolekcija-c000770-id-inspiration-55.jpg',
    order: 3,
  },
  {
    id: '4',
    name: 'Tekstilne ploče',
    slug: 'tekstilne-ploce',
    description: 'Savremene tekstilne podne ploče za kancelarije i objekte',
    image: '/images/categories/tekstilne-ploce.jpg',
    order: 4,
  },
  {
    id: '5',
    name: 'Deking',
    slug: 'deking',
    description: 'Drveni i kompozitni deking za terase i spoljne prostore',
    image: '/images/categories/deking.jpg',
    order: 5,
  },
  {
    id: '2',
    name: 'Vinil',
    slug: 'vinil',
    description: 'Profesionalni homogeni i heterogeni vinil podovi',
    image: '/images/products/vinyl/taralay-millenium-acoustic-order/4531-camilla.jpg',
    order: 6,
  },
  {
    id: '7',
    name: 'Linoleum',
    slug: 'linoleum',
    description: 'Prirodni linoleum podovi - ekološki i izdržljivi',
    image: '/images/products/linoleum/dlw-colorette/0110-cadillac-pink/44901 - 0110 CADILLAC PINK.jpg',
    order: 8,
  },
  {
    id: '9',
    name: 'Industrijske ploče',
    slug: 'industrijske-ploce',
    description: 'Modularne industrijske ploče za tehničke prostore, renovacije i jak saobraćaj',
    image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/industrial/attraction-connect/8157-goias.jpg',
    order: 7,
  },
  {
    id: '10',
    name: 'Sport',
    slug: 'sport',
    description: 'Sportski podovi za sale, dvorane i fiskulturne prostore',
    image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/sport/dlw-colorette-sport/1118-power-red.jpg',
    order: 9,
  },
  {
    id: '8',
    name: 'Elektroprovodni',
    slug: 'elektroprovodni',
    description: 'Elektroprovodni podovi za čiste sobe, industriju i elektroniku',
    image: '/images/esd/mipolam-el5-0354.jpg',
    order: 10,
  },
  {
    id: '11',
    name: 'Lajsne',
    slug: 'lajsne',
    description: 'Tarkett lajsne i prateći pribor za završnu obradu podova i zidova',
    image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/lajsne/tarkett-dekorativne-zidne-lajsne-za-lvt/tarkett-dekorativne-zidne-lajsne-za-lvt-marquina-grande-black.jpg?v=20260331152443',
    order: 11,
  },
  {
    id: '12',
    name: 'Otirači',
    slug: 'otiraci',
    description: 'Otirači i ulazni sistemi za objekte: aluminijumski, unutrašnji, spoljašnji i specijalni modeli za ulazne zone',
    image: '/images/categories/otiraci.jpg',
    order: 12,
  },
  {
    id: '13',
    name: 'Alat',
    slug: 'alat',
    description: 'Romus alati za postavljanje, pripremu i završnu obradu podova, sa cenama za rasprodaju lagera',
    image: '/images/categories/alat.png',
    order: 13,
  },

];

export const brands: Brand[] = [
  {
    id: '3',
    name: 'Tarkett',
    slug: 'tarkett',
    logo: '/images/brands/tarkett.svg',
    description: 'Globalni lider u proizvodnji inovativnih podnih rešenja',
    website: 'https://www.tarkett.com',
    countryOfOrigin: 'Francuska',
  },
  {
    id: '6',
    name: 'Gerflor',
    slug: 'gerflor',
    logo: '/images/brands/gerflor.svg',
    description: 'Francuski lider u proizvodnji vinilnih i komercijalnih podova sa preko 80 godina iskustva',
    website: 'https://www.gerflor-cee.com/',
    countryOfOrigin: 'Francuska',
  },
  {
    id: '8',
    name: 'BLOQ',
    slug: 'bloq',
    logo: '/images/brands/bloq.svg',
    description: 'Holandski proizvođač premium tekstilnih ploča za komercijalne i poslovne prostore',
    website: 'https://bloq.nl',
    countryOfOrigin: 'Holandija',
  },
  {
    id: '10',
    name: 'TimberTech',
    slug: 'timbertech',
    logo: '/images/brands/timbertech.svg',
    description: 'Brend kompozitnog dekinga i spoljašnjih podnih sistema za terase, dvorišta i komercijalne eksterijere',
    website: 'https://www.timbertech.com/',
    countryOfOrigin: 'SAD',
  },
  {
    id: '11',
    name: 'Wolflor',
    slug: 'wolflor',
    logo: '/images/brands/wolflor.svg',
    description: 'Proizvođač komercijalnih vinil podova sa homogenim, heterogenim i wood-look kolekcijama',
    website: 'https://wolflor.cn/',
    countryOfOrigin: 'Kina',
  },
  {
    id: '12',
    name: 'Techem',
    slug: 'techem',
    logo: '/images/brands/techem-logo-en.png',
    description: 'Poljski proizvođač sistemskih otirača, aluminijumskih ulaznih zona, reklamnih, unutrašnjih, spoljašnjih i antifatig podloga',
    website: 'https://www.techem-wycieraczki.com.pl/en/products/',
    countryOfOrigin: 'Poljska',
  },
  {
    id: '13',
    name: 'Romus',
    slug: 'romus',
    logo: '/images/brands/romus-logo.png',
    description: 'Francuski proizvođač profesionalnih alata, pribora i opreme za podopolagače',
    website: 'https://www.romusworld.com/',
    countryOfOrigin: 'Francuska',
  },
];

export const products: Product[] = [
  // VINIL KOLEKCIJE - Homogeni (11 collections with images)
  {
    id: 'vinil-1',
    name: 'Mipolam Accord',
    slug: 'gerflor-mipolam-accord',
    sku: 'GER-MIPOLAM-ACCORD',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Accord - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Accord - profesionalni homogeni vinil podovi sa Evercare™ površinskom obradom.',
    images: [{
      id: 'mipolam-accord-img',
      url: '/images/products/vinyl/mipolam-accord/collection.jpg',
      alt: 'Mipolam Accord',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Accord' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-accord',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-2',
    name: 'Mipolam Affinity',
    slug: 'gerflor-mipolam-affinity',
    sku: 'GER-MIPOLAM-AFFINITY',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Affinity - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Affinity - profesionalni homogeni vinil podovi.',
    images: [{
      id: 'mipolam-affinity-img',
      url: '/images/products/vinyl/mipolam-affinity/collection.jpg',
      alt: 'Mipolam Affinity',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Affinity' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-affinity',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-3',
    name: 'Mipolam Affinity 608x608',
    slug: 'gerflor-mipolam-affinity-608x608',
    sku: 'GER-MIPOLAM-AFFINITY-608',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Affinity 608x608 - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Affinity 608x608 - profesionalni homogeni vinil podovi.',
    images: [{
      id: 'mipolam-affinity-608-img',
      url: '/images/products/vinyl/mipolam-affinity-608x608/collection.jpg',
      alt: 'Mipolam Affinity 608x608',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Affinity 608x608' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-affinity-608x608',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-4',
    name: 'Mipolam Astro',
    slug: 'gerflor-mipolam-astro',
    sku: 'GER-MIPOLAM-ASTRO',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Astro - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Astro - profesionalni homogeni vinil podovi.',
    images: [{
      id: 'mipolam-astro-img',
      url: '/images/products/vinyl/mipolam-astro/collection.jpg',
      alt: 'Mipolam Astro',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Astro' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-astro',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-5',
    name: 'Mipolam Bioplanet',
    slug: 'gerflor-mipolam-bioplanet',
    sku: 'GER-MIPOLAM-BIOPLANET',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Bioplanet - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Bioplanet - profesionalni homogeni vinil podovi.',
    images: [{
      id: 'mipolam-bioplanet-img',
      url: '/images/products/vinyl/mipolam-bioplanet/collection.jpg',
      alt: 'Mipolam Bioplanet',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Bioplanet' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-bioplanet',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-6',
    name: 'Mipolam Classic 1.5 mm',
    slug: 'gerflor-mipolam-classic-1-5mm',
    sku: 'GER-MIPOLAM-CLASSIC-1-5MM',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Classic 1.5 mm - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Classic 1.5 mm - profesionalni homogeni vinil podovi.',
    images: [{
      id: 'mipolam-classic-1-5mm-img',
      url: '/images/products/vinyl/mipolam-classic-1-5mm/collection.jpg',
      alt: 'Mipolam Classic 1.5 mm',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Classic 1.5 mm' },
      { key: 'thickness', label: 'Debljina', value: '1.50 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-classic-15mm',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-7',
    name: 'Mipolam Classic 2mm',
    slug: 'gerflor-mipolam-classic-2mm',
    sku: 'GER-MIPOLAM-CLASSIC-2MM',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Classic 2mm - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Classic 2mm - profesionalni homogeni vinil podovi.',
    images: [{
      id: 'mipolam-classic-2mm-img',
      url: '/images/products/vinyl/mipolam-classic-2mm/collection.jpg',
      alt: 'Mipolam Classic 2mm',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Classic 2mm' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-classic-2mm',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-8',
    name: 'Mipolam Elegance',
    slug: 'gerflor-mipolam-elegance',
    sku: 'GER-MIPOLAM-ELEGANCE',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Elegance - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Elegance - profesionalni homogeni vinil podovi.',
    images: [{
      id: 'mipolam-elegance-img',
      url: '/images/products/vinyl/mipolam-elegance/collection.jpg',
      alt: 'Mipolam Elegance',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Elegance' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-elegance',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-9',
    name: 'Mipolam Planet',
    slug: 'gerflor-mipolam-planet',
    sku: 'GER-MIPOLAM-PLANET',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Planet - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Planet - profesionalni homogeni vinil podovi.',
    images: [{
      id: 'mipolam-planet-img',
      url: '/images/products/vinyl/mipolam-planet/collection.jpg',
      alt: 'Mipolam Planet',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Planet' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-planet',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-10',
    name: 'Mipolam Symbioz',
    slug: 'gerflor-mipolam-symbioz',
    sku: 'GER-MIPOLAM-SYMBIOZ',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Symbioz - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Symbioz - profesionalni homogeni vinil podovi.',
    images: [{
      id: 'mipolam-symbioz-img',
      url: '/images/products/vinyl/mipolam-symbioz/collection.jpg',
      alt: 'Mipolam Symbioz',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Symbioz' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-symbioz',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-11',
    name: 'Mipolam Troplan',
    slug: 'gerflor-mipolam-troplan',
    sku: 'GER-MIPOLAM-TROPLAN',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Troplan - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Troplan - profesionalni homogeni vinil podovi.',
    images: [{
      id: 'mipolam-troplan-img',
      url: '/images/products/vinyl/mipolam-troplan/collection.jpg',
      alt: 'Mipolam Troplan',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Troplan' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-troplan',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // GERFLOR LVT KOLEKCIJE - External links
  // Gerflor LVT Collections - 17 products
  // Links to be added by user one by one
  {
    id: '8',
    name: 'Gerflor Creation 30',
    slug: 'gerflor-creation-30',
    sku: 'GER-C30',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija sa 0.30mm slojem habanja - idealna za stambene i lake komercijalne prostore',
    description: `Proizvod:
Kompletan Format: pravougaone pločice, kvadratne pločice, standardne daske, XL daske, - dizajnirano da zadovolji svaki projekat
Profinjeni dizajni i harmonične palete boja: svaki detalj osmišljen da stvori ekskluzivan prostor
Novi površinski utisci: ultra-realistične i raznovrsne teksture koje uzdignu svaki dizajn
Ultra-mat završetak sa Protecshield™: baršunasti dodir i prirodna elegancija
Smart Dizajn – do 3 m² varijacije dizajna: poboljšana vizuelna varijacija na odabranim dizajnima za dublji realizam
Smart Komfor inovacija: akustični gornji sloj za bolje hodanje \(79dB\) i toplotni komfor
4 zakošene ivice: autentičan efekat drveta i pločica
Od poda do zida: stvorite besprekornu harmoniju sa našom Mural Revela kolekcijom

Ugradnja:
Dry Back sistem: profesionalna ugradnja za dugotrajnu performansu
Idealno za novu gradnju
Protecshield™ površinska obrada: poboljšana otpornost, jednostavno čišćenje
Efikasan protokol održavanja: pojednostavljena nega, maksimalan efekat

Okruženje:
100% reciklabilno
35% recikliranog sadržaja
TVOC <10µg/m³
Bez ftalata
Kompatibilno sa REACH standardima
A+ ocena - najviši nivo zdravstvenih standarda
Certifikovano: Floorscore®, IAC Gold & M1`,
    images: [{ id: '8-1', url: '/images/products/lvt/creation-30.jpg', alt: 'Gerflor Creation 30', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '2.00 mm' },
      { key: 'wear_layer', label: 'Sloj habanja', value: '0.30mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'usage_class', label: 'Klasa upotrebe', value: '23-31' },
      { key: 'fire_class', label: 'Protivpožarna klasifikacija', value: 'Bfl-s1' },
      { key: 'installation', label: 'Tip instalacije', value: 'Lepljenje' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
      { key: 'ncs', label: 'NCS Oznaka', value: 'NCS S 4040-Y20R' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: true,
    externalLink: 'https://www.gerflor-cee.com/products/creation-30-new-collection',
    detailsSections: [
      {
        title: 'Dizajn i struktura',
        items: [
          'Kreirajte bez ograničenja',
          'Kompletan format: pravougaone pločice, kvadratne pločice, standardne daske, XL daske - dizajnirano da zadovolji svaki projekat',
          'Rafinirani dizajni i harmonične palete boja: svaki detalj kreiran da stvori ekskluzivan prostor',
          'Nove površinske teksture: ultra-realistične i raznovrsne teksture koje podižu svaki dizajn',
          'Ultra-mat završetak sa Protecshield™: somotast dodir i prirodna elegancija',
          'Smart Design – do 3m² varijacija dizajna: poboljšane vizuelne varijacije na odabranim dizajnima za dublji realizam',
          'Smart Comfort inovacija: akustični gornji sloj za bolje hodanje (79dB) i toplotnu udobnost',
          '4 oborene ivice: autentični efekti drveta i pločica',
          'Od poda do zida: kreirajte besprekornu harmoniju sa našom Mural Revela kolekcijom',
        ],
      },
      {
        title: 'Ugradnja i održavanje',
        items: [
          'Dry Back sistem: profesionalna ugradnja za dugotrajne performanse',
          'Idealno za nove objekte',
          'Protecshield™ površinska obrada: poboljšana otpornost, lako čišćenje',
          'Efikasan protokol održavanja: pojednostavljena nega, maksimalan efekat',
        ],
      },
      {
        title: 'Održivost',
        items: [
          'Prosečan reciklirani sadržaj 35%',
          'TVOC nakon 28 dana <10 µg/m³',
          'Reciklirani sadržaj 55%',
        ],
      },
    ],
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '9',
    name: 'Gerflor Creation 40',
    slug: 'gerflor-creation-40',
    sku: 'GER-C40',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija sa 0.40mm slojem habanja - idealna za stambene i komercijalne prostore',
    description: `Proizvod:
Sintetičko, dekorativno i fleksibilno PVC rešenje za podove
Dostupno u Formatima: daske i pločice
4 zakošene ivice
Sloj habanja: 0\.40 mm
Ukupna debljina: 2 mm
Akustični gornji sloj za bolje hodanje i toplotni komfor
ProtecShield™ površinska obrada: poboljšana otpornost, jednostavno čišćenje
Velika varijacija dizajna sa high-definition štampanim dekorativnim filmom

Ugradnja:
Dry Back sistem: profesionalna ugradnja za dugotrajnu performansu
Idealno za novu gradnju
Lako sečenje za jednostavnu ugradnju

Primena:
Evropska klasa upotrebe: 13501-1
Protivpožarna klasifikacija: Bfl-s1 \(EN 13501-1\)

Okruženje:
100% reciklabilno
35% recikliranog sadržaja
TVOC <10µg/m³
Bez ftalata
Kompatibilno sa REACH standardima
A\+ ocena - najviši nivo zdravstvenih standarda
Certifikovano: Floorscore®, IAC Gold \& M1`,
    images: [{ id: '9-1', url: '/images/products/lvt/creation-40.jpg', alt: 'Gerflor Creation 40', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '2.50 mm' },
      { key: 'wear_layer', label: 'Sloj habanja', value: '0.40mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'usage_class', label: 'Klasa upotrebe', value: '23-32' },
      { key: 'fire_class', label: 'Protivpožarna klasifikacija', value: 'Bfl-s1' },
      { key: 'installation', label: 'Tip instalacije', value: 'Lepljenje' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
      { key: 'ncs', label: 'NCS Oznaka', value: 'NCS S 4040-Y20R' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: true,
    externalLink: 'https://www.gerflor-cee.com/products/creation-40-new-collection',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '10',
    name: 'Gerflor Creation 40 Clic',
    slug: 'gerflor-creation-40-clic',
    sku: 'GER-C40C',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija sa clic sistemom',
    description: `Proizvod:
Sintetičko, dekorativno i fleksibilno PVC rešenje za podove sa Clic sistemom
Dostupno u Formatima: XL daske, standardne daske i pločice - dizajnirano za svaki prostor
4 zakošene ivice
Sloj habanja: 0.40 mm
Ultra-realistične teksture: mat završna obrada za prirodan izgled
Smart Comfort: akustični gornji sloj za udobnost pri hodu i toplotnu izolaciju
Rigid core: idealno za renoviranje, kompatibilno sa postojećim podlogama, otporno na temperaturne promene
Od poda do zida: stvorite harmoniju sa našom Mural Revela kolekcijom

Ugradnja:
Fold Down Clic sistem: brza, sigurna i ugradnja bez prašine
Bez lepka: savršeno za ugradnju preko postojeće keramike ili osetljivih podloga
Lako sečenje i rukovanje

Primena:
Evropska klasa upotrebe: 32/41
Idealno za stambene i lake komercijalne prostore

Okruženje:
100% reciklabilno
Bez ftalata
TVOC <10µg/m³`,
    images: [{ id: '10-1', url: '/images/products/lvt/creation-40-clic.jpg', alt: 'Gerflor Creation 40 Clic', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '4.50 mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Click sistem' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
      { key: 'ncs', label: 'NCS Oznaka', value: 'NCS S 4010-Y30R' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: true,
    externalLink: 'https://www.gerflor-cee.com/products/creation-40-clic-new-collection',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '11',
    name: 'Gerflor Creation 40 Clic Acoustic',
    slug: 'gerflor-creation-40-clic-acoustic',
    sku: 'GER-C40CA',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija sa clic sistemom i akustikom',
    description: `Proizvod:
Sintetičko rešenje sa integrisanom akustičnom podlogom (19dB)
Smart Comfort inovacija: akustični gornji sloj za udobnost pri hodu i toplotnu izolaciju
Rigid core: idealno za renoviranje, otporno na temperaturne promene
Ultra-realistične teksture: mat završna obrada i prirodan izgled
Dostupno u Formatima: XL daske, standardne daske i pločice
Od poda do zida: stvorite harmoniju sa našom Mural Revela kolekcijom

Ugradnja:
Fold Down Clic sistem: brza i sigurna ugradnja
Bez lepka: postavljanje direktno na većinu podloga
Mogućnost sečenja skalpelom (bez buke i prašine)

Primena:
Evropska klasa upotrebe: 32/41
Idealno za renoviranja u stambenim objektima (smanjenje buke)

Okruženje:
100% reciklabilno
Bez ftalata
TVOC <10µg/m³`,
    images: [{ id: '11-1', url: '/images/products/lvt/creation-40-clic-acoustic.jpg', alt: 'Gerflor Creation 40 Clic Acoustic', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '5.50 mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'acoustic', label: 'Akustična izolacija', value: 'Da' },
      { key: 'installation', label: 'Tip instalacije', value: 'Click sistem' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
      { key: 'ncs', label: 'NCS Oznaka', value: 'NCS S 4040-Y20R' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/creation-40-clic-acoustic-new-collection',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '12',
    name: 'Gerflor Creation 40 Zen',
    slug: 'gerflor-creation-40-zen',
    sku: 'GER-C40Z',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija Zen dizajn',
    description: `Proizvod:
Elegancija i performanse za prostore sa srednjim prometom
Dostupno u Formatima: daske i pločice
4 zakošene ivice za autentičan izgled
Sloj habanja: 0.40 mm
Visok nivo akustične izolacije (-20dB)
ProtecShield™: prirodan izgled i lako čišćenje

Ugradnja:
Uklonjiva ugradnja sa lepkom - pogodno za podignute podove
Moguća ugradnja na različite podloge (čak i na stare podove sa ostacima lepka)
Idealno za brze renovacije

Primena:
Evropska klasa upotrebe: 23/32
Idealno za stambene prostore i kancelarije

Okruženje:
100% reciklabilno
Bez ftalata
TVOC <10µg/m³
Proizvedeno u Francuskoj`,
    images: [{ id: '12-1', url: '/images/products/lvt/creation-40-zen.jpg', alt: 'Gerflor Creation 40 Zen', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '3.60 mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Lepljenje' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
      { key: 'ncs', label: 'NCS Oznaka', value: 'NCS S 4005-Y20R' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/creation-40-zen',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '13',
    name: 'Gerflor Creation 55',
    slug: 'gerflor-creation-55',
    sku: 'GER-C55',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija - pogledajte sve dezene',
    description: `Proizvod:
Sintetičko, dekorativno i fleksibilno PVC rešenje za podove
Dostupno u Formatima: daske i pločice
4 zakošene ivice
Sloj habanja: 0.55 mm
Ukupna debljina: 2.5 mm
ProtecShield™: poboljšana otpornost na ogrebotine i fleke
Velika varijacija dizajna za realističan izgled drveta i kamena

Ugradnja:
Dry Back sistem: klasična ugradnja lepljenjem za dugotrajnu stabilnost
Idealno za novogradnju i velike površine

Primena:
Evropska klasa upotrebe: 33/42
Idealno za komercijalne prostore: prodavnice, hoteli, kancelarije

Okruženje:
100% reciklabilno
35% recikliranog sadržaja
Bez ftalata
TVOC <10µg/m³
Floorscore®, IAC Gold & M1 sertifikovano`,
    images: [{ id: '13-1', url: '/images/products/lvt/creation-55.jpg', alt: 'Gerflor Creation 55', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '2.50 mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Lepljenje' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
      { key: 'ncs', label: 'NCS Oznaka', value: 'NCS S 2020-Y20R' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: true,
    externalLink: 'https://www.gerflor-cee.com/products/creation-55-new-collection',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '14',
    name: 'Gerflor Creation 55 Clic',
    slug: 'gerflor-creation-55-clic',
    sku: 'GER-C55C',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija sa clic sistemom',
    description: `Proizvod:
Sintetičko, dekorativno i fleksibilno PVC rešenje za podove sa Clic sistemom
Dostupno u Formatima: XL daske, standardne daske i pločice - dizajnirano za svaki prostor
4 zakošene ivice
Sloj habanja: 0.55 mm
Ultra-realistične teksture: mat završna obrada za prirodan izgled
Smart Comfort: akustični gornji sloj za udobnost pri hodu i toplotnu izolaciju
Rigid core: idealno za renoviranje, kompatibilno sa postojećim podlogama, otporno na temperaturne promene
Od poda do zida: stvorite harmoniju sa našom Mural Revela kolekcijom

Ugradnja:
Fold Down Clic sistem: brza, sigurna i ugradnja bez prašine
Bez lepka: savršeno za ugradnju preko postojeće keramike ili osetljivih podloga
Lako sečenje i rukovanje

Primena:
Evropska klasa upotrebe: 33/42
Idealno za komercijalne prostore sa visokim prometom (prodavnice, hoteli, kancelarije)

Okruženje:
100% reciklabilno
Bez ftalata
TVOC <10µg/m³`,
    images: [{ id: '14-1', url: '/images/products/lvt/creation-55-clic.jpg', alt: 'Gerflor Creation 55 Clic', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '5.00 mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Click sistem' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
      { key: 'ncs', label: 'NCS Oznaka', value: 'NCS S 3020-Y20R' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: true,
    externalLink: 'https://www.gerflor-cee.com/products/creation-55-clic-new-collection',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '15',
    name: 'Gerflor Creation 55 Clic Acoustic',
    slug: 'gerflor-creation-55-clic-acoustic',
    sku: 'GER-C55CA',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija sa clic sistemom i akustikom',
    description: `Proizvod:
Sintetičko rešenje sa integrisanom akustičnom podlogom (19dB) - Klasa 33/42
Smart Comfort inovacija: akustični gornji sloj za udobnost pri hodu i toplotnu izolaciju
Rigid core: idealno za renoviranje, otporno na temperaturne promene
Ultra-realistične teksture: mat završna obrada i prirodan izgled
Dostupno u Formatima: XL daske, standardne daske i pločice, Herringbone
Od poda do zida: stvorite harmoniju sa našom Mural Revela kolekcijom

Ugradnja:
Fold Down Clic sistem: brza i sigurna ugradnja
Bez lepka: postavljanje direktno na većinu podloga
Mogućnost sečenja skalpelom (bez buke i prašine)

Primena:
Evropska klasa upotrebe: 33/42
Idealno za komercijalne prostore gde je bitna akustika (kancelarije, hoteli)

Okruženje:
100% reciklabilno
Bez ftalata
TVOC <10µg/m³`,
    images: [{ id: '15-1', url: '/images/products/lvt/creation-55-clic-acoustic.jpg', alt: 'Gerflor Creation 55 Clic Acoustic', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '6.00 mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'acoustic', label: 'Akustična izolacija', value: 'Da' },
      { key: 'installation', label: 'Tip instalacije', value: 'Click sistem' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
      { key: 'ncs', label: 'NCS Oznaka', value: 'NCS S 4040-Y20R' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/creation-55-clic-acoustic-new-collection',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '16',
    name: 'Gerflor Creation 55 Looselay',
    slug: 'gerflor-creation-55-looselay',
    sku: 'GER-C55LL',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija Looselay sistem',
    description: `Proizvod:
Uklonjivi "Looselay" podovi za brzu transformaciju prostora
Ekskluzivna konstrukcija "Duo Core": ojačana staklenim vlaknima za komfor i stabilnost
4 formata: prilagođeno vašim potrebama
Sloj habanja: 0.55 mm
ProtecShield™: prirodan izgled i lako čišćenje

Ugradnja:
Looselay sistem: brza ugradnja do 30m² bez lepka
Idealno za podignute podove (pristup instalacijama)
Moguća ugradnja direktno na keramiku (spoj <4mm)

Primena:
Evropska klasa upotrebe: 33/42
Idealno za prostore sa umerenim do visokim prometom (kancelarije, hoteli, prodavnice)

Okruženje:
100% reciklabilno
35% recikliranog sadržaja
Bez ftalata
TVOC <10µg/m³`,
    images: [{ id: '16-1', url: '/images/products/lvt/creation-55-looselay.jpg', alt: 'Gerflor Creation 55 Looselay', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '4.50 mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Looselay' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
      { key: 'ncs', label: 'NCS Oznaka', value: 'NCS S 4040-Y20R' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/creation-55-looselay',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '17',
    name: 'Gerflor Creation 55 Looselay Acoustic',
    slug: 'gerflor-creation-55-looselay-acoustic',
    sku: 'GER-C55LLA',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija Looselay sa akustikom',
    description: `Proizvod:
Uklonjiva akustična verzija (19dB zvučna izolacija)
Ekskluzivna "Duo Core" konstrukcija ojačana vlaknima za stabilnost
ProtecShield™ ultra mat završna obrada: prirodan izgled i lako održavanje
Dostupno u 2 formata: ploče (600x600mm) i daske (229x1220mm)
Sloj habanja: 0.55 mm

Ugradnja:
Looselay sistem: najbrža instalacija za velike prostore
Moguća ugradnja direktno na keramiku (spoj <4mm)
Repositionable: lako se podiže i premešta (pristup podnim instalacijama)

Primena:
Evropska klasa upotrebe: 33/42
Idealno za kancelarije i hotele gde je bitna tišina i fleksibilnost

Okruženje:
100% reciklabilno
35% recikliranog sadržaja
Bez ftalata
TVOC <10µg/m³`,
    images: [{ id: '17-1', url: '/images/products/lvt/creation-55-looselay-acoustic.jpg', alt: 'Gerflor Creation 55 Looselay Acoustic', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '5.50 mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'acoustic', label: 'Akustična izolacija', value: 'Da' },
      { key: 'installation', label: 'Tip instalacije', value: 'Looselay' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
      { key: 'ncs', label: 'NCS Oznaka', value: 'NCS S 4040-Y20R' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/creation-55-looselay-acoustic',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '18',
    name: 'Gerflor Creation 55 Zen',
    slug: 'gerflor-creation-55-zen',
    sku: 'GER-C55Z',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija Zen dizajn',
    description: `Proizvod:
Elegancija i zvučna izolacija za komercijalne prostore
Dostupno u Formatima: daske i pločice
4 zakošene ivice
Sloj habanja: 0.55 mm
Visok nivo akustične izolacije (-20dB)
ProtecShield™: prirodan izgled i lako čišćenje

Ugradnja:
Uklonjiva ugradnja sa lepkom - pogodno za podignute podove
Moguća ugradnja na različite podloge
Idealno za brze renovacije bez oštećenja podloge

Primena:
Evropska klasa upotrebe: 33/42
Idealno za hotele, kancelarije i prodavnice (velika prohodnost)

Okruženje:
100% reciklabilno
Bez ftalata
TVOC <10µg/m³
Proizvedeno u Francuskoj`,
    images: [{ id: '18-1', url: '/images/products/lvt/creation-55-zen.jpg', alt: 'Gerflor Creation 55 Zen', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '4.25 mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Lepljenje' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
      { key: 'ncs', label: 'NCS Oznaka', value: 'NCS S 4005-Y20R' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/creation-55-zen',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '19',
    name: 'Gerflor Creation 70',
    slug: 'gerflor-creation-70',
    sku: 'GER-C70',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija - pogledajte sve dezene',
    description: `Proizvod:
LVT rešenje najviših performansi za najprometnije prostore
Dostupno u Formatima: XL pločice, XL daske, standardne daske
Sloj habanja: 0.70 mm (izuzetna otpornost)
4 zakošene ivice za autentičan izgled
ProtecShield™: mat završna obrada otporna na ogrebotine

Ugradnja:
Dry Back sistem: lepljenje za maksimalnu stabilnost i dugotrajnost
Idealno za novogradnju i velike komercijalne objekte

Primena:
Evropska klasa upotrebe: 34/43
Namenjeno za aerodrome, tržne centre, bolnice i škole

Okruženje:
100% reciklabilno
35% recikliranog sadržaja
Bez ftalata
TVOC <10µg/m³`,
    images: [{ id: '19-1', url: '/images/products/lvt/creation-70.jpg', alt: 'Gerflor Creation 70', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '2.50 mm' },
      { key: 'wear_layer', label: 'Sloj habanja', value: '0.70mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'usage_class', label: 'Klasa upotrebe', value: '34-43' },
      { key: 'fire_class', label: 'Protivpožarna klasifikacija', value: 'Bfl-s1' },
      { key: 'installation', label: 'Tip instalacije', value: 'Lepljenje' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
      { key: 'ncs', label: 'NCS Oznaka', value: 'NCS S 4040-Y20R' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: true,
    externalLink: 'https://www.gerflor-cee.com/products/creation-70-new-collection',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '20',
    name: 'Gerflor Creation 70 Clic',
    slug: 'gerflor-creation-70-clic',
    sku: 'GER-C70C',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija sa clic sistemom',
    description: `Proizvod:
LVT rešenje visokih performansi sa Clic sistemom
Sloj habanja: 0.70 mm (klasa 34/43)
Dostupno u Formatima: XL daske, standardne daske i pločice
Smart Comfort: akustični gornji sloj za udobnost
Rigid core: otporno na temperaturne promene i teška opterećenja

Ugradnja:
Fold Down Clic sistem: najjači spojevi za prometne prostore
Bez lepka: brza instalacija bez prašine
Kompatibilno sa postojećim podlogama

Primena:
Evropska klasa upotrebe: 34/43
Idealno za supermarkete, javne ustanove i prometne komercijalne objekte

Okruženje:
100% reciklabilno
Bez ftalata
TVOC <10µg/m³`,
    images: [{ id: '20-1', url: '/images/products/lvt/creation-70-clic.jpg', alt: 'Gerflor Creation 70 Clic', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '5.00 mm' },
      { key: 'wear_layer', label: 'Sloj habanja', value: '0.70mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'usage_class', label: 'Klasa upotrebe', value: '34-43' },
      { key: 'installation', label: 'Tip instalacije', value: 'Click sistem' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
      { key: 'ncs', label: 'NCS Oznaka', value: 'NCS S 4040-Y20R' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: true,
    externalLink: 'https://www.gerflor-cee.com/products/creation-70-clic-5mm-new-collection',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '21',
    name: 'Gerflor Creation 70 Connect',
    slug: 'gerflor-creation-70-connect',
    sku: 'GER-C70CO',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija Connect sistem',
    description: `Proizvod:
Inovativno rešenje sa "Connect" sistemom (puzle spoj)
Sloj habanja: 0.70 mm
Ojačano jezgro staklenim vlaknima: vrhunska stabilnost i komfor
ProtecShield™: mat izgled i lako održavanje

Ugradnja:
Ekskluzivni Gerflor "dovetail" (lastin rep) spojevi: laka i brza ugradnja
Bez lepka: može se postavljati dok je objekat u funkciji
Direktno preko keramike (spoj <5mm)

Primena:
Idealno za industrijske hale, magacine, škole i javne objekte
Izuzetno otporno na habanje i točkove viljuškara

Okruženje:
100% reciklabilno
Do 55% recikliranog sadržaja
Bez ftalata
TVOC <10µg/m³`,
    images: [{ id: '21-1', url: '/images/products/lvt/creation-70-connect.jpg', alt: 'Gerflor Creation 70 Connect', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '5.00 mm' },
      { key: 'format', label: 'Format', value: 'Pločica' },
      { key: 'installation', label: 'Tip instalacije', value: 'Connect sistem' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/creation-70-connect',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '22',
    name: 'Gerflor Creation 70 Megaclic',
    slug: 'gerflor-creation-70-megaclic',
    sku: 'GER-C70MC',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija Megaclic sistem',
    description: `Proizvod:
Robusno rešenje za brzu renovaciju u prometnim prostorima
Format: Daske i pločice
Realističan dizajn sa autentičnim teksturama
Sloj habanja: 0.70 mm

Ugradnja:
MegaClic konekcija: ojačan vertikalni klik sistem
Bez lepka: postavljanje direktno preko keramike
Brzo rešenje za renoviranje bez zaustavljanja rada objekta

Primena:
Evropska klasa upotrebe: 34/43
Idealno za maloprodajne objekte, škole i javne zgrade
Mix & Match: kompatibilno sa GTI Max kolekcijom

Okruženje:
100% reciklabilno
Bez ftalata
TVOC <10µg/m³`,
    images: [{ id: '22-1', url: '/images/products/lvt/creation-70-megaclic.jpg', alt: 'Gerflor Creation 70 Megaclic', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '6.00 mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Click sistem' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
      { key: 'ncs', label: 'NCS Oznaka', value: 'NCS S 6010-Y30R' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/creation-70-megaclic',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '24',
    name: 'Gerflor Creation 70 Looselay',
    slug: 'gerflor-creation-70-looselay',
    sku: 'GER-C70LL',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija Looselay sistem',
    description: `Proizvod:
Uklonjiva "Looselay" verzija za najprometnije prostore (Klasa 43)
5 veličina: uključujući format riblje kosti i XL daske
Ekskluzivna "Duo Core" konstrukcija ojačana vlaknima
ProtecShield™: prirodan izgled i lako čišćenje

Ugradnja:
Looselay sistem: brza instalacija bez lepka
Direktno na keramiku (spoj <4mm)
Pogodno za podignute podove (pristup kablovima)

Primena:
Evropska klasa upotrebe: 34/43
Idealno za ekstremno prometne zone: aerodromi, javne ustanove, tržni centri

Okruženje:
100% reciklabilno
35% recikliranog sadržaja
Bez ftalata
TVOC <10µg/m³`,
    images: [{ id: '25-1', url: '/images/products/lvt/creation-70-looselay.jpg', alt: 'Gerflor Creation 70 Looselay', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '5.00 mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Looselay' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
      { key: 'ncs', label: 'NCS Oznaka', value: 'NCS S 4010-Y30R' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: true,
    externalLink: 'https://www.gerflor-cee.com/products/new-2025-creation-70-looselay',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '23',
    name: 'Gerflor Creation 70 Zen',
    slug: 'gerflor-creation-70-zen',
    sku: 'GER-C70Z',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija Zen dizajn',
    description: `Proizvod:
Elegancija i tišina za najzahtevnije prostore
Dostupno u Formatima: daske i pločice
4 zakošene ivice
Sloj habanja: 0.70 mm (klasa 34/42)
Visok nivo akustične izolacije (-20dB)
ProtecShield™: prirodan izgled i lako čišćenje

Ugradnja:
Uklonjiva ugradnja sa lepkom
Moguća ugradnja na različite podloge (uključujući azbestne podloge po propisima)
Idealno za brze renovacije

Primena:
Evropska klasa upotrebe: 34/42
Idealno za najprometnije hotele, kancelarije i prodavnice

Okruženje:
100% reciklabilno
Bez ftalata
TVOC <10µg/m³
Proizvedeno u Francuskoj`,
    images: [{ id: '23-1', url: '/images/products/lvt/creation-70-zen.jpg', alt: 'Gerflor Creation 70 Zen', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '4.35 mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Lepljenje' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
      { key: 'ncs', label: 'NCS Oznaka', value: 'NCS S 4020-Y20R' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/creation-70-zen',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '25',
    name: 'Gerflor Creation Saga²',
    slug: 'gerflor-creation-saga',
    sku: 'GER-CSAGA',
    categoryId: '6',
    brandId: '6',
    shortDescription: 'LVT kolekcija Saga²',
    description: `Proizvod:
Premium LVT sa pluto podlogom
5 veličina: uključujući format riblje kosti (herringbone) i XL daske
Ekskluzivna "Duo Core" konstrukcija sa plutom: vrhunski komfor i akustika (15 dB)
ProtecShield™: lako čišćenje, bez potrebe za voskiranjem

Ugradnja:
Uklonjiva ugradnja sa lepkom - pogodno za podignute podove
Direktno na keramiku ako je spoj <5mm

Primena:
Evropska klasa upotrebe: 34/42
Idealno za luksuzne prostore sa visokim prometom (recepcije, butici, kancelarije)

Okruženje:
100% reciklabilno
55% recikliranog sadržaja
Pluta: prirodna i obnovljiva sirovina
Bez ftalata
TVOC <10µg/m³`,
    images: [{ id: '24-1', url: '/images/products/lvt/creation-saga.jpg', alt: 'Gerflor Creation Saga²', isPrimary: true, order: 1 }],
    specs: [
      { key: 'format', label: 'Format', value: 'Kvadratna pločica' },
      { key: 'dimension', label: 'Dimenzije', value: '50 cm X 50 cm' },
      { key: 'thickness', label: 'Ukupna debljina', value: '4.60 mm' },
      { key: 'wear_layer', label: 'Sloj habanja', value: '0.70 mm' },
      { key: 'installation', label: 'Tip instalacije', value: 'Looselay sa lepkom' },
      { key: 'surface', label: 'Površinska obrada', value: 'ProtecShield™ PUR' },
      { key: 'usage_class', label: 'Klasa upotrebe', value: '34-42' },
      { key: 'fire_class', label: 'Protivpožarna klasifikacija', value: 'Bfl-s1 (EN 13501-1)' },
      { key: 'impact_sound', label: 'Akustična izolacija', value: '15 dB' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/creation-saga2',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  // DLW Linoleum Collections - 15 products (Gerflor brand) - Auto-imported from scraped data
  ...linoleumProducts,
  // Tekstilne ploče - Gerflor Armonia
  {
    id: '41',
    name: 'Gerflor Armonia 400',
    slug: 'gerflor-armonia-400',
    sku: 'GER-ARM400',
    categoryId: '4',
    brandId: '6',
    shortDescription: 'Tekstilne podne ploče Armonia 400',
    description: `Strukturirajte svoje prostore, kreirajte harmoniju.

Armonia 400 je ulaznica u svet Armonia. Pažljivo izrađene u Evropskoj uniji, ove loop carpet ploče donose udobnost i harmoniju u prostore sa lakim prometom:

Proizvod:
• 100% solution-dyed polipropilen
• Težina vlakna: 400 g/m²
• Lako se kombinuje sa Gerflor kolekcijama (Creation i Saga²)

Ugradnja:
• Monolitna ili quarter-turn instalacija
• Mogućnost ugradnje bez lepka sa konektorima (B-connect)

Primena:
• Laka komercijalna upotreba

Održivost:
• Proizvedeno u EU
• TVOC <100µg/m³ → kvalitet unutrašnjeg vazduha`,
    images: [{ id: '41-1', url: '/images/products/carpet/57526 - Armonia 400.jpg', alt: 'Gerflor Armonia 400', isPrimary: true, order: 1 }],
    documents: [
      { title: 'Technical Datasheet', url: '/documents/carpet/armonia-400-technical-datasheet.pdf' },
      { title: 'Sample Card', url: '/documents/carpet/armonia-400-sample-card.pdf' },
    ],
    specs: [
      { key: 'type', label: 'Tip', value: 'Tekstilne ploče' },
      { key: 'collection', label: 'Kolekcija', value: 'Armonia 400' },
      { key: 'material', label: 'Sastav', value: '100% Polypropylene' },
      { key: 'weight', label: 'Težina vlakna', value: '400 g/m²' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: true,
    externalLink: 'https://www.gerflor-cee.com/products/armonia-400',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '42',
    name: 'Gerflor Armonia 540',
    slug: 'gerflor-armonia-540',
    sku: 'GER-ARM540',
    categoryId: '4',
    brandId: '6',
    shortDescription: 'Tekstilne podne ploče Armonia 540',
    description: `Strukturirajte svoje prostore, kreirajte harmoniju.

Armonia 540 carpet ploče su specijalno dizajnirane da se uklapaju sa našim Creation Loose Lay i Saga kolekcijama za vaše profesionalne prostore:

Proizvod:
• 100% Nylon solution dyed
• Težina vlakna: 540 g/m²
• 14 ekskluzivnih boja koordinisanih sa Création i Saga kolekcijama
• Savršeno se uklapa sa našim LVT, heterogenim i linoleum kolekcijama

Ugradnja:
• Monolitna ili quarter-turn instalacija
• Mogućnost ugradnje bez lepka sa konektorima (B-connect)

Primena:
• Klasa 33 za intenzivnu komercijalnu upotrebu

Održivost:
• Third party certified EPD
• Proizvedeno u EU
• TVOC <100µg/m³ → kvalitet unutrašnjeg vazduha`,
    images: [{ id: '42-1', url: '/images/products/carpet/64676 - JPG 72 dpi-Armonia 540 platino - Office.jpg', alt: 'Gerflor Armonia 540', isPrimary: true, order: 1 }],
    documents: [
      { title: 'Technical Datasheet', url: '/documents/carpet/armonia-540-technical-datasheet.pdf' },
      { title: 'EPD', url: '/documents/carpet/armonia-540-epd.pdf' },
    ],
    specs: [
      { key: 'type', label: 'Tip', value: 'Tekstilne ploče' },
      { key: 'collection', label: 'Kolekcija', value: 'Armonia 540' },
      { key: 'material', label: 'Sastav', value: '100% Nylon' },
      { key: 'class', label: 'Klasa upotrebe', value: '33' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: true,
    externalLink: 'https://www.gerflor-cee.com/products/armonia-540',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '43',
    name: 'Gerflor Armonia 620',
    slug: 'gerflor-armonia-620',
    sku: 'GER-ARM620',
    categoryId: '4',
    brandId: '6',
    shortDescription: 'Tekstilne podne ploče Armonia 620',
    description: `Strukturirajte svoje prostore, kreirajte harmoniju.

Armonia 620 su strukturirane carpet ploče dizajnirane da se uklapaju sa našim Creation Loose Lay i Saga kolekcijama za vaše profesionalne prostore:

Proizvod:
• Solution-Dyed Nylon - Econyl® 100% reciklirani
• Težina vlakna: 620 g/m²
• 6 ekskluzivnih boja koordinisanih sa Création i Saga kolekcijama
• Savršeno se uklapa sa našim heterogenim i linoleum kolekcijama

Ugradnja:
• Monolitna ili quarter-turn instalacija
• Mogućnost ugradnje bez lepka sa konektorima (B-connect)

Primena:
• Klasa 33 za intenzivnu komercijalnu upotrebu

Održivost:
• Third party certified EPD
• Proizvedeno u EU
• TVOC <100µg/m³ → kvalitet unutrašnjeg vazduha`,
    images: [{ id: '43-1', url: '/images/products/carpet/40546 - Armonia 620.jpg', alt: 'Gerflor Armonia 620', isPrimary: true, order: 1 }],
    documents: [
      { title: 'Technical Datasheet', url: '/documents/carpet/armonia-620-technical-datasheet.pdf' },
    ],
    specs: [
      { key: 'type', label: 'Tip', value: 'Tekstilne ploče' },
      { key: 'collection', label: 'Kolekcija', value: 'Armonia 620' },
      { key: 'material', label: 'Sastav', value: '100% Econyl' },
      { key: 'class', label: 'Klasa upotrebe', value: '33' },
    ],
    price: 0,
    priceUnit: 'm²',
    inStock: true,
    featured: true,
    externalLink: 'https://www.gerflor-cee.com/products/armonia-620',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  // Gerflor Heterogeni Vinil Collections
  {
    id: 'gerflor-nerok-55',
    name: 'Nerok 55',
    slug: 'gerflor-nerok-55',
    sku: 'GER-NEROK-55',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Nerok 55 - Heterogeni vinil podovi',
    description: 'Nerok 55 - profesionalni heterogeni vinil podovi.',
    images: [{
      id: 'nerok-55-img',
      url: '/images/products/vinyl/nerok-55/collection.jpg',
      alt: 'Nerok 55',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Nerok 55' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/nerok-55',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'gerflor-nerok-70',
    name: 'Nerok 70',
    slug: 'gerflor-nerok-70',
    sku: 'GER-NEROK-70',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Nerok 70 - Heterogeni vinil podovi',
    description: 'Nerok 70 - profesionalni heterogeni vinil podovi.',
    images: [{
      id: 'nerok-70-img',
      url: '/images/products/vinyl/nerok-70/collection.jpg',
      alt: 'Nerok 70',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Nerok 70' },
      { key: 'thickness', label: 'Debljina', value: '3.40 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/nerok-70',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'gerflor-premium-acoustic',
    name: 'Premium Acoustic',
    slug: 'gerflor-premium-acoustic',
    sku: 'GER-PREMIUM-ACOUSTIC',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Premium Acoustic - Heterogeni vinil podovi',
    description: 'Premium Acoustic - profesionalni heterogeni vinil podovi.',
    images: [{
      id: 'premium-acoustic-img',
      url: '/images/products/vinyl/premium-acoustic/collection.jpg',
      alt: 'Premium Acoustic',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Premium Acoustic' },
      { key: 'thickness', label: 'Debljina', value: '3.00 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/premium-acoustic',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'gerflor-premium-compact',
    name: 'Premium Compact',
    slug: 'gerflor-premium-compact',
    sku: 'GER-PREMIUM-COMPACT',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Premium Compact - Heterogeni vinil podovi',
    description: 'Premium Compact - profesionalni heterogeni vinil podovi.',
    images: [{
      id: 'premium-compact-img',
      url: '/images/products/vinyl/premium-compact/collection.jpg',
      alt: 'Premium Compact',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Premium Compact' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/premium-compact',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'gerflor-taralay-impression-acoustic',
    name: 'Taralay Impression Acoustic',
    slug: 'gerflor-taralay-impression-acoustic',
    sku: 'GER-TARALAY-IMPRESSION-ACOUSTIC',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Taralay Impression Acoustic - Heterogeni vinil podovi',
    description: 'Taralay Impression Acoustic - profesionalni heterogeni vinil podovi.',
    images: [{
      id: 'taralay-impression-acoustic-img',
      url: '/images/products/vinyl/taralay-impression-acoustic/collection.jpg',
      alt: 'Taralay Impression Acoustic',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Taralay Impression Acoustic' },
      { key: 'thickness', label: 'Debljina', value: '3.35 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/taralay-impression-acoustic',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'gerflor-taralay-impression-compact',
    name: 'Taralay Impression Compact',
    slug: 'gerflor-taralay-impression-compact',
    sku: 'GER-TARALAY-IMPRESSION-COMPACT',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Taralay Impression Compact - Heterogeni vinil podovi',
    description: 'Taralay Impression Compact - profesionalni heterogeni vinil podovi.',
    images: [{
      id: 'taralay-impression-compact-img',
      url: '/images/products/vinyl/taralay-impression-compact/collection.jpg',
      alt: 'Taralay Impression Compact',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Taralay Impression Compact' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/taralay-impression-compact',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'gerflor-taralay-impression-hop-acoustic',
    name: 'Taralay Impression Hop Acoustic',
    slug: 'gerflor-taralay-impression-hop-acoustic',
    sku: 'GER-TARALAY-IMPRESSION-HOP-ACOUSTIC',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Taralay Impression Hop Acoustic - Heterogeni vinil podovi',
    description: 'Taralay Impression Hop Acoustic - profesionalni heterogeni vinil podovi.',
    images: [{
      id: 'taralay-impression-hop-acoustic-img',
      url: '/images/products/vinyl/taralay-impression-hop-acoustic/collection.jpg',
      alt: 'Taralay Impression Hop Acoustic',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Taralay Impression Hop Acoustic' },
      { key: 'thickness', label: 'Debljina', value: '4.35 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/taralay-impression-hop-acoustic',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'gerflor-taralay-impression-hop-compact',
    name: 'Taralay Impression Hop Compact',
    slug: 'gerflor-taralay-impression-hop-compact',
    sku: 'GER-TARALAY-IMPRESSION-HOP-COMPACT',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Taralay Impression Hop Compact - Heterogeni vinil podovi',
    description: 'Taralay Impression Hop Compact - profesionalni heterogeni vinil podovi.',
    images: [{
      id: 'taralay-impression-hop-compact-img',
      url: '/images/products/vinyl/taralay-impression-hop-compact/collection.jpg',
      alt: 'Taralay Impression Hop Compact',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Taralay Impression Hop Compact' },
      { key: 'thickness', label: 'Debljina', value: '2.30 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/taralay-impression-hop-compact',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'gerflor-taralay-initial-acoustic',
    name: 'Taralay Initial Acoustic',
    slug: 'gerflor-taralay-initial-acoustic',
    sku: 'GER-TARALAY-INITIAL-ACOUSTIC',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Taralay Initial Acoustic - Heterogeni vinil podovi',
    description: 'Taralay Initial Acoustic - profesionalni heterogeni vinil podovi.',
    images: [{
      id: 'taralay-initial-acoustic-img',
      url: '/images/products/vinyl/taralay-initial-acoustic/collection.jpg',
      alt: 'Taralay Initial Acoustic',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Taralay Initial Acoustic' },
      { key: 'thickness', label: 'Debljina', value: '3.35 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/taralay-initial-acoustic',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'gerflor-taralay-initial-compact',
    name: 'Taralay Initial Compact',
    slug: 'gerflor-taralay-initial-compact',
    sku: 'GER-TARALAY-INITIAL-COMPACT',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Taralay Initial Compact - Heterogeni vinil podovi',
    description: 'Taralay Initial Compact - profesionalni heterogeni vinil podovi.',
    images: [{
      id: 'taralay-initial-compact-img',
      url: '/images/products/vinyl/taralay-initial-compact/collection.jpg',
      alt: 'Taralay Initial Compact',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Taralay Initial Compact' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/taralay-initial-compact',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'gerflor-taralay-millenium-acoustic-order',
    name: 'Taralay Millenium Acoustic',
    slug: 'gerflor-taralay-millenium-acoustic',
    sku: 'GER-TARALAY-MILLENIUM-ACOUSTIC-ORDER',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Taralay Millenium Acoustic - Heterogeni vinil podovi',
    description: 'Taralay Millenium Acoustic - profesionalni heterogeni vinil podovi.',
    images: [{
      id: 'taralay-millenium-acoustic-order-img',
      url: '/images/products/vinyl/taralay-millenium-acoustic-order/collection.jpg',
      alt: 'Taralay Millenium Acoustic',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Taralay Millenium Acoustic' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/taralay-millenium-acoustic-order',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'gerflor-taralay-millenium-compact',
    name: 'Taralay Millenium Compact',
    slug: 'gerflor-taralay-millenium-compact',
    sku: 'GER-TARALAY-MILLENIUM-COMPACT',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Taralay Millenium Compact - Heterogeni vinil podovi',
    description: 'Taralay Millenium Compact - profesionalni heterogeni vinil podovi.',
    images: [{
      id: 'taralay-millenium-compact-img',
      url: '/images/products/vinyl/taralay-millenium-compact/collection.jpg',
      alt: 'Taralay Millenium Compact',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'collection', label: 'Kolekcija', value: 'Taralay Millenium Compact' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/taralay-millenium-compact',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  // Auto-imported Gerflor products (583 items)
  ...gerflor_products,

  // ELEKTROPROVODNI (ESD) KOLEKCIJE - Gerflor
  {
    id: 'esd-1',
    name: 'Mipolam EL5',
    slug: 'gerflor-mipolam-el5',
    sku: 'ESD-MIPOLAM-EL5',
    categoryId: '8',
    brandId: '6',
    shortDescription: 'Elektroprovodni homogeni vinil pod sa ugljenim žilama (R < 10⁶ Ω)',
    description: 'Gerflor Mipolam EL5 - elektroprovodni homogeni vinil pod sa trajnim ESD svojstvima. Otpornost < 10⁶ Ω. Idealan za server sobe, laboratorije i elektronske pogone.',
    images: [{ id: 'esd-1-img', url: '/images/esd/mipolam-el5-alt.jpg', alt: 'Mipolam EL5', isPrimary: true, order: 1 }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam EL5' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
      { key: 'format', label: 'Format', value: 'Rolna' },
      { key: 'esd_class', label: 'ESD klasa', value: 'Elektroprovodni (< 10⁶ Ω)' },
    ],
    inStock: true,
    featured: true,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-el5',
    createdAt: new Date('2026-02-23'),
    updatedAt: new Date('2026-02-23'),
  },
  {
    id: 'esd-2',
    name: 'GTI EL5 Connect',
    slug: 'gerflor-gti-el5-connect',
    sku: 'ESD-GTI-EL5-CONNECT',
    categoryId: '8',
    brandId: '6',
    shortDescription: 'Interlocking ESD ploče za brzu renovaciju industrijskih prostora',
    description: 'Gerflor GTI EL5 Connect - teške interlocking ploče sa ESD zaštitom. Bez lepka, brza ugradnja. Idealne za industrijske hale i ESD-osetljive prostore.',
    images: [{ id: 'esd-2-img', url: '/images/esd/gti-el5-connect-alt.jpg', alt: 'GTI EL5 Connect', isPrimary: true, order: 1 }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'GTI EL5 Connect' },
      { key: 'thickness', label: 'Debljina', value: '6.00 mm' },
      { key: 'format', label: 'Format', value: 'Interlocking ploča' },
      { key: 'esd_class', label: 'ESD klasa', value: 'Elektroprovodni (< 10⁶ Ω)' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/gti-el5-connect',
    createdAt: new Date('2026-02-23'),
    updatedAt: new Date('2026-02-23'),
  },
  {
    id: 'esd-3',
    name: 'GTI EL5 Cleantech',
    slug: 'gerflor-gti-el5-cleantech',
    sku: 'ESD-GTI-EL5-CLEANTECH',
    categoryId: '8',
    brandId: '6',
    shortDescription: 'ESD ploče za čiste sobe (ISO 4)',
    description: 'Gerflor GTI EL5 Cleantech - ploče sertifikovane za čiste sobe (ISO 4) sa ESD zaštitom. Visoka otpornost.',
    images: [{ id: 'esd-3-img', url: '/images/esd/gti-el5-cleantech-alt.jpg', alt: 'GTI EL5 Cleantech', isPrimary: true, order: 1 }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'GTI EL5 Cleantech' },
      { key: 'thickness', label: 'Debljina', value: '6.00 mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'esd_class', label: 'ESD klasa', value: 'Elektroprovodni (< 10⁶ Ω)' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/gti-el5-cleantech',
    createdAt: new Date('2026-02-23'),
    updatedAt: new Date('2026-02-23'),
  },
  {
    id: 'esd-4',
    name: 'Mipolam Biocontrol EL5',
    slug: 'gerflor-mipolam-biocontrol-el5',
    sku: 'ESD-MIPOLAM-BIOCONTROL-EL5',
    categoryId: '8',
    brandId: '6',
    shortDescription: 'ESD pod za čiste sobe sa izuzetnom hemijskom otpornošću',
    description: 'Gerflor Mipolam Biocontrol EL5 - visokoperformantni homogeni pod za čiste sobe sa ESD kontrolom i odličnom hemijskom otpornošću.',
    images: [{ id: 'esd-4-img', url: '/images/esd/mipolam-biocontrol-el5-alt.jpg', alt: 'Mipolam Biocontrol EL5', isPrimary: true, order: 1 }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Biocontrol EL5' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
      { key: 'format', label: 'Format', value: 'Rolna' },
      { key: 'esd_class', label: 'ESD klasa', value: 'Elektroprovodni (< 10⁶ Ω)' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-biocontrol-el5',
    createdAt: new Date('2026-02-23'),
    updatedAt: new Date('2026-02-23'),
  },
  {
    id: 'esd-5',
    name: 'Mipolam Technic EL5 EU',
    slug: 'gerflor-mipolam-technic-el5-eu',
    sku: 'ESD-MIPOLAM-TECHNIC-EL5',
    categoryId: '8',
    brandId: '6',
    shortDescription: 'ESD ploče za elektronsku montažu i ATEX zone',
    description: 'Gerflor Mipolam Technic EL5 EU - projektovan za elektronsku montažu i ATEX prostore. Zadovoljava IEC 61340-5-1 standarde.',
    images: [{ id: 'esd-5-img', url: '/images/esd/mipolam-technic-el5-eu-lifestyle.jpg', alt: 'Mipolam Technic EL5 EU', isPrimary: true, order: 1 }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Technic EL5 EU' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
      { key: 'format', label: 'Format', value: 'Ploča 608×608 mm' },
      { key: 'esd_class', label: 'ESD klasa', value: 'Elektroprovodni (< 10⁶ Ω)' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-technic-el5-eu',
    createdAt: new Date('2026-02-23'),
    updatedAt: new Date('2026-02-23'),
  },
  {
    id: 'esd-6',
    name: 'Mipolam Robust EL7',
    slug: 'gerflor-mipolam-robust-el7',
    sku: 'ESD-MIPOLAM-ROBUST-EL7',
    categoryId: '8',
    brandId: '6',
    shortDescription: 'Provodni homogeni vinil sa nedirekcionalnim dizajnom (R < 10⁸ Ω)',
    description: 'Gerflor Mipolam Robust EL7 - provodni homogeni vinil (R < 10⁸ Ω) sa nedirekcionalnim dizajnom za opštu ESD zaštitu.',
    images: [{ id: 'esd-6-img', url: '/images/esd/mipolam-robust-el7-lifestyle.jpg', alt: 'Mipolam Robust EL7', isPrimary: true, order: 1 }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Robust EL7' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
      { key: 'format', label: 'Format', value: 'Rolna' },
      { key: 'esd_class', label: 'ESD klasa', value: 'Provodni (< 10⁸ Ω)' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-robust-el7',
    createdAt: new Date('2026-02-23'),
    updatedAt: new Date('2026-02-23'),
  },
  {
    id: 'esd-7',
    name: 'Mipolam EL7',
    slug: 'gerflor-mipolam-el7',
    sku: 'ESD-MIPOLAM-EL7',
    categoryId: '8',
    brandId: '6',
    shortDescription: 'Provodni homogeni vinil za opštu ESD zaštitu (R < 10⁸ Ω)',
    description: 'Gerflor Mipolam EL7 - provodni homogeni vinil za opštu namenu sa ESD zaštitom.',
    images: [{ id: 'esd-7-img', url: '/images/esd/mipolam-el7-4101.jpg', alt: 'Mipolam EL7', isPrimary: true, order: 1 }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam EL7' },
      { key: 'thickness', label: 'Debljina', value: '2.00 mm' },
      { key: 'format', label: 'Format', value: 'Rolna' },
      { key: 'esd_class', label: 'ESD klasa', value: 'Provodni (< 10⁸ Ω)' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-el7',
    createdAt: new Date('2026-02-23'),
    updatedAt: new Date('2026-02-23'),
  },
];
