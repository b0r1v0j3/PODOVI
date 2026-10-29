import { homeOptionLabel, type HomeFacetSchemaEntry, type HomeRangePresetEntry } from '@/lib/catalog/home-facet-schema';
import { isProductPriceExpired } from '@/lib/utils/product-price';

/**
 * Filter engine početne strane (čist modul, bez React-a).
 *
 * Za svaku stavku računa se koliko AKTIVNIH grupa ne prolazi i koja je to grupa
 * kad je samo jedna. Odatle u jednom prolazu:
 * - rezultat = stavke koje prolaze sve grupe (OR unutar grupe, AND između),
 * - brojač opcije u grupi G = stavke koje prolaze sve osim G i imaju opciju
 *   (u režimu 'include' i stavke bez podatka, jer bi se i one prikazale).
 * Brojači su zato po konstrukciji jednaki broju rezultata posle klika.
 *
 * Kategorijska grupa (scope = slug) važi samo za stavke svoje kategorije —
 * proizvod druge kategorije nije isključen tuđom grupom i ne broji se u njoj.
 */

export type HomeRangeSelection = [number | null, number | null];

export interface HomeFilterSelection {
  /** Liste i da/ne grupe po id-u (uključujući 'category' i 'brand'). */
  lists: Record<string, string[]>;
  /** Numerički opsezi po id-u. */
  ranges: Record<string, HomeRangeSelection>;
}

export interface HomeEngineItem {
  id: string;
  categorySlug: string;
  brandId: string;
  fv: Record<string, string[]>;
  nv: Record<string, number[]>;
  priceValidUntil?: string;
}

export type HomeMissingPolicy = 'exclude' | 'include';

export interface HomeEngineOptions {
  missing: HomeMissingPolicy;
  /** Redosled i nazivi kategorija (sve kategorije kataloga). */
  categories: Array<{ slug: string; name: string }>;
  brandNames: Record<string, string>;
  /** Broj stavki kategorije kada njeni podaci (npr. boje) još nisu učitani. */
  categoryFallbackCounts?: Record<string, number>;
  /** Potpun katalog za kontekst brenda, nezavisan od delimično učitanih boja. */
  contextItems?: HomeEngineItem[];
}

export interface HomeEngineOption {
  value: string;
  label: string;
  count: number;
  selected: boolean;
  disabled: boolean;
}

export interface HomeEnginePreset extends HomeRangePresetEntry {
  count: number;
  selected: boolean;
}

export interface HomeEngineRange {
  bounds: [number, number];
  selected: HomeRangeSelection | null;
  /** Broj rezultata za trenutni izbor opsega (uz ostale grupe). */
  count: number;
  presets: HomeEnginePreset[];
}

export interface HomeEngineGroup {
  entry: HomeFacetSchemaEntry;
  title: string;
  selectedCount: number;
  options?: HomeEngineOption[];
  range?: HomeEngineRange;
}

export interface HomeEngineChip {
  id: string;
  groupId: string;
  value?: string;
  label: string;
}

export interface HomeEngineResult<T extends HomeEngineItem> {
  results: T[];
  groups: HomeEngineGroup[];
  chips: HomeEngineChip[];
}

export const EMPTY_HOME_SELECTION: HomeFilterSelection = Object.freeze({ lists: {}, ranges: {} }) as HomeFilterSelection;

function itemValues(item: HomeEngineItem, entry: HomeFacetSchemaEntry): string[] | undefined {
  if (entry.id === 'category') return [item.categorySlug];
  if (entry.id === 'brand') return [item.brandId];
  return item.fv[entry.id];
}

function appliesTo(item: HomeEngineItem, entry: HomeFacetSchemaEntry): boolean {
  return entry.scope === 'all' || entry.scope === item.categorySlug;
}

function intervalsOverlap(flat: number[], min: number | null, max: number | null): boolean {
  const lo = min ?? Number.NEGATIVE_INFINITY;
  const hi = max ?? Number.POSITIVE_INFINITY;
  for (let index = 0; index < flat.length; index += 2) {
    if (flat[index] <= hi && flat[index + 1] >= lo) return true;
  }
  return false;
}

function isRangeActive(range: HomeRangeSelection | undefined): range is HomeRangeSelection {
  return Boolean(range) && (range![0] !== null || range![1] !== null);
}

function passesList(item: HomeEngineItem, entry: HomeFacetSchemaEntry, selected: string[], missing: HomeMissingPolicy): boolean {
  if (!appliesTo(item, entry)) return true;
  const values = itemValues(item, entry);
  if (!values || values.length === 0) return missing === 'include';
  if (entry.kind === 'boolean') return values.includes('Da');
  for (const value of selected) {
    if (values.includes(value)) return true;
  }
  return false;
}

function passesRange(item: HomeEngineItem, entry: HomeFacetSchemaEntry, range: HomeRangeSelection, missing: HomeMissingPolicy): boolean {
  if (!appliesTo(item, entry)) return true;
  if (entry.id === 'cena' && isProductPriceExpired(item.priceValidUntil)) return false;
  const flat = item.nv[entry.id];
  // Nepoznata cena nikada nije dokaz da proizvod pripada izabranom cenovnom opsegu.
  if (!flat || flat.length === 0) return entry.id !== 'cena' && missing === 'include';
  return intervalsOverlap(flat, range[0], range[1]);
}

const collator = typeof Intl !== 'undefined' ? new Intl.Collator('sr-Latn') : null;
function compareLabels(a: string, b: string): number {
  return collator ? collator.compare(a, b) : a.localeCompare(b);
}

function sortOptions(entry: HomeFacetSchemaEntry, options: Array<HomeEngineOption & { staticCount: number }>, categoryOrder: string[]) {
  if (entry.id === 'category') {
    return options.sort((a, b) => Number(b.count > 0) - Number(a.count > 0) || categoryOrder.indexOf(a.value) - categoryOrder.indexOf(b.value));
  }
  if (entry.sortByCount) {
    // Redosled po ukupnom (statičnom) broju — ne skače posle svakog klika.
    return options.sort((a, b) => b.staticCount - a.staticCount || compareLabels(a.label, b.label));
  }
  const order = entry.order;
  return options.sort((a, b) => {
    if (order) {
      const indexA = order.indexOf(a.value);
      const indexB = order.indexOf(b.value);
      if (indexA !== -1 || indexB !== -1) {
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      }
    }
    return compareLabels(a.label, b.label);
  });
}

const numberFormatter = typeof Intl !== 'undefined' ? new Intl.NumberFormat('sr-RS', { maximumFractionDigits: 2 }) : null;
export function formatHomeNumber(value: number): string {
  return numberFormatter ? numberFormatter.format(value) : String(value);
}

export function formatHomeRange(range: HomeRangeSelection, unit?: string): string {
  const suffix = unit ? ` ${unit}` : '';
  const [min, max] = range;
  if (min !== null && max !== null) return `${formatHomeNumber(min)}–${formatHomeNumber(max)}${suffix}`;
  if (min !== null) return `od ${formatHomeNumber(min)}${suffix}`;
  return `do ${formatHomeNumber(max as number)}${suffix}`;
}

function optionLabel(entry: HomeFacetSchemaEntry, value: string, options: HomeEngineOptions, categoryNames: Map<string, string>): string {
  if (entry.id === 'category') return categoryNames.get(value) || value;
  if (entry.id === 'brand') return options.brandNames[value] || `Brend ${value}`;
  if (entry.kind === 'boolean') return entry.optionLabels?.Da || entry.label;
  return homeOptionLabel(entry, value);
}

/** Grupe vidljive za izabrane kategorije (opšte + kategorijske izabranih kategorija). */
/**
 * Grupe vidljive za izabrane kategorije, u redosledu panela: Kategorija → grupe
 * izabrane kategorije (Tip, Materijal…) → opšte grupe → Kolekcije kategorije.
 */
export function getVisibleHomeSchema(schema: HomeFacetSchemaEntry[], selection: HomeFilterSelection, items: HomeEngineItem[] = []): HomeFacetSchemaEntry[] {
  let categories = selection.lists.category || [];
  const brands = selection.lists.brand || [];
  let brandCategories: string[] = [];
  if (categories.length === 0 && brands.length > 0) {
    // Brend u jednoj kategoriji otvara njene grupe bez tihog category filtera u URL-u.
    brandCategories = Array.from(new Set(items.filter(item => brands.includes(item.brandId)).map(item => item.categorySlug)));
    if (brandCategories.length === 1) categories = brandCategories;
  }
  const visible = schema.filter((entry) => entry.scope === 'all' || categories.includes(entry.scope)
    // Dodavanje drugog brenda ne sme ukloniti aktivan filter postojeće kategorije.
    || (brandCategories.includes(entry.scope) && (entry.kind === 'range'
      ? isRangeActive(selection.ranges[entry.id])
      : (selection.lists[entry.id]?.length || 0) > 0)));
  const isCollectionGroup = (entry: HomeFacetSchemaEntry) => entry.scope !== 'all' && entry.param === 'collection';
  return [
    ...visible.filter((entry) => entry.id === 'category'),
    ...visible.filter((entry) => entry.scope !== 'all' && !isCollectionGroup(entry)),
    ...visible.filter((entry) => entry.scope === 'all' && entry.id !== 'category'),
    ...visible.filter(isCollectionGroup),
  ];
}

export function evaluateHomeFilters<T extends HomeEngineItem>(
  items: T[],
  schema: HomeFacetSchemaEntry[],
  selection: HomeFilterSelection,
  options: HomeEngineOptions,
): HomeEngineResult<T> {
  const visible = getVisibleHomeSchema(schema, selection, options.contextItems || items);
  const categoryNames = new Map(options.categories.map((category) => [category.slug, category.name]));
  const categoryOrder = options.categories.map((category) => category.slug);
  const selectedCategories = selection.lists.category || [];

  // 1) Aktivne grupe i rezultat prolaska po stavci.
  const active = visible.filter((entry) => (
    entry.kind === 'range' ? isRangeActive(selection.ranges[entry.id]) : (selection.lists[entry.id]?.length || 0) > 0
  ));
  const activeIndex = new Map(active.map((entry, index) => [entry.id, index]));
  const failCount = new Uint8Array(items.length);
  const failedGroup = new Int16Array(items.length).fill(-1);

  items.forEach((item, itemIndex) => {
    for (let groupIndex = 0; groupIndex < active.length; groupIndex += 1) {
      const entry = active[groupIndex];
      const passes = entry.kind === 'range'
        ? passesRange(item, entry, selection.ranges[entry.id], options.missing)
        : passesList(item, entry, selection.lists[entry.id], options.missing);
      if (!passes) {
        failCount[itemIndex] = Math.min(255, failCount[itemIndex] + 1);
        failedGroup[itemIndex] = groupIndex;
        if (failCount[itemIndex] > 1) break;
      }
    }
  });

  const results = items.filter((_item, index) => failCount[index] === 0);

  // Univerzum opcija = stavke izabranih kategorija (ili sve); grupa Kategorija uvek vidi sve.
  const inSelectedCategories = new Uint8Array(items.length);
  items.forEach((item, index) => {
    inSelectedCategories[index] = selectedCategories.length === 0 || selectedCategories.includes(item.categorySlug) ? 1 : 0;
  });
  const isEligible = (itemIndex: number, groupActiveIndex: number) => failCount[itemIndex] === 0
    || (groupActiveIndex !== -1 && failCount[itemIndex] === 1 && failedGroup[itemIndex] === groupActiveIndex);

  // 2) Grupe sa opcijama i brojačima.
  const groups: HomeEngineGroup[] = [];
  for (const entry of visible) {
    const groupActiveIndex = activeIndex.get(entry.id) ?? -1;
    const scope = entry.scope;
    const entryId = entry.id;
    const isCategoryGroup = entryId === 'category';

    if (entry.kind === 'range') {
      const selected = isRangeActive(selection.ranges[entry.id]) ? selection.ranges[entry.id] : null;
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      let coverage = 0;
      const distinct = new Set<number>();
      items.forEach((item, itemIndex) => {
        if (!isEligible(itemIndex, groupActiveIndex) || (scope !== 'all' && item.categorySlug !== scope) || !inSelectedCategories[itemIndex]) return;
        const flat = entryId === 'cena' && isProductPriceExpired(item.priceValidUntil) ? undefined : item.nv[entryId];
        if (!flat || flat.length === 0) return;
        coverage += 1;
        for (const value of flat) {
          distinct.add(value);
          if (value < min) min = value;
          if (value > max) max = value;
        }
      });
      if (!selected && (coverage < (entry.minCoverage ?? 2) || distinct.size < 2)) continue;
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        min = selected?.[0] ?? 0;
        max = selected?.[1] ?? min;
      }

      const presetCounts = (entry.presets || []).map(() => 0);
      let selectedCount = 0;
      items.forEach((item, itemIndex) => {
        if (!isEligible(itemIndex, groupActiveIndex) || (scope !== 'all' && item.categorySlug !== scope)) return;
        (entry.presets || []).forEach((preset, presetIndex) => {
          if (passesRange(item, entry, [preset.min ?? null, preset.max ?? null], options.missing)) {
            presetCounts[presetIndex] += 1;
          }
        });
        if (selected && passesRange(item, entry, selected, options.missing)) {
          selectedCount += 1;
        }
      });

      const presets = (entry.presets || []).map((preset, presetIndex) => ({
        ...preset,
        count: presetCounts[presetIndex],
        selected: Boolean(selected) && (selected![0] ?? null) === (preset.min ?? null) && (selected![1] ?? null) === (preset.max ?? null),
      })).filter((preset) => preset.count > 0 || preset.selected);

      groups.push({
        entry,
        title: entry.label,
        selectedCount: selected ? 1 : 0,
        range: { bounds: [min, max], selected, count: selectedCount, presets },
      });
      continue;
    }

    const selectedValues = selection.lists[entry.id] || [];
    const counts = new Map<string, number>();
    const staticCounts = new Map<string, number>();
    let missingCount = 0;

    if (entry.id === 'category') {
      for (const category of options.categories) {
        counts.set(category.slug, 0);
        staticCounts.set(category.slug, 0);
      }
    }

    const includeMissing = options.missing === 'include';
    for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
      const item = items[itemIndex];
      if (scope !== 'all' && item.categorySlug !== scope) continue;
      if (!isCategoryGroup && !inSelectedCategories[itemIndex]) continue;
      const values = isCategoryGroup ? [item.categorySlug] : entryId === 'brand' ? [item.brandId] : item.fv[entryId];
      const eligible = isEligible(itemIndex, groupActiveIndex);
      if (!values || values.length === 0) {
        if (eligible && includeMissing) missingCount += 1;
        continue;
      }
      for (let valueIndex = 0; valueIndex < values.length; valueIndex += 1) {
        const value = values[valueIndex];
        staticCounts.set(value, (staticCounts.get(value) || 0) + 1);
        if (eligible) counts.set(value, (counts.get(value) || 0) + 1);
      }
    }

    if (entry.id === 'category' && options.categoryFallbackCounts) {
      for (const [slug, fallback] of Object.entries(options.categoryFallbackCounts)) {
        if ((staticCounts.get(slug) || 0) === 0) {
          staticCounts.set(slug, fallback);
          counts.set(slug, fallback);
        }
      }
    }

    let values = entry.kind === 'boolean' ? ['Da'] : Array.from(staticCounts.keys());
    for (const value of selectedValues) {
      const key = entry.kind === 'boolean' ? 'Da' : value;
      if (!values.includes(key)) values.push(key);
    }
    if (entry.id === 'category') values = values.filter((value) => categoryNames.has(value));

    const groupOptions = sortOptions(entry, values.map((value) => {
      const urlValue = entry.kind === 'boolean' ? '1' : value;
      const count = (counts.get(value) || 0) + (entry.id === 'category' || entry.id === 'brand' ? 0 : missingCount);
      const selected = selectedValues.includes(urlValue);
      return {
        value: urlValue,
        label: optionLabel(entry, value, options, categoryNames),
        count,
        staticCount: staticCounts.get(value) || 0,
        selected,
        disabled: count === 0 && !selected,
      };
    }), categoryOrder);

    const hasSelection = selectedValues.length > 0;
    if (!hasSelection && entry.id !== 'category' && !groupOptions.some(option => option.count > 0)) continue;
    if (entry.kind === 'boolean') {
      if (!hasSelection && (staticCounts.get('Da') || 0) === 0) continue;
    } else if (!hasSelection && groupOptions.length < 2) {
      continue;
    }

    groups.push({
      entry,
      title: entry.label,
      selectedCount: selectedValues.length,
      options: groupOptions.map(({ staticCount: _staticCount, ...option }) => option),
    });
  }

  // 3) Čipovi aktivnih filtera (redosled grupa).
  const chips: HomeEngineChip[] = [];
  for (const entry of active) {
    if (entry.kind === 'range') {
      chips.push({
        id: `${entry.id}:range`,
        groupId: entry.id,
        label: `${entry.label}: ${formatHomeRange(selection.ranges[entry.id], entry.unit)}`,
      });
      continue;
    }
    for (const value of selection.lists[entry.id]) {
      let label: string;
      if (entry.kind === 'boolean') label = entry.label;
      else if (entry.id === 'category' || entry.id === 'brand') label = optionLabel(entry, value, options, categoryNames);
      else if (entry.scope !== 'all' && (entry.param === 'type' || entry.param === 'collection')) label = `${entry.label}: ${homeOptionLabel(entry, value)}`;
      // chipPrefix → kratka vrednost („Klasa 33", „AC5"), inače ljudska labela opcije.
      else label = entry.chipPrefix !== undefined ? `${entry.chipPrefix}${value}` : homeOptionLabel(entry, value);
      chips.push({ id: `${entry.id}:${value}`, groupId: entry.id, value, label });
    }
  }

  return { results, groups, chips };
}

// ===== Promene izbora (čiste funkcije) =====

export function toggleHomeListValue(selection: HomeFilterSelection, groupId: string, value: string): HomeFilterSelection {
  const current = selection.lists[groupId] || [];
  const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
  const lists = { ...selection.lists };
  if (next.length > 0) lists[groupId] = next;
  else delete lists[groupId];
  return { ...selection, lists };
}

export function setHomeRange(selection: HomeFilterSelection, groupId: string, range: HomeRangeSelection | null): HomeFilterSelection {
  const ranges = { ...selection.ranges };
  if (range && isRangeActive(range)) ranges[groupId] = range;
  else delete ranges[groupId];
  return { ...selection, ranges };
}

/** Kategorijske selekcije kategorija koje više nisu izabrane se brišu; opšte ostaju. */
export function pruneHomeSelection(selection: HomeFilterSelection, schema: HomeFacetSchemaEntry[], items: HomeEngineItem[] = []): HomeFilterSelection {
  const visibleIds = new Set(getVisibleHomeSchema(schema, selection, items).map(entry => entry.id));
  const keep = (id: string) => visibleIds.has(id);
  const lists = Object.fromEntries(Object.entries(selection.lists).filter(([id, values]) => values.length > 0 && keep(id)));
  const ranges = Object.fromEntries(Object.entries(selection.ranges).filter(([id, range]) => isRangeActive(range) && keep(id)));
  const changed = Object.keys(lists).length !== Object.keys(selection.lists).length
    || Object.keys(ranges).length !== Object.keys(selection.ranges).length;
  return changed ? { lists, ranges } : selection;
}

export function removeHomeChip(selection: HomeFilterSelection, chip: HomeEngineChip): HomeFilterSelection {
  if (chip.value === undefined) return setHomeRange(selection, chip.groupId, null);
  return toggleHomeListValue(selection, chip.groupId, chip.value);
}

export function countHomeSelection(selection: HomeFilterSelection): number {
  return Object.values(selection.lists).reduce((sum, values) => sum + values.length, 0)
    + Object.values(selection.ranges).filter(isRangeActive).length;
}

/**
 * Odbacuje vrednosti kojih nema u podacima (fantomski filteri iz starih ili
 * ručno menjanih linkova). Poziva se tek kada su podaci aktivnog taba učitani.
 */
/** Sve vrednosti po grupi u skupu stavki — računa se jednom po skupu podataka. */
export function collectHomePresentValues(items: HomeEngineItem[]): Map<string, Set<string>> {
  const present = new Map<string, Set<string>>();
  for (const item of items) {
    for (const [id, values] of Object.entries(item.fv)) {
      const set = present.get(id) || new Set<string>();
      values.forEach((value) => set.add(value));
      present.set(id, set);
    }
  }
  return present;
}

export function sanitizeHomeSelection(
  selection: HomeFilterSelection,
  schema: HomeFacetSchemaEntry[],
  items: HomeEngineItem[] | Map<string, Set<string>>,
  categories: Array<{ slug: string }>,
  brandIds: Set<string>,
  contextItems: HomeEngineItem[] = items instanceof Map ? [] : items,
): HomeFilterSelection {
  const byId = new Map(schema.map((entry) => [entry.id, entry]));
  const categorySlugs = new Set(categories.map((category) => category.slug));
  const present = items instanceof Map ? items : collectHomePresentValues(items);

  const lists: Record<string, string[]> = {};
  for (const [id, values] of Object.entries(selection.lists)) {
    const entry = byId.get(id);
    if (!entry || entry.kind === 'range') continue;
    const valid = values.filter((value) => {
      if (id === 'category') return categorySlugs.has(value);
      if (id === 'brand') return brandIds.has(value);
      if (entry.kind === 'boolean') return value === '1' && Boolean(present.get(id)?.has('Da'));
      return Boolean(present.get(id)?.has(value));
    });
    if (valid.length > 0) lists[id] = Array.from(new Set(valid));
  }

  const ranges: Record<string, HomeRangeSelection> = {};
  for (const [id, range] of Object.entries(selection.ranges)) {
    if (byId.get(id)?.kind === 'range' && isRangeActive(range)) ranges[id] = range;
  }

  return pruneHomeSelection({ lists, ranges }, schema, contextItems);
}
