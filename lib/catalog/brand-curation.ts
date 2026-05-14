import { Brand, Product } from '@/types';
import { PARKET_HEADER_COLLECTIONS } from '@/lib/data/parket-collection-mapping';

type BrandListingMode = 'collections' | 'products';

const COLLECTION_FIRST_BRAND_IDS = new Set(['3', '6', '8', '11', '14']);

function isParketCollectionHeader(product: Product): boolean {
  return (
    (product.sku?.startsWith('PARKET-') &&
      !product.sku.includes('OAK') &&
      !product.sku.includes('ASH')) ||
    (PARKET_HEADER_COLLECTIONS as readonly string[]).includes(product.name)
  );
}

function isCollectionRepresentative(product: Product): boolean {
  const slug = String(product.slug || '').toLowerCase();
  const sku = String(product.sku || '').toUpperCase();

  if (slug.includes('?color=')) {
    return false;
  }

  if (product.categoryId === '1') {
    return sku.startsWith('LAM-');
  }

  if (product.categoryId === '3') {
    return product.brandId === '14' && sku.startsWith('PODOVI-COLLECTION-')
      ? true
      : isParketCollectionHeader(product);
  }

  if (product.brandId === '14' && sku.startsWith('PODOVI-COLLECTION-')) {
    return true;
  }

  if (!['2', '4', '5', '6', '7', '8', '9', '10', '11'].includes(product.categoryId)) {
    return false;
  }

  return (
    slug.startsWith('gerflor-') ||
    slug.startsWith('tarkett-') ||
    slug.startsWith('wolflor-') ||
    slug.startsWith('bloq-') ||
    slug.startsWith('podovi-') ||
    sku.startsWith('VINIL-') ||
    sku.startsWith('LVT-') ||
    sku.startsWith('LINOLEUM-') ||
    sku.startsWith('TARKETT-') ||
    sku.startsWith('WOLFLOR-VINYL-') ||
    sku.startsWith('BLOQ-') ||
    sku.startsWith('CARPET')
  );
}

export function curateBrandPageProducts(
  brand: Brand,
  products: Product[]
): {
  products: Product[];
  listingMode: BrandListingMode;
  totalItems: number;
  collectionCount: number;
} {
  const totalItems = products.length;
  const collectionProducts = products.filter(isCollectionRepresentative);

  if (
    COLLECTION_FIRST_BRAND_IDS.has(brand.id) &&
    collectionProducts.length > 0
  ) {
    return {
      products: collectionProducts,
      listingMode: 'collections',
      totalItems,
      collectionCount: collectionProducts.length,
    };
  }

  return {
    products,
    listingMode: 'products',
    totalItems,
    collectionCount: collectionProducts.length,
  };
}
