import { categoryRepository } from '@/lib/repositories/category-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import HomeProductTabs, { HomeProductGroup } from '@/components/HomeProductTabs';
import { Product } from '@/types';
import { hasCollectionSku } from '@/lib/utils/homepage-collection-filter';

export const metadata = {
  title: 'podovi',
  description: 'Pronađite pravo rešenje za vaš prostor: laminat, vinil, parket, alati, lajsne, otirači i drugi sistemi vodećih evropskih brendova.',
};

function dedupeBySlug(products: Product[]): Product[] {
  const seen = new Set<string>();

  return products.filter((product) => {
    if (!product.slug || seen.has(product.slug)) {
      return false;
    }

    seen.add(product.slug);
    return true;
  });
}

function getCollectionName(product: Product): string {
  return product.specs?.find((spec) => spec.key === 'collection')?.value ||
    product.specs?.find((spec) => spec.key === 'brand_line')?.value ||
    product.name;
}

function backfillCollectionImages(product: Product, allProducts: Product[]): Product {
  if (product.images?.length > 0) {
    return product;
  }

  const collectionName = getCollectionName(product);
  const variantWithImage = allProducts.find((candidate) => {
    if (candidate.id === product.id || hasCollectionSku(candidate) || !candidate.images?.length) {
      return false;
    }

    return getCollectionName(candidate) === collectionName;
  });

  return variantWithImage ? { ...product, images: variantWithImage.images } : product;
}

function selectHomepageProducts(products: Product[]): Product[] {
  const collectionProducts = products.filter(hasCollectionSku);
  const source = collectionProducts.length > 0 ? collectionProducts : products;

  return dedupeBySlug(source)
    .map((product) => backfillCollectionImages(product, products))
    .sort((a, b) => Number((b.images?.length || 0) > 0) - Number((a.images?.length || 0) > 0));
}

export default async function HomePage() {
  const categories = await categoryRepository.findAll();
  const homepageCategories = categories;
  const [brands, productBuckets] = await Promise.all([
    brandRepository.findAll(),
    Promise.all(homepageCategories.map((category) => productRepository.findByCategory(category.id))),
  ]);
  const brandsRecord = Object.fromEntries(brands.map((brand) => [brand.id, brand]));
  const productGroups: HomeProductGroup[] = homepageCategories
    .map((category, index) => {
      const products = productBuckets[index] || [];
      const selectedProducts = selectHomepageProducts(products);

      return {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        products: selectedProducts,
        totalCount: selectedProducts.length,
      };
    })
    .filter((group) => group.products.length > 0);

  return (
    <div className="bg-white">
      <HomeProductTabs groups={productGroups} brandsRecord={brandsRecord} />
    </div>
  );
}
