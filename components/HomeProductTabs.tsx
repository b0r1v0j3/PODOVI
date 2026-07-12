'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Brand, Category, Product } from '@/types';
import ProductCardClient from '@/components/ProductCardClient';
import { useScrollLock } from '@/components/useScrollLock';
import {
  getVisibleFilterOptions,
  hasPricedProducts,
  sortHomepageProducts,
  withLiveOptionCounts,
  type HomepageSortMode,
} from '@/lib/catalog/home-filter-utils';
import {
  parseHomeFilterUrlState,
  serializeHomeFilterUrlState,
  type HomeFilterUrlState,
} from '@/lib/catalog/home-filter-url';
import { OPEN_HOME_FILTERS_EVENT } from '@/lib/catalog/home-filter-events';
import {
  buildFacetInheritanceMaps,
  collectFacetOptionValues,
  facetChipLabel,
  facetOptionLabel,
  getFacetDefsForCategory,
  productMatchesFacetDef,
  productMatchesFacetSelections,
  type CategoryFacetDef,
  type FacetInheritanceMaps,
  type FacetMissingPolicy,
  type FacetSelections,
} from '@/lib/catalog/facet-config';

const INITIAL_PRODUCT_LIMIT = 12;
const VINYL_CATEGORY_SLUG = 'vinil';
const SCOPED_OPTION_SEPARATOR = '::';

const TYPE_FILTER_TITLES: Record<string, string> = {
  vinil: 'Tip vinila',
  linoleum: 'Tip linoleuma',
  lvt: 'Tip LVT-a',
  laminat: 'Tip laminata',
  parket: 'Tip parketa',
  deking: 'Tip dekinga',
  'tekstilne-ploce': 'Tip tekstilnih ploča',
};

const COLLECTION_FILTER_TITLES: Record<string, string> = {
  vinil: 'Kolekcije vinila',
  linoleum: 'Kolekcije linoleuma',
  lvt: 'Kolekcije LVT-a',
  laminat: 'Kolekcije laminata',
  parket: 'Kolekcije parketa',
  deking: 'Kolekcije dekinga',
  'tekstilne-ploce': 'Kolekcije tekstilnih ploča',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  vinil: 'Profesionalni homogeni i heterogeni vinil podovi za stambene i komercijalne prostore.',
  parket: 'Prirodni drveni podovi i kolekcije parketa za stambene i reprezentativne prostore.',
  lvt: 'LVT kolekcije za prostore kojima trebaju postojan dizajn, laka ugradnja i jednostavno održavanje.',
  'tekstilne-ploce': 'Tekstilne ploče za kancelarije, hotele i komercijalne enterijere sa modularnom ugradnjom.',
  deking: 'Spoljašnje podne obloge, WPC deking i prateći sistemi za terase i eksterijere.',
  laminat: 'Laminat kolekcije sa dekorima drveta za brzo i praktično opremanje enterijera.',
  linoleum: 'Linoleum podovi od prirodnih materijala za škole, zdravstvo i javne objekte.',
};

export interface HomeProductGroup {
  category: Pick<Category, 'id' | 'name' | 'slug'>;
  products: Product[];
  colorProducts?: Product[];
  totalCount: number;
  colorCount?: number;
}

interface HomeProductTabsProps {
  groups: HomeProductGroup[];
  brandsRecord: Record<string, Brand>;
  initialFilterState?: HomeFilterUrlState;
}

interface CountOption {
  value: string;
  label: string;
  count: number;
}

interface ScopedOptionGroup {
  category: Pick<Category, 'id' | 'name' | 'slug'>;
  title: string;
  options: CountOption[];
}

// Nova facet sekcija (facet-config): renderuje se identično postojećim sekcijama
// (FilterSection + FilterButton), option.value nosi skopiranu trojku.
interface FacetSectionGroup {
  category: Pick<Category, 'id' | 'name' | 'slug'>;
  def: CategoryFacetDef;
  title: string;
  options: CountOption[];
}

type RefinementSkip =
  | { group: 'brand' | 'application' | 'thickness' }
  | { group: 'type' | 'collection'; categorySlug: string };

function CheckIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8.2 6.4 11 12.5 5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6 8 10 12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m21 21-4.2-4.2M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// 1 rezultat / 2 rezultata / 5 rezultata (mobilno dugme "Prikaži N rezultata") —
// isti obrazac kao nekadašnji ProductFilters (21 rezultat, 11 rezultata...).
function pluralizeResults(count: number): string {
  return count % 10 === 1 && count % 100 !== 11 ? 'rezultat' : 'rezultata';
}

function dedupeProductsBySlug(products: Product[]): Product[] {
  const seen = new Set<string>();

  return products.filter((product) => {
    if (!product.slug || seen.has(product.slug)) {
      return false;
    }

    seen.add(product.slug);
    return true;
  });
}

function normalizeOptionValue(value: string): string {
  return value.trim().toLowerCase();
}

function buildScopedOptionValue(categorySlug: string, optionValue: string): string {
  return `${categorySlug}${SCOPED_OPTION_SEPARATOR}${optionValue}`;
}

function parseScopedOptionValue(value: string): { categorySlug: string; optionValue: string } | null {
  const separatorIndex = value.indexOf(SCOPED_OPTION_SEPARATOR);
  if (separatorIndex === -1) {
    return null;
  }

  return {
    categorySlug: value.slice(0, separatorIndex),
    optionValue: value.slice(separatorIndex + SCOPED_OPTION_SEPARATOR.length),
  };
}

// FILTERI 2.0 na početnoj: vrednost nove facet grupe je skopirana trojka
// kategorija::param::vrednost — grupa filtrira SAMO proizvode svoje kategorije
// (isti obrazac kao postojeće Tip/Kolekcije sekcije, samo sa param nivoom više).
function buildScopedFacetValue(categorySlug: string, param: string, value: string): string {
  return [categorySlug, param, value].join(SCOPED_OPTION_SEPARATOR);
}

function parseScopedFacetValue(scoped: string): { categorySlug: string; param: string; value: string } | null {
  const first = scoped.indexOf(SCOPED_OPTION_SEPARATOR);
  if (first === -1) {
    return null;
  }

  const second = scoped.indexOf(SCOPED_OPTION_SEPARATOR, first + SCOPED_OPTION_SEPARATOR.length);
  if (second === -1) {
    return null;
  }

  return {
    categorySlug: scoped.slice(0, first),
    param: scoped.slice(first + SCOPED_OPTION_SEPARATOR.length, second),
    value: scoped.slice(second + SCOPED_OPTION_SEPARATOR.length),
  };
}

function buildScopedSelectionMap(values: string[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  for (const value of values) {
    const parsed = parseScopedOptionValue(value);
    if (!parsed) {
      continue;
    }

    const existing = map.get(parsed.categorySlug) || new Set<string>();
    existing.add(normalizeOptionValue(parsed.optionValue));
    map.set(parsed.categorySlug, existing);
  }

  return map;
}

function getSpecValue(product: Product, keys: string[]): string | null {
  for (const spec of product.specs || []) {
    const key = String(spec.key || '').toLowerCase();
    const label = String(spec.label || '').toLowerCase();
    if (keys.some((candidate) => key === candidate || label.includes(candidate))) {
      const value = String(spec.value || '').trim();
      if (value) {
        return value;
      }
    }
  }

  return null;
}

function buildValueOptions(
  products: Product[],
  getValue: (product: Product) => string | null,
  limit = 5,
  formatLabel?: (value: string) => string,
): CountOption[] {
  const counts = new Map<string, CountOption>();

  for (const product of products) {
    const rawValue = getValue(product);
    if (!rawValue) {
      continue;
    }

    const label = (formatLabel ? formatLabel(rawValue) : rawValue).replace(/\s+/g, ' ').trim();
    const value = normalizeOptionValue(label);
    const existing = counts.get(value);
    counts.set(value, {
      value,
      label: existing?.label || label,
      count: (existing?.count || 0) + 1,
    });
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'sr'))
    .slice(0, limit);
}

function buildBrandOptions(products: Product[], brandsRecord: Record<string, Brand>, limit = 6): CountOption[] {
  const counts = new Map<string, CountOption>();

  for (const product of products) {
    const brand = brandsRecord[product.brandId];
    if (!brand) {
      continue;
    }

    const existing = counts.get(product.brandId);
    counts.set(product.brandId, {
      value: product.brandId,
      label: brand.name,
      count: (existing?.count || 0) + 1,
    });
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'sr'))
    .slice(0, limit);
}

function getNextProductRowSize(): number {
  if (typeof window === 'undefined') {
    return 4;
  }

  if (window.matchMedia('(min-width: 1280px)').matches) {
    return 4;
  }

  if (window.matchMedia('(min-width: 768px)').matches) {
    return 3;
  }

  return 2;
}

function formatVinylTypeLabel(value: string): string {
  const normalized = normalizeOptionValue(value);

  if (normalized.includes('heterog')) {
    return 'Heterogeni';
  }

  if (normalized.includes('homog')) {
    return 'Homogeni';
  }

  return value;
}

function parseThicknessValue(product: Product): number | null {
  const value = getSpecValue(product, ['thickness', 'debljina']);
  if (!value) {
    return null;
  }

  const match = value.replace(',', '.').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function formatMm(value: number): string {
  return `${value.toFixed(1)} mm`;
}

const APPLICATION_FILTERS = [
  {
    value: 'stambeni prostor',
    label: 'Stambeni prostor',
    patterns: ['stamben', 'residential', 'home', 'stan', 'kuca', 'kuća'],
  },
  {
    value: 'komercijalni prostor',
    label: 'Komercijalni prostor',
    patterns: ['komercijal', 'commercial', 'office', 'school', 'hotel', 'retail', 'health', 'zdrav', 'javni', 'objek'],
  },
] as const;

function getApplicationMatches(product: Product): string[] {
  const text = normalizeOptionValue([
    getSpecValue(product, ['application', 'primena', 'use', 'namena']),
    product.shortDescription,
    product.description,
  ].filter(Boolean).join(' '));

  if (!text) {
    return [];
  }

  return APPLICATION_FILTERS
    .filter((option) => option.patterns.some((pattern) => text.includes(pattern)))
    .map((option) => option.value);
}

function buildApplicationOptions(products: Product[]): CountOption[] {
  const counts = new Map<string, number>();

  for (const product of products) {
    for (const value of getApplicationMatches(product)) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }

  return APPLICATION_FILTERS
    .map((option) => ({
      value: option.value,
      label: option.label,
      count: counts.get(option.value) || 0,
    }))
    .filter((option) => option.count > 0);
}

function getCollectionFilterValue(product: Product): string | null {
  return getSpecValue(product, ['collection', 'kolekcija', 'brand_line', 'range']) || product.name || null;
}

function sanitizeFilterStateAgainstCatalog(
  state: HomeFilterUrlState,
  groups: HomeProductGroup[],
  brandsRecord: Record<string, Brand>,
): HomeFilterUrlState {
  const availableCategorySlugs = new Set(groups.map((group) => group.category.slug));
  const categories = state.categories.filter((slug) => availableCategorySlugs.has(slug));
  const selectedCategorySlugs = new Set(categories);
  const availableBrandIds = new Set(
    groups.flatMap((group) => [...group.products, ...(group.colorProducts || [])])
      .map((product) => String(product.brandId))
      .filter((brandId) => Boolean(brandsRecord[brandId])),
  );
  const availableApplications = new Set(APPLICATION_FILTERS.map((option) => option.value));

  const sanitizeScopedSelections = (values: string[]) => values.flatMap((value) => {
    const parsed = parseScopedOptionValue(value);
    if (!parsed || !selectedCategorySlugs.has(parsed.categorySlug)) {
      return [];
    }

    return [buildScopedOptionValue(parsed.categorySlug, normalizeOptionValue(parsed.optionValue))];
  });

  const facets = state.facets.filter((value) => {
    const parsed = parseScopedFacetValue(value);
    return Boolean(
      parsed
      && selectedCategorySlugs.has(parsed.categorySlug)
      && getFacetDefsForCategory(parsed.categorySlug).some((def) => def.param === parsed.param),
    );
  });

  return {
    ...state,
    categories,
    brands: state.brands.filter((brandId) => availableBrandIds.has(brandId)),
    types: sanitizeScopedSelections(state.types),
    applications: state.applications.filter((value) => availableApplications.has(value as typeof APPLICATION_FILTERS[number]['value'])),
    collections: sanitizeScopedSelections(state.collections),
    facets,
  };
}

function toggleSelection(current: string[], value: string): string[] {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

function FilterButton({
  active,
  label,
  count,
  onClick,
  disabled = false,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-11 w-full items-center gap-2.5 py-2 text-left text-[12px] leading-5 transition-colors lg:min-h-0 lg:py-0.5 ${
        disabled ? 'cursor-not-allowed text-ink-700 opacity-50' : 'text-ink-700 hover:text-ink-900'
      }`}
      aria-pressed={active}
    >
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center border ${
          active ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white'
        }`}
        aria-hidden="true"
      >
        {active ? <CheckIcon className="h-2.5 w-2.5" /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {typeof count === 'number' ? (
        <span className="text-[12px] text-ink-400">{count}</span>
      ) : null}
    </button>
  );
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-ink-200 py-3 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="mb-2 flex min-h-11 w-full items-center justify-between text-left lg:min-h-0"
        aria-expanded={isOpen}
      >
        <span className="text-[11px] font-semibold uppercase tracking-label text-ink-700">{title}</span>
        <ChevronDownIcon className={`h-3.5 w-3.5 text-ink-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen ? children : null}
    </div>
  );
}

function ExpandableFilterOptions({
  options,
  selectedValues,
  renderOption,
  limit = 8,
  forceExpanded = false,
}: {
  options: CountOption[];
  selectedValues: string[];
  renderOption: (option: CountOption) => ReactNode;
  limit?: number;
  forceExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleOptions = getVisibleFilterOptions(
    options,
    selectedValues,
    expanded || forceExpanded,
    limit,
  );
  const hiddenCount = Math.max(options.length - visibleOptions.length, 0);
  const canToggle = !forceExpanded && options.length > limit;

  return (
    <>
      <div className="space-y-0.5">
        {visibleOptions.map(renderOption)}
      </div>
      {canToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-2 min-h-11 text-left text-[12px] font-semibold text-ink-800 underline-offset-4 hover:underline lg:min-h-0"
        >
          {expanded ? 'Prikaži manje' : `Prikaži još (${hiddenCount})`}
        </button>
      ) : null}
    </>
  );
}

function SearchableFilterOptions({
  options,
  selectedValues,
  renderOption,
  placeholder,
}: {
  options: CountOption[];
  selectedValues: string[];
  renderOption: (option: CountOption) => ReactNode;
  placeholder: string;
}) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const matchingOptions = normalizedQuery
    ? options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
    : options;

  return (
    <>
      {options.length > 12 ? (
        <label className="mb-2 flex h-11 items-center gap-2 border border-ink-200 px-3 text-ink-500 lg:h-8 lg:px-2">
          <SearchIcon className="h-3.5 w-3.5" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] text-ink-900 outline-none placeholder:text-ink-400"
          />
        </label>
      ) : null}
      {matchingOptions.length > 0 ? (
        <ExpandableFilterOptions
          options={matchingOptions}
          selectedValues={selectedValues}
          renderOption={renderOption}
          forceExpanded={Boolean(normalizedQuery)}
        />
      ) : (
        <p className="py-2 text-[12px] text-ink-500">Nema odgovarajućih opcija.</p>
      )}
    </>
  );
}

export default function HomeProductTabs({ groups, brandsRecord, initialFilterState }: HomeProductTabsProps) {
  const catalogInitialFilterState = useMemo(
    () => initialFilterState ? sanitizeFilterStateAgainstCatalog(initialFilterState, groups, brandsRecord) : undefined,
    [brandsRecord, groups, initialFilterState],
  );
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>(() => catalogInitialFilterState?.categories.slice() || []);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>(() => catalogInitialFilterState?.brands.slice() || []);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => catalogInitialFilterState?.types.slice() || []);
  const [selectedApplications, setSelectedApplications] = useState<string[]>(() => catalogInitialFilterState?.applications.slice() || []);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(() => catalogInitialFilterState?.collections.slice() || []);
  const [selectedFacetValues, setSelectedFacetValues] = useState<string[]>(() => catalogInitialFilterState?.facets.slice() || []);
  const [thicknessRange, setThicknessRange] = useState<[number, number] | null>(() => catalogInitialFilterState?.thickness || null);
  const [brandQuery, setBrandQuery] = useState('');
  const [sortMode, setSortMode] = useState<HomepageSortMode>(() => catalogInitialFilterState?.sort || 'featured');
  const [activeProductTab, setActiveProductTab] = useState<'collections' | 'colors'>(() => catalogInitialFilterState?.tab || 'collections');
  const [visibleProductCount, setVisibleProductCount] = useState(INITIAL_PRODUCT_LIMIT);
  const [loadedColorGroups, setLoadedColorGroups] = useState<Record<string, Product[]>>({});
  const [colorLoadError, setColorLoadError] = useState<string | null>(null);
  const [colorLoadAttempt, setColorLoadAttempt] = useState(0);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const hasUserScrolledRef = useRef(false);
  const drawerCloseButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerReturnFocusRef = useRef<HTMLElement | null>(null);
  const historyReadyRef = useRef(false);
  const applyingHistoryRef = useRef(false);
  const historyModeRef = useRef<'push' | 'replace'>('push');

  const filterUrlState = useMemo<HomeFilterUrlState>(() => ({
    categories: selectedCategorySlugs,
    brands: selectedBrandIds,
    types: selectedTypes,
    applications: selectedApplications,
    collections: selectedCollections,
    facets: selectedFacetValues,
    thickness: thicknessRange,
    tab: activeProductTab,
    sort: sortMode,
  }), [
    activeProductTab,
    selectedApplications,
    selectedBrandIds,
    selectedCategorySlugs,
    selectedCollections,
    selectedFacetValues,
    selectedTypes,
    sortMode,
    thicknessRange,
  ]);

  useEffect(() => {
    const restoreFromHistory = () => {
      const state = sanitizeFilterStateAgainstCatalog(
        parseHomeFilterUrlState(window.location.search),
        groups,
        brandsRecord,
      );
      const canonicalParams = serializeHomeFilterUrlState(state, window.location.search);
      const canonicalSearch = canonicalParams.toString();
      const canonicalUrl = `${window.location.pathname}${canonicalSearch ? `?${canonicalSearch}` : ''}${window.location.hash}`;
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (canonicalUrl !== currentUrl) {
        window.history.replaceState(null, '', canonicalUrl);
      }
      applyingHistoryRef.current = true;
      setSelectedCategorySlugs(state.categories);
      setSelectedBrandIds(state.brands);
      setSelectedTypes(state.types);
      setSelectedApplications(state.applications);
      setSelectedCollections(state.collections);
      setSelectedFacetValues(state.facets);
      setThicknessRange(state.thickness);
      setActiveProductTab(state.tab);
      setSortMode(state.sort);
      setBrandQuery('');
      setIsFilterDrawerOpen(false);
    };

    window.addEventListener('popstate', restoreFromHistory);
    return () => window.removeEventListener('popstate', restoreFromHistory);
  }, [brandsRecord, groups]);

  useEffect(() => {
    const params = serializeHomeFilterUrlState(filterUrlState, window.location.search);
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (!historyReadyRef.current) {
      historyReadyRef.current = true;
      if (nextUrl !== currentUrl) {
        // Tokom prvog child efekta Next-ov history patch možda još nije montiran;
        // sačuvaj njegov postojeći tree state umesto da ga obrišeš sa `null`.
        window.history.replaceState(window.history.state, '', nextUrl);
      }
      return;
    }

    if (applyingHistoryRef.current) {
      applyingHistoryRef.current = false;
      historyModeRef.current = 'push';
      return;
    }

    const mode = historyModeRef.current;
    historyModeRef.current = 'push';

    if (nextUrl !== currentUrl) {
      window.history[mode === 'replace' ? 'replaceState' : 'pushState'](null, '', nextUrl);
    }
  }, [filterUrlState]);

  // Zaključaj scroll pozadine dok je mobilna fioka filtera otvorena
  // (isti obrazac kao nekadašnji ProductFilters drawer).
  useScrollLock(isFilterDrawerOpen);

  // Header na početnoj emituje događaj jer se filter state namerno nalazi u
  // katalog komponenti, a mobilni trigger vizuelno pripada globalnom headeru.
  useEffect(() => {
    const openFilters = () => {
      drawerReturnFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      setIsFilterDrawerOpen(true);
    };

    window.addEventListener(OPEN_HOME_FILTERS_EVENT, openFilters);
    return () => window.removeEventListener(OPEN_HOME_FILTERS_EVENT, openFilters);
  }, []);

  // Escape, pravi Tab focus-trap i povratak fokusa.
  useEffect(() => {
    if (!isFilterDrawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsFilterDrawerOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !drawerRef.current) {
        return;
      }

      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) {
        event.preventDefault();
        drawerRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    drawerCloseButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const returnTarget = drawerReturnFocusRef.current;
      if (returnTarget?.isConnected) {
        returnTarget.focus();
      }
    };
  }, [isFilterDrawerOpen]);

  // Ako se viewport proširi na desktop, zatvori CSS-sakrivenu fioku i oslobodi scroll.
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) setIsFilterDrawerOpen(false);
    };

    closeOnDesktop(desktop);
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    const markUserScroll = () => {
      hasUserScrolledRef.current = true;
    };

    window.addEventListener('scroll', markUserScroll, { passive: true });
    return () => window.removeEventListener('scroll', markUserScroll);
  }, []);

  useEffect(() => {
    const availableSlugs = new Set(groups.map((group) => group.category.slug));
    setSelectedCategorySlugs((current) => {
      if (current.length === 0) {
        return current;
      }

      const next = current.filter((slug) => availableSlugs.has(slug));
      if (next.length !== current.length) {
        historyModeRef.current = 'replace';
      }
      return next.length === current.length ? current : next;
    });
  }, [groups]);

  const displayGroups = groups;
  const categorySlugById = useMemo(
    () => new Map(displayGroups.map((group) => [group.category.id, group.category.slug])),
    [displayGroups],
  );
  const categoryOptions = useMemo(
    () => displayGroups.map((group) => ({
      slug: group.category.slug,
      name: group.category.name,
      count: activeProductTab === 'colors' ? (group.colorCount || 0) : group.totalCount,
    })),
    [activeProductTab, displayGroups],
  );

  const selectedCategorySet = useMemo(() => new Set(selectedCategorySlugs), [selectedCategorySlugs]);
  const selectedGroups = useMemo(
    () => displayGroups.filter((group) => selectedCategorySet.has(group.category.slug)),
    [displayGroups, selectedCategorySet],
  );
  const tabGroups = useMemo(
    () => (selectedCategorySlugs.length > 0 ? selectedGroups : displayGroups),
    [displayGroups, selectedCategorySlugs.length, selectedGroups],
  );
  const collectionBaseProducts = useMemo(
    () => dedupeProductsBySlug(tabGroups.flatMap((group) => group.products)),
    [tabGroups],
  );
  const colorCategoryIds = useMemo(
    () => tabGroups
      .filter((group) => (group.colorCount || 0) > 0)
      .map((group) => group.category.id),
    [tabGroups],
  );
  const missingColorCategoryIds = useMemo(
    () => colorCategoryIds.filter((categoryId) => !loadedColorGroups[categoryId]),
    [colorCategoryIds, loadedColorGroups],
  );
  const missingColorCategoryIdsKey = missingColorCategoryIds.join(',');

  useEffect(() => {
    if (activeProductTab !== 'colors') {
      return;
    }

    if (!missingColorCategoryIdsKey) {
      setColorLoadError(null);
      return;
    }

    const categoryIds = missingColorCategoryIdsKey.split(',').filter(Boolean);
    let cancelled = false;

    setColorLoadError(null);

    fetch(`/api/home-colors?categoryIds=${encodeURIComponent(categoryIds.join(','))}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json() as Promise<{ groups?: Array<{ categoryId: string; products: Product[] }> }>;
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setLoadedColorGroups((current) => {
          const next = { ...current };

          for (const group of payload.groups || []) {
            next[group.categoryId] = group.products || [];
          }

          return next;
        });
      })
      .catch((error) => {
        if (!cancelled) {
          setColorLoadError(error instanceof Error ? error.message : 'Boje nisu učitane');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeProductTab, colorLoadAttempt, missingColorCategoryIdsKey]);

  const missingFacetColorCategoryIdsKey = useMemo(() => {
    if (selectedCategorySlugs.length === 0) {
      return '';
    }

    return tabGroups
      .filter((group) => getFacetDefsForCategory(group.category.slug).length > 0)
      .filter((group) => (group.colorCount || 0) > 0 && !loadedColorGroups[group.category.id])
      .map((group) => group.category.id)
      .join(',');
  }, [loadedColorGroups, selectedCategorySlugs.length, tabGroups]);

  // FILTERI 2.0: tihi prefetch boja za izabrane kategorije sa novim facet grupama.
  // Mape nasleđivanja (boja↔kolekcija) su potpune tek sa bojama — kolekcijski header
  // bez svog spec-a (npr. vinil „Ton") nasleđuje uniju vrednosti svojih boja, isto kao
  // server na /kategorije. Bez loading/error UI-ja: tab Kolekcije radi i dok boje ne stignu.
  useEffect(() => {
    if (activeProductTab === 'colors' || !missingFacetColorCategoryIdsKey) {
      return;
    }

    const categoryIds = missingFacetColorCategoryIdsKey.split(',').filter(Boolean);
    let cancelled = false;

    fetch(`/api/home-colors?categoryIds=${encodeURIComponent(categoryIds.join(','))}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json() as Promise<{ groups?: Array<{ categoryId: string; products: Product[] }> }>;
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setLoadedColorGroups((current) => {
          const next = { ...current };

          for (const group of payload.groups || []) {
            if (!next[group.categoryId]) {
              next[group.categoryId] = group.products || [];
            }
          }

          return next;
        });
      })
      .catch(() => {
        // Tiho: facet grupe rade i nad samim kolekcijskim headerima.
      });

    return () => {
      cancelled = true;
    };
  }, [activeProductTab, missingFacetColorCategoryIdsKey]);

  const colorBaseProducts = useMemo(
    () => dedupeProductsBySlug(tabGroups.flatMap((group) => loadedColorGroups[group.category.id] || group.colorProducts || [])),
    [loadedColorGroups, tabGroups],
  );
  const baseProducts = activeProductTab === 'colors' ? colorBaseProducts : collectionBaseProducts;
  const collectionTabCount = collectionBaseProducts.length;
  const colorTabCount = tabGroups.reduce(
    (sum, group) => sum + (group.colorCount ?? loadedColorGroups[group.category.id]?.length ?? group.colorProducts?.length ?? 0),
    0,
  );
  const isLoadingColors = activeProductTab === 'colors'
    && missingColorCategoryIds.length > 0
    && !colorLoadError;

  const selectedCategorySlug = selectedCategorySlugs.length === 1 ? selectedCategorySlugs[0] : null;
  const singleSelectedGroup = selectedCategorySlug
    ? displayGroups.find((group) => group.category.slug === selectedCategorySlug)
    : null;
  const activeName = singleSelectedGroup?.category.name || (selectedCategorySlugs.length > 1 ? 'Katalog' : 'Sve kolekcije');
  const activeDescription = singleSelectedGroup
    ? CATEGORY_DESCRIPTIONS[singleSelectedGroup.category.slug] || 'Pregled kolekcija i dekora za stambene, poslovne i tehničke prostore.'
    : 'Izaberite jednu ili više kategorija, zatim suzite izbor po brendu, tipu, primeni i kolekciji.';

  const filterBaseProductsByCategoryId = useMemo(() => {
    const map = new Map<string, Product[]>();

    for (const group of tabGroups) {
      const products = activeProductTab === 'colors'
        ? dedupeProductsBySlug(loadedColorGroups[group.category.id] || group.colorProducts || [])
        : group.products;
      map.set(group.category.id, products);
    }

    return map;
  }, [activeProductTab, loadedColorGroups, tabGroups]);

  // FILTERI 2.0: mape nasleđivanja boja↔kolekcija po kategoriji, izračunate JEDNOM
  // po datasetu (kolekcijski headeri + učitane boje) i memoizovane — isti obrazac
  // kao server na /kategorije (buildFacetInheritanceMaps nad celom kategorijom).
  const facetInheritanceBySlug = useMemo(() => {
    const map = new Map<string, FacetInheritanceMaps>();

    if (selectedCategorySlugs.length === 0) {
      return map;
    }

    for (const group of tabGroups) {
      const defs = getFacetDefsForCategory(group.category.slug);
      if (defs.length === 0) {
        continue;
      }

      const unionProducts = [
        ...group.products,
        ...(loadedColorGroups[group.category.id] || group.colorProducts || []),
      ];
      map.set(group.category.slug, buildFacetInheritanceMaps(unionProducts, defs));
    }

    return map;
  }, [loadedColorGroups, selectedCategorySlugs.length, tabGroups]);

  const facetSelectionsBySlug = useMemo(() => {
    const map = new Map<string, FacetSelections>();

    for (const scoped of selectedFacetValues) {
      const parsed = parseScopedFacetValue(scoped);
      if (!parsed) {
        continue;
      }

      const selections = map.get(parsed.categorySlug) || {};
      selections[parsed.param] = [...(selections[parsed.param] || []), parsed.value];
      map.set(parsed.categorySlug, selections);
    }

    return map;
  }, [selectedFacetValues]);

  // 'include' na tabu „Boje": boja bez podatka (ni nasleđenog) OSTAJE vidljiva —
  // isti režim kao CategoryTabs; tab Kolekcije prati strikt server listing ('exclude').
  const facetMissingPolicy: FacetMissingPolicy = activeProductTab === 'colors' ? 'include' : 'exclude';

  // Proizvod prolazi facet grupe ISKLJUČIVO svoje kategorije (proizvod druge
  // kategorije nije isključen tuđom grupom); skip = brojanje "preko ostalih grupa".
  const productMatchesActiveFacets = useCallback(
    (product: Product, skip?: { categorySlug: string; param: string }) => {
      const categorySlug = categorySlugById.get(product.categoryId);
      if (!categorySlug) {
        return true;
      }

      const selections = facetSelectionsBySlug.get(categorySlug);
      if (!selections) {
        return true;
      }

      const defs = getFacetDefsForCategory(categorySlug);
      if (defs.length === 0) {
        return true;
      }

      const effectiveSelections = skip && skip.categorySlug === categorySlug && selections[skip.param]
        ? { ...selections, [skip.param]: [] }
        : selections;

      return productMatchesFacetSelections(
        product,
        effectiveSelections,
        defs,
        facetInheritanceBySlug.get(categorySlug),
        facetMissingPolicy,
      );
    },
    [categorySlugById, facetInheritanceBySlug, facetMissingPolicy, facetSelectionsBySlug],
  );

  const rawBrandOptions = useMemo(
    () => buildBrandOptions(baseProducts, brandsRecord, Number.MAX_SAFE_INTEGER),
    [baseProducts, brandsRecord],
  );
  const rawTypeOptionGroups = useMemo<ScopedOptionGroup[]>(
    () => {
      if (selectedCategorySlugs.length === 0) {
        return [];
      }

      return tabGroups.flatMap((group) => {
        const rawOptions = buildValueOptions(
          filterBaseProductsByCategoryId.get(group.category.id) || [],
          (product) => getSpecValue(product, ['type', 'tip']),
          Number.MAX_SAFE_INTEGER,
          group.category.slug === VINYL_CATEGORY_SLUG ? formatVinylTypeLabel : undefined,
        );
        const options = group.category.slug === VINYL_CATEGORY_SLUG
          ? rawOptions
            .filter((option) => ['heterogeni', 'homogeni'].includes(option.value))
            .sort((a, b) => ['heterogeni', 'homogeni'].indexOf(a.value) - ['heterogeni', 'homogeni'].indexOf(b.value))
          : rawOptions;

        if (options.length === 0) {
          return [];
        }

        return [{
          category: group.category,
          title: TYPE_FILTER_TITLES[group.category.slug] || `Tip ${group.category.name.toLowerCase()}`,
          options: options.map((option) => ({
            ...option,
            value: buildScopedOptionValue(group.category.slug, option.value),
          })),
        }];
      });
    },
    [filterBaseProductsByCategoryId, selectedCategorySlugs.length, tabGroups],
  );
  const rawApplicationOptions = useMemo(
    () => buildApplicationOptions(baseProducts),
    [baseProducts],
  );
  const rawCollectionOptionGroups = useMemo<ScopedOptionGroup[]>(
    () => {
      if (selectedCategorySlugs.length === 0) {
        return [];
      }

      return tabGroups.flatMap((group) => {
        const options = buildValueOptions(
          filterBaseProductsByCategoryId.get(group.category.id) || [],
          getCollectionFilterValue,
          Number.MAX_SAFE_INTEGER,
        );

        if (options.length === 0) {
          return [];
        }

        return [{
          category: group.category,
          title: COLLECTION_FILTER_TITLES[group.category.slug] || `Kolekcije ${group.category.name.toLowerCase()}`,
          options: options.map((option) => ({
            ...option,
            value: buildScopedOptionValue(group.category.slug, option.value),
          })),
        }];
      });
    },
    [filterBaseProductsByCategoryId, selectedCategorySlugs.length, tabGroups],
  );
  const thicknessBounds = useMemo(() => {
    const values = baseProducts
      .map(parseThicknessValue)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

    if (values.length === 0) {
      return { min: 1, max: 8, hasData: false };
    }

    return {
      min: Math.floor(Math.min(...values) * 10) / 10,
      max: Math.ceil(Math.max(...values) * 10) / 10,
      hasData: true,
    };
  }, [baseProducts]);
  const effectiveThicknessRange = useMemo(
    () => thicknessRange || ([thicknessBounds.min, thicknessBounds.max] as [number, number]),
    [thicknessBounds.max, thicknessBounds.min, thicknessRange],
  );
  useEffect(() => {
    if (!thicknessRange) return;

    if (!thicknessBounds.hasData) {
      historyModeRef.current = 'replace';
      setThicknessRange(null);
      return;
    }

    const nextMin = Math.max(thicknessBounds.min, Math.min(thicknessRange[0], thicknessBounds.max));
    const nextMax = Math.max(nextMin, Math.min(thicknessRange[1], thicknessBounds.max));
    if (nextMin !== thicknessRange[0] || nextMax !== thicknessRange[1]) {
      historyModeRef.current = 'replace';
      setThicknessRange([nextMin, nextMax]);
    }
  }, [thicknessBounds.hasData, thicknessBounds.max, thicknessBounds.min, thicknessRange]);
  const thicknessFiltered = thicknessRange !== null
    && (effectiveThicknessRange[0] > thicknessBounds.min || effectiveThicknessRange[1] < thicknessBounds.max);
  const colorDecorCount = colorTabCount;

  // Deljivi predikat ume da preskoči samo grupu čiji broj trenutno računamo.
  // Time OR ostaje unutar grupe, a sve druge grupe nastavljaju da rade kao AND.
  const productMatchesBaseRefinements = useMemo(() => {
    const selectedBrandSet = new Set(selectedBrandIds);
    const selectedTypeMap = buildScopedSelectionMap(selectedTypes);
    const selectedApplicationSet = new Set(selectedApplications);
    const selectedCollectionMap = buildScopedSelectionMap(selectedCollections);

    return (product: Product, skip?: RefinementSkip): boolean => {
      if (skip?.group !== 'brand' && selectedBrandSet.size > 0 && !selectedBrandSet.has(product.brandId)) {
        return false;
      }

      const categorySlug = categorySlugById.get(product.categoryId);
      const selectedTypesForCategory = categorySlug ? selectedTypeMap.get(categorySlug) : null;
      const skipsType = skip?.group === 'type' && skip.categorySlug === categorySlug;
      if (!skipsType && selectedTypesForCategory && selectedTypesForCategory.size > 0) {
        const type = getSpecValue(product, ['type', 'tip']);
        const formattedType = type ? (categorySlug === VINYL_CATEGORY_SLUG ? formatVinylTypeLabel(type) : type) : null;
        if (!formattedType || !selectedTypesForCategory.has(normalizeOptionValue(formattedType))) {
          return false;
        }
      }

      const applicationMatches = getApplicationMatches(product);
      if (skip?.group !== 'application' && selectedApplicationSet.size > 0 && !applicationMatches.some((value) => selectedApplicationSet.has(value))) {
        return false;
      }

      const selectedCollectionsForCategory = categorySlug ? selectedCollectionMap.get(categorySlug) : null;
      const skipsCollection = skip?.group === 'collection' && skip.categorySlug === categorySlug;
      if (!skipsCollection && selectedCollectionsForCategory && selectedCollectionsForCategory.size > 0) {
        const collection = getCollectionFilterValue(product);
        if (!collection || !selectedCollectionsForCategory.has(normalizeOptionValue(collection))) {
          return false;
        }
      }

      if (skip?.group !== 'thickness' && thicknessFiltered && thicknessBounds.hasData) {
        const thickness = parseThicknessValue(product);
        if (thickness === null || thickness < effectiveThicknessRange[0] || thickness > effectiveThicknessRange[1]) {
          return false;
        }
      }

      return true;
    };
  }, [
    categorySlugById,
    effectiveThicknessRange,
    selectedApplications,
    selectedBrandIds,
    selectedCollections,
    selectedTypes,
    thicknessBounds.hasData,
    thicknessFiltered,
  ]);

  const baseRefinementPredicate = useCallback(
    (product: Product) => productMatchesBaseRefinements(product),
    [productMatchesBaseRefinements],
  );

  const brandOptions = useMemo(
    () => withLiveOptionCounts(
      rawBrandOptions,
      baseProducts,
      (product) => [product.brandId],
      (product) => productMatchesBaseRefinements(product, { group: 'brand' }) && productMatchesActiveFacets(product),
    ),
    [baseProducts, productMatchesActiveFacets, productMatchesBaseRefinements, rawBrandOptions],
  );
  const visibleBrandOptions = useMemo(
    () => brandOptions.filter((option) => option.label.toLowerCase().includes(brandQuery.trim().toLowerCase())),
    [brandOptions, brandQuery],
  );

  const typeOptionGroups = useMemo<ScopedOptionGroup[]>(
    () => rawTypeOptionGroups.map((group) => {
      const categoryProducts = filterBaseProductsByCategoryId.get(group.category.id) || [];
      return {
        ...group,
        options: withLiveOptionCounts(
          group.options,
          categoryProducts,
          (product) => {
            const rawType = getSpecValue(product, ['type', 'tip']);
            if (!rawType) return [];
            const label = group.category.slug === VINYL_CATEGORY_SLUG ? formatVinylTypeLabel(rawType) : rawType;
            return [buildScopedOptionValue(group.category.slug, normalizeOptionValue(label))];
          },
          (product) => productMatchesBaseRefinements(product, {
            group: 'type',
            categorySlug: group.category.slug,
          }) && productMatchesActiveFacets(product),
        ),
      };
    }),
    [filterBaseProductsByCategoryId, productMatchesActiveFacets, productMatchesBaseRefinements, rawTypeOptionGroups],
  );

  const applicationOptions = useMemo(
    () => withLiveOptionCounts(
      rawApplicationOptions,
      baseProducts,
      getApplicationMatches,
      (product) => productMatchesBaseRefinements(product, { group: 'application' }) && productMatchesActiveFacets(product),
    ),
    [baseProducts, productMatchesActiveFacets, productMatchesBaseRefinements, rawApplicationOptions],
  );

  const collectionOptionGroups = useMemo<ScopedOptionGroup[]>(
    () => rawCollectionOptionGroups.map((group) => {
      const categoryProducts = filterBaseProductsByCategoryId.get(group.category.id) || [];
      return {
        ...group,
        options: withLiveOptionCounts(
          group.options,
          categoryProducts,
          (product) => {
            const collection = getCollectionFilterValue(product);
            return collection
              ? [buildScopedOptionValue(group.category.slug, normalizeOptionValue(collection))]
              : [];
          },
          (product) => productMatchesBaseRefinements(product, {
            group: 'collection',
            categorySlug: group.category.slug,
          }) && productMatchesActiveFacets(product),
        ),
      };
    }),
    [filterBaseProductsByCategoryId, productMatchesActiveFacets, productMatchesBaseRefinements, rawCollectionOptionGroups],
  );

  const canSortByPrice = useMemo(() => hasPricedProducts(baseProducts), [baseProducts]);
  useEffect(() => {
    if (sortMode === 'price' && !canSortByPrice) {
      historyModeRef.current = 'replace';
      setSortMode('featured');
    }
  }, [canSortByPrice, sortMode]);

  const filteredProducts = useMemo(
    () => sortHomepageProducts(
      baseProducts.filter((product) => baseRefinementPredicate(product) && productMatchesActiveFacets(product)),
      sortMode,
    ),
    [baseProducts, baseRefinementPredicate, productMatchesActiveFacets, sortMode],
  );

  // FILTERI 2.0: nove facet sekcije po izabranim kategorijama (unija grupa kad ih je
  // više). Pojavljuju se po ISTOM obrascu kao „Tip laminata" — tek kad je kategorija
  // izabrana. Brojač opcije = rezultati te opcije preko ostalih aktivnih filtera
  // (kao /kategorije); opcija sa 0 rezultata se sivi, izabrana se nikad ne zaključava.
  const facetSectionGroups = useMemo<FacetSectionGroup[]>(() => {
    if (selectedCategorySlugs.length === 0) {
      return [];
    }

    const multipleCategories = selectedCategorySlugs.length > 1;

    return tabGroups.flatMap((group) => {
      const defs = getFacetDefsForCategory(group.category.slug);
      if (defs.length === 0) {
        return [];
      }

      const categoryProducts = filterBaseProductsByCategoryId.get(group.category.id) || [];
      const inheritMaps = facetInheritanceBySlug.get(group.category.slug) || {};
      const selectionsForCategory = facetSelectionsBySlug.get(group.category.slug);

      return defs.flatMap((def) => {
        const inheritMap = inheritMaps[def.param];
        // Boolean grupa (podno grejanje) je namerno jedna opcija 'Da' (URL vrednost '1').
        const values = def.boolean ? ['Da'] : collectFacetOptionValues(categoryProducts, def, inheritMap);
        const hasSelection = Boolean(selectionsForCategory?.[def.param]?.length);

        const options: CountOption[] = values.map((value) => {
          const selectedValues = def.boolean ? ['1'] : [value];
          const count = categoryProducts.reduce((sum, product) => (
            baseRefinementPredicate(product)
              && productMatchesActiveFacets(product, { categorySlug: group.category.slug, param: def.param })
              && productMatchesFacetDef(product, selectedValues, def, { inheritMap, missing: facetMissingPolicy })
              ? sum + 1
              : sum
          ), 0);

          return {
            value: buildScopedFacetValue(group.category.slug, def.param, def.boolean ? '1' : value),
            label: facetOptionLabel(def, value),
            count,
          };
        });

        if (def.boolean) {
          // Krije se samo kad nema pokrivenih proizvoda (kao /kategorije).
          if (!options[0] || (options[0].count === 0 && !hasSelection)) {
            return [];
          }
        } else if (options.length < 2) {
          // Auto-hide: grupa sa <2 opcije nema diskriminatornu vrednost (kao /kategorije).
          return [];
        }

        return [{
          category: group.category,
          def,
          // Sa više izabranih kategorija iste labele bi se sudarale (Ton vinila vs
          // parketa) — kategorija u zagradi, po uzoru na per-kategorijske Tip naslove.
          title: multipleCategories ? `${def.label} (${group.category.name})` : def.label,
          options,
        }];
      });
    });
  }, [
    baseRefinementPredicate,
    facetInheritanceBySlug,
    facetMissingPolicy,
    facetSelectionsBySlug,
    filterBaseProductsByCategoryId,
    productMatchesActiveFacets,
    selectedCategorySlugs,
    tabGroups,
  ]);

  const validTypeValues = useMemo(
    () => new Set(rawTypeOptionGroups.flatMap((group) => group.options.map((option) => option.value))),
    [rawTypeOptionGroups],
  );
  const validCollectionValues = useMemo(
    () => new Set(rawCollectionOptionGroups.flatMap((group) => group.options.map((option) => option.value))),
    [rawCollectionOptionGroups],
  );
  const validFacetValues = useMemo<Set<string> | null>(() => {
    if (missingFacetColorCategoryIdsKey) {
      return null;
    }

    const values = new Set<string>();
    for (const group of tabGroups) {
      const categoryProducts = filterBaseProductsByCategoryId.get(group.category.id) || [];
      const inheritance = facetInheritanceBySlug.get(group.category.slug) || {};

      for (const def of getFacetDefsForCategory(group.category.slug)) {
        const inheritMap = inheritance[def.param];
        if (def.boolean) {
          const hasTrueValue = categoryProducts.some((product) => productMatchesFacetDef(
            product,
            ['1'],
            def,
            { inheritMap, missing: 'exclude' },
          ));
          if (hasTrueValue) {
            values.add(buildScopedFacetValue(group.category.slug, def.param, '1'));
          }
          continue;
        }

        for (const value of collectFacetOptionValues(categoryProducts, def, inheritMap)) {
          values.add(buildScopedFacetValue(group.category.slug, def.param, value));
        }
      }
    }

    return values;
  }, [facetInheritanceBySlug, filterBaseProductsByCategoryId, missingFacetColorCategoryIdsKey, tabGroups]);

  useEffect(() => {
    const scopedOptionsReady = activeProductTab === 'collections' || missingColorCategoryIds.length === 0;

    if (scopedOptionsReady) {
      setSelectedTypes((current) => {
        const next = current.filter((value) => validTypeValues.has(value));
        if (next.length !== current.length) historyModeRef.current = 'replace';
        return next.length === current.length ? current : next;
      });
      setSelectedCollections((current) => {
        const next = current.filter((value) => validCollectionValues.has(value));
        if (next.length !== current.length) historyModeRef.current = 'replace';
        return next.length === current.length ? current : next;
      });
    }

    if (validFacetValues) {
      setSelectedFacetValues((current) => {
        const next = current.filter((value) => validFacetValues.has(value));
        if (next.length !== current.length) historyModeRef.current = 'replace';
        return next.length === current.length ? current : next;
      });
    }
  }, [activeProductTab, missingColorCategoryIds.length, validCollectionValues, validFacetValues, validTypeValues]);

  const activeProductCount = activeProductTab === 'colors' && missingColorCategoryIds.length > 0
    ? colorTabCount
    : filteredProducts.length;

  useEffect(() => {
    hasUserScrolledRef.current = false;
    setVisibleProductCount(INITIAL_PRODUCT_LIMIT);
  }, [filteredProducts]);

  const loadNextProductRow = useCallback(() => {
    setVisibleProductCount((current) => Math.min(
      current + getNextProductRowSize(),
      filteredProducts.length,
    ));
  }, [filteredProducts.length]);

  const visibleProducts = filteredProducts.slice(0, visibleProductCount);
  const hasMoreProducts = visibleProducts.length < filteredProducts.length;

  useEffect(() => {
    const loadVisibleRowOnScroll = () => {
      hasUserScrolledRef.current = true;
      const target = loadMoreRef.current;
      if (!target || !hasMoreProducts) {
        return;
      }

      const rect = target.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 160 && rect.bottom >= -160) {
        loadNextProductRow();
      }
    };

    window.addEventListener('scroll', loadVisibleRowOnScroll, { passive: true });
    return () => window.removeEventListener('scroll', loadVisibleRowOnScroll);
  }, [hasMoreProducts, loadNextProductRow]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMoreProducts || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (hasUserScrolledRef.current && entries.some((entry) => entry.isIntersecting)) {
        loadNextProductRow();
      }
    }, { rootMargin: '0px 0px 160px 0px' });

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMoreProducts, loadNextProductRow, visibleProductCount]);

  const resetRefinements = () => {
    setSelectedBrandIds([]);
    setSelectedTypes([]);
    setSelectedApplications([]);
    setSelectedCollections([]);
    setSelectedFacetValues([]);
    setThicknessRange(null);
    setBrandQuery('');
    setSortMode('featured');
  };

  const resetFilters = () => {
    setSelectedCategorySlugs([]);
    resetRefinements();
  };

  const toggleCategoryFilter = (slug: string) => {
    setSelectedCategorySlugs((current) => toggleSelection(current, slug));
    resetRefinements();
  };

  const updateThicknessMin = (value: number) => {
    historyModeRef.current = 'replace';
    setThicknessRange((current) => {
      const [, currentMax] = current || [thicknessBounds.min, thicknessBounds.max];
      return [Math.min(value, currentMax), currentMax];
    });
  };

  const updateThicknessMax = (value: number) => {
    historyModeRef.current = 'replace';
    setThicknessRange((current) => {
      const [currentMin] = current || [thicknessBounds.min, thicknessBounds.max];
      return [currentMin, Math.max(value, currentMin)];
    });
  };

  const typeOptionLookup = useMemo(() => {
    const lookup = new Map<string, { label: string; sectionTitle: string }>();

    for (const group of typeOptionGroups) {
      for (const option of group.options) {
        lookup.set(option.value, { label: option.label, sectionTitle: group.title });
      }
    }

    return lookup;
  }, [typeOptionGroups]);

  const collectionOptionLookup = useMemo(() => {
    const lookup = new Map<string, { label: string; sectionTitle: string }>();

    for (const group of collectionOptionGroups) {
      for (const option of group.options) {
        lookup.set(option.value, { label: option.label, sectionTitle: group.title });
      }
    }

    return lookup;
  }, [collectionOptionGroups]);

  const activeFilterChips = [
    ...selectedCategorySlugs.flatMap((slug) => {
      const category = categoryOptions.find((option) => option.slug === slug);
      return category
        ? [{
          id: `category-${slug}`,
          label: category.name,
          onRemove: () => {
            setSelectedCategorySlugs((current) => current.filter((item) => item !== slug));
            resetRefinements();
          },
        }]
        : [];
    }),
    ...selectedBrandIds.flatMap((id) => {
      const brand = brandOptions.find((option) => option.value === id);
      return [{
        id: `brand-${id}`,
        label: brand?.label || brandsRecord[id]?.name || `Brend ${id}`,
        onRemove: () => setSelectedBrandIds((current) => current.filter((item) => item !== id)),
      }];
    }),
    ...selectedTypes.flatMap((value) => {
      const option = typeOptionLookup.get(value);
      const parsed = parseScopedOptionValue(value);
      if (!parsed) return [];
      const sectionTitle = option?.sectionTitle || TYPE_FILTER_TITLES[parsed.categorySlug] || 'Tip';
      return [{
        id: `type-${value}`,
        label: `${sectionTitle}: ${option?.label || parsed.optionValue}`,
        onRemove: () => setSelectedTypes((current) => current.filter((item) => item !== value)),
      }];
    }),
    ...selectedApplications.flatMap((value) => {
      const option = applicationOptions.find((item) => item.value === value);
      const fallback = APPLICATION_FILTERS.find((item) => item.value === value);
      return [{
        id: `application-${value}`,
        label: option?.label || fallback?.label || value,
        onRemove: () => setSelectedApplications((current) => current.filter((item) => item !== value)),
      }];
    }),
    ...selectedCollections.flatMap((value) => {
      const option = collectionOptionLookup.get(value);
      const parsed = parseScopedOptionValue(value);
      if (!parsed) return [];
      const sectionTitle = option?.sectionTitle || COLLECTION_FILTER_TITLES[parsed.categorySlug] || 'Kolekcija';
      return [{
        id: `collection-${value}`,
        label: `${sectionTitle}: ${option?.label || parsed.optionValue}`,
        onRemove: () => setSelectedCollections((current) => current.filter((item) => item !== value)),
      }];
    }),
    // Čipovi novih facet grupa — ljudske vrednosti kao na /kategorije
    // („Klasa 33", „Riblja kost", „Podno grejanje").
    ...selectedFacetValues.flatMap((scoped) => {
      const parsed = parseScopedFacetValue(scoped);
      const def = parsed
        ? getFacetDefsForCategory(parsed.categorySlug).find((item) => item.param === parsed.param)
        : undefined;
      return parsed && def
        ? [{
          id: `facet-${scoped}`,
          label: facetChipLabel(def, parsed.value),
          onRemove: () => setSelectedFacetValues((current) => current.filter((item) => item !== scoped)),
        }]
        : [];
    }),
    ...(thicknessFiltered && thicknessBounds.hasData
      ? [{
        id: 'thickness',
        label: `${formatMm(effectiveThicknessRange[0])} - ${formatMm(effectiveThicknessRange[1])}`,
        onRemove: () => setThicknessRange(null),
      }]
      : []),
  ];

  // DELJENI PANEL FILTERA: desktop <aside> i mobilna fioka renderuju ISTI JSX
  // kroz ovu funkciju (state je ionako zajednički u komponenti — nula dupliranja
  // logike). Fioka ima svoje zaglavlje („Filteri" + X) i dno („Prikaži N rezultata"
  // + „Očisti sve"), pa preskače mali desktop header preko withHeader flag-a.
  const renderFilterPanel = (withHeader: boolean) => (
    <>
      {withHeader ? (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-ink-900">Filteri</h2>
          <button
            type="button"
            onClick={resetFilters}
            className="text-[11px] text-ink-500 transition-colors hover:text-ink-900"
          >
            Očisti sve
          </button>
        </div>
      ) : null}

      <FilterSection title="Kategorija">
        <ExpandableFilterOptions
          options={categoryOptions.map((item) => ({ value: item.slug, label: item.name, count: item.count }))}
          selectedValues={selectedCategorySlugs}
          renderOption={(item) => (
            <FilterButton
              key={item.value}
              active={selectedCategorySlugs.includes(item.value)}
              label={item.label}
              count={item.count}
              onClick={() => toggleCategoryFilter(item.value)}
            />
          )}
        />
      </FilterSection>

      {typeOptionGroups.map((group) => (
        <FilterSection key={`type-${group.category.slug}`} title={group.title}>
          <ExpandableFilterOptions
            options={group.options}
            selectedValues={selectedTypes}
            renderOption={(option) => {
              const active = selectedTypes.includes(option.value);
              return (
                <FilterButton
                  key={option.value}
                  active={active}
                  label={option.label}
                  count={option.count}
                  disabled={option.count === 0 && !active}
                  onClick={() => setSelectedTypes((current) => toggleSelection(current, option.value))}
                />
              );
            }}
          />
        </FilterSection>
      ))}

      {facetSectionGroups.map((group) => (
        <FilterSection
          key={`facet-${group.category.slug}-${group.def.param}`}
          title={group.title}
          defaultOpen={!group.def.collapsed || group.options.some((option) => selectedFacetValues.includes(option.value))}
        >
          <ExpandableFilterOptions
            options={group.options}
            selectedValues={selectedFacetValues}
            renderOption={(option) => {
              const active = selectedFacetValues.includes(option.value);
              return (
                <FilterButton
                  key={option.value}
                  active={active}
                  label={option.label}
                  count={option.count}
                  disabled={option.count === 0 && !active}
                  onClick={() => setSelectedFacetValues((current) => toggleSelection(current, option.value))}
                />
              );
            }}
          />
        </FilterSection>
      ))}

      {applicationOptions.length > 0 ? (
        <FilterSection title="Primena">
          <ExpandableFilterOptions
            options={applicationOptions}
            selectedValues={selectedApplications}
            renderOption={(option) => {
              const active = selectedApplications.includes(option.value);
              return (
                <FilterButton
                  key={option.value}
                  active={active}
                  label={option.label}
                  count={option.count}
                  disabled={option.count === 0 && !active}
                  onClick={() => setSelectedApplications((current) => toggleSelection(current, option.value))}
                />
              );
            }}
          />
        </FilterSection>
      ) : null}

      {thicknessBounds.hasData ? (
        <FilterSection title="Debljina">
          <div className="grid grid-cols-2 gap-2 pb-1 pt-1">
            <label className="text-[11px] text-ink-500">
              <span>Od</span>
              <div className="mt-1 flex h-11 items-center border border-ink-200 px-3 lg:h-8 lg:px-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min={thicknessBounds.min}
                  max={effectiveThicknessRange[1]}
                  step="0.1"
                  value={effectiveThicknessRange[0]}
                  onChange={(event) => {
                    if (Number.isFinite(event.currentTarget.valueAsNumber)) {
                      updateThicknessMin(event.currentTarget.valueAsNumber);
                    }
                  }}
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] text-ink-900 outline-none"
                  aria-label="Minimalna debljina"
                />
                <span className="text-[11px] text-ink-400">mm</span>
              </div>
            </label>
            <label className="text-[11px] text-ink-500">
              <span>Do</span>
              <div className="mt-1 flex h-11 items-center border border-ink-200 px-3 lg:h-8 lg:px-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min={effectiveThicknessRange[0]}
                  max={thicknessBounds.max}
                  step="0.1"
                  value={effectiveThicknessRange[1]}
                  onChange={(event) => {
                    if (Number.isFinite(event.currentTarget.valueAsNumber)) {
                      updateThicknessMax(event.currentTarget.valueAsNumber);
                    }
                  }}
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] text-ink-900 outline-none"
                  aria-label="Maksimalna debljina"
                />
                <span className="text-[11px] text-ink-400">mm</span>
              </div>
            </label>
          </div>
        </FilterSection>
      ) : null}

      {brandOptions.length > 0 ? (
        <FilterSection title="Brand / brend">
          <label className="mb-2 flex h-11 items-center gap-2 border border-ink-200 px-3 text-ink-500 lg:h-8 lg:px-2">
            <SearchIcon className="h-3.5 w-3.5" />
            <input
              type="search"
              value={brandQuery}
              onChange={(event) => setBrandQuery(event.target.value)}
              placeholder="Pretraži brend..."
              aria-label="Pretraži brendove"
              className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] text-ink-900 outline-none placeholder:text-ink-400"
            />
          </label>
          <ExpandableFilterOptions
            options={visibleBrandOptions}
            selectedValues={selectedBrandIds}
            forceExpanded={Boolean(brandQuery.trim())}
            renderOption={(option) => {
              const active = selectedBrandIds.includes(option.value);
              return (
                <FilterButton
                  key={option.value}
                  active={active}
                  label={option.label}
                  count={option.count}
                  disabled={option.count === 0 && !active}
                  onClick={() => setSelectedBrandIds((current) => toggleSelection(current, option.value))}
                />
              );
            }}
          />
          {brandQuery.trim() && brandOptions.length > visibleBrandOptions.length ? (
            <button
              type="button"
              onClick={() => setBrandQuery('')}
              className="mt-2 text-[12px] font-semibold text-ink-800 transition-colors hover:text-ink-500"
            >
              Očisti pretragu
            </button>
          ) : null}
        </FilterSection>
      ) : null}

      {collectionOptionGroups.map((group) => (
        <FilterSection key={`collection-${group.category.slug}`} title={group.title} defaultOpen={false}>
          <SearchableFilterOptions
            options={group.options}
            selectedValues={selectedCollections}
            placeholder={`Pretraži ${group.title.toLowerCase()}...`}
            renderOption={(option) => {
              const active = selectedCollections.includes(option.value);
              return (
                <FilterButton
                  key={option.value}
                  active={active}
                  label={option.label}
                  count={option.count}
                  disabled={option.count === 0 && !active}
                  onClick={() => setSelectedCollections((current) => toggleSelection(current, option.value))}
                />
              );
            }}
          />
        </FilterSection>
      ))}
    </>
  );

  return (
    <section className="bg-white">
      <h1 className="sr-only">Podovi.online katalog proizvoda</h1>

      <div className="mx-auto w-full max-w-[1536px] px-6 pb-16 pt-2 md:pt-6 lg:pb-20">
        <div className="grid gap-8 lg:grid-cols-[262px_minmax(0,1fr)] xl:gap-11">
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
            <div className="border border-ink-200 bg-white p-4">
              {renderFilterPanel(true)}
            </div>

            <div className="border border-ink-200 bg-white p-4">
              <h2 className="text-[16px] font-semibold text-ink-900">Imate projekat?</h2>
              <p className="mt-2 text-[12px] leading-5 text-ink-700">
                Pošaljite nam upit i dobićete ponudu u najkraćem roku.
              </p>
              <Link href="/upiti" className="mt-4 flex h-10 w-full items-center justify-between bg-ink-900 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-ink-700">
                Pošalji upit
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <div className="mt-4 space-y-2 text-[12px] text-ink-700">
                {['Brz odgovor', 'Stručna podrška', 'Najbolje rešenje'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            </div>
          </aside>

          <div className="relative min-w-0 pt-0 md:pt-2">
            <div className="pb-0 md:pb-3">
              <div className="hidden flex-col gap-5 md:flex md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                    <h2 className="text-[30px] font-semibold leading-tight text-ink-900 md:text-[32px]">
                      {activeName}
                    </h2>
                    <span className="pb-1.5 text-[12px] text-ink-500">
                      {activeProductCount} {activeProductTab === 'colors' ? 'boja' : 'kolekcija'}
                    </span>
                  </div>
                  <p className="mt-2 max-w-3xl text-[13px] leading-6 text-ink-700">
                    {activeDescription}
                  </p>
                </div>

              </div>

              {/* Na telefonu summary copy je sakriven; ostaju samo aktivni filter čipovi.
                  Otvaranje fioke je u desnom uglu globalnog headera. */}
              {activeFilterChips.length > 0 ? (
                <div className="flex items-center border-y border-ink-200 py-2 md:mt-5 lg:hidden">
                  <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto" aria-label="Aktivni filteri">
                  {activeFilterChips.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={chip.onRemove}
                      aria-label={`Ukloni filter ${chip.label}`}
                      className="inline-flex h-8 shrink-0 items-center gap-2 border border-ink-200 bg-white px-2.5 text-[12px] text-ink-800 transition-colors hover:border-ink-900"
                    >
                      {chip.label}
                      <span className="text-ink-500" aria-hidden="true">×</span>
                    </button>
                  ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Desktop red čipova — na mobilnom aktivni čipovi žive u redu uz „Filteri" trigger */}
            {activeFilterChips.length > 0 ? (
              <div className="mb-5 hidden flex-wrap items-center gap-2 border-y border-ink-200 py-3 lg:flex">
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={chip.onRemove}
                    aria-label={`Ukloni filter ${chip.label}`}
                    className="inline-flex h-8 items-center gap-2 border border-ink-200 bg-white px-2.5 text-[12px] text-ink-800 transition-colors hover:border-ink-900"
                  >
                    {chip.label}
                    <span className="text-ink-500" aria-hidden="true">×</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-8 px-1 text-[12px] font-semibold text-ink-900 underline underline-offset-4"
                >
                  Očisti sve
                </button>
              </div>
            ) : null}

            <div className="mb-5 flex flex-col gap-3 border-b border-ink-200 text-[12px] text-ink-500 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-8">
                <button
                  type="button"
                  onClick={() => setActiveProductTab('collections')}
                  aria-pressed={activeProductTab === 'collections'}
                  className={`pb-3 transition-colors ${
                    activeProductTab === 'collections'
                      ? 'border-b-[3px] border-ink-900 font-medium text-ink-900'
                      : 'border-b-[3px] border-transparent text-ink-500 hover:text-ink-900'
                  }`}
                >
                  Kolekcije ({collectionTabCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveProductTab('colors')}
                  aria-pressed={activeProductTab === 'colors'}
                  className={`pb-3 transition-colors ${
                    activeProductTab === 'colors'
                      ? 'border-b-[3px] border-ink-900 font-medium text-ink-900'
                      : 'border-b-[3px] border-transparent text-ink-500 hover:text-ink-900'
                  }`}
                >
                  Boje ({colorDecorCount})
                </button>
              </div>
              <label className="mb-3 flex w-full flex-col gap-2 text-[12px] text-ink-500 sm:mb-2 sm:w-[180px]">
                <span className="sr-only">Sortiraj proizvode</span>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as HomepageSortMode)}
                  className="h-9 w-full border border-ink-200 bg-white px-3 text-[12px] text-ink-900 outline-none transition-colors focus:border-ink-900"
                >
                  <option value="featured">Sortiraj: Preporučeno</option>
                  <option value="name">Sortiraj: Naziv</option>
                  {canSortByPrice ? <option value="price">Sortiraj: Cena</option> : null}
                </select>
              </label>
            </div>

            {isLoadingColors ? (
              <div className="border border-ink-200 bg-white p-12 text-center">
                <h3 className="mb-2 text-lg font-medium text-ink-900">Učitavam boje</h3>
                <p className="text-[13px] text-ink-500">Pripremamo dekore za izabrane kategorije.</p>
              </div>
            ) : colorLoadError ? (
              <div className="border border-ink-200 bg-white p-12 text-center">
                <h3 className="mb-2 text-lg font-medium text-ink-900">Boje nisu učitane</h3>
                <p className="text-[13px] text-ink-500">Pokušajte ponovo za nekoliko trenutaka.</p>
                <button
                  type="button"
                  onClick={() => setColorLoadAttempt((current) => current + 1)}
                  className="mt-4 border border-ink-200 bg-white px-4 py-2 text-[12px] font-semibold text-ink-900 transition-colors hover:border-ink-900"
                >
                  Pokušaj ponovo
                </button>
              </div>
            ) : visibleProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-3 xl:grid-cols-4">
                  {visibleProducts.map((product) => (
                    <ProductCardClient
                      key={`${activeProductTab}-${selectedCategorySlugs.join('-') || 'all'}-${product.id}`}
                      product={product}
                      brand={brandsRecord[product.brandId] || null}
                      compact={activeProductTab === 'colors'}
                    />
                  ))}
                </div>
                {hasMoreProducts ? (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    <button
                      type="button"
                      onClick={loadNextProductRow}
                      className="border border-ink-200 bg-white px-4 py-2 text-[12px] font-semibold text-ink-900 transition-colors hover:border-ink-900"
                    >
                      Učitaj još {activeProductTab === 'colors' ? 'boja' : 'kolekcija'}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="border border-ink-200 bg-white p-12 text-center">
                <h3 className="mb-2 text-lg font-medium text-ink-900">Nema proizvoda</h3>
                <p className="text-[13px] text-ink-500">Promeni filtere ili izaberi drugu kategoriju.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILNA FIOKA FILTERA: overlay + panel zdesna iznad lepljivog headera (z-50).
          Sadržaj = ISTI deljeni panel kao desktop <aside>; dno sa živim brojem
          rezultata. Obrazac (scroll lock, Escape, fokus) kao nekadašnji ProductFilters. */}
      {isFilterDrawerOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/20"
            aria-hidden="true"
            onClick={() => setIsFilterDrawerOpen(false)}
          />

          <div
            id="home-filter-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-filter-drawer-title"
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex h-[100dvh] w-full max-w-md flex-col border-l border-ink-200 bg-white"
          >
            <div className="flex items-center justify-between border-b border-ink-200 px-6 py-4">
              <h2 id="home-filter-drawer-title" className="text-[14px] font-semibold text-ink-900">Filteri</h2>
              <button
                type="button"
                ref={drawerCloseButtonRef}
                onClick={() => setIsFilterDrawerOpen(false)}
                aria-label="Zatvori filtere"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-900 transition-opacity hover:opacity-60"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-6 py-6">
              {renderFilterPanel(false)}
            </div>

            <div className="flex gap-3 border-t border-ink-200 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              {activeFilterChips.length > 0 ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn-secondary flex-1"
                >
                  Očisti sve
                </button>
              ) : null}
              {activeProductTab === 'colors' && colorLoadError ? (
                <button
                  type="button"
                  onClick={() => setColorLoadAttempt((current) => current + 1)}
                  className="btn-primary flex-1"
                >
                  Pokušaj ponovo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  disabled={isLoadingColors}
                  className="btn-primary flex-1 disabled:cursor-wait disabled:opacity-60"
                  data-testid="home-filters-drawer-apply"
                >
                  {isLoadingColors
                    ? 'Učitavam rezultate…'
                    : `Prikaži ${activeProductCount} ${pluralizeResults(activeProductCount)}`}
                </button>
              )}
              <span className="sr-only" role="status" aria-live="polite">
                {isLoadingColors ? 'Učitavam rezultate' : `${activeProductCount} ${pluralizeResults(activeProductCount)}`}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
