import type { ColorFromJSON, ColorSource, ProductImageType, ProductSpec, Product } from './types';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';
import tarkettLinoleumColorsData from '@/public/data/tarkett_linoleum_colors.json';
import vinylColorsData from '@/public/data/vinyl_colors_complete.json';
import vinylSpecialColorsData from '@/public/data/vinyl_special_colors.json';
import tarkettVinylHomeColorsData from '@/public/data/tarkett_vinyl_home_colors.json';
import tarkettHomogeneousVinylColorsData from '@/public/data/tarkett_homogeneous_vinyl_colors.json';
import tarkettHeterogeneousVinylColorsData from '@/public/data/tarkett_heterogeneous_vinyl_colors.json';
import wolflorVinylColorsData from '@/public/data/wolflor_vinyl_colors.json';
import bloqCarpetData from '@/public/data/bloq_carpet_tiles.json';
import esdColorsData from '@/public/data/esd_colors.json';
import industrialColorsData from '@/public/data/industrial_colors.json';
import sportColorsData from '@/public/data/sport_colors.json';
import tarkettSportColorsData from '@/public/data/tarkett_sport_colors.json';
import tarkettLajsneData from '@/public/data/tarkett_lajsne_variants.json';
import alpodFloorCollectionsData from '@/public/data/alpod_floor_collections.json';
import { SITE_URL } from '@/lib/seo/site-config';
import { getDerivedWeldingSpecs } from './welding-helpers';
import { getPrimaryColorImage } from '@/lib/utils/product-images';

type NestedCollection = {
    name: string;
    slug: string;
    brandId?: string;
    description?: string;
    characteristics?: Record<string, string | undefined>;
    documents?: Array<Record<string, any>>;
    detailsSections?: Array<Record<string, any>>;
    url?: string;
    shortDescription?: string;
    collection_image_url?: string;
    colors?: Array<Record<string, any>>;
};

export const lvtColors = (lvtColorsData as { colors?: ColorFromJSON[] }).colors || [];
export const linoleumColors = (linoleumColorsData as { colors?: ColorFromJSON[] }).colors || [];
export const tarkettLinoleumCollections = (tarkettLinoleumColorsData as { collections?: NestedCollection[] }).collections || [];
export const baseVinylCollections = (vinylColorsData as { collections?: NestedCollection[] }).collections || [];
export const vinylSpecialCollections = (vinylSpecialColorsData as { collections?: NestedCollection[] }).collections || [];
export const tarkettVinylHomeCollections = (tarkettVinylHomeColorsData as { collections?: NestedCollection[] }).collections || [];
export const tarkettHomogeneousVinylCollections = (tarkettHomogeneousVinylColorsData as { collections?: NestedCollection[] }).collections || [];
export const tarkettHeterogeneousVinylCollections = (tarkettHeterogeneousVinylColorsData as { collections?: NestedCollection[] }).collections || [];
export const wolflorVinylCollections = (wolflorVinylColorsData as { collections?: NestedCollection[] }).collections || [];
export const alpodFloorCollections = (((alpodFloorCollectionsData as any)?.collections || []) as NestedCollection[]);
export const alpodVinylCollections = alpodFloorCollections.filter((collection: any) => collection.categoryId === '2');
export const alpodParketCollections = alpodFloorCollections.filter((collection: any) => collection.categoryId === '3');
export const alpodDekingCollections = alpodFloorCollections.filter((collection: any) => collection.categoryId === '5');
export const vinylCollections = [
    ...baseVinylCollections,
    ...vinylSpecialCollections,
    ...tarkettVinylHomeCollections,
    ...tarkettHomogeneousVinylCollections,
    ...tarkettHeterogeneousVinylCollections,
    ...wolflorVinylCollections,
    ...alpodVinylCollections,
];
export const esdCollections = (esdColorsData as { collections?: NestedCollection[] }).collections || [];
export const industrialCollections = (industrialColorsData as { collections?: NestedCollection[] }).collections || [];
const gerflorSportCollections = (sportColorsData as { collections?: NestedCollection[] }).collections || [];
const tarkettSportCollections = (tarkettSportColorsData as { collections?: NestedCollection[] }).collections || [];
export const sportCollections = [...gerflorSportCollections, ...tarkettSportCollections];
export const lajsneCollections = (tarkettLajsneData as { collections?: NestedCollection[] }).collections || [];

// Helper: strip collection sub-type prefixes from color names
// e.g. "LOOSELAY 0374 PARKER STATION" -> "PARKER STATION"
export function cleanColorName(rawName: string): string {
    const subTypes = ['LOOSELAY', 'CLIC', 'ZEN', 'CONNECT', 'MEGACLIC', 'ACOUSTIC'];
    let clean = (rawName || '').trim();
    for (const st of subTypes) {
        if (clean.toUpperCase().startsWith(st + ' ')) {
            clean = clean.substring(st.length).trim();
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

export function buildNestedColorSlug(collection: { slug: string }, color: { code?: string; name?: string }): string {
    const nameSlug = String(color.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    return `${collection.slug}-${color.code || 'color'}-${nameSlug}`.replace(/-+/g, '-');
}

export function buildNestedColorFromCollection(
    collection: NestedCollection,
    color: Record<string, any>,
    requestedSlug?: string
): ColorFromJSON {
    const collectionCharacteristics =
        collection.characteristics && typeof collection.characteristics === 'object'
            ? collection.characteristics
            : {};
    const colorCharacteristics =
        color.characteristics && typeof color.characteristics === 'object'
            ? color.characteristics
            : {};
    const mergedCharacteristics = {
        ...collectionCharacteristics,
        ...colorCharacteristics,
    };

    const inferredThickness =
        color.overall_thickness ||
        (collection as any).overall_thickness ||
        collectionCharacteristics['Ukupna debljina'] ||
        collectionCharacteristics['Overall thickness'];
    const inferredFormat =
        color.format ||
        (collection as any).format ||
        collectionCharacteristics['Format'];
    const inferredDimension =
        color.dimension ||
        (collection as any).dimension ||
        collectionCharacteristics['Dimenzije'] ||
        collectionCharacteristics['Dimensions'];

    return {
        ...color,
        collection: collection.slug,
        collection_name: collection.name,
        collection_slug: collection.slug,
        full_name: `${color.code || ''} ${color.name || ''}`.trim(),
        slug: requestedSlug || buildNestedColorSlug(collection, color),
        description: typeof color.description === 'string' && color.description.trim()
            ? color.description.trim()
            : (collection.description || ''),
        characteristics: Object.keys(mergedCharacteristics).length > 0 ? mergedCharacteristics : undefined,
        overall_thickness: inferredThickness,
        format: inferredFormat,
        dimension: inferredDimension,
        documents: Array.isArray(color.documents)
            ? color.documents
            : (Array.isArray(collection.documents) ? collection.documents : undefined),
        image_url: color.image_url || color.image,
        brandId: color.brandId || (collection as any).brandId,
    } as ColorFromJSON;
}

function findNestedColorSource(
    collections: NestedCollection[],
    categorySlug: ColorSource['categorySlug'],
    slug: string
): ColorSource | null {
    for (const collection of collections) {
        for (const color of collection.colors || []) {
            const explicitSlug = typeof color.slug === 'string' ? color.slug : '';
            const generatedSlug = buildNestedColorSlug(collection, color);
            const colorOnlySlug = `${color.code}-${String(color.name || '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')}`;

            if (
                explicitSlug === slug ||
                generatedSlug === slug ||
                colorOnlySlug === slug ||
                slug.endsWith(`-${colorOnlySlug}`) ||
                color.code === slug
            ) {
                return {
                    categorySlug,
                    color: buildNestedColorFromCollection(collection, color, slug),
                };
            }
        }
    }

    return null;
}

function getCategoryId(categorySlug: ColorSource['categorySlug']): string {
    switch (categorySlug) {
        case 'vinil':
            return '2';
        case 'parket':
            return '3';
        case 'tekstilne-ploce':
            return '4';
        case 'deking':
            return '5';
        case 'lvt':
            return '6';
        case 'linoleum':
            return '7';
        case 'elektroprovodni':
            return '8';
        case 'industrijske-ploce':
            return '9';
        case 'sport':
            return '10';
        case 'lajsne':
            return '11';
        default:
            return '6';
    }
}

function buildBloqColorSource(rawColor: Record<string, any>): ColorSource {
    const code = String(rawColor.code || '').trim();
    const rawName = String(rawColor.name || rawColor.full_name || '').trim();
    const normalizedName = code && rawName.startsWith(`${code} `)
        ? rawName.substring(code.length).trim()
        : rawName;

    return {
        categorySlug: 'tekstilne-ploce',
        brandId: '8',
        color: {
            collection: String(rawColor.collection_slug || rawColor.collection || '').trim(),
            collection_slug: String(rawColor.collection_slug || rawColor.collection || '').trim(),
            collection_name: String(rawColor.collection_name || rawColor.collection || '').trim(),
            code,
            name: normalizedName,
            full_name: String(rawColor.full_name || rawName || normalizedName).trim(),
            slug: String(rawColor.slug || '').trim(),
            image: String(rawColor.image_url || '').trim(),
            image_url: String(rawColor.image_url || '').trim(),
            texture_url: String(rawColor.texture_url || rawColor.image_url || '').trim(),
            image_count: Number(rawColor.image_count || (rawColor.image_url ? 1 : 0) || 0),
            dimension: String(rawColor.dimension || '').trim() || undefined,
            format: String(rawColor.format || '').trim() || undefined,
            overall_thickness: String(rawColor.overall_thickness || '').trim() || undefined,
            description: String(rawColor.description || '').trim() || undefined,
            characteristics: rawColor.characteristics && typeof rawColor.characteristics === 'object'
                ? rawColor.characteristics
                : undefined,
            specs: rawColor.specs && typeof rawColor.specs === 'object'
                ? rawColor.specs
                : undefined,
            brandId: '8',
        },
    };
}

function getPrimaryImageUrl(source: ColorSource): string {
    return getPrimaryColorImage(source.color)?.url || '';
}

export function buildSpecsFromColor(
    color: ColorFromJSON,
    context?: { categoryId?: string; brandId?: string }
): ProductSpec[] {
    const specs: ProductSpec[] = [];

    if ('collection_specs' in color && Array.isArray((color as any).collection_specs)) {
        const collectionSpecs = (color as any).collection_specs as ProductSpec[];
        specs.push(...collectionSpecs);
    }

    if ('specs' in color && typeof (color as any).specs === 'object') {
        const colorSpecs = (color as any).specs;

        const specMapping: Record<string, { label: string; key: string }> = {
            'NCS': { label: 'NCS Oznaka', key: 'ncs' },
            'LRV': { label: 'LRV', key: 'lrv' },
            'PACKAGING': { label: 'Pakovanje', key: 'packaging' },
            'packaging': { label: 'Pakovanje', key: 'packaging' },
            'WEIGHT': { label: 'Tezina', key: 'weight' },
            'THICKNESS OF THE WEARLAYER': { label: 'Debljina sloja habanja', key: 'wear_layer' },
            'FIBRE': { label: 'Vlakno', key: 'fibre' },
            'Fibre': { label: 'Vlakno', key: 'fibre' },
            'CLASSIFICATION': { label: 'Klasa upotrebe', key: 'classification' },
            'Classification': { label: 'Klasa upotrebe', key: 'classification' },
            'FIRE_RESISTANCE': { label: 'Otpornost na vatru', key: 'fire_resistance' },
            'Fire Resistance': { label: 'Otpornost na vatru', key: 'fire_resistance' },
            'DIMENSIONAL_STABILITY': { label: 'Dimenzionalna stabilnost', key: 'dimensional_stability' },
            'Dimensional Stability': { label: 'Dimenzionalna stabilnost', key: 'dimensional_stability' },
            'Fibre Supplier': { label: 'Dobavljac vlakna', key: 'fibre_supplier' },
            'TILE_SIZE': { label: 'Dimenzije ploce', key: 'tile_size' },
            'Tile Size': { label: 'Dimenzije ploce', key: 'tile_size' },
            'PILE_WEIGHT': { label: 'Tezina flora', key: 'pile_weight' },
            'Pile Weight': { label: 'Tezina flora', key: 'pile_weight' },
            'TOTAL_WEIGHT': { label: 'Ukupna tezina', key: 'total_weight' },
            'Total Weight': { label: 'Ukupna tezina', key: 'total_weight' },
            'BACKING': { label: 'Podloga', key: 'backing' },
            'Backing': { label: 'Podloga', key: 'backing' },
            'PILE_HEIGHT': { label: 'Visina flora', key: 'pile_height' },
            'Pile Height': { label: 'Visina flora', key: 'pile_height' },
        };

        Object.entries(colorSpecs).forEach(([rawKey, value]) => {
            if (!value) return;
            const mapping = specMapping[rawKey] || {
                label: rawKey,
                key: rawKey.toLowerCase().replace(/\s+/g, '_'),
            };

            if (!specs.find((spec) => spec.key === mapping.key)) {
                specs.push({ key: mapping.key, label: mapping.label, value: value as string });
            }
        });
    }

    if (color.format && !specs.find((spec) => spec.key === 'format')) {
        specs.push({ key: 'format', label: 'Format', value: color.format });
    }
    if (color.overall_thickness && !specs.find((spec) => spec.key === 'thickness' || spec.key === 'overall_thickness')) {
        specs.push({ key: 'thickness', label: 'Ukupna debljina', value: color.overall_thickness });
    }
    if (color.dimension && !specs.find((spec) => spec.key === 'dimension')) {
        specs.push({ key: 'dimension', label: 'Dimenzije', value: color.dimension });
    }
    const weldingSpecs = getDerivedWeldingSpecs({
        categoryId: context?.categoryId,
        brandId: context?.brandId || color.brandId,
        collectionSlug: color.collection_slug || color.collection,
        collectionName: color.collection_name,
        characteristics: color.characteristics,
        exactWeldingRod: color.welding_rod,
    });
    for (const weldingSpec of weldingSpecs) {
        if (!specs.find((spec) => spec.key === weldingSpec.key)) {
            specs.push(weldingSpec);
        }
    }

    if (color.characteristics) {
        const entries = Object.entries(color.characteristics);
        entries.forEach(([label, value], index) => {
            if (!value) return;
            if (
                /(elektrod|varila|welding|vrpca)/i.test(label) &&
                specs.some((spec) => /(elektrod|varila|welding|vrpca)/i.test(spec.label) && spec.value === value)
            ) {
                return;
            }
            const key = toSpecKey(label, index);
            if (!specs.find((spec) => spec.key === key)) {
                specs.push({ key, label, value });
            }
        });
    }

    return specs;
}

function normalizeColorDocuments(
    documents?: Array<{ title?: string; url?: string; type?: string }>
): NonNullable<Product['documents']> {
    if (!Array.isArray(documents)) {
        return [];
    }

    const seen = new Set<string>();
    const normalizedDocuments: NonNullable<Product['documents']> = [];

    for (const document of documents) {
        const url = String(document?.url || '').trim();
        if (!url || seen.has(url)) {
            continue;
        }

        seen.add(url);
        normalizedDocuments.push({
            title: String(document?.title || '').trim() || 'Dokument',
            url,
            type: document?.type ? String(document.type).trim() : undefined,
        });
    }

    return normalizedDocuments;
}

export function buildCharacteristicsFromColor(
    color: ColorFromJSON,
    context?: { categoryId?: string; brandId?: string }
): Record<string, string> {
    return buildSpecsFromColor(color, context).reduce<Record<string, string>>((result, spec) => {
        if (spec.label && spec.value) {
            result[spec.label] = spec.value;
        }
        return result;
    }, {});
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
    const lvtMatch = lvtColors.find((color) => color.slug === slug);
    if (lvtMatch) {
        return { categorySlug: 'lvt', color: lvtMatch };
    }

    const linoleumMatch = linoleumColors.find((color) => color.slug === slug);
    if (linoleumMatch) {
        return { categorySlug: 'linoleum', color: linoleumMatch };
    }

    const bloqMatch = (((bloqCarpetData as any).colors || []) as Array<Record<string, any>>)
        .find((color) => String(color.slug || '').trim() === slug);
    if (bloqMatch) {
        return buildBloqColorSource(bloqMatch);
    }

    const nestedSources: Array<{ categorySlug: ColorSource['categorySlug']; collections: NestedCollection[] }> = [
        { categorySlug: 'vinil', collections: vinylCollections },
        { categorySlug: 'parket', collections: alpodParketCollections },
        { categorySlug: 'deking', collections: alpodDekingCollections },
        { categorySlug: 'elektroprovodni', collections: esdCollections },
        { categorySlug: 'industrijske-ploce', collections: industrialCollections },
        { categorySlug: 'sport', collections: sportCollections },
        { categorySlug: 'lajsne', collections: lajsneCollections },
    ];

    for (const source of nestedSources) {
        const match = findNestedColorSource(source.collections, source.categorySlug, slug);
        if (match) {
            return match;
        }
    }

    const baseUrl = SITE_URL;
    const candidates: Array<{ categorySlug: ColorSource['categorySlug']; fileName: string; nested: boolean }> = [
        { categorySlug: 'lvt', fileName: 'lvt_colors_complete.json', nested: false },
        { categorySlug: 'linoleum', fileName: 'linoleum_colors_complete.json', nested: false },
        { categorySlug: 'vinil', fileName: 'vinyl_colors_complete.json', nested: true },
        { categorySlug: 'vinil', fileName: 'vinyl_special_colors.json', nested: true },
        { categorySlug: 'vinil', fileName: 'tarkett_vinyl_home_colors.json', nested: true },
        { categorySlug: 'vinil', fileName: 'tarkett_heterogeneous_vinyl_colors.json', nested: true },
        { categorySlug: 'vinil', fileName: 'tarkett_homogeneous_vinyl_colors.json', nested: true },
        { categorySlug: 'vinil', fileName: 'wolflor_vinyl_colors.json', nested: true },
        { categorySlug: 'elektroprovodni', fileName: 'esd_colors.json', nested: true },
        { categorySlug: 'industrijske-ploce', fileName: 'industrial_colors.json', nested: true },
        { categorySlug: 'sport', fileName: 'sport_colors.json', nested: true },
        { categorySlug: 'sport', fileName: 'tarkett_sport_colors.json', nested: true },
        { categorySlug: 'lajsne', fileName: 'tarkett_lajsne_variants.json', nested: true },
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
            if (candidate.nested && Array.isArray(data.collections)) {
                const match = findNestedColorSource(data.collections, candidate.categorySlug, slug);
                if (match) {
                    return match;
                }
            } else if (Array.isArray(data.colors)) {
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

export type SelectedColorServerData = {
    source: ColorSource;
    specs: ProductSpec[];
    characteristics: Record<string, string>;
    documents: NonNullable<Product['documents']>;
};

export async function resolveSelectedColorServerData(
    slug: string,
    context?: { categoryId?: string; brandId?: string }
): Promise<SelectedColorServerData | null> {
    const source = await loadColorFromJson(slug);
    if (!source) {
        return null;
    }

    const categoryId = getCategoryId(source.categorySlug);
    if (context?.categoryId && categoryId !== context.categoryId) {
        return null;
    }

    const brandId = context?.brandId || source.brandId || source.color.brandId;
    const specs = buildSpecsFromColor(source.color, {
        categoryId,
        brandId,
    });

    return {
        source,
        specs,
        characteristics: buildCharacteristicsFromColor(source.color, {
            categoryId,
            brandId,
        }),
        documents: normalizeColorDocuments(source.color.documents),
    };
}

export function colorToProduct(source: ColorSource, slug: string, collectionSlugOverride?: string): Product & { collectionSlug: string } {
    const { color } = source;
    const categoryId = getCategoryId(source.categorySlug);
    const brandId = source.brandId || color.brandId || '6';
    const cleanName = cleanColorName(color.name);
    const name = color.code ? `${color.code} ${cleanName}` : cleanName;
    const primaryImageUrl = getPrimaryImageUrl(source);

    const images: ProductImageType[] = primaryImageUrl
        ? [{
            id: `color-img-${source.categorySlug}-${color.slug}`,
            url: primaryImageUrl,
            alt: name,
            isPrimary: true,
            order: 1,
        }]
        : [];

    const specs = buildSpecsFromColor(color, {
        categoryId,
        brandId,
    });
    const description = (color.description && typeof color.description === 'string' && color.description.trim())
        ? color.description.trim()
        : `${name} iz kolekcije ${color.collection_name}`;

    return {
        id: `color-${source.categorySlug}-${color.slug}`,
        name,
        slug,
        sku: color.code,
        categoryId,
        brandId,
        shortDescription: `${color.collection_name} - ${cleanName}`,
        description,
        images,
        specs,
        documents: normalizeColorDocuments(color.documents),
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
    const { color } = source;
    const categoryId = getCategoryId(source.categorySlug);
    const brandId = source.brandId || color.brandId || '6';
    const collectionName = (color.collection_name || color.collection || '').toString() || slug;
    const primaryImageUrl = getPrimaryImageUrl(source);

    const images: ProductImageType[] = primaryImageUrl
        ? [{
            id: `collection-img-${source.categorySlug}-${slug}`,
            url: primaryImageUrl,
            alt: collectionName,
            isPrimary: true,
            order: 1,
        }]
        : [];

    const specs = buildSpecsFromColor(color, {
        categoryId,
        brandId,
    });

    return {
        id: `collection-${source.categorySlug}-${slug}`,
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
