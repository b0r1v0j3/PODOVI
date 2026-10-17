import type { Product, ProductImage, ProductSpec } from '@/types';
import {
  collectionLookupKeys,
  collectionRegistrationKeys,
  getFacetIntervals,
  getFacetValues,
  getHomeCategoryFacetDefs,
  getUniversalFacetDefs,
  sortFacetValues,
  type CategoryFacetDef,
} from '@/lib/catalog/facet-config';
import {
  COLLECTION_GROUP_PARAM,
  TYPE_GROUP_PARAM,
  homeGroupId,
  type HomeFacetSchemaEntry,
  type HomeGroupKind,
} from '@/lib/catalog/home-facet-schema';

export * from '@/lib/catalog/home-facet-schema';
import { getCanonicalProductHref } from '@/lib/utils/product-routes';
import { getProductImageCandidates, getProductSwatchCandidates } from '@/lib/utils/product-images';

/**
 * Serverski indeks kataloga za početnu stranu (spec 001-filteri-pocetna-brzina).
 *
 * Svaka stavka (kolekcija ili boja) dobija SAMO polja kartice + kanonske
 * vrednosti grupa filtera (fv) i numeričke intervale (nv), izračunate iz
 * stvarnih specifikacija uz nasleđivanje kolekcija↔boja nad celom kategorijom.
 * Pregledač tako ne dobija opise, dokumente ni pune galerije (≈5 MB → ≈0,7 MB),
 * a filtriranje na klijentu je čisto poređenje gotovih vrednosti.
 */

export type HomeCatalogItem = Product & {
  href: string;
  categorySlug: string;
  /** Kanonske vrednosti po grupi; odsutan ključ = proizvod nema podatak. */
  fv: Record<string, string[]>;
  /** Intervali po grupi, spljošteni [od1, do1, od2, do2…]. */
  nv: Record<string, number[]>;
  /** Znak za „Uporedi": specifikacije se dopunjuju preko /api/products. */
  compareSlim: true;
  swatchImages?: string[];
  collectionSlug?: string;
};

export const TYPE_FILTER_TITLES: Record<string, string> = {
  vinil: 'Tip vinila',
  linoleum: 'Tip linoleuma',
  lvt: 'Tip LVT-a',
  laminat: 'Tip laminata',
  parket: 'Tip parketa',
  deking: 'Tip dekinga',
  'tekstilne-ploce': 'Tip tekstilnih ploča',
  pribor: 'Vrsta pribora',
  lajsne: 'Vrsta lajsni i profila',
  otiraci: 'Vrsta otirača',
};

export const COLLECTION_FILTER_TITLES: Record<string, string> = {
  vinil: 'Kolekcije vinila',
  linoleum: 'Kolekcije linoleuma',
  lvt: 'Kolekcije LVT-a',
  laminat: 'Kolekcije laminata',
  parket: 'Kolekcije parketa',
  deking: 'Kolekcije dekinga',
  'tekstilne-ploce': 'Kolekcije tekstilnih ploča',
};

/** Engleski tipovi iz Tarkett/Gerflor izvora → srpski; ostale vrednosti se prikazuju kakve jesu. */
const PRODUCT_TYPE_TRANSLATE: Record<string, string> = {
  'wall base': 'Zidne lajsne',
  'transitions & profiles': 'Prelazni profili',
  'trims & mouldings': 'Završni profili',
  adhesives: 'Lepkovi',
  subflooring: 'Podloge',
  coving: 'Holkeri',
  'stair nosings': 'Stepenišni profili',
  stairs: 'Stepenišni profili',
  welding: 'Pribor za varenje',
  'care & cleaning': 'Nega i čišćenje',
  'tools & equipment': 'Pomoćni pribor',
  accessories: 'Pribor',
};

/**
 * Pribor bez spec-a tipa (legacy Tarkett lepkovi i traka): tip iz SAMOG naziva
 * proizvoda kad ga naziv eksplicitno kaže („Lepak za parket", „… Adhesive Tape").
 * Redosled je bitan: traka pre opšteg „lepak/adhesive".
 */
const TYPE_FROM_NAME: Record<string, Array<[RegExp, string]>> = {
  pribor: [
    [/\b(tape|traka)\b/, 'Pomoćni pribor'],
    [/lepak za parket|parquet adhesive/, 'Lepkovi za parket'],
    [/\b(lepak|lepkovi|adhesive|lepilo)\b/, 'Lepkovi za podove'],
  ],
};

function typeFromName(product: Product, categorySlug: string): string | null {
  const rules = TYPE_FROM_NAME[categorySlug];
  if (!rules) return null;
  const name = String(product.name || '').toLowerCase();
  for (const [pattern, label] of rules) {
    if (pattern.test(name)) return label;
  }
  return null;
}

const TYPE_SPEC_KEYS = ['type', 'tip', 'tip_proizvoda', 'vrsta_proizvoda'];
const COLLECTION_SPEC_KEYS = ['collection', 'kolekcija', 'brand_line', 'range'];

export function normalizeHomeOptionValue(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function firstSpecValue(product: Product, keys: string[]): string | null {
  for (const key of keys) {
    const spec = product.specs?.find((candidate) => candidate.key === key);
    const value = String(spec?.value || '').trim();
    if (value) return value;
  }
  return null;
}

function formatTypeLabel(categorySlug: string, raw: string): string | null {
  const normalized = normalizeHomeOptionValue(raw);
  if (categorySlug === 'vinil') {
    if (normalized.includes('heterog')) return 'Heterogeni';
    if (normalized.includes('homog')) return 'Homogeni';
    return null; // ostale vinil vrednosti nisu tip (istorijsko pravilo „Tip vinila")
  }
  return PRODUCT_TYPE_TRANSLATE[normalized] || raw.replace(/\s+/g, ' ').trim();
}

/** Tip proizvoda za kategorijsku grupu „Tip …" (null = nema podatak). */
export function getHomeTypeLabel(product: Product, categorySlug: string): string | null {
  const raw = firstSpecValue(product, TYPE_SPEC_KEYS);
  return raw ? formatTypeLabel(categorySlug, raw) : typeFromName(product, categorySlug);
}

/** Kolekcija za kategorijsku grupu „Kolekcije …" — isti izvor kao istorijski filter. */
export function getHomeCollectionLabel(product: Product): string | null {
  return (firstSpecValue(product, COLLECTION_SPEC_KEYS) || product.name || '').replace(/\s+/g, ' ').trim() || null;
}

interface CategoryFacetContext {
  categorySlug: string;
  listDefs: Array<{ id: string; def: CategoryFacetDef }>;
  rangeDefs: Array<{ id: string; def: CategoryFacetDef }>;
  listMaps: Map<string, Map<string, Set<string>>>;
  rangeMaps: Map<string, Map<string, Array<[number, number]>>>;
}

function defsForCategory(categorySlug: string) {
  const entries = [
    ...getUniversalFacetDefs().map((def) => ({ id: homeGroupId('all', def.param), def })),
    ...getHomeCategoryFacetDefs(categorySlug).map((def) => ({ id: homeGroupId(categorySlug, def.param), def })),
  ];
  return {
    listDefs: entries.filter((entry) => !entry.def.range),
    rangeDefs: entries.filter((entry) => Boolean(entry.def.range)),
  };
}

/**
 * Indeks jedne kategorije: mape nasleđivanja (identitet kolekcije → vrednosti)
 * nad SVIM proizvodima kategorije (kolekcije + boje), za liste i opsege.
 */
export function buildCategoryFacetContext(categorySlug: string, products: Product[]): CategoryFacetContext {
  const { listDefs, rangeDefs } = defsForCategory(categorySlug);
  const listMaps = new Map<string, Map<string, Set<string>>>();
  const rangeMaps = new Map<string, Map<string, Array<[number, number]>>>();

  for (const { id } of listDefs) listMaps.set(id, new Map());
  for (const { id } of rangeDefs) rangeMaps.set(id, new Map());

  for (const product of products) {
    const keys = collectionRegistrationKeys(product);
    if (keys.length === 0) continue;

    for (const { id, def } of listDefs) {
      const values = getFacetValues(product, def);
      if (values.length === 0) continue;
      const map = listMaps.get(id)!;
      for (const key of keys) {
        const set = map.get(key) || new Set<string>();
        values.forEach((value) => set.add(value));
        map.set(key, set);
      }
    }

    for (const { id, def } of rangeDefs) {
      if (def.range?.fromPrice) continue; // cena se ne nasleđuje (cena kolekcije ≠ cena boje)
      const intervals = getFacetIntervals(product, def);
      if (intervals.length === 0) continue;
      const map = rangeMaps.get(id)!;
      for (const key of keys) {
        const list = map.get(key) || [];
        for (const pair of intervals) {
          if (!list.some(([a, b]) => a === pair[0] && b === pair[1])) list.push(pair);
        }
        map.set(key, list);
      }
    }
  }

  return { categorySlug, listDefs, rangeDefs, listMaps, rangeMaps };
}

function inheritedList(product: Product, map: Map<string, Set<string>> | undefined): string[] {
  if (!map || map.size === 0) return [];
  const out = new Set<string>();
  for (const key of collectionLookupKeys(product)) {
    map.get(key)?.forEach((value) => out.add(value));
  }
  return Array.from(out);
}

function inheritedRange(product: Product, map: Map<string, Array<[number, number]>> | undefined): Array<[number, number]> {
  if (!map || map.size === 0) return [];
  const out: Array<[number, number]> = [];
  for (const key of collectionLookupKeys(product)) {
    for (const pair of map.get(key) || []) {
      if (!out.some(([a, b]) => a === pair[0] && b === pair[1])) out.push(pair);
    }
  }
  return out;
}

/** Kanonske vrednosti i intervali jedne stavke (sopstveni, inače nasleđeni). */
export function computeItemFacets(product: Product, context: CategoryFacetContext) {
  const fv: Record<string, string[]> = {};
  const nv: Record<string, number[]> = {};

  for (const { id, def } of context.listDefs) {
    let values = getFacetValues(product, def);
    if (values.length === 0) values = inheritedList(product, context.listMaps.get(id));
    if (values.length > 0) fv[id] = sortFacetValues(def, values);
  }

  for (const { id, def } of context.rangeDefs) {
    let intervals = getFacetIntervals(product, def);
    if (intervals.length === 0 && !def.range?.fromPrice) intervals = inheritedRange(product, context.rangeMaps.get(id));
    if (intervals.length > 0) nv[id] = intervals.flat();
  }

  const typeLabel = getHomeTypeLabel(product, context.categorySlug);
  if (typeLabel) fv[homeGroupId(context.categorySlug, TYPE_GROUP_PARAM)] = [normalizeHomeOptionValue(typeLabel)];

  const collectionLabel = getHomeCollectionLabel(product);
  if (collectionLabel) fv[homeGroupId(context.categorySlug, COLLECTION_GROUP_PARAM)] = [normalizeHomeOptionValue(collectionLabel)];

  return { fv, nv };
}

export type HomeItemKind = 'collection' | 'color';

/**
 * Već rešeni URL-ovi kartice (bez variants mape): kolekcija nosi 2 'card' kandidata
 * (drugi je rezervni ako prvi ne postoji), boja 1 'thumb' (kompaktna kartica).
 */
function slimImages(product: Product, kind: HomeItemKind): ProductImage[] {
  const surface = kind === 'color' ? 'thumb' : 'card';
  // Samo url (+ alt kad se razlikuje od naziva): kartica uzima prvu sliku kao glavnu,
  // a prazan alt pada na naziv proizvoda u getProductImageCandidates.
  return getProductImageCandidates(product, surface)
    .slice(0, kind === 'color' ? 1 : 2)
    .map((candidate) => (
      candidate.alt && candidate.alt !== product.name ? { url: candidate.url, alt: candidate.alt } : { url: candidate.url }
    ) as ProductImage);
}

function slimSpecs(product: Product): ProductSpec[] {
  const collection = product.specs?.find((spec) => spec.key === 'collection');
  return collection ? [{ key: 'collection', value: collection.value } as ProductSpec] : [];
}

/** Product → sažeta stavka kartice (bez opisa, dokumenata i punih specifikacija). */
export function toHomeCatalogItem(product: Product, context: CategoryFacetContext, kind: HomeItemKind = 'collection'): HomeCatalogItem {
  const { fv, nv } = computeItemFacets(product, context);
  const images = slimImages(product, kind);
  const swatchImages = getProductSwatchCandidates(product, 'thumb')
    .map((candidate) => candidate.url)
    .filter((url) => url !== images[0]?.url)
    .slice(0, 3);
  const withCollection = product as Product & { collectionSlug?: string };

  // Namerno BEZ opisa, dokumenata, sku-a, datuma i ostalih Product polja koja kartica
  // ne čita: svaki ključ se ponavlja ~1.100 puta u HTML-u početne strane. Oblik je
  // i dalje Product-kompatibilan za ProductCardClient/CompareButton/FavoriteButton.
  const item = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    categoryId: product.categoryId,
    brandId: product.brandId,
    images,
    specs: slimSpecs(product),
    ...(typeof product.price === 'number' && product.price > 0 ? { price: product.price, priceUnit: product.priceUnit } : {}),
    ...(withCollection.collectionSlug ? { collectionSlug: withCollection.collectionSlug } : {}),
    ...(swatchImages.length > 0 ? { swatchImages } : {}),
    href: getCanonicalProductHref(withCollection),
    categorySlug: context.categorySlug,
    fv,
    nv,
    compareSlim: true as const,
  };
  return item as unknown as HomeCatalogItem;
}

function schemaEntryFromDef(scope: 'all' | string, def: CategoryFacetDef): HomeFacetSchemaEntry {
  const kind: HomeGroupKind = def.range ? 'range' : def.boolean ? 'boolean' : 'list';
  return {
    id: homeGroupId(scope, def.param),
    param: def.param,
    scope,
    label: def.label,
    kind,
    ...(def.range ? { unit: def.range.unit, presets: def.range.presets, minCoverage: def.range.minCoverage } : {}),
    ...(def.order ? { order: def.order } : {}),
    ...(def.translate ? { optionLabels: { ...def.translate } } : {}),
    ...(def.chipPrefix !== undefined ? { chipPrefix: def.chipPrefix } : {}),
    ...(def.collapsed ? { collapsed: true } : {}),
    ...(def.note ? { note: def.note } : {}),
    ...(def.sortByCount ? { sortByCount: true } : {}),
  };
}

export interface HomeSchemaCategory {
  slug: string;
  name: string;
  /** Stavke koje idu klijentu (kolekcije ili sve stavke kategorije). */
  items: HomeCatalogItem[];
  /** Puni proizvodi kategorije (kolekcije + boje) — izvor ljudskih labela Tip/Kolekcija. */
  products: Product[];
}

/**
 * Šema grupa za klijent i URL: samo grupe koje imaju bar jednu vrednost u
 * podacima. Labele opcija za Tip/Kolekciju dolaze iz samih podataka.
 */
export function buildHomeFacetSchema(categories: HomeSchemaCategory[]): HomeFacetSchemaEntry[] {
  const present = new Set<string>();
  for (const category of categories) {
    for (const item of category.items) {
      Object.keys(item.fv).forEach((id) => present.add(id));
      Object.keys(item.nv).forEach((id) => present.add(id));
    }
  }

  const schema: HomeFacetSchemaEntry[] = [
    { id: 'category', param: 'category', scope: 'all', label: 'Kategorija', kind: 'list' },
    { id: 'brand', param: 'brand', scope: 'all', label: 'Brend', kind: 'list', sortByCount: true, searchable: true },
  ];

  for (const def of getUniversalFacetDefs()) {
    if (present.has(def.param)) schema.push(schemaEntryFromDef('all', def));
  }

  for (const category of categories) {
    const types: Record<string, string> = {};
    const collections: Record<string, string> = {};
    for (const product of category.products) {
      const typeLabel = getHomeTypeLabel(product, category.slug);
      if (typeLabel) types[normalizeHomeOptionValue(typeLabel)] ??= typeLabel;
      const collectionLabel = getHomeCollectionLabel(product);
      if (collectionLabel) collections[normalizeHomeOptionValue(collectionLabel)] ??= collectionLabel;
    }

    const typeId = homeGroupId(category.slug, TYPE_GROUP_PARAM);
    if (present.has(typeId)) {
      schema.push({
        id: typeId,
        param: TYPE_GROUP_PARAM,
        scope: category.slug,
        label: TYPE_FILTER_TITLES[category.slug] || `Tip — ${category.name.toLowerCase()}`,
        kind: 'list',
        ...(category.slug === 'vinil' ? { order: ['heterogeni', 'homogeni'] } : { sortByCount: true }),
        optionLabels: types,
      });
    }

    for (const def of getHomeCategoryFacetDefs(category.slug)) {
      if (def.range) continue;
      const entry = schemaEntryFromDef(category.slug, def);
      if (present.has(entry.id)) schema.push(entry);
    }

    // Grupa Kolekcije ima smisla samo kada bar jedna kolekcija okuplja više stavki
    // (npr. boje iste kolekcije); kod pribora je svaka stavka „svoja kolekcija".
    const collectionId = homeGroupId(category.slug, COLLECTION_GROUP_PARAM);
    const collectionSizes = new Map<string, number>();
    for (const item of category.items) {
      const value = item.fv[collectionId]?.[0];
      if (value) collectionSizes.set(value, (collectionSizes.get(value) || 0) + 1);
    }
    // ≥3: dva istoimena proizvoda (npr. dve „Podloga TarkoFlex") još nisu kolekcija.
    const collectionGroupsItems = Array.from(collectionSizes.values()).some((size) => size >= 3);
    if (present.has(collectionId) && collectionGroupsItems) {
      schema.push({
        id: collectionId,
        param: COLLECTION_GROUP_PARAM,
        scope: category.slug,
        label: COLLECTION_FILTER_TITLES[category.slug] || `Kolekcije — ${category.name.toLowerCase()}`,
        kind: 'list',
        sortByCount: true,
        collapsed: true,
        searchable: true,
        optionLabels: collections,
      });
    }
  }

  return schema;
}

/** Ceo tok za jednu kategoriju: kontekst nad svim proizvodima → stavke za zadate proizvode. */
export function buildHomeCatalogItems(
  categorySlug: string,
  contextProducts: Product[],
  itemProducts: Product[],
  kind: HomeItemKind = 'collection',
): HomeCatalogItem[] {
  const context = buildCategoryFacetContext(categorySlug, contextProducts);
  return itemProducts.map((product) => toHomeCatalogItem(product, context, kind));
}
