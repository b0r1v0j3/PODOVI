import { Product } from '@/types';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';
import carpetColorsData from '@/public/data/carpet_tiles_complete.json';

// Cache for performance
let lvtProductsCache: Product[] | null = null;
let linoleumProductsCache: Product[] | null = null;
let carpetProductsCache: Product[] | null = null;

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

    // Note: linoleum_colors_complete.json structure might differ
    // Adjust based on actual structure
    const data = (linoleumColorsData as any).products || (linoleumColorsData as any).colors || [];
    const products = data.map(transformLinoleumToProduct);
    linoleumProductsCache = products;

    return products;
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

        return {
            id: color.slug,
            name: color.full_name || color.name,
            slug: color.slug,
            sku: color.code,
            categoryId: '4', // Tekstilne ploče
            brandId: '6', // Gerflor
            shortDescription: `Gerflor ${color.collection_name} - ${color.name}`,
            description: color.description,
            images: [
                {
                    id: `${color.slug}-img-1`,
                    url: color.image_url || '/images/placeholder.svg',
                    alt: color.name,
                    isPrimary: true,
                    order: 1,
                },
            ],
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
 * Get all Gerflor products (LVT + Linoleum + Carpet)
 */
export function getAllGerflorProducts(): Product[] {
    return [...getAllLVTProducts(), ...getAllLinoleumProducts(), ...getAllCarpetProducts()];
}

/**
 * Get a specific product by slug
 */
export function getProductBySlug(slug: string): Product | undefined {
    return getAllGerflorProducts().find(p => p.slug === slug || p.id === slug);
}

/**
 * Get products by collection
 */
export function getProductsByCollection(collection: string): Product[] {
    return getAllLVTProducts().filter(p => {
        const collectionSpec = p.specs?.find(s => s.key === 'collection');
        return collectionSpec?.value === collection;
    });
}

/**
 * Get products by category
 */
export function getProductsByCategory(categoryId: string): Product[] {
    if (categoryId === '6') {
        return getAllLVTProducts();
    } else if (categoryId === '7') {
        return getAllLinoleumProducts();
    } else if (categoryId === '4') {
        return getAllCarpetProducts();
    }
    return getAllGerflorProducts().filter(p => p.categoryId === categoryId);
}
