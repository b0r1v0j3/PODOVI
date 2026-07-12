import type { Product } from '@/types';

export type HomepageSortMode = 'featured' | 'name' | 'price';

export interface HomepageCountOption {
  value: string;
  label: string;
  count: number;
}

/**
 * Recalculates option counts over all other active filters. Values returned for
 * one product are de-duplicated so a repeated spec cannot inflate a counter.
 */
export function withLiveOptionCounts<TOption extends HomepageCountOption, TProduct>(
  options: TOption[],
  products: TProduct[],
  getValues: (product: TProduct) => string[],
  matchesOtherFilters: (product: TProduct) => boolean,
): TOption[] {
  const counts = new Map(options.map((option) => [option.value, 0]));

  for (const product of products) {
    if (!matchesOtherFilters(product)) {
      continue;
    }

    for (const value of Array.from(new Set(getValues(product)))) {
      if (counts.has(value)) {
        counts.set(value, (counts.get(value) || 0) + 1);
      }
    }
  }

  return options.map((option) => ({
    ...option,
    count: counts.get(option.value) || 0,
  }));
}

/** Keeps selected values visible even when they fall below the collapsed cut. */
export function getVisibleFilterOptions<TOption extends { value: string }>(
  options: TOption[],
  selectedValues: Iterable<string>,
  expanded: boolean,
  limit = 8,
): TOption[] {
  if (expanded || options.length <= limit) {
    return options;
  }

  const selected = new Set(selectedValues);
  const visible = options.slice(0, limit);
  const visibleValues = new Set(visible.map((option) => option.value));

  for (const option of options) {
    if (selected.has(option.value) && !visibleValues.has(option.value)) {
      visible.push(option);
      visibleValues.add(option.value);
    }
  }

  return visible;
}

export function sortHomepageProducts(products: Product[], sortMode: HomepageSortMode): Product[] {
  const sorted = products.slice();

  if (sortMode === 'name') {
    return sorted.sort((a, b) => a.name.localeCompare(b.name, 'sr-Latn'));
  }

  if (sortMode === 'price') {
    return sorted.sort((a, b) => {
      const aPrice = a.price && a.price > 0 ? a.price : Number.POSITIVE_INFINITY;
      const bPrice = b.price && b.price > 0 ? b.price : Number.POSITIVE_INFINITY;
      return aPrice - bPrice || a.name.localeCompare(b.name, 'sr-Latn');
    });
  }

  // "featured" is the curated repository order. It is intentionally not
  // labelled "Najnovije" because catalog dates are not consistent enough.
  return sorted;
}

export function hasPricedProducts(products: Product[]): boolean {
  return products.some((product) => typeof product.price === 'number' && product.price > 0);
}
