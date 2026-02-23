import type { Product } from '@/types';
import type { ColorFromJSON, ColorSource } from './types';
import { productRepository } from '@/lib/repositories/product-repository';
import { getParketCollectionNameBySlug } from '@/lib/data/parket-collection-mapping';
import {
    lvtColors,
    linoleumColors,
    vinylCollections,
    esdCollections,
    loadColorFromJson,
    colorToProduct,
    collectionFromColor,
} from './color-helpers';
import carpetColorsData from '@/public/data/carpet_tiles_complete.json';
import bloqCarpetData from '@/public/data/bloq_carpet_tiles.json';

export function normalizeCollectionSlug(categoryId: string, collectionSlug: string): string {
    if (!collectionSlug) {
        return collectionSlug;
    }
    if (categoryId === '6') {
        return collectionSlug.startsWith('gerflor-') ? collectionSlug : `gerflor-${collectionSlug}`;
    }
    if (categoryId === '7') {
        return collectionSlug.replace(/^gerflor-/, '');
    }
    if (categoryId === '4') {
        return collectionSlug.startsWith('gerflor-') ? collectionSlug : `gerflor-${collectionSlug}`;
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
            return { ...header, collectionSlug: undefined };
        }
    }

    // First try to find product by slug directly (for collections)
    const product = await productRepository.findBySlug(slug);
    if (product) {
        // Enrich DB product with richer JSON data if available (e.g., Vinil collections)
        const slugWithoutPrefix = slug.startsWith('gerflor-') ? slug.substring('gerflor-'.length) : slug;
        const vinylCollectionForEnrich = vinylCollections.find((col: any) => col.slug === slugWithoutPrefix || col.slug === slug);
        if (vinylCollectionForEnrich && vinylCollectionForEnrich.colors && vinylCollectionForEnrich.colors.length > 0) {
            const firstVinylColor = vinylCollectionForEnrich.colors[0];
            const jsonDesc = firstVinylColor.description || vinylCollectionForEnrich.description || '';
            const jsonChars = firstVinylColor.characteristics || vinylCollectionForEnrich.characteristics || {};

            // Use JSON description if it's richer than DB description
            if (jsonDesc && jsonDesc.length > (product.description || '').length) {
                product.description = jsonDesc;
            }
            // Add specs from JSON characteristics if DB has none
            if ((!product.specs || product.specs.length === 0) && Object.keys(jsonChars).length > 0) {
                product.specs = Object.entries(jsonChars).map(([label, value]) => ({
                    key: label.toLowerCase().replace(/\s+/g, '_'),
                    label,
                    value: value as string,
                }));
            }
        }
        // Enrich ESD product with richer JSON data if available
        const esdCollectionForEnrich = esdCollections.find((col: any) => col.slug === slugWithoutPrefix || col.slug === slug);
        if (esdCollectionForEnrich && esdCollectionForEnrich.colors && esdCollectionForEnrich.colors.length > 0) {
            const firstEsdColor = esdCollectionForEnrich.colors[0];
            const jsonDesc = firstEsdColor.description || '';
            const jsonChars = firstEsdColor.characteristics || {};

            // Use JSON description if it's richer than current description
            if (jsonDesc && jsonDesc.length > (product.description || '').length) {
                product.description = jsonDesc;
            }
            // Add specs from JSON characteristics
            if ((!product.specs || product.specs.length === 0) && Object.keys(jsonChars).length > 0) {
                product.specs = Object.entries(jsonChars).map(([label, value]) => ({
                    key: label.toLowerCase().replace(/\s+/g, '_'),
                    label,
                    value: value as string,
                }));
            }
            // Use first color image if product has no image
            if ((!product.images || product.images.length === 0) && firstEsdColor.image) {
                product.images = [{
                    id: `esd-img-${slugWithoutPrefix}`,
                    url: firstEsdColor.image,
                    alt: product.name,
                    isPrimary: true,
                    order: 0,
                }];
            }
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
            // Check if Vinil JSON has a richer description than what's in the DB
            const vinylCollectionForDesc = vinylCollections.find((col: any) => col.slug === collectionSlugWithoutPrefix || col.slug === slug);
            if (vinylCollectionForDesc && vinylCollectionForDesc.colors && vinylCollectionForDesc.colors.length > 0) {
                const firstVinylColor = vinylCollectionForDesc.colors[0];
                const jsonDesc = firstVinylColor.description || vinylCollectionForDesc.description || '';
                const jsonChars = firstVinylColor.characteristics || vinylCollectionForDesc.characteristics || {};

                // Use JSON description if it's richer than DB description
                if (jsonDesc && jsonDesc.length > (collectionProduct.description || '').length) {
                    collectionProduct.description = jsonDesc;
                }
                // Add specs from JSON characteristics if DB has none
                if ((!collectionProduct.specs || collectionProduct.specs.length === 0) && Object.keys(jsonChars).length > 0) {
                    collectionProduct.specs = Object.entries(jsonChars).map(([label, value]) => ({
                        key: label.toLowerCase().replace(/\s+/g, '_'),
                        label,
                        value: value as string,
                    }));
                }
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
            const firstColor = vinylCollection.colors[0];
            const colorSource: ColorSource = {
                categorySlug: 'vinil',
                color: {
                    ...firstColor,
                    collection: vinylCollection.slug,
                    collection_name: vinylCollection.name,
                    collection_slug: vinylCollection.slug,
                    full_name: `${firstColor.code} ${firstColor.name}`,
                    slug: `${vinylCollection.slug}-${firstColor.code}-${firstColor.name.toLowerCase().replace(/\s+/g, '-')}`,
                } as ColorFromJSON
            };
            return collectionFromColor(colorSource, slug);
        }

        // Try to find collection in ESD JSON
        const esdCollection = esdCollections.find((col: any) => col.slug === collectionSlugWithoutPrefix || col.slug === slug);
        if (esdCollection && esdCollection.colors && esdCollection.colors.length > 0) {
            const firstColor = esdCollection.colors[0];
            const colorSource: ColorSource = {
                categorySlug: 'elektroprovodni',
                color: {
                    ...firstColor,
                    collection: esdCollection.slug,
                    collection_name: esdCollection.name,
                    collection_slug: esdCollection.slug,
                    full_name: `${firstColor.code} ${firstColor.name}`,
                    slug: `${esdCollection.slug}-${firstColor.code}-${firstColor.name.toLowerCase().replace(/\s+/g, '-')}`,
                } as ColorFromJSON
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
