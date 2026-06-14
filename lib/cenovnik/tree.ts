// Sastavlja "skelet" kataloga za /cenovnik: brend -> kolekcije (sa brojem boja).
// Same boje se NE šalju klijentu odjednom (može ih biti na hiljade) — učitavaju se
// lenjo, po kolekciji, preko postojeće /api/colors rute kad Tatjana otvori kolekciju.

import { getColorsForCategory } from '@/lib/colors/get-colors';
import { categories, brands } from '@/lib/data/mock-data';
import { getProductsByCategory } from '@/lib/utils/productDataLoader';

export interface CenovnikCollection {
    slug: string;
    name: string;
    categorySlug: string;
    categoryName: string;
    brandId: string;
    colorCount: number;
    existingPrice?: number;
}

export interface CenovnikBrandGroup {
    brandId: string;
    brandName: string;
    collections: CenovnikCollection[];
}

export interface CenovnikTree {
    brands: CenovnikBrandGroup[];
    totalCollections: number;
    totalColors: number;
    generatedAt: string;
}

function brandNameFor(brandId: string): string {
    return brands.find((b) => b.id === brandId)?.name || 'Ostali brendovi';
}

interface RawCollection {
    slug: string;
    name: string;
    categorySlug: string;
    categoryName: string;
    brandId: string;
    colorCount: number;
    existingPrice?: number;
}

async function collectionsForCategory(categorySlug: string, categoryName: string): Promise<RawCollection[]> {
    let status: number;
    let body: any;
    try {
        ({ status, body } = await getColorsForCategory(categorySlug));
    } catch {
        return []; // poslednja brana: bilo kakav pad get-colors ne ruši celo /cenovnik stablo
    }
    if (status !== 200 || !body) return [];

    // Nested format: { collections: [{ slug, name, colors: [...], colorCount }] }
    if (Array.isArray(body.collections)) {
        return (body.collections as any[])
            .filter((c) => c && c.slug)
            .map((c) => ({
                slug: String(c.slug),
                name: String(c.name || c.slug),
                categorySlug,
                categoryName,
                brandId: String((c.colors?.[0]?.brandId) || '6'),
                colorCount: Number(c.colorCount ?? (c.colors?.length || 0)),
            }));
    }

    // Flat format: { colors: [{ collection, collection_name, brandId, ... }] }
    if (Array.isArray(body.colors)) {
        const grouped = new Map<string, RawCollection>();
        for (const color of body.colors as any[]) {
            const slug = color.collection;
            if (!slug) continue;
            const existing = grouped.get(slug);
            if (existing) {
                existing.colorCount += 1;
            } else {
                grouped.set(slug, {
                    slug: String(slug),
                    name: String(color.collection_name || slug),
                    categorySlug,
                    categoryName,
                    brandId: String(color.brandId || '6'),
                    colorCount: 1,
                });
            }
        }
        return Array.from(grouped.values());
    }

    return [];
}

// Catalog-derived sloj: proizvodi iz kataloga koji nisu već u stablu (po slug-u) i nisu
// po-boja rute (slug sa "?"). Svaki ulazi kao red bez boja (colorCount 0) pod svojim brendom.
// existingPrice = product.price (SA PDV-om, popunjeno samo gde katalog ima cenu, npr. Romus).
function flatProductsForCategory(
    category: { id: string; slug: string; name: string },
    existingSlugs: Set<string>,
): RawCollection[] {
    let products: any[] = [];
    try {
        products = getProductsByCategory(category.id) || [];
    } catch {
        return [];
    }
    const seen = new Set(existingSlugs);
    const out: RawCollection[] = [];
    for (const p of products) {
        const slug = String(p?.slug || '');
        if (!slug || slug.includes('?')) continue; // preskoči prazno i po-boja rute
        if (seen.has(slug)) continue;              // već u stablu (kolekcija-header / dr. izvor)
        seen.add(slug);
        const price = typeof p?.price === 'number' && p.price > 0 ? p.price : undefined;
        out.push({
            slug,
            name: String(p?.name || slug),
            categorySlug: category.slug,
            categoryName: category.name,
            brandId: String(p?.brandId || '6'),
            colorCount: 0,
            existingPrice: price,
        });
    }
    return out;
}

export async function loadPriceEntryTree(): Promise<CenovnikTree> {
    const perCategory = await Promise.all(
        categories.map(async (category) => {
            const fromColors = await collectionsForCategory(category.slug, category.name);
            const existingSlugs = new Set(fromColors.map((c) => c.slug));
            const fromCatalog = flatProductsForCategory(
                { id: category.id, slug: category.slug, name: category.name },
                existingSlugs,
            );
            return [...fromColors, ...fromCatalog];
        })
    );

    const allCollections = perCategory.flat();

    // Grupiši po brendu
    const byBrand = new Map<string, CenovnikBrandGroup>();
    let totalColors = 0;

    for (const collection of allCollections) {
        totalColors += collection.colorCount;
        const group = byBrand.get(collection.brandId);
        const item: CenovnikCollection = {
            slug: collection.slug,
            name: collection.name,
            categorySlug: collection.categorySlug,
            categoryName: collection.categoryName,
            brandId: collection.brandId,
            colorCount: collection.colorCount,
            existingPrice: collection.existingPrice,
        };
        if (group) {
            group.collections.push(item);
        } else {
            byBrand.set(collection.brandId, {
                brandId: collection.brandId,
                brandName: brandNameFor(collection.brandId),
                collections: [item],
            });
        }
    }

    const brandGroups = Array.from(byBrand.values())
        .map((group) => ({
            ...group,
            collections: group.collections.sort((a, b) =>
                a.categoryName.localeCompare(b.categoryName, 'sr') || a.name.localeCompare(b.name, 'sr')
            ),
        }))
        .sort((a, b) => a.brandName.localeCompare(b.brandName, 'sr'));

    return {
        brands: brandGroups,
        totalCollections: allCollections.length,
        totalColors,
        generatedAt: new Date().toISOString(),
    };
}
