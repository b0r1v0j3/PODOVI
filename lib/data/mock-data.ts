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
    image: '/images/categories/lvt.jpg',
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
    order: 7,
  },

];

export const brands: Brand[] = [
  {
    id: '3',
    name: 'Tarkett',
    slug: 'tarkett',
    logo: '/images/brands/tarkett.png',
    description: 'Globalni lider u proizvodnji inovativnih podnih rešenja',
    website: 'https://www.tarkett.com',
    countryOfOrigin: 'Francuska',
  },
  {
    id: '6',
    name: 'Gerflor',
    slug: 'gerflor',
    logo: '/images/brands/gerflor.png',
    description: 'Francuski lider u proizvodnji vinilnih i komercijalnih podova sa preko 80 godina iskustva',
    website: 'https://www.gerflor-cee.com/',
    countryOfOrigin: 'Francuska',
  },
  {
    id: '8',
    name: 'BLOQ',
    slug: 'bloq',
    logo: '/images/brands/bloq.png',
    description: 'Holandski proizvođač premium tekstilnih ploča za komercijalne i poslovne prostore',
    website: 'https://bloq.nl',
    countryOfOrigin: 'Holandija',
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

  // ==============================
  // EGGER — NatureSense (Laminat)
  // ==============================
  {
    id: 'egger-naturesense',
    name: 'EGGER NatureSense',
    slug: 'egger-naturesense',
    sku: 'EGGER-NS',
    categoryId: '1',
    brandId: '9',
    shortDescription: 'Laminatni pod sa sinhronizovanim porama za realističan izgled i osećaj prirodnog drveta',
    description: `Opis:
EGGER NatureSense je laminatni pod koji se uklapa svuda. Bez obzira koliko užurbano živimo, on će prostor pretvoriti u vaš dom.

Karakteristike:
Sinhronizovane pore za realističan izgled drveta koji možete dodirnuti — tekstura i struktura drveta preneti su na laminat posebnim postupkom utiskivanja na površinu
Trajna i izuzetno izdržljiva površina štiti od ogrebotina, UV svetla i svakodnevnih nezgoda
Svestraan pod koji se može kombinovati sa podnim grejanjem
Lako se održavaju, odbijaju prljavštinu i jednostavno se čiste
EGGER podovi su sertifikovani od uglednih instituta

Ugradnja:
EGGER CLIC it! sistem polaganja — lako se postavlja kao plivajući pod
Podne daske se mogu postavljati pod uglom ili fiksirati nabijanjem
Nije komplikovano ukloniti i zameniti pojedinačne podne daske

Održivi razvoj:
U proizvodnji se koristi drvo dobijeno razrjeđivanjem šuma i nusproizvodi iz pilana
Proizvodi značajno doprinose kružnoj ekonomiji`,
    images: [{
      id: 'egger-ns-img',
      url: '/images/products/egger/naturesense/collection.jpg',
      alt: 'EGGER NatureSense laminatni pod',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'brand_line', label: 'Linija', value: 'NatureSense' },
      { key: 'type', label: 'Tip poda', value: 'Laminat (DPL)' },
      { key: 'wear_class', label: 'Klasa korišćenja', value: '31 / 32' },
      { key: 'thickness', label: 'Debljina', value: '7 mm / 8 mm' },
      { key: 'format', label: 'Format ploče', value: 'Classic 1.292×193mm, Kingsize 1.292×327mm, Large 1.292×246mm' },
      { key: 'surface', label: 'Površinska struktura', value: 'Omnipore / Natural Pore (sinhronizovane pore)' },
      { key: 'installation', label: 'Sistem polaganja', value: 'CLIC it!' },
      { key: 'warranty', label: 'Garancija', value: '20 godina' },
      { key: 'floor_heating', label: 'Podno grejanje', value: 'Da' },
      { key: 'pvc_free', label: 'Bez PVC-a', value: 'Da — bez plastifikatora' },
      { key: 'water_resistance', label: 'Otpornost na vodu', value: 'Standardna' },
    ],
    benefits: [
      'Izdržljiva površina otporna na habanje, ogrebotine i UV svetlo',
      'Jednostavan za održavanje — odbija prljavštinu, lako se čisti',
      'Pogodan za podno grejanje',
      '100% bez PVC-a i plastifikatora — za zdrav dom',
      'CLIC it! sistem — brzo i pouzdano postavljanje bez lepka',
      'Garancija 20 godina',
      'Odličan odnos cene i kvaliteta',
    ],
    compatibleAccessories: [
      'egger-silenzio-easy',
      'egger-silenzio-easy-sd',
      'egger-silenzio-professional',
      'egger-silenzio-duo',
      'egger-podna-lajsna-cubical-8cm',
      'egger-profil-3u1-aluminijum',
    ],
    documents: [
      { title: 'Uputstva za ugradnju (srpski)', url: '/documents/egger/uputstvo-za-ugradnju-srpski.pdf', type: 'installation' },
      { title: 'Garancija EGGER podova (srpski)', url: '/documents/egger/garancija-srpski.pdf', type: 'warranty' },
      { title: 'Čišćenje i nega podova (srpski)', url: '/documents/egger/ciscenje-i-nega-srpski.pdf', type: 'care' },
      { title: 'Tehnički podaci — NatureSense', url: '/documents/egger/tds-naturesense.pdf', type: 'technical' },
      { title: 'Environmental Health Datasheet', url: '/documents/egger/ehd-naturesense.pdf', type: 'certificate' },
    ],
    inStock: true,
    featured: true,
    externalLink: 'https://www.egger.com/sr/podne-obloge/pretraga-dekora?product_brand=naturesense&country=RS',
    createdAt: new Date('2026-02-11'),
    updatedAt: new Date('2026-02-11'),
  },
  {
    id: 'egger-naturesense-herringbone',
    name: 'EGGER NatureSense Herringbone',
    slug: 'egger-naturesense-herringbone',
    sku: 'EGGER-NSH',
    categoryId: '1',
    brandId: '9',
    shortDescription: 'Bezvremeni laminat u ribljoj kosti — klasičan dezen sa svim prednostima laminata',
    description: `Opis:
EGGER NatureSense Herringbone kombinuje bezvremenske dekore riblje kosti sa prednostima laminata. Elegancija klasičnog dezena za moderne prostore.

Karakteristike:
Bezvremeni dekori riblje kosti (herringbone) za elegantan izgled
Sve prednosti laminata — izdržljivost, lako čišćenje, otpornost na ogrebotine
Sinhronizovane pore za prirodan izgled i osećaj drveta
Kompatibilan sa podnim grejanjem
Sertifikovano od uglednih instituta

Ugradnja:
EGGER CLIC it! sistem polaganja
Posebna pakna za nakucavanje Herringbone za jednostavno i precizno postavljanje
Profesionalan alat dostupan u EGGER ponudi pribora`,
    images: [{
      id: 'egger-nsh-img',
      url: '/images/products/egger/naturesense-herringbone/collection.jpg',
      alt: 'EGGER NatureSense Herringbone laminatni pod',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'brand_line', label: 'Linija', value: 'NatureSense Herringbone' },
      { key: 'type', label: 'Tip poda', value: 'Laminat (DPL)' },
      { key: 'wear_class', label: 'Klasa korišćenja', value: '32' },
      { key: 'thickness', label: 'Debljina', value: '8 mm' },
      { key: 'format', label: 'Format ploče', value: 'Riblja kost 840×168 mm' },
      { key: 'pattern', label: 'Dezen', value: 'Riblja kost (Herringbone)' },
      { key: 'surface', label: 'Površinska struktura', value: 'Natural Pore (sinhronizovane pore)' },
      { key: 'installation', label: 'Sistem polaganja', value: 'CLIC it!' },
      { key: 'warranty', label: 'Garancija', value: '20 godina' },
      { key: 'floor_heating', label: 'Podno grejanje', value: 'Da' },
      { key: 'pvc_free', label: 'Bez PVC-a', value: 'Da — bez plastifikatora' },
    ],
    benefits: [
      'Klasičan izgled parketa sa motivom riblje kosti',
      'Izdržljiva površina — za razliku od prirodnog drveta',
      'Patentiran CLIC it! sistem postavljanja',
      'Pogodan za podno grejanje',
      '100% bez PVC-a i plastifikatora',
      'Garancija 20 godina',
    ],
    compatibleAccessories: [
      'egger-silenzio-easy',
      'egger-silenzio-easy-sd',
      'egger-silenzio-professional',
      'egger-silenzio-duo',
      'egger-podna-lajsna-cubical-8cm',
      'egger-profil-3u1-aluminijum',
    ],
    documents: [
      { title: 'Uputstva za ugradnju (srpski)', url: '/documents/egger/uputstvo-za-ugradnju-srpski.pdf', type: 'installation' },
      { title: 'Garancija EGGER podova (srpski)', url: '/documents/egger/garancija-srpski.pdf', type: 'warranty' },
      { title: 'Čišćenje i nega podova (srpski)', url: '/documents/egger/ciscenje-i-nega-srpski.pdf', type: 'care' },
      { title: 'Tehnički podaci — NatureSense', url: '/documents/egger/tds-naturesense.pdf', type: 'technical' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.egger.com/sr/podne-obloge/pretraga-dekora?product_brand=herringbone&country=RS',
    createdAt: new Date('2026-02-11'),
    updatedAt: new Date('2026-02-11'),
  },
  {
    id: 'egger-naturesense-aqua',
    name: 'EGGER NatureSense Aqua',
    slug: 'egger-naturesense-aqua',
    sku: 'EGGER-NSA',
    categoryId: '1',
    brandId: '9',
    shortDescription: 'Vodootporni laminat za kupatila i kuhinje — NatureSense sa zaštitom od vode',
    description: `Opis:
NatureSense Aqua laminatni pod je zaista svestran — zahvaljujući vodonepropusnim profilima može se koristiti u kupatilima i kuhinjama.

Karakteristike:
Vodonepropusni profili — zaštita od prodora vode na spojevima
Pogodan za kupatila i kuhinje
Sinhronizovane pore za realističan izgled drveta koji možete dodirnuti
Trajna i izdržljiva površina otporna na ogrebotine i UV svetlo
Svestran pod, kompatibilan sa podnim grejanjem
Sertifikovano od uglednih instituta

Ugradnja:
EGGER CLIC it! sistem polaganja
Lako se postavlja kao plivajući pod
Ne zahteva dodatnu zaštitu od vlage na spojevima`,
    images: [{
      id: 'egger-nsa-img',
      url: '/images/products/egger/naturesense-aqua/collection.webp',
      alt: 'EGGER NatureSense Aqua vodootporni laminat',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'brand_line', label: 'Linija', value: 'NatureSense Aqua' },
      { key: 'type', label: 'Tip poda', value: 'Laminat (DPL) — vodootporni' },
      { key: 'wear_class', label: 'Klasa korišćenja', value: '32' },
      { key: 'thickness', label: 'Debljina', value: '8 mm / 10 mm' },
      { key: 'format', label: 'Format ploče', value: 'Classic 1.292×193mm, Kingsize 1.292×327mm, Large 1.292×246mm, Long 2.050×246mm' },
      { key: 'surface', label: 'Površinska struktura', value: 'Natural Pore (sinhronizovane pore)' },
      { key: 'installation', label: 'Sistem polaganja', value: 'Aqua CLIC it!' },
      { key: 'warranty', label: 'Garancija', value: '20 godina' },
      { key: 'floor_heating', label: 'Podno grejanje', value: 'Da' },
      { key: 'pvc_free', label: 'Bez PVC-a', value: 'Da — bez plastifikatora' },
      { key: 'water_resistance', label: 'Otpornost na vodu', value: 'Vodootporan 24 sata (Aqua CLIC it!)' },
    ],
    benefits: [
      'Vodootporan tokom 24 sata — pogodan za kupatila i kuhinje',
      'Sinhronizovane pore za realističan izgled i taktilnost drveta',
      'Izdržljiva površina otporna na habanje i ogrebotine',
      'Pogodan za podno grejanje',
      '100% bez PVC-a i plastifikatora',
      'Aqua CLIC it! sistem — ne zahteva dodatnu zaštitu na spojevima',
      'Više formata ploča za različite prostore',
    ],
    compatibleAccessories: [
      'egger-silenzio-easy',
      'egger-silenzio-easy-sd',
      'egger-silenzio-professional',
      'egger-silenzio-duo',
      'egger-podna-lajsna-cubical-8cm',
      'egger-profil-3u1-aluminijum',
    ],
    documents: [
      { title: 'Uputstva za ugradnju (srpski)', url: '/documents/egger/uputstvo-za-ugradnju-srpski.pdf', type: 'installation' },
      { title: 'Garancija EGGER podova (srpski)', url: '/documents/egger/garancija-srpski.pdf', type: 'warranty' },
      { title: 'Čišćenje i nega podova (srpski)', url: '/documents/egger/ciscenje-i-nega-srpski.pdf', type: 'care' },
      { title: 'Tehnički podaci — NatureSense Aqua', url: '/documents/egger/tds-naturesense-aqua.pdf', type: 'technical' },
      { title: 'Environmental Health Datasheet', url: '/documents/egger/ehd-naturesense.pdf', type: 'certificate' },
    ],
    inStock: true,
    featured: true,
    externalLink: 'https://www.egger.com/sr/podne-obloge/pretraga-dekora?product_brand=naturesenseaqua&country=RS',
    createdAt: new Date('2026-02-11'),
    updatedAt: new Date('2026-02-11'),
  },
  {
    id: 'egger-naturesense-aqua-plus',
    name: 'EGGER NatureSense Aqua+',
    slug: 'egger-naturesense-aqua-plus',
    sku: 'EGGER-NSAP',
    categoryId: '1',
    brandId: '9',
    shortDescription: 'Premium vodootporni laminat sa dvostrukom zaštitom od vode — za najzahtevnije vlažne prostore',
    description: `Opis:
Ovaj pod voli izazove. Sa svojom izdržljivom površinom i dvostrukom zaštitom od vode, NatureSense Aqua+ je pravi profesionalac za vlažne prostore.

Karakteristike:
Dvostruka zaštita od vode — pojačana otpornost na vlagu
Izdržljiva površina otporna na sve svakodnevne izazove
Sinhronizovane pore za realističan izgled drveta
Idealn za kupatila, kuhinje i druge vlažne prostore
Svestraan pod, kompatibilan sa podnim grejanjem
Sertifikovano od uglednih instituta, sigurno za zdravo stanovanje

Ugradnja:
EGGER CLIC it! sistem polaganja
Jednostavno postavljanje kao plivajući pod
Najviši nivo zaštite od vode među laminatima`,
    images: [{
      id: 'egger-nsap-img',
      url: '/images/products/egger/naturesense-aqua-plus/collection.jpg',
      alt: 'EGGER NatureSense Aqua+ premium vodootporni laminat',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'brand_line', label: 'Linija', value: 'NatureSense Aqua+' },
      { key: 'type', label: 'Tip poda', value: 'Laminat (DPL) — premium vodootporni' },
      { key: 'wear_class', label: 'Klasa korišćenja', value: '33' },
      { key: 'thickness', label: 'Debljina', value: '8 mm' },
      { key: 'format', label: 'Format ploče', value: 'Classic 1.292×193mm, Kingsize 1.292×327mm, Large 1.292×246mm' },
      { key: 'surface', label: 'Površinska struktura', value: 'Natural Pore (sinhronizovane pore)' },
      { key: 'installation', label: 'Sistem polaganja', value: 'CLIC it!' },
      { key: 'warranty', label: 'Garancija', value: '20 godina' },
      { key: 'floor_heating', label: 'Podno grejanje', value: 'Da' },
      { key: 'pvc_free', label: 'Bez PVC-a', value: 'Da — bez plastifikatora' },
      { key: 'water_resistance', label: 'Otpornost na vodu', value: 'Vodootporan 72 sata — dvostruka zaštita' },
      { key: 'core', label: 'Nosiva ploča', value: 'Tamna HDF+ sa posebnom zaštitom od bubrenja' },
    ],
    benefits: [
      'Vodootporan tokom 72 sata — dvostruka zaštita od vode',
      'Izdržljiva površina za najzahtevnije prostore',
      'Tamna nosiva ploča sa posebnom zaštitom od bubrenja',
      'Idealan za hotele, kancelarije i kupatila',
      'Pogodan za podno grejanje',
      '100% bez PVC-a i plastifikatora',
      'Garancija 20 godina',
    ],
    compatibleAccessories: [
      'egger-silenzio-easy',
      'egger-silenzio-easy-sd',
      'egger-silenzio-professional',
      'egger-silenzio-duo',
      'egger-podna-lajsna-cubical-8cm',
      'egger-profil-3u1-aluminijum',
    ],
    documents: [
      { title: 'Uputstva za ugradnju (srpski)', url: '/documents/egger/uputstvo-za-ugradnju-srpski.pdf', type: 'installation' },
      { title: 'Garancija EGGER podova (srpski)', url: '/documents/egger/garancija-srpski.pdf', type: 'warranty' },
      { title: 'Tehnički podaci — NatureSense Aqua+', url: '/documents/egger/tds-naturesense-aqua-plus.pdf', type: 'technical' },
      { title: 'Environmental Health Datasheet — Aqua+', url: '/documents/egger/ehd-naturesense-aqua-plus.pdf', type: 'certificate' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.egger.com/sr/podne-obloge/pretraga-dekora?product_brand=naturesenseaquaplus&country=RS',
    createdAt: new Date('2026-02-11'),
    updatedAt: new Date('2026-02-11'),
  },

  // ==============================
  // EGGER — AquaDura (Hibridni pod)
  // ==============================
  {
    id: 'egger-aquadura',
    name: 'EGGER AquaDura',
    slug: 'egger-aquadura',
    sku: 'EGGER-AD',
    categoryId: '1',
    brandId: '9',
    shortDescription: 'Hibridni pod na bazi drveta — bez PVC-a, integrisana podloga, matt-touch površina, alternativa vinilu',
    description: `Opis:
Dozvolite da vam predstavimo: AquaDura. Ovaj pod je uspešan spoj funkcionalnosti i estetike i naš proizvod na bazi drveta kao odgovor konvencionalnom LVT podu. Savršeno osmišljen, od jedinstvene matt-touch površine do integrisane podloge od prirodnih vlakana, on savršeno skladno kombinuje kvalitetne materijale, jednostavno postavljanje i privlačne dekore.

Karakteristike:
Hibridni pod na bazi drveta — alternativa konvencionalnim LVT podovima
Bez PVC-a i plastifikatora
Matt-touch površina: ultra-mat završetak koji odbija prljavštinu i lako se čisti
Integrisana podloga od recikliranih celuloznih vlakana — rešenje 2 u 1
Smanjuje buku prostorije i buku koraka
Vodonepropusan sistem polaganja Aqua CLIC it!
Sertifikovano od uglednih instituta za zdravo stanovanje

Ugradnja:
Aqua CLIC it! sistem polaganja — vodonepropusan
Integrisana podloga — ne trebate dodatnu izolaciju od buke koraka
Brzo i jednostavno postavljanje

Održivi razvoj:
Integrisana podloga od recikliranih prirodnih vlakana
Bez PVC-a — ekološki prihvatljivija alternativa`,
    images: [{
      id: 'egger-ad-img',
      url: '/images/products/egger/aquadura/collection.webp',
      alt: 'EGGER AquaDura hibridni pod na bazi drveta',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'brand_line', label: 'Linija', value: 'AquaDura' },
      { key: 'type', label: 'Tip poda', value: 'Hibridni pod na bazi drveta' },
      { key: 'wear_class', label: 'Klasa korišćenja', value: '32' },
      { key: 'thickness', label: 'Debljina', value: '7,5 mm (sa integrisanom podlogom)' },
      { key: 'format', label: 'Format ploče', value: 'Classic 1.292×193mm' },
      { key: 'surface', label: 'Površinska struktura', value: 'Matt-touch — svilenkasto mek izgled nauljenog drveta' },
      { key: 'installation', label: 'Sistem polaganja', value: 'Aqua CLIC it!' },
      { key: 'warranty', label: 'Garancija', value: '20 godina' },
      { key: 'floor_heating', label: 'Podno grejanje', value: 'Da' },
      { key: 'pvc_free', label: 'Bez PVC-a', value: 'Da — bez plastifikatora' },
      { key: 'integrated_underlay', label: 'Integrisana podloga', value: 'Da — reciklirana celulozna vlakna' },
      { key: 'water_resistance', label: 'Otpornost na vodu', value: 'Vodootporan 24 sata (Aqua CLIC it!)' },
    ],
    benefits: [
      'Matt-touch površina — svilenkast izgled nauljenog drveta',
      'Alternativa vinilu na bazi drveta — bez PVC-a',
      'Vodootporan 24 sata zahvaljujući Aqua CLIC it!',
      'Integrisana podloga — ne treba vam dodatna izolacija',
      'Samo 7,5 mm — može se postaviti na pločice',
      'Pogodan za podno grejanje',
      'Garancija 20 godina',
    ],
    compatibleAccessories: [
      'egger-podna-lajsna-cubical-8cm',
      'egger-profil-3u1-aluminijum',
    ],
    documents: [
      { title: 'Uputstva za ugradnju (srpski)', url: '/documents/egger/uputstvo-za-ugradnju-srpski.pdf', type: 'installation' },
      { title: 'Garancija EGGER podova (srpski)', url: '/documents/egger/garancija-srpski.pdf', type: 'warranty' },
      { title: 'Tehnički podaci — AquaDura', url: '/documents/egger/tds-aquadura.pdf', type: 'technical' },
      { title: 'Environmental Health Datasheet', url: '/documents/egger/ehd-aquadura.pdf', type: 'certificate' },
    ],
    inStock: true,
    featured: true,
    externalLink: 'https://www.egger.com/sr/podne-obloge/pretraga-dekora?product_brand=aquadura&country=RS',
    createdAt: new Date('2026-02-11'),
    updatedAt: new Date('2026-02-11'),
  },
  {
    id: 'egger-aquadura-plus',
    name: 'EGGER AquaDura+',
    slug: 'egger-aquadura-plus',
    sku: 'EGGER-ADP',
    categoryId: '1',
    brandId: '9',
    shortDescription: 'Premium hibridni pod sa dvostrukom zaštitom od vlage — vodonepropusan 72 sata, atraktivan izgled drveta i kamena',
    description: `Opis:
Inovativni hibridni pod AquaDura+ je proizvod na bazi drveta kao odgovor konvencionalnim vinilnim podnim oblogama. Njegova izuzetno mat površina mu daje prirodan izgled, a elegantni dizajn u seljačkom stilu ili izgled pločica kreiraju ekskluzivan efekat. AquaDura+ garantuje jedinstveno iskustvo stanovanja i postavlja nove standarde u pogledu estetike i funkcionalnosti.

Karakteristike:
Premium hibridni pod na bazi drveta — novi standardi kvaliteta
Bez PVC-a i plastifikatora
Unapređena matt-touch površina za elegantan i prirodan izgled
Integrisana podloga od recikliranih celuloznih vlakana — rešenje 2 u 1
Pojačano smanjenje buke prostorije i buke koraka
Vodonepropusan sistem polaganja Aqua CLIC it!
Sertifikovano od uglednih instituta za zdravo stanovanje

Ugradnja:
Aqua CLIC it! sistem polaganja — vodonepropusan
Integrisana podloga — ne trebate dodatnu izolaciju od buke koraka
Brzo i jednostavno postavljanje

Održivi razvoj:
Integrisana podloga od recikliranih prirodnih vlakana
Bez PVC-a — ekološki prihvatljivija alternativa`,
    images: [{
      id: 'egger-adp-img',
      url: '/images/products/egger/aquadura-plus/collection.webp',
      alt: 'EGGER AquaDura+ premium hibridni pod',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'brand_line', label: 'Linija', value: 'AquaDura+' },
      { key: 'type', label: 'Tip poda', value: 'Premium hibridni pod na bazi drveta' },
      { key: 'wear_class', label: 'Klasa korišćenja', value: '33' },
      { key: 'thickness', label: 'Debljina', value: '7,5 mm (sa integrisanom podlogom)' },
      { key: 'format', label: 'Format ploče', value: 'Classic 1.292×193mm, Kingsize 1.292×327mm, Large 1.292×246mm' },
      { key: 'surface', label: 'Površinska struktura', value: 'Matt-touch — ultra-mat, unapređen' },
      { key: 'installation', label: 'Sistem polaganja', value: 'Aqua CLIC it!' },
      { key: 'warranty', label: 'Garancija', value: '20 godina' },
      { key: 'floor_heating', label: 'Podno grejanje', value: 'Da' },
      { key: 'pvc_free', label: 'Bez PVC-a', value: 'Da — bez plastifikatora' },
      { key: 'integrated_underlay', label: 'Integrisana podloga', value: 'Da — reciklirana celulozna vlakna' },
      { key: 'water_resistance', label: 'Otpornost na vodu', value: 'Vodootporan 72 sata — dvostruka zaštita' },
      { key: 'core', label: 'Nosiva ploča', value: 'Nosiva ploča koja ne bubri + Aqua CLIC it!' },
    ],
    benefits: [
      'Vodootporan 72 sata — dvostruka zaštita od vlage',
      'Matt-touch površina — elegantni izgled nauljenog drveta ili kamena',
      'Nosiva ploča koja ne bubri — maksimalna sigurnost',
      'Integrisana podloga od recikliranih vlakana',
      'Alternativa vinilnim podovima na bazi drveta',
      'Pogodan za podno grejanje',
      'Garancija 20 godina',
    ],
    compatibleAccessories: [
      'egger-podna-lajsna-cubical-8cm',
      'egger-profil-3u1-aluminijum',
    ],
    documents: [
      { title: 'Uputstva za ugradnju (srpski)', url: '/documents/egger/uputstvo-za-ugradnju-srpski.pdf', type: 'installation' },
      { title: 'Garancija EGGER podova (srpski)', url: '/documents/egger/garancija-srpski.pdf', type: 'warranty' },
      { title: 'Tehnički podaci — AquaDura+', url: '/documents/egger/tds-aquadura-plus.pdf', type: 'technical' },
      { title: 'Environmental Health Datasheet — AquaDura+', url: '/documents/egger/ehd-aquadura-plus.pdf', type: 'certificate' },
    ],
    inStock: true,
    featured: true,
    externalLink: 'https://www.egger.com/sr/podne-obloge/pretraga-dekora?product_brand=aquaduraplus&country=RS',
    createdAt: new Date('2026-02-11'),
    updatedAt: new Date('2026-02-11'),
  },

  // ==============================
  // EGGER — Ugradnja (podloge)
  // ==============================
  // Podloge - kategorija Ugradnja (8)
  {
    id: 'egger-silenzio-easy',
    name: 'EGGER Silenzio Easy',
    slug: 'egger-silenzio-easy',
    sku: 'EGGER-ACC-SE',
    categoryId: '8',
    brandId: '9',
    shortDescription: 'XPS laminatna podloga za plivajući pod — 2 mm, smanjenje buke koraka',
    description: `Opis:
XPS laminatna podloga za postavljanje plivajućeg poda na nemineralne podloge.

Karakteristike:
Pouzdano smanjenje buke koraka i udaraca uz debljinu od samo 2 mm
Pogodna za podno grejanje zbog niske toplotne otpornosti
Praktična preklopna podloga — postavlja se brzo i jednostavno
Može se ukloniti bez ostavljanja tragova`,
    images: [{
      id: 'egger-se-img',
      url: '/images/products/egger/pribor/silenzio-easy.jpg',
      alt: 'EGGER Silenzio Easy podloga',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Podloga' },
      { key: 'material', label: 'Materijal', value: 'XPS' },
      { key: 'thickness', label: 'Debljina', value: '2 mm' },
      { key: 'floor_heating', label: 'Podno grejanje', value: 'Da' },
      { key: 'vapor_barrier', label: 'Parna brana', value: 'Ne' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.egger.com/sr/podne-obloge/dodatni-pribor/podloge?country=RS',
    createdAt: new Date('2026-02-11'),
    updatedAt: new Date('2026-02-11'),
  },
  {
    id: 'egger-silenzio-easy-sd',
    name: 'EGGER Silenzio Easy SD',
    slug: 'egger-silenzio-easy-sd',
    sku: 'EGGER-ACC-SESD',
    categoryId: '8',
    brandId: '9',
    shortDescription: '2-u-1 XPS podloga sa integrisanom parnom branom za mineralne podloge',
    description: `Opis:
2-u-1 XPS podloga za postavljanje plivajućeg laminatnog poda na mineralne podloge poput estriha ili betona.

Karakteristike:
Integrisana parna brana za pouzdanu zaštitu od dizanja vlage
Pouzdano smanjenje buke koraka i udaraca uz debljinu od samo 2 mm
Pogodna za podno grejanje zbog niske toplotne otpornosti
Praktična preklopna podloga — postavlja se brzo i jednostavno
Može se ukloniti bez ostavljanja tragova`,
    images: [{
      id: 'egger-sesd-img',
      url: '/images/products/egger/pribor/silenzio-easy-sd.jpg',
      alt: 'EGGER Silenzio Easy SD podloga',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Podloga' },
      { key: 'material', label: 'Materijal', value: 'XPS' },
      { key: 'thickness', label: 'Debljina', value: '2 mm' },
      { key: 'floor_heating', label: 'Podno grejanje', value: 'Da' },
      { key: 'vapor_barrier', label: 'Parna brana', value: 'Da — integrisana' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.egger.com/sr/podne-obloge/dodatni-pribor/podloge?country=RS',
    createdAt: new Date('2026-02-11'),
    updatedAt: new Date('2026-02-11'),
  },
  {
    id: 'egger-silenzio-professional',
    name: 'EGGER Silenzio Professional SD 3-u-1',
    slug: 'egger-silenzio-professional',
    sku: 'EGGER-ACC-SP',
    categoryId: '8',
    brandId: '9',
    shortDescription: 'Premium PU podloga 3-u-1 sa parnom branom i lepljivom trakom — samo 1.8 mm',
    description: `Opis:
Trajna i krajnje otporna 3-u-1 PU premium podloga za laminatni pod.

Karakteristike:
Integrisana parna brana za pouzdanu zaštitu od dizanja vlage
Integrisana lepljiva traka za jednostavno postavljanje
Pouzdano smanjenje buke koraka i udaraca uz debljinu od samo 1,8 mm
Izuzetno pogodna za podno grejanje zbog niske toplotne otpornosti
Dugotrajna stabilnost na pritisak zahvaljujući izuzetno otpornoj mešavini poliuretana i minerala (PUM)`,
    images: [{
      id: 'egger-sp-img',
      url: '/images/products/egger/pribor/silenzio-professional.jpg',
      alt: 'EGGER Silenzio Professional SD podloga',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Podloga' },
      { key: 'material', label: 'Materijal', value: 'PU + minerali (PUM)' },
      { key: 'thickness', label: 'Debljina', value: '1.8 mm' },
      { key: 'floor_heating', label: 'Podno grejanje', value: 'Da — izuzetno pogodna' },
      { key: 'vapor_barrier', label: 'Parna brana', value: 'Da — integrisana' },
      { key: 'adhesive_tape', label: 'Lepljiva traka', value: 'Da — integrisana' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.egger.com/sr/podne-obloge/dodatni-pribor/podloge?country=RS',
    createdAt: new Date('2026-02-11'),
    updatedAt: new Date('2026-02-11'),
  },
  {
    id: 'egger-silenzio-duo',
    name: 'EGGER Silenzio Duo',
    slug: 'egger-silenzio-duo',
    sku: 'EGGER-ACC-SD',
    categoryId: '8',
    brandId: '9',
    shortDescription: 'XPS 3-u-1 podloga izuzetno otporna na pritisak — samo 1.5 mm',
    description: `Opis:
XPS 3-u-1 podloga izuzetno otporna na pritisak za postavljanje plivajućeg laminatnog poda.

Karakteristike:
Za postavljanje na mineralnim podlogama
Integrisana parna brana za pouzdanu zaštitu od dizanja vlage
Integrisana lepljiva traka za jednostavno postavljanje
Pouzdano smanjenje buke koraka i udaraca uz debljinu od samo 1,5 mm
Pogodna za podno grejanje zbog niske toplotne otpornosti
Praktična preklopna podloga — brzo i jednostavno postavljanje
Može se ukloniti bez ostavljanja tragova`,
    images: [{
      id: 'egger-sd-img',
      url: '/images/products/egger/pribor/silenzio-duo.jpg',
      alt: 'EGGER Silenzio Duo podloga',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Podloga' },
      { key: 'material', label: 'Materijal', value: 'XPS' },
      { key: 'thickness', label: 'Debljina', value: '1.5 mm' },
      { key: 'floor_heating', label: 'Podno grejanje', value: 'Da' },
      { key: 'vapor_barrier', label: 'Parna brana', value: 'Da — integrisana' },
      { key: 'adhesive_tape', label: 'Lepljiva traka', value: 'Da — integrisana' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.egger.com/sr/podne-obloge/dodatni-pribor/podloge?country=RS',
    createdAt: new Date('2026-02-11'),
    updatedAt: new Date('2026-02-11'),
  },
  // Lajsne i profili - kategorija Lajsne (9)
  {
    id: 'egger-lajsna-cubical-8cm',
    name: 'EGGER Podna lajsna 8 cm CUBICAL',
    slug: 'egger-podna-lajsna-cubical-8cm',
    sku: 'EGGER-ACC-LC8',
    categoryId: '9',
    brandId: '9',
    shortDescription: 'Moderna četvrtasta podna lajsna 8 cm — MDF sa dekorativnom folijom usklađenom sa EGGER podovima',
    description: `Opis:
Moderna četvrtasta podna lajsna od MDF-a sa dekorativnom folijom usklađenom sa EGGER laminatnim i hibridnim podovima.

Karakteristike:
Optimalno pokriva dilatacioni spoj širine 8-10 mm
Dekorativna folija usklađena sa EGGER dekorima podova
Glodani utor na poleđini za postavljanje sa EGGER spojnicama
Alternativno postavljanje lepkom ili ekserima
Dostupna u brojnim dekorima
Format: 2.400 x 14 x 58 mm i 2.400 x 14 x 80 mm`,
    images: [{
      id: 'egger-lc8-img',
      url: '/images/products/egger/pribor/lajsna-cubical-8.jpg',
      alt: 'EGGER Podna lajsna CUBICAL 8 cm',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Podna lajsna' },
      { key: 'material', label: 'Materijal', value: 'MDF' },
      { key: 'dimensions', label: 'Format', value: '2.400 x 14 x 58/80 mm' },
      { key: 'style', label: 'Stil', value: 'Moderna četvrtasta (CUBICAL)' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.egger.com/sr/podne-obloge/dodatni-pribor/podne-lajsne-profili?country=RS',
    createdAt: new Date('2026-02-11'),
    updatedAt: new Date('2026-02-11'),
  },
  {
    id: 'egger-profil-3u1',
    name: 'EGGER 3-u-1 aluminijumski profil',
    slug: 'egger-profil-3u1-aluminijum',
    sku: 'EGGER-ACC-3P',
    categoryId: '9',
    brandId: '9',
    shortDescription: '3 u 1 aluminijumski profil za prelaz, poravnanje i završetak poda',
    description: `Opis:
3 u 1 profil za laminatne i hibridne podove debljine od 6,5 do 16 mm. Može se koristiti kao prelazni profil, profil za poravnanje i završni profil.

Karakteristike:
Od aluminijuma sa dekorativnom folijom usklađenom sa EGGER dekorima
Postavljanje tiplovima i integrisanim lepljivim trakama
Priložen pribor za montažu
Klasa abrazije AC3
Dostupan u mnogo različitih dekora
Format: 1.860 x 37 x 10 mm`,
    images: [{
      id: 'egger-3p-img',
      url: '/images/products/egger/pribor/profil-3u1.jpg',
      alt: 'EGGER 3-u-1 aluminijumski profil',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Profil lajsna' },
      { key: 'material', label: 'Materijal', value: 'Aluminijum' },
      { key: 'dimensions', label: 'Format', value: '1.860 x 37 x 10 mm' },
      { key: 'function', label: 'Funkcija', value: 'Prelazni + poravnanje + završni (3-u-1)' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.egger.com/sr/podne-obloge/dodatni-pribor/podne-lajsne-profili?country=RS',
    createdAt: new Date('2026-02-11'),
    updatedAt: new Date('2026-02-11'),
  },
];
