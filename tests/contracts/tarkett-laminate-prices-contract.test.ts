import { describe, expect, it } from 'vitest';
import { tarkettProducts } from '@/lib/data/tarkett-products';

const expectedCollections = {
  'Winter 832': { price: 1210, count: 4 },
  'Journey 731 4V': { price: 1170, count: 6 },
  'Easy Line 832 4V': { price: 1350, count: 6 },
  'Roads 833 4V': { price: 1470, count: 6 },
  'Frontier 1033 4V': { price: 1770, count: 7 },
  'Blues 1033 4V': { price: 2010, count: 8 },
  'Woodstock Longboards 1033 4V': { price: 2170, count: 7 },
  'Giant 1233 4V': { price: 2010, count: 7 },
  'Timeless 1232 4V': { price: 2160, count: 6 },
  'River 1233 4V': { price: 2170, count: 7 },
} as const;

function collectionOf(product: (typeof tarkettProducts)[number]): string | undefined {
  return product.specs.find((spec) => spec.key === 'collection')?.value;
}

describe('Tarkett laminat cenovnik od 01.06.2026', () => {
  const laminates = tarkettProducts.filter(
    (product) => product.categoryId === '1' && product.brandId === '3'
  );

  it('pokriva svih 64 proizvoda u tačno 10 kolekcija', () => {
    expect(laminates).toHaveLength(64);
    expect([...new Set(laminates.map(collectionOf))].sort()).toEqual(
      Object.keys(expectedCollections).sort()
    );
  });

  it.each(Object.entries(expectedCollections))(
    '%s ima jedinstvenu novu cenu na headeru i svim varijantama',
    (collection, expected) => {
      const products = laminates.filter((product) => collectionOf(product) === collection);

      expect(products).toHaveLength(expected.count);
      expect(new Set(products.map((product) => product.price))).toEqual(
        new Set([expected.price])
      );
      expect(new Set(products.map((product) => product.priceUnit))).toEqual(new Set(['m²']));
    }
  );
});
