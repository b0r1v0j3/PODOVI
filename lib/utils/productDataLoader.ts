import { Product } from '@/types';
import { formatLvtSpecs } from '@/lib/product-page/spec-helpers';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';
import carpetColorsData from '@/public/data/carpet_tiles_complete.json';
import bloqCarpetData from '@/public/data/bloq_carpet_tiles.json';
import tarkettLvtData from '@/public/data/tarkett_lvt_products.json';

let tarkettLvtCache: Product[] | null = null;
let lvtProductsCache: Product[] | null = null;
let linoleumProductsCache: Product[] | null = null;
let carpetProductsCache: Product[] | null = null;
let bloqCarpetCache: Product[] | null = null;

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

        // Clean up the name
        // Clean up the name
        let cleanName = p.name || '';
        // Remove known technical prefixes like "Ess30-", "iD 30-", etc.
        cleanName = cleanName.replace(/^(Ess\d+-|iD\s*\d+-|Tarkett\s*)/i, '');
        // Remove technical suffixes like "-0v"
        cleanName = cleanName.replace(/-0v$/i, '');
        // Remove dimensions like "33,3x66,6" or "50x50" or "1200x200mm"
        cleanName = cleanName.replace(/\d+([.,]\d+)?\s*x\s*\d+([.,]\d+)?\s*(mm)?/gi, '');
        // Remove trailing hyphens or spaces
        cleanName = cleanName.replace(/[-–]\s*$/g, '').trim();
        // Replace remaining hyphens with spaces (e.g. "Cement-Grey" -> "Cement Grey")
        cleanName = cleanName.replace(/-/g, ' ');

        // Standardize capitalization (Title Case)
        cleanName = cleanName.toLowerCase().replace(/(?:^|\s)\S/g, function (a: string) { return a.toUpperCase(); });

        // Remove multiple spaces
        cleanName = cleanName.replace(/\s+/g, ' ').trim();

        // Map documents from meta
        const documents = (p.meta?.documents || []).map((docUrl: string) => {
            const fileName = docUrl.split('/').pop() || 'Dokument';
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
                url: docUrl,
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
        // Find the first product that has images to use as the collection representative
        const productWithImage = items.find(i => i.images && i.images.length > 0) || items[0];
        const primaryImage = productWithImage.images?.find(img => img.isPrimary) || productWithImage.images?.[0];

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

        // Extract key specs from the first product to populate the collection specs
        const keySpecs = ['total_thickness', 'wear_layer_thickness', 'classification_commercial_iso_10874', 'classification_domestic_iso_10874', 'total_weight', 'surface_treatment'];
        const additionalSpecs = (first.specs || []).filter(s => keySpecs.includes(s.key) || s.key === 'collection');

        return {
            id: `tarkett-${collKey}`,
            name: `Tarkett ${displayName}`,
            slug: `tarkett-${collKey}`,
            sku: `TARKETT-${collKey.toUpperCase()}`,
            categoryId: '6',
            brandId: '3',
            shortDescription: `Tarkett ${displayName} – ${items.length} dizajna`,
            description: first.description || `Tarkett ${displayName} LVT kolekcija`,
            images: primaryImage ? [primaryImage] : [],
            specs: additionalSpecs.length > 0 ? additionalSpecs : [{ key: 'collection', label: 'Kolekcija', value: displayName }],
            documents: documents, // Include documents
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
    const allProducts = [...getAllGerflorProducts(), ...getAllBloqCarpetProducts(), ...getAllTarkettLVTProducts(), ...getTarkettLVTCollections()];
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
        return [...getAllLVTProducts(), ...getAllTarkettLVTProducts()];
    } else if (categoryId === '7') {
        return getAllLinoleumProducts();
    } else if (categoryId === '4') {
        return [...getAllCarpetProducts(), ...getAllBloqCarpetProducts()];
    }

    return [...getAllGerflorProducts(), ...getAllBloqCarpetProducts(), ...getAllTarkettLVTProducts()].filter(p => p.categoryId === categoryId);
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

    // Add basic color info
    specs.push({ key: 'collection', label: 'Kolekcija', value: collection });
    specs.push({ key: 'code', label: 'Šifra', value: code });
    specs.push({ key: 'color', label: 'Boja', value: name });

    return {
        id: slug,
        name: `${code} ${name}`,
        slug,
        sku: code,
        categoryId: '6', // LVT
        brandId: '6', // Gerflor
        shortDescription: `Gerflor ${collection.replace('-', ' ').toUpperCase()} - ${name}`,
        description: color.description || `Gerflor ${collection} - ${name} (Šifra: ${code})`,
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

    return {
        id: slug,
        name,
        slug,
        sku: `LINOLEUM-${String(index + 1).padStart(2, '0')}`,
        categoryId: '7', // Linoleum
        brandId: '6', // Gerflor
        shortDescription: product.shortDescription || product.description || name,
        description: product.description || name,
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

        return {
            id: color.slug,
            name: color.full_name || color.name,
            // Use collection slug + color parameter for routing
            slug: `${color.collection_slug || color.collection}?color=${color.slug}`,
            sku: color.code,
            categoryId: '4', // Tekstilne ploče
            brandId: '6', // Gerflor
            shortDescription: `Gerflor ${color.collection_name} - ${color.name}`,
            description: color.description,
            images: images.length > 0 ? images : [{
                id: `${color.slug}-img-1`,
                url: '/images/placeholder.svg',
                alt: color.name,
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
        const description = first.description || '';

        // Use downloaded roomshot image as collection hero image
        const imageUrl = `/images/products/bloq-roomshots/${collSlug}-roomshot.jpg`;

        collectionProducts.push({
            id: `bloq-coll-${collSlug}`,
            name: `BLOQ ${collName}`,
            slug: collSlug,
            sku: `BLOQ-${collSlug.toUpperCase()}`, // BLOQ- prefix so hasCollectionSku picks it up
            categoryId: '4',
            brandId: '8',
            shortDescription: `BLOQ ${collName} - ${collColors.length} boja`,
            description,
            images: imageUrl ? [{
                id: `bloq-coll-${collSlug}-img`,
                url: imageUrl,
                alt: `BLOQ ${collName}`,
                isPrimary: true,
                order: 1,
            }] : [],
            specs: [],
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

        return {
            id: color.slug,
            name: color.full_name || color.name,
            slug: `${color.collection_slug || color.collection}?color=${color.slug}`,
            sku: color.code,
            categoryId: '4', // Tekstilne ploče
            brandId: '8', // BLOQ
            shortDescription: `BLOQ ${color.collection_name} - ${color.name}`,
            description: color.description,
            images: images.length > 0 ? images : [{
                id: `${color.slug}-img-1`,
                url: '/images/placeholder.svg',
                alt: color.name,
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



/**
 * Get all Gerflor products (LVT + Linoleum + Carpet + Vinyl)
 */
export function getAllGerflorProducts(): Product[] {
    return [...getAllLVTProducts(), ...getAllLinoleumProducts(), ...getAllCarpetProducts()];
}


