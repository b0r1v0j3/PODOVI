'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Brand, Category, Product } from '@/types';
import ProductCardClient from '@/components/ProductCardClient';

const INITIAL_PRODUCT_LIMIT = 12;
const PREFERRED_HOME_CATEGORY = 'vinil';
const PRIMARY_NAV_SLUGS = ['sve', 'parket', 'vinil', 'lvt', 'tekstilne-ploce', 'deking', 'laminat', 'linoleum'];

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
): CountOption[] {
  const counts = new Map<string, CountOption>();

  for (const product of products) {
    const rawValue = getValue(product);
    if (!rawValue) {
      continue;
    }

    const label = rawValue.replace(/\s+/g, ' ').trim();
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
      className="flex w-full items-center gap-3 py-1.5 text-left text-[13px] leading-5 text-ink-700 transition-colors hover:text-ink-900"
      aria-pressed={active}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
          active ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white'
        }`}
        aria-hidden="true"
      >
        {active ? (
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none">
            <path d="M3.5 8.2 6.4 11 12.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
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
    <div className="border-t border-ink-200 py-4 first:border-t-0 first:pt-0">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-label text-ink-600">{title}</p>
      {children}
    </div>
  );
}

export default function HomeProductTabs({ groups, brandsRecord }: HomeProductTabsProps) {
  const initialSlug = groups.some((group) => group.category.slug === PREFERRED_HOME_CATEGORY)
    ? PREFERRED_HOME_CATEGORY
    : 'sve';
  const [activeSlug, setActiveSlug] = useState(initialSlug);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedThickness, setSelectedThickness] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState('featured');

  useEffect(() => {
    if (activeSlug !== 'sve' && !groups.some((group) => group.category.slug === activeSlug)) {
      setActiveSlug('sve');
    }
  }, [activeSlug, groups]);

  const displayGroups = groups;

  const initialAllProducts = useMemo(() => buildAllProducts(displayGroups, INITIAL_PRODUCT_LIMIT), [displayGroups]);
  const expandedAllProducts = useMemo(() => buildAllProducts(displayGroups, Number.POSITIVE_INFINITY), [displayGroups]);
  const activeGroup = displayGroups.find((group) => group.category.slug === activeSlug);
  const activeName = activeSlug === 'sve' ? 'Katalog' : activeGroup?.category.name || 'Katalog';
  const baseProducts = useMemo(
    () => (activeSlug === 'sve' ? expandedAllProducts : activeGroup?.products || []),
    [activeGroup?.products, activeSlug, expandedAllProducts],
  );

  const categoryOptions = useMemo(
    () => [
      { slug: 'sve', name: 'Sve', count: expandedAllProducts.length },
      ...displayGroups.map((group) => ({
        slug: group.category.slug,
        name: group.category.name,
        count: group.totalCount,
      })),
    ],
    [displayGroups, expandedAllProducts.length],
  );
  const navOptions = useMemo(
    () => categoryOptions
      .filter((item) => PRIMARY_NAV_SLUGS.includes(item.slug))
      .sort((a, b) => PRIMARY_NAV_SLUGS.indexOf(a.slug) - PRIMARY_NAV_SLUGS.indexOf(b.slug)),
    [categoryOptions],
  );

  const brandOptions = useMemo(() => buildBrandOptions(baseProducts, brandsRecord), [baseProducts, brandsRecord]);
  const typeOptions = useMemo(
    () => buildValueOptions(baseProducts, (product) => getSpecValue(product, ['type', 'tip']), 4),
    [baseProducts],
  );
  const thicknessOptions = useMemo(
    () => buildValueOptions(baseProducts, (product) => getSpecValue(product, ['thickness', 'debljina']), 6),
    [baseProducts],
  );

  const filteredProducts = useMemo(() => {
    const selectedBrandSet = new Set(selectedBrandIds);
    const selectedTypeSet = new Set(selectedTypes);
    const selectedThicknessSet = new Set(selectedThickness);

    const filtered = baseProducts.filter((product) => {
      if (selectedBrandSet.size > 0 && !selectedBrandSet.has(product.brandId)) {
        return false;
      }

      const type = getSpecValue(product, ['type', 'tip']);
      if (selectedTypeSet.size > 0 && (!type || !selectedTypeSet.has(normalizeOptionValue(type)))) {
        return false;
      }

      const thickness = getSpecValue(product, ['thickness', 'debljina']);
      if (selectedThicknessSet.size > 0 && (!thickness || !selectedThicknessSet.has(normalizeOptionValue(thickness)))) {
        return false;
      }

      return true;
    });

    return sortProducts(filtered, sortMode);
  }, [baseProducts, selectedBrandIds, selectedThickness, selectedTypes, sortMode]);

  const visibleProducts = filteredProducts.slice(0, INITIAL_PRODUCT_LIMIT);
  const activeFilters = selectedBrandIds.length + selectedTypes.length + selectedThickness.length;

  const changeCategory = (slug: string) => {
    setActiveSlug(slug);
    setSelectedBrandIds([]);
    setSelectedTypes([]);
    setSelectedThickness([]);
    setSortMode('featured');
  };

  return (
    <section className="bg-white">
      <h1 className="sr-only">Podovi.online katalog proizvoda</h1>

      <div className="border-b border-ink-200 bg-white">
        <div className="container">
          <nav className="no-scrollbar flex min-h-[58px] items-end gap-8 overflow-x-auto" aria-label="Kategorije">
            {navOptions.map((item) => {
              const active = item.slug === activeSlug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => changeCategory(item.slug)}
                  aria-pressed={active}
                  className={`flex min-h-[58px] shrink-0 items-center border-b-2 text-[18px] transition-colors sm:text-[20px] ${
                    active
                      ? 'border-ink-900 text-ink-900'
                      : 'border-transparent text-ink-500 hover:text-ink-900'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="container pb-16 pt-7 lg:pb-20 lg:pt-8">
        <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] 2xl:grid-cols-[250px_minmax(0,1fr)_230px]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-lg border border-ink-200 bg-white p-4 shadow-[0_18px_60px_rgba(17,17,17,0.06)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-ink-900">Filtri</h2>
                {activeFilters > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBrandIds([]);
                      setSelectedTypes([]);
                      setSelectedThickness([]);
                    }}
                    className="text-[12px] text-ink-500 transition-colors hover:text-ink-900"
                  >
                    Očisti sve
                  </button>
                ) : null}
              </div>

              <FilterSection title="Kategorija">
                <div className="space-y-0.5">
                  {categoryOptions.map((item) => (
                    <FilterButton
                      key={item.slug}
                      active={item.slug === activeSlug}
                      label={item.name}
                      count={item.count}
                      onClick={() => changeCategory(item.slug)}
                    />
                  ))}
                </div>
              </FilterSection>

              {typeOptions.length > 0 ? (
                <FilterSection title="Tip">
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

              {brandOptions.length > 0 ? (
                <FilterSection title="Brand / brend">
                  <div className="space-y-0.5">
                    {brandOptions.map((option) => (
                      <FilterButton
                        key={option.value}
                        active={selectedBrandIds.includes(option.value)}
                        label={option.label}
                        count={option.count}
                        onClick={() => setSelectedBrandIds((current) => toggleSelection(current, option.value))}
                      />
                    ))}
                  </div>
                </FilterSection>
              ) : null}

              {thicknessOptions.length > 0 ? (
                <FilterSection title="Debljina">
                  <div className="grid grid-cols-2 gap-2">
                    {thicknessOptions.map((option) => {
                      const active = selectedThickness.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSelectedThickness((current) => toggleSelection(current, option.value))}
                          aria-pressed={active}
                          className={`min-h-9 border px-2 text-[12px] transition-colors ${
                            active
                              ? 'border-ink-900 bg-ink-900 text-white'
                              : 'border-ink-200 bg-white text-ink-700 hover:border-ink-500'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </FilterSection>
              ) : null}
            </div>
          </aside>

          <main className="min-w-0">
            <div className="border-b border-ink-200 pb-7">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                    <h2 className="text-4xl font-semibold leading-tight text-ink-900 md:text-5xl">
                      {activeName}
                    </h2>
                    <span className="pb-1 text-[13px] text-ink-500">
                      {filteredProducts.length} proizvoda
                    </span>
                  </div>
                  <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-700">
                    Pregled kolekcija i dekora za stambene, poslovne i tehničke prostore.
                  </p>
                </div>

                <label className="flex w-full flex-col gap-2 text-[12px] text-ink-500 md:w-[190px]">
                  Sortiraj
                  <select
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value)}
                    className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-[13px] text-ink-900 outline-none transition-colors focus:border-ink-900"
                  >
                    <option value="featured">Preporučeno</option>
                    <option value="name">Naziv</option>
                    <option value="price">Cena</option>
                  </select>
                </label>
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

            <div className="mb-6 flex flex-col gap-3 border-b border-ink-200 py-4 text-[13px] text-ink-500 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-8">
                <button type="button" className="border-b-2 border-ink-900 pb-3 font-semibold text-ink-900">
                  Kolekcije ({filteredProducts.length})
                </button>
                <span className="pb-3">Boje i dekori</span>
              </div>
              {activeGroup ? (
                <Link
                  href={`/kategorije/${activeGroup.category.slug}`}
                  className="inline-flex w-fit items-center font-medium text-ink-900 transition-colors hover:text-ink-600"
                >
                  Pogledaj sve u kategoriji
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0-4 4m4-4H3" />
                  </svg>
                </Link>
              ) : null}
            </div>

            {visibleProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {visibleProducts.map((product) => (
                  <ProductCardClient
                    key={`${activeSlug}-${product.id}`}
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
          </main>

          <aside className="hidden 2xl:block">
            <div className="sticky top-28 rounded-lg border border-ink-200 bg-white p-5 shadow-[0_20px_70px_rgba(17,17,17,0.10)]">
              <h2 className="text-base font-semibold text-ink-900">Imate projekat?</h2>
              <p className="mt-2 text-[13px] leading-6 text-ink-600">
                Pošaljite nam upit i dobićete ponudu u najkraćem roku.
              </p>
              <Link href="/upiti" className="btn-primary mt-5 flex w-full justify-between px-4 py-3">
                Pošalji upit
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <div className="mt-5 space-y-2 text-[12px] text-ink-600">
                {['Brz odgovor', 'Stručna podrška', 'Najbolje rešenje'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-emerald-500 text-emerald-600">
                      <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none">
                        <path d="M2.4 6.2 5 8.7 9.8 3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
