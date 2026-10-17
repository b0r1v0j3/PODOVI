import { describe, expect, it, vi } from 'vitest';
import { buildQuote, customerDiscount, validateCartItems } from '@/lib/commerce/pricing';
import { resolveCommerceLine } from '@/lib/commerce/catalog';
import { CommerceError } from '@/lib/commerce/errors';

vi.mock('@/lib/product-page/resolve-product', () => ({ resolveProductBySlug: vi.fn() }));
vi.mock('@/lib/product-page/prepare-colors', () => ({ prepareCustomColors: vi.fn() }));
vi.mock('@/lib/colors/get-colors', () => ({ getColorsForCategory: vi.fn() }));

const item = { productSlug: 'collection', variantSlug: 'blue', quantity: 2 };
const resolved = { name: 'Plava', sku: 'BLUE-42', image: '/blue.jpg', url: '/proizvodi/collection?color=blue', unit: 'm²', price: 123.45 };

describe('commerce authoritative quote', () => {
  it('uses confirmed-customer 10% and an individual zero override', async () => {
    expect(customerDiscount(null)).toBe(10);
    expect(customerDiscount(0)).toBe(0);
    const quote = await buildQuote([item], 10, async () => resolved);
    expect(quote.lines[0]).toMatchObject({ listUnitPriceMinor: 12345, unitPriceMinor: 11111, lineTotalMinor: 22222 });
    expect((await buildQuote([item], 0, async () => resolved)).knownTotalMinor).toBe(24690);
  });

  it('drops client-provided identity, discount and money', () => {
    expect(validateCartItems([{ ...item, price: 1, customerId: 'other', discountPercent: 100 }])).toEqual([item]);
  });

  it.each([NaN, Infinity, -1, 0, '2', 0.0001, 100001])('rejects invalid quantity %s', (quantity) => {
    expect(() => validateCartItems([{ ...item, quantity }])).toThrow();
  });

  it('keeps missing and zero catalog prices null', async () => {
    for (const price of [undefined, null, 0]) {
      const quote = await buildQuote([item], 10, async () => ({ ...resolved, price }));
      expect(quote.lines[0].lineTotalMinor).toBeNull();
      expect(quote.hasUnpricedItems).toBe(true);
      expect(quote.knownTotalMinor).toBe(0);
    }
  });

  it('only rounds m² packages when a concrete package coverage is present', async () => {
    expect((await buildQuote([item], 10, async () => resolved)).lines[0].quantity).toBe(2);
    expect((await buildQuote([item], 10, async () => ({ ...resolved, coveragePerPackage: 2.25 }))).lines[0].quantity).toBe(2.25);
    await expect(buildQuote([{ ...item, quantity: 1.5 }], 10, async () => ({ ...resolved, unit: 'kom' }))).rejects.toThrow();
  });

  it('binds quote key to current price, quantities and rebate', async () => {
    const initial = await buildQuote([item], 10, async () => resolved);
    expect((await buildQuote([item], 10, async () => resolved)).quoteKey).toBe(initial.quoteKey);
    expect((await buildQuote([item], 0, async () => resolved)).quoteKey).not.toBe(initial.quoteKey);
    expect((await buildQuote([item], 10, async () => ({ ...resolved, price: 124 }))).quoteKey).not.toBe(initial.quoteKey);
    expect((await buildQuote([item], 10, async () => ({ ...resolved, sku: 'BLUE-43' }))).quoteKey).not.toBe(initial.quoteKey);
    expect((await buildQuote([item], 10, async () => ({ ...resolved, image: '/new.jpg', name: 'Plava 2', url: '/x' }))).quoteKey).toBe(initial.quoteKey);
  });

  it('rejects one article reached through two cart keys', async () => {
    const twice = [{ productSlug: 'a', variantSlug: 'b', quantity: 1 }, { productSlug: 'b', variantSlug: 'b', quantity: 1 }];
    await expect(buildQuote(twice, 10, async () => ({ ...resolved, identity: 'b' }))).rejects.toMatchObject({ lineKey: 'b:b' });
  });

  it('tags a per-line catalog failure with the cart line key', async () => {
    const resolver = async (line: { productSlug: string }) => {
      if (line.productSlug === 'b') throw new CommerceError('Proizvod više nije u ponudi.', 400, 'PRODUCT_NOT_FOUND');
      return resolved;
    };
    await expect(buildQuote([item, { productSlug: 'b', quantity: 1 }], 10, resolver)).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND', lineKey: 'b:' });
    await expect(buildQuote([{ ...item, quantity: 1.5 }], 10, async () => ({ ...resolved, unit: 'kom' }))).rejects.toMatchObject({ lineKey: 'collection:blue' });
  });

  it('keeps temporary 5xx line failures cart-level so the customer can retry instead of removing a valid line', async () => {
    const failure = await buildQuote([item], 10, async () => { throw new CommerceError('Varijante proizvoda trenutno nisu dostupne.', 503); }).catch((error) => error);
    expect(failure).toBeInstanceOf(CommerceError);
    expect(failure.status).toBe(503);
    expect(failure.lineKey).toBeUndefined();
  });

  it('memoizes resolved lines but never caches a failure', async () => {
    const { resolveProductBySlug } = await import('@/lib/product-page/resolve-product');
    const { prepareCustomColors } = await import('@/lib/product-page/prepare-colors');
    vi.mocked(prepareCustomColors).mockResolvedValue([]);
    vi.mocked(resolveProductBySlug).mockResolvedValue({ slug: 'memo-plain', name: 'Memo', sku: 'M-1', priceUnit: 'kom', price: 10, specs: [] } as never);
    const line = { productSlug: 'memo-plain', quantity: 1 };
    expect(await resolveCommerceLine(line)).toMatchObject({ sku: 'M-1', identity: 'memo-plain' });
    expect(await resolveCommerceLine({ ...line, quantity: 7 })).toMatchObject({ sku: 'M-1' });
    expect(resolveProductBySlug).toHaveBeenCalledTimes(1);
    vi.mocked(resolveProductBySlug).mockResolvedValueOnce(null);
    await expect(resolveCommerceLine({ productSlug: 'memo-missing', quantity: 1 })).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND' });
    expect(await resolveCommerceLine({ productSlug: 'memo-missing', quantity: 1 })).toMatchObject({ sku: 'M-1' });
    expect(resolveProductBySlug).toHaveBeenCalledTimes(3);
  });

  it('reads variant price, unit and package only from a same-category record', async () => {
    const { resolveProductBySlug } = await import('@/lib/product-page/resolve-product');
    const { prepareCustomColors } = await import('@/lib/product-page/prepare-colors');
    vi.mocked(prepareCustomColors).mockResolvedValue([{ slug: 'guard-linen', code: 'L-400', name: 'Linen' }]);
    vi.mocked(resolveProductBySlug).mockImplementation(async (slug: string) => (slug === 'guard-lino'
      ? { slug, categoryId: '7', name: 'Lino', price: null, priceUnit: 'm²', specs: [] }
      : { slug, categoryId: '10', name: 'Sport', price: 999, priceUnit: 'kom', coveragePerPackage: 2, specs: [] }) as never);
    const line = await resolveCommerceLine({ productSlug: 'guard-lino', variantSlug: 'guard-linen', quantity: 1 });
    expect(line).toMatchObject({ sku: 'L-400', price: null, unit: 'm²', identity: 'guard-linen' });
    expect(line.coveragePerPackage).toBeUndefined();
  });

  it('treats concrete package coverage without a unit as m²', async () => {
    const { resolveProductBySlug } = await import('@/lib/product-page/resolve-product');
    const { prepareCustomColors } = await import('@/lib/product-page/prepare-colors');
    vi.mocked(prepareCustomColors).mockResolvedValue([{ slug: 'pack-oak', code: 'OAK', name: 'Hrast' }]);
    vi.mocked(resolveProductBySlug).mockImplementation(async (slug: string) => ({ slug, categoryId: '3', name: 'Parket', price: 100, coveragePerPackage: slug === 'pack-oak' ? 1.584 : undefined, specs: [] }) as never);
    const resolve = () => resolveCommerceLine({ productSlug: 'pack-parket', variantSlug: 'pack-oak', quantity: 1 });
    expect(await resolve()).toMatchObject({ unit: 'm²', coveragePerPackage: 1.584 });
    expect((await buildQuote([{ productSlug: 'pack-parket', variantSlug: 'pack-oak', quantity: 10 }], 10, resolve)).lines[0].quantity).toBe(11.088);
  });

  it('rejects real variants from another collection before reading their price', async () => {
    const { resolveProductBySlug } = await import('@/lib/product-page/resolve-product');
    const { prepareCustomColors } = await import('@/lib/product-page/prepare-colors');
    vi.mocked(resolveProductBySlug).mockResolvedValue({ slug: 'collection', categoryId: '2', name: 'Collection', specs: [] } as never);
    vi.mocked(prepareCustomColors).mockResolvedValue([{ slug: 'blue', code: 'BLUE-42' }]);
    await expect(resolveCommerceLine({ ...item, variantSlug: 'foreign-red' })).rejects.toMatchObject({ code: 'INVALID_VARIANT' });
    expect(resolveProductBySlug).toHaveBeenCalledTimes(1);
  });
});
