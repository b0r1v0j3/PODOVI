import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { productRepository, SupabaseProductRepository } from '@/lib/repositories/product-repository';
import { getAllPriborProducts } from '@/lib/utils/productDataLoader';
import { buildHomeCatalogItems, buildHomeFacetSchema } from '@/lib/catalog/home-catalog-index';
import { evaluateHomeFilters } from '@/lib/catalog/home-filter-engine';
import { hasPricedProducts, sortHomepageProducts } from '@/lib/catalog/home-filter-utils';

vi.mock('@/lib/supabase/client', () => ({
  hasSupabaseAnonConfig: () => false,
  supabase: {
    from: () => {
      const query: Record<string, any> = {
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve),
      };
      for (const method of ['select', 'eq', 'in', 'gte', 'lte', 'or']) query[method] = () => query;
      return query;
    },
  },
}));

describe('SCHÖNOX package price ranges in both catalog repositories', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-29T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());
  for (const [name, repository] of [['local', productRepository], ['merged', new SupabaseProductRepository()]] as const) {
    it(`${name}: requires one actual package price inside the selected range`, async () => {
      const filter = { categoryId: '15', brandIds: ['17'] };
      const catalog = await repository.findAll(filter);
      expect(catalog).toHaveLength(135);
      expect(catalog.filter((product) => product.price)).toHaveLength(30);
      const high = await repository.findAll({ ...filter, priceMin: 26000, priceMax: 27000 });
      expect(high.some((product) => product.slug === 'schonox-ab-10-30')).toBe(true);
      const gap = await repository.findAll({ ...filter, priceMin: 15000, priceMax: 20000 });
      expect(gap.some((product) => product.slug === 'schonox-ab-10-30')).toBe(false);
      for (const product of [...high, ...gap]) {
        expect(product.priceOptions?.some((option) => option.price >= (high.includes(product) ? 26000 : 15000)
          && option.price <= (high.includes(product) ? 27000 : 20000)), product.slug).toBe(true);
      }
    });
  }

  it('expires prices in warmed loader and repository caches at Belgrade midnight', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-12-31T22:59:59Z'));
    expect(getAllPriborProducts().find((product) => product.slug === 'schonox-ab-10-30')?.price).toBe(9360);
    expect((await productRepository.findBySlug('schonox-ab-10-30'))?.price).toBe(9360);
    vi.setSystemTime(new Date('2026-12-31T23:00:00Z'));
    expect(getAllPriborProducts().find((product) => product.slug === 'schonox-ab-10-30')?.price).toBeUndefined();
    expect((await productRepository.findBySlug('schonox-ab-10-30'))?.priceOptions).toBeUndefined();
    expect(await productRepository.findAll({ brandIds: ['17'], priceMin: 1 })).toEqual([]);
  });

  it('expires price ranges, bounds and sorting in an already loaded homepage snapshot', async () => {
    const products = await productRepository.findAll({ brandIds: ['17'] });
    const items = buildHomeCatalogItems('pribor', products, products);
    const schema = buildHomeFacetSchema([{ slug: 'pribor', name: 'Pribor', items, products }]);
    const options = { missing: 'include' as const, categories: [{ slug: 'pribor', name: 'Pribor' }], brandNames: {} };
    expect(hasPricedProducts(items)).toBe(true);
    expect(evaluateHomeFilters(items, schema, { lists: {}, ranges: { cena: [1, 100000] } }, options).results).toHaveLength(30);
    vi.setSystemTime(new Date('2026-12-31T23:00:00Z'));
    const filtered = evaluateHomeFilters(items, schema, { lists: {}, ranges: { cena: [1, 100000] } }, options);
    expect(filtered.results).toEqual([]);
    expect(filtered.groups.find((group) => group.entry.id === 'cena')?.range?.count ?? 0).toBe(0);
    expect(hasPricedProducts(items)).toBe(false);
    const first = sortHomepageProducts(items, 'price')[0];
    expect(first.name).toBe(items.slice().sort((a, b) => a.name.localeCompare(b.name, 'sr-Latn'))[0].name);
  });
});
