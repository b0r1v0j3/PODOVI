// Sastavlja "skelet" kataloga za /cenovnik: brend -> kolekcije (sa brojem boja).
// Same boje se NE šalju klijentu odjednom (može ih biti na hiljade) — učitavaju se
// lenjo, po kolekciji, preko postojeće /api/colors rute kad Tatjana otvori kolekciju.

import { getColorsForCategory } from '@/lib/colors/get-colors';
import { categories, brands } from '@/lib/data/mock-data';

export interface CenovnikCollection {
    slug: string;
    name: string;
    categorySlug: string;
    categoryName: string;
    brandId: string;
    colorCount: number;
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
}

async function collectionsForCategory(categorySlug: string, categoryName: string): Promise<RawCollection[]> {
    const { status, body } = await getColorsForCategory(categorySlug);
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

export async function loadPriceEntryTree(): Promise<CenovnikTree> {
    const perCategory = await Promise.all(
        categories.map((category) => collectionsForCategory(category.slug, category.name))
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
