import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/types';
import { productRepository } from '@/lib/repositories/product-repository';
import { hasCollectionSku } from '@/lib/utils/homepage-collection-filter';

export const dynamic = 'force-dynamic';

type HomeColorGroup = {
  categoryId: string;
  products: Product[];
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
  const groups = await Promise.all(
    uniqueCategoryIds.map(async (categoryId) => {
      const products = await productRepository.findByCategory(categoryId);
      return {
        categoryId,
        products: selectHomepageColors(products),
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
