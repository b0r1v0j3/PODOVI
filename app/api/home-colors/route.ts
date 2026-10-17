import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/types';
import { productRepository } from '@/lib/repositories/product-repository';
import { hasCollectionSku } from '@/lib/utils/homepage-collection-filter';
import { getEsdColorProducts } from '@/lib/product-page/color-helpers';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { buildHomeCatalogItems, type HomeCatalogItem } from '@/lib/catalog/home-catalog-index';

export const dynamic = 'force-dynamic';

type HomeColorGroup = {
  categoryId: string;
  /** Sažete stavke (kartica + kanonske vrednosti filtera), ne puni proizvodi. */
  products: HomeCatalogItem[];
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

function selectHomepageColors(products: Product[]): Product[] {
  return dedupeBySlug(products.filter((product) => !hasCollectionSku(product)));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryIds = searchParams
    .get('categoryIds')
    ?.split(',')
    .map((id) => id.trim())
    .filter(Boolean) || [];

  if (categoryIds.length === 0) {
    return NextResponse.json({ groups: [] as HomeColorGroup[] });
  }

  const uniqueCategoryIds = Array.from(new Set(categoryIds));
  const categories = await categoryRepository.findAll();
  const slugById = new Map(categories.map((category) => [category.id, category.slug]));
  const groups = await Promise.all(
    uniqueCategoryIds.filter((categoryId) => slugById.has(categoryId)).map(async (categoryId) => {
      const products = await productRepository.findByCategory(categoryId);
      const contextProducts = categoryId === '8' ? [...products, ...getEsdColorProducts()] : products;
      // Nasleđivanje filter vrednosti računa se nad celom kategorijom (kolekcije + boje).
      return {
        categoryId,
        products: buildHomeCatalogItems(slugById.get(categoryId)!, contextProducts, selectHomepageColors(contextProducts), 'color'),
      };
    }),
  );

  return NextResponse.json(
    { groups },
    {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
