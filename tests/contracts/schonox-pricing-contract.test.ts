import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@/types';
import dataset from '@/public/data/schonox_products.json';
import priceList from '@/tools/schonox-prices.json';
import { getAllSchonoxProducts } from '@/lib/data/schonox-products';

const { applyApprovedPrices } = require('../../tools/extract_schonox_catalog.js') as {
  applyApprovedPrices: (products: { slug: string }[], prices?: unknown) => Product[];
};

const priceFields = ['price', 'priceFrom', 'priceIncludesVat', 'priceValidUntil', 'priceOptions'] as const;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-29T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());

describe('SCHÖNOX regular package prices', () => {
  it('publishes only the 30 matched products and 35 package SKUs, with 105 prices unknown', () => {
    expect(priceList).toMatchObject({
      sourceTitle: 'Sika Srbija - Cenovnik',
      listDate: '2026-08-17',
      validThrough: '2026-12-31',
      currency: 'RSD',
      vatRate: 20,
      discountPercent: 0,
    });
    const products = getAllSchonoxProducts();
    const priced = products.filter(product => product.price !== undefined);
    const unknown = products.filter(product => product.price === undefined);
    expect(products).toHaveLength(135);
    expect(priced).toHaveLength(30);
    expect(unknown).toHaveLength(105);
    expect(priced.map(product => product.slug).sort()).toEqual(priceList.products.map(product => product.slug).sort());
    const publishedSkus = priced.flatMap(product => product.priceOptions!.map(option => option.manufacturerSku));
    expect(publishedSkus).toHaveLength(35);
    expect(new Set(publishedSkus).size).toBe(35);
    expect(publishedSkus.sort()).toEqual(priceList.products.flatMap(product => product.packages.map(pack => pack.manufacturerSku)).sort());
    for (const product of products) {
      expect(product.inStock, product.slug).toBe(false);
      expect(product.availability, product.slug).toBe('on_request');
    }
    for (const product of unknown) {
      for (const field of priceFields) expect(product[field], `${product.slug}.${field}`).toBeUndefined();
    }
  });

  it('keeps all KH package choices and uses the lowest gross package price as the starting price', () => {
    expect(getAllSchonoxProducts().find(product => product.slug === 'schonox-kh')).toMatchObject({
      price: 1603.74,
      priceUnit: 'pakovanje',
      priceFrom: true,
      priceIncludesVat: true,
      priceValidUntil: '2026-12-31',
      priceOptions: [
        { manufacturerSku: '483343', packagingLabel: '1 kg', price: 1603.74, priceWithoutVat: 1336.45 },
        { manufacturerSku: '483275', packagingLabel: '5 kg', price: 4705.45, priceWithoutVat: 3921.21 },
        { manufacturerSku: '483197', packagingLabel: '10 kg', price: 8451.02, priceWithoutVat: 7042.52 },
      ],
    });
  });

  it.each([
    ['schonox-zm', '483289', '25 kg', 3614.89, 4337.87],
    ['schonox-epoxy-clean', '651696', '0,5 kg', 2500, 3000],
    ['schonox-ifix', '525976', '7,8 kg, komplet', 7800, 9360],
  ] as const)('uses the regular price for one whole package of %s', (slug, manufacturerSku, packagingLabel, priceWithoutVat, price) => {
    expect(getAllSchonoxProducts().find(product => product.slug === slug)).toMatchObject({
      price,
      priceUnit: `pakovanje (${packagingLabel})`,
      priceFrom: false,
      priceIncludesVat: true,
      priceOptions: [{ manufacturerSku, packagingLabel, priceWithoutVat, price }],
    });
  });

  it('does not expose mutable package choices shared by loader calls or the JSON source', () => {
    const first = getAllSchonoxProducts().find(product => product.slug === 'schonox-kh')!;
    const expected = structuredClone(first.priceOptions);
    first.priceOptions![0].price = 1;
    first.priceOptions![0].packagingLabel = 'changed';
    first.priceOptions!.pop();
    expect(getAllSchonoxProducts().find(product => product.slug === first.slug)!.priceOptions).toEqual(expected);
    expect(dataset.products.find(product => product.slug === first.slug)!.priceOptions).toEqual(expected);
  });

  it.each(['2026-12-30T23:00:00Z', '2026-12-31T22:59:59.999Z'])('keeps prices on the last valid Belgrade day at %s', instant => {
    vi.setSystemTime(new Date(instant));
    expect(getAllSchonoxProducts().filter(product => product.price !== undefined)).toHaveLength(30);
  });

  it('removes prices and their display flags at Belgrade midnight, even while UTC is still December 31', () => {
    vi.setSystemTime(new Date('2026-12-31T23:00:00Z'));
    const products = getAllSchonoxProducts();
    expect(products).toHaveLength(135);
    for (const product of products) {
      for (const field of priceFields) expect(product[field], `${product.slug}.${field}`).toBeUndefined();
      expect(product.priceUnit).toBe('pakovanje');
    }
    vi.setSystemTime(new Date('2026-12-31T22:59:59Z'));
    expect(getAllSchonoxProducts().filter(product => product.price !== undefined)).toHaveLength(30);
  });
});

describe('SCHÖNOX approved-price import', () => {
  it('rounds VAT in cents and does not label equal-priced package choices as a starting price', () => {
    const prices = structuredClone(priceList);
    prices.products = [{
      slug: 'schonox-kh',
      packages: [
        { manufacturerSku: '100001', packagingLabel: '1 kg', listPriceNetMinor: 102, sourcePages: [5] },
        { manufacturerSku: '100002', packagingLabel: '2 kg', listPriceNetMinor: 103, sourcePages: [5] },
      ],
    }];
    const [product] = applyApprovedPrices([{ slug: 'schonox-kh' }], prices);
    expect(product.priceOptions!.map(option => option.price)).toEqual([1.22, 1.24]);
    expect(product.priceOptions!.map(option => option.priceWithoutVat)).toEqual([1.02, 1.03]);
    expect(product).toMatchObject({ price: 1.22, priceFrom: true });
    prices.products[0].packages[1].listPriceNetMinor = 102;
    expect(applyApprovedPrices([{ slug: 'schonox-kh' }], prices)[0]).toMatchObject({ price: 1.22, priceFrom: false, priceUnit: 'pakovanje' });
  });

  it('replaces stale pricing without mutating input records and removes prices no longer approved', () => {
    const prices = { ...structuredClone(priceList), products: [] };
    const input = [{
      slug: 'schonox-kh', name: 'Retained name', price: 1, priceUnit: 'kg', priceFrom: true,
      priceIncludesVat: true, priceValidUntil: '2020-01-01',
      priceOptions: [{ manufacturerSku: '100001', packagingLabel: 'old', price: 1, priceWithoutVat: 1 }],
    }];
    const original = structuredClone(input);
    const [result] = applyApprovedPrices(input, prices);
    expect(input).toEqual(original);
    expect(result).not.toBe(input[0]);
    expect(result).toEqual({ slug: 'schonox-kh', name: 'Retained name', priceUnit: 'pakovanje' });
    expect(applyApprovedPrices(dataset.products)).toEqual(dataset.products);
  });

  it.each([
    ['an unknown catalog slug', (prices: typeof priceList) => { prices.products[0].slug = 'schonox-unmatched'; }],
    ['a repeated product', (prices: typeof priceList) => { prices.products.push(structuredClone(prices.products[0])); }],
    ['a SKU assigned to two products', (prices: typeof priceList) => { prices.products[1].packages[0].manufacturerSku = prices.products[0].packages[0].manufacturerSku; }],
    ['an empty package list', (prices: typeof priceList) => { prices.products[0].packages = []; }],
    ['an empty package label', (prices: typeof priceList) => { prices.products[0].packages[0].packagingLabel = ' '; }],
    ['a discounted amount', (prices: typeof priceList) => { prices.discountPercent = 20; }],
    ['a foreign currency', (prices: typeof priceList) => { prices.currency = 'EUR'; }],
    ['an unsupported VAT rate', (prices: typeof priceList) => { prices.vatRate = 10; }],
    ['an invalid calendar date', (prices: typeof priceList) => { prices.validThrough = '2026-02-30'; }],
    ['an expiry before the list date', (prices: typeof priceList) => { prices.validThrough = '2026-01-01'; }],
    ['a missing source title', (prices: typeof priceList) => { prices.sourceTitle = ' '; }],
    ['missing source pages', (prices: typeof priceList) => { prices.products[0].packages[0].sourcePages = []; }],
    ['page zero', (prices: typeof priceList) => { prices.products[0].packages[0].sourcePages = [0]; }],
    ['a fractional source page', (prices: typeof priceList) => { prices.products[0].packages[0].sourcePages = [1.5]; }],
  ])('rejects %s before producing a new catalog', (_label, invalidate) => {
    const prices = structuredClone(priceList);
    invalidate(prices);
    expect(() => applyApprovedPrices(dataset.products, prices)).toThrow();
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER])('rejects invalid or unsafe net minor-unit money %s', value => {
    const prices = structuredClone(priceList);
    prices.products[0].packages[0].listPriceNetMinor = value;
    expect(() => applyApprovedPrices(dataset.products, prices)).toThrow();
  });
});
