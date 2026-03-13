import type { ColorFromJSON, ColorSource, ProductImageType, ProductSpec, Product } from './types';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';
import vinylColorsData from '@/public/data/vinyl_colors_complete.json';
import esdColorsData from '@/public/data/esd_colors.json';
import { SITE_URL } from '@/lib/seo/site-config';

export const lvtColors = (lvtColorsData as { colors?: ColorFromJSON[] }).colors || [];
export const linoleumColors = (linoleumColorsData as { colors?: ColorFromJSON[] }).colors || [];
export const vinylCollections = (vinylColorsData as { collections?: any[] }).collections || [];
export const esdCollections = (esdColorsData as { collections?: any[] }).collections || [];

// Helper: strip collection sub-type prefixes from color names
// e.g. "LOOSELAY 0374 PARKER STATION" → "PARKER STATION"
export function cleanColorName(rawName: string): string {
    const subTypes = ['LOOSELAY', 'CLIC', 'ZEN', 'CONNECT', 'MEGACLIC', 'ACOUSTIC'];
    let clean = (rawName || '').trim();
    for (const st of subTypes) {
        if (clean.toUpperCase().startsWith(st + ' ')) {
            clean = clean.substring(st.length).trim();
            // Also strip any leading duplicated code number (e.g., "0374 PARKER STATION" → "PARKER STATION")
            clean = clean.replace(/^\d{4}\s+/, '');
            break;
        }
    }
    return clean;
}

function toSpecKey(label: string, fallbackIndex?: number): string {
    const normalized = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    if (normalized) {
        return normalized;
    }
    if (typeof fallbackIndex === 'number') {
        return `spec-${fallbackIndex}`;
    }
    return 'spec';
}

export function buildSpecsFromColor(color: ColorFromJSON): ProductSpec[] {
    const specs: ProductSpec[] = [];

    // Add collection-level specs first (from collection_specs if available)
    if ('collection_specs' in color && Array.isArray((color as any).collection_specs)) {
        const collectionSpecs = (color as any).collection_specs as ProductSpec[];
        specs.push(...collectionSpecs);
    }

    // Add color-specific specs from specs object
    if ('specs' in color && typeof (color as any).specs === 'object') {
        const colorSpecs = (color as any).specs;

        // Mapping for English keys to Serbian labels
        const specMapping: Record<string, { label: string, key: string }> = {
            'NCS': { label: 'NCS Oznaka', key: 'ncs' },
            'LRV': { label: 'LRV', key: 'lrv' },
            'PACKAGING': { label: 'Pakovanje', key: 'packaging' },
            'packaging': { label: 'Pakovanje', key: 'packaging' },
            'WEIGHT': { label: 'Težina', key: 'weight' },
            'THICKNESS OF THE WEARLAYER': { label: 'Debljina sloja habanja', key: 'wear_layer' },
            // BLOQ-specific spec keys
            'FIBRE': { label: 'Vlakno', key: 'fibre' },
            'Fibre': { label: 'Vlakno', key: 'fibre' },
            'CLASSIFICATION': { label: 'Klasa upotrebe', key: 'classification' },
            'Classification': { label: 'Klasa upotrebe', key: 'classification' },
            'FIRE_RESISTANCE': { label: 'Otpornost na vatru', key: 'fire_resistance' },
            'Fire Resistance': { label: 'Otpornost na vatru', key: 'fire_resistance' },
            'DIMENSIONAL_STABILITY': { label: 'Dimenzionalna stabilnost', key: 'dimensional_stability' },
            'Dimensional Stability': { label: 'Dimenzionalna stabilnost', key: 'dimensional_stability' },
            'Fibre Supplier': { label: 'Dobavljač vlakna', key: 'fibre_supplier' },
            'TILE_SIZE': { label: 'Dimenzije ploče', key: 'tile_size' },
            'Tile Size': { label: 'Dimenzije ploče', key: 'tile_size' },
            'PILE_WEIGHT': { label: 'Težina flora', key: 'pile_weight' },
            'Pile Weight': { label: 'Težina flora', key: 'pile_weight' },
            'TOTAL_WEIGHT': { label: 'Ukupna težina', key: 'total_weight' },
            'Total Weight': { label: 'Ukupna težina', key: 'total_weight' },
            'BACKING': { label: 'Podloga', key: 'backing' },
            'Backing': { label: 'Podloga', key: 'backing' },
            'PILE_HEIGHT': { label: 'Visina flora', key: 'pile_height' },
            'Pile Height': { label: 'Visina flora', key: 'pile_height' },
        };

        Object.entries(colorSpecs).forEach(([rawKey, value]) => {
            if (!value) return;
            const mapping = specMapping[rawKey] || { label: rawKey, key: rawKey.toLowerCase().replace(/\s+/g, '_') };

            // Check if not already added by collection_specs
            if (!specs.find(s => s.key === mapping.key)) {
                specs.push({ key: mapping.key, label: mapping.label, value: value as string });
            }
        });
    }

    // Add legacy fields if they exist
    if (color.format) {
        if (!specs.find(s => s.key === 'format')) {
            specs.push({ key: 'format', label: 'Format', value: color.format });
        }
    }
    if (color.overall_thickness) {
        if (!specs.find(s => s.key === 'thickness' || s.key === 'overall_thickness')) {
            specs.push({ key: 'thickness', label: 'Ukupna debljina', value: color.overall_thickness });
        }
    }
    if (color.dimension) {
        if (!specs.find(s => s.key === 'dimension')) {
            specs.push({ key: 'dimension', label: 'Dimenzije', value: color.dimension });
        }
    }
    if (color.welding_rod) {
        specs.push({ key: 'welding_rod', label: 'Elektroda za varenje', value: color.welding_rod });
    }

    // Add legacy characteristics
    if (color.characteristics) {
        const entries = Object.entries(color.characteristics);
        entries.forEach(([label, value], index) => {
            if (!value) return;
            const key = toSpecKey(label, index);
            // Avoid duplicates
            if (!specs.find(s => s.key === key)) {
                specs.push({ key, label, value });
            }
        });
    }

    return specs;
}

export function mergeSpecs(base: ProductSpec[], extra: ProductSpec[]): ProductSpec[] {
    const merged = new Map<string, ProductSpec>();
    for (const spec of base) {
        merged.set(spec.key, spec);
    }
    for (const spec of extra) {
        merged.set(spec.key, spec);
    }
    return Array.from(merged.values());
}

export async function loadColorFromJson(slug: string): Promise<ColorSource | null> {
    const lvtMatch = lvtColors.find(color => color.slug === slug);
    if (lvtMatch) {
        return { categorySlug: 'lvt', color: lvtMatch };
    }

    const linoleumMatch = linoleumColors.find(color => color.slug === slug);
    if (linoleumMatch) {
        return { categorySlug: 'linoleum', color: linoleumMatch };
    }

    // Try to find in Vinil collections
    for (const collection of vinylCollections) {
        const vinylColor = collection.colors?.find((color: any) => {
            // Match by slug format: collection-slug-color-code-color-name
            const expectedSlug = `${collection.slug}-${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}`;
            // Also try matching without collection prefix (for color parameter)
            const colorOnlySlug = `${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}`;
            return expectedSlug === slug ||
                colorOnlySlug === slug ||
                slug.endsWith(`-${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}`) ||
                color.code === slug;
        });
        if (vinylColor) {
            return {
                categorySlug: 'vinil',
                color: {
                    ...vinylColor,
                    collection: collection.slug,
                    collection_name: collection.name,
                    collection_slug: collection.slug,
                    full_name: `${vinylColor.code} ${vinylColor.name}`,
                    slug: slug,
                } as ColorFromJSON
            };
        }
    }

    // Try to find in ESD collections
    for (const collection of esdCollections) {
        const esdColor = collection.colors?.find((color: any) => {
            const expectedSlug = `${collection.slug}-${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}`;
            const colorOnlySlug = `${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}`;
            return expectedSlug === slug ||
                colorOnlySlug === slug ||
                slug.endsWith(`-${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}`) ||
                color.code === slug;
        });
        if (esdColor) {
            return {
                categorySlug: 'elektroprovodni',
                color: {
                    ...esdColor,
                    collection: collection.slug,
                    collection_name: collection.name,
                    collection_slug: collection.slug,
                    full_name: `${esdColor.code} ${esdColor.name}`,
                    slug: slug,
                } as ColorFromJSON
            };
        }
    }

    const baseUrl = SITE_URL;
    const candidates: Array<{ categorySlug: 'lvt' | 'linoleum' | 'vinil'; fileName: string }> = [
        { categorySlug: 'lvt', fileName: 'lvt_colors_complete.json' },
        { categorySlug: 'linoleum', fileName: 'linoleum_colors_complete.json' },
        { categorySlug: 'vinil', fileName: 'vinyl_colors_complete.json' },
    ];

    for (const candidate of candidates) {
        try {
            const response = await fetch(`${baseUrl}/data/${candidate.fileName}`, {
                cache: 'no-store',
            });
            if (!response.ok) {
                continue;
            }
            const data = await response.json();
            // Handle different JSON structures
            if (candidate.categorySlug === 'vinil' && data.collections) {
                // Vinil has collections[].colors structure
                for (const collection of data.collections) {
                    const match = collection.colors?.find((color: any) => {
                        const expectedSlug = `${collection.slug}-${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}`;
                        return expectedSlug === slug || color.code === slug;
                    });
                    if (match) {
                        return {
                            categorySlug: 'vinil',
                            color: {
                                ...match,
                                collection: collection.slug,
                                collection_name: collection.name,
                                collection_slug: collection.slug,
                                full_name: `${match.code} ${match.name}`,
                                slug: slug,
                            } as ColorFromJSON
                        };
                    }
                }
            } else if (data.colors && Array.isArray(data.colors)) {
                // LVT/Linoleum have colors array
                const match = data.colors.find((color: ColorFromJSON) => color.slug === slug);
                if (match) {
                    return { categorySlug: candidate.categorySlug, color: match };
                }
            }
        } catch (error) {
            console.error('Error reading remote color JSON:', candidate.fileName, error);
        }
    }

    return null;
}

export function colorToProduct(source: ColorSource, slug: string, collectionSlugOverride?: string): Product & { collectionSlug: string } {
    const { categorySlug, color } = source;
    const isLVT = categorySlug === 'lvt';
    const isVinil = categorySlug === 'vinil';
    const isESD = categorySlug === 'elektroprovodni';
    const categoryId = isLVT ? '6' : isVinil ? '2' : isESD ? '8' : '7';
    const brandId = source.brandId || color.brandId || (isESD ? '6' : '6'); // Both Gerflor (6), update if others
    const cleanName = cleanColorName(color.name);
    const name = color.code ? `${color.code} ${cleanName}` : cleanName;
    const primaryImageUrl = isLVT
        ? (color.texture_url || color.lifestyle_url || color.image_url || '')
        : isVinil
            ? ((color as any).image || color.image_url || '')
            : ((color as any).image || color.texture_url || color.image_url || '');

    const images: ProductImageType[] = primaryImageUrl
        ? [{
            id: `color-img-${categorySlug}-${color.slug}`,
            url: primaryImageUrl,
            alt: name,
            isPrimary: true,
            order: 1,
        }]
        : [];

    const specs = buildSpecsFromColor(color);

    // Use description from JSON if available, otherwise generate default
    const description = (color.description && typeof color.description === 'string' && color.description.trim())
        ? color.description.trim()
        : `${name} iz kolekcije ${color.collection_name}`;

    return {
        id: `color-${categorySlug}-${color.slug}`,
        name,
        slug,
        sku: color.code,
        categoryId,
        brandId,
        shortDescription: `${color.collection_name} - ${cleanName}`,
        description,
        images,
        specs,
        price: undefined,
        priceUnit: undefined,
        inStock: true,
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        collectionSlug: collectionSlugOverride || color.collection,
    };
}

export function collectionFromColor(source: ColorSource, slug: string): Product {
    const { categorySlug, color } = source;
    const isLVT = categorySlug === 'lvt';
    const isVinil = categorySlug === 'vinil';
    const isESD = categorySlug === 'elektroprovodni';
    const categoryId = isLVT ? '6' : isVinil ? '2' : isESD ? '8' : '7';
    const brandId = source.brandId || color.brandId || '6';
    const collectionName = (color.collection_name || color.collection || '').toString() || slug;
    const primaryImageUrl = isLVT
        ? (color.texture_url || color.lifestyle_url || color.image_url || '')
        : isVinil
            ? ((color as any).image || color.image_url || '')
            : ((color as any).image || color.texture_url || color.image_url || '');

    const images: ProductImageType[] = primaryImageUrl
        ? [{
            id: `collection-img-${categorySlug}-${slug}`,
            url: primaryImageUrl,
            alt: collectionName,
            isPrimary: true,
            order: 1,
        }]
        : [];

    const specs = buildSpecsFromColor(color);

    return {
        id: `collection-${categorySlug}-${slug}`,
        name: collectionName,
        slug,
        sku: color.collection || collectionName,
        categoryId,
        brandId,
        shortDescription: collectionName,
        description: (color.description && typeof color.description === 'string') ? color.description : '',
        images,
        specs,
        price: undefined,
        priceUnit: undefined,
        inStock: true,
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}
