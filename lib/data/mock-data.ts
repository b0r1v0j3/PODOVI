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

Okruženje:`,
    images: [{ id: '8-1', url: '/images/products/lvt/creation-30.jpg', alt: 'Gerflor Creation 30', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '2.00 mm' },
      { key: 'wear_layer', label: 'Sloj habanja', value: '0.30mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'usage_class', label: 'Klasa upotrebe', value: '23-31' },
      { key: 'fire_class', label: 'Protivpožarna klasifikacija', value: 'Bfl-s1' },
      { key: 'installation', label: 'Tip instalacije', value: 'Lepljenje' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
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
with Creation 40 Clic : where Dizajn meets inovacija
ultra-realistične designs: ultra-realistične textures, velvet-touch Površinska obradas and elegant ultra-matt finish
Novi površinski utisci: raznovrsne teksture that bring each Dizajn to life
Available Formats: XL daske, standardne daske and pravougaone pločice - designed to suit every space
Smart Dizajn: poboljšana vizuelna varijacija on selected designs for dublja realističnost
Smart Komfor inovacija: akustični gornji sloj for udobnost pri hodu, toplotna udobnost, sound reduction and easy cutting
Rigid core: ideal for renovation, compatible with existing subfloors, otporno na temperature variations
Lightweight construction: easier to transport, handle and install
Od poda do zida: create besprekorna harmonija with our Mural Revela Collection

Ugradnja i održavanje

Fold Down clic system: fast, secure and dust-free Ugradnja

No glue required: perfect for Ugradnja in front of bay windows or on sensitive Površinska obradas`,
    images: [{ id: '10-1', url: '/images/products/lvt/creation-40-clic.jpg', alt: 'Gerflor Creation 40 Clic', isPrimary: true, order: 1 }],
    specs: [
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Click sistem' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
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
with Creation 40 Clic Akustična izolacija: where Dizajn meets inovacija
Smart Komfor inovacija:
akustični gornji sloj for udobnost pri hodu, toplotna udobnost, sound reduction \(79dB\) and easy cutting
Akustična izolacija back layer for impact zvučna izolacija improvement \(19dB\)
Rigid core: ideal for renovation, compatible with existing subfloors, otporno na temperature variations
ultra-realistične designs: ultra-realistične textures, velvet-touch Površinska obradas and elegant ultra-matt finish
Smart Dizajn: poboljšana vizuelna varijacija on selected designs for dublja realističnost
Novi površinski utisci: raznovrsne teksture that bring each Dizajn to life
Available Formats: XL daske, standardne daske, and pravougaone pločice - designed to suit every space
Rigid core: ideal for renovation, compatible with existing subfloors, otporno na temperature variations
Lightweight construction: easier to transport, handle and install
Od poda do zida: create besprekorna harmonija with our`,
    images: [{ id: '11-1', url: '/images/products/lvt/creation-40-clic-acoustic.jpg', alt: 'Gerflor Creation 40 Clic Acoustic', isPrimary: true, order: 1 }],
    specs: [
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'acoustic', label: 'Akustična izolacija', value: 'Da' },
      { key: 'installation', label: 'Tip instalacije', value: 'Click sistem' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
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
Dostupno u Formatima: daske i pločice
4 zakošene ivice
Sloj habanja: 3\.60 mm
Ukupna debljina: 3\.60 mm
Visok nivo akustične izolacije \(-20dB\)
ProtecShield™ površinska obrada: poboljšana otpornost, jednostavno čišćenje

Ugradnja:
Uklonjiva ugradnja sa lepkom - pogodno za podignute podove
Moguća ugradnja na različite podloge
Moguća ugradnja na azbest kontaminirane podloge
Uklonjivi podovi - mogu se ukloniti po potrebi

Primena:
Evropska klasa upotrebe: 23/32
Idealno za zone sa intenzivnim prometom: kancelarije, hoteli, prodavnice
Protivpožarna klasifikacija: Bfl-s1 \(EN 13501-1\)

Okruženje:
100% reciklabilno
TVOC <10µg/m³
Bez ftalata
Kompatibilno sa REACH standardima
Proizvedeno u Francuskoj`,
    images: [{ id: '12-1', url: '/images/products/lvt/creation-40-zen.jpg', alt: 'Gerflor Creation 40 Zen', isPrimary: true, order: 1 }],
    specs: [
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Lepljenje' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
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
Sloj habanja: 0\.55 mm
Ukupna debljina: 2\.5 mm
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
    images: [{ id: '13-1', url: '/images/products/lvt/creation-55.jpg', alt: 'Gerflor Creation 55', isPrimary: true, order: 1 }],
    specs: [
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Lepljenje' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
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
with Creation 55 Clic: where Dizajn meets inovacija
ultra-realistične designs: ultra-realistične textures, velvet-touch Površinska obradas and elegant ultra-matt finish
Novi površinski utisci: raznovrsne teksture that bring each Dizajn to life
Available Formats: XL daske, standardne daske and pravougaone pločice - designed to suit every space
Smart Dizajn: poboljšana vizuelna varijacija on selected designs for dublja realističnost
Smart Komfor inovacija: akustični gornji sloj for udobnost pri hodu, toplotna udobnost, sound reduction and easy cutting
Rigid core: ideal for renovation, compatible with existing subfloors, otporno na temperature variations
Lightweight construction: easier to transport, handle and install
Od poda do zida: create besprekorna harmonija with our Mural Revela Collection

Ugradnja i održavanje

Fold Down clic system: fast, secure and dust-free Ugradnja

No glue required: perfect for Ugradnja in front of bay windows or on sensitive Površinska obradas`,
    images: [{ id: '14-1', url: '/images/products/lvt/creation-55-clic.jpg', alt: 'Gerflor Creation 55 Clic', isPrimary: true, order: 1 }],
    specs: [
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Click sistem' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
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
with Creation 55 Clic Akustična izolacija: where Dizajn meets inovacija
Smart Komfor inovacija:
akustični gornji sloj for udobnost pri hodu, toplotna udobnost, sound reduction \(79dB\) and easy cutting with a simple cutter
Akustična izolacija back layer for impact zvučna izolacija improvement \(19dB\)
Rigid core: ideal for renovation, compatible with existing subfloors, otporno na temperature variations
ultra-realistične designs: ultra-realistične textures, velvet-touch Površinska obradas and elegant ultra-matt finish
Smart Dizajn: poboljšana vizuelna varijacija on selected designs for dublja realističnost
Novi površinski utisci: raznovrsne teksture that bring each Dizajn to life
Available Formats: XL daske, standardne daske, male daske for herringbone, and pravougaone pločice - designed to suit every space
Lightweight construction: easier to transport, handle and install
Od poda do zida: create besprekorna harmonija with our Mural Revela Collection

Ugradnja i održavanje`,
    images: [{ id: '15-1', url: '/images/products/lvt/creation-55-clic-acoustic.jpg', alt: 'Gerflor Creation 55 Clic Acoustic', isPrimary: true, order: 1 }],
    specs: [
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'acoustic', label: 'Akustična izolacija', value: 'Da' },
      { key: 'installation', label: 'Tip instalacije', value: 'Click sistem' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
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
    description: `Uklonjivi podovi koji odgovaraju vašim potrebama Proizvod: 4 veličine Ekskluzivna konstrukcija « Duo jezgra », ojačano staklenim vlaknima za komfor i stabilnost ProtecShield™ varnish : prirodan izgled i lako za čišćenje ugradnja : Looselay up 30 m² Uklonjiva ugradnja sa lepkom - pogodno za podignute podove Direktno na keramiku ako je spoj <4mm Primena: idealno moderate prometom zone : kancelarije, hoteli, prodavnice - evropska klasa 33/42 Okruženje: 100% reciklabilno 35% recikliranog sadržaja TVOC <10µg/m3 Bez ftalata`,
    images: [{ id: '16-1', url: '/images/products/lvt/creation-55-looselay.jpg', alt: 'Gerflor Creation 55 Looselay', isPrimary: true, order: 1 }],
    specs: [
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Looselay' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
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
    description: `Okruženje:
kolekcija 2 Formati: slab \(600x600 mm\) or blade \(229x1220 mm\) 8 exclusives colors Unique Duo jezgra konstrukcija, ojačano vlaknima mat Komfor i stabilnost Integrated akustični backing providing 19dB impact zvuk insulation ProtecShield™ varnish ultra matte završetak i jednostavno održavanje Beveled edge all 4 sides ugradnja Repositionable screw-down ugradnja - kompatibilno Tehničke karakteristike floors fastest ugradnja large rooms ugradnja keramiku \(spoj <4mm\) Primena idealno moderate prometom applications requiring improved akustični management: offices, hotels, etc\. Okruženje 100% reciklabilno end život 35% recikliranog sadržaja TVOC <10μg/m3 Phthalate bez`,
    images: [{ id: '17-1', url: '/images/products/lvt/creation-55-looselay-acoustic.jpg', alt: 'Gerflor Creation 55 Looselay Acoustic', isPrimary: true, order: 1 }],
    specs: [
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'acoustic', label: 'Akustična izolacija', value: 'Da' },
      { key: 'installation', label: 'Tip instalacije', value: 'Looselay' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
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
Dostupno u Formatima: daske i pločice
4 zakošene ivice
Sloj habanja: 0\.55 mm
Ukupna debljina: 4\.25 mm
Visok nivo akustične izolacije \(-20dB\)
ProtecShield™ površinska obrada: poboljšana otpornost, jednostavno čišćenje

Ugradnja:
Uklonjiva ugradnja sa lepkom - pogodno za podignute podove
Moguća ugradnja na različite podloge
Moguća ugradnja na azbest kontaminirane podloge
Uklonjivi podovi - mogu se ukloniti po potrebi

Primena:
Evropska klasa upotrebe: 33/42
Idealno za zone sa intenzivnim prometom: kancelarije, hoteli, prodavnice
Otporno na visok promet
Protivpožarna klasifikacija: Bfl-s1 \(EN 13501-1\)

Okruženje:
100% reciklabilno
15% recikliranog sadržaja
TVOC <10µg/m³
Bez ftalata
Kompatibilno sa REACH standardima
Proizvedeno u Francuskoj`,
    images: [{ id: '18-1', url: '/images/products/lvt/creation-55-zen.jpg', alt: 'Gerflor Creation 55 Zen', isPrimary: true, order: 1 }],
    specs: [
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Lepljenje' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
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
Kompletna ponuda Formata: XL pravougaone pločice, XL kvadratne pločice, standardne daske, XL daske- dizajnirano da zadovolji svaki projekat
Profinjena rešenja \& harmonične palete boja: svaki detalj osmišljen da stvori ekskluzivan prostor
Novi površinski utisci: ultra-realistične and raznovrsne teksture that elevate each Dizajn
Ultra-mat završetak sa Protecshield™: baršunasti dodir and prirodna elegancija
Smart Dizajn – do 3 m² varijacije dizajna: poboljšana vizuelna varijacija on selected designs for dublja realističnost
Smart Komfor inovacija: akustični gornji sloj za bolje hodanje \(79dB\) i toplotni komfor
4 zakošene ivice: autentičan drveni and efekat pločica
Od poda do zida: create besprekorna harmonija with our Mural Revela Collection

Ugradnja i održavanje
Dry Back sistem: profesionalna ugradnja for dugotrajna performansa
Idealno za novu gradnju
Small Daska Formats: ideal for refined parquet-style layouts
Protecshield™ površinska obrada: poboljšana otpornost, jednostavno čišćenje
Efficient Održavanje`,
    images: [{ id: '19-1', url: '/images/products/lvt/creation-70.jpg', alt: 'Gerflor Creation 70', isPrimary: true, order: 1 }],
    specs: [
      { key: 'thickness', label: 'Ukupna debljina', value: '2,5mm' },
      { key: 'wear_layer', label: 'Sloj habanja', value: '0.70mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'usage_class', label: 'Klasa upotrebe', value: '34-43' },
      { key: 'fire_class', label: 'Protivpožarna klasifikacija', value: 'Bfl-s1' },
      { key: 'installation', label: 'Tip instalacije', value: 'Lepljenje' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
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
Dizajn i proizvod
with Creation 70 Clic : where Dizajn meets inovacija
ultra-realistične designs: ultra-realistične textures, velvet-touch Površinska obradas and elegant ultra-matt finish
Novi površinski utisci: raznovrsne teksture that bring each Dizajn to life
Available Formats: XL daske, standardne daske and pravougaone pločice - designed to suit every space
Smart Dizajn: poboljšana vizuelna varijacija on selected designs for dublja realističnost
Smart Komfor inovacija: akustični gornji sloj for udobnost pri hodu, toplotna udobnost, sound reduction and easy cutting
Rigid core: ideal for renovation, compatible with existing subfloors, otporno na temperature variations
Lightweight construction: easier to transport, handle and install
Od poda do zida: create besprekorna harmonija with our Mural Revela Collection`,
    images: [{ id: '20-1', url: '/images/products/lvt/creation-70-clic.jpg', alt: 'Gerflor Creation 70 Clic', isPrimary: true, order: 1 }],
    specs: [
      { key: 'wear_layer', label: 'Sloj habanja', value: '0.70mm' },
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'usage_class', label: 'Klasa upotrebe', value: '34-43' },
      { key: 'installation', label: 'Tip instalacije', value: 'Click sistem' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
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
    description: `Proizvod: ojačano Komfor jezgra fiberglass particles: improved Komfor i stabilnost PUR \+ Matte varnish: prirodan izgled i lako za čišćenje ugradnja: Ekskluzivna Gerflor dovetails: easy ugradnja i robust Adhesive-bez ugradnja: ugradnja occupied area even case Rolnaing prometom Can be installed Direktno over keramiku \(spoj <5mm/<1mm\) Primena: idealno high-prometom zone \(chain specialist, education, public buildings\) Okruženje: Made Europe / up 55% recikliranog sadržaja / 100% reciklabilno: eco-responsible solution TVOC <10µg/m3 / phthalate bez: better Kvalitet unutrašnjeg vazduha`,
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
    description: `Okruženje:
Proizvod 2 Large Ploča i Daska : idealno za realistic layout i Dizajn flexibility Ultra-prirodan shades: closely resemble raw materials authentic aesthetics Durable konstrukcija: dizajnirano high-prometom environments Complete decorative solution: kompatibilno GTI Max, includes entrance mats, ramps, i junctions Slip-otporno \& lako za čišćenje: ensures safety i Održavanje ease Rolnaing tRolnaey noise smanjenje \(vs keramiku\): quieter commercial use ugradnja Strong MegaClic connection: ojačano vertical clic system robust, adhesive-bez ugradnja Can be installed directly over keramiku Quick renovaciju solution:
o glue required Primena High-prometom zone: idealno za retail, education, public buildings stvorite zones: Dizajn themed atmospheres dedicated spaces \(e\.g\., supermarket corners\) Mix \& Match: harmonizes GTI Max custom layouts Okruženje Made Europe Eco-responsible: 100% reciklabilno i includes recikliranog sadržaja Better Kvalitet unutrašnjeg vazduha: low TVOC \(<10 µg /m3\), phthalate-bez`,
    images: [{ id: '22-1', url: '/images/products/lvt/creation-70-megaclic.jpg', alt: 'Gerflor Creation 70 Megaclic', isPrimary: true, order: 1 }],
    specs: [
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Click sistem' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
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
Dostupno u Formatima: daske i pločice
4 zakošene ivice
Sloj habanja: 0\.70 mm
Ukupna debljina: 4\.35 mm
Visok nivo akustične izolacije \(-20dB\)
ProtecShield™ površinska obrada: poboljšana otpornost, jednostavno čišćenje

Ugradnja:
Uklonjiva ugradnja sa lepkom - pogodno za podignute podove
Moguća ugradnja na različite podloge
Moguća ugradnja na azbest kontaminirane podloge
Uklonjivi podovi - mogu se ukloniti po potrebi

Primena:
Evropska klasa upotrebe: 34/42
Idealno za zone sa intenzivnim prometom: kancelarije, hoteli, prodavnice
Otporno na visok promet
Protivpožarna klasifikacija: Bfl-s1 \(EN 13501-1\)

Okruženje:
100% reciklabilno
15% recikliranog sadržaja
TVOC <10µg/m³
Bez ftalata
Kompatibilno sa REACH standardima
Proizvedeno u Francuskoj`,
    images: [{ id: '23-1', url: '/images/products/lvt/creation-70-zen.jpg', alt: 'Gerflor Creation 70 Zen', isPrimary: true, order: 1 }],
    specs: [
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Lepljenje' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
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
5 veličina: uključujući riblju kost i XL daske
Ekskluzivna konstrukcija « Duo Core » sa pluto jezgrom za komfor i akustične performanse \(15 dB smanjenje buke\)
ProtecShield™ površinska obrada: lako za čišćenje, bez potrebe za voskom

Ugradnja:
Uklonjiva ugradnja sa lepkom - pogodno za podignute podove
Direktno na keramiku ako je spoj <5mm

Primena:
Idealno za zone sa visokim prometom: prodavnice, kancelarije, recepcije, itd\.

Okruženje:
100% reciklabilno
55% recikliranog sadržaja
Pluto: obnovljiva sirovina
TVOC <10µg/m³
Bez ftalata`,
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
    description: `Uklonjivi podovi koji odgovaraju vašim potrebama

Proizvod:
5 veličina: uključujući riblju kost i XL daske
Ekskluzivna konstrukcija « Duo Core », ojačano staklenim vlaknima za komfor i stabilnost
ProtecShield™ lak: prirodan izgled i lako za čišćenje

Ugradnja:
Uklonjiva ugradnja sa lepkom - pogodno za podignute podove
Direktno na keramiku ako je spoj <4mm

Primena:
Idealno za zone sa intenzivnim prometom: kancelarije, hoteli, prodavnice - evropska klasa 34-43

Okruženje:
100% reciklabilno
35% recikliranog sadržaja
TVOC <10µg/m³
Bez ftalata`,
    images: [{ id: '25-1', url: '/images/products/lvt/creation-70-looselay.jpg', alt: 'Gerflor Creation 70 Looselay', isPrimary: true, order: 1 }],
    specs: [
      { key: 'format', label: 'Format', value: 'Ploča' },
      { key: 'installation', label: 'Tip instalacije', value: 'Looselay' },
      { key: 'surface', label: 'Površinska obrada', value: 'Protecshield® PUR' },
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
    description: 'Gerflor Armonia 400 tekstilne podne ploče. Pogledajte kompletnu ponudu na Gerflor sajtu.',
    images: [{ id: '41-1', url: '/images/products/tekstilne-ploce/armonia-400.jpg', alt: 'Gerflor Armonia 400', isPrimary: true, order: 1 }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Tekstilne ploče' },
      { key: 'collection', label: 'Kolekcija', value: 'Armonia 400' },
      { key: 'link', label: 'Katalog', value: 'www.gerflor-cee.com' },
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
    description: 'Gerflor Armonia 540 tekstilne podne ploče. Pogledajte kompletnu ponudu na Gerflor sajtu.',
    images: [{ id: '42-1', url: '/images/products/tekstilne-ploce/armonia-540.jpg', alt: 'Gerflor Armonia 540', isPrimary: true, order: 1 }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Tekstilne ploče' },
      { key: 'collection', label: 'Kolekcija', value: 'Armonia 540' },
      { key: 'link', label: 'Katalog', value: 'www.gerflor-cee.com' },
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
    description: 'Gerflor Armonia 620 tekstilne podne ploče. Pogledajte kompletnu ponudu na Gerflor sajtu.',
    images: [{ id: '43-1', url: '/images/products/tekstilne-ploce/armonia-620.jpg', alt: 'Gerflor Armonia 620', isPrimary: true, order: 1 }],
    specs: [
      { key: 'type', label: 'Tip', value: 'Tekstilne ploče' },
      { key: 'collection', label: 'Kolekcija', value: 'Armonia 620' },
      { key: 'link', label: 'Katalog', value: 'www.gerflor-cee.com' },
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
