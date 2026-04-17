import { NextRequest, NextResponse } from 'next/server';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';
import carpetColorsData from '@/public/data/carpet_tiles_complete.json';
import bloqCarpetData from '@/public/data/bloq_carpet_tiles.json';
import vinylColorsData from '@/public/data/vinyl_colors_complete.json';
import vinylSpecialColorsData from '@/public/data/vinyl_special_colors.json';
import tarkettVinylHomeColorsData from '@/public/data/tarkett_vinyl_home_colors.json';
import tarkettHomogeneousVinylColorsData from '@/public/data/tarkett_homogeneous_vinyl_colors.json';
import tarkettHeterogeneousVinylColorsData from '@/public/data/tarkett_heterogeneous_vinyl_colors.json';
import wolflorVinylColorsData from '@/public/data/wolflor_vinyl_colors.json';
import esdColorsData from '@/public/data/esd_colors.json';
import industrialColorsData from '@/public/data/industrial_colors.json';
import sportColorsData from '@/public/data/sport_colors.json';
import tarkettSportColorsData from '@/public/data/tarkett_sport_colors.json';
import tarkettLajsneData from '@/public/data/tarkett_lajsne_variants.json';
import { resolveSelectedColorServerData } from '@/lib/product-page/color-helpers';

/**
 * GET /api/color-data?color={slug}&categoryId={id}
 *
 * Returns documents, characteristics, and specs for a specific color slug.
 * Large JSON files stay server-side to avoid client bundle bloat.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const colorSlug = searchParams.get('color');
    const categoryId = searchParams.get('categoryId');

    if (!colorSlug || !categoryId) {
        return NextResponse.json(
            { documents: [], characteristics: {}, specs: [] },
            { status: 200 }
        );
    }

    const isLinoleum = categoryId === '7';
    const isCarpet = categoryId === '4';
    const isVinyl = categoryId === '2';
    const isEsd = categoryId === '8';
    const isIndustrial = categoryId === '9';
    const isSport = categoryId === '10';
    const isLajsne = categoryId === '11';

    const findFlatColor = (colors: any[]) => {
        let match = colors.find((color: any) => color.slug === colorSlug);
        if (!match) {
            match = colors.find((color: any) => {
                const slugValue = color.slug || '';
                return slugValue.includes(colorSlug) || colorSlug.includes(slugValue);
            });
        }
        return match || null;
    };

    const findNestedColor = (collections: any[]) => {
        for (const collection of collections) {
            for (const color of collection.colors || []) {
                const generatedSlug = color.slug || `${collection.slug}-${color.code}-${String(color.name || '')
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')}`;

                const isExactMatch = generatedSlug === colorSlug;
                const isPartialMatch = generatedSlug.includes(colorSlug) || colorSlug.includes(generatedSlug);

                if (isExactMatch || isPartialMatch) {
                    return {
                        ...color,
                        slug: generatedSlug,
                        collection: collection.slug,
                        collection_name: collection.name,
                        collection_slug: collection.slug,
                        description: color.description || collection.description || '',
                        characteristics: {
                            ...(collection.characteristics || {}),
                            ...(color.characteristics || {}),
                        },
                        format: color.format || collection.characteristics?.Format,
                        dimension: color.dimension || collection.characteristics?.Dimenzije,
                        overall_thickness: color.overall_thickness || collection.characteristics?.['Ukupna debljina'],
                        documents: Array.isArray(color.documents)
                            ? color.documents
                            : (Array.isArray(collection.documents) ? collection.documents : []),
                    };
                }
            }
        }

        return null;
    };

    let color = null;

    if (isVinyl) {
        color = findNestedColor([
            ...(((vinylColorsData as any)?.collections || []) as any[]),
            ...(((vinylSpecialColorsData as any)?.collections || []) as any[]),
            ...(((tarkettVinylHomeColorsData as any)?.collections || []) as any[]),
            ...(((tarkettHeterogeneousVinylColorsData as any)?.collections || []) as any[]),
            ...(((tarkettHomogeneousVinylColorsData as any)?.collections || []) as any[]),
            ...(((wolflorVinylColorsData as any)?.collections || []) as any[]),
        ]);
    } else if (isEsd) {
        color = findNestedColor(((esdColorsData as any)?.collections || []));
    } else if (isIndustrial) {
        color = findNestedColor(((industrialColorsData as any)?.collections || []));
    } else if (isSport) {
        color = findNestedColor([
            ...((((sportColorsData as any)?.collections || []) as any[])),
            ...((((tarkettSportColorsData as any)?.collections || []) as any[])),
        ]);
    } else if (isLajsne) {
        color = findNestedColor((((tarkettLajsneData as any)?.collections || []) as any[]));
    } else {
        const colorsData = isLinoleum ? linoleumColorsData : isCarpet ? carpetColorsData : lvtColorsData;
        const colors = (colorsData as { colors?: any[] }).colors || [];
        color = findFlatColor(colors);
    }

    if (!color && isCarpet) {
        color = findFlatColor((bloqCarpetData as any).colors || []);
    }

    if (!color) {
        return NextResponse.json(
            { documents: [], characteristics: {}, specs: [] },
            { status: 200 }
        );
    }

    const selectedColorData = await resolveSelectedColorServerData(colorSlug, {
        categoryId,
        brandId: color.brandId || '6',
    });

    if (!selectedColorData) {
        return NextResponse.json(
            { documents: [], characteristics: {}, specs: [] },
            { status: 200 }
        );
    }

    return NextResponse.json({
        documents: selectedColorData.documents,
        characteristics: selectedColorData.characteristics,
        specs: selectedColorData.specs,
    });
}
