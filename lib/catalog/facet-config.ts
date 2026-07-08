import { specKeyFromLabel } from '@/lib/catalog/spec-normalize';

/**
 * FILTERI 2.0 — Faza 1b: deklarativna konfiguracija novih filter grupa po kategoriji.
 *
 * Modul je deljiv server+klijent (bez Node API-ja): koristi ga
 * app/kategorije/[slug]/page.tsx (filtriranje + brojači + čipovi),
 * components/ProductFilters.tsx (render grupa + sanitizacija URL vrednosti) i
 * components/CategoryTabs.tsx (klijentsko filtriranje JSON boja u tabu „Boje").
 *
 * Kanonske mape vrednosti su izvedene iz izmerenih distribucija sirovih spec
 * vrednosti u katalogu (vinyl_colors_complete, tarkett_*_vinyl, wolflor,
 * alpod_floor_collections, tarkett_lvt_products, tarkett_wood_collection_index,
 * techem_mats) — sirova vrednost → kanonska, multi-value split (CSV i '/'),
 * nekonzistentne kapitalizacije se peglaju lowercase lookup-om.
 */

export interface FacetSpecLike {
  key: string;
  label?: string;
  value: string;
}

export interface FacetProductLike {
  name?: string | null;
  slug?: string | null;
  sku?: string | null;
  brandId?: string | null;
  specs?: FacetSpecLike[];
}

/** null = vrednost je poznato đubre/nebitna i namerno se odbacuje iz filtera. */
export type FacetCanonicalMapping = string | string[] | null;

export interface CategoryFacetDef {
  /** URL parametar (?klasa=, ?dezen=...). */
  param: string;
  /** Naslov grupe u panelu filtera. */
  label: string;
  /**
   * Kanonski spec ključevi iz kojih se čita vrednost. Poređenje ide i preko
   * spec.key i preko specKeyFromLabel(spec.label) — klijentski tab „Boje"
   * (CategoryTabs) gradi ključeve iz labela BEZ skidanja dijakritika
   * („Način montaže" → 'na_in_monta_e'), pa je labela jedini pouzdan most.
   */
  specKeys: string[];
  /** Sirova vrednost (lowercase) → kanonska vrednost / niz / null (odbaci). */
  canonicalMap?: Record<string, FacetCanonicalMapping>;
  /** Parser koji zamenjuje canonicalMap+split (klase upotrebe, R-klase, LVT format). */
  parse?: (raw: string) => string[];
  /** Kanonska vrednost → prikazna labela opcije („33" → „33 · lokal"). */
  translate?: Record<string, string>;
  /** Čip aktivnog filtera = chipPrefix + vrednost („Klasa " + „33"). */
  chipPrefix?: string;
  /** Grupa je sklopljena po defaultu (hairline naslov sa +/−). */
  collapsed?: boolean;
  /** Boolean grupa (jedan checkbox, URL vrednost '1'); poklapa kanonsko 'Da'. */
  boolean?: boolean;
  /** Fiksni redosled opcija; vrednosti van liste idu na kraj (sr-Latn sort). */
  order?: string[];
}

export type FacetMissingPolicy = 'exclude' | 'include';

export type FacetSelections = Record<string, string[]>;

export type FacetInheritanceMap = Map<string, Set<string>>;

export type FacetInheritanceMaps = Record<string, FacetInheritanceMap>;

// ===== Parseri =====

/**
 * Klase upotrebe (EN 685 / ISO 10874): iz bilo kog sirovog oblika izvuci
 * poznate klase 21–23 / 31–34 / 41–43.
 * "Klasa 34/43" → ['34','43']; "34 Very Heavy" → ['34']; "23-31" → ['23','31'];
 * "31, 33, 32, 34" → sve četiri; "22 / 22+ Domestic general..." → ['22'].
 */
export function parseUsageClasses(raw: string): string[] {
  const matches = raw.match(/\b(2[123]|3[1-4]|4[123])\b/g) || [];
  return Array.from(new Set(matches));
}

/** R-klase protivkliznosti: "R10, R9, R11" → ['R10','R9','R11']; 'Klasa DS (µ ≥ 0,30)' i 'LROS' se odbacuju. */
export function parseRClasses(raw: string): string[] {
  const matches = raw.toUpperCase().match(/\bR\s?(9|1[0-3])\b/g) || [];
  return Array.from(new Set(matches.map((token) => token.replace(/\s+/g, ''))));
}

function stripDiacritics(value: string): string {
  return value.normalize('NFKD').replace(/[̀-ͯ]/g, '');
}

/**
 * LVT format → Daska / Ploča. Gerflor 'XL' (bez reči daska/tile) je XL daska;
 * 'Daske i ploče' nosi obe vrednosti; 'Šestougaonik'/'Tile'/'Kvadratna pločica' su Ploča.
 */
export function parseLvtFormat(raw: string): string[] {
  const normalized = stripDiacritics(raw.toLowerCase());
  const out: string[] = [];
  const isPlank = /(daska|daske|plank|planke)/.test(normalized);
  const isTile = /(ploc|tile|kvadratna|pravougaona|rectangular|sestougao|hexagon)/.test(normalized);
  if (isPlank) out.push('Daska');
  if (isTile) out.push('Ploča');
  if (!isPlank && !isTile && /^xl\b/.test(normalized)) out.push('Daska');
  return out;
}

// ===== Definicije po kategorijama =====

const KLASA_TRANSLATE: Record<string, string> = {
  '21': '21 · stan',
  '22': '22 · stan',
  '23': '23 · stan',
  '31': '31 · lokal',
  '32': '32 · lokal',
  '33': '33 · lokal',
  '34': '34 · jak promet',
  '41': '41 · industrija',
  '42': '42 · industrija',
  '43': '43 · industrija',
};

const KLASA_ORDER = ['21', '22', '23', '31', '32', '33', '34', '41', '42', '43'];

const TON_MAP: Record<string, FacetCanonicalMapping> = {
  svetla: 'Svetla',
  srednja: 'Srednja',
  tamna: 'Tamna',
  // 'Beljeni' je obrada a ne nijansa, ali UI nema tagove — ostaje četvrta vrednost (mapa vrednosti, alternativa B).
  beljeni: 'Beljeni',
};

const GREJANJE_MAP: Record<string, FacetCanonicalMapping> = {
  primeren: 'Da',
  'da (maksimum 27°c)': 'Da',
  'suitable (maximum 29°c)': 'Da',
  da: 'Da',
  neprimeren: 'Ne',
  ne: 'Ne',
};

const vinilKlasa: CategoryFacetDef = {
  param: 'klasa',
  label: 'Klasa upotrebe',
  specKeys: [
    'klasa_upotrebe',
    'komercijalna_klasifikacija',
    'industrijska_klasifikacija',
    'rezidencijalna_klasifikacija',
    'european_classification_commercial',
    'european_classification_light_industrial',
  ],
  parse: parseUsageClasses,
  translate: KLASA_TRANSLATE,
  chipPrefix: 'Klasa ',
  order: KLASA_ORDER,
};

const vinilDezen: CategoryFacetDef = {
  param: 'dezen',
  label: 'Dezen',
  specKeys: ['dekor_vrsta_drveta', 'wood_type', 'tip_dezena', 'dizajn'],
  canonicalMap: {
    hrast: 'Drvo',
    orah: 'Drvo',
    bor: 'Drvo',
    drvo: 'Drvo',
    'moderno drvo': 'Drvo',
    'vintage wood': 'Drvo',
    'drveni dekor': 'Drvo',
    kamen: 'Kamen',
    stone: 'Kamen',
    mineral: 'Kamen',
    terazzo: 'Kamen',
    marmor: 'Kamen',
    mermer: 'Kamen',
    beton: 'Beton',
    concrete: 'Beton',
    ceramic: 'Keramika',
    keramika: 'Keramika',
    grafički: 'Grafički',
    sveobuhvatni: 'Uni', // loš prevod za 'uni/all-over' u izvoru — kanonizujemo u Uni
    uni: 'Uni',
    drugo: null,
  },
  order: ['Drvo', 'Kamen', 'Beton', 'Keramika', 'Grafički', 'Uni'],
};

const vinilTon: CategoryFacetDef = {
  param: 'ton',
  label: 'Ton',
  specKeys: ['nijansa'],
  canonicalMap: TON_MAP,
  order: ['Svetla', 'Srednja', 'Tamna', 'Beljeni'],
};

const vinilUgradnja: CategoryFacetDef = {
  param: 'ugradnja',
  label: 'Ugradnja',
  specKeys: ['nacin_montaze', 'vrsta_spoja', 'nacin_ugradnje', 'tip_instalacije', 'ugradnja'],
  canonicalMap: {
    klik: 'Klik',
    lepljenje: 'Lepljenje',
    'lepak dole': 'Lepljenje',
    'plivajući': 'Plivajuće',
    'plivajuća ugradnja': 'Plivajuće',
    'lepljenje/plivajuća ugradnja': ['Lepljenje', 'Plivajuće'],
    samolepljiv: 'Samolepljivo',
    samolepljivo: 'Samolepljivo',
    'loose-lay': 'Loose-lay',
    looselay: 'Loose-lay',
    'looselay sa lepkom': 'Loose-lay',
    'bez lepka (gripman podloga)': 'Loose-lay',
    bez: null, // vrsta_spoja 'Bez' nije način ugradnje — nacin_montaze nosi pravu vrednost
  },
  order: ['Klik', 'Lepljenje', 'Plivajuće', 'Loose-lay', 'Samolepljivo'],
};

const vinilMaterijal: CategoryFacetDef = {
  param: 'materijal',
  label: 'Materijal',
  specKeys: ['vrsta_materijala'],
  canonicalMap: {
    'spc vinil': 'SPC',
    'lvt vinil': 'LVT',
    'wpc vinil': 'WPC',
    spc: 'SPC',
    lvt: 'LVT',
    wpc: 'WPC',
  },
  order: ['SPC', 'LVT', 'WPC'],
};

const vinilRKlasa: CategoryFacetDef = {
  param: 'rklasa',
  label: 'R-klasa (protivkliznost)',
  specKeys: ['klasa_protivkliznosti', 'otpornost_na_klizanje', 'otpornost_na_klizanje_din_51130'],
  parse: parseRClasses,
  collapsed: true,
  order: ['R9', 'R10', 'R11', 'R12', 'R13'],
};

const grejanjeFacet: CategoryFacetDef = {
  param: 'grejanje',
  label: 'Podno grejanje',
  specKeys: ['podno_grejanje', 'underfloor_heating'],
  canonicalMap: GREJANJE_MAP,
  // translate.Da = tekst uz checkbox u UI-ju (čip ostaje def.label)
  translate: { Da: 'Pogodno za podno grejanje' },
  collapsed: true,
  boolean: true,
};

const parketTon: CategoryFacetDef = { ...vinilTon };

const parketUzorak: CategoryFacetDef = {
  param: 'uzorak',
  label: 'Uzorak polaganja',
  specKeys: ['uzorak_polaganja'],
  canonicalMap: {
    'klasično': 'Klasično',
    'riblja kost': 'Riblja kost',
    chevron: 'Chevron',
  },
  order: ['Klasično', 'Riblja kost', 'Chevron'],
};

const parketObrada: CategoryFacetDef = {
  param: 'obrada',
  label: 'Završna obrada',
  specKeys: ['povrsinska_zastita', 'surface_treatment', 'povrsinski_tretman'],
  canonicalMap: {
    lakiran: 'Lak',
    lak: 'Lak',
    'proteco lak': 'Lak',
    'classic lak': 'Lak',
    'mat lakiran': 'Mat lak',
    'proteco natura': 'Mat lak',
    uljen: 'Ulje',
    'uv uljen': 'Ulje',
    'proteco hardwax ulje': 'Ulje',
    sirov: 'Sirov',
  },
  order: ['Mat lak', 'Lak', 'Ulje', 'Sirov'],
};

const parketUgradnja: CategoryFacetDef = {
  param: 'ugradnja',
  label: 'Ugradnja',
  specKeys: ['vrsta_spoja', 'locking_system', 'locking', 'sistem_zakljucavanja'],
  canonicalMap: {
    klik: 'Klik',
    't-lock': 'Klik',
    'pero+utor': 'Pero i utor',
    'utor-pero': 'Pero i utor',
    'pero i utor': 'Pero i utor',
  },
  order: ['Klik', 'Pero i utor'],
};

const lvtKlasa: CategoryFacetDef = {
  param: 'klasa',
  label: 'Klasa upotrebe',
  // Tarkett boje nose classification_commercial_iso_10874, Gerflor kolekcijski
  // headeri usage_class ('23-31'); boje bez svog spec-a nasleđuju vrednost
  // kolekcije preko inheritance mape (vezivanje kroz spec 'collection').
  specKeys: ['classification_commercial_iso_10874', 'usage_class', 'klasa_upotrebe'],
  parse: parseUsageClasses,
  translate: KLASA_TRANSLATE,
  chipPrefix: 'Klasa ',
  order: KLASA_ORDER,
};

const lvtUgradnja: CategoryFacetDef = {
  param: 'ugradnja',
  label: 'Ugradnja',
  // Dupli ključevi (installation + installation_method) i dupli rečnik
  // (srpski/engleski) — obe strane se slivaju u isti kanonski skup.
  specKeys: ['installation', 'installation_method', 'installation_system_covering'],
  canonicalMap: {
    lepljenje: 'Lepljenje',
    'glue down': 'Lepljenje',
    'glue-down': 'Lepljenje',
    klik: 'Klik',
    'click sistem': 'Klik',
    'interlocking system': 'Klik',
    'connect sistem': 'Klik',
    'loose-lay': 'Loose-lay',
    looselay: 'Loose-lay',
    'looselay sa lepkom': 'Loose-lay',
  },
  order: ['Lepljenje', 'Klik', 'Loose-lay'],
};

const lvtFormat: CategoryFacetDef = {
  param: 'format',
  label: 'Format',
  specKeys: ['format_type', 'format'],
  parse: parseLvtFormat,
  order: ['Daska', 'Ploča'],
};

const laminatKlasa: CategoryFacetDef = {
  param: 'klasa',
  label: 'Klasa',
  specKeys: ['abrasion_resistance_en_13329', 'commercial_class', 'classification_commercial_iso_10874'],
  canonicalMap: {
    ac3: 'AC3',
    ac4: 'AC4',
    ac5: 'AC5',
    '31 moderate': 'AC3',
    '32 general': 'AC4',
    '33 heavy': 'AC5',
    '23 teška': null, // rezidencijalna klasa — ne mapira se u AC skalu
  },
  translate: {
    AC3: 'AC3 · 31',
    AC4: 'AC4 · 32',
    AC5: 'AC5 · 33',
  },
  chipPrefix: 'Klasa ',
  order: ['AC3', 'AC4', 'AC5'],
};

const otiraciTip: CategoryFacetDef = {
  param: 'tip',
  label: 'Tip otirača',
  // Interni __ spec se NE prikazuje u spec tabeli, ali filter sme da ga čita.
  specKeys: ['__techem_top_category'],
  canonicalMap: {
    'aluminijumski otirači': 'Aluminijumski otirači',
    // Pod-linija aluminijumskih (Design) — spaja se u glavnu grupu.
    'anodizovani aluminijumski otirači – design': 'Aluminijumski otirači',
    'unutrašnji otirači': 'Unutrašnji otirači',
    // Engleski naziv proizvođačke linije, ne kategorija — ide u Unutrašnje.
    'trend mats': 'Unutrašnji otirači',
    'spoljašnji otirači': 'Spoljašnji otirači',
    'antifatig podloge': 'Antifatig podloge',
    'specijalne podloge': 'Specijalne podloge',
    'reklamni otirači': 'Reklamni otirači',
    'čelične rešetke': 'Čelične rešetke',
  },
};

const CATEGORY_FACETS: Record<string, CategoryFacetDef[]> = {
  vinil: [vinilKlasa, vinilDezen, vinilTon, vinilUgradnja, vinilMaterijal, vinilRKlasa, grejanjeFacet],
  parket: [parketTon, parketUzorak, parketObrada, parketUgradnja, grejanjeFacet],
  lvt: [lvtKlasa, lvtUgradnja, lvtFormat],
  laminat: [laminatKlasa],
  otiraci: [otiraciTip],
};

export function getFacetDefsForCategory(categorySlug: string): CategoryFacetDef[] {
  return CATEGORY_FACETS[categorySlug] || [];
}

// ===== Čitanje vrednosti sa proizvoda =====

// specKeyFromLabel radi NFKD normalizaciju — keširamo po labeli (mali, ograničen skup).
const labelKeyCache = new Map<string, string>();
function cachedSpecKeyFromLabel(label: string): string {
  let key = labelKeyCache.get(label);
  if (key === undefined) {
    key = specKeyFromLabel(label);
    labelKeyCache.set(label, key);
  }
  return key;
}

function lookupCanonical(def: CategoryFacetDef, token: string): FacetCanonicalMapping | undefined {
  if (!def.canonicalMap) return undefined;
  return def.canonicalMap[token.trim().toLowerCase()];
}

function appendMapping(out: string[], mapping: FacetCanonicalMapping): void {
  if (mapping === null) return;
  for (const value of Array.isArray(mapping) ? mapping : [mapping]) {
    if (!out.includes(value)) out.push(value);
  }
}

/**
 * Sirova spec vrednost → kanonske vrednosti.
 * Redosled: parser (ako postoji) → mapa za CELU vrednost → split po ',' i '/'
 * pa mapa po tokenu. Nemapirani tokeni se ODBACUJU (bolje bez opcije nego
 * đubre opcija tipa 'LROS' ili engleskih naziva dekora u filteru).
 */
export function canonicalizeFacetValue(raw: string, def: CategoryFacetDef): string[] {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return [];
  if (def.parse) return def.parse(trimmed);

  const out: string[] = [];
  const whole = lookupCanonical(def, trimmed);
  if (whole !== undefined) {
    appendMapping(out, whole);
    return out;
  }

  const tokens = trimmed.split(/\s*[,/]\s*/).map((token) => token.trim()).filter(Boolean);
  if (tokens.length <= 1) return [];
  for (const token of tokens) {
    const mapped = lookupCanonical(def, token);
    if (mapped !== undefined) appendMapping(out, mapped);
  }
  return out;
}

/** Kanonske vrednosti fasete direktno sa proizvoda (bez nasleđivanja). */
export function getFacetValues(product: FacetProductLike, def: CategoryFacetDef): string[] {
  const out: string[] = [];
  for (const spec of product.specs || []) {
    if (!spec || typeof spec.value !== 'string') continue;
    let matches = def.specKeys.includes(spec.key);
    if (!matches && spec.label) matches = def.specKeys.includes(cachedSpecKeyFromLabel(spec.label));
    if (!matches) continue;
    for (const value of canonicalizeFacetValue(spec.value, def)) {
      if (!out.includes(value)) out.push(value);
    }
  }
  return out;
}

// ===== Nasleđivanje boja ↔ kolekcija =====

/**
 * Normalizovan identitet kolekcije za vezivanje boja i headera:
 * lowercase + skidanje dijakritika + ne-alfanumerik→'-' + skidanje brend
 * prefiksa. 'Creation Saga²' → 'creation-saga2' (NFKD pretvara ² u 2), pa se
 * poklapa i sa slug oblikom 'creation-saga2' iz Gerflor JSON-a.
 */
export function normalizeCollectionKey(value: unknown): string | null {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return null;
  const cleaned = stripDiacritics(raw)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!cleaned) return null;
  return cleaned.replace(/^(gerflor|tarkett|wolflor|bloq|podovi)-/, '') || null;
}

function baseCollectionKeys(product: FacetProductLike): string[] {
  const keys = new Set<string>();
  for (const spec of product.specs || []) {
    if (spec?.key === 'collection' || spec?.key === 'collections') {
      const key = normalizeCollectionKey(spec.value);
      if (key) keys.add(key);
    }
  }
  const nameKey = normalizeCollectionKey(product.name);
  if (nameKey) keys.add(nameKey);
  const slugKey = normalizeCollectionKey(product.slug);
  if (slugKey) keys.add(slugKey);
  return Array.from(keys);
}

/**
 * Identitet kolekcije je BREND-skopiran kad proizvod nosi brandId: različiti
 * brendovi umeju da dele ime kolekcije (Wolflor „Aurora" vs Podovi „Aurora"),
 * pa bi golo ime pogrešno prelilo vrednosti preko granice brenda. Registracija
 * upisuje i goli ključ (za pozivaoce bez brandId), a lookup sa brandId čita
 * ISKLJUČIVO brend-skopirane ključeve.
 */
function collectionRegistrationKeys(product: FacetProductLike): string[] {
  const base = baseCollectionKeys(product);
  if (!product.brandId) return base;
  const scoped = base.map((key) => `${product.brandId}|${key}`);
  return [...scoped, ...base];
}

function collectionLookupKeys(product: FacetProductLike): string[] {
  const base = baseCollectionKeys(product);
  if (!product.brandId) return base;
  return base.map((key) => `${product.brandId}|${key}`);
}

/**
 * Mapa identitet-kolekcije → skup kanonskih vrednosti fasete, izgrađena nad
 * SVIM proizvodima kategorije. Nasleđivanje radi u oba smera: boja bez svog
 * spec-a dobija vrednost kolekcijskog headera, a header bez spec-a (npr. LVT
 * kolekcije nemaju klasu na sebi) dobija uniju vrednosti svojih boja.
 */
export function buildFacetInheritanceMap(products: FacetProductLike[], def: CategoryFacetDef): FacetInheritanceMap {
  const map: FacetInheritanceMap = new Map();
  for (const product of products) {
    const values = getFacetValues(product, def);
    if (values.length === 0) continue;
    for (const key of collectionRegistrationKeys(product)) {
      let set = map.get(key);
      if (!set) {
        set = new Set();
        map.set(key, set);
      }
      for (const value of values) set.add(value);
    }
  }
  return map;
}

export function buildFacetInheritanceMaps(products: FacetProductLike[], defs: CategoryFacetDef[]): FacetInheritanceMaps {
  const maps: FacetInheritanceMaps = {};
  for (const def of defs) {
    maps[def.param] = buildFacetInheritanceMap(products, def);
  }
  return maps;
}

/** Vrednosti fasete: sopstvene, a kad ih nema — nasleđene preko identiteta kolekcije. */
export function getProductFacetValues(
  product: FacetProductLike,
  def: CategoryFacetDef,
  inheritMap?: FacetInheritanceMap
): string[] {
  const own = getFacetValues(product, def);
  if (own.length > 0 || !inheritMap || inheritMap.size === 0) return own;
  const inherited = new Set<string>();
  for (const key of collectionLookupKeys(product)) {
    const values = inheritMap.get(key);
    if (values) values.forEach((value) => inherited.add(value));
  }
  return Array.from(inherited);
}

// ===== Poklapanje i selekcije =====

/**
 * Da li proizvod prolazi JEDNU grupu filtera (OR unutar grupe).
 * missing='exclude' (server listing): proizvod bez vrednosti se sakriva.
 * missing='include' (tab „Boje"): proizvod bez vrednosti OSTAJE vidljiv —
 * bolje lažno-uključena boja nego pogrešno sakrivena kad izvor nema podatak.
 */
export function productMatchesFacetDef(
  product: FacetProductLike,
  selected: string[],
  def: CategoryFacetDef,
  options?: { inheritMap?: FacetInheritanceMap; missing?: FacetMissingPolicy }
): boolean {
  if (!selected || selected.length === 0) return true;
  const values = getProductFacetValues(product, def, options?.inheritMap);
  if (values.length === 0) return (options?.missing ?? 'exclude') === 'include';
  if (def.boolean) return values.includes('Da');
  return selected.some((value) => values.includes(value));
}

/** Da li proizvod prolazi SVE aktivne nove grupe (AND između grupa). */
export function productMatchesFacetSelections(
  product: FacetProductLike,
  selections: FacetSelections,
  defs: CategoryFacetDef[],
  inheritMaps?: FacetInheritanceMaps,
  missing?: FacetMissingPolicy
): boolean {
  for (const def of defs) {
    const selected = selections[def.param];
    if (!selected || selected.length === 0) continue;
    if (!productMatchesFacetDef(product, selected, def, { inheritMap: inheritMaps?.[def.param], missing })) {
      return false;
    }
  }
  return true;
}

/** URL parametri → selekcije po grupi ('a,b' → ['a','b']; boolean prihvata samo '1'). */
export function parseFacetSelectionsFromParams(
  params: Record<string, string | undefined>,
  defs: CategoryFacetDef[]
): FacetSelections {
  const selections: FacetSelections = {};
  for (const def of defs) {
    const raw = params[def.param];
    if (!raw) continue;
    if (def.boolean) {
      if (raw === '1') selections[def.param] = ['1'];
      continue;
    }
    const values = raw.split(',').map((token) => token.trim()).filter(Boolean);
    if (values.length > 0) selections[def.param] = values;
  }
  return selections;
}

// ===== Opcije i labele =====

/** Sve kanonske vrednosti prisutne u skupu proizvoda (uključujući nasleđene). */
export function collectFacetOptionValues(
  products: FacetProductLike[],
  def: CategoryFacetDef,
  inheritMap?: FacetInheritanceMap
): string[] {
  const values = new Set<string>();
  for (const product of products) {
    for (const value of getProductFacetValues(product, def, inheritMap)) {
      values.add(value);
    }
  }
  return sortFacetValues(def, Array.from(values));
}

export function sortFacetValues(def: CategoryFacetDef, values: string[]): string[] {
  const order = def.order;
  return [...values].sort((a, b) => {
    if (order) {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      if (indexA !== -1 || indexB !== -1) {
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      }
    }
    return a.localeCompare(b, 'sr-Latn');
  });
}

/** Prikazna labela opcije („33" → „33 · lokal", „AC5" → „AC5 · 33"). */
export function facetOptionLabel(def: CategoryFacetDef, value: string): string {
  return def.translate?.[value] ?? value;
}

/** Labela čipa aktivnog filtera — ljudska vrednost („Klasa 33", „Riblja kost", „Podno grejanje"). */
export function facetChipLabel(def: CategoryFacetDef, value: string): string {
  if (def.boolean) return def.label;
  if (def.chipPrefix) return `${def.chipPrefix}${value}`;
  return value;
}
