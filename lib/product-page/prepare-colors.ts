import type { Product, ProductSpec } from '@/types';
import type { ColorFromJSON } from './types';
import {
    loadColorFromJson,
    cleanColorName,
    buildSpecsFromColor,
    mergeSpecs,
    linoleumColors,
} from './color-helpers';
import {
    getEffectiveParketCollection,
    getParketCollectionNameBySlug,
    getParketCollectionSlug,
    getParketCollectionVariantSlugs,
} from '@/lib/data/parket-collection-mapping';
import bloqCarpetData from '@/public/data/bloq_carpet_tiles.json';

/**
 * Build the customColors array used by ProductColorSelector for variant switching.
 * Handles Parket, Laminat, and BLOQ Carpet categories.
 */
export async function prepareCustomColors(
    product: Product,
    pageSlug: string
): Promise<any[] | undefined> {
    // Parket: customColors iz varijanti iste kolekcije
    if (product.categoryId === '3') {
        const { tarkettProducts } = await import('@/lib/data/tarkett-products');
        const collectionName = getParketCollectionNameBySlug(pageSlug) ?? product.specs?.find(s => s.key === 'collection')?.value ?? null;
        if (collectionName) {
            const explicitSlugs = getParketCollectionVariantSlugs(collectionName);
            const variants = explicitSlugs.length > 0
                ? (explicitSlugs
                    .map(slug => tarkettProducts.find(p =>
                        p.categoryId === '3' &&
                        !(p.sku && String(p.sku).startsWith('PARKET-')) &&
                        p.slug === slug &&
                        getEffectiveParketCollection(p.slug, p.specs?.find(s => s.key === 'collection')?.value) === collectionName
                    ))
                    .filter(Boolean) as typeof tarkettProducts)
                : tarkettProducts.filter(p => {
                    if (p.categoryId !== '3' || (p.sku && String(p.sku).startsWith('PARKET-'))) return false;
                    return getEffectiveParketCollection(p.slug, p.specs?.find(s => s.key === 'collection')?.value) === collectionName;
                });
            if (variants.length > 0) {
                return variants.map(v => ({
                    collection: collectionName,
                    collection_name: collectionName,
                    code: v.sku,
                    name: v.name,
                    full_name: v.name,
                    slug: v.slug,
                    image_url: v.images?.[0]?.url || '',
                    texture_url: v.images?.[0]?.url || '',
                    image_count: v.images?.length ?? 0,
                    characteristics: (v.specs || []).reduce((acc: Record<string, string>, spec: ProductSpec) => {
                        acc[spec.label] = spec.value;
                        return acc;
                    }, {} as Record<string, string>)
                }));
            }
        }
    }

    // Laminat: customColors iz varijanti iste kolekcije
    if (product.categoryId === '1' && product.sku?.startsWith('LAM-')) {
        const { tarkettProducts } = await import('@/lib/data/tarkett-products');
        const collectionName = product.specs?.find(s => s.key === 'collection')?.value ?? null;
        if (collectionName) {
            const variants = tarkettProducts.filter(p =>
                p.categoryId === '1' && !p.sku?.startsWith('LAM-') && p.specs?.find(s => s.key === 'collection')?.value === collectionName
            );
            if (variants.length > 0) {
                const bySlug = new Map<string, typeof variants[0]>();
                for (const v of variants) {
                    if (v.slug && !bySlug.has(v.slug)) bySlug.set(v.slug, v);
                }
                const uniqueVariants = Array.from(bySlug.values());
                return uniqueVariants.map(v => ({
                    collection: collectionName,
                    collection_name: collectionName,
                    code: v.sku,
                    name: v.name,
                    full_name: v.name,
                    slug: v.slug,
                    image_url: v.images?.[0]?.url || '',
                    texture_url: v.images?.[0]?.url || '',
                    image_count: v.images?.length ?? 0,
                    characteristics: (v.specs || []).reduce((acc: Record<string, string>, spec: ProductSpec) => {
                        acc[spec.label] = spec.value;
                        return acc;
                    }, {} as Record<string, string>)
                }));
            }
        }
    }



    // BLOQ Carpet: customColors from bloq_carpet_tiles.json
    if (product.categoryId === '4' && (product.sku === 'BLOQ-CARPET' || product.sku?.startsWith('BLOQ-'))) {
        const bloqColors = (bloqCarpetData as any).colors || [];
        const collectionColors = bloqColors.filter((c: any) => c.collection_slug === pageSlug);
        if (collectionColors.length > 0) {
            return collectionColors.map((c: any) => ({
                collection: c.collection_slug,
                collection_name: c.collection_name,
                code: c.code,
                name: c.name,
                full_name: c.full_name || c.name,
                slug: c.slug,
                image_url: c.image_url || '',
                texture_url: c.image_url || '',
                image_count: c.image_url ? 1 : 0,
                characteristics: c.characteristics || {},
            }));
        }
    }

    // Tarkett LVT: customColors from tarkett_lvt_products.json
    if (product.categoryId === '6' && product.sku?.startsWith('TARKETT-')) {
        const { getAllTarkettLVTProducts } = await import('@/lib/utils/productDataLoader');
        const collectionName = product.specs?.find(s => s.key === 'collection')?.value ?? null;
        if (collectionName) {
            const variants = getAllTarkettLVTProducts().filter(p =>
                p.specs?.find((s: ProductSpec) => s.key === 'collection')?.value === collectionName
            );
            if (variants.length > 0) {
                return variants.map(v => ({
                    collection: collectionName,
                    collection_name: collectionName,
                    code: v.sku,
                    name: v.name,
                    full_name: v.name,
                    slug: v.slug,
                    image_url: v.images?.[0]?.url || '',
                    texture_url: v.images?.[0]?.url || '',
                    image_count: v.images?.length ?? 0,
                    characteristics: (v.specs || []).reduce((acc: Record<string, string>, spec: ProductSpec) => {
                        acc[spec.label] = spec.value;
                        return acc;
                    }, {} as Record<string, string>)
                }));
            }
        }
    }

    return undefined;
}

/**
 * Merge selected color variant data into the product object.
 * Handles LVT/Linoleum/Vinil/Tekstilne color merging, Parket variant merging, and Laminat variant merging.
 */
export async function mergeSelectedColor(
    product: Product,
    selectedColorSlug: string
): Promise<void> {
    // LVT/Linoleum/Vinil/Tekstilne: merge color from JSON
    if (selectedColorSlug && !product.slug.includes(selectedColorSlug) && product.categoryId !== '3' && product.categoryId !== '1') {
        const colorSource = await loadColorFromJson(selectedColorSlug);
        if (colorSource?.color) {
            const cleanedName = cleanColorName(colorSource.color.name);
            const colorCode = colorSource.color.code || '';
            const cleanFullName = colorCode ? `${colorCode} ${cleanedName}` : cleanedName;

            product.name = cleanFullName;
            product.shortDescription = `${colorSource.color.collection_name} - ${cleanedName}`;

            const colorImageUrl = colorSource.color.texture_url || colorSource.color.lifestyle_url || colorSource.color.image_url;
            if (colorImageUrl) {
                product.images = [{
                    id: `color-img-${selectedColorSlug}`,
                    url: colorImageUrl,
                    alt: product.name,
                    isPrimary: true,
                    order: 1,
                }];
            }

            const colorSpecs = buildSpecsFromColor(colorSource.color);
            if (colorSpecs.length > 0) {
                product.specs = mergeSpecs(product.specs, colorSpecs);
            }
            if (colorSource.color.description && typeof colorSource.color.description === 'string' && colorSource.color.description.trim()) {
                product.description = colorSource.color.description.trim();
            }
        }
    }

    // Parket: merge selected variant
    if (selectedColorSlug && product.categoryId === '3' && product.sku?.startsWith('PARKET-')) {
        const { tarkettProducts } = await import('@/lib/data/tarkett-products');
        const parketVariant = tarkettProducts.find(p => p.categoryId === '3' && p.slug === selectedColorSlug);
        if (parketVariant) {
            product.name = parketVariant.name;
            product.shortDescription = parketVariant.shortDescription || product.shortDescription;
            if (parketVariant.images && parketVariant.images.length > 0) {
                product.images = parketVariant.images;
            }
            if (parketVariant.specs && parketVariant.specs.length > 0) {
                product.specs = mergeSpecs(product.specs, parketVariant.specs);
            }
        }
    }

    // Laminat: merge selected variant
    if (selectedColorSlug && product.categoryId === '1' && product.sku?.startsWith('LAM-')) {
        const { tarkettProducts } = await import('@/lib/data/tarkett-products');
        const laminatVariant = tarkettProducts.find(p => p.categoryId === '1' && !p.sku?.startsWith('LAM-') && p.slug === selectedColorSlug);
        if (laminatVariant) {
            product.name = laminatVariant.name;
            product.shortDescription = laminatVariant.shortDescription || product.shortDescription;
            if (laminatVariant.images && laminatVariant.images.length > 0) {
                product.images = laminatVariant.images;
            }
            if (laminatVariant.specs && laminatVariant.specs.length > 0) {
                product.specs = mergeSpecs(product.specs, laminatVariant.specs);
            }
        }
    }

}
