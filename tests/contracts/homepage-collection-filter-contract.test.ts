import { describe, expect, it } from 'vitest';
import { productRepository } from '@/lib/repositories/product-repository';
import { hasCollectionSku } from '@/lib/utils/homepage-collection-filter';
import { Product } from '@/types';

/**
 * Simulates what `selectHomepageProducts` in app/page.tsx does:
 * if any product has a collection-style SKU, only those become the rail.
 * Otherwise the whole bucket is shown (fallback for flat catalogs).
 */
function selectHomepageRail(products: Product[]): Product[] {
  const collectionProducts = products.filter(hasCollectionSku);
  return collectionProducts.length > 0 ? collectionProducts : products;
}

/**
 * Homepage rail size guards. These guard against the class of bug that hit
 * TimberTech deking in May 2026: a loader emits products with an SKU prefix
 * that COLLECTION_SKU_PREFIXES doesn't whitelist, so the products silently
 * disappear from the homepage rail.
 *
 * Each minimum is set conservatively below today's count so harmless changes
 * (collection sunset, brand cleanup) don't break the test, but a wholesale
 * drop is caught.
 */
const homepageRailExpectations = [
  { categoryId: '1', name: 'Laminat', minCollectionCards: 1 },
  { categoryId: '2', name: 'Vinil', minCollectionCards: 10 },
  { categoryId: '3', name: 'Parket', minCollectionCards: 5 },
  { categoryId: '4', name: 'Tekstilne ploče', minCollectionCards: 8 },
  { categoryId: '5', name: 'Deking', minCollectionCards: 4 },
  { categoryId: '6', name: 'LVT', minCollectionCards: 15 },
  { categoryId: '7', name: 'Linoleum', minCollectionCards: 3 },
  { categoryId: '8', name: 'Elektroprovodni', minCollectionCards: 3 },
  { categoryId: '9', name: 'Industrijske ploče', minCollectionCards: 3 },
  { categoryId: '10', name: 'Sport', minCollectionCards: 2 },
  { categoryId: '11', name: 'Lajsne', minCollectionCards: 1 },
  { categoryId: '12', name: 'Otirači', minCollectionCards: 10 },
  { categoryId: '13', name: 'Alat', minCollectionCards: 10 },
];

describe('Homepage rail size guards', () => {
  it.each(homepageRailExpectations)(
    'category $categoryId ($name) shows at least $minCollectionCards products on the homepage rail',
    async ({ categoryId, minCollectionCards }) => {
      const products = await productRepository.findByCategory(categoryId);
      const rail = selectHomepageRail(products);

      expect(rail.length).toBeGreaterThanOrEqual(minCollectionCards);
    }
  );
});

/**
 * Anchor test: a curated set of collections we know should appear in the
 * homepage rail. This catches per-collection drift even if the overall count
 * stays within the minimum.
 */
const homepageAnchorCollections = [
  { categoryId: '5', slug: 'podovi-deking-exterra-timber', label: 'Podovi Exterra Timber deking' },
  { categoryId: '6', slug: 'gerflor-creation-30', label: 'Gerflor Creation 30 LVT' },
  { categoryId: '6', slug: 'gerflor-creation-55', label: 'Gerflor Creation 55 LVT' },
  { categoryId: '6', slug: 'gerflor-creation-70', label: 'Gerflor Creation 70 LVT' },
];

describe('Homepage rail anchor collections', () => {
  it.each(homepageAnchorCollections)(
    '$label is reachable on the homepage rail for category $categoryId',
    async ({ categoryId, slug }) => {
      const products = await productRepository.findByCategory(categoryId);
      const rail = selectHomepageRail(products);

      const railSlugs = rail.map((product) => product.slug);
      expect(railSlugs).toContain(slug);
    }
  );
});
