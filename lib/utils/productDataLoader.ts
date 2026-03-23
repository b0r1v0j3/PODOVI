import { Product } from '@/types';
import { formatLvtSpecs } from '@/lib/product-page/spec-helpers';
import { enrichProductDescription, enrichShortDescription } from '@/lib/utils/description-enricher';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';
import carpetColorsData from '@/public/data/carpet_tiles_complete.json';
import bloqCarpetData from '@/public/data/bloq_carpet_tiles.json';
import tarkettLvtData from '@/public/data/tarkett_lvt_products.json';
import tarkettCollectionSpecsData from '@/public/data/tarkett_collection_specs.json';
import tarkettCollectionDetails from '@/public/data/tarkett_collection_details.json';
import tarkettSportData from '@/public/data/tarkett_sport_colors.json';
import tarkettVinylHomeData from '@/public/data/tarkett_vinyl_home_colors.json';
import tarkettHomogeneousVinylData from '@/public/data/tarkett_homogeneous_vinyl_colors.json';
import tarkettHeterogeneousVinylData from '@/public/data/tarkett_heterogeneous_vinyl_colors.json';
import wolflorVinylData from '@/public/data/wolflor_vinyl_colors.json';
import tisDekingProducts from '@/public/data/tis_deking_products.json';
import { getManualCollectionProducts } from '@/lib/data/manual-collection-products';

let tarkettLvtCache: Product[] | null = null;
let lvtProductsCache: Product[] | null = null;
let linoleumProductsCache: Product[] | null = null;
let carpetProductsCache: Product[] | null = null;
let bloqCarpetCache: Product[] | null = null;
let dekingProductsCache: Product[] | null = null;
let esdCollectionCache: Product[] | null = null;
let tarkettSportCollectionCache: Product[] | null = null;
let tarkettVinylHomeCollectionCache: Product[] | null = null;
let tarkettHomogeneousVinylCollectionCache: Product[] | null = null;
let tarkettHeterogeneousVinylCollectionCache: Product[] | null = null;
let wolflorVinylCollectionCache: Product[] | null = null;
let gerflorLvtCollectionCache: Product[] | null = null;
let gerflorLinoleumCollectionCache: Product[] | null = null;

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

        // Use locally downloaded collection image
        const localImagePath = `/images/tarkett/collections/${collKey}.jpg`;
        const collectionImage = {
            id: `tarkett-${collKey}-cover`,
            url: localImagePath,
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
        ...getAllBloqCarpetProducts(),
        ...getAllTarkettLVTProducts(),
        ...getTarkettLVTCollections(),
        ...getTarkettVinylHomeCollections(),
        ...getTarkettHeterogeneousVinylCollections(),
        ...getTarkettHomogeneousVinylCollections(),
        ...getWolflorVinylCollections(),
        ...getTarkettSportCollections(),
        ...getAllDekingProducts(),
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
            ...getManualCollectionProducts().filter((product) => product.categoryId === '2'),
        ];
    } else if (categoryId === '10') {
        return [
            ...getManualCollectionProducts().filter((product) => product.categoryId === '10'),
            ...getTarkettSportCollections(),
        ];
    } else if (categoryId === '7') {
        return [...getGerflorLinoleumCollections(), ...getAllLinoleumProducts()];
    } else if (categoryId === '4') {
        return [...getAllCarpetProducts(), ...getAllBloqCarpetProducts()];
    } else if (categoryId === '5') {
        return getAllDekingProducts();
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
        const imageUrl = pickRichestText(
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
        const imageUrl = pickRichestText(...collectionColors.map((color) => color.image_url));
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

        // Use downloaded roomshot image as collection hero image
        const imageUrl = `/images/products/bloq-roomshots/${collSlug}-roomshot.jpg`;
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

    const vinylData = require('@/public/data/vinyl_colors_complete.json');
    const collections = vinylData?.collections || [];

    // Collection lifestyle images (override color swatch images)
    const collectionImageOverrides: Record<string, string> = {
        'mipolam-evo': '/images/products/vinyl/mipolam-evo-collection.jpg',
        'taralay-libertex': '/images/products/vinyl/taralay-libertex-collection.jpg',
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

        const imageUrl = collectionImageOverrides[col.slug] || firstColor?.image || '';

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
        const imageUrl = collection.collection_image_url || firstColor?.image || '';
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
        const imageUrl = firstColor?.image || collection.collection_image_url || '';
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
            sku: p.specs['Šifra artikla'] || p.id,
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

/**
 * Generate collection-level Product entries from esd_colors.json.
 * These are used to show ESD collections in the Elektroprovodni category listing.
 */
export function getEsdCollectionProducts(): Product[] {
    if (esdCollectionCache) return esdCollectionCache;

    const esdData = require('@/public/data/esd_colors.json');
    const collections = esdData?.collections || [];

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

        const imageUrl = collectionImageOverrides[col.slug] || firstColor?.image || '';

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
        const imageUrl = collection.collection_image_url || firstColor?.image || '';
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
