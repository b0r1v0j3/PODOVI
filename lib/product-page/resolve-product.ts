import type { Product } from '@/types';
import type { ColorFromJSON, ColorSource } from './types';
import { productRepository } from '@/lib/repositories/product-repository';
import { getParketCollectionNameBySlug } from '@/lib/data/parket-collection-mapping';
import { enrichTarkettWoodProduct } from '@/lib/data/tarkett-wood-enrichment';
import {
    lvtColors,
    linoleumColors,
    vinylCollections,
    esdCollections,
    industrialCollections,
    sportCollections,
    lajsneCollections,
    buildNestedColorFromCollection,
    loadColorFromJson,
    colorToProduct,
    collectionFromColor,
} from './color-helpers';
import carpetColorsData from '@/public/data/carpet_tiles_complete.json';
import bloqCarpetData from '@/public/data/bloq_carpet_tiles.json';
import { getDerivedWeldingSpecs } from './welding-helpers';

function enrichProductFromCollectionData(product: Product, collection: any): Product {
    const enrichedProduct: Product = {
        ...product,
        images: (product.images || []).map((image) => ({ ...image })),
        specs: (product.specs || []).map((spec) => ({ ...spec })),
        documents: product.documents?.map((document) => ({ ...document })),
        detailsSections: product.detailsSections?.map((section) => ({
            ...section,
            items: [...section.items],
        })),
        compatibleAccessories: product.compatibleAccessories ? [...product.compatibleAccessories] : undefined,
    };

    const collectionCharacteristics =
        collection?.characteristics && typeof collection.characteristics === 'object'
            ? collection.characteristics
            : {};
    const description = typeof collection?.description === 'string' ? collection.description : '';

    if (description && description.length > (enrichedProduct.description || '').length) {
        enrichedProduct.description = description;
    }

    if (Object.keys(collectionCharacteristics).length > 0) {
        const existingKeys = new Set((enrichedProduct.specs || []).map((spec) => spec.key));
        const extraSpecs = Object.entries(collectionCharacteristics)
            .map(([label, value]) => ({
            key: String(label).toLowerCase().replace(/[^a-z0-9]+/g, '_'),
            label,
            value: String(value),
            }))
            .filter((spec) => !existingKeys.has(spec.key));

        enrichedProduct.specs = [...(enrichedProduct.specs || []), ...extraSpecs];
    }

    const weldingSpecs = getDerivedWeldingSpecs({
        categoryId: enrichedProduct.categoryId,
        brandId: enrichedProduct.brandId,
        collectionSlug: collection?.slug || enrichedProduct.slug,
        collectionName: collection?.name || enrichedProduct.name,
        characteristics: collectionCharacteristics,
    });
    if (weldingSpecs.length > 0) {
        const existingKeys = new Set((enrichedProduct.specs || []).map((spec) => spec.key));
        enrichedProduct.specs = [
            ...(enrichedProduct.specs || []),
            ...weldingSpecs.filter((spec) => !existingKeys.has(spec.key)),
        ];
    }

    return enrichedProduct;
}

function findNestedCollection(slug: string) {
    const slugWithoutPrefix = slug.replace(/^gerflor-/, '').replace(/^tarkett-/, '').replace(/^wolflor-/, '');
    return (
        vinylCollections.find((collection: any) => collection.slug === slugWithoutPrefix || collection.slug === slug) ||
        esdCollections.find((collection: any) => collection.slug === slugWithoutPrefix || collection.slug === slug) ||
        industrialCollections.find((collection: any) => collection.slug === slugWithoutPrefix || collection.slug === slug) ||
        sportCollections.find((collection: any) => collection.slug === slugWithoutPrefix || collection.slug === slug) ||
        lajsneCollections.find((collection: any) => collection.slug === slugWithoutPrefix || collection.slug === slug) ||
        null
    );
}

export function normalizeCollectionSlug(categoryId: string, collectionSlug: string, brandId?: string): string {
    if (!collectionSlug) {
        return collectionSlug;
    }
    const hasBrandPrefix =
        collectionSlug.startsWith('gerflor-') ||
        collectionSlug.startsWith('tarkett-') ||
        collectionSlug.startsWith('wolflor-');
    if (categoryId === '6') {
        if (hasBrandPrefix) {
            return collectionSlug;
        }
        return `gerflor-${collectionSlug}`;
    }
    if (categoryId === '9' || categoryId === '10' || categoryId === '11') {
        if (hasBrandPrefix) {
            return collectionSlug;
        }
        return brandId === '3' ? `tarkett-${collectionSlug}` : `gerflor-${collectionSlug}`;
    }
    if (categoryId === '7') {
        return collectionSlug.replace(/^gerflor-/, '');
    }
    if (categoryId === '4') {
        if (hasBrandPrefix) {
            return collectionSlug;
        }
        return `gerflor-${collectionSlug}`;
    }
    if (categoryId === '2' && brandId === '11') {
        return hasBrandPrefix ? collectionSlug : `wolflor-${collectionSlug}`;
    }
    return collectionSlug;
}

export async function resolveProductBySlug(slug: string): Promise<(Product & { collectionSlug?: string }) | null> {
    // Parket kolekcija (rumba, allegro, privilege, ...): učitaj header iz Tarkett podataka da naslov i kolekcija budu tačni (ne "Parket" iz baze)
    const parketCollectionName = getParketCollectionNameBySlug(slug);
    if (parketCollectionName) {
        const { tarkettProducts } = await import('@/lib/data/tarkett-products');
        const header = tarkettProducts.find(
            (p) =>
                p.categoryId === '3' &&
                p.sku &&
                String(p.sku).startsWith('PARKET-') &&
                p.slug === slug
        );
        if (header) {
            return { ...enrichTarkettWoodProduct(header), collectionSlug: undefined };
        }
    }

    // First try to find product by slug directly (for collections)
    const product = await productRepository.findBySlug(slug);
    if (product) {
        const nestedCollectionForEnrich = findNestedCollection(slug);
        if (nestedCollectionForEnrich) {
            return enrichProductFromCollectionData(product, nestedCollectionForEnrich);
        }
        return product;
    }

    // Check if slug is a collection slug (starts with 'gerflor-')
    // Examples: "gerflor-creation-30", "gerflor-dlw-uni-walton", "gerflor-armonia-400"
    if (slug.startsWith('gerflor-')) {
        const collectionSlugWithoutPrefix = slug.substring('gerflor-'.length); // Remove 'gerflor-' prefix

        // Try to find collection by slug without prefix (linoleum collections are stored without prefix)
        const collectionProduct = await productRepository.findBySlug(collectionSlugWithoutPrefix);
        if (collectionProduct) {
            const nestedCollectionForDesc = findNestedCollection(collectionSlugWithoutPrefix);
            if (nestedCollectionForDesc) {
                enrichProductFromCollectionData(collectionProduct, nestedCollectionForDesc);
            }
            return {
                ...collectionProduct,
                slug,
            };
        }

        // Try to find first color from this collection in LVT JSON
        const lvtColor = lvtColors.find((color: ColorFromJSON) => color.collection === collectionSlugWithoutPrefix);
        if (lvtColor) {
            const colorSource: ColorSource = { categorySlug: 'lvt', color: lvtColor };
            return collectionFromColor(colorSource, slug);
        }

        // Try to find first color from this collection in Linoleum JSON
        const linoleumColor = linoleumColors.find((color: ColorFromJSON) => color.collection === collectionSlugWithoutPrefix);
        if (linoleumColor) {
            const colorSource: ColorSource = { categorySlug: 'linoleum', color: linoleumColor };
            return collectionFromColor(colorSource, slug);
        }

        // Try to find collection in Vinil JSON
        const vinylCollection = vinylCollections.find((col: any) => col.slug === collectionSlugWithoutPrefix || col.slug === slug);
        if (vinylCollection && vinylCollection.colors && vinylCollection.colors.length > 0) {
            const firstColor = buildNestedColorFromCollection(vinylCollection, vinylCollection.colors[0]);
            const colorSource: ColorSource = {
                categorySlug: 'vinil',
                color: firstColor as ColorFromJSON
            };
            return collectionFromColor(colorSource, slug);
        }

        const industrialCollection = industrialCollections.find((col: any) => col.slug === collectionSlugWithoutPrefix || col.slug === slug);
        if (industrialCollection && industrialCollection.colors && industrialCollection.colors.length > 0) {
            const firstColor = buildNestedColorFromCollection(industrialCollection, industrialCollection.colors[0]);
            const colorSource: ColorSource = {
                categorySlug: 'industrijske-ploce',
                color: firstColor as ColorFromJSON,
            };
            return collectionFromColor(colorSource, slug);
        }

        const sportCollection = sportCollections.find((col: any) => col.slug === collectionSlugWithoutPrefix || col.slug === slug);
        if (sportCollection && sportCollection.colors && sportCollection.colors.length > 0) {
            const firstColor = buildNestedColorFromCollection(sportCollection, sportCollection.colors[0]);
            const colorSource: ColorSource = {
                categorySlug: 'sport',
                color: firstColor as ColorFromJSON,
            };
            return collectionFromColor(colorSource, slug);
        }

        // Try to find in Carpet JSON (carpet uses collection_slug with 'gerflor-' prefix)
        const carpetColors = (carpetColorsData as any).colors || [];
        const carpetColor = carpetColors.find((color: any) => color.collection_slug === slug || color.collection === slug);
        if (carpetColor) {
            // Create a carpet product from first color in collection
            const specs = Object.entries(carpetColor.characteristics || {}).map(([label, value]) => ({
                key: label.toLowerCase().replace(/\s+/g, '_'),
                label,
                value: value as string
            }));

            return {
                id: `carpet-${slug}`,
                name: carpetColor.collection_name || slug,
                slug,
                sku: 'CARPET',
                categoryId: '4',
                brandId: '6',
                shortDescription: carpetColor.collection_name || slug,
                description: carpetColor.description || '',
                images: carpetColor.image_url ? [{
                    id: `${slug}-img-1`,
                    url: carpetColor.image_url,
                    alt: carpetColor.collection_name || slug,
                    isPrimary: true,
                    order: 1,
                }] : [],
                specs,
                inStock: true,
                featured: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                collectionSlug: slug,
            };
        }
    }

    // Try to find collection in ESD JSON (ESD collection slugs do not start with prefix)
    const esdCollection = esdCollections.find((col: any) => col.slug === slug || col.slug === slug.replace(/^gerflor-/, ''));
    if (esdCollection && esdCollection.colors && esdCollection.colors.length > 0) {
        const firstColor = buildNestedColorFromCollection(esdCollection, esdCollection.colors[0]);
        const colorSource: ColorSource = {
            categorySlug: 'elektroprovodni',
            color: firstColor as ColorFromJSON
        };
        return collectionFromColor(colorSource, slug);
    }

    const industrialCollection = industrialCollections.find((col: any) => col.slug === slug || col.slug === slug.replace(/^gerflor-/, ''));
    if (industrialCollection && industrialCollection.colors && industrialCollection.colors.length > 0) {
        const firstColor = buildNestedColorFromCollection(industrialCollection, industrialCollection.colors[0]);
        const colorSource: ColorSource = {
            categorySlug: 'industrijske-ploce',
            color: firstColor as ColorFromJSON,
        };
        return collectionFromColor(colorSource, slug);
    }

    const sportCollection = sportCollections.find((col: any) => col.slug === slug || col.slug === slug.replace(/^gerflor-/, ''));
    if (sportCollection && sportCollection.colors && sportCollection.colors.length > 0) {
        const firstColor = buildNestedColorFromCollection(sportCollection, sportCollection.colors[0]);
        const colorSource: ColorSource = {
            categorySlug: 'sport',
            color: firstColor as ColorFromJSON,
        };
        return collectionFromColor(colorSource, slug);
    }

    const lajsneCollection = lajsneCollections.find((col: any) =>
        col.slug === slug ||
        col.slug === slug.replace(/^tarkett-/, '')
    );
    if (lajsneCollection && lajsneCollection.colors && lajsneCollection.colors.length > 0) {
        const firstColor = buildNestedColorFromCollection(lajsneCollection, lajsneCollection.colors[0]);
        const colorSource: ColorSource = {
            categorySlug: 'lajsne',
            color: firstColor as ColorFromJSON,
        };
        return collectionFromColor(colorSource, slug);
    }

    // Check if slug is a BLOQ collection slug (e.g., "bloq-assembly", "bloq-flow")
    if (slug.startsWith('bloq-')) {
        const bloqColors = (bloqCarpetData as any).colors || [];
        const bloqColor = bloqColors.find((color: any) => color.collection_slug === slug || color.collection === slug);
        if (bloqColor) {
            const specs = Object.entries(bloqColor.characteristics || {}).map(([label, value]) => ({
                key: label.toLowerCase().replace(/\s+/g, '_'),
                label,
                value: value as string
            }));

            // Use enriched description if available — format with section headers for parseDescriptionToSections()
            const descriptionParts: string[] = [];
            if (bloqColor.collection_description_sr) {
                descriptionParts.push(`Opis:\n${bloqColor.collection_description_sr}`);
            }
            if (bloqColor.color_range_text) {
                descriptionParts.push(`Paleta boja:\n${bloqColor.color_range_text}`);
            }
            if (bloqColor.backing_variants && Array.isArray(bloqColor.backing_variants) && bloqColor.backing_variants.length > 0) {
                descriptionParts.push(`Dostupne podloge:\n${bloqColor.backing_variants.join(', ')}`);
            }
            const enrichedDescription = descriptionParts.length > 0
                ? descriptionParts.join('\n')
                : (bloqColor.description || '');

            // Map documents from JSON
            const documents = Array.isArray(bloqColor.documents)
                ? bloqColor.documents.map((doc: any) => ({ title: doc.title || '', url: doc.url || '' }))
                : [];
            // Build a meaningful short description from collection description
            const shortDescBase = bloqColor.collection_description_sr
                ? bloqColor.collection_description_sr.split(/[.!]/)[0].trim()
                : `Premium tekstilne ploče`;
            const shortDesc = shortDescBase.length > 120
                ? shortDescBase.substring(0, 117) + '...'
                : shortDescBase;

            return {
                id: `bloq-${slug}`,
                name: `BLOQ ${bloqColor.collection_name || slug}`,
                slug,
                sku: 'BLOQ-CARPET',
                categoryId: '4',
                brandId: '8',
                shortDescription: shortDesc,
                description: enrichedDescription,
                images: bloqColor.image_url ? [{
                    id: `${slug}-img-1`,
                    url: bloqColor.image_url,
                    alt: `BLOQ ${bloqColor.collection_name || slug}`,
                    isPrimary: true,
                    order: 1,
                }] : [],
                specs,
                documents,
                inStock: true,
                featured: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                collectionSlug: slug,
            };
        }
    }

    // Check if slug is a Tarkett product slug (e.g., "tarkett-essence-30", "tarkett-id-inspiration-55")
    if (slug.startsWith('tarkett-')) {
        const tarkettSlugWithoutPrefix = slug.substring('tarkett-'.length);

        // Try to find in repository by slug without prefix
        const tarkettProduct = await productRepository.findBySlug(tarkettSlugWithoutPrefix);
        if (tarkettProduct) {
            return {
                ...tarkettProduct,
                slug, // Keep the original slug with prefix for URL consistency
            };
        }

        // Also try the full slug (some Tarkett products may be stored with prefix)
        const tarkettProductFull = await productRepository.findBySlug(slug);
        if (tarkettProductFull) {
            return tarkettProductFull;
        }
    }

    // Try to parse slug as collection-slug-color-slug format
    // Example: "gerflor-creation-30-ballerina-41870347"
    // Strategy: Try to find the collection slug first, then extract color slug

    // Get all products to find matching collection
    const allProducts = await productRepository.findAll();

    // Try to match collection slug from the beginning of the slug
    for (const prod of allProducts) {
        if (slug.startsWith(prod.slug + '-')) {
            // Found collection! Extract color slug
            const colorSlug = slug.substring(prod.slug.length + 1); // +1 for the dash

            // Try to find color by its slug
            const colorSource = await loadColorFromJson(colorSlug);
            if (colorSource) {
                const colorProduct = colorToProduct(colorSource, slug, prod.slug);
                return colorProduct;
            }
        }
    }

    // Fallback: try to load color by slug directly (for backward compatibility)
    const colorSource = await loadColorFromJson(slug);
    if (colorSource) {
        return colorToProduct(colorSource, slug);
    }

    return null;
}
