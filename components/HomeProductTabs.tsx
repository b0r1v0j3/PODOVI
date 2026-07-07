'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Brand, Category, Product } from '@/types';
import ProductCardClient from '@/components/ProductCardClient';

const INITIAL_PRODUCT_LIMIT = 12;
const VINYL_CATEGORY_SLUG = 'vinil';
const LVT_CATEGORY_SLUG = 'lvt';

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
}

interface CountOption {
  value: string;
  label: string;
  count: number;
}

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
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-ink-200 py-3 first:border-t-0 first:pt-0">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-label text-ink-700">{title}</p>
        <ChevronDownIcon className="h-3.5 w-3.5 text-ink-500" />
      </div>
      {children}
    </div>
  );
}

export default function HomeProductTabs({ groups, brandsRecord }: HomeProductTabsProps) {
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [thicknessRange, setThicknessRange] = useState<[number, number] | null>(null);
  const [brandQuery, setBrandQuery] = useState('');
  const [sortMode, setSortMode] = useState('featured');
  const [activeProductTab, setActiveProductTab] = useState<'collections' | 'colors'>('collections');
  const [visibleProductCount, setVisibleProductCount] = useState(INITIAL_PRODUCT_LIMIT);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const hasUserScrolledRef = useRef(false);

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
      return next.length === current.length ? current : next;
    });
  }, [groups]);

  const displayGroups = groups;
  const categoryOptions = useMemo(
    () => displayGroups.map((group) => ({
      slug: group.category.slug,
      name: group.category.name,
      count: group.totalCount,
    })),
    [displayGroups],
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
  const colorBaseProducts = useMemo(
    () => dedupeProductsBySlug(tabGroups.flatMap((group) => group.colorProducts || [])),
    [tabGroups],
  );
  const baseProducts = activeProductTab === 'colors' ? colorBaseProducts : collectionBaseProducts;
  const collectionTabCount = collectionBaseProducts.length;
  const colorTabCount = colorBaseProducts.length;

  const selectedCategorySlug = selectedCategorySlugs.length === 1 ? selectedCategorySlugs[0] : null;
  const singleSelectedGroup = selectedCategorySlug
    ? displayGroups.find((group) => group.category.slug === selectedCategorySlug)
    : null;
  const activeName = singleSelectedGroup?.category.name || (selectedCategorySlugs.length > 1 ? 'Katalog' : 'Sve kolekcije');
  const activeDescription = singleSelectedGroup
    ? CATEGORY_DESCRIPTIONS[singleSelectedGroup.category.slug] || 'Pregled kolekcija i dekora za stambene, poslovne i tehničke prostore.'
    : 'Izaberite jednu ili više kategorija, zatim suzite izbor po brendu, tipu, primeni i kolekciji.';
  const formatVinylTypes = selectedCategorySlug === VINYL_CATEGORY_SLUG;
  const typeFilterTitle = formatVinylTypes
    ? 'Tip vinila'
    : selectedCategorySlug === LVT_CATEGORY_SLUG
      ? 'Tip LVT'
      : 'Tip';

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
        5,
        formatVinylTypes ? formatVinylTypeLabel : undefined,
      );

      if (!formatVinylTypes) {
        return options;
      }

      const priority = ['heterogeni', 'homogeni'];
      return options
        .filter((option) => priority.includes(option.value))
        .sort((a, b) => priority.indexOf(a.value) - priority.indexOf(b.value));
    },
    [baseProducts, formatVinylTypes],
  );
  const applicationOptions = useMemo(
    () => buildApplicationOptions(baseProducts),
    [baseProducts],
  );
  const collectionOptions = useMemo(
    () => buildValueOptions(baseProducts, getCollectionFilterValue, 6),
    [baseProducts],
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
  const thicknessDenominator = Math.max(thicknessBounds.max - thicknessBounds.min, 1);
  const minThumbPosition = ((effectiveThicknessRange[0] - thicknessBounds.min) / thicknessDenominator) * 100;
  const maxThumbPosition = ((effectiveThicknessRange[1] - thicknessBounds.min) / thicknessDenominator) * 100;
  const thicknessFiltered = thicknessRange !== null
    && (effectiveThicknessRange[0] > thicknessBounds.min || effectiveThicknessRange[1] < thicknessBounds.max);
  const colorDecorCount = colorTabCount;

  const filteredProducts = useMemo(() => {
    const selectedBrandSet = new Set(selectedBrandIds);
    const selectedTypeSet = new Set(selectedTypes);
    const selectedApplicationSet = new Set(selectedApplications);
    const selectedCollectionSet = new Set(selectedCollections);

    const filtered = baseProducts.filter((product) => {
      if (selectedBrandSet.size > 0 && !selectedBrandSet.has(product.brandId)) {
        return false;
      }

      const type = getSpecValue(product, ['type', 'tip']);
      const formattedType = type ? (formatVinylTypes ? formatVinylTypeLabel(type) : type) : null;
      if (selectedTypeSet.size > 0 && (!formattedType || !selectedTypeSet.has(normalizeOptionValue(formattedType)))) {
        return false;
      }

      const applicationMatches = getApplicationMatches(product);
      if (selectedApplicationSet.size > 0 && !applicationMatches.some((value) => selectedApplicationSet.has(value))) {
        return false;
      }

      const collection = getCollectionFilterValue(product);
      if (selectedCollectionSet.size > 0 && (!collection || !selectedCollectionSet.has(normalizeOptionValue(collection)))) {
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
    baseProducts,
    effectiveThicknessRange,
    formatVinylTypes,
    selectedApplications,
    selectedBrandIds,
    selectedCollections,
    selectedTypes,
    sortMode,
    thicknessBounds.hasData,
    thicknessFiltered,
  ]);

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
      return brand
        ? [{
          id: `brand-${id}`,
          label: brand.label,
          onRemove: () => setSelectedBrandIds((current) => current.filter((item) => item !== id)),
        }]
        : [];
    }),
    ...selectedTypes.flatMap((value) => {
      const option = typeOptions.find((item) => item.value === value);
      return option
        ? [{
          id: `type-${value}`,
          label: option.label,
          onRemove: () => setSelectedTypes((current) => current.filter((item) => item !== value)),
        }]
        : [];
    }),
    ...selectedApplications.flatMap((value) => {
      const option = applicationOptions.find((item) => item.value === value);
      return option
        ? [{
          id: `application-${value}`,
          label: option.label,
          onRemove: () => setSelectedApplications((current) => current.filter((item) => item !== value)),
        }]
        : [];
    }),
    ...selectedCollections.flatMap((value) => {
      const option = collectionOptions.find((item) => item.value === value);
      return option
        ? [{
          id: `collection-${value}`,
          label: option.label,
          onRemove: () => setSelectedCollections((current) => current.filter((item) => item !== value)),
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

  return (
    <section className="bg-white">
      <h1 className="sr-only">Podovi.online katalog proizvoda</h1>

      <div className="mx-auto w-full max-w-[1536px] px-6 pb-16 pt-6 lg:pb-20">
        <div className="grid gap-8 lg:grid-cols-[262px_minmax(0,1fr)] xl:gap-11">
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
            <div className="border border-ink-200 bg-white p-4">
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
                      active={selectedCategorySlugs.includes(item.slug)}
                      label={item.name}
                      count={item.count}
                      onClick={() => toggleCategoryFilter(item.slug)}
                    />
                  ))}
                </div>
              </FilterSection>

              {typeOptions.length > 0 ? (
                <FilterSection title={typeFilterTitle}>
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

              {thicknessBounds.hasData ? (
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
                        className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-ink-900"
                        style={{ left: `${minThumbPosition}%` }}
                      />
                      <span
                        className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-ink-900"
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
              ) : null}

              {brandOptions.length > 0 ? (
                <FilterSection title="Brand / brend">
                  <label className="mb-2 flex h-8 items-center gap-2 border border-ink-200 px-2 text-ink-500">
                    <SearchIcon className="h-3.5 w-3.5" />
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

              {collectionOptions.length > 0 ? (
                <FilterSection title="Kolekcija">
                  <div className="space-y-0.5">
                    {collectionOptions.map((option) => (
                      <FilterButton
                        key={option.value}
                        active={selectedCollections.includes(option.value)}
                        label={option.label}
                        count={option.count}
                        onClick={() => setSelectedCollections((current) => toggleSelection(current, option.value))}
                      />
                    ))}
                  </div>
                </FilterSection>
              ) : null}
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

          <div className="relative min-w-0 pt-2">
            <div className="pb-3">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                    <h2 className="text-[30px] font-semibold leading-tight text-ink-900 md:text-[32px]">
                      {activeName}
                    </h2>
                    <span className="pb-1.5 text-[12px] text-ink-500">
                      {filteredProducts.length} {activeProductTab === 'colors' ? 'boja' : 'kolekcija'}
                    </span>
                  </div>
                  <p className="mt-2 max-w-3xl text-[13px] leading-6 text-ink-700">
                    {activeDescription}
                  </p>
                </div>

              </div>

              <div className="mt-5 flex flex-wrap gap-2 lg:hidden" aria-label="Kategorije">
                {categoryOptions.map((option) => {
                  const active = selectedCategorySlugs.includes(option.slug);
                  return (
                    <button
                      key={option.slug}
                      type="button"
                      onClick={() => toggleCategoryFilter(option.slug)}
                      aria-pressed={active}
                      className={`border px-3 py-2 text-[12px] transition-colors ${
                        active
                          ? 'border-ink-900 bg-ink-900 text-white'
                          : 'border-ink-200 bg-white text-ink-700'
                      }`}
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 lg:hidden" aria-label="Brendovi">
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

            {activeFilterChips.length > 0 ? (
              <div className="mb-5 flex flex-wrap items-center gap-2 border-y border-ink-200 py-3">
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={chip.onRemove}
                    className="inline-flex h-8 items-center gap-2 border border-ink-200 bg-white px-2.5 text-[12px] text-ink-800 transition-colors hover:border-ink-900"
                  >
                    {chip.label}
                    <span className="text-ink-500" aria-hidden="true">x</span>
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
                  onChange={(event) => setSortMode(event.target.value)}
                  className="h-9 w-full border border-ink-200 bg-white px-3 text-[12px] text-ink-900 outline-none transition-colors focus:border-ink-900"
                >
                  <option value="featured">Sortiraj: Najnovije</option>
                  <option value="name">Sortiraj: Naziv</option>
                  <option value="price">Sortiraj: Cena</option>
                </select>
              </label>
            </div>

            {visibleProducts.length > 0 ? (
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
    </section>
  );
}
