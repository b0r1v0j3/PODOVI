import React, { useEffect, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getProducts } from '@/app/api/products/route';
import { GET as searchProducts } from '@/app/api/search/route';
import sitemap from '@/app/sitemap';
import ContactForm from '@/components/ContactForm';
import RecentlyViewed, { addToRecentlyViewed } from '@/components/RecentlyViewed';
import { FavoritesProvider, useFavorites } from '@/lib/context/FavoritesContext';
import { CompareProvider, useCompare } from '@/lib/context/CompareContext';
import { RETIRED_BLOQ_COLLECTION_SLUGS, RETIRED_BLOQ_COLOR_SLUGS } from '@/lib/catalog/retired-bloq';
import { RETIRED_SCHONOX_SLUGS, isRetiredProduct, isRetiredProductReference } from '@/lib/catalog/retired-products';
import { getProductBySlug } from '@/lib/utils/productDataLoader';
import { resolveProductBySlug } from '@/lib/product-page/resolve-product';
import priceList from '@/tools/schonox-prices.json';
import type { Product } from '@/types';

const query = vi.hoisted(() => ({ value: new URLSearchParams() }));
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return { ...actual, useEffect: vi.fn(), useState: vi.fn(actual.useState) };
});
vi.mock('next/navigation', () => ({ useSearchParams: () => query.value }));
vi.mock('next/link', () => ({ default: ({ children, ...props }: any) => React.createElement('a', props, children) }));
vi.mock('@/components/ProductImage', () => ({ default: () => null }));

const snapshot = (slug: string, brandId = '17') => ({
  id: slug, slug, name: slug, brandId, categoryId: '15', image: '/test.png', timestamp: 0,
});
const active = [snapshot('schonox-kh'), snapshot('gerflor-current', '6')];
const retired = [
  ...RETIRED_SCHONOX_SLUGS.map(slug => snapshot(slug)),
  snapshot('bloq-assembly', '8'),
  { ...snapshot('legacy-saved-id'), slug: 'unknown', url: '/proizvodi/schonox-hs-8' },
];
let storage: Map<string, string>;

beforeEach(async () => {
  vi.mocked(useState).mockReset().mockImplementation((await vi.importActual<typeof import('react')>('react')).useState);
  vi.mocked(useEffect).mockClear();
  query.value = new URLSearchParams();
  storage = new Map();
  vi.stubGlobal('React', React);
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ products: [] }) })));
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('retired SCHONOX saved identities', () => {
  it('recognizes exactly the 105 retired identities in saved objects, links and inquiry parameters', () => {
    expect(RETIRED_SCHONOX_SLUGS).toHaveLength(105);
    expect(new Set(RETIRED_SCHONOX_SLUGS).size).toBe(105);
    for (const slug of RETIRED_SCHONOX_SLUGS) {
      for (const reference of [slug, ` /proizvodi/${slug}/ `, `https://www.podovi.online/proizvodi/${slug}?x=1`, `/upiti?product=${slug}`, `/upiti?color=${slug}`]) {
        expect(isRetiredProductReference(reference), reference).toBe(true);
      }
      for (const field of ['id', 'slug', 'collectionSlug', 'url']) {
        expect(isRetiredProduct({ [field]: slug }), `${field}: ${slug}`).toBe(true);
      }
    }
    expect(isRetiredProductReference('/proizvodi/%73chonox-hs-8')).toBe(true);
    for (const value of [null, undefined, 17, {}, '', '/proizvodi/%', 'schonox-hs-8-new', 'unrelated-hs-8']) {
      expect(isRetiredProductReference(value)).toBe(false);
    }
  });

  it('preserves approved products, both additions and all other brands even without valid prices', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2027-01-02T00:00:00Z'));
    for (const slug of [...priceList.products.map(product => product.slug), 'schonox-anti-slip', 'schonox-svedska-gleterica-600mm']) {
      expect(isRetiredProductReference(slug), slug).toBe(false);
      const unpriced = { ...snapshot(slug), price: undefined, priceValidUntil: '2026-12-31' };
      expect(isRetiredProduct(unpriced), slug).toBe(false);
    }
    expect(isRetiredProduct({ brandId: '17' })).toBe(false);
    expect(isRetiredProduct(snapshot('unpriced-gerflor', '6'))).toBe(false);
    expect(isRetiredProduct(null)).toBe(false);
  });

  it('retains the existing BLOQ retirement behavior', () => {
    for (const slug of [...RETIRED_BLOQ_COLLECTION_SLUGS, ...RETIRED_BLOQ_COLOR_SLUGS]) {
      expect(isRetiredProductReference(slug), slug).toBe(true);
      expect(isRetiredProduct({ url: `/upiti?product=${slug}` }), slug).toBe(true);
    }
    expect(isRetiredProductReference('bloq-coll-bloq-assembly')).toBe(true);
    expect(isRetiredProductReference('bloq-bloq-assembly')).toBe(true);
    expect(isRetiredProduct({ brandId: '8' })).toBe(true);
    expect(isRetiredProductReference('flow')).toBe(false);
  });

  it('cleans favorites during hydration and prevents retired IDs or URLs being saved again', () => {
    storage.set('podovi_favorites', JSON.stringify([...retired.map(product => 'url' in product ? product.url : product.id), ...active.map(product => product.id), null, 17]));
    let ids: string[] = [];
    const setIds = vi.fn(update => { ids = typeof update === 'function' ? update(ids) : update; });
    let actions!: ReturnType<typeof useFavorites>;
    const Consumer = () => { actions = useFavorites(); return null; };
    const render = (hydrated: boolean) => {
      vi.mocked(useEffect).mockClear();
      vi.mocked(useState).mockReturnValueOnce([ids, setIds]).mockReturnValueOnce([hydrated, vi.fn()]);
      renderToStaticMarkup(React.createElement(FavoritesProvider, { children: React.createElement(Consumer) }));
    };
    render(false);
    vi.mocked(useEffect).mock.calls[0][0]();
    expect(ids).toEqual(active.map(product => product.id));
    render(true);
    vi.mocked(useEffect).mock.calls[1][0]();
    expect(JSON.parse(storage.get('podovi_favorites')!)).toEqual(ids);
    actions.toggleFavorite('schonox-hs-8');
    actions.toggleFavorite('/proizvodi/schonox-hs-8');
    expect(ids).toEqual(active.map(product => product.id));
    actions.toggleFavorite('schonox-anti-slip');
    expect(ids).toContain('schonox-anti-slip');
  });

  it('cleans cached compare objects and blocks adding retired objects while retaining allowed products', () => {
    storage.set('podovi_compare', JSON.stringify([...retired, ...active, null]));
    let items: Product[] = [];
    const setItems = vi.fn(update => { items = typeof update === 'function' ? update(items) : update; });
    let actions!: ReturnType<typeof useCompare>;
    const Consumer = () => { actions = useCompare(); return null; };
    const render = (hydrated: boolean) => {
      vi.mocked(useEffect).mockClear();
      vi.mocked(useState).mockReturnValueOnce([items, setItems]).mockReturnValueOnce([hydrated, vi.fn()]);
      renderToStaticMarkup(React.createElement(CompareProvider, { children: React.createElement(Consumer) }));
    };
    render(false);
    vi.mocked(useEffect).mock.calls[0][0]();
    expect(items).toEqual(active);
    render(true);
    vi.mocked(useEffect).mock.calls[1][0]();
    expect(JSON.parse(storage.get('podovi_compare')!)).toEqual(active);
    actions.addToCompare({ ...getProductBySlug('schonox-kh')!, ...snapshot('schonox-hs-8') });
    expect(items).toEqual(active);
    actions.addToCompare({ ...getProductBySlug('schonox-kh')!, ...snapshot('schonox-svedska-gleterica-600mm') });
    expect(items.map(product => product.id)).toContain('schonox-svedska-gleterica-600mm');
  });

  it('cleans recent snapshots before display and refresh, then rejects retired additions', () => {
    storage.set('recentlyViewed', JSON.stringify([...retired, ...active]));
    const setViewed = vi.fn();
    vi.mocked(useState).mockReturnValueOnce([[], setViewed]);
    renderToStaticMarkup(React.createElement(RecentlyViewed));
    vi.mocked(useEffect).mock.calls[0][0]();
    expect(setViewed).toHaveBeenCalledWith(active);
    expect(JSON.parse(storage.get('recentlyViewed')!)).toEqual(active);
    expect(fetch).toHaveBeenCalledWith(`/api/products?ids=${encodeURIComponent(active.map(product => product.id).join(','))}&categoryIds=15`);
    addToRecentlyViewed(snapshot('schonox-hs-8'));
    expect(JSON.parse(storage.get('recentlyViewed')!)).toEqual(active);
    storage.set('recentlyViewed', JSON.stringify([...retired, ...active]));
    addToRecentlyViewed(snapshot('schonox-anti-slip'));
    expect(JSON.parse(storage.get('recentlyViewed')!).map((product: { id: string }) => product.id)).toEqual(['schonox-anti-slip', ...active.map(product => product.id)]);
  });

  it('does not prefill inquiry forms from retired product or color links, including historical URLs', () => {
    for (const [field, value] of [
      ['product', 'schonox-hs-8'],
      ['product', '/proizvodi/schonox-hs-8'],
      ['color', 'schonox-hs-8'],
      ['product', 'bloq-assembly'],
    ]) {
      query.value = new URLSearchParams({ [field]: value, name: 'Retired product', category: 'Pribor' });
      const setForm = vi.fn();
      vi.mocked(useEffect).mockClear();
      vi.mocked(useState).mockReturnValueOnce([{}, setForm]);
      renderToStaticMarkup(React.createElement(ContactForm));
      vi.mocked(useEffect).mock.calls[1][0]();
      expect(setForm).not.toHaveBeenCalled();
    }
    query.value = new URLSearchParams({ product: 'schonox-anti-slip', name: 'Anti Slip' });
    const setForm = vi.fn();
    vi.mocked(useEffect).mockClear();
    vi.mocked(useState).mockReturnValueOnce([{}, setForm]);
    renderToStaticMarkup(React.createElement(ContactForm));
    vi.mocked(useEffect).mock.calls[1][0]();
    expect(setForm.mock.calls[0][0]({})).toMatchObject({ subject: 'Upit za: Anti Slip' });
  });

  it('omits every retired product from saved lookup while keeping supplier products', async () => {
    for (const slug of RETIRED_SCHONOX_SLUGS) expect(getProductBySlug(slug), slug).toBeUndefined();
    const ids = [...RETIRED_SCHONOX_SLUGS, 'schonox-kh'].join(',');
    const response = await getProducts(new NextRequest(`http://localhost/api/products?ids=${ids}&categoryIds=15`));
    expect((await response.json()).products.map((product: Product) => product.slug)).toEqual(['schonox-kh']);
  });

  it('keeps retired detail routes, search and sitemap out of the published assortment', async () => {
    for (const slug of RETIRED_SCHONOX_SLUGS) {
      expect(await resolveProductBySlug(slug), slug).toBeNull();
    }
    for (const query of ['SCHONOX', 'HS 8', 'TACKIFIER']) {
      const response = await searchProducts(new NextRequest(`http://localhost/api/search?q=${encodeURIComponent(query)}`));
      expect((await response.json()).products.some(isRetiredProduct), query).toBe(false);
    }
    const urls = (await sitemap()).map(entry => entry.url);
    expect(urls.some(isRetiredProductReference)).toBe(false);
    expect(urls.filter(url => url.includes('/proizvodi/schonox-')).map(url => url.split('/').pop()).sort())
      .toEqual(priceList.products.map(product => product.slug).sort());
  }, 60000);
});
