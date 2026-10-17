/**
 * Pure URL contract for the filters on the homepage catalogue.
 *
 * Multi-select values use repeatable parameters instead of comma-separated
 * values so labels which contain punctuation can round-trip without an extra
 * escaping convention. Scoped values intentionally mirror HomeProductTabs:
 * `category::value` for types/collections and `category::param::value` for
 * declarative facets.
 */

import {
  COLLECTION_GROUP_PARAM,
  LEGACY_APPLICATION_TO_NAMENA,
  LEGACY_HOME_FACET_ALIASES,
  TYPE_GROUP_PARAM,
  homeGroupId,
  type HomeFacetSchemaEntry,
} from '@/lib/catalog/home-facet-schema';
import type { HomeFilterSelection, HomeRangeSelection } from '@/lib/catalog/home-filter-engine';

export const HOME_FILTER_QUERY_KEYS = {
  categories: 'category',
  brands: 'brand',
  types: 'type',
  applications: 'application',
  collections: 'collection',
  facets: 'facet',
  thicknessMin: 'thicknessMin',
  thicknessMax: 'thicknessMax',
  tab: 'tab',
  sort: 'sort',
} as const;

export type HomeFilterTab = 'collections' | 'colors';
export type HomeFilterSort = 'featured' | 'name' | 'price';

export interface HomeFilterUrlState {
  categories: string[];
  brands: string[];
  /** `category::value` */
  types: string[];
  applications: string[];
  /** `category::value` */
  collections: string[];
  /** `category::param::value` */
  facets: string[];
  thickness: [number, number] | null;
  tab: HomeFilterTab;
  sort: HomeFilterSort;
}

export const DEFAULT_HOME_FILTER_URL_STATE: Readonly<HomeFilterUrlState> = Object.freeze({
  categories: Object.freeze([]) as unknown as string[],
  brands: Object.freeze([]) as unknown as string[],
  types: Object.freeze([]) as unknown as string[],
  applications: Object.freeze([]) as unknown as string[],
  collections: Object.freeze([]) as unknown as string[],
  facets: Object.freeze([]) as unknown as string[],
  thickness: null,
  tab: 'collections',
  sort: 'featured',
});

type SearchParamsInput = string | URLSearchParams | { toString(): string };

const SCOPED_SEPARATOR = '::';
const MAX_VALUE_LENGTH = 240;
const MAX_THICKNESS_MM = 1_000;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const CATEGORY_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FACET_PARAM = /^[a-z][a-z0-9_-]*$/;

const OWNED_QUERY_KEYS = new Set<string>(Object.values(HOME_FILTER_QUERY_KEYS));

function toSearchParams(input?: SearchParamsInput): URLSearchParams {
  if (!input) return new URLSearchParams();
  if (input instanceof URLSearchParams) return new URLSearchParams(input);

  let value = input.toString().trim();
  const questionMark = value.indexOf('?');
  if (questionMark !== -1) value = value.slice(questionMark + 1);
  if (value.startsWith('?')) value = value.slice(1);
  const hash = value.indexOf('#');
  if (hash !== -1) value = value.slice(0, hash);
  return new URLSearchParams(value);
}

function sanitizeText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_VALUE_LENGTH || CONTROL_CHARACTERS.test(trimmed)) return null;
  return trimmed;
}

function sanitizeCategory(value: unknown): string | null {
  const text = sanitizeText(value);
  if (!text) return null;
  const normalized = text.toLowerCase();
  return normalized.length <= 80 && CATEGORY_SLUG.test(normalized) ? normalized : null;
}

function sanitizeBrand(value: unknown): string | null {
  const text = sanitizeText(value);
  if (!text || text.length > 100 || !/^[a-z0-9._-]+$/i.test(text)) return null;
  return text;
}

function sanitizePlainValue(value: unknown): string | null {
  const text = sanitizeText(value);
  return text && !text.includes(SCOPED_SEPARATOR) ? text : null;
}

function sanitizeScopedValue(value: unknown): string | null {
  const text = sanitizeText(value);
  if (!text) return null;
  const parts = text.split(SCOPED_SEPARATOR);
  if (parts.length !== 2) return null;

  const category = sanitizeCategory(parts[0]);
  const option = sanitizePlainValue(parts[1]);
  const normalizedOption = option?.replace(/\s+/g, ' ').toLowerCase() || null;
  return category && normalizedOption ? `${category}${SCOPED_SEPARATOR}${normalizedOption}` : null;
}

function sanitizeScopedFacet(value: unknown): string | null {
  const text = sanitizeText(value);
  if (!text) return null;
  const parts = text.split(SCOPED_SEPARATOR);
  if (parts.length !== 3) return null;

  const category = sanitizeCategory(parts[0]);
  const param = sanitizeText(parts[1])?.toLowerCase() || null;
  const option = sanitizePlainValue(parts[2]);
  if (!category || !param || param.length > 64 || !FACET_PARAM.test(param) || !option) return null;
  return `${category}${SCOPED_SEPARATOR}${param}${SCOPED_SEPARATOR}${option}`;
}

function sanitizeList(values: readonly unknown[], sanitizer: (value: unknown) => string | null): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const sanitized = sanitizer(value);
    if (!sanitized || seen.has(sanitized)) continue;
    seen.add(sanitized);
    result.push(sanitized);
  }

  return result;
}

function parseThickness(value: unknown): number | null {
  const text = sanitizeText(value);
  if (!text || !/^\d+(?:[.,]\d+)?$/.test(text)) return null;
  const parsed = Number(text.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_THICKNESS_MM) return null;
  return Object.is(parsed, -0) ? 0 : parsed;
}

function firstValid<T>(values: readonly unknown[], parser: (value: unknown) => T | null): T | null {
  for (const value of values) {
    const parsed = parser(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

function parseEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  const text = sanitizeText(value);
  return text && (allowed as readonly string[]).includes(text) ? (text as T) : null;
}

/** Parse filter-owned query parameters, ignoring all unrelated parameters. */
export function parseHomeFilterUrlState(input: SearchParamsInput): HomeFilterUrlState {
  const params = toSearchParams(input);
  const min = firstValid(params.getAll(HOME_FILTER_QUERY_KEYS.thicknessMin), parseThickness);
  const max = firstValid(params.getAll(HOME_FILTER_QUERY_KEYS.thicknessMax), parseThickness);
  const thickness: [number, number] | null = min !== null && max !== null && min <= max ? [min, max] : null;

  return {
    categories: sanitizeList(params.getAll(HOME_FILTER_QUERY_KEYS.categories), sanitizeCategory),
    brands: sanitizeList(params.getAll(HOME_FILTER_QUERY_KEYS.brands), sanitizeBrand),
    types: sanitizeList(params.getAll(HOME_FILTER_QUERY_KEYS.types), sanitizeScopedValue),
    applications: sanitizeList(params.getAll(HOME_FILTER_QUERY_KEYS.applications), sanitizePlainValue),
    collections: sanitizeList(params.getAll(HOME_FILTER_QUERY_KEYS.collections), sanitizeScopedValue),
    facets: sanitizeList(params.getAll(HOME_FILTER_QUERY_KEYS.facets), sanitizeScopedFacet),
    thickness,
    tab: firstValid(params.getAll(HOME_FILTER_QUERY_KEYS.tab), (value) =>
      parseEnum(value, ['collections', 'colors'] as const)) ?? 'collections',
    sort: firstValid(params.getAll(HOME_FILTER_QUERY_KEYS.sort), (value) =>
      parseEnum(value, ['featured', 'name', 'price'] as const)) ?? 'featured',
  };
}

function compareCanonical(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function appendList(
  params: URLSearchParams,
  key: string,
  values: readonly unknown[] | undefined,
  sanitizer: (value: unknown) => string | null,
): void {
  if (!values) return;
  const canonical = sanitizeList(values, sanitizer).sort(compareCanonical);
  for (const value of canonical) params.append(key, value);
}

function sanitizeThicknessRange(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const min = parseThickness(String(value[0]));
  const max = parseThickness(String(value[1]));
  return min !== null && max !== null && min <= max ? [min, max] : null;
}

/**
 * Serialize a complete (or partial/default) filter state over existing params.
 *
 * Existing filter-owned keys are replaced. Unrelated entries are retained in
 * their original order (including duplicate keys), while owned list values are
 * deduplicated, sorted and appended in a fixed key order. Default tab/sort are
 * omitted, keeping the empty filter URL clean.
 */
export function serializeHomeFilterUrlState(
  state: Partial<HomeFilterUrlState>,
  current?: SearchParamsInput,
): URLSearchParams {
  const source = toSearchParams(current);
  const params = new URLSearchParams();

  source.forEach((value, key) => {
    if (!OWNED_QUERY_KEYS.has(key)) params.append(key, value);
  });

  appendList(params, HOME_FILTER_QUERY_KEYS.categories, state.categories, sanitizeCategory);
  appendList(params, HOME_FILTER_QUERY_KEYS.brands, state.brands, sanitizeBrand);
  appendList(params, HOME_FILTER_QUERY_KEYS.types, state.types, sanitizeScopedValue);
  appendList(params, HOME_FILTER_QUERY_KEYS.applications, state.applications, sanitizePlainValue);
  appendList(params, HOME_FILTER_QUERY_KEYS.collections, state.collections, sanitizeScopedValue);
  appendList(params, HOME_FILTER_QUERY_KEYS.facets, state.facets, sanitizeScopedFacet);

  const thickness = sanitizeThicknessRange(state.thickness);
  if (thickness) {
    params.append(HOME_FILTER_QUERY_KEYS.thicknessMin, String(thickness[0]));
    params.append(HOME_FILTER_QUERY_KEYS.thicknessMax, String(thickness[1]));
  }

  const tab = parseEnum(state.tab, ['collections', 'colors'] as const);
  if (tab && tab !== 'collections') params.append(HOME_FILTER_QUERY_KEYS.tab, tab);

  const sort = parseEnum(state.sort, ['featured', 'name', 'price'] as const);
  if (sort && sort !== 'featured') params.append(HOME_FILTER_QUERY_KEYS.sort, sort);

  return params;
}

// ===== Novi sloj (17.10.2026): opšte grupe, opsezi i kategorijske grupe =====
//
// Stari ključevi gore ostaju jedini parser za category/brand/type/collection/facet
// (i stare application/thicknessMin/Max), pa linkovi od 11.07.2026 rade bez promene.
// Opšte grupe dobijaju čitljive parametre (`?klasa=33&ugradnja=Klik&debljina=2-5`).


export interface HomeFilterUrlSelection {
  selection: HomeFilterSelection;
  tab: HomeFilterTab;
  sort: HomeFilterSort;
}

const RANGE_VALUE = /^\s*(\d+(?:[.,]\d+)?)?\s*-\s*(\d+(?:[.,]\d+)?)?\s*$/;

const MAX_RANGE_VALUE = 1_000_000_000;

function parseRangeNumber(value: string): number | null {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= MAX_RANGE_VALUE ? parsed : null;
}

export function parseHomeRangeValue(value: unknown): HomeRangeSelection | null {
  const text = sanitizeText(value);
  if (!text) return null;
  const match = text.match(RANGE_VALUE);
  if (!match || (match[1] === undefined && match[2] === undefined)) return null;
  const min = match[1] !== undefined ? parseRangeNumber(match[1]) : null;
  const max = match[2] !== undefined ? parseRangeNumber(match[2]) : null;
  if ((match[1] !== undefined && min === null) || (match[2] !== undefined && max === null)) return null;
  if (min !== null && max !== null && min > max) return null;
  return [min, max];
}

function formatRangeNumber(value: number | null): string {
  return value === null ? '' : String(Number(value.toFixed(4)));
}

export function formatHomeRangeValue(range: HomeRangeSelection): string {
  return `${formatRangeNumber(range[0])}-${formatRangeNumber(range[1])}`;
}

function universalEntries(schema: HomeFacetSchemaEntry[]): HomeFacetSchemaEntry[] {
  return schema.filter((entry) => entry.scope === 'all' && entry.id !== 'category' && entry.id !== 'brand');
}

function pushUnique(lists: Record<string, string[]>, id: string, value: string): void {
  const current = lists[id] || [];
  if (!current.includes(value)) lists[id] = [...current, value];
}

/** URL → izbor filtera po šemi (stari i novi format). Nepoznate grupe se odbacuju. */
export function parseHomeFilterSelection(input: SearchParamsInput, schema: HomeFacetSchemaEntry[]): HomeFilterUrlSelection {
  const params = toSearchParams(input);
  const raw = parseHomeFilterUrlState(params);
  const known = new Map(schema.map((entry) => [entry.id, entry]));
  const universalByParam = new Map(universalEntries(schema).map((entry) => [entry.param, entry]));
  const lists: Record<string, string[]> = {};
  const ranges: Record<string, HomeRangeSelection> = {};

  if (raw.categories.length > 0) lists.category = raw.categories;
  if (raw.brands.length > 0) lists.brand = raw.brands;

  for (const scoped of raw.types) {
    const [category, value] = scoped.split(SCOPED_SEPARATOR);
    pushUnique(lists, homeGroupId(category, TYPE_GROUP_PARAM), value);
  }
  for (const scoped of raw.collections) {
    const [category, value] = scoped.split(SCOPED_SEPARATOR);
    pushUnique(lists, homeGroupId(category, COLLECTION_GROUP_PARAM), value);
  }
  for (const scoped of raw.facets) {
    const [category, param, value] = scoped.split(SCOPED_SEPARATOR);
    // Alias pobeđuje: laminat::klasa je bila AC skala, ne opšta klasa upotrebe.
    const alias = LEGACY_HOME_FACET_ALIASES[category]?.[param];
    if (alias) {
      pushUnique(lists, homeGroupId(category, alias), value);
      continue;
    }
    const universal = universalByParam.get(param);
    if (universal && universal.kind !== 'range') {
      pushUnique(lists, universal.id, universal.kind === 'boolean' ? '1' : value);
      continue;
    }
    pushUnique(lists, homeGroupId(category, param), value);
  }
  for (const application of raw.applications) {
    const namena = LEGACY_APPLICATION_TO_NAMENA[application.toLowerCase()];
    if (namena && universalByParam.has('namena')) pushUnique(lists, 'namena', namena);
  }
  if (raw.thickness && universalByParam.has('debljina')) ranges.debljina = raw.thickness;

  for (const entry of universalEntries(schema)) {
    const values = params.getAll(entry.param);
    if (values.length === 0) continue;
    if (entry.kind === 'range') {
      const range = firstValid(values, parseHomeRangeValue);
      if (range) ranges[entry.id] = range;
      continue;
    }
    for (const value of values) {
      const sanitized = entry.kind === 'boolean' ? (value.trim() === '1' ? '1' : null) : sanitizePlainValue(value);
      if (sanitized) pushUnique(lists, entry.id, sanitized);
    }
  }

  for (const id of Object.keys(lists)) {
    if (!known.has(id) || known.get(id)!.kind === 'range') delete lists[id];
  }

  return { selection: { lists, ranges }, tab: raw.tab, sort: raw.sort };
}

/** Izbor filtera → URL (uvek novi format; nepovezani parametri ostaju). */
export function serializeHomeFilterSelection(
  state: HomeFilterUrlSelection,
  schema: HomeFacetSchemaEntry[],
  current?: SearchParamsInput,
): URLSearchParams {
  const byId = new Map(schema.map((entry) => [entry.id, entry]));
  const types: string[] = [];
  const collections: string[] = [];
  const facets: string[] = [];

  for (const [id, values] of Object.entries(state.selection.lists)) {
    const entry = byId.get(id);
    if (!entry || entry.scope === 'all') continue;
    for (const value of values) {
      if (entry.param === TYPE_GROUP_PARAM) types.push(`${entry.scope}${SCOPED_SEPARATOR}${value}`);
      else if (entry.param === COLLECTION_GROUP_PARAM) collections.push(`${entry.scope}${SCOPED_SEPARATOR}${value}`);
      else facets.push([entry.scope, entry.param, value].join(SCOPED_SEPARATOR));
    }
  }

  const params = serializeHomeFilterUrlState({
    categories: state.selection.lists.category || [],
    brands: state.selection.lists.brand || [],
    types,
    applications: [],
    collections,
    facets,
    thickness: null,
    tab: state.tab,
    sort: state.sort,
  }, current);

  const universal = universalEntries(schema);
  for (const entry of universal) params.delete(entry.param);

  for (const entry of universal) {
    if (entry.kind === 'range') {
      const range = state.selection.ranges[entry.id];
      if (range && (range[0] !== null || range[1] !== null)) params.append(entry.param, formatHomeRangeValue(range));
      continue;
    }
    const values = Array.from(new Set(state.selection.lists[entry.id] || [])).sort(compareCanonical);
    for (const value of values) {
      const sanitized = entry.kind === 'boolean' ? (value === '1' ? '1' : null) : sanitizePlainValue(value);
      if (sanitized) params.append(entry.param, sanitized);
    }
  }

  return params;
}
