import React, { useEffect, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HomeProductTabs, { type HomeProductGroup } from '@/components/HomeProductTabs';
import RecentlyViewed from '@/components/RecentlyViewed';
import { parseHomeFilterSelection } from '@/lib/catalog/home-filter-url';
import type { HomeCatalogItem } from '@/lib/catalog/home-catalog-index';
import type { HomeFacetSchemaEntry } from '@/lib/catalog/home-facet-schema';

const panelState = vi.hoisted(() => ({ groupIds: [] as string[] }));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return { ...actual, useEffect: vi.fn(), useState: vi.fn(actual.useState) };
});
vi.mock('@/components/useScrollLock', () => ({ useScrollLock: vi.fn() }));
vi.mock('@/components/ProductCardClient', () => ({ default: ({ product }: { product: HomeCatalogItem }) => React.createElement('div', { 'data-product': product.id }) }));
vi.mock('@/components/ProductImage', () => ({ default: () => null }));
vi.mock('@/components/HomeFilterPanel', () => ({ default: ({ groups }: { groups: Array<{ entry: { id: string } }> }) => {
  panelState.groupIds = groups.map(group => group.entry.id);
  return null;
}, CheckIcon: () => null }));
vi.mock('next/link', () => ({ default: ({ children, ...props }: any) => React.createElement('a', props, children) }));

beforeEach(async () => {
  vi.mocked(useState).mockReset().mockImplementation((await vi.importActual<typeof import('react')>('react')).useState);
  vi.mocked(useEffect).mockClear();
  vi.stubGlobal('React', React);
});
afterEach(() => vi.unstubAllGlobals());

const schema: HomeFacetSchemaEntry[] = [
  { id: 'category', param: 'category', scope: 'all', label: 'Kategorija', kind: 'list' },
  { id: 'brand', param: 'brand', scope: 'all', label: 'Brend', kind: 'list' },
];
const item = (id: string, price?: number, categorySlug = 'laminat') => ({
  id, slug: id, name: id, brandId: '3', categorySlug, categoryId: '1', price, fv: {}, nv: {},
} as HomeCatalogItem);

describe('homepage hydrated state', () => {
  it('uses complete catalog context for brand-only controls while additional color categories are still loading', () => {
    const laminate = ['AC4', 'AC5'].map(ac => ({ ...item(ac), fv: { 'laminat.ac': [ac] } }));
    const groups: HomeProductGroup[] = [
      { category: { id: '1', slug: 'laminat', name: 'Laminat' }, products: laminate, totalCount: 2, colorCount: 2 },
      { category: { id: '2', slug: 'vinil', name: 'Vinil' }, products: [item('vinyl', undefined, 'vinil')], totalCount: 1, colorCount: 1 },
    ];
    const facetSchema: HomeFacetSchemaEntry[] = [...schema, { id: 'laminat.ac', param: 'ac', scope: 'laminat', label: 'AC', kind: 'list' }];
    const render = (category: string[] = []) => {
      vi.mocked(useState)
        .mockReturnValueOnce([{ lists: { brand: ['3'], ...(category.length ? { category } : {}) }, ranges: {} }, vi.fn()])
        .mockReturnValueOnce(['featured', vi.fn()])
        .mockReturnValueOnce(['colors', vi.fn()])
        .mockReturnValueOnce([12, vi.fn()])
        .mockReturnValueOnce([{ '1': laminate }, vi.fn()]);
      return renderToStaticMarkup(React.createElement(HomeProductTabs, { groups, brandsRecord: {}, facetSchema }));
    };
    expect(render()).toContain('Učitavam boje');
    expect(panelState.groupIds).not.toContain('laminat.ac');
    render(['laminat']);
    expect(panelState.groupIds).toContain('laminat.ac');
  });

  it('retains a direct price-sort link until colors arrive, then renders them in price order', async () => {
    const query = '?category=laminat&tab=colors&sort=price';
    const parsed = parseHomeFilterSelection(query, schema);
    let sort = parsed.sort;
    let loaded: Record<string, HomeCatalogItem[]> = {};
    const setSort = vi.fn((value: unknown) => { sort = value as typeof sort; });
    const setLoaded = vi.fn((update: unknown) => { loaded = (update as (current: typeof loaded) => typeof loaded)(loaded); });
    const groups: HomeProductGroup[] = [{ category: { id: '1', slug: 'laminat', name: 'Laminat' }, products: [item('collection', 1000)], totalCount: 1, colorCount: 2 }];
    const render = () => {
      vi.mocked(useEffect).mockClear();
      // Hydrated URL state; execute the component's real fetch and sort-validation effects.
      vi.mocked(useState)
        .mockReturnValueOnce([parsed.selection, vi.fn()])
        .mockReturnValueOnce([sort, setSort])
        .mockReturnValueOnce(['colors', vi.fn()])
        .mockReturnValueOnce([12, vi.fn()])
        .mockReturnValueOnce([loaded, setLoaded]);
      return renderToStaticMarkup(React.createElement(HomeProductTabs, { groups, brandsRecord: {}, facetSchema: schema }));
    };
    let resolveResponse!: (value: unknown) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { resolveResponse = resolve; })));
    render();
    const [fetchEffect, priceEffect] = vi.mocked(useEffect).mock.calls;
    fetchEffect[0]();
    priceEffect[0]();
    expect(setSort).not.toHaveBeenCalled();
    expect(sort).toBe('price');

    resolveResponse({ ok: true, json: async () => ({ groups: [{ categoryId: '1', products: [item('expensive', 2000), item('cheap', 1000)] }] }) });
    await vi.waitFor(() => expect(setLoaded).toHaveBeenCalled());
    const html = render();
    vi.mocked(useEffect).mock.calls[1][0]();
    expect(setSort).not.toHaveBeenCalled();
    expect(html.indexOf('data-product="cheap"')).toBeLessThan(html.indexOf('data-product="expensive"'));
    expect(html).toContain('value="price" selected=""');

    loaded = { '1': [item('unpriced')] };
    render();
    vi.mocked(useEffect).mock.calls[1][0]();
    expect(setSort).toHaveBeenCalledWith('featured');
  });

  it('uses product terminology for a flat brand selection and keeps collection terminology for decor catalogs', () => {
    const flatProducts = Array.from({ length: 13 }, (_, index) => ({ ...item(`product-${index}`, undefined, 'pribor'), brandId: '17' }));
    const groups: HomeProductGroup[] = [
      { category: { id: '1', slug: 'laminat', name: 'Laminat' }, products: [item('collection')], totalCount: 1, colorCount: 2 },
      { category: { id: '14', slug: 'pribor', name: 'Pribor' }, products: flatProducts, totalCount: 13, colorCount: 0 },
    ];
    const brandsRecord = { '17': { id: '17', name: 'SCHÖNOX', slug: 'schonox' } } as any;
    vi.mocked(useState).mockReturnValueOnce([{ lists: { brand: ['17'] }, ranges: {} }, vi.fn()]);
    const flat = renderToStaticMarkup(React.createElement(HomeProductTabs, { groups, brandsRecord, facetSchema: schema }));
    expect(flat).toContain('13 proizvoda');
    expect(flat).toContain('Proizvodi (13)');
    expect(flat).toContain('Učitaj još proizvoda');
    expect(flat).not.toContain('13 kolekcija');

    vi.mocked(useState).mockReturnValueOnce([{ lists: { category: ['laminat'] }, ranges: {} }, vi.fn()]);
    const decor = renderToStaticMarkup(React.createElement(HomeProductTabs, { groups, brandsRecord, facetSchema: schema }));
    expect(decor).toContain('1 kolekcija');
    expect(decor).toContain('Kolekcije (1)');
  });
});

describe('recently viewed prices', () => {
  it('renders positive prices and omits missing, zero and negative prices without a stray zero text node', () => {
    vi.mocked(useState).mockReturnValueOnce([
      [0, undefined, -10, 1500].map((price, index) => ({ ...item(`recent-${index}`, price), image: '/test.png' })), vi.fn(),
    ]);
    const html = renderToStaticMarkup(React.createElement(RecentlyViewed));
    expect(html).toContain('1.500 RSD');
    expect(html).not.toContain('-10 RSD');
    expect(html).not.toMatch(/<\/h3>0<\/a>/);
    expect(html.match(/ RSD/g)).toHaveLength(1);
  });
});
