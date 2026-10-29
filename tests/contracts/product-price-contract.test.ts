import React, { useEffect, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@/types';
import { formatProductPrice, getProductPriceSummary } from '@/lib/utils/product-price';
import { generateProductSchema } from '@/lib/seo/structured-data';
import { GET as search } from '@/app/api/search/route';
import { GET as products } from '@/app/api/products/route';
import ProductCard from '@/components/ProductCard';
import ProductCardClient from '@/components/ProductCardClient';
import GlobalSearch from '@/components/GlobalSearch';
import RecentlyViewed from '@/components/RecentlyViewed';
import FavoritesPage from '@/app/omiljeni/FavoritesPageClient';
import ComparePage from '@/app/uporedi/ComparePageClient';

const catalog = vi.hoisted(() => ({ products: [] as Product[] }));
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return { ...actual, useEffect: vi.fn(), useState: vi.fn(actual.useState) };
});
vi.mock('@/lib/repositories/product-repository', () => ({ productRepository: {
  findAll: async () => catalog.products, findByCategory: async () => catalog.products,
} }));
vi.mock('@/lib/repositories/brand-repository', () => ({ brandRepository: { findAll: async () => [], findById: async () => null } }));
vi.mock('@/lib/repositories/category-repository', () => ({ categoryRepository: { findAll: async () => [] } }));
vi.mock('@/lib/context/FavoritesContext', () => ({ useFavorites: () => ({ favoriteIds: ['test'], count: 1 }) }));
vi.mock('@/lib/context/CompareContext', () => ({ useCompare: () => ({ compareItems: catalog.products, removeFromCompare: vi.fn(), clearAll: vi.fn() }) }));
vi.mock('@/components/useScrollLock', () => ({ useScrollLock: vi.fn() }));
vi.mock('@/components/ProductImage', () => ({ default: () => null }));
vi.mock('@/components/ProductCardOverlay', () => ({ default: () => null }));
vi.mock('@/components/CompareButton', () => ({ default: () => null }));
vi.mock('@/components/FavoriteButton', () => ({ default: () => null }));
vi.mock('next/link', () => ({ default: ({ children, prefetch, ...props }: any) => React.createElement('a', props, children) }));

const fixture: Product = {
  id: 'test', slug: 'schonox-test', name: 'SCHÖNOX Test', sku: 'SCHONOX-TEST', categoryId: '15', brandId: '17',
  shortDescription: 'Opis', description: 'Opis', specs: [], images: [], inStock: false, availability: 'on_request', featured: false,
  createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
  price: 1440.6, priceUnit: 'pakovanje', priceFrom: true, priceIncludesVat: true, priceValidUntil: '2026-12-31',
  priceOptions: [
    { manufacturerSku: '1001', packagingLabel: '5 kg', price: 1440.6, priceWithoutVat: 1200.5 },
    { manufacturerSku: '1002', packagingLabel: '10 kg', price: 2400, priceWithoutVat: 2000 },
  ],
};
const summary = 'od 1.440,6 RSD';

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-29T12:00:00Z'));
  catalog.products = [fixture];
  vi.mocked(useState).mockReset().mockImplementation((await vi.importActual<typeof import('react')>('react')).useState);
  vi.mocked(useEffect).mockClear();
  vi.stubGlobal('React', React);
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('published package prices', () => {
  it('shows the final amount without VAT or package labels and preserves other catalog units', () => {
    expect(formatProductPrice(fixture)).toBe(summary);
    expect(formatProductPrice({ price: 4999, priceUnit: 'm²' })).toBe('4.999 RSD/m²');
    expect(formatProductPrice({ price: 1200.5, priceUnit: 'kom', priceIncludesVat: true })).toBe('1.200,5 RSD/kom');
    expect(formatProductPrice({ price: 1.234 })).toBe('1,23 RSD');
    for (const priceIncludesVat of [true, false, undefined]) {
      expect(formatProductPrice({ price: 11883.44, priceUnit: 'pakovanje (14 kg)', priceIncludesVat })).toBe('11.883,44 RSD');
    }
    for (const price of [undefined, 0, -1, NaN, Infinity]) expect(formatProductPrice({ price })).toBe('Cena na upit');
    const cleared = { ...fixture, ...getProductPriceSummary({}) };
    expect(formatProductPrice(cleared)).toBe('Cena na upit');
    expect(cleared.priceIncludesVat).toBeUndefined();
    expect(cleared.priceFrom).toBeUndefined();
  });

  it('hides saved package prices exactly after the final valid day in Belgrade', () => {
    vi.setSystemTime(new Date('2026-12-31T22:59:59Z'));
    expect(formatProductPrice(fixture)).toBe(summary);
    vi.setSystemTime(new Date('2026-12-31T23:00:00Z'));
    expect(formatProductPrice(fixture)).toBe('Cena na upit');
    expect(Object.values(getProductPriceSummary(fixture)).every(value => value === undefined)).toBe(true);
    expect(formatProductPrice({ price: 4999, priceUnit: 'm²' })).toBe('4.999 RSD/m²');
  });

  it('keeps price metadata through both public APIs while formatting only the final customer price', async () => {
    const searchResult = await (await search(new NextRequest('http://localhost/api/search?q=schonox'))).json();
    const savedResult = await (await products(new NextRequest('http://localhost/api/products?ids=test&categoryIds=15'))).json();
    for (const payload of [searchResult, savedResult]) {
      expect(payload.products).toHaveLength(1);
      expect(payload.products[0]).toMatchObject(getProductPriceSummary(fixture));
      expect(formatProductPrice(payload.products[0])).toBe(summary);
      expect(payload.products[0].priceOptions).toBeUndefined();
      expect(payload.products[0].priceWithoutVat).toBeUndefined();
    }
    expect(savedResult.products[0].availability).toBe('on_request');
  });

  it('emits each SKU/package gross price and the actual expiry in schema without claiming stock', () => {
    const schema = generateProductSchema(fixture, null, null);
    expect(schema.offers).toHaveLength(2);
    (schema.offers as any[]).forEach((offer, index) => {
      const option = fixture.priceOptions![index];
      expect(offer).toMatchObject({ sku: option.manufacturerSku, price: option.price, priceCurrency: 'RSD', priceValidUntil: '2026-12-31',
        priceSpecification: { price: option.price, unitText: `pakovanje (${option.packagingLabel})`, valueAddedTaxIncluded: true } });
      expect(offer.availability).toBeUndefined();
    });
    const legacy = generateProductSchema({ ...fixture, priceOptions: undefined, priceIncludesVat: undefined, priceValidUntil: undefined }, null, null).offers as any;
    expect(legacy.priceValidUntil).toBeUndefined();
    expect(legacy.priceSpecification.valueAddedTaxIncluded).toBeUndefined();
    expect(generateProductSchema({ ...fixture, price: undefined }, null, null).offers).toBeUndefined();
  });

  it('renders the same summary on both cards, favorites, compare and recent history', async () => {
    const rendered = [
      renderToStaticMarkup(await ProductCard({ product: fixture })),
      renderToStaticMarkup(React.createElement(ProductCardClient, { product: fixture, brand: null })),
    ];
    vi.mocked(useState).mockReturnValueOnce([[fixture], vi.fn()]).mockReturnValueOnce([false, vi.fn()]);
    rendered.push(renderToStaticMarkup(React.createElement(FavoritesPage)));
    rendered.push(renderToStaticMarkup(React.createElement(ComparePage)));
    vi.mocked(useState).mockReturnValueOnce([[{ ...fixture, image: '/test.png' }], vi.fn()]);
    rendered.push(renderToStaticMarkup(React.createElement(RecentlyViewed)));
    for (const html of rendered) {
      expect(html).toContain(summary);
      expect(html).not.toMatch(/PDV|pakovanje|1\.200,5|2\.000/);
    }
  });

  it('search renders only the final package price with no VAT, packaging or square-metre suffix', () => {
    vi.mocked(useState)
      .mockReturnValueOnce(['schonox', vi.fn()])
      .mockReturnValueOnce([{ products: [{ ...fixture, image: '/test.png' }], categories: [], brands: [] }, vi.fn()])
      .mockReturnValueOnce([true, vi.fn()]);
    const html = renderToStaticMarkup(React.createElement(GlobalSearch, { variant: 'inline' }));
    expect(html).toContain(summary);
    expect(html).not.toMatch(/PDV|pakovanje|RSD\/m²|1\.200,5|2\.000/);
  });

  it('refreshes old non-slim compare snapshots and clears prices no longer published', async () => {
    let details = {};
    const setDetails = vi.fn(update => { details = update(details); });
    vi.mocked(useState).mockReturnValueOnce([details, setDetails]);
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ products: [{ id: 'test', specs: [], shortDescription: 'Svež opis', inStock: false, availability: 'on_request' }] }) })));
    renderToStaticMarkup(React.createElement(ComparePage));
    vi.mocked(useEffect).mock.calls[0][0]();
    await vi.waitFor(() => expect(setDetails).toHaveBeenCalled());
    vi.mocked(useState).mockReturnValueOnce([details, setDetails]);
    const html = renderToStaticMarkup(React.createElement(ComparePage));
    expect(html).toContain('Cena na upit');
    expect(html).not.toContain(summary);
    expect(html).toContain('Na upit');
    expect(fetch).toHaveBeenCalledWith('/api/products?ids=test&categoryIds=15');
  });

  it('refreshes old recent snapshots to the clean final price using one bounded request', async () => {
    const old = { id: 'test', slug: fixture.slug, name: fixture.name, image: '/test.png', price: 1 };
    let viewed: unknown[] = [];
    const setViewed = vi.fn(value => { viewed = value; });
    vi.mocked(useState).mockReturnValueOnce([viewed, setViewed]);
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify([old]), setItem: vi.fn() });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ products: [fixture] }) })));
    renderToStaticMarkup(React.createElement(RecentlyViewed));
    vi.mocked(useEffect).mock.calls[0][0]();
    await vi.waitFor(() => expect(setViewed).toHaveBeenCalledTimes(2));
    vi.mocked(useState).mockReturnValueOnce([viewed, setViewed]);
    expect(renderToStaticMarkup(React.createElement(RecentlyViewed))).toContain(summary);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
