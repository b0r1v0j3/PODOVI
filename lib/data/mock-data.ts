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
  // VINIL KOLEKCIJE - 23 collections
  {
    id: 'vinil-collection-mipolam-accord',
    name: 'Gerflor Mipolam Accord',
    slug: 'gerflor-mipolam-accord',
    sku: 'GER-MIPOLAMACCORD',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Accord - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Accord kolekcija sadrži 22 boja.',
    images: [{
      id: 'mipolam-accord-img',
      url: '/images/products/vinyl/mipolam-accord/collection.jpg',
      alt: 'Mipolam Accord',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Accord' },
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'colors', label: 'Broj boja', value: '22' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-accord',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-mipolam-affinity',
    name: 'Gerflor Mipolam Affinity',
    slug: 'gerflor-mipolam-affinity',
    sku: 'GER-MIPOLAMAFFINITY',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Affinity - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Affinity kolekcija sadrži 50 boja.',
    images: [{
      id: 'mipolam-affinity-img',
      url: '/images/products/vinyl/mipolam-affinity/collection.jpg',
      alt: 'Mipolam Affinity',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Affinity' },
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'colors', label: 'Broj boja', value: '50' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-affinity',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-mipolam-affinity-608x608',
    name: 'Gerflor Mipolam Affinity 608x608',
    slug: 'gerflor-mipolam-affinity-608x608',
    sku: 'GER-MIPOLAMAFFINITY608X608',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Affinity 608x608 - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Affinity 608x608 kolekcija sadrži 50 boja.',
    images: [{
      id: 'mipolam-affinity-608x608-img',
      url: '/images/products/vinyl/mipolam-affinity-608x608/collection.jpg',
      alt: 'Mipolam Affinity 608x608',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Affinity 608x608' },
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'colors', label: 'Broj boja', value: '50' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-affinity-608x608',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-3',
    name: 'Gerflor Mipolam Astro',
    slug: 'gerflor-mipolam-astro',
    sku: 'GER-MIPOLAMASTRO',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Astro - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Astro kolekcija sadrži 14 boja.',
    images: [{
      id: 'gerflor-mipolam-astro-img',
      url: '/images/products/vinyl/mipolam-astro/collection.jpg',
      alt: 'Mipolam Astro',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Astro' },
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'colors', label: 'Broj boja', value: '14' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-astro',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-4',
    name: 'Gerflor Mipolam Bioplanet',
    slug: 'gerflor-mipolam-bioplanet',
    sku: 'GER-MIPOLAMBIOPLANET',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Bioplanet - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Bioplanet kolekcija sadrži 40 boja.',
    images: [{
      id: 'gerflor-mipolam-bioplanet-img',
      url: '/images/products/vinyl/mipolam-bioplanet/collection.jpg',
      alt: 'Mipolam Bioplanet',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Bioplanet' },
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'colors', label: 'Broj boja', value: '40' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-bioplanet',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-5',
    name: 'Gerflor Mipolam Classic 15mm',
    slug: 'gerflor-mipolam-classic-15mm',
    sku: 'GER-MIPOLAMCLASSIC15MM',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Classic 15mm - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Classic 15mm kolekcija sadrži 2 boja.',
    images: [{
      id: 'gerflor-mipolam-classic-15mm-img',
      url: '/images/products/vinyl/mipolam-classic-15mm/collection.jpg',
      alt: 'Mipolam Classic 15mm',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Classic 15mm' },
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'colors', label: 'Broj boja', value: '2' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-classic-15mm',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-6',
    name: 'Gerflor Mipolam Classic 2mm',
    slug: 'gerflor-mipolam-classic-2mm',
    sku: 'GER-MIPOLAMCLASSIC2MM',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Classic 2mm - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Classic 2mm kolekcija sadrži 14 boja.',
    images: [{
      id: 'gerflor-mipolam-classic-2mm-img',
      url: '/images/products/vinyl/mipolam-classic-2mm/collection.jpg',
      alt: 'Mipolam Classic 2mm',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Classic 2mm' },
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'colors', label: 'Broj boja', value: '14' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-classic-2mm',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-7',
    name: 'Gerflor Mipolam Elegance',
    slug: 'gerflor-mipolam-elegance',
    sku: 'GER-MIPOLAMELEGANCE',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Elegance - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Elegance kolekcija sadrži 33 boja.',
    images: [{
      id: 'gerflor-mipolam-elegance-img',
      url: '/images/products/vinyl/mipolam-elegance/collection.jpg',
      alt: 'Mipolam Elegance',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Elegance' },
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'colors', label: 'Broj boja', value: '33' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-elegance',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-8',
    name: 'Gerflor Mipolam Planet',
    slug: 'gerflor-mipolam-planet',
    sku: 'GER-MIPOLAMPLANET',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Planet - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Planet kolekcija sadrži 40 boja.',
    images: [{
      id: 'gerflor-mipolam-planet-img',
      url: '/images/products/vinyl/mipolam-planet/collection.jpg',
      alt: 'Mipolam Planet',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Planet' },
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'colors', label: 'Broj boja', value: '40' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-planet',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-9',
    name: 'Gerflor Mipolam Symbioz',
    slug: 'gerflor-mipolam-symbioz',
    sku: 'GER-MIPOLAMSYMBIOZ',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Symbioz - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Symbioz kolekcija sadrži 31 boja.',
    images: [{
      id: 'gerflor-mipolam-symbioz-img',
      url: '/images/products/vinyl/mipolam-symbioz/collection.jpg',
      alt: 'Mipolam Symbioz',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Symbioz' },
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'colors', label: 'Broj boja', value: '31' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-symbioz',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-10',
    name: 'Gerflor Mipolam Troplan',
    slug: 'gerflor-mipolam-troplan',
    sku: 'GER-MIPOLAMTROPLAN',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Mipolam Troplan - Homogeni vinil podovi',
    description: 'Gerflor Mipolam Troplan kolekcija sadrži 18 boja.',
    images: [{
      id: 'gerflor-mipolam-troplan-img',
      url: '/images/products/vinyl/mipolam-troplan/collection.jpg',
      alt: 'Mipolam Troplan',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Mipolam Troplan' },
      { key: 'type', label: 'Tip', value: 'Homogeni' },
      { key: 'colors', label: 'Broj boja', value: '18' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/mipolam-troplan',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-11',
    name: 'Gerflor Nerok 55',
    slug: 'gerflor-nerok-55',
    sku: 'GER-NEROK55',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Nerok 55 - Heterogeni vinil podovi',
    description: 'Gerflor Nerok 55 kolekcija sadrži 36 boja.',
    images: [{
      id: 'gerflor-nerok-55-img',
      url: '/images/products/vinyl/nerok-55/collection.jpg',
      alt: 'Nerok 55',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Nerok 55' },
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'colors', label: 'Broj boja', value: '36' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/nerok-55',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-12',
    name: 'Gerflor Nerok 70',
    slug: 'gerflor-nerok-70',
    sku: 'GER-NEROK70',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Nerok 70 - Heterogeni vinil podovi',
    description: 'Gerflor Nerok 70 kolekcija sadrži 36 boja.',
    images: [{
      id: 'gerflor-nerok-70-img',
      url: '/images/products/vinyl/nerok-70/collection.jpg',
      alt: 'Nerok 70',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Nerok 70' },
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'colors', label: 'Broj boja', value: '36' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/nerok-70',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-13',
    name: 'Gerflor Premium Acoustic',
    slug: 'gerflor-premium-acoustic',
    sku: 'GER-PREMIUMACOUSTIC',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Premium Acoustic - Heterogeni vinil podovi',
    description: 'Gerflor Premium Acoustic kolekcija sadrži 29 boja.',
    images: [{
      id: 'gerflor-premium-acoustic-img',
      url: '/images/products/vinyl/premium-acoustic/collection.jpg',
      alt: 'Premium Acoustic',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Premium Acoustic' },
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'colors', label: 'Broj boja', value: '29' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/premium-acoustic',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-14',
    name: 'Gerflor Premium Compact',
    slug: 'gerflor-premium-compact',
    sku: 'GER-PREMIUMCOMPACT',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Premium Compact - Heterogeni vinil podovi',
    description: 'Gerflor Premium Compact kolekcija sadrži 81 boja.',
    images: [{
      id: 'gerflor-premium-compact-img',
      url: '/images/products/vinyl/premium-compact/collection.jpg',
      alt: 'Premium Compact',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Premium Compact' },
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'colors', label: 'Broj boja', value: '81' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/premium-compact',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-15',
    name: 'Gerflor Taralay Impression Acoustic',
    slug: 'gerflor-taralay-impression-acoustic',
    sku: 'GER-TARALAYIMPRESSIONACOUSTIC',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Taralay Impression Acoustic - Heterogeni vinil podovi',
    description: 'Gerflor Taralay Impression Acoustic kolekcija sadrži 96 boja.',
    images: [{
      id: 'gerflor-taralay-impression-acoustic-img',
      url: '/images/products/vinyl/taralay-impression-acoustic/collection.jpg',
      alt: 'Taralay Impression Acoustic',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Taralay Impression Acoustic' },
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'colors', label: 'Broj boja', value: '96' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/taralay-impression-acoustic',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-16',
    name: 'Gerflor Taralay Impression Compact',
    slug: 'gerflor-taralay-impression-compact',
    sku: 'GER-TARALAYIMPRESSIONCOMPACT',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Taralay Impression Compact - Heterogeni vinil podovi',
    description: 'Gerflor Taralay Impression Compact kolekcija sadrži 95 boja.',
    images: [{
      id: 'gerflor-taralay-impression-compact-img',
      url: '/images/products/vinyl/taralay-impression-compact/collection.jpg',
      alt: 'Taralay Impression Compact',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Taralay Impression Compact' },
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'colors', label: 'Broj boja', value: '95' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/taralay-impression-compact',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-17',
    name: 'Gerflor Taralay Impression Hop Acoustic',
    slug: 'gerflor-taralay-impression-hop-acoustic',
    sku: 'GER-TARALAYIMPRESSIONHOPACOUSTIC',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Taralay Impression Hop Acoustic - Heterogeni vinil podovi',
    description: 'Gerflor Taralay Impression Hop Acoustic kolekcija sadrži 30 boja.',
    images: [{
      id: 'gerflor-taralay-impression-hop-acoustic-img',
      url: '/images/products/vinyl/taralay-impression-hop-acoustic/collection.jpg',
      alt: 'Taralay Impression Hop Acoustic',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Taralay Impression Hop Acoustic' },
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'colors', label: 'Broj boja', value: '30' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/taralay-impression-hop-acoustic',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-18',
    name: 'Gerflor Taralay Impression Hop Compact',
    slug: 'gerflor-taralay-impression-hop-compact',
    sku: 'GER-TARALAYIMPRESSIONHOPCOMPACT',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Taralay Impression Hop Compact - Heterogeni vinil podovi',
    description: 'Gerflor Taralay Impression Hop Compact kolekcija sadrži 29 boja.',
    images: [{
      id: 'gerflor-taralay-impression-hop-compact-img',
      url: '/images/products/vinyl/taralay-impression-hop-compact/collection.jpg',
      alt: 'Taralay Impression Hop Compact',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Taralay Impression Hop Compact' },
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'colors', label: 'Broj boja', value: '29' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/taralay-impression-hop-compact',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-19',
    name: 'Gerflor Taralay Initial Acoustic',
    slug: 'gerflor-taralay-initial-acoustic',
    sku: 'GER-TARALAYINITIALACOUSTIC',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Taralay Initial Acoustic - Heterogeni vinil podovi',
    description: 'Gerflor Taralay Initial Acoustic kolekcija sadrži 49 boja.',
    images: [{
      id: 'gerflor-taralay-initial-acoustic-img',
      url: '/images/products/vinyl/taralay-initial-acoustic/collection.jpg',
      alt: 'Taralay Initial Acoustic',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Taralay Initial Acoustic' },
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'colors', label: 'Broj boja', value: '49' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/taralay-initial-acoustic',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-20',
    name: 'Gerflor Taralay Initial Compact',
    slug: 'gerflor-taralay-initial-compact',
    sku: 'GER-TARALAYINITIALCOMPACT',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Taralay Initial Compact - Heterogeni vinil podovi',
    description: 'Gerflor Taralay Initial Compact kolekcija sadrži 49 boja.',
    images: [{
      id: 'gerflor-taralay-initial-compact-img',
      url: '/images/products/vinyl/taralay-initial-compact/collection.jpg',
      alt: 'Taralay Initial Compact',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Taralay Initial Compact' },
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'colors', label: 'Broj boja', value: '49' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/taralay-initial-compact',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-21',
    name: 'Gerflor Taralay Millenium Acoustic Order',
    slug: 'gerflor-taralay-millenium-acoustic-order',
    sku: 'GER-TARALAYMILL ENIUMACOUSTICORDER',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Taralay Millenium Acoustic Order - Heterogeni vinil podovi',
    description: 'Gerflor Taralay Millenium Acoustic Order kolekcija sadrži 32 boja.',
    images: [{
      id: 'gerflor-taralay-millenium-acoustic-order-img',
      url: '/images/products/vinyl/taralay-millenium-acoustic-order/collection.jpg',
      alt: 'Taralay Millenium Acoustic Order',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Taralay Millenium Acoustic Order' },
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'colors', label: 'Broj boja', value: '32' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/taralay-millenium-acoustic-order',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vinil-collection-22',
    name: 'Gerflor Taralay Millenium Compact',
    slug: 'gerflor-taralay-millenium-compact',
    sku: 'GER-TARALAYMILL ENIUMCOMPACT',
    categoryId: '2',
    brandId: '6',
    shortDescription: 'Taralay Millenium Compact - Heterogeni vinil podovi',
    description: 'Gerflor Taralay Millenium Compact kolekcija sadrži 32 boja.',
    images: [{
      id: 'gerflor-taralay-millenium-compact-img',
      url: '/images/products/vinyl/taralay-millenium-compact/collection.jpg',
      alt: 'Taralay Millenium Compact',
      isPrimary: true,
      order: 1,
    }],
    specs: [
      { key: 'collection', label: 'Kolekcija', value: 'Taralay Millenium Compact' },
      { key: 'type', label: 'Tip', value: 'Heterogeni' },
      { key: 'colors', label: 'Broj boja', value: '32' },
    ],
    inStock: true,
    featured: false,
    externalLink: 'https://www.gerflor-cee.com/products/taralay-millenium-compact',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
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
