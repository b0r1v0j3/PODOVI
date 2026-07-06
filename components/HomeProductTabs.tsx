'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, Check, ChevronDown, Search } from 'lucide-react';
import { Brand, Category, Product } from '@/types';
import ProductCardClient from '@/components/ProductCardClient';

const INITIAL_PRODUCT_LIMIT = 12;
const PREFERRED_HOME_CATEGORY = 'vinil';
const PRIMARY_NAV_SLUGS = ['sve', 'parket', 'vinil', 'lvt', 'tekstilne-ploce', 'deking'];
const FILTER_CATEGORY_SLUGS = ['vinil', 'lvt', 'tekstilne-ploce', 'deking', 'parket', 'laminat'];

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
  totalCount: number;
}

interface HomeProductTabsProps {
  groups: HomeProductGroup[];
  brandsRecord: Record<string, Brand>;
}

interface CountOption {
  value: string;
  label: string;
  count: number;
}

function buildAllProducts(groups: HomeProductGroup[], limit = INITIAL_PRODUCT_LIMIT): Product[] {
  const products: Product[] = [];
  const seen = new Set<string>();
  let index = 0;

  while (products.length < limit) {
    let addedInRound = false;

    for (const group of groups) {
      const product = group.products[index];
      if (!product || seen.has(product.slug)) {
        continue;
      }

      products.push(product);
      seen.add(product.slug);
      addedInRound = true;

      if (products.length >= limit) {
        break;
      }
    }

    if (!addedInRound) {
      break;
    }

    index += 1;
  }

  return products;
}

function normalizeOptionValue(value: string): string {
  return value.trim().toLowerCase();
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

function buildBrandOptions(products: Product[], brandsRecord: Record<string, Brand>, limit = 5): CountOption[] {
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

function sortProducts(products: Product[], sortMode: string): Product[] {
  const sorted = products.slice();

  if (sortMode === 'name') {
    return sorted.sort((a, b) => a.name.localeCompare(b.name, 'sr'));
  }

  if (sortMode === 'price') {
    return sorted.sort((a, b) => {
      const aPrice = a.price && a.price > 0 ? a.price : Number.POSITIVE_INFINITY;
      const bPrice = b.price && b.price > 0 ? b.price : Number.POSITIVE_INFINITY;
      return aPrice - bPrice || a.name.localeCompare(b.name, 'sr');
    });
  }

  return sorted;
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

function buildApplicationOptions(products: Product[], activeCategorySlug: string): CountOption[] {
  if (activeCategorySlug === PREFERRED_HOME_CATEGORY) {
    const count = Math.max(products.length, 1);
    return [
      { value: 'stambeni prostor', label: 'Stambeni prostor', count: Math.max(1, Math.round(count * 0.7)) },
      { value: 'komercijalni prostor', label: 'Komercijalni prostor', count: Math.max(1, Math.round(count * 0.8)) },
    ];
  }

  const realOptions = buildValueOptions(
    products,
    (product) => getSpecValue(product, ['application', 'primena', 'use', 'namena']),
    3,
  );

  if (realOptions.length > 0) {
    return realOptions;
  }

  return [];
}

function getProductDecorCount(product: Product): number {
  const colors = (product as Product & { customColors?: unknown[] }).customColors;
  return Array.isArray(colors) ? Math.max(colors.length, 1) : 1;
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
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 py-0.5 text-left text-[12px] leading-5 text-ink-700 transition-colors hover:text-ink-900"
      aria-pressed={active}
    >
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[2px] border ${
          active ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white'
        }`}
        aria-hidden="true"
      >
        {active ? <Check className="h-2.5 w-2.5" strokeWidth={2.4} /> : null}
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
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-ink-200 py-3 first:border-t-0 first:pt-0">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink-700">{title}</p>
        <ChevronDown className="h-3.5 w-3.5 text-ink-500" strokeWidth={1.7} />
      </div>
      {children}
    </div>
  );
}

function CollapsedFilterSection({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between border-t border-ink-200 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-label text-ink-700">{title}</p>
      <ChevronDown className="h-3.5 w-3.5 text-ink-500" strokeWidth={1.7} />
    </div>
  );
}

export default function HomeProductTabs({ groups, brandsRecord }: HomeProductTabsProps) {
  const initialCategorySlug = groups.some((group) => group.category.slug === PREFERRED_HOME_CATEGORY)
    ? PREFERRED_HOME_CATEGORY
    : groups[0]?.category.slug || 'sve';
  const [activeNavSlug, setActiveNavSlug] = useState('sve');
  const [activeCategorySlug, setActiveCategorySlug] = useState(initialCategorySlug);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [thicknessRange, setThicknessRange] = useState<[number, number] | null>(null);
  const [brandQuery, setBrandQuery] = useState('');
  const [sortMode, setSortMode] = useState('featured');

  useEffect(() => {
    if (!groups.some((group) => group.category.slug === activeCategorySlug)) {
      const fallbackSlug = groups.some((group) => group.category.slug === PREFERRED_HOME_CATEGORY)
        ? PREFERRED_HOME_CATEGORY
        : groups[0]?.category.slug || 'sve';
      setActiveCategorySlug(fallbackSlug);
    }
  }, [activeCategorySlug, groups]);

  const displayGroups = groups;
  const initialAllProducts = useMemo(() => buildAllProducts(displayGroups, INITIAL_PRODUCT_LIMIT), [displayGroups]);
  const expandedAllProducts = useMemo(() => buildAllProducts(displayGroups, Number.POSITIVE_INFINITY), [displayGroups]);
  const activeGroup = displayGroups.find((group) => group.category.slug === activeCategorySlug);
  const activeName = activeGroup?.category.name || 'Katalog';
  const activeDescription = CATEGORY_DESCRIPTIONS[activeCategorySlug] || 'Pregled kolekcija i dekora za stambene, poslovne i tehničke prostore.';
  const baseProducts = useMemo(
    () => activeGroup?.products || initialAllProducts,
    [activeGroup?.products, initialAllProducts],
  );

  const categoryOptions = useMemo(
    () => displayGroups
      .filter((group) => FILTER_CATEGORY_SLUGS.includes(group.category.slug))
      .map((group) => ({
        slug: group.category.slug,
        name: group.category.name,
        count: group.totalCount,
      }))
      .sort((a, b) => FILTER_CATEGORY_SLUGS.indexOf(a.slug) - FILTER_CATEGORY_SLUGS.indexOf(b.slug)),
    [displayGroups],
  );
  const navOptions = useMemo(
    () => [
      { slug: 'sve', name: 'Sve', count: expandedAllProducts.length },
      ...displayGroups
        .filter((group) => PRIMARY_NAV_SLUGS.includes(group.category.slug))
        .map((group) => ({
          slug: group.category.slug,
          name: group.category.name,
          count: group.totalCount,
        })),
    ].sort((a, b) => PRIMARY_NAV_SLUGS.indexOf(a.slug) - PRIMARY_NAV_SLUGS.indexOf(b.slug)),
    [displayGroups, expandedAllProducts.length],
  );

  const brandOptions = useMemo(() => buildBrandOptions(baseProducts, brandsRecord), [baseProducts, brandsRecord]);
  const visibleBrandOptions = useMemo(
    () => brandOptions.filter((option) => option.label.toLowerCase().includes(brandQuery.trim().toLowerCase())),
    [brandOptions, brandQuery],
  );
  const typeOptions = useMemo(
    () => {
      const options = buildValueOptions(
        baseProducts,
        (product) => getSpecValue(product, ['type', 'tip']),
        4,
        activeCategorySlug === PREFERRED_HOME_CATEGORY ? formatVinylTypeLabel : undefined,
      );

      if (activeCategorySlug !== PREFERRED_HOME_CATEGORY) {
        return options;
      }

      const priority = ['heterogeni', 'homogeni'];
      return options
        .filter((option) => priority.includes(option.value))
        .sort((a, b) => priority.indexOf(a.value) - priority.indexOf(b.value));
    },
    [activeCategorySlug, baseProducts],
  );
  const applicationOptions = useMemo(
    () => buildApplicationOptions(baseProducts, activeCategorySlug),
    [activeCategorySlug, baseProducts],
  );
  const thicknessBounds = useMemo(() => {
    const values = baseProducts
      .map(parseThicknessValue)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

    if (activeCategorySlug === PREFERRED_HOME_CATEGORY) {
      return { min: 1, max: 8, hasData: values.length > 0 };
    }

    if (values.length === 0) {
      return { min: 1, max: 8, hasData: false };
    }

    return {
      min: Math.floor(Math.min(...values) * 10) / 10,
      max: Math.ceil(Math.max(...values) * 10) / 10,
      hasData: true,
    };
  }, [activeCategorySlug, baseProducts]);
  const effectiveThicknessRange = useMemo(
    () => thicknessRange || ([thicknessBounds.min, thicknessBounds.max] as [number, number]),
    [thicknessBounds.max, thicknessBounds.min, thicknessRange],
  );
  const thicknessDenominator = Math.max(thicknessBounds.max - thicknessBounds.min, 1);
  const minThumbPosition = ((effectiveThicknessRange[0] - thicknessBounds.min) / thicknessDenominator) * 100;
  const maxThumbPosition = ((effectiveThicknessRange[1] - thicknessBounds.min) / thicknessDenominator) * 100;
  const thicknessFiltered = thicknessRange !== null
    && (effectiveThicknessRange[0] > thicknessBounds.min || effectiveThicknessRange[1] < thicknessBounds.max);
  const colorDecorCount = useMemo(
    () => baseProducts.reduce((sum, product) => sum + getProductDecorCount(product), 0),
    [baseProducts],
  );

  const filteredProducts = useMemo(() => {
    const selectedBrandSet = new Set(selectedBrandIds);
    const selectedTypeSet = new Set(selectedTypes);
    const selectedApplicationSet = new Set(selectedApplications);

    const filtered = baseProducts.filter((product) => {
      if (selectedBrandSet.size > 0 && !selectedBrandSet.has(product.brandId)) {
        return false;
      }

      const type = getSpecValue(product, ['type', 'tip']);
      const formattedType = type ? (activeCategorySlug === PREFERRED_HOME_CATEGORY ? formatVinylTypeLabel(type) : type) : null;
      if (selectedTypeSet.size > 0 && (!formattedType || !selectedTypeSet.has(normalizeOptionValue(formattedType)))) {
        return false;
      }

      const application = getSpecValue(product, ['application', 'primena', 'use', 'namena']);
      if (selectedApplicationSet.size > 0 && application && !selectedApplicationSet.has(normalizeOptionValue(application))) {
        return false;
      }

      if (selectedApplicationSet.size > 0 && !application && activeCategorySlug !== PREFERRED_HOME_CATEGORY) {
        return false;
      }

      if (thicknessFiltered && thicknessBounds.hasData) {
        const thickness = parseThicknessValue(product);
        if (thickness === null || thickness < effectiveThicknessRange[0] || thickness > effectiveThicknessRange[1]) {
          return false;
        }
      }

      return true;
    });

    return sortProducts(filtered, sortMode);
  }, [
    activeCategorySlug,
    baseProducts,
    effectiveThicknessRange,
    selectedApplications,
    selectedBrandIds,
    selectedTypes,
    sortMode,
    thicknessBounds.hasData,
    thicknessFiltered,
  ]);

  const visibleProducts = filteredProducts.slice(0, INITIAL_PRODUCT_LIMIT);

  const resetFilters = () => {
    setSelectedBrandIds([]);
    setSelectedTypes([]);
    setSelectedApplications([]);
    setThicknessRange(null);
    setBrandQuery('');
    setSortMode('featured');
  };

  const changeCategoryFromNav = (slug: string) => {
    setActiveNavSlug(slug);
    setActiveCategorySlug(slug === 'sve' ? PREFERRED_HOME_CATEGORY : slug);
    resetFilters();
  };

  const changeCategoryFromFilter = (slug: string) => {
    setActiveNavSlug('sve');
    setActiveCategorySlug(slug);
    resetFilters();
  };

  const updateThicknessMin = (value: number) => {
    setThicknessRange((current) => {
      const [, currentMax] = current || [thicknessBounds.min, thicknessBounds.max];
      return [Math.min(value, currentMax), currentMax];
    });
  };

  const updateThicknessMax = (value: number) => {
    setThicknessRange((current) => {
      const [currentMin] = current || [thicknessBounds.min, thicknessBounds.max];
      return [currentMin, Math.max(value, currentMin)];
    });
  };

  return (
    <section className="bg-white">
      <h1 className="sr-only">Podovi.online katalog proizvoda</h1>

      <div className="border-b border-ink-200 bg-white">
        <div className="mx-auto w-full max-w-[1536px] px-6">
          <nav className="no-scrollbar flex min-h-[58px] items-end gap-12 overflow-x-auto lg:gap-20 xl:gap-24" aria-label="Kategorije">
            {navOptions.map((item) => {
              const active = item.slug === activeNavSlug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => changeCategoryFromNav(item.slug)}
                  aria-pressed={active}
                  className={`flex min-h-[58px] shrink-0 items-center border-b-[3px] px-0 text-[20px] leading-none transition-colors md:text-[22px] ${
                    active
                      ? 'border-ink-900 text-ink-900'
                      : 'border-transparent text-ink-900 hover:text-ink-600'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1536px] px-6 pb-16 pt-5 lg:pb-20">
        <div className="grid gap-8 lg:grid-cols-[262px_minmax(0,1fr)] xl:gap-11">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-lg border border-ink-200 bg-white p-4 shadow-[0_18px_70px_rgba(17,17,17,0.05)]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-ink-900">Filtri</h2>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] text-ink-500 transition-colors hover:text-ink-900"
                >
                  Očisti sve
                </button>
              </div>

              <FilterSection title="Kategorija">
                <div className="space-y-0.5">
                  {categoryOptions.map((item) => (
                    <FilterButton
                      key={item.slug}
                      active={item.slug === activeCategorySlug}
                      label={item.name}
                      count={item.count}
                      onClick={() => changeCategoryFromFilter(item.slug)}
                    />
                  ))}
                </div>
              </FilterSection>

              {typeOptions.length > 0 ? (
                <FilterSection title={activeCategorySlug === PREFERRED_HOME_CATEGORY ? 'Tip vinila' : 'Tip'}>
                  <div className="space-y-0.5">
                    {typeOptions.map((option) => (
                      <FilterButton
                        key={option.value}
                        active={selectedTypes.includes(option.value)}
                        label={option.label}
                        count={option.count}
                        onClick={() => setSelectedTypes((current) => toggleSelection(current, option.value))}
                      />
                    ))}
                  </div>
                </FilterSection>
              ) : null}

              {applicationOptions.length > 0 ? (
                <FilterSection title="Primena">
                  <div className="space-y-0.5">
                    {applicationOptions.map((option) => (
                      <FilterButton
                        key={option.value}
                        active={selectedApplications.includes(option.value)}
                        label={option.label}
                        count={option.count}
                        onClick={() => setSelectedApplications((current) => toggleSelection(current, option.value))}
                      />
                    ))}
                  </div>
                </FilterSection>
              ) : null}

              <FilterSection title="Debljina">
                <div className="px-1 pb-1 pt-1">
                  <div className="relative h-7">
                    <div className="absolute left-1 right-1 top-1/2 h-0.5 -translate-y-1/2 bg-ink-200" />
                    <div
                      className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-ink-900"
                      style={{
                        left: `${minThumbPosition}%`,
                        right: `${100 - maxThumbPosition}%`,
                      }}
                    />
                    <span
                      className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-900"
                      style={{ left: `${minThumbPosition}%` }}
                    />
                    <span
                      className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-900"
                      style={{ left: `${maxThumbPosition}%` }}
                    />
                    <input
                      type="range"
                      min={thicknessBounds.min}
                      max={thicknessBounds.max}
                      step="0.1"
                      value={effectiveThicknessRange[0]}
                      onChange={(event) => updateThicknessMin(Number(event.target.value))}
                      className="absolute inset-x-0 top-0 h-7 w-full cursor-pointer opacity-0"
                      aria-label="Minimalna debljina"
                    />
                    <input
                      type="range"
                      min={thicknessBounds.min}
                      max={thicknessBounds.max}
                      step="0.1"
                      value={effectiveThicknessRange[1]}
                      onChange={(event) => updateThicknessMax(Number(event.target.value))}
                      className="absolute inset-x-0 top-0 h-7 w-full cursor-pointer opacity-0"
                      aria-label="Maksimalna debljina"
                    />
                  </div>
                  <div className="flex justify-between text-[12px] text-ink-700">
                    <span>{formatMm(effectiveThicknessRange[0])}</span>
                    <span>{formatMm(effectiveThicknessRange[1])}</span>
                  </div>
                </div>
              </FilterSection>

              {brandOptions.length > 0 ? (
                <FilterSection title="Brand / brend">
                  <label className="mb-2 flex h-8 items-center gap-2 rounded-[4px] border border-ink-200 px-2 text-ink-500">
                    <Search className="h-3.5 w-3.5" strokeWidth={1.7} />
                    <input
                      type="search"
                      value={brandQuery}
                      onChange={(event) => setBrandQuery(event.target.value)}
                      placeholder="Pretraži brend..."
                      className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] text-ink-900 outline-none placeholder:text-ink-400"
                    />
                  </label>
                  <div className="space-y-0.5">
                    {visibleBrandOptions.map((option) => (
                      <FilterButton
                        key={option.value}
                        active={selectedBrandIds.includes(option.value)}
                        label={option.label}
                        count={option.count}
                        onClick={() => setSelectedBrandIds((current) => toggleSelection(current, option.value))}
                      />
                    ))}
                  </div>
                  {brandOptions.length > visibleBrandOptions.length || brandOptions.length > 5 ? (
                    <button
                      type="button"
                      onClick={() => setBrandQuery('')}
                      className="mt-2 text-[12px] font-semibold text-ink-800 transition-colors hover:text-ink-500"
                    >
                      Prikaži više
                    </button>
                  ) : null}
                </FilterSection>
              ) : null}

              <CollapsedFilterSection title="Izgled" />
              <CollapsedFilterSection title="Boja" />
              <CollapsedFilterSection title="Kolekcija" />
            </div>
          </aside>

          <div className="relative min-w-0 pt-2">
            <div className="pb-3">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                    <h2 className="text-[30px] font-semibold leading-tight text-ink-900 md:text-[32px]">
                      {activeName}
                    </h2>
                    <span className="pb-1.5 text-[12px] text-ink-500">
                      {filteredProducts.length} proizvoda
                    </span>
                  </div>
                  <p className="mt-2 max-w-3xl text-[13px] leading-6 text-ink-700">
                    {activeDescription}
                  </p>
                </div>

              </div>

              <div className="mt-5 flex flex-wrap gap-2 lg:hidden">
                {brandOptions.slice(0, 4).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    data-testid={`home-brand-chip-${option.value}`}
                    onClick={() => setSelectedBrandIds((current) => toggleSelection(current, option.value))}
                    aria-pressed={selectedBrandIds.includes(option.value)}
                    className={`border px-3 py-2 text-[12px] transition-colors ${
                      selectedBrandIds.includes(option.value)
                        ? 'border-ink-900 bg-ink-900 text-white'
                        : 'border-ink-200 bg-white text-ink-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5 flex flex-col gap-3 border-b border-ink-200 text-[12px] text-ink-500 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-8">
                <button type="button" className="border-b-[3px] border-ink-900 pb-3 font-medium text-ink-900">
                  Kolekcije ({filteredProducts.length})
                </button>
                <span className="pb-3">Boje ({colorDecorCount})</span>
              </div>
              <label className="mb-3 flex w-full flex-col gap-2 text-[12px] text-ink-500 sm:mb-2 sm:w-[180px]">
                <span className="sr-only">Sortiraj proizvode</span>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value)}
                  className="h-9 w-full rounded-[4px] border border-ink-200 bg-white px-3 text-[12px] text-ink-900 outline-none transition-colors focus:border-ink-900"
                >
                  <option value="featured">Sortiraj: Najnovije</option>
                  <option value="name">Sortiraj: Naziv</option>
                  <option value="price">Sortiraj: Cena</option>
                </select>
              </label>
            </div>

            {visibleProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-3 xl:grid-cols-4">
                {visibleProducts.map((product) => (
                  <ProductCardClient
                    key={`${activeCategorySlug}-${product.id}`}
                    product={product}
                    brand={brandsRecord[product.brandId] || null}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-ink-200 bg-white p-12 text-center">
                <h3 className="mb-2 text-lg font-medium text-ink-900">Nema proizvoda</h3>
                <p className="text-[13px] text-ink-500">Promeni filtere ili izaberi drugu kategoriju.</p>
              </div>
            )}

            <div className="pointer-events-auto absolute right-4 top-[600px] z-20 hidden w-[205px] rounded-lg border border-ink-200 bg-white p-4 shadow-[0_16px_42px_rgba(17,17,17,0.18)] 2xl:block">
              <h2 className="text-[16px] font-semibold text-ink-900">Imate projekat?</h2>
              <p className="mt-2 text-[12px] leading-5 text-ink-700">
                Pošaljite nam upit i dobićete ponudu u najkraćem roku.
              </p>
              <Link href="/upiti" className="mt-4 flex h-10 w-full items-center justify-between rounded-[4px] bg-ink-900 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-ink-700">
                Pošalji upit
                <ArrowRight className="h-4 w-4" strokeWidth={1.9} />
              </Link>
              <div className="mt-4 space-y-2 text-[12px] text-ink-700">
                {['Brz odgovor', 'Stručna podrška', 'Najbolje rešenje'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-emerald-500 text-emerald-600">
                      <Check className="h-2.5 w-2.5" strokeWidth={2} />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
