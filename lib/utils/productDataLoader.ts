import { Product } from '@/types';
import { formatLvtSpecs } from '@/lib/product-page/spec-helpers';
import { enrichProductDescription, enrichShortDescription } from '@/lib/utils/description-enricher';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';
import vinylColorsData from '@/public/data/vinyl_colors_complete.json';
import carpetColorsData from '@/public/data/carpet_tiles_complete.json';
import bloqCarpetData from '@/public/data/bloq_carpet_tiles.json';
import collectionImagesData from '@/public/data/collection_images.json';
import esdColorsData from '@/public/data/esd_colors.json';
import tarkettLvtData from '@/public/data/tarkett_lvt_products.json';
import tarkettCollectionSpecsData from '@/public/data/tarkett_collection_specs.json';
import tarkettCollectionDetails from '@/public/data/tarkett_collection_details.json';
import tarkettSportData from '@/public/data/tarkett_sport_colors.json';
import tarkettLajsneData from '@/public/data/tarkett_lajsne_variants.json';
import tarkettVinylHomeData from '@/public/data/tarkett_vinyl_home_colors.json';
import tarkettHomogeneousVinylData from '@/public/data/tarkett_homogeneous_vinyl_colors.json';
import tarkettHeterogeneousVinylData from '@/public/data/tarkett_heterogeneous_vinyl_colors.json';
import techemMatsData from '@/public/data/techem_mats.json';
import romusToolsData from '@/public/data/romus_tools.json';
import wolflorVinylData from '@/public/data/wolflor_vinyl_colors.json';
import tisDekingProducts from '@/public/data/tis_deking_products.json';
import alpodFloorCollectionsData from '@/public/data/alpod_floor_collections.json';
import { bloqRoomshotAssetPaths, tarkettCollectionCoverAssetPaths } from '@/lib/data/local-asset-manifests';
import { getManualCollectionProducts } from '@/lib/data/manual-collection-products';
import { selectPreferredCollectionHeroAsset } from '@/lib/utils/catalog-assets';

let tarkettLvtCache: Product[] | null = null;
let lvtProductsCache: Product[] | null = null;
let linoleumProductsCache: Product[] | null = null;
let carpetProductsCache: Product[] | null = null;
let bloqCarpetCache: Product[] | null = null;
let dekingProductsCache: Product[] | null = null;
let esdCollectionCache: Product[] | null = null;
let tarkettSportCollectionCache: Product[] | null = null;
let tarkettLajsneCollectionCache: Product[] | null = null;
let tarkettVinylHomeCollectionCache: Product[] | null = null;
let tarkettHomogeneousVinylCollectionCache: Product[] | null = null;
let tarkettHeterogeneousVinylCollectionCache: Product[] | null = null;
let wolflorVinylCollectionCache: Product[] | null = null;
let gerflorLvtCollectionCache: Product[] | null = null;
let gerflorLinoleumCollectionCache: Product[] | null = null;
let gerflorCarpetCollectionCache: Product[] | null = null;
const GERFLOR_VINYL_COLLECTION_COVER_SLUGS = new Set([
    'mipolam-accord',
    'mipolam-affinity',
    'mipolam-affinity-608x608',
    'mipolam-astro',
    'mipolam-bioplanet',
    'mipolam-classic-1-5mm',
    'mipolam-classic-2mm',
    'mipolam-elegance',
    'mipolam-planet',
    'mipolam-symbioz',
    'mipolam-troplan',
    'nerok-55',
    'nerok-70',
    'premium-acoustic',
    'premium-compact',
    'taralay-impression-acoustic',
    'taralay-impression-compact',
    'taralay-impression-hop-acoustic',
    'taralay-impression-hop-compact',
    'taralay-initial-acoustic',
    'taralay-initial-compact',
    'taralay-millenium-compact',
]);
let techemDatasetCache:
    | {
        entries: Record<string, any>[];
        generatedAt: Date | null;
    }
    | undefined = undefined;
let techemProductsCache: Product[] | null = null;
let romusToolsDatasetCache:
    | {
        entries: Record<string, any>[];
        generatedAt: Date | null;
    }
    | undefined = undefined;
let romusToolProductsCache: Product[] | null = null;
let alpodCollectionProductsCache: Product[] | null = null;
let alpodVariantProductsCache: Product[] | null = null;
let alpodProductsCache: Product[] | null = null;

const DEFAULT_CATALOG_DATE = '2024-01-01';
const DEFAULT_TECHEM_CATEGORY_ID = '12';
const DEFAULT_TECHEM_BRAND_ID = '12';
const DEFAULT_ROMUS_TOOL_CATEGORY_ID = '13';
const DEFAULT_ROMUS_BRAND_ID = '13';
const DEFAULT_PODOVI_BRAND_ID = '14';
const TARKETT_COLLECTION_LOCAL_ASSET_SET = new Set(tarkettCollectionCoverAssetPaths);
const BLOQ_ROOMSHOT_LOCAL_ASSET_SET = new Set(bloqRoomshotAssetPaths);

// Display names for Tarkett collections
const TARKETT_COLLECTION_NAMES: Record<string, string> = {
    'id-inspiration-55': 'iD Inspiration 55',
    'id-inspiration-high-traffic-70': 'iD Inspiration 70 HT',
    'id-inspiration-30': 'iD Inspiration 30',
    'id-inspiration-click-solid-30': 'iD Inspiration Click Solid 30',
    'id-inspiration-click-solid-55': 'iD Inspiration Click Solid 55',
    'modulart-7': 'ModularT 7',
    'id-square-loose-lay': 'iD Square Loose-Lay',
    'id-mixonomi': 'iD Mixonomi',
    'id-inspiration-loose-lay': 'iD Inspiration Loose-Lay',
    'essence': 'Essence',
    'id-tilt': 'iD Tilt',
    'modulart-ll8': 'ModularT LL8',
    'id-inspiration-click-ht-70': 'iD Inspiration Click HT 70',
    'ideal-spc-50': 'iDeal SPC 50',
    'id-tilt-hit': 'iD Tilt HIT',
    'progressive-house': 'Progressive House',
};

function characteristicLabelToKey(label: string): string {
    return String(label)
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'spec';
}

function normalizeText(value: unknown) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim();
}

function slugifyValue(value: string) {
    return normalizeText(value)
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function parseOptionalNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    const normalizedValue = String(value || '')
        .replace(',', '.')
        .replace(/[^0-9.-]+/g, '')
        .trim();

    if (!normalizedValue) {
        return undefined;
    }

    const parsedValue = Number.parseFloat(normalizedValue);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function parseOptionalBoolean(value: unknown, fallback: boolean) {
    if (typeof value === 'boolean') {
        return value;
    }

    const normalizedValue = String(value || '').trim().toLowerCase();
    if (!normalizedValue) {
        return fallback;
    }

    if (['true', '1', 'yes', 'da'].includes(normalizedValue)) {
        return true;
    }

    if (['false', '0', 'no', 'ne'].includes(normalizedValue)) {
        return false;
    }

    return fallback;
}

function parseOptionalDate(value: unknown) {
    const normalizedValue = String(value || '').trim();
    const parsedValue = normalizedValue ? new Date(normalizedValue) : new Date(DEFAULT_CATALOG_DATE);
    return Number.isNaN(parsedValue.getTime()) ? new Date(DEFAULT_CATALOG_DATE) : parsedValue;
}

function parseValidDate(value: unknown) {
    const normalizedValue = String(value || '').trim();
    if (!normalizedValue) {
        return undefined;
    }

    const parsedValue = new Date(normalizedValue);
    return Number.isNaN(parsedValue.getTime()) ? undefined : parsedValue;
}

function normalizeProductImage(
    rawImage: unknown,
    fallbackId: string,
    fallbackAlt: string,
    order: number
): Product['images'][number] | null {
    if (!rawImage) {
        return null;
    }

    if (typeof rawImage === 'string') {
        return {
            id: `${fallbackId}-img-${order}`,
            url: rawImage,
            alt: fallbackAlt,
            isPrimary: order === 0,
            order,
        };
    }

    if (typeof rawImage !== 'object') {
        return null;
    }

    const imageRecord = rawImage as Record<string, unknown>;
    const url = normalizeText(imageRecord.url || imageRecord.src || imageRecord.image || imageRecord.image_url);
    if (!url) {
        return null;
    }

    const rawOrder = parseOptionalNumber(imageRecord.order ?? imageRecord.order_num);
    const normalizedOrder = rawOrder !== undefined ? rawOrder : order;
    const variantRecord =
        typeof imageRecord.variants === 'object' && imageRecord.variants
            ? imageRecord.variants as Record<string, unknown>
            : {};
    const variants = {
        thumb: normalizeText(imageRecord.thumb ?? variantRecord.thumb),
        card: normalizeText(imageRecord.card ?? variantRecord.card),
        hero: normalizeText(imageRecord.hero ?? variantRecord.hero),
        og: normalizeText(imageRecord.og ?? variantRecord.og),
    };
    const hasVariants = Object.values(variants).some(Boolean);

    return {
        id: normalizeText(imageRecord.id) || `${fallbackId}-img-${normalizedOrder}`,
        url,
        alt: normalizeText(imageRecord.alt || imageRecord.title) || fallbackAlt,
        isPrimary: imageRecord.isPrimary === true || imageRecord.is_primary === true || normalizedOrder === 0,
        order: normalizedOrder,
        variants: hasVariants ? variants : undefined,
    };
}

function normalizeDocumentList(rawProduct: Record<string, any>) {
    const explicitDocuments = Array.isArray(rawProduct.documents)
        ? rawProduct.documents
        : [];
    const derivedDocuments = [
        rawProduct.pdf_url,
        rawProduct.catalog_pdf_url,
        rawProduct.technical_pdf_url,
        rawProduct.installation_pdf_url,
    ].filter(Boolean);

    const documents = [...explicitDocuments, ...derivedDocuments].reduce<Array<{ title: string; url: string; type?: string }>>((acc, document, index) => {
        if (!document) {
            return acc;
        }

        if (typeof document === 'string') {
            acc.push({
                title: rawProduct.name ? `${rawProduct.name} PDF ${index + 1}` : `PDF ${index + 1}`,
                url: document,
                type: 'pdf',
            });
            return acc;
        }

        if (typeof document !== 'object') {
            return acc;
        }

        const documentRecord = document as Record<string, unknown>;
        const url = normalizeText(documentRecord.url || documentRecord.href);
        if (!url) {
            return acc;
        }

        acc.push({
            title:
                normalizeText(documentRecord.title || documentRecord.name || documentRecord.label) ||
                (rawProduct.name ? `${rawProduct.name} dokument` : 'Dokument'),
            url,
            type: normalizeText(documentRecord.type) || (url.toLowerCase().includes('.pdf') ? 'pdf' : undefined),
        });

        return acc;
    }, []);

    return documents.length > 0 ? documents : undefined;
}

function normalizeSpecSource(rawSource: unknown, fallbackLabel?: string): Product['specs'] {
    if (!rawSource) {
        return [];
    }

    if (Array.isArray(rawSource)) {
        return rawSource
            .map((rawSpec, index) => {
                if (!rawSpec) {
                    return null;
                }

                if (typeof rawSpec === 'string') {
                    const value = normalizeText(rawSpec);
                    if (!value) {
                        return null;
                    }

                    const label = fallbackLabel || `Specifikacija ${index + 1}`;
                    return {
                        key: characteristicLabelToKey(label),
                        label,
                        value,
                    };
                }

                if (typeof rawSpec !== 'object') {
                    return null;
                }

                const specRecord = rawSpec as Record<string, unknown>;
                const label = normalizeText(specRecord.label || specRecord.name || specRecord.title || specRecord.key || fallbackLabel);
                const value = normalizeText(specRecord.value || specRecord.content || specRecord.text);

                if (!label || !value) {
                    return null;
                }

                return {
                    key: normalizeText(specRecord.key) || characteristicLabelToKey(label),
                    label,
                    value,
                };
            })
            .filter((spec): spec is Product['specs'][number] => Boolean(spec));
    }

    if (typeof rawSource !== 'object') {
        return [];
    }

    return Object.entries(rawSource as Record<string, unknown>)
        .map(([label, value]) => {
            if (value && typeof value === 'object') {
                return null;
            }

            const normalizedValue = normalizeText(value);
            if (!normalizedValue) {
                return null;
            }

            return {
                key: characteristicLabelToKey(label),
                label,
                value: normalizedValue,
            };
        })
        .filter((spec): spec is Product['specs'][number] => Boolean(spec));
}

function normalizeTechemSpecs(rawProduct: Record<string, any>) {
    let specs: Product['specs'] = [];

    for (const source of [
        rawProduct.specs,
        rawProduct.specifications,
        rawProduct.characteristics,
        rawProduct.attributes,
    ]) {
        specs = mergeUniqueSpecs(specs, normalizeSpecSource(source));
    }

    const collectionName = normalizeText(rawProduct.family || rawProduct.collection);
    const directSpecs: Product['specs'] = [
        collectionName
            ? { key: 'collection', label: 'Kolekcija', value: collectionName }
            : null,
        rawProduct.type
            ? { key: 'type', label: 'Tip', value: normalizeText(rawProduct.type) }
            : null,
        rawProduct.material
            ? { key: 'material', label: 'Materijal', value: normalizeText(rawProduct.material) }
            : null,
        rawProduct.sourceSlug
            ? { key: '__techem_source_slug', label: '__Techem Source Slug', value: normalizeText(rawProduct.sourceSlug) }
            : null,
        rawProduct.topCategory
            ? { key: '__techem_top_category', label: '__Techem Top Category', value: normalizeText(rawProduct.topCategory) }
            : null,
        rawProduct.family
            ? { key: '__techem_family', label: '__Techem Family', value: normalizeText(rawProduct.family) }
            : null,
        (rawProduct.canonicalUrl || rawProduct.url)
            ? {
                key: '__techem_canonical_url',
                label: '__Techem Canonical Url',
                value: normalizeText(rawProduct.canonicalUrl || rawProduct.url),
            }
            : null,
    ].filter((spec): spec is Product['specs'][number] => Boolean(spec));

    return mergeUniqueSpecs(specs, directSpecs);
}

function getAlpodRawCollections(categoryId?: string): Record<string, any>[] {
    const collections = (((alpodFloorCollectionsData as any)?.collections || []) as Record<string, any>[]);
    return categoryId ? collections.filter((collection) => normalizeText(collection.categoryId) === categoryId) : collections;
}

function normalizeAlpodSpecs(
    rawCharacteristics: Record<string, any> | undefined,
    collectionName: string,
    options?: {
        colorCount?: number;
        sourceUrl?: string;
        categoryId?: string;
    }
): Product['specs'] {
    let specs = normalizeSpecSource(rawCharacteristics || {});

    const extraSpecs: Product['specs'] = [
        collectionName
            ? { key: 'collection', label: 'Kolekcija', value: collectionName }
            : null,
        options?.colorCount
            ? { key: 'color_count', label: 'Broj dekora', value: String(options.colorCount) }
            : null,
        options?.sourceUrl
            ? { key: '__alpod_source_url', label: '__Alpod Source URL', value: normalizeText(options.sourceUrl) }
            : null,
    ].filter((spec): spec is Product['specs'][number] => Boolean(spec));

    specs = mergeUniqueSpecs(specs, extraSpecs);

    const thicknessValue =
        specs.find((spec) => spec.key === 'debljina')?.value ||
        specs.find((spec) => spec.label.toLowerCase() === 'debljina')?.value;
    if (thicknessValue && !specs.find((spec) => spec.key === 'thickness')) {
        specs.push({ key: 'thickness', label: 'Debljina', value: thicknessValue });
    }

    const wearLayerValue =
        specs.find((spec) => spec.key === 'habajuci_sloj')?.value ||
        specs.find((spec) => spec.label.toLowerCase() === 'habajući sloj')?.value;
    if (wearLayerValue && !specs.find((spec) => spec.key === 'wear_layer')) {
        specs.push({ key: 'wear_layer', label: 'Habajući sloj', value: wearLayerValue });
    }

    const woodTypeValue =
        specs.find((spec) => spec.key === 'dekor_vrsta_drveta')?.value ||
        specs.find((spec) => spec.label.toLowerCase() === 'dekor / vrsta drveta')?.value;
    if (woodTypeValue && !specs.find((spec) => spec.key === 'wood_type')) {
        specs.push({ key: 'wood_type', label: 'Vrsta drveta / dekor', value: woodTypeValue });
    }

    if (options?.categoryId === '2' && !specs.find((spec) => spec.key === 'type')) {
        specs.push({ key: 'type', label: 'Tip', value: 'Heterogeni' });
    }

    return specs;
}

function normalizeAlpodImages(rawImages: unknown[], fallbackId: string, fallbackAlt: string): Product['images'] {
    const seenUrls = new Set<string>();
    return rawImages
        .map((rawImage, index) => normalizeProductImage(rawImage, fallbackId, fallbackAlt, index))
        .filter((image): image is Product['images'][number] => {
            if (!image || seenUrls.has(image.url)) {
                return false;
            }
            seenUrls.add(image.url);
            return true;
        });
}

function transformAlpodCollectionProduct(rawCollection: Record<string, any>, index: number): Product {
    const name = normalizeText(rawCollection.name) || 'Podovi kolekcija';
    const slug = normalizeText(rawCollection.slug) || `podovi-kolekcija-${index + 1}`;
    const categoryId = normalizeText(rawCollection.categoryId) || '2';
    const colorCount = Number(rawCollection.colorCount || rawCollection.colors?.length || 0);
    const images = normalizeAlpodImages(
        [
            rawCollection.collection_image_url,
            rawCollection.image,
            rawCollection.image_url,
            ...(((rawCollection.colors || []) as Record<string, any>[])
                .flatMap((color) => Array.isArray(color.images) ? color.images : [color.image || color.image_url])
                .filter(Boolean)),
        ],
        `alpod-collection-${slug}`,
        name
    );
    const specs = normalizeAlpodSpecs(rawCollection.characteristics, name, {
        colorCount,
        sourceUrl: rawCollection.url,
        categoryId,
    });
    const description =
        normalizeText(rawCollection.description) ||
        `${name} kolekcija u Podovi katalogu. Cena i dostupnost se proveravaju slanjem upita.`;

    return {
        id: normalizeText(rawCollection.id) || `alpod-collection-${slug}`,
        name,
        slug,
        sku: normalizeText(rawCollection.sku) || `PODOVI-COLLECTION-${slug.toUpperCase()}`,
        categoryId,
        brandId: DEFAULT_PODOVI_BRAND_ID,
        shortDescription:
            normalizeText(rawCollection.shortDescription) ||
            `${name} - ${colorCount} ${categoryId === '5' ? 'artikala' : 'dekora'} bez javno istaknute cene`,
        description,
        images,
        specs,
        detailsSections: [
            {
                title: 'Kolekcija',
                items: [
                    `${colorCount} ${categoryId === '5' ? 'artikala' : 'dekora'} u kolekciji`,
                    'Cena na upit',
                ],
            },
        ],
        externalLink: normalizeText(rawCollection.url) || undefined,
        price: undefined,
        priceUnit: undefined,
        inStock: true,
        featured: false,
        createdAt: parseOptionalDate((alpodFloorCollectionsData as any)?.generatedAt),
        updatedAt: parseOptionalDate((alpodFloorCollectionsData as any)?.generatedAt),
    };
}

function transformAlpodVariantProduct(
    rawColor: Record<string, any>,
    rawCollection: Record<string, any>,
    index: number
): Product & { collectionSlug?: string } {
    const collectionName = normalizeText(rawCollection.name) || 'Podovi kolekcija';
    const name = normalizeText(rawColor.name || rawColor.full_name) || collectionName;
    const fullName = normalizeText(rawColor.full_name) || name;
    const slug = normalizeText(rawColor.slug) || `podovi-${slugifyValue(`${collectionName}-${name}`)}`;
    const categoryId = normalizeText(rawCollection.categoryId) || '2';
    const collectionSlug = normalizeText(rawCollection.slug);
    const images = normalizeAlpodImages(
        [
            ...(Array.isArray(rawColor.images) ? rawColor.images : []),
            rawColor.image,
            rawColor.image_url,
            rawColor.texture_url,
        ].filter(Boolean),
        `alpod-variant-${slug}`,
        fullName
    );
    const specs = normalizeAlpodSpecs(
        {
            ...(rawCollection.characteristics || {}),
            ...(rawColor.characteristics || {}),
        },
        collectionName,
        {
            sourceUrl: rawColor.url || rawCollection.url,
            categoryId,
        }
    );
    const description =
        normalizeText(rawColor.description) ||
        normalizeText(rawCollection.description) ||
        `${fullName} iz kolekcije ${collectionName}. Cena i dostupnost se proveravaju slanjem upita.`;

    return {
        id: `alpod-variant-${rawColor.sourceId || slug || index}`,
        name,
        slug,
        sku: normalizeText(rawColor.code || rawColor.sourceSku) || `PODOVI-ITEM-${index + 1}`,
        categoryId,
        brandId: DEFAULT_PODOVI_BRAND_ID,
        shortDescription: `${collectionName} - ${name}`,
        description,
        images,
        specs,
        detailsSections: [
            {
                title: 'Artikal',
                items: [
                    `Kolekcija: ${collectionName}`,
                    'Cena na upit',
                ],
            },
        ],
        externalLink: normalizeText(rawColor.url || rawCollection.url) || undefined,
        price: undefined,
        priceUnit: undefined,
        inStock: true,
        featured: false,
        createdAt: parseOptionalDate((alpodFloorCollectionsData as any)?.generatedAt),
        updatedAt: parseOptionalDate((alpodFloorCollectionsData as any)?.generatedAt),
        collectionSlug: collectionSlug || undefined,
    };
}

function loadTechemDataset() {
    if (techemDatasetCache) {
        return techemDatasetCache;
    }

    try {
        const rawData = techemMatsData as Record<string, unknown> | Array<Record<string, unknown>>;
        const generatedAtValue =
            rawData && typeof rawData === 'object'
                ? normalizeText((rawData as Record<string, unknown>).generatedAt)
                : '';
        const parsedGeneratedAt = generatedAtValue ? new Date(generatedAtValue) : null;
        const generatedAt =
            parsedGeneratedAt && !Number.isNaN(parsedGeneratedAt.getTime())
                ? parsedGeneratedAt
                : null;

        if (Array.isArray(rawData)) {
            techemDatasetCache = {
                entries: rawData,
                generatedAt,
            };
            return techemDatasetCache;
        }

        for (const key of ['products', 'items', 'catalog']) {
            if (Array.isArray((rawData as Record<string, unknown>)[key])) {
                techemDatasetCache = {
                    entries: (rawData as Record<string, any>)[key],
                    generatedAt,
                };
                return techemDatasetCache;
            }
        }
    } catch (error) {
        console.error('Failed to load Techem catalog dataset:', error);
        techemDatasetCache = undefined;
        return {
            entries: [],
            generatedAt: null,
        };
    }

    techemDatasetCache = {
        entries: [],
        generatedAt: null,
    };
    return techemDatasetCache;
}

function loadTechemDatasetEntries(): Record<string, any>[] {
    return loadTechemDataset().entries;
}

function normalizeRomusToolSpecs(rawProduct: Record<string, any>) {
    let specs: Product['specs'] = [];

    for (const source of [
        rawProduct.specs,
        rawProduct.specifications,
        rawProduct.characteristics,
        rawProduct.attributes,
    ]) {
        specs = mergeUniqueSpecs(specs, normalizeSpecSource(source));
    }

    const directSpecs: Product['specs'] = [
        rawProduct.toolGroup
            ? { key: 'collection', label: 'Grupa', value: normalizeText(rawProduct.toolGroup) }
            : null,
        rawProduct.toolSubcategory
            ? { key: 'tool_subcategory', label: 'Podgrupa', value: normalizeText(rawProduct.toolSubcategory) }
            : null,
        rawProduct.variantName
            ? { key: 'variant', label: 'Varijanta', value: normalizeText(rawProduct.variantName) }
            : null,
        rawProduct.sku
            ? { key: 'romus_ref', label: 'Romus ref.', value: normalizeText(rawProduct.sku) }
            : null,
        rawProduct.sourceProductId
            ? { key: '__romus_source_product_id', label: '__Romus Source Product ID', value: normalizeText(rawProduct.sourceProductId) }
            : null,
        rawProduct.sourceVariationId
            ? { key: '__romus_source_variation_id', label: '__Romus Source Variation ID', value: normalizeText(rawProduct.sourceVariationId) }
            : null,
        rawProduct.sourceSlug
            ? { key: '__romus_source_slug', label: '__Romus Source Slug', value: normalizeText(rawProduct.sourceSlug) }
            : null,
    ].filter((spec): spec is Product['specs'][number] => Boolean(spec));

    return mergeUniqueSpecs(specs, directSpecs);
}

function loadRomusToolsDataset() {
    if (romusToolsDatasetCache) {
        return romusToolsDatasetCache;
    }

    try {
        const rawData = romusToolsData as Record<string, unknown> | Array<Record<string, unknown>>;
        const generatedAtValue =
            rawData && typeof rawData === 'object'
                ? normalizeText((rawData as Record<string, unknown>).generatedAt)
                : '';
        const parsedGeneratedAt = generatedAtValue ? new Date(generatedAtValue) : null;
        const generatedAt =
            parsedGeneratedAt && !Number.isNaN(parsedGeneratedAt.getTime())
                ? parsedGeneratedAt
                : null;

        if (Array.isArray(rawData)) {
            romusToolsDatasetCache = {
                entries: rawData,
                generatedAt,
            };
            return romusToolsDatasetCache;
        }

        for (const key of ['products', 'items', 'catalog']) {
            if (Array.isArray((rawData as Record<string, unknown>)[key])) {
                romusToolsDatasetCache = {
                    entries: (rawData as Record<string, any>)[key],
                    generatedAt,
                };
                return romusToolsDatasetCache;
            }
        }
    } catch (error) {
        console.error('Failed to load Romus tools dataset:', error);
        romusToolsDatasetCache = undefined;
        return {
            entries: [],
            generatedAt: null,
        };
    }

    romusToolsDatasetCache = {
        entries: [],
        generatedAt: null,
    };
    return romusToolsDatasetCache;
}

function transformRomusToolProduct(
    rawProduct: Record<string, any>,
    index: number,
    datasetGeneratedAt?: Date | null
): Product | null {
    const name = normalizeText(rawProduct.name || rawProduct.title || rawProduct.product_name);
    const sku = normalizeText(rawProduct.sku || rawProduct.reference || rawProduct.ref || rawProduct.id);

    if (!name && !sku) {
        return null;
    }

    const categoryId = normalizeText(rawProduct.categoryId || rawProduct.category_id) || DEFAULT_ROMUS_TOOL_CATEGORY_ID;
    const brandId = normalizeText(rawProduct.brandId || rawProduct.brand_id) || DEFAULT_ROMUS_BRAND_ID;
    const slug = normalizeText(rawProduct.slug || rawProduct.handle) || `romus-${slugifyValue(name || sku || `alat-${index + 1}`)}-${sku || index + 1}`;
    const id = normalizeText(rawProduct.id) || `romus-${sku || slug || index + 1}`;
    const specs = normalizeRomusToolSpecs(rawProduct);
    const description =
        normalizeText(rawProduct.description || rawProduct.longDescription || rawProduct.long_description || rawProduct.body) ||
        enrichProductDescription({ name: name || sku, categoryId, brandId, specs } as any);
    const shortDescription =
        normalizeText(rawProduct.shortDescription || rawProduct.short_description || rawProduct.summary || rawProduct.subtitle) ||
        enrichShortDescription({ name: name || sku, categoryId, brandId, specs } as any);
    const rawImages = [
        rawProduct.heroImage,
        ...(Array.isArray(rawProduct.galleryImages) ? rawProduct.galleryImages : []),
        ...(Array.isArray(rawProduct.images) ? rawProduct.images : []),
        rawProduct.image,
        rawProduct.image_url,
        rawProduct.thumbnail,
        rawProduct.thumbnail_url,
    ].filter(Boolean);
    const images = rawImages
        .map((image, imageIndex) => normalizeProductImage(image, id, name || sku || 'Romus alat', imageIndex))
        .filter((image): image is Product['images'][number] => Boolean(image))
        .reduce<Product['images']>((acc, image, imageIndex) => {
            if (acc.some((existingImage) => existingImage.url === image.url)) {
                return acc;
            }

            acc.push({
                ...image,
                order: imageIndex,
                isPrimary: imageIndex === 0 ? true : image.isPrimary,
            });
            return acc;
        }, []);
    const createdAt = parseValidDate(rawProduct.createdAt || rawProduct.created_at);
    const updatedAt = parseValidDate(rawProduct.updatedAt || rawProduct.updated_at);

    return {
        id,
        name: name || sku || `Romus alat ${index + 1}`,
        slug,
        sku: sku || `ROMUS-${slug.toUpperCase()}`,
        categoryId,
        brandId,
        shortDescription,
        description,
        images,
        specs,
        price: parseOptionalNumber(rawProduct.price),
        priceUnit: normalizeText(rawProduct.priceUnit || rawProduct.price_unit) || 'kom',
        inStock: parseOptionalBoolean(rawProduct.inStock ?? rawProduct.in_stock, true),
        featured: parseOptionalBoolean(rawProduct.featured, false),
        externalLink: normalizeText(rawProduct.externalLink || rawProduct.external_link || rawProduct.url || rawProduct.href) || undefined,
        documents: normalizeDocumentList(rawProduct),
        createdAt: createdAt || datasetGeneratedAt || new Date(DEFAULT_CATALOG_DATE),
        updatedAt: updatedAt || datasetGeneratedAt || new Date(DEFAULT_CATALOG_DATE),
    };
}

function transformTechemProduct(
    rawProduct: Record<string, any>,
    index: number,
    datasetGeneratedAt?: Date | null
): Product | null {
    const name = normalizeText(
        rawProduct.name ||
        rawProduct.title ||
        rawProduct.product_name ||
        rawProduct.label
    );
    const sku = normalizeText(rawProduct.sku || rawProduct.code || rawProduct.reference || rawProduct.id);

    if (!name && !sku) {
        return null;
    }

    const categoryId = normalizeText(rawProduct.categoryId || rawProduct.category_id) || DEFAULT_TECHEM_CATEGORY_ID;
    const brandId = normalizeText(rawProduct.brandId || rawProduct.brand_id) || DEFAULT_TECHEM_BRAND_ID;
    const sourceSlug = normalizeText(rawProduct.sourceSlug || rawProduct.source_slug);
    const slug = normalizeText(rawProduct.slug || rawProduct.handle || (sourceSlug ? `techem-${sourceSlug}` : '')) || slugifyValue(name || sku || `techem-${index + 1}`);
    const id = normalizeText(rawProduct.id) || `techem-${sourceSlug || slug || index + 1}`;
    const specs = normalizeTechemSpecs(rawProduct);
    const description =
        normalizeText(
            rawProduct.description ||
            rawProduct.longDescription ||
            rawProduct.long_description ||
            rawProduct.body
        ) ||
        enrichProductDescription({ name: name || sku, categoryId, brandId, specs } as any);
    const shortDescription =
        normalizeText(
            rawProduct.shortDescription ||
            rawProduct.short_description ||
            rawProduct.subtitle ||
            rawProduct.summary
        ) ||
        enrichShortDescription({ name: name || sku, categoryId, brandId, specs } as any);
    const rawImages = [
        rawProduct.heroImage,
        ...(Array.isArray(rawProduct.galleryImages) ? rawProduct.galleryImages : []),
        ...(Array.isArray(rawProduct.images) ? rawProduct.images : []),
        rawProduct.image,
        rawProduct.image_url,
        rawProduct.thumbnail,
        rawProduct.thumbnail_url,
    ].filter(Boolean);
    const images = rawImages
        .map((image, imageIndex) => normalizeProductImage(image, id, name || sku || 'Techem', imageIndex))
        .filter((image): image is Product['images'][number] => Boolean(image))
        .reduce<Product['images']>((acc, image, imageIndex) => {
            if (acc.some((existingImage) => existingImage.url === image.url)) {
                return acc;
            }

            acc.push({
                ...image,
                order: imageIndex,
                isPrimary: imageIndex === 0 ? true : image.isPrimary,
            });
            return acc;
        }, []);
    const detailsSections = Array.isArray(rawProduct.detailsSections || rawProduct.details_sections)
        ? (rawProduct.detailsSections || rawProduct.details_sections)
        : undefined;
    const benefits = [
        ...(Array.isArray(rawProduct.benefits) ? rawProduct.benefits : []),
        ...(Array.isArray(rawProduct.featureBullets) ? rawProduct.featureBullets : []),
    ]
        .map((benefit) => normalizeText(benefit))
        .filter(Boolean);
    const createdAt = parseValidDate(rawProduct.createdAt || rawProduct.created_at);
    const updatedAt = parseValidDate(rawProduct.updatedAt || rawProduct.updated_at);

    return {
        id,
        name: name || sku || `Techem proizvod ${index + 1}`,
        slug,
        sku: sku || `TECHEM-${slug.toUpperCase()}`,
        categoryId,
        brandId,
        shortDescription,
        description,
        images,
        specs,
        price: parseOptionalNumber(rawProduct.price),
        priceUnit: normalizeText(rawProduct.priceUnit || rawProduct.price_unit) || undefined,
        inStock: parseOptionalBoolean(rawProduct.inStock ?? rawProduct.in_stock, true),
        featured: parseOptionalBoolean(rawProduct.featured, false),
        coveragePerPackage: parseOptionalNumber(rawProduct.coveragePerPackage ?? rawProduct.coverage_per_package),
        externalLink: normalizeText(rawProduct.canonicalUrl || rawProduct.externalLink || rawProduct.external_link || rawProduct.url || rawProduct.href) || undefined,
        detailsSections,
        documents: normalizeDocumentList(rawProduct),
        benefits: benefits.length > 0 ? benefits : undefined,
        compatibleAccessories: Array.isArray(rawProduct.compatibleAccessories)
            ? rawProduct.compatibleAccessories.map((accessory) => normalizeText(accessory)).filter(Boolean)
            : undefined,
        createdAt: createdAt || datasetGeneratedAt || new Date(DEFAULT_CATALOG_DATE),
        updatedAt: updatedAt || datasetGeneratedAt || new Date(DEFAULT_CATALOG_DATE),
    };
}

function buildSpecsFromCharacteristicRecord(
    characteristics?: Record<string, string>,
    collectionName?: string
): Product['specs'] {
    const specs: Product['specs'] = [];

    if (collectionName) {
        specs.push({ key: 'collection', label: 'Kolekcija', value: collectionName });
    }

    if (!characteristics || typeof characteristics !== 'object') {
        return specs;
    }

    for (const [label, value] of Object.entries(characteristics)) {
        if (!value) continue;
        const key = characteristicLabelToKey(label);
        if (!specs.find((spec) => spec.key === key)) {
            specs.push({
                key,
                label,
                value: String(value).trim(),
            });
        }
    }

    return specs;
}

function pickRichestText(...values: Array<string | null | undefined>) {
    return values
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .sort((left, right) => right.length - left.length)[0] || '';
}

function pickFirstKnownLocalPublicAsset(
    knownAssetPaths: ReadonlySet<string>,
    ...candidates: Array<string | null | undefined>
) {
    return candidates
        .map((candidate) => String(candidate || '').trim())
        .find((candidate) => candidate && knownAssetPaths.has(candidate.split(/[?#]/, 1)[0])) || '';
}

function resolveTarkettCollectionImageOverride(
    collectionName: string,
    collectionSlug: string
) {
    const collectionImages = (collectionImagesData as Record<string, string>) || {};
    const normalizedName = String(collectionName || '').trim();
    const normalizedSlug = String(collectionSlug || '').trim();
    const slugPart = normalizedSlug.replace(/^tarkett-/i, '');
    const nameWithoutPrefix = normalizedName.replace(/^Tarkett\s+/i, '').trim();

    const exactKeys = [
        normalizedName,
        nameWithoutPrefix,
        normalizedSlug,
        slugPart,
    ].filter(Boolean);

    for (const key of exactKeys) {
        const image = String(collectionImages[key] || '').trim();
        if (image) {
            return image;
        }
    }

    const lowerCaseKeys = exactKeys.map((key) => key.toLowerCase());
    const caseInsensitiveMatch = Object.entries(collectionImages).find(([key]) =>
        lowerCaseKeys.includes(key.toLowerCase())
    );
    if (caseInsensitiveMatch?.[1]) {
        return String(caseInsensitiveMatch[1]).trim();
    }

    if (slugPart) {
        const slugMatch = Object.entries(collectionImages).find(([key]) =>
            key.toLowerCase().includes(slugPart.toLowerCase())
        );
        if (slugMatch?.[1]) {
            return String(slugMatch[1]).trim();
        }
    }

    return '';
}

function humanizeCollectionName(collectionSlug: string) {
    return String(collectionSlug)
        .split('-')
        .filter(Boolean)
        .map((part) => {
            if (/^\d+$/.test(part)) {
                return part;
            }

            return part.charAt(0).toUpperCase() + part.slice(1);
        })
        .join(' ');
}

function normalizeTarkettCollectionUrl(originalUrl?: string) {
    const value = String(originalUrl || '').trim();
    if (!value) return '';

    const absoluteUrl = value.startsWith('//') ? `https:${value}` : value;
    return absoluteUrl.replace(/\/[^/]+$/, '');
}

function normalizeTarkettDocumentUrl(originalUrl?: string) {
    const value = String(originalUrl || '').trim();
    if (!value) return '';
    if (!/media\.tarkett-image\.com/i.test(value) || !/\.pdf(?:\?|$)/i.test(value)) {
        return value;
    }

    return value
        .replace('://media.tarkett-image.com/large-high/', '://media.tarkett-image.com/docs/')
        .replace('://media.tarkett-image.com/large/', '://media.tarkett-image.com/docs/')
        .replace('://media.tarkett-image.com/medium/', '://media.tarkett-image.com/docs/');
}

function buildDescriptionFromCharacteristics(
    baseDescription: string,
    characteristics?: Record<string, any>,
    options?: { prefix?: string }
) {
    const normalizedBase = String(baseDescription || '').replace(/\s+/g, ' ').trim();
    const values = characteristics && typeof characteristics === 'object' ? characteristics : {};
    const detailParts = [
        values['Tip'] ? `Tip: ${values['Tip']}.` : '',
        values['Format'] ? `Format: ${values['Format']}.` : '',
        values['Ukupna debljina'] ? `Ukupna debljina: ${values['Ukupna debljina']}.` : '',
        values['ESD klasa'] ? `ESD klasa: ${values['ESD klasa']}.` : '',
        values['Tip instalacije'] ? `Način ugradnje: ${values['Tip instalacije']}.` : '',
        values['Cleanroom'] ? `Pogodno za cleanroom standard ${values['Cleanroom']}.` : '',
    ].filter(Boolean);

    const combined = [normalizedBase, options?.prefix || '', ...detailParts]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

    return combined;
}

function mergeUniqueSpecs(
    baseSpecs: Product['specs'],
    extraSpecs: Product['specs']
): Product['specs'] {
    const merged: Product['specs'] = [];
    const seen = new Set<string>();

    for (const spec of [...(baseSpecs || []), ...(extraSpecs || [])]) {
        const key = normalizeText(spec?.key) || normalizeText(spec?.label);
        const value = normalizeText(spec?.value);
        if (!key || !value || seen.has(key)) {
            continue;
        }

        seen.add(key);
        merged.push({
            key: spec.key,
            label: spec.label,
            value: value,
        });
    }

    return merged;
}

/**
 * Utility to standardize and clean up product color names.
 * Removes redundant codes, technical prefixes/suffixes, and applies Title Case.
 */
export function formatProductName(rawName: string, code?: string): string {
    let cleanName = rawName || '';

    // If code is provided, remove it from the beginning of the name
    if (code) {
        // Escape code for regex to be safe
        const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const codeRegex = new RegExp(`^${escapedCode}[\\s\\-_]*`, 'i');
        cleanName = cleanName.replace(codeRegex, '');
    }

    // Remove known technical prefixes like "Ess30-", "iD 30-", etc.
    cleanName = cleanName.replace(/^(Ess\d+-|iD\s*\d+-|Tarkett\s*)/i, '');
    // Remove technical suffixes like "-0v"
    cleanName = cleanName.replace(/-0v$/i, '');
    // Remove dimensions like "33,3x66,6" or "50x50" or "1200x200mm"
    cleanName = cleanName.replace(/\d+([.,]\d+)?\s*x\s*\d+([.,]\d+)?\s*(mm|cm)?/gi, '');
    // Remove trailing hyphens, en-dashes, or underscores
    cleanName = cleanName.replace(/[-–_]\s*$/g, '').trim();
    // Replace remaining hyphens and underscores with spaces
    cleanName = cleanName.replace(/[-_]/g, ' ');

    // Standardize capitalization (Title Case)
    cleanName = cleanName.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());

    // Remove multiple spaces
    cleanName = cleanName.replace(/\s+/g, ' ').trim();

    return cleanName;
}

export function getAllTarkettLVTProducts(): Product[] {
    if (tarkettLvtCache) {
        return tarkettLvtCache;
    }

    tarkettLvtCache = (tarkettLvtData as any[]).map(p => {
        // Convert plain URL strings to ProductImage objects
        const images = (p.images || []).map((img: string | any, idx: number) => {
            if (typeof img === 'string') {
                return { id: `${p.id}-img-${idx}`, url: img, alt: p.name || '', isPrimary: idx === 0, order: idx };
            }
            return img; // already a ProductImage
        });

        // Clean up the name using our shared utility
        const cleanName = formatProductName(p.name, p.specs?.sap_sku_number);

        // Map documents from meta
        const documents = (p.meta?.documents || []).map((docUrl: string) => {
            const normalizedDocUrl = normalizeTarkettDocumentUrl(docUrl);
            const fileName = normalizedDocUrl.split('/').pop() || 'Dokument';
            // Create a readable title from filename
            let title = fileName.replace(/_/g, ' ').replace(/-/g, ' ').replace('.pdf', '');
            // Generic titles based on keywords
            if (title.toLowerCase().includes('dop')) title = 'Izjava o svojstvima (DoP)';
            else if (title.toLowerCase().includes('dataseet') || title.toLowerCase().includes('ds')) title = 'Tehnički list';
            else if (title.toLowerCase().includes('brochure')) title = 'Brošura';
            else if (title.toLowerCase().includes('maintenance')) title = 'Uputstvo za održavanje';
            else if (title.toLowerCase().includes('installation')) title = 'Uputstvo za ugradnju';

            return {
                title: title,
                url: normalizedDocUrl,
                type: 'pdf'
            };
        });

        return {
            ...p,
            name: cleanName.trim(), // Use the cleaned name
            slug: p.id,
            sku: p.specs?.sap_sku_number || p.id,
            categoryId: '6',
            brandId: '3',
            images,
            documents, // Add documents
            specs: [
                ...formatLvtSpecs(p.specs || {}),
                { key: 'collection', label: 'Kolekcija', value: TARKETT_COLLECTION_NAMES[p.collection] || p.collection || '' },
            ],
            shortDescription: p.shortDescription || enrichShortDescription({ ...p, name: cleanName.trim(), categoryId: '6', brandId: '3', specs: [...formatLvtSpecs(p.specs || {}), { key: 'collection', label: 'Kolekcija', value: TARKETT_COLLECTION_NAMES[p.collection] || p.collection || '' }] } as any),
            description: p.description || enrichProductDescription({ ...p, name: cleanName.trim(), categoryId: '6', brandId: '3', specs: [...formatLvtSpecs(p.specs || {}), { key: 'collection', label: 'Kolekcija', value: TARKETT_COLLECTION_NAMES[p.collection] || p.collection || '' }] } as any),
            createdAt: new Date(p.createdAt || '2024-01-01'),
            updatedAt: new Date(p.updatedAt || '2024-01-01'),
        };
    });

    return tarkettLvtCache;
}

let tarkettCollectionCache: Product[] | null = null;

/**
 * Auto-generate Tarkett collection header products from grouped data.
 * These have TARKETT- SKU prefix so the category page shows them as collection cards.
 */
export function getTarkettLVTCollections(): Product[] {
    if (tarkettCollectionCache) return tarkettCollectionCache;

    const products = getAllTarkettLVTProducts();
    const groups: Record<string, Product[]> = {};
    for (const p of products) {
        const col = (p as any).collection || 'unknown';
        if (!groups[col]) groups[col] = [];
        groups[col].push(p);
    }

    tarkettCollectionCache = Object.entries(groups).map(([collKey, items]) => {
        const displayName = TARKETT_COLLECTION_NAMES[collKey] || collKey;
        const first = items[0];
        const externalLink = normalizeTarkettCollectionUrl((first as any)?.meta?.originalUrl);
        const imageUrl = selectPreferredCollectionHeroAsset(
            resolveTarkettCollectionImageOverride(displayName, collKey),
            pickFirstKnownLocalPublicAsset(
                TARKETT_COLLECTION_LOCAL_ASSET_SET,
                `/images/tarkett/collections/${collKey}.jpg`
            ),
            first.images?.find((image) => image.isPrimary)?.url,
            first.images?.[0]?.url
        );
        const collectionImage = {
            id: `tarkett-${collKey}-cover`,
            url: imageUrl,
            alt: `Tarkett ${displayName}`,
            isPrimary: true,
            order: 0,
        };

        // Aggregate unique documents from all products in the collection
        const allDocs = items.flatMap(i => i.documents || []);
        // Deduplicate documents by URL
        const uniqueDocsMap = new Map();
        for (const doc of allDocs) {
            if (!uniqueDocsMap.has(doc.url)) {
                uniqueDocsMap.set(doc.url, doc);
            }
        }
        const documents = Array.from(uniqueDocsMap.values());

        // Load accurate collection specs from extracted JSON
        const collSpecData = (tarkettCollectionSpecsData as Record<string, any>)[collKey];
        const collSpecs: Product['specs'] = [];

        // Spec key -> Serbian label mapping
        const specLabels: Record<string, string> = {
            total_thickness: 'Ukupna debljina',
            wear_layer_thickness: 'Zaštitni sloj',
            basis_weight: 'Težina',
            total_weight: 'Ukupna težina',
            classification_commercial_iso_10874: 'Klasa (komercijalna)',
            classification_domestic_iso_10874: 'Klasa (rezidencijalna)',
            surface_treatment: 'Površinska obrada',
            slip_resistance_en_13893: 'Otpornost na klizanje',
            reaction_fire_en_13501: 'Reakcija na vatru',
            underfloor_heating: 'Podno grejanje',
            impact_sound_insulation: 'Zvučna izolacija',
            installation_method: 'Način ugradnje',
            format: 'Format',
            format_type: 'Tip formata',
            residual_indentation: 'Rezidualni utisak',
            castor_chair_effect_iso_4918: 'Otpornost na točkiće',
            furniture_leg_effect_iso_16581: 'Otpornost na nameštaj',
            chemical_resistance_iso_26987: 'Hemijska otpornost',
            electrical_propensity: 'Elektrostatika',
            colour_fastness_light: 'Postojanost boje',
            thermal_resistance: 'Termička otpornost',
            phtalate_content: 'Sadržaj ftalata',
            country_origin: 'Zemlja porekla',
            laying_direction: 'Pravac polaganja',
            pattern_type: 'Tip dezena',
            bevelled_edges: 'Oborene ivice',
            product_type_norm_iso: 'Tip proizvoda (ISO)',
        };

        if (collSpecData?.specs) {
            for (const [key, value] of Object.entries(collSpecData.specs)) {
                collSpecs.push({
                    key,
                    label: specLabels[key] || key,
                    value: value as string,
                });
            }
        }

        // Always include the collection name spec
        collSpecs.push({ key: 'collection', label: 'Kolekcija', value: displayName });

        // Add detailed sections if available
        const detailsData = (tarkettCollectionDetails as Record<string, any>)[collKey];
        const detailsSections: Product['detailsSections'] = [];
        if (detailsData) {
            detailsSections.push({
                title: detailsData.title || 'Ključne karakteristike',
                items: detailsData.items || []
            });
        }

        return {
            id: `tarkett-${collKey}`,
            name: displayName,
            slug: `tarkett-${collKey}`,
            sku: `TARKETT-${collKey.toUpperCase()}`,
            categoryId: '6',
            brandId: '3',
            shortDescription: `${displayName} – ${items.length} dizajna`,
            description: first.description || enrichProductDescription({ name: displayName, categoryId: '6', brandId: '3', specs: collSpecs } as any),
            images: [collectionImage],
            specs: collSpecs,
            documents: documents,
            detailsSections: detailsSections.length > 0 ? detailsSections : undefined,
            externalLink: externalLink || undefined,
            price: 0,
            priceUnit: 'm²' as const,
            inStock: true,
            featured: false,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        } as Product;
    });

    return tarkettCollectionCache;
}

// ... (existing getAll functions)


/**
 * Get a specific product by slug
 */
export function getProductBySlug(slug: string): Product | undefined {
    const allProducts = [
        ...getAllGerflorProducts(),
        ...getGerflorLVTCollections(),
        ...getGerflorLinoleumCollections(),
        ...getGerflorCarpetCollections(),
        ...getAllBloqCarpetProducts(),
        ...getAllTarkettLVTProducts(),
        ...getTarkettLVTCollections(),
        ...getTarkettVinylHomeCollections(),
        ...getTarkettHeterogeneousVinylCollections(),
        ...getTarkettHomogeneousVinylCollections(),
        ...getWolflorVinylCollections(),
        ...getTarkettSportCollections(),
        ...getTarkettLajsneCollections(),
        ...getAllDekingProducts(),
        ...getAllAlpodProducts(),
        ...getAllTechemProducts(),
        ...getAllRomusToolProducts(),
        ...getVinylCollectionProducts(),
        ...getManualCollectionProducts(),
    ];
    return allProducts.find(p => p.slug === slug || p.id === slug);
}

/**
 * Get products by collection
 */
export function getProductsByCollection(collection: string): Product[] {
    return [...getAllLVTProducts(), ...getAllTarkettLVTProducts()].filter(p => {
        const collectionSpec = p.specs?.find(s => s.key === 'collection');
        return collectionSpec?.value === collection;
    });
}

/**
 * Get products by category
 */
export function getProductsByCategory(categoryId: string): Product[] {
    const techemProducts = getAllTechemProducts();
    const romusToolProducts = getAllRomusToolProducts();

    if (categoryId === '6') {
        // Return both Gerflor LVT and Tarkett LVT
        return [...getGerflorLVTCollections(), ...getAllLVTProducts(), ...getTarkettLVTCollections(), ...getAllTarkettLVTProducts()];
    } else if (categoryId === '2') {
        return [
            ...getVinylCollectionProducts(),
            ...getTarkettVinylHomeCollections(),
            ...getTarkettHeterogeneousVinylCollections(),
            ...getTarkettHomogeneousVinylCollections(),
            ...getWolflorVinylCollections(),
            ...getAlpodCollectionProducts('2'),
            ...getManualCollectionProducts().filter((product) => product.categoryId === '2'),
        ];
    } else if (categoryId === '10') {
        return [
            ...getManualCollectionProducts().filter((product) => product.categoryId === '10'),
            ...getTarkettSportCollections(),
        ];
    } else if (categoryId === '11') {
        return [...getTarkettLajsneCollections()];
    } else if (categoryId === '7') {
        return [...getGerflorLinoleumCollections(), ...getAllLinoleumProducts()];
    } else if (categoryId === '4') {
        return [...getGerflorCarpetCollections(), ...getAllCarpetProducts(), ...getAllBloqCarpetProducts()];
    } else if (categoryId === '5') {
        return [...getAllDekingProducts(), ...getAlpodCollectionProducts('5')];
    } else if (categoryId === '3') {
        return [
            ...getAlpodCollectionProducts('3'),
        ];
    } else if (techemProducts.some((product) => product.categoryId === categoryId)) {
        return techemProducts.filter((product) => product.categoryId === categoryId);
    } else if (romusToolProducts.some((product) => product.categoryId === categoryId)) {
        return romusToolProducts.filter((product) => product.categoryId === categoryId);
    }

    return [
        ...getAllGerflorProducts(),
        ...getGerflorLVTCollections(),
        ...getGerflorLinoleumCollections(),
        ...getAllBloqCarpetProducts(),
        ...getAllTarkettLVTProducts(),
        ...getTarkettLVTCollections(),
        ...getTarkettVinylHomeCollections(),
        ...getTarkettHeterogeneousVinylCollections(),
        ...getTarkettHomogeneousVinylCollections(),
        ...getWolflorVinylCollections(),
        ...getTarkettSportCollections(),
        ...getAllDekingProducts(),
        ...getAlpodCollectionProducts(),
        ...getAllTechemProducts(),
        ...getAllRomusToolProducts(),
        ...getVinylCollectionProducts(),
        ...getManualCollectionProducts(),
    ].filter(p => p.categoryId === categoryId);
}



/**
 * Transform LVT color data from JSON to Product type
 */
function transformLVTColorToProduct(color: any): Product {
    const collection = color.collection || '';
    const code = color.code || '';
    const name = color.name || '';
    const slug = color.slug || `${collection}-${code}`;

    // Build specs array from both color-specific and collection-level specs
    const specs: Array<{ key: string; label: string; value: string }> = [];

    // Add collection specs first
    if (color.collection_specs && Array.isArray(color.collection_specs)) {
        specs.push(...color.collection_specs);
    }

    // Add color-specific specs (NCS, LRV, packaging)
    if (color.specs) {
        if (color.specs.NCS) {
            specs.push({ key: 'ncs', label: 'NCS Oznaka', value: color.specs.NCS });
        }
        if (color.specs.LRV) {
            specs.push({ key: 'lrv', label: 'LRV', value: color.specs.LRV });
        }
        if (color.specs.packaging) {
            specs.push({ key: 'packaging', label: 'Pakovanje', value: color.specs.packaging });
        }
    }

    // Build basic color info
    const formattedName = formatProductName(name, code);
    specs.push({ key: 'collection', label: 'Kolekcija', value: collection });
    specs.push({ key: 'code', label: 'Šifra', value: code });
    specs.push({ key: 'color', label: 'Boja', value: formattedName });

    return {
        id: slug,
        name: formattedName,
        slug,
        sku: code,
        categoryId: '6', // LVT
        brandId: '6', // Gerflor
        shortDescription: `Gerflor ${collection.replace('-', ' ').toUpperCase()} - ${formattedName}`,
        description: color.description || enrichProductDescription({ name: formattedName, categoryId: '6', brandId: '6', specs } as any),
        images: [
            {
                id: `${slug}-img-1`,
                url: color.image_url || `/images/products/lvt/colors/${collection}/${slug}.jpg`,
                alt: name,
                isPrimary: true,
                order: 1,
            },
        ],
        specs,
        inStock: true,
        featured: false,
        externalLink: `https://www.gerflor-cee.com/products/${collection}`,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    };
}

/**
 * Transform Linoleum collection data from JSON to Product type
 */
function transformLinoleumToProduct(product: any, index: number): Product {
    const slug = product.slug || `linoleum-${index}`;
    const name = product.name || `Linoleum Product ${index}`;
    const formattedName = formatProductName(name);

    return {
        id: slug,
        name: formattedName,
        slug,
        sku: `LINOLEUM-${String(index + 1).padStart(2, '0')}`,
        categoryId: '7', // Linoleum
        brandId: '6', // Gerflor
        shortDescription: product.shortDescription || product.description || enrichShortDescription({ ...product, name: formattedName, categoryId: '7', specs: product.specs || [] } as any),
        description: product.description || enrichProductDescription({ ...product, name: formattedName, categoryId: '7', specs: product.specs || [], brandId: '6' } as any),
        images: product.images || [
            {
                id: `${slug}-img-1`,
                url: `/images/products/linoleum/${slug}.jpg`,
                alt: name,
                isPrimary: true,
                order: 1,
            },
        ],
        specs: product.specs || [],
        detailsSections: product.detailsSections,
        inStock: true,
        featured: product.featured || false,
        externalLink: product.externalLink || 'https://www.gerflor-cee.com/category/linoleum',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    };
}

/**
 * Get all LVT products from lvt_colors_complete.json
 */
export function getAllLVTProducts(): Product[] {
    if (lvtProductsCache) {
        return lvtProductsCache;
    }

    const colors = (lvtColorsData as any).colors || [];
    const products = colors.map(transformLVTColorToProduct);
    lvtProductsCache = products;

    return products;
}

export function getGerflorLVTCollections(): Product[] {
    if (gerflorLvtCollectionCache) {
        return gerflorLvtCollectionCache;
    }

    const colors = ((lvtColorsData as any).colors || []) as any[];
    const grouped = new Map<string, any[]>();

    for (const color of colors) {
        const collectionSlug = String(color.collection || '').trim();
        if (!collectionSlug) continue;

        if (!grouped.has(collectionSlug)) {
            grouped.set(collectionSlug, []);
        }

        grouped.get(collectionSlug)!.push(color);
    }

    gerflorLvtCollectionCache = Array.from(grouped.entries()).map(([collectionSlug, collectionColors]) => {
        const firstColor = collectionColors[0];
        const displayName = firstColor.collection_name || humanizeCollectionName(collectionSlug);
        const description = pickRichestText(
            ...collectionColors.map((color) => color.description),
            firstColor.description
        );
        const imageUrl = selectPreferredCollectionHeroAsset(
            ...collectionColors.map((color) => color.lifestyle_url),
            ...collectionColors.map((color) => color.image_url)
        );

        const specs = mergeUniqueSpecs(
            [
                ...(Array.isArray(firstColor.collection_specs)
                    ? firstColor.collection_specs.map((spec: any) => ({
                        key: spec.key,
                        label: spec.label,
                        value: String(spec.value),
                    }))
                    : []),
                { key: 'collection', label: 'Kolekcija', value: displayName },
            ],
            buildSpecsFromCharacteristicRecord(firstColor.characteristics)
        );

        return {
            id: `gerflor-lvt-${collectionSlug}`,
            name: displayName,
            slug: `gerflor-${collectionSlug}`,
            sku: `LVT-${collectionSlug.toUpperCase()}`,
            categoryId: '6',
            brandId: '6',
            shortDescription: `${displayName} — ${collectionColors.length} boja`,
            description,
            images: imageUrl ? [{
                id: `gerflor-lvt-${collectionSlug}-img`,
                url: imageUrl,
                alt: displayName,
                isPrimary: true,
                order: 0,
            }] : [],
            specs,
            inStock: true,
            featured: false,
            externalLink: `https://www.gerflor-cee.com/products/${collectionSlug}`,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        } as Product;
    });

    return gerflorLvtCollectionCache;
}

/**
 * Get all Linoleum products from linoleum_colors_complete.json
 */
export function getAllLinoleumProducts(): Product[] {
    if (linoleumProductsCache) {
        return linoleumProductsCache;
    }

    // Linoleum colors are loaded directly from JSON in LVTTabs.
    // Do not add them to the product repository to avoid inflating collection counts.
    linoleumProductsCache = [];

    return linoleumProductsCache;
}

export function getGerflorLinoleumCollections(): Product[] {
    if (gerflorLinoleumCollectionCache) {
        return gerflorLinoleumCollectionCache;
    }

    const colors = ((linoleumColorsData as any).colors || []) as any[];
    const grouped = new Map<string, any[]>();

    for (const color of colors) {
        const collectionSlug = String(color.collection || '').trim();
        if (!collectionSlug) continue;

        if (!grouped.has(collectionSlug)) {
            grouped.set(collectionSlug, []);
        }

        grouped.get(collectionSlug)!.push(color);
    }

    gerflorLinoleumCollectionCache = Array.from(grouped.entries()).map(([collectionSlug, collectionColors]) => {
        const firstColor = collectionColors[0];
        const displayName = firstColor.collection_name || humanizeCollectionName(collectionSlug);
        const description = pickRichestText(
            ...collectionColors.map((color) => color.description),
            firstColor.description
        );
        const imageUrl = selectPreferredCollectionHeroAsset(
            ...collectionColors.map((color) => color.image_url)
        );
        const specs = buildSpecsFromCharacteristicRecord(firstColor.characteristics, displayName);

        return {
            id: `gerflor-linoleum-${collectionSlug}`,
            name: displayName,
            slug: `gerflor-${collectionSlug}`,
            sku: `LINOLEUM-${collectionSlug.toUpperCase()}`,
            categoryId: '7',
            brandId: '6',
            shortDescription: `${displayName} — ${collectionColors.length} boja`,
            description,
            images: imageUrl ? [{
                id: `gerflor-linoleum-${collectionSlug}-img`,
                url: imageUrl,
                alt: displayName,
                isPrimary: true,
                order: 0,
            }] : [],
            specs,
            inStock: true,
            featured: false,
            externalLink: `https://www.gerflor-cee.com/products/${collectionSlug}`,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        } as Product;
    });

    return gerflorLinoleumCollectionCache;
}

export function getGerflorCarpetCollections(): Product[] {
    if (gerflorCarpetCollectionCache) {
        return gerflorCarpetCollectionCache;
    }

    const colors = ((carpetColorsData as any).colors || []) as any[];
    const grouped = new Map<string, any[]>();

    for (const color of colors) {
        const collectionSlug = String(color.collection_slug || color.collection || '').trim();
        if (!collectionSlug) continue;

        if (!grouped.has(collectionSlug)) {
            grouped.set(collectionSlug, []);
        }

        grouped.get(collectionSlug)!.push(color);
    }

    gerflorCarpetCollectionCache = Array.from(grouped.entries()).map(([collectionSlug, collectionColors]) => {
        const firstColor = collectionColors[0];
        const displayName = firstColor.collection_name || humanizeCollectionName(collectionSlug.replace(/^gerflor-/, ''));
        const description = pickRichestText(
            ...collectionColors.map((color) => color.description),
            firstColor.description
        );
        const imageUrl = selectPreferredCollectionHeroAsset(
            ...collectionColors.map((color) => color.texture_url),
            ...collectionColors.map((color) => color.image_url)
        );
        const characteristicSpecs = buildSpecsFromCharacteristicRecord(firstColor.characteristics)
            .filter((spec) => !['ncs', 'lrv'].includes(spec.key));
        const specs = mergeUniqueSpecs(
            [
                { key: 'collection', label: 'Kolekcija', value: displayName },
                { key: 'type', label: 'Tip', value: 'Tekstilne ploče' },
                firstColor.overall_thickness
                    ? { key: 'thickness', label: 'Ukupna debljina', value: String(firstColor.overall_thickness) }
                    : null,
                firstColor.dimension
                    ? { key: 'dimension', label: 'Dimenzije', value: String(firstColor.dimension) }
                    : null,
                firstColor.format
                    ? { key: 'format', label: 'Format', value: String(firstColor.format) }
                    : null,
                firstColor.specs?.PILE_WEIGHT
                    ? { key: 'pile_weight', label: 'Težina vlakna', value: String(firstColor.specs.PILE_WEIGHT) }
                    : null,
                firstColor.specs?.SURFACE_YARN
                    ? { key: 'surface_yarn', label: 'Sastav', value: String(firstColor.specs.SURFACE_YARN) }
                    : null,
                firstColor.specs?.INSTALLATION
                    ? { key: 'installation', label: 'Ugradnja', value: String(firstColor.specs.INSTALLATION) }
                    : null,
            ].filter((spec): spec is Product['specs'][number] => Boolean(spec)),
            characteristicSpecs
        );

        return {
            id: `gerflor-carpet-${collectionSlug}`,
            name: displayName,
            slug: collectionSlug,
            sku: `GER-${collectionSlug.replace(/^gerflor-/, '').toUpperCase()}`,
            categoryId: '4',
            brandId: '6',
            shortDescription: `${displayName} — ${collectionColors.length} boja`,
            description,
            images: imageUrl ? [{
                id: `gerflor-carpet-${collectionSlug}-img`,
                url: imageUrl,
                alt: displayName,
                isPrimary: true,
                order: 0,
            }] : [],
            specs,
            inStock: true,
            featured: false,
            externalLink: `https://www.gerflor-cee.com/products/${collectionSlug.replace(/^gerflor-/, '')}`,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        } as Product;
    });

    return gerflorCarpetCollectionCache;
}

/**
 * Get all Carpet products from carpet_tiles_complete.json
 * NOTE: These are returned for display in category grid only!
 * They should NOT have individual routes - only used in Boje (Colors) tab
 */
export function getAllCarpetProducts(): Product[] {
    if (carpetProductsCache) {
        return carpetProductsCache;
    }

    const colors = (carpetColorsData as any).colors || [];

    // Transform each color to a Product (for display only, not for routing)
    const products = colors.map((color: any) => {
        const specs = Object.entries(color.characteristics || {}).map(([label, value]) => ({
            key: label.toLowerCase().replace(/\s+/g, '_'),
            label,
            value: value as string
        }));

        // Add specs from color.specs
        if (color.specs) {
            if (color.specs.NCS && !specs.find(s => s.key === 'ncs')) {
                specs.push({ key: 'ncs', label: 'NCS Oznaka', value: color.specs.NCS });
            }
            if (color.specs.LRV && !specs.find(s => s.key === 'lrv')) {
                specs.push({ key: 'lrv', label: 'LRV', value: color.specs.LRV });
            }
        }

        // Build images array with BOTH images (Color Scan + Zoom)
        const images = [];
        if (color.image_url) {
            images.push({
                id: `${color.slug}-img-1`,
                url: color.image_url,
                alt: `${color.name} - Color Scan`,
                isPrimary: true,
                order: 1,
            });
        }
        if (color.texture_url) {
            images.push({
                id: `${color.slug}-img-2`,
                url: color.texture_url,
                alt: `${color.name} - Zoom/Close-up`,
                isPrimary: false,
                order: 2,
            });
        }

        const formattedName = formatProductName(color.full_name || color.name, color.code);

        return {
            id: color.slug,
            name: formattedName,
            // Use collection slug + color parameter for routing
            slug: `${color.collection_slug || color.collection}?color=${color.slug}`,
            sku: color.code,
            categoryId: '4', // Tekstilne ploče
            brandId: '6', // Gerflor
            shortDescription: enrichShortDescription({ ...color, name: formattedName, categoryId: '4', brandId: '6', specs } as any),
            description: color.description || enrichProductDescription({ name: formattedName, categoryId: '4', brandId: '6', specs } as any),
            images: images.length > 0 ? images : [{
                id: `${color.slug}-img-1`,
                url: '/images/placeholder.svg',
                alt: formattedName,
                isPrimary: true,
                order: 1,
            }],
            specs,
            inStock: true,
            featured: false,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        };
    });

    carpetProductsCache = products;
    return products;
}


/**
 * Get all BLOQ Carpet products from bloq_carpet_tiles.json
 * Returns both collection-level products (with BLOQ- SKU prefix for category page collection tab)
 * and individual color products
 */
export function getAllBloqCarpetProducts(): Product[] {
    if (bloqCarpetCache) {
        return bloqCarpetCache;
    }

    const colors = (bloqCarpetData as any).colors || [];

    // Group colors by collection to create collection-level products
    const collectionMap = new Map<string, any[]>();
    for (const color of colors) {
        const key = color.collection_slug || color.collection;
        if (!collectionMap.has(key)) {
            collectionMap.set(key, []);
        }
        collectionMap.get(key)!.push(color);
    }

    // Create collection-level products (shown in "Kolekcije" tab)
    const collectionProducts: Product[] = [];
    Array.from(collectionMap.entries()).forEach(([collSlug, collColors]) => {
        const first = collColors[0];
        const collName = first.collection_name || collSlug;
        const description = [
            normalizeText(first.collection_description_sr),
            normalizeText(first.collection_description_en),
            normalizeText(first.description),
            normalizeText(enrichProductDescription({ name: `BLOQ ${collName}`, categoryId: '4', brandId: '8', specs: [] } as any)),
        ].find(Boolean) || '';

        const imageUrl = selectPreferredCollectionHeroAsset(
            pickFirstKnownLocalPublicAsset(
                BLOQ_ROOMSHOT_LOCAL_ASSET_SET,
                `/images/products/bloq-roomshots/bloq-${collSlug}-roomshot.jpg`,
                `/images/products/bloq-roomshots/${collSlug}-roomshot.jpg`
            ),
            ...collColors.map((color) => color.image_url)
        );
        const collectionSpecs = mergeUniqueSpecs(
            buildSpecsFromCharacteristicRecord(
                {
                    Familija: first.parent_collection,
                    Format: first.format,
                    Dimenzije: first.dimension,
                    Podloga: Array.isArray(first.backing_variants) && first.backing_variants.length > 0
                        ? first.backing_variants.join(' / ')
                        : first.characteristics?.Podloga || first.specs?.BACKING,
                    'Klasa upotrebe': first.characteristics?.['Klasa upotrebe'] || first.specs?.CLASSIFICATION,
                    Vatrostojnost: first.characteristics?.Vatrostojnost || first.specs?.FIRE_RESISTANCE,
                },
                `BLOQ ${collName}`
            ),
            []
        );
        const documents = Array.isArray(first.documents) ? first.documents : [];

        collectionProducts.push({
            id: `bloq-coll-${collSlug}`,
            name: `BLOQ ${collName}`,
            slug: collSlug,
            sku: `BLOQ-${collSlug.toUpperCase()}`, // BLOQ- prefix so hasCollectionSku picks it up
            categoryId: '4',
            brandId: '8',
            shortDescription: `BLOQ ${collName} - ${collColors.length} boja u kolekciji ${first.parent_collection || 'BLOQ'}`,
            description,
            images: imageUrl ? [{
                id: `bloq-coll-${collSlug}-img`,
                url: imageUrl,
                alt: `BLOQ ${collName}`,
                isPrimary: true,
                order: 1,
            }] : [],
            specs: collectionSpecs,
            documents,
            externalLink: normalizeText(first.external_url) || 'https://bloq.nl/products',
            inStock: true,
            featured: false,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        });
    });

    // Create individual color products
    const colorProducts = colors.map((color: any) => {
        const specs = Object.entries(color.characteristics || {}).map(([label, value]) => ({
            key: label.toLowerCase().replace(/\s+/g, '_'),
            label,
            value: value as string
        }));

        if (color.parent_collection && !specs.find(s => s.key === 'family')) {
            specs.push({ key: 'family', label: 'Familija', value: color.parent_collection });
        }

        const images = [];
        if (color.image_url) {
            images.push({
                id: `${color.slug}-img-1`,
                url: color.image_url,
                alt: `${color.name}`,
                isPrimary: true,
                order: 1,
            });
        }

        const formattedName = formatProductName(color.full_name || color.name, color.code);

        return {
            id: color.slug,
            name: formattedName,
            slug: `${color.collection_slug || color.collection}?color=${color.slug}`,
            sku: color.code,
            categoryId: '4', // Tekstilne ploče
            brandId: '8', // BLOQ
            shortDescription: enrichShortDescription({ ...color, name: formattedName, categoryId: '4', brandId: '8', specs } as any),
            description: color.description || enrichProductDescription({ name: formattedName, categoryId: '4', brandId: '8', specs } as any),
            images: images.length > 0 ? images : [{
                id: `${color.slug}-img-1`,
                url: '/images/placeholder.svg',
                alt: formattedName,
                isPrimary: true,
                order: 1,
            }],
            specs,
            inStock: true,
            featured: false,
            externalLink: color.external_url || 'https://bloq.nl/products',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        };
    });

    bloqCarpetCache = [...collectionProducts, ...colorProducts];
    return bloqCarpetCache;
}



export function getAllGerflorProducts(): Product[] {
    return [...getAllLVTProducts(), ...getAllLinoleumProducts(), ...getAllCarpetProducts()];
}

let vinylCollectionCache: Product[] | null = null;

/**
 * Generate collection-level Product entries from vinyl_colors_complete.json.
 * These are used to show vinyl collections in the category listing
 * when they are NOT already in the Supabase database (e.g., newly added collections).
 */
export function getVinylCollectionProducts(): Product[] {
    if (vinylCollectionCache) return vinylCollectionCache;

    const collections = ((vinylColorsData as any)?.collections || []) as any[];

    // Collection lifestyle images (override color swatch images)
    const collectionImageOverrides: Record<string, string> = {
        'mipolam-evo': '/images/products/vinyl/mipolam-evo-collection.jpg',
        'taralay-libertex': '/images/products/vinyl/taralay-libertex-collection.jpg',
        'taralay-millenium-acoustic': '/images/products/vinyl/taralay-millenium-acoustic-order/collection.jpg',
    };

    const result = collections.map((col: any) => {
        const firstColor = col.colors?.[0];
        const slug = `gerflor-${col.slug}`;
        const characteristics = firstColor?.characteristics || {};
        const specs: Product['specs'] = Object.entries(characteristics).map(([label, value]) => ({
            key: label.toLowerCase().replace(/\s+/g, '_'),
            label,
            value: value as string,
        }));
        const localCollectionCover = GERFLOR_VINYL_COLLECTION_COVER_SLUGS.has(col.slug)
            ? `/images/products/vinyl/${col.slug}/collection.jpg`
            : undefined;

        const imageUrl = selectPreferredCollectionHeroAsset(
            collectionImageOverrides[col.slug],
            localCollectionCover,
            firstColor?.image
        );

        return {
            id: `vinyl-coll-${col.slug}`,
            name: col.name,
            slug,
            sku: `VINIL-${col.slug.toUpperCase()}`,
            categoryId: '2',
            brandId: '6',
            shortDescription: `${col.name} — ${col.colorCount} boja`,
            description: pickRichestText(
                col.description,
                ...((col.colors || []).map((color: any) => color.description))
            ),
            images: imageUrl ? [{
                id: `vinyl-coll-${col.slug}-img`,
                url: imageUrl,
                alt: col.name,
                isPrimary: true,
                order: 0,
            }] : [],
            specs,
            externalLink: col.url || firstColor?.href,
            inStock: true,
            featured: false,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        } as Product;
    });

    vinylCollectionCache = result;
    return result;
}

function buildTarkettVinylCollectionHeaders(
    collections: any[],
    skuPrefix: string,
    typeValue: 'Heterogeni' | 'Homogeni',
    fallbackDescriptionText?: string
): Product[] {
    return collections.map((collection: any) => {
        const fallbackDescription = typeValue === 'Homogeni'
            ? `${collection.name} Tarkett homogena vinil kolekcija.`
            : (fallbackDescriptionText || `${collection.name} Tarkett vinil kolekcija za kuću.`);
        const firstColor = collection.colors?.[0];
        const imageUrl = selectPreferredCollectionHeroAsset(
            collection.collection_image_url,
            firstColor?.image
        );
        const specs = buildSpecsFromCharacteristicRecord(collection.characteristics, collection.name);

        if (!specs.find((spec) => spec.key === 'type')) {
            specs.push({
                key: 'type',
                label: 'Tip',
                value: typeValue,
            });
        }

        const thicknessValue = collection.characteristics?.['Ukupna debljina'];
        if (thicknessValue && !specs.find((spec) => spec.key === 'thickness')) {
            specs.push({
                key: 'thickness',
                label: 'Ukupna debljina',
                value: String(thicknessValue),
            });
        }

        const formatValue = collection.characteristics?.Format;
        if (formatValue && !specs.find((spec) => spec.key === 'format')) {
            specs.push({
                key: 'format',
                label: 'Format',
                value: String(formatValue),
            });
        }

        return {
            id: `${skuPrefix.toLowerCase()}-${collection.slug}`,
            name: collection.name,
            slug: collection.slug,
            sku: `${skuPrefix}-${String(collection.slug).replace(/^tarkett-/, '').toUpperCase()}`,
            categoryId: '2',
            brandId: '3',
            shortDescription:
                collection.shortDescription ||
                `${collection.name} — ${collection.colorCount || collection.colors?.length || 0} dezena`,
            description:
                collection.description ||
                collection.shortDescription ||
                fallbackDescription,
            images: imageUrl ? [{
                id: `tarkett-vinyl-${collection.slug}-img`,
                url: imageUrl,
                alt: collection.name,
                isPrimary: true,
                order: 0,
            }] : [],
            specs,
            documents: Array.isArray(collection.documents) ? collection.documents : [],
            detailsSections: Array.isArray(collection.detailsSections) ? collection.detailsSections : undefined,
            externalLink: collection.url,
            inStock: true,
            featured: false,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        } as Product;
    });
}

export function getTarkettVinylHomeCollections(): Product[] {
    if (tarkettVinylHomeCollectionCache) {
        return tarkettVinylHomeCollectionCache;
    }

    const collections = (((tarkettVinylHomeData as any)?.collections || []) as any[]);

    tarkettVinylHomeCollectionCache = buildTarkettVinylCollectionHeaders(
        collections,
        'TARKETT-VINYL-HOME',
        'Heterogeni'
    );

    return tarkettVinylHomeCollectionCache;
}

export function getTarkettHomogeneousVinylCollections(): Product[] {
    if (tarkettHomogeneousVinylCollectionCache) {
        return tarkettHomogeneousVinylCollectionCache;
    }

    const collections = (((tarkettHomogeneousVinylData as any)?.collections || []) as any[]);

    tarkettHomogeneousVinylCollectionCache = buildTarkettVinylCollectionHeaders(
        collections,
        'TARKETT-VINYL-HOMOGENI',
        'Homogeni'
    );

    return tarkettHomogeneousVinylCollectionCache;
}

export function getTarkettHeterogeneousVinylCollections(): Product[] {
    if (tarkettHeterogeneousVinylCollectionCache) {
        return tarkettHeterogeneousVinylCollectionCache;
    }

    const collections = (((tarkettHeterogeneousVinylData as any)?.collections || []) as any[]);

    tarkettHeterogeneousVinylCollectionCache = buildTarkettVinylCollectionHeaders(
        collections,
        'TARKETT-VINYL-HETEROGENI',
        'Heterogeni',
        'Tarkett heterogeni vinil za zahtevne rezidencijalne i komercijalne prostore.'
    );

    return tarkettHeterogeneousVinylCollectionCache;
}

export function getWolflorVinylCollections(): Product[] {
    if (wolflorVinylCollectionCache) {
        return wolflorVinylCollectionCache;
    }

    const collections = (((wolflorVinylData as any)?.collections || []) as any[]);

    wolflorVinylCollectionCache = collections.map((collection: any) => {
        const firstColor = collection.colors?.[0];
        const imageUrl = selectPreferredCollectionHeroAsset(
            firstColor?.image,
            collection.collection_image_url
        );
        const specs = buildSpecsFromCharacteristicRecord(collection.characteristics, collection.name);
        const typeValue = normalizeText(collection.characteristics?.Tip) || 'Heterogeni';
        const thicknessValue = collection.characteristics?.['Ukupna debljina'];
        const formatValue = collection.characteristics?.Format;

        if (!specs.find((spec) => spec.key === 'type')) {
            specs.push({
                key: 'type',
                label: 'Tip',
                value: typeValue,
            });
        }

        if (thicknessValue && !specs.find((spec) => spec.key === 'thickness')) {
            specs.push({
                key: 'thickness',
                label: 'Ukupna debljina',
                value: String(thicknessValue),
            });
        }

        if (formatValue && !specs.find((spec) => spec.key === 'format')) {
            specs.push({
                key: 'format',
                label: 'Format',
                value: String(formatValue),
            });
        }

        return {
            id: `wolflor-vinyl-${collection.slug}`,
            name: collection.name,
            slug: collection.slug,
            sku: `WOLFLOR-VINYL-${String(collection.slug).replace(/^wolflor-/, '').toUpperCase()}`,
            categoryId: '2',
            brandId: '11',
            shortDescription:
                collection.shortDescription ||
                `${collection.name} — ${collection.colorCount || collection.colors?.length || 0} dekora`,
            description:
                collection.description ||
                collection.shortDescription ||
                `${collection.name} Wolflor vinil kolekcija.`,
            images: imageUrl ? [{
                id: `wolflor-vinyl-${collection.slug}-img`,
                url: imageUrl,
                alt: collection.name,
                isPrimary: true,
                order: 0,
            }] : [],
            specs,
            documents: Array.isArray(collection.documents) ? collection.documents : [],
            externalLink: collection.url || firstColor?.url,
            inStock: true,
            featured: false,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        } as Product;
    });

    return wolflorVinylCollectionCache;
}

/**
 * Get all TimberTech Deking products from tis_deking_products.json
 */
export function getAllDekingProducts(): Product[] {
    if (dekingProductsCache) {
        return dekingProductsCache;
    }

    const dekingList = (tisDekingProducts as any[]).map(p => {
        const slug = (p.name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Extract just the color name from the full product name
        // e.g. "EDGE ravan profil, Dark Teak 4880 x 136 x 24 mm" → "Dark Teak"
        const fullName = p.name as string;
        let colorName = fullName;
        // Remove everything before and including the comma+space
        const commaIdx = fullName.indexOf(',');
        if (commaIdx !== -1) {
            colorName = fullName.substring(commaIdx + 1).trim();
        } else {
            // Try after "profil " if no comma (e.g. "Edge Prime + ravan profil Coconut Husk 4880...")
            const profilMatch = fullName.match(/profil\s+(.+)/i);
            if (profilMatch) colorName = profilMatch[1].trim();
        }
        // Remove trailing dimensions (e.g. "4880 x 136 x 24 mm" or "4880 x 136 x 24mm")
        colorName = colorName.replace(/\s*\d{3,}\s*x\s*\d+\s*x\s*\d+\s*mm\s*$/i, '').trim();

        // Convert specs object back to array
        const specsArray: Array<{ key: string; label: string; value: string }> = [];
        if (p.specs) {
            for (const [key, value] of Object.entries(p.specs)) {
                specsArray.push({
                    key: key.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                    label: key,
                    value: value as string
                });
            }
        }
        // Force the collection spec as required by the site
        if (!specsArray.find(s => s.key === 'collection')) {
            specsArray.push({ key: 'collection', label: 'Kolekcija', value: p.collection || 'TimberTech' });
        }

        const images = p.images ? p.images : [];

        return {
            id: p.id,
            name: colorName,
            slug: slug,
            sku: p.specs['Šifra artikla'] || `TIMBERTECH-${p.id}`,
            categoryId: p.categoryId || '5', // 5 is Deking
            brandId: p.brandId || '10',
            shortDescription: p.description || p.name,
            description: p.description || enrichProductDescription({ name: p.name, categoryId: '5', brandId: '10', specs: specsArray } as any),
            images: images,
            specs: specsArray,
            detailsSections: undefined,
            price: 0,
            priceUnit: 'm²' as const,
            inStock: true,
            featured: false,
            externalLink: p.url || undefined,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
        } as Product;
    });



    dekingProductsCache = dekingList;
    return dekingProductsCache;
}

export function getAlpodCollectionProducts(categoryId?: string): Product[] {
    if (!alpodCollectionProductsCache) {
        alpodCollectionProductsCache = getAlpodRawCollections()
            .map((collection, index) => transformAlpodCollectionProduct(collection, index));
    }

    return categoryId
        ? alpodCollectionProductsCache.filter((product) => product.categoryId === categoryId)
        : alpodCollectionProductsCache;
}

export function getAlpodVariantProducts(categoryId?: string): Array<Product & { collectionSlug?: string }> {
    if (!alpodVariantProductsCache) {
        alpodVariantProductsCache = getAlpodRawCollections()
            .flatMap((collection) =>
                (((collection.colors || []) as Record<string, any>[]).map((color, index) =>
                    transformAlpodVariantProduct(color, collection, index)
                ))
            );
    }

    return categoryId
        ? alpodVariantProductsCache.filter((product) => product.categoryId === categoryId)
        : alpodVariantProductsCache;
}

export function getAllAlpodProducts(): Array<Product & { collectionSlug?: string }> {
    if (!alpodProductsCache) {
        alpodProductsCache = [
            ...getAlpodCollectionProducts(),
            ...getAlpodVariantProducts(),
        ];
    }

    return alpodProductsCache;
}

export function getAllTechemProducts(): Product[] {
    const techemDataset = loadTechemDataset();
    if (techemDataset.entries.length === 0) {
        return [];
    }

    if (techemProductsCache) {
        return techemProductsCache;
    }

    const products = techemDataset.entries
        .map((product: Record<string, any>, index: number) =>
            transformTechemProduct(product, index, techemDataset.generatedAt)
        )
        .filter((product): product is Product => Boolean(product));

    const seenSlugs = new Set<string>();
    const uniqueProducts = products.filter((product: Product) => {
        if (!product.slug || seenSlugs.has(product.slug)) {
            return false;
        }

        seenSlugs.add(product.slug);
        return true;
    });

    techemProductsCache = uniqueProducts;

    return techemProductsCache;
}

export function getAllRomusToolProducts(): Product[] {
    const romusDataset = loadRomusToolsDataset();
    if (romusDataset.entries.length === 0) {
        return [];
    }

    if (romusToolProductsCache) {
        return romusToolProductsCache;
    }

    const products = romusDataset.entries
        .map((product: Record<string, any>, index: number) =>
            transformRomusToolProduct(product, index, romusDataset.generatedAt)
        )
        .filter((product): product is Product => Boolean(product));

    const seenSlugs = new Set<string>();
    const uniqueProducts = products.filter((product: Product) => {
        if (!product.slug || seenSlugs.has(product.slug)) {
            return false;
        }

        seenSlugs.add(product.slug);
        return true;
    });

    romusToolProductsCache = uniqueProducts.sort((a, b) => {
        const aHasPrice = (a.price || 0) > 0;
        const bHasPrice = (b.price || 0) > 0;

        if (aHasPrice !== bHasPrice) {
            return aHasPrice ? -1 : 1;
        }

        return 0;
    });

    return romusToolProductsCache;
}

export function getTechemDatasetGeneratedAt(): Date | null {
    return loadTechemDataset().generatedAt;
}

/**
 * Generate collection-level Product entries from esd_colors.json.
 * These are used to show ESD collections in the Elektroprovodni category listing.
 */
export function getEsdCollectionProducts(): Product[] {
    if (esdCollectionCache) return esdCollectionCache;

    const collections = ((esdColorsData as any)?.collections || []) as any[];

    // Collection lifestyle images (override color swatch images with room scenes from Gerflor CDN/local overriding)
    const collectionImageOverrides: Record<string, string> = {
        'mipolam-el5': '/images/esd/mipolam-el5-lifestyle.jpg', // New cleanroom scene (33627)
        'gti-el5-connect': '/images/esd/gti-el5-connect-alt.jpg', // New scene (14530)
        'gti-el5-cleantech': '/images/esd/gti-el5-cleantech-alt.jpg', // New scene (14531)
        'mipolam-biocontrol-el5': '/images/esd/mipolam-biocontrol-el5-alt.jpg', // New scene (31395)
        'mipolam-technic-el5-eu': 'https://cdn.gerflor.com/media/1642426083/1/14621.jpg',
        'mipolam-robust-el7': 'https://cdn.gerflor.com/media/1642426083/1/14895.jpg',
        'mipolam-el7': 'https://cdn.gerflor.com/media/1642426083/1/34841.jpg',
    };

    const result = collections.map((col: any) => {
        const firstColor = col.colors?.[0];
        const slug = `gerflor-${col.slug}`;
        const characteristics = firstColor?.characteristics || {};
        const specs: Product['specs'] = Object.entries(characteristics).map(([label, value]) => ({
            key: label.toLowerCase().replace(/\s+/g, '_'),
            label,
            value: value as string,
        }));
        // Add collection spec
        specs.unshift({ key: 'collection', label: 'Kolekcija', value: col.name });

        const imageUrl = selectPreferredCollectionHeroAsset(
            collectionImageOverrides[col.slug],
            firstColor?.image
        );

        return {
            id: `esd-coll-${col.slug}`,
            name: col.name,
            slug,
            sku: `ESD-${col.slug.toUpperCase()}`,
            categoryId: '8',
            brandId: '6',
            shortDescription: `${col.name} — ${col.colorCount} boja`,
            description: buildDescriptionFromCharacteristics(
                pickRichestText(
                    col.description,
                    ...((col.colors || []).map((color: any) => color.description))
                ),
                col.characteristics,
                { prefix: 'Projektovan za ESD osetljive prostore, laboratorije, server sobe i tehničke zone sa kontrolom statičkog elektriciteta.' }
            ),
            images: imageUrl ? [{
                id: `esd-coll-${col.slug}-img`,
                url: imageUrl,
                alt: col.name,
                isPrimary: true,
                order: 0,
            }] : [],
            specs,
            externalLink: col.url || firstColor?.href,
            inStock: true,
            featured: false,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        } as Product;
    });

    esdCollectionCache = result;
    return result;
}

/**
 * Generate collection-level Product entries from tarkett_sport_colors.json.
 * These are used to show Tarkett sport collections in the Sport category listing.
 */
export function getTarkettSportCollections(): Product[] {
    if (tarkettSportCollectionCache) {
        return tarkettSportCollectionCache;
    }

    const collections = (((tarkettSportData as any)?.collections || []) as any[]);

    tarkettSportCollectionCache = collections.map((collection: any) => {
        const firstColor = collection.colors?.[0];
        const imageUrl = selectPreferredCollectionHeroAsset(
            collection.collection_image_url,
            firstColor?.image
        );
        const specs = buildSpecsFromCharacteristicRecord(collection.characteristics, collection.name);

        return {
            id: `tarkett-sport-${collection.slug}`,
            name: collection.name,
            slug: collection.slug,
            sku: `TARKETT-SPORT-${String(collection.slug).replace(/^tarkett-/, '').toUpperCase()}`,
            categoryId: '10',
            brandId: '3',
            shortDescription:
                collection.shortDescription ||
                `${collection.name} — ${collection.colorCount || collection.colors?.length || 0} dezena`,
            description:
                collection.description ||
                collection.shortDescription ||
                `${collection.name} sportska kolekcija.`,
            images: imageUrl ? [{
                id: `tarkett-sport-${collection.slug}-img`,
                url: imageUrl,
                alt: collection.name,
                isPrimary: true,
                order: 0,
            }] : [],
            specs,
            documents: Array.isArray(collection.documents) ? collection.documents : [],
            detailsSections: Array.isArray(collection.detailsSections) ? collection.detailsSections : undefined,
            externalLink: collection.url,
            inStock: true,
            featured: false,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        } as Product;
    });

    return tarkettSportCollectionCache;
}

export function getTarkettLajsneCollections(): Product[] {
    if (tarkettLajsneCollectionCache) {
        return tarkettLajsneCollectionCache;
    }

    const collections = (((tarkettLajsneData as any)?.collections || []) as any[]);

    tarkettLajsneCollectionCache = collections.map((collection: any) => {
        const firstVariant = collection.colors?.[0];
        const imageUrl = selectPreferredCollectionHeroAsset(
            collection.collection_image_url,
            firstVariant?.image
        );
        const specs = buildSpecsFromCharacteristicRecord(collection.characteristics, collection.name);
        const productType = normalizeText(collection.characteristics?.['Tip proizvoda']);

        if (productType && !specs.find((spec) => spec.key === 'type')) {
            specs.push({
                key: 'type',
                label: 'Tip proizvoda',
                value: productType,
            });
        }

        return {
            id: `tarkett-lajsne-${collection.slug}`,
            name: collection.name,
            slug: collection.slug,
            sku: `TARKETT-LAJSNE-${String(collection.slug).replace(/^tarkett-/, '').toUpperCase()}`,
            categoryId: '11',
            brandId: '3',
            shortDescription:
                collection.shortDescription ||
                `${collection.name} — ${collection.colorCount || collection.colors?.length || 0} varijanti`,
            description:
                collection.description ||
                collection.shortDescription ||
                `${collection.name} Tarkett kolekcija lajsni i pribora.`,
            images: imageUrl ? [{
                id: `tarkett-lajsne-${collection.slug}-img`,
                url: imageUrl,
                alt: collection.name,
                isPrimary: true,
                order: 0,
            }] : [],
            specs,
            documents: Array.isArray(collection.documents) ? collection.documents : [],
            detailsSections: Array.isArray(collection.detailsSections) ? collection.detailsSections : undefined,
            externalLink: collection.url,
            inStock: true,
            featured: false,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        } as Product;
    });

    return tarkettLajsneCollectionCache;
}
