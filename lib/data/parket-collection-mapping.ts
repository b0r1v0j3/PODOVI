/**
 * Mapiranje parket varijanti (boja/dezena) na Tarkett kolekcije.
 * Izvor: https://www.tarkett.rs/sr_RS/kategorija-rs_C01012-parket
 * - Rumba: 3-strip hrast (npr. Oak Copper, Chocolate, Cocoa)
 * - Tango: 1-strip hrast
 * - Tango Classic: klasične nijanse (Almond, Sepia, Sienna, Cottage, Bright, Copper - bez strip)
 * - Salsa: 2-strip hrast
 * - Salsa Premium: premium 3-strip (Jasper, Moonstone, White Lightning)
 * - Step XL & L: Baron, Sienna 3-strip
 * - Privilege: luksuzne nijanse (Royal, Misty, Essence, Vivid, Soft Beige, Bronze, Espresso, Golden, Original, Polar)
 * - Allegro: Elegant 3-strip (nijanse siene do svetlih – kao na Tarkett Allegro)
 */

const COLLECTION_ALLEGRO = 'Allegro';
const COLLECTION_RUMBA = 'Rumba';
const COLLECTION_TANGO = 'Tango';
const COLLECTION_TANGO_CLASSIC = 'Tango Classic';
const COLLECTION_SALSA = 'Salsa';
const COLLECTION_SALSA_PREMIUM = 'Salsa Premium';
const COLLECTION_STEP = 'Step XL & L';
const COLLECTION_PRIVILEGE = 'Privilege';

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

  // Step XL & L: Baron, Sienna 3-strip
  if (s.includes('baron')) return COLLECTION_STEP;
  if (s === 'hrast-sienna-3-strip') return COLLECTION_STEP;

  // Salsa Premium: premium 3-strip dezeni
  if (s.includes('jasper') && s.includes('3-strip')) return COLLECTION_SALSA_PREMIUM;
  if (s.includes('moonstone') && s.includes('3-strip')) return COLLECTION_SALSA_PREMIUM;
  if (s.includes('white-lightning')) return COLLECTION_SALSA_PREMIUM;

  // 2-strip → Salsa
  if (s.includes('2-strip')) return COLLECTION_SALSA;

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

  // Privilege: luksuzne nijanse (bez strip)
  const privilegeSlugs = [
    'hrast-royal-antique-white',
    'hrast-royal-grey',
    'hrast-vivid',
    'hrast-essence',
    'hrast-misty-brown',
    'hrast-misty-grey',
    'hrast-soft-beige',
    'hrast-bronze',
    'hrast-espresso',
    'hrast-golden',
    'hrast-original',
    'hrast-polar',
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
