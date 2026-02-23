import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/colors?category=lvt|linoleum|vinil|tekstilne-ploce|elektroprovodni
 * 
 * Returns colors in the same format as the original JSON files:
 * - For "vinil": returns { collections: [{ slug, name, colors: [...] }] } (nested format)
 * - For everything else: returns { colors: [...] } (flat format)
 */
// Import Tarkett data directly from JSON file
import tarkettLvtData from '@/public/data/tarkett_lvt_products.json';
import esdColorsData from '@/public/data/esd_colors.json';

type TarkettProduct = {
    id: string;
    name: string;
    description?: string;
    images?: string[];
    specs?: any;
    brandId?: string;
    collection: string;
};

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
        if (category === 'vinil' || category === 'elektroprovodni') {
            // For elektroprovodni, load from esd_colors.json (collections format)
            if (category === 'elektroprovodni') {
                const esdCollections = (esdColorsData as any)?.collections || [];
                const collectionsMap = new Map<string, { slug: string; name: string; colorCount: number; colors: any[] }>();
                const collectionFilter = request.nextUrl.searchParams.get('collection');

                for (const esdColl of esdCollections) {
                    const collSlug = esdColl.slug || '';
                    if (collectionFilter && collSlug !== collectionFilter) continue;
                    if (!collectionsMap.has(collSlug)) {
                        collectionsMap.set(collSlug, {
                            slug: collSlug,
                            name: esdColl.name || collSlug,
                            colorCount: 0,
                            colors: [],
                        });
                    }
                    const coll = collectionsMap.get(collSlug)!;
                    for (const color of (esdColl.colors || [])) {
                        coll.colors.push({
                            code: color.code,
                            name: color.name,
                            sku: null,
                            href: color.href || null,
                            collection_slug: collSlug,
                            collection_name: esdColl.name,
                            image: color.image,
                            image_url: color.image,
                            description: color.description || '',
                            characteristics: color.characteristics || {},
                        });
                    }
                    coll.colorCount = coll.colors.length;
                }

                return NextResponse.json({
                    collections: Array.from(collectionsMap.values()).filter(c => c.colorCount > 0),
                    totalColors: Array.from(collectionsMap.values()).reduce((sum, c) => sum + c.colorCount, 0),
                    generatedAt: new Date().toISOString(),
                });
            }

            // vinil category handler
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
        let flatColors = colors.map(c => ({
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
            brandId: '6' // Gerflor brand ID
        }));

        // Merge Tarkett LVT colors if category is 'lvt'
        if (category === 'lvt') {
            const tarkettColors = (tarkettLvtData as TarkettProduct[]).map(p => {
                // Determine image URL (pod view is preferred)
                let imageUrl = '';
                if (p.images && p.images.length > 0) {
                    imageUrl = p.images[0];
                }

                // Clean name roughly similar to productDataLoader
                let cleanName = p.name || '';
                cleanName = cleanName.replace(/^(Ess\d+-|iD\s*\d+-|Tarkett\s*)/i, '').replace(/-0v$/i, '').trim();

                // Collection name map (simplified from productDataLoader)
                // We use the raw collection slug as 'collection' key

                return {
                    collection: p.collection, // e.g. 'id-inspiration-55'
                    collection_name: p.collection, // Can be improved with map
                    code: p.id, // Using ID as code effectively
                    name: cleanName,
                    full_name: p.name,
                    slug: p.id,
                    image_url: imageUrl,
                    texture_url: imageUrl, // Mapping same image to texture
                    image_count: p.images?.length || 0,
                    lifestyle_url: null,
                    welding_rod: null,
                    dimension: null,
                    format: null,
                    overall_thickness: p.specs?.total_thickness || null,
                    description: p.description,
                    specs: p.specs,
                    collection_specs: null,
                    characteristics: null,
                    brandId: '3' // Tarkett brand ID
                };
            });

            // Filter by collection if requested
            if (collection) {
                const filteredTarkett = tarkettColors.filter(c => c.collection === collection);
                flatColors = [...flatColors, ...filteredTarkett];
            } else {
                flatColors = [...flatColors, ...tarkettColors];
            }
        }

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
