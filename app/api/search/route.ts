import { NextRequest, NextResponse } from 'next/server';
import { productRepository } from '@/lib/repositories/product-repository';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import { getBrandPageCopy, getCategoryPageCopy } from '@/lib/seo/listing-page-copy';
import { splitProductTitle } from '@/lib/utils/name-parser';
import { normalizeSearchText } from '@/lib/utils/search-normalization';
import { getCanonicalProductHref } from '@/lib/utils/product-routes';
import { getPrimaryProductImage, getProductImageCandidates } from '@/lib/utils/product-images';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
        return NextResponse.json({ products: [], categories: [], brands: [] });
    }

    const queryNormalized = normalizeSearchText(query);
    const scoreProductMatch = (product: Awaited<ReturnType<typeof productRepository.findAll>>[number]) => {
        const shortDescription = normalizeSearchText(product.shortDescription);
        const description = normalizeSearchText(product.description);
        const techemFamily = normalizeSearchText(product.specs?.find((spec) => spec.key === '__techem_family')?.value);
        const techemTopCategory = normalizeSearchText(product.specs?.find((spec) => spec.key === '__techem_top_category')?.value);
        const productName = normalizeSearchText(product.name);

        if (productName === queryNormalized) return 120;
        if (productName.startsWith(queryNormalized)) return 100;
        if (techemFamily === queryNormalized || techemTopCategory === queryNormalized) return 95;
        if (productName.includes(queryNormalized)) return 80;
        if (techemFamily.includes(queryNormalized) || techemTopCategory.includes(queryNormalized)) return 70;
        if (shortDescription.includes(queryNormalized)) return 55;
        if (description.includes(queryNormalized)) return 35;
        return 10;
    };

    // Search products (top 8)
    const allProducts = await productRepository.findAll({ search: query });
    const products = allProducts
        .sort((a, b) => scoreProductMatch(b) - scoreProductMatch(a))
        .slice(0, 8)
        .map(p => {
        let displayName = p.name;
        if (p.categoryId === '6' && p.name.startsWith('Gerflor ')) {
            displayName = p.name.replace(/^Gerflor\s+/, '');
        }

        const rawCollection = p.specs?.find(s => s.key === 'collection')?.value || (p as any).collectionSlug;
        const { collection, color } = splitProductTitle(displayName, rawCollection);
        const formattedName = collection && collection.toLowerCase() !== color.toLowerCase()
            ? `${color} (${collection})`
            : color;
        const subtitle =
            p.specs?.find((spec) => spec.key === '__techem_family')?.value ||
            p.shortDescription ||
            undefined;

        return {
            id: p.id,
            slug: p.slug,
            url: getCanonicalProductHref(p as typeof p & { collectionSlug?: string }),
            name: formattedName,
            categoryId: p.categoryId,
            image: getPrimaryProductImage(p, 'thumb')?.url || '/images/placeholder.svg',
            imageCandidates: getProductImageCandidates(p, 'thumb').slice(0, 4),
            price: p.price,
            subtitle,
        };
    });

    // Search categories
    const allCategories = await categoryRepository.findAll();
    const categories = allCategories
        .filter(c => {
            const categoryCopy = getCategoryPageCopy(c);
            const searchableText = [
                c.name,
                c.slug,
                c.description,
                categoryCopy.lead,
                categoryCopy.body,
                categoryCopy.metaDescription,
                categoryCopy.keywords.join(' '),
            ]
                .filter(Boolean)
                .join(' ');

            return normalizeSearchText(searchableText).includes(queryNormalized);
        })
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
        .filter(b => {
            const brandCopy = getBrandPageCopy(b);
            const searchableText = [
                b.name,
                b.slug,
                b.description,
                brandCopy.lead,
                brandCopy.body,
                brandCopy.metaDescription,
                brandCopy.keywords.join(' '),
            ]
                .filter(Boolean)
                .join(' ');

            return normalizeSearchText(searchableText).includes(queryNormalized);
        })
        .slice(0, 4)
        .map(b => ({
            id: b.id,
            slug: b.slug,
            name: b.name,
            logo: b.logo,
        }));

    return NextResponse.json({ products, categories, brands });
}
