import { NextRequest, NextResponse } from 'next/server';
import { productRepository } from '@/lib/repositories/product-repository';

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

    // Fetch all products and filter by IDs
    // TODO: optimize with a Supabase .in() query when product repo is updated
    const allProducts = await productRepository.findAll({});
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
            price: p.price,
            priceUnit: p.priceUnit,
            inStock: p.inStock,
        }));

    return NextResponse.json({ products });
}
