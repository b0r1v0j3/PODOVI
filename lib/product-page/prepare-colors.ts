import type { Product, ProductSpec } from '@/types';
import type { ColorFromJSON } from './types';
import {
    loadColorFromJson,
    cleanColorName,
    buildSpecsFromColor,
    mergeSpecs,
    linoleumColors,
    buildNestedColorSlug,
    vinylCollections,
    esdCollections,
    industrialCollections,
    sportCollections,
} from './color-helpers';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import {
    getEffectiveParketCollection,
    getParketCollectionNameBySlug,
    getParketCollectionSlug,
    getParketCollectionVariantSlugs,
} from '@/lib/data/parket-collection-mapping';
import bloqCarpetData from '@/public/data/bloq_carpet_tiles.json';
import { getAllDekingProducts } from '@/lib/utils/productDataLoader';

function mapNestedCollectionColors(collection: any) {
    return (collection.colors || [])
        .filter((color: any) => Boolean(color.image || color.image_url))
        .map((color: any) => ({
        collection: collection.slug,
        collection_name: collection.name,
        code: color.code || '',
        name: color.name,
        full_name: `${color.code || ''} ${color.name}`.trim(),
        slug: color.slug || buildNestedColorSlug(collection, color),
        image_url: color.image || color.image_url || '',
        texture_url: color.image || color.image_url || '',
        image_count: (color.image || color.image_url) ? 1 : 0,
        brandId: color.brandId || collection.brandId,
        characteristics: {
            ...(collection.characteristics || {}),
            ...(color.characteristics || {}),
        },
        format: color.format || collection.characteristics?.Format,
        dimension: color.dimension || collection.characteristics?.Dimenzije,
        overall_thickness: color.overall_thickness || collection.characteristics?.['Ukupna debljina'],
        description: color.description || collection.description || '',
        }));
}

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
                backing_variants: c.backing_variants,
            }));
        }
    }

    // Deking: customColors from tis_deking_products.json
    if (product.categoryId === '5' && product.sku?.startsWith('DEKING-')) {
        const collectionName = product.name.replace(' Kolekcija', ''); // e.g. TimberTech EDGE
        const variants = getAllDekingProducts().filter(p => !p.sku?.startsWith('DEKING-'));
        if (variants.length > 0) {
            return variants.map(v => ({
                collection: collectionName,
                collection_name: collectionName,
                code: v.sku || '',
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

    // Vinil (cat 2): customColors from Gerflor + Tarkett nested vinyl JSON sources
    if (product.categoryId === '2') {
        const slugCandidates = [
            product.slug,
            product.slug.replace(/^gerflor-/, ''),
            product.slug.replace(/^tarkett-/, ''),
            product.slug.replace(/^wolflor-/, ''),
        ];
        const vinylCollection = vinylCollections.find((col: any) =>
            slugCandidates.some((candidate) => candidate === col.slug)
        );
        if (vinylCollection && vinylCollection.colors && vinylCollection.colors.length > 0) {
            return mapNestedCollectionColors(vinylCollection);
        }
    }

    // Gerflor LVT (cat 6): customColors from lvt_colors_complete.json
    if (product.categoryId === '6' && product.slug.startsWith('gerflor-')) {
        const collectionSlug = product.slug.substring('gerflor-'.length);
        const lvtColors = (lvtColorsData as any).colors || [];
        const collectionColors = lvtColors.filter((c: any) => c.collection === collectionSlug);
        if (collectionColors.length > 0) {
            return collectionColors.map((c: any) => ({
                collection: collectionSlug,
                collection_name: c.collection_name || product.name,
                code: c.code || '',
                name: c.name,
                full_name: c.full_name || c.name,
                slug: c.slug,
                image_url: c.image_url || c.texture_url || '',
                texture_url: c.texture_url || c.image_url || '',
                image_count: c.image_count || 1,
                characteristics: c.characteristics || {},
            }));
        }
    }

    // ESD (cat 8): customColors from esd_colors.json
    if (product.categoryId === '8') {
        // ESD collection slugs do NOT use gerflor- prefix (e.g., mipolam-el5, gti-el5-connect)
        const rawSlug = product.slug;
        const strippedSlug = rawSlug.startsWith('gerflor-') ? rawSlug.substring('gerflor-'.length) : rawSlug;
        const esdCollection = esdCollections.find((col: any) => col.slug === rawSlug || col.slug === strippedSlug);
        if (esdCollection && esdCollection.colors && esdCollection.colors.length > 0) {
            return mapNestedCollectionColors(esdCollection);
        }
    }

    // Industrijske ploce (cat 9): customColors from industrial_colors.json
    if (product.categoryId === '9' && product.slug.startsWith('gerflor-')) {
        const collectionSlug = product.slug.substring('gerflor-'.length);
        const industrialCollection = industrialCollections.find((col: any) => col.slug === collectionSlug);
        if (industrialCollection && industrialCollection.colors && industrialCollection.colors.length > 0) {
            return mapNestedCollectionColors(industrialCollection);
        }
    }

    // Sport (cat 10): customColors from sport_colors.json + tarkett_sport_colors.json
    if (product.categoryId === '10') {
        const slugCandidates = [
            product.slug,
            product.slug.replace(/^gerflor-/, ''),
            product.slug.replace(/^tarkett-/, ''),
        ];
        const sportCollection = sportCollections.find((col: any) =>
            slugCandidates.includes(col.slug) ||
            slugCandidates.includes(String(col.slug || '').replace(/^gerflor-/, '').replace(/^tarkett-/, ''))
        );
        if (sportCollection && sportCollection.colors && sportCollection.colors.length > 0) {
            return mapNestedCollectionColors(sportCollection);
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

            const colorImageUrl = colorSource.color.texture_url || colorSource.color.lifestyle_url || colorSource.color.image_url || (colorSource.color as any).image;
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

    // Deking: merge selected variant
    if (selectedColorSlug && product.categoryId === '5' && product.sku?.startsWith('DEKING-')) {
        const dekingVariant = getAllDekingProducts().find(p => p.categoryId === '5' && !p.sku?.startsWith('DEKING-') && p.slug === selectedColorSlug);
        if (dekingVariant) {
            product.name = dekingVariant.name;
            product.shortDescription = dekingVariant.shortDescription || product.shortDescription;
            if (dekingVariant.images && dekingVariant.images.length > 0) {
                product.images = dekingVariant.images;
            }
            if (dekingVariant.specs && dekingVariant.specs.length > 0) {
                product.specs = mergeSpecs(product.specs, dekingVariant.specs);
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
