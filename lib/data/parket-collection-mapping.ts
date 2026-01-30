/**
 * Mapiranje parket varijanti (boja/dezena) na Tarkett kolekcije.
 * Izvor: https://www.tarkett.rs/sr_RS/kategorija-rs_C01012-parket
 * - Rumba: 3-strip hrast (npr. Oak Copper, Chocolate, Cocoa)
 * - Tango: 7 dezena 1-strip (Antique White, Bourbon, Copper, Cumin, Mocha, Premium, Schwarzwald)
 * - Tango Classic: klasične nijanse (Almond, Sepia, Sienna, Cottage, Bright, Copper - bez strip)
 * - Salsa: 2-strip hrast
 * - Salsa Premium: premium 3-strip (Jasper, Moonstone, White Lightning)
 * - Step XL & L: 7 boja (Baron Brown/Sienna, Royal Antique White/Grey, Copper 1 Strip, Premium 1 Strip, Vivid)
 * - Privilege: luksuzne nijanse (Royal, Misty, Essence, Vivid, Soft Beige, Bronze, Espresso, Golden, Original, Polar)
 * - Allegro: Elegant 3-strip (nijanse siene do svetlih – kao na Tarkett Allegro)
 */

const COLLECTION_ALLEGRO = 'Allegro';
const COLLECTION_RUMBA = 'Rumba';
const COLLECTION_TANGO = 'Tango';
const COLLECTION_TANGO_CLASSIC = 'Tango Classic';
const COLLECTION_SALSA = 'Salsa';
const COLLECTION_SALSA_ART = 'Salsa Art';
const COLLECTION_SALSA_PREMIUM = 'Salsa Premium';
const COLLECTION_STEP = 'Step XL & L';
const COLLECTION_PRIVILEGE = 'Privilege';
const COLLECTION_PRIVILEGE_WALTZ = 'Privilege Waltz';
const COLLECTION_SOMMER_EUROPARQUET = 'Sommer Europarquet';

/** Kolekcije koje su "header" proizvodi (SKU počinje sa PARKET-). */
export const PARKET_HEADER_COLLECTIONS = [
  'Allegro',
  'Privilege',
  'Privilege Waltz',
  'Rumba',
  'Salsa',
  'Salsa Art',
  'Salsa Premium',
  'Sommer Europarquet',
  'Step XL & L',
  'Tango',
  'Tango Classic',
] as const;

/**
 * Vraća stvarnu kolekciju za parket varijantu (slug ili sku).
 * Za proizvode koji u specu imaju collection: "Parket" (kategorija), ovo vraća pravu kolekciju.
 */
export function getParketCollectionBySlug(slug: string): string | null {
  if (!slug || typeof slug !== 'string') return null;
  const s = slug.toLowerCase();

  // Allegro: Elegant 3-strip (siena do svetlih nijansi)
  if (s.includes('elegant') && s.includes('3-strip')) return COLLECTION_ALLEGRO;
  if (s === 'hrast-essence-2-strip') return COLLECTION_ALLEGRO;
  if (s === 'hrast-sand-ro-2-strip') return COLLECTION_ALLEGRO;
  if (s === 'hrast-sienna-ro-2-strip') return COLLECTION_ALLEGRO;

  // Privilege: 11 dezena (Galloni Oak, Nobile Oak Select, Prestige Oak…)
  const privilegeSlugList = PARKET_COLLECTION_VARIANT_SLUGS[COLLECTION_PRIVILEGE] ?? [];
  if (privilegeSlugList.includes(s)) return COLLECTION_PRIVILEGE;

  // Step XL & L: 7 boja (Baron Brown/Sienna, Royal Antique White/Grey, Copper 1 Strip, Premium 1 Strip, Vivid)
  const stepSlugList = PARKET_COLLECTION_VARIANT_SLUGS[COLLECTION_STEP] ?? [];
  if (stepSlugList.includes(s)) return COLLECTION_STEP;

  // Salsa Art: 3 dezena (Hrast White Lightning, Jasen Ivory Dreams, Jasen White Canvas)
  const salsaArtSlugList = PARKET_COLLECTION_VARIANT_SLUGS[COLLECTION_SALSA_ART] ?? [];
  if (salsaArtSlugList.includes(s)) return COLLECTION_SALSA_ART;

  // Salsa Premium: 2 dezena (Hrast Jasper, Hrast Moonstone)
  const salsaPremiumSlugList = PARKET_COLLECTION_VARIANT_SLUGS[COLLECTION_SALSA_PREMIUM] ?? [];
  if (salsaPremiumSlugList.includes(s)) return COLLECTION_SALSA_PREMIUM;

  // Salsa: 18 dezena (Hrast Chocolate, Cocoa, Copper Original, Cotton, Elegant High Gloss/Matt/Shiny, Iceberg, Linen, Nordic Elegant, Original High Gloss/Matt/Shiny, Robust White, Sienna, Supreme Matt, Vivid, Jasen Silky White)
  const salsaSlugList = PARKET_COLLECTION_VARIANT_SLUGS[COLLECTION_SALSA] ?? [];
  if (salsaSlugList.includes(s)) return COLLECTION_SALSA;

  // 2-strip → Salsa (ostale 2-strip kolekcije)
  if (s.includes('2-strip')) return COLLECTION_SALSA;

  // Rumba: 6 dezena (Hrast Copper, Forest, Lava, Monsoon, Premium, Snow 1 Strip)
  const rumbaSlugList = PARKET_COLLECTION_VARIANT_SLUGS[COLLECTION_RUMBA] ?? [];
  if (rumbaSlugList.includes(s)) return COLLECTION_RUMBA;

  // 1-strip → Tango
  if (s.includes('1-strip')) return COLLECTION_TANGO;

  // Tango Classic: 6 nijansi bez strip (klasičan izbor)
  const tangoClassicSlugs = [
    'hrast-almond',
    'hrast-bright',
    'hrast-copper',
    'hrast-cottage',
    'hrast-sepia',
    'hrast-sienna',
  ];
  if (tangoClassicSlugs.some((t) => s === t || s.startsWith(t + '-'))) return COLLECTION_TANGO_CLASSIC;

  // Privilege Waltz: 5 dezena (Hrast Essence, Misty Brown/Grey, Soft Brown 1 Strip, Soft Beige)
  const privilegeWaltzSlugList = PARKET_COLLECTION_VARIANT_SLUGS[COLLECTION_PRIVILEGE_WALTZ] ?? [];
  if (privilegeWaltzSlugList.includes(s)) return COLLECTION_PRIVILEGE_WALTZ;

  // Sommer Europarquet: 5 dekora (Hrast Bronze, Espresso, Golden, Original, Polar)
  const sommerEuroparquetSlugList = PARKET_COLLECTION_VARIANT_SLUGS[COLLECTION_SOMMER_EUROPARQUET] ?? [];
  if (sommerEuroparquetSlugList.includes(s)) return COLLECTION_SOMMER_EUROPARQUET;

  // Salsa Art: White Canvas, Black Canvas itd. (3-strip sa canvas u nazivu)
  if (s.includes('white-canvas') && s.includes('3-strip')) return COLLECTION_SALSA_ART;
  if (s.includes('black-canvas') && s.includes('3-strip')) return COLLECTION_SALSA_ART;
  if (s === 'jasen-white-canvas-3-strip') return COLLECTION_SALSA_ART;

  // Privilege: luksuzne nijanse (Royal, Vivid – bez Waltz / Europarquet)
  const privilegeSlugs = [
    'hrast-royal-antique-white',
    'hrast-royal-grey',
  ];
  if (privilegeSlugs.some((p) => s === p)) return COLLECTION_PRIVILEGE;

  // 3-strip (ostalo) → Rumba
  if (s.includes('3-strip')) return COLLECTION_RUMBA;

  return null;
}

/**
 * Za parket proizvod vraća efektivnu vrednost kolekcije (za prikaz i filter).
 * Ako je u specu "Parket" (kategorija), koristi mapiranje po slug-u.
 */
export function getEffectiveParketCollection(
  slug: string,
  specCollectionValue: string | undefined
): string {
  if (specCollectionValue && specCollectionValue !== 'Parket') return specCollectionValue;
  return getParketCollectionBySlug(slug) || specCollectionValue || '';
}

/** Mapiranje imena kolekcije na slug (za URL /proizvodi/{slug} kao LVT). */
const PARKET_COLLECTION_NAME_TO_SLUG: Record<string, string> = {
  [COLLECTION_ALLEGRO]: 'allegro',
  [COLLECTION_PRIVILEGE]: 'privilege',
  [COLLECTION_PRIVILEGE_WALTZ]: 'privilege-waltz',
  [COLLECTION_RUMBA]: 'rumba',
  [COLLECTION_SALSA]: 'salsa',
  [COLLECTION_SALSA_ART]: 'salsa-art',
  [COLLECTION_SALSA_PREMIUM]: 'salsa-premium',
  [COLLECTION_SOMMER_EUROPARQUET]: 'sommer-europarquet',
  [COLLECTION_STEP]: 'step-xl-and-l',
  [COLLECTION_TANGO]: 'tango',
  [COLLECTION_TANGO_CLASSIC]: 'tango-classic',
};

export function getParketCollectionSlug(collectionName: string): string | null {
  if (!collectionName || typeof collectionName !== 'string') return null;
  return PARKET_COLLECTION_NAME_TO_SLUG[collectionName] ?? null;
}

/** Za slug kolekcije (npr. 'rumba') vraća ime kolekcije ('Rumba'). Za prikaz boja na stranici proizvoda. */
export function getParketCollectionNameBySlug(collectionSlug: string): string | null {
  if (!collectionSlug || typeof collectionSlug !== 'string') return null;
  const s = collectionSlug.toLowerCase();
  const entry = (Object.entries(PARKET_COLLECTION_NAME_TO_SLUG) as [string, string][]).find(([, slug]) => slug === s);
  return entry ? entry[0] : null;
}

/**
 * Eksplicitna lista slugova varijanti po kolekciji (kao na Tarkett.rs).
 * Koristi se za prikaz boja na stranici kolekcije i za redirect nevažećeg ?color=.
 */
const PARKET_COLLECTION_VARIANT_SLUGS: Record<string, string[]> = {
  [COLLECTION_ALLEGRO]: ['hrast-essence-2-strip', 'hrast-sand-ro-2-strip', 'hrast-sienna-ro-2-strip'],
  [COLLECTION_PRIVILEGE]: [
    'galloni-oak',
    'galloni-oak-brown-grey',
    'galloni-oak-royal-grey',
    'hrast-galloni-oak-white-1-strip',
    'hrast-nobile-oak-select-1-strip',
    'hrast-nobile-oak-select-white-1-strip',
    'prestige-oak-antique',
    'prestige-oak-brown-grey',
    'prestige-oak-royal-grey',
    'prestige-oak-white',
    'privilege-prestige-oak',
  ],
  [COLLECTION_STEP]: [
    'hrast-baron-brown',
    'hrast-baron-sienna',
    'hrast-royal-antique-white',
    'hrast-royal-grey',
    'hrast-copper-1-strip',
    'hrast-premium-1-strip',
    'hrast-vivid',
  ],
  [COLLECTION_PRIVILEGE_WALTZ]: [
    'hrast-essence',
    'hrast-misty-brown',
    'hrast-misty-grey',
    'hrast-soft-brown-1-strip',
    'hrast-soft-beige',
  ],
  [COLLECTION_RUMBA]: [
    'hrast-forest-1-strip',
    'hrast-lava-1-strip',
    'hrast-monsoon-1-strip',
    'hrast-snow-1-strip',
  ],
  [COLLECTION_SALSA_ART]: [
    'hrast-white-lightning-3-strip',
    'jasen-ivory-dreams-3-strip',
    'jasen-white-canvas-3-strip',
  ],
  [COLLECTION_SALSA_PREMIUM]: ['hrast-jasper-3-strip', 'hrast-moonstone-3-strip'],
  [COLLECTION_SALSA]: [
    'hrast-chocolate-3-strip',
    'hrast-cocoa-3-strip',
    'hrast-copper-original-3-strip',
    'hrast-cotton-3-strip',
    'hrast-elegant-high-gloss-3-strip',
    'hrast-elegant-matt-3-strip',
    'hrast-elegant-shiny-3-strip',
    'hrast-iceberg-3-strip',
    'hrast-linen-3-strip',
    'hrast-nordic-elegant-3-strip',
    'hrast-original-high-gloss-3-strip',
    'hrast-original-matt-3-strip',
    'hrast-original-shiny-3-strip',
    'hrast-robust-white-3-strip',
    'hrast-sienna-3-strip',
    'hrast-supreme-matt-3-strip',
    'hrast-vivid-3-strip',
    'jasen-silky-white-3-strip',
  ],
  [COLLECTION_SOMMER_EUROPARQUET]: [
    'hrast-bronze',
    'hrast-espresso',
    'hrast-golden',
    'hrast-original',
    'hrast-polar',
  ],
  [COLLECTION_TANGO]: [
    'hrast-antique-white-1-strip',
    'hrast-bourbon-1-strip',
    'tango-hrast-copper-1-strip',
    'hrast-cumin-1-strip',
    'hrast-mocha-1-strip',
    'tango-hrast-premium-1-strip',
    'hrast-schwarzwald-1-strip',
  ],
};

export function getParketCollectionVariantSlugs(collectionName: string): string[] {
  if (!collectionName || typeof collectionName !== 'string') return [];
  return PARKET_COLLECTION_VARIANT_SLUGS[collectionName] ?? [];
}
