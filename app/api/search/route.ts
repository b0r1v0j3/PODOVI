import { NextRequest, NextResponse } from 'next/server';
import { productRepository } from '@/lib/repositories/product-repository';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import { splitProductTitle } from '@/lib/utils/name-parser';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
        return NextResponse.json({ products: [], categories: [], brands: [] });
    }

    const queryLower = query.toLowerCase();

    // Search products (top 8)
    const allProducts = await productRepository.findAll({ search: query });
    const products = allProducts.slice(0, 8).map(p => {
        let displayName = p.name;
        if (p.categoryId === '6' && p.name.startsWith('Gerflor ')) {
            displayName = p.name.replace(/^Gerflor\s+/, '');
        }

        const rawCollection = p.specs?.find(s => s.key === 'collection')?.value || (p as any).collectionSlug;
        const { collection, color } = splitProductTitle(displayName, rawCollection);
        const formattedName = collection && collection.toLowerCase() !== color.toLowerCase()
            ? `${color} (${collection})`
            : color;

        let url = `/proizvodi/${p.slug}`;
        if (rawCollection) {
            const isColorTile = ['2', '4', '6', '7'].includes(p.categoryId);
            const isProductColor = ['1', '3'].includes(p.categoryId);

            if (isColorTile) {
                const categorySlugMap: Record<string, string> = {
                    '6': 'lvt', '7': 'linoleum', '4': 'tekstilne-ploce', '2': 'vinil'
                };
                url = `/kategorije/${categorySlugMap[p.categoryId] || 'lvt'}?color=${p.slug}`;
            } else if (isProductColor) {
                const dSlug = rawCollection.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                url = `/proizvodi/${dSlug}?color=${p.slug}`;
            }
        }

        return {
            id: p.id,
            slug: p.slug,
            url: url,
            name: formattedName,
            categoryId: p.categoryId,
            image: p.images?.[0]?.url || '/images/placeholder.svg',
            price: p.price,
        };
    });

    // Search categories
    const allCategories = await categoryRepository.findAll();
    const categories = allCategories
        .filter(c => c.name.toLowerCase().includes(queryLower) || c.slug.toLowerCase().includes(queryLower))
        .slice(0, 4)
        .map(c => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            image: c.image,
        }));

    // Search brands
    const allBrands = await brandRepository.findAll();
    const brands = allBrands
        .filter(b => b.name.toLowerCase().includes(queryLower))
        .slice(0, 4)
        .map(b => ({
            id: b.id,
            slug: b.slug,
            name: b.name,
        }));

    return NextResponse.json({ products, categories, brands });
}
