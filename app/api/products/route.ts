import { NextRequest, NextResponse } from 'next/server';
import { productRepository } from '@/lib/repositories/product-repository';
import { getProductPriceSummary } from '@/lib/utils/product-price';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
        return NextResponse.json({ products: [] });
    }

    const idList = ids.split(',').filter(Boolean);
    if (idList.length === 0) {
        return NextResponse.json({ products: [] });
    }

    // categoryIds (npr. iz „Uporedi") sužava pretragu i uključuje boje/varijante
    // tih kategorija; bez njega ostaje istorijsko ponašanje findAll({}).
    const categoryIds = (searchParams.get('categoryIds') || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 6);
    const allProducts = categoryIds.length > 0
        ? (await Promise.all(Array.from(new Set(categoryIds)).map((categoryId) => productRepository.findByCategory(categoryId)))).flat()
        : await productRepository.findAll({});
    const products = allProducts
        .filter(p => idList.includes(p.id))
        .map(p => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            shortDescription: p.shortDescription,
            categoryId: p.categoryId,
            brandId: p.brandId,
            images: p.images,
            specs: p.specs,
            ...getProductPriceSummary(p),
            inStock: p.inStock,
            availability: p.availability,
        }));

    return NextResponse.json({ products });
}
