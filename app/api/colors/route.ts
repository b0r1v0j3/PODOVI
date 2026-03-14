import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import tarkettLvtData from '@/public/data/tarkett_lvt_products.json';
import vinylColorsData from '@/public/data/vinyl_colors_complete.json';
import vinylSpecialColorsData from '@/public/data/vinyl_special_colors.json';
import esdColorsData from '@/public/data/esd_colors.json';
import industrialColorsData from '@/public/data/industrial_colors.json';
import sportColorsData from '@/public/data/sport_colors.json';

/**
 * GET /api/colors?category=lvt|linoleum|vinil|tekstilne-ploce|elektroprovodni|industrijske-ploce|sport
 *
 * - Nested format: vinil, elektroprovodni, industrijske-ploce, sport
 * - Flat format: lvt, linoleum, tekstilne-ploce
 */

type TarkettProduct = {
    id: string;
    name: string;
    description?: string;
    images?: string[];
    specs?: any;
    brandId?: string;
    collection: string;
};

type ColorRow = {
    collection_slug: string | null;
    collection_name: string | null;
    code: string | null;
    name: string | null;
    full_name?: string | null;
    slug?: string | null;
    image_url: string | null;
    texture_url?: string | null;
    image_count?: number | null;
    lifestyle_url?: string | null;
    welding_rod?: string | null;
    dimension?: string | null;
    format?: string | null;
    overall_thickness?: string | null;
    description?: string | null;
    specs?: any;
    collection_specs?: any;
    characteristics?: Record<string, string> | null;
};

function buildNestedCollectionsResponse(sourceCollections: any[], requestedCollection?: string | null) {
    const collections = sourceCollections
        .filter((collection) => !requestedCollection || collection.slug === requestedCollection)
        .map((collection) => ({
            slug: collection.slug,
            name: collection.name,
            description: collection.description || '',
            characteristics: collection.characteristics || {},
            colorCount: collection.colorCount || (collection.colors || []).length,
            colors: (collection.colors || []).map((color: any) => ({
                ...color,
                collection_slug: collection.slug,
                collection_name: collection.name,
                image: color.image || color.image_url || '',
                image_url: color.image || color.image_url || '',
                description: color.description || collection.description || '',
                characteristics: {
                    ...(collection.characteristics || {}),
                    ...(color.characteristics || {}),
                },
                format: color.format || collection.characteristics?.Format,
                dimension: color.dimension || collection.characteristics?.Dimenzije,
                overall_thickness: color.overall_thickness || collection.characteristics?.['Ukupna debljina'],
            })),
        }));

    return NextResponse.json({
        collections,
        totalColors: collections.reduce((sum, collection) => sum + collection.colors.length, 0),
        generatedAt: new Date().toISOString(),
    });
}

export async function GET(request: NextRequest) {
    const category = request.nextUrl.searchParams.get('category') || 'lvt';
    const requestedCollection = request.nextUrl.searchParams.get('collection');

    const nestedCollectionsMap: Record<string, any[]> = {
        vinil: [
            ...(((vinylColorsData as any)?.collections || []) as any[]),
            ...(((vinylSpecialColorsData as any)?.collections || []) as any[]),
        ],
        elektroprovodni: ((esdColorsData as any)?.collections || []) as any[],
        'industrijske-ploce': ((industrialColorsData as any)?.collections || []) as any[],
        sport: ((sportColorsData as any)?.collections || []) as any[],
    };

    if (category in nestedCollectionsMap) {
        return buildNestedCollectionsResponse(nestedCollectionsMap[category], requestedCollection);
    }

    try {
        let query = supabase
            .from('colors')
            .select('*')
            .eq('category_slug', category);

        if (requestedCollection) {
            query = query.eq('collection_slug', requestedCollection);
        }

        const { data, error } = await query.order('collection_slug').order('code');

        if (error) {
            console.error('Colors API error:', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        let flatColors = ((data || []) as ColorRow[]).map((color) => ({
            collection: color.collection_slug,
            collection_name: color.collection_name,
            code: color.code,
            name: color.name,
            full_name: color.full_name,
            slug: color.slug,
            image_url: color.image_url,
            texture_url: color.texture_url,
            image_count: color.image_count || 0,
            lifestyle_url: color.lifestyle_url,
            welding_rod: color.welding_rod,
            dimension: color.dimension,
            format: color.format,
            overall_thickness: color.overall_thickness,
            description: color.description,
            specs: color.specs,
            collection_specs: color.collection_specs,
            characteristics: color.characteristics,
            brandId: '6',
        }));

        if (category === 'lvt') {
            const tarkettColors = (tarkettLvtData as TarkettProduct[]).map((product) => {
                const imageUrl = product.images?.[0] || '';
                const cleanName = (product.name || '')
                    .replace(/^(Ess\d+-|iD\s*\d+-|Tarkett\s*)/i, '')
                    .replace(/-0v$/i, '')
                    .trim();

                return {
                    collection: product.collection,
                    collection_name: product.collection,
                    code: product.id,
                    name: cleanName,
                    full_name: product.name,
                    slug: product.id,
                    image_url: imageUrl,
                    texture_url: imageUrl,
                    image_count: product.images?.length || 0,
                    lifestyle_url: null,
                    welding_rod: null,
                    dimension: null,
                    format: null,
                    overall_thickness: product.specs?.total_thickness || null,
                    description: product.description,
                    specs: product.specs,
                    collection_specs: null,
                    characteristics: null,
                    brandId: '3',
                };
            });

            flatColors = requestedCollection
                ? [...flatColors, ...tarkettColors.filter((color) => color.collection === requestedCollection)]
                : [...flatColors, ...tarkettColors];
        }

        return NextResponse.json({
            total: flatColors.length,
            collections: Array.from(new Set(flatColors.map((color) => color.collection))).length,
            colors: flatColors,
        });
    } catch (err: any) {
        console.error('Colors API unexpected error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
