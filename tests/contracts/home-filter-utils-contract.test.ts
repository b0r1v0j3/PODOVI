import { describe, expect, it } from 'vitest';
import {
  getVisibleFilterOptions,
  hasPricedProducts,
  sortHomepageProducts,
  withLiveOptionCounts,
} from '@/lib/catalog/home-filter-utils';
import type { Product } from '@/types';

function product(name: string, price?: number): Product {
  return {
    id: name,
    name,
    slug: name.toLowerCase(),
    sku: name,
    categoryId: '1',
    brandId: '3',
    description: '',
    shortDescription: '',
    images: [],
    specs: [],
    price,
    inStock: true,
    featured: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
}

describe('homepage filter utilities', () => {
  it('counts each option over products that pass the other filters', () => {
    const options = [
      { value: 'a', label: 'A', count: 99 },
      { value: 'b', label: 'B', count: 99 },
      { value: 'c', label: 'C', count: 99 },
    ];
    const products = [
      { values: ['a', 'a', 'b'], allowed: true },
      { values: ['b'], allowed: false },
      { values: ['b'], allowed: true },
    ];

    expect(withLiveOptionCounts(options, products, (item) => item.values, (item) => item.allowed))
      .toEqual([
        { value: 'a', label: 'A', count: 1 },
        { value: 'b', label: 'B', count: 2 },
        { value: 'c', label: 'C', count: 0 },
      ]);
  });

  it('keeps a selected option visible below the collapsed limit', () => {
    const options = Array.from({ length: 12 }, (_, index) => ({
      value: String(index + 1),
      label: `Opcija ${index + 1}`,
    }));

    expect(getVisibleFilterOptions(options, ['11'], false, 8).map((option) => option.value))
      .toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '11']);
    expect(getVisibleFilterOptions(options, [], true, 8)).toHaveLength(12);
  });

  it('sorts without mutating the repository order and hides price sort without prices', () => {
    const products = [product('Žito', 300), product('Alfa', 100), product('Beta')];

    expect(sortHomepageProducts(products, 'name').map((item) => item.name)).toEqual(['Alfa', 'Beta', 'Žito']);
    expect(sortHomepageProducts(products, 'price').map((item) => item.name)).toEqual(['Alfa', 'Žito', 'Beta']);
    expect(sortHomepageProducts(products, 'featured')).not.toBe(products);
    expect(products.map((item) => item.name)).toEqual(['Žito', 'Alfa', 'Beta']);
    expect(hasPricedProducts(products)).toBe(true);
    expect(hasPricedProducts([product('Bez cene')])).toBe(false);
  });
});
