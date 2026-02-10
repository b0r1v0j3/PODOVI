import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/colors?category=lvt|linoleum|vinil|tekstilne-ploce
 * 
 * Returns colors in the same format as the original JSON files:
 * - For "vinil": returns { collections: [{ slug, name, colors: [...] }] } (nested format)
 * - For everything else: returns { colors: [...] } (flat format)
 */
export async function GET(request: NextRequest) {
    const category = request.nextUrl.searchParams.get('category') || 'lvt';
    const collection = request.nextUrl.searchParams.get('collection'); // optional filter

    try {
        let query = supabase
            .from('colors')
            .select('*')
            .eq('category_slug', category);

        if (collection) {
            query = query.eq('collection_slug', collection);
        }

        const { data, error } = await query.order('collection_slug').order('code');

        if (error) {
            console.error('Colors API error:', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const colors = data || [];

        // For "vinil" category, return nested collections format
        // This matches the vinyl_colors_complete.json structure
        if (category === 'vinil') {
            const collectionsMap = new Map<string, { slug: string; name: string; colorCount: number; colors: any[] }>();

            for (const color of colors) {
                const collSlug = color.collection_slug || '';
                if (!collectionsMap.has(collSlug)) {
                    collectionsMap.set(collSlug, {
                        slug: collSlug,
                        name: color.collection_name || collSlug,
                        colorCount: 0,
                        colors: [],
                    });
                }
                const coll = collectionsMap.get(collSlug)!;
                coll.colors.push({
                    code: color.code,
                    name: color.name,
                    sku: null,
                    href: null,
                    collection_slug: color.collection_slug,
                    image: color.image_url,
                    image_url: color.image_url,
                });
                coll.colorCount = coll.colors.length;
            }

            return NextResponse.json({
                collections: Array.from(collectionsMap.values()),
                totalColors: colors.length,
                generatedAt: new Date().toISOString(),
            });
        }

        // For all other categories (lvt, linoleum, tekstilne-ploce), return flat format
        // This matches lvt_colors_complete.json / linoleum_colors_complete.json structure
        const flatColors = colors.map(c => ({
            collection: c.collection_slug,
            collection_name: c.collection_name,
            code: c.code,
            name: c.name,
            full_name: c.full_name,
            slug: c.slug,
            image_url: c.image_url,
            texture_url: c.texture_url,
            image_count: c.image_count || 0,
            lifestyle_url: c.lifestyle_url,
            welding_rod: c.welding_rod,
            dimension: c.dimension,
            format: c.format,
            overall_thickness: c.overall_thickness,
            description: c.description,
            specs: c.specs,
            collection_specs: c.collection_specs,
            characteristics: c.characteristics,
        }));

        return NextResponse.json({
            total: flatColors.length,
            collections: Array.from(new Set(flatColors.map(c => c.collection))).length,
            colors: flatColors,
        });
    } catch (err: any) {
        console.error('Colors API unexpected error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
