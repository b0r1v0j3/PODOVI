import { Category, Brand, Product } from '@/types';
import { gerflor_products } from './gerflor-products-generated';
import linoleumProducts from './linoleum-products';

export const categories: Category[] = [
  {
    id: '3',
    name: 'Parket',
    slug: 'parket',
    description: 'Prirodni drveni parketi za elegantne prostore',
    image: '/images/categories/parket.jpg',
    order: 1,
  },
  {
    id: '1',
    name: 'Laminat',
    slug: 'laminat',
    description: 'Visokokvalitetni laminat podovi za svaki prostor',
    image: '/images/categories/laminat.jpg',
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
    image: '/images/products/carpet/57556 - ARMONIA 400 Beige - Color Scan.jpg',
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
    description: 'Vodootporni vinil podovi sa autentičnim izgledom',
    image: '/images/categories/vinil.jpg',
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
    id: '1',
    name: 'Egger',
    slug: 'egger',
    logo: '/images/brands/egger.png',
    description: 'Vodeći evropski proizvođač laminata i podnih obloga',
    website: 'https://www.egger.com',
    countryOfOrigin: 'Austrija',
  },
  {
    id: '2',
    name: 'Quick-Step',
    slug: 'quick-step',
    logo: '/images/brands/quick-step.png',
    description: 'Belgijska kompanija sa preko 40 godina iskustva',
    website: 'https://www.quick-step.com',
    countryOfOrigin: 'Belgija',
  },
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
    id: '4',
    name: 'Balterio',
    slug: 'balterio',
    logo: '/images/brands/balterio.png',
    description: 'Premium belgijski laminat poznat po izdržljivosti',
    website: 'https://www.balterio.com',
    countryOfOrigin: 'Belgija',
  },
  {
    id: '5',
    name: 'Kronotex',
    slug: 'kronotex',
    logo: '/images/brands/kronotex.png',
    description: 'Nemački kvalitet po pristupačnim cenama',
    website: 'https://www.kronotex.com',
    countryOfOrigin: 'Nemačka',
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
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Egger Pro Laminat Hrast Valley Dymny',
    slug: 'egger-pro-laminat-hrast-valley-dymny',
    sku: 'EPL178',
    categoryId: '1',
    brandId: '1',
    shortDescription: 'Moderan laminat sa prirodnim izgledom hrasta',
    description: 'Egger Pro Laminat je vrhunski laminat sa autentičnim izgledom drveta. Otporan na habanje klasa AC5, idealan za sve prostorije uključujući i komercionalne.',
    images: [
      {
        id: '1-1',
        url: '/images/products/laminat-hrast-1.jpg',
        alt: 'Egger Pro Laminat Hrast Valley',
        isPrimary: true,
        order: 1,
      },
      {
        id: '1-2',
        url: '/images/products/laminat-hrast-2.jpg',
        alt: 'Egger Pro Laminat Detaljni izgled',
        isPrimary: false,
        order: 2,
      },
    ],
    specs: [
      { key: 'class', label: 'Klasa habanja', value: 'AC5/33' },
      { key: 'thickness', label: 'Debljina', value: '8.00 mm' },
      { key: 'width', label: 'Širina', value: '193.00 mm' },
      { key: 'length', label: 'Dužina', value: '1291.00 mm' },
      { key: 'surface', label: 'Površina', value: 'Teksturirana' },
      { key: 'lock', label: 'Sistem spajanja', value: 'Click sistem' },
      { key: 'warranty', label: 'Garancija', value: '25 godina' },
    ],
    price: 1850,
    priceUnit: 'm²',
    inStock: true,
    featured: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Quick-Step Impressive Ultra Hrast Sivi',
    slug: 'quick-step-impressive-ultra-hrast-sivi',
    sku: 'IMU1665',
    categoryId: '1',
    brandId: '2',
    shortDescription: 'Vodootporni laminat sa izuzetnom otpornošću',
    description: 'Quick-Step Impressive Ultra je revolucionarni laminat koji kombinuje autentičan izgled drveta sa vodootpornošću. Savršen izbor za kuhinje i kuppatila.',
    images: [
      {
        id: '2-1',
        url: '/images/products/quick-step-grey-1.jpg',
        alt: 'Quick-Step Impressive Ultra',
        isPrimary: true,
        order: 1,
      },
    ],
    specs: [
      { key: 'class', label: 'Klasa habanja', value: 'AC5/33' },
      { key: 'thickness', label: 'Debljina', value: '12.00 mm' },
      { key: 'width', label: 'Širina', value: '190.00 mm' },
      { key: 'length', label: 'Dužina', value: '1380.00 mm' },
      { key: 'waterproof', label: 'Vodootporan', value: 'Da' },
      { key: 'warranty', label: 'Garancija', value: '25 godina' },
    ],
    price: 2950,
    priceUnit: 'm²',
    inStock: true,
    featured: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    name: 'Tarkett Starfloor Click 55 Scandinavian Oak',
    slug: 'tarkett-starfloor-click-55-scandinavian-oak',
    sku: 'TRK35950005',
    categoryId: '2',
    brandId: '3',
    shortDescription: 'Luksuzni vinil pod saClick sistemom',
    description: 'Tarkett Starfloor Click 55 je premium vinil pod koji kombinuje prirodan izgled drveta sa praktičnošću vinila. 100% vodootporan, idealan za sve prostorije.',
    images: [
      {
        id: '3-1',
        url: '/images/products/tarkett-vinil-1.jpg',
        alt: 'Tarkett Starfloor Click',
        isPrimary: true,
        order: 1,
      },
    ],
    specs: [
      { key: 'type', label: 'Tip', value: 'LVT vinil' },
      { key: 'class', label: 'Klasa', value: '33/42' },
      { key: 'thickness', label: 'Debljina', value: '4.5 mm' },
      { key: 'width', label: 'Širina', value: '190.00 mm' },
      { key: 'length', label: 'Dužina', value: '1210.00 mm' },
      { key: 'waterproof', label: 'Vodootporan', value: 'Da' },
      { key: 'warranty', label: 'Garancija', value: '20 godina' },
    ],
    price: 3200,
    priceUnit: 'm²',
    inStock: true,
    featured: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: '4',
    name: 'Balterio Grande Narrow Burbon Hrast',
    slug: 'balterio-grande-narrow-burbon-hrast',
    sku: 'BAL64088',
    categoryId: '1',
    brandId: '4',
    shortDescription: 'Elegantni uski laminat sa prirodnom teksturom',
    description: 'Balterio Grande Narrow donosi eleganciju uzanih dasaka sa autentičnom teksturom hrasta. Premium kvalitet za zahtevne kupce.',
    images: [
      {
        id: '4-1',
        url: '/images/products/balterio-1.jpg',
        alt: 'Balterio Grande Narrow',
        isPrimary: true,
        order: 1,
      },
    ],
    specs: [
      { key: 'class', label: 'Klasa habanja', value: 'AC5/32' },
      { key: 'thickness', label: 'Debljina', value: '9.00 mm' },
      { key: 'width', label: 'Širina', value: '127.00 mm' },
      { key: 'length', label: 'Dužina', value: '1261.00 mm' },
      { key: 'surface', label: 'Površina', value: 'Duboka tekstura' },
      { key: 'warranty', label: 'Garancija', value: '30 godina' },
    ],
    price: 2450,
    priceUnit: 'm²',
    inStock: true,
    featured: false,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '5',
    name: 'Kronotex Dynamic Plus Petterson Hrast Beli',
    slug: 'kronotex-dynamic-plus-petterson-hrast-beli',
    sku: 'KRO3572',
    categoryId: '1',
    brandId: '5',
    shortDescription: 'Svetli laminat sa odličnim odnosom cene i kvaliteta',
    description: 'Kronotex Dynamic Plus je odličan izbor za one koji traže kvalitetan laminat po pristupačnoj ceni. Nemačko kvalitetno, izdržljiv i lako se održava.',
    images: [
      {
        id: '5-1',
        url: '/images/products/kronotex-1.jpg',
        alt: 'Kronotex Dynamic Plus',
        isPrimary: true,
        order: 1,
      },
    ],
    specs: [
      { key: 'class', label: 'Klasa habanja', value: 'AC4/32' },
      { key: 'thickness', label: 'Debljina', value: '8.00 mm' },
      { key: 'width', label: 'Širina', value: '198.00 mm' },
      { key: 'length', label: 'Dužina', value: '1383.00 mm' },
      { key: 'warranty', label: 'Garancija', value: '20 godina' },
    ],
    price: 1450,
    priceUnit: 'm²',
    inStock: true,
    featured: false,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: '6',
    name: 'Egger Pro Comfort Hrast Waltham Prirodni',
    slug: 'egger-pro-comfort-hrast-waltham-prirodni',
    sku: 'EPC015',
    categoryId: '1',
    brandId: '1',
    shortDescription: 'Laminat sa integrisanom podlogom za dodatnu udobnost',
    description: 'Egger Pro Comfort donosi dodatnu udobnost hodanja zahvaljujući integrnoj podlozi. Odličan zvučni i toplotni izolator.',
    images: [
      {
        id: '6-1',
        url: '/images/products/egger-comfort-1.jpg',
        alt: 'Egger Pro Comfort',
        isPrimary: true,
        order: 1,
      },
    ],
    specs: [
      { key: 'class', label: 'Klasa habanja', value: 'AC4/32' },
      { key: 'thickness', label: 'Debljina', value: '10.00 mm' },
      { key: 'width', label: 'Širina', value: '193.00 mm' },
      { key: 'length', label: 'Dužina', value: '1291.00 mm' },
      { key: 'underlay', label: 'Podloga', value: 'Integrisana' },
      { key: 'warranty', label: 'Garancija', value: '30 godina' },
    ],
    price: 2100,
    priceUnit: 'm²',
    inStock: false,
    featured: false,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  },
  {
    id: '7',
    name: 'Egger Pro Design 2025 Hrast Divino Sivi',
    slug: 'egger-pro-design-2025-hrast-divino-sivi',
    sku: 'EPD2025',
    categoryId: '1',
    brandId: '1',
    shortDescription: 'Najnoviji dizajn sa autentičnom teksturom i vodootpornim jezgrom',
    description: 'Egger Pro Design 2025 donosi revolucionarni vodootporni laminat sa 4-stranim V-utorom i autentičnom teksturom hrasta. Idealan za moderne prostore, otporan na vlagu i lak za održavanje. Savršen balans dizajna i funkcionalnosti.',
    images: [
      {
        id: '7-1',
        url: '/images/products/egger-design-2025.jpg',
        alt: 'Egger Pro Design 2025 Hrast Divino Sivi',
        isPrimary: true,
        order: 1,
      },
      {
        id: '7-2',
        url: '/images/products/egger-design-2025-detail.jpg',
        alt: 'Egger Pro Design 2025 Detalj teksture',
        isPrimary: false,
        order: 2,
      },
    ],
    specs: [
      { key: 'class', label: 'Klasa habanja', value: 'AC5/33' },
      { key: 'thickness', label: 'Debljina', value: '10.00 mm' },
      { key: 'width', label: 'Širina', value: '193.00 mm' },
      { key: 'length', label: 'Dužina', value: '1291.00 mm' },
      { key: 'waterproof', label: 'Vodootporan', value: 'Da - jezgro' },
      { key: 'surface', label: 'Površina', value: 'Duboka tekstura' },
      { key: 'lock', label: 'Sistem spajanja', value: 'Click Pro 4V' },
      { key: 'coverage', label: 'Pakovanje', value: '2.25 m² (8 dasaka)' },
      { key: 'warranty', label: 'Garancija', value: '30 godina' },
    ],
    price: 2650,
    priceUnit: 'm²',
    inStock: true,
    featured: true,
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
  },
  // GERFLOR KOLEKCIJE - External links
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
      { key: 'thickness', label: 'Ukupna debljina', value: '2.00 mm' },
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
      { key: 'thickness', label: 'Ukupna debljina', value: '2,5mm' },
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
    id: '24',
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
  {
    id: '25',
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
  // Auto-imported Gerflor products (583 items)
  ...gerflor_products,
];
