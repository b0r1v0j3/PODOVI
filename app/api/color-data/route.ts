import { NextRequest, NextResponse } from 'next/server';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';
import carpetColorsData from '@/public/data/carpet_tiles_complete.json';
import bloqCarpetData from '@/public/data/bloq_carpet_tiles.json';

/**
 * GET /api/color-data?color={slug}&categoryId={id}
 *
 * Returns documents and characteristics for a specific color slug.
 * This keeps large JSON files on the server instead of bundling them
 * into client-side JavaScript.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const colorSlug = searchParams.get('color');
    const categoryId = searchParams.get('categoryId');

    if (!colorSlug || !categoryId) {
        return NextResponse.json(
            { documents: [], characteristics: {} },
            { status: 200 }
        );
    }

    const isLinoleum = categoryId === '7';
    const isCarpet = categoryId === '4';
    const colorsData = isLinoleum ? linoleumColorsData : isCarpet ? carpetColorsData : lvtColorsData;
    const colors = (colorsData as { colors?: any[] }).colors || [];

    // Try exact match first
    let color = colors.find((c: any) => c.slug === colorSlug);

    // If not found, try partial match
    if (!color) {
        color = colors.find((c: any) => {
            const cSlug = c.slug || '';
            return cSlug.includes(colorSlug) || colorSlug.includes(cSlug);
        });
    }

    // If not found in standard data, try BLOQ data for carpet
    if (!color && isCarpet) {
        const bloqColors = (bloqCarpetData as any).colors || [];
        color = bloqColors.find((c: any) => c.slug === colorSlug);
        if (!color) {
            color = bloqColors.find((c: any) => {
                const cSlug = c.slug || '';
                return cSlug.includes(colorSlug) || colorSlug.includes(cSlug);
            });
        }
    }

    if (!color) {
        return NextResponse.json(
            { documents: [], characteristics: {} },
            { status: 200 }
        );
    }

    // Extract documents
    const documents = (color.documents && Array.isArray(color.documents)) ? color.documents : [];

    // Extract characteristics (same logic as ProductCharacteristics)
    const characteristics: Record<string, string> = {};

    // Add "Dimenzije" first
    const dimensionValue = color.dimension || (color.characteristics && color.characteristics['Dimenzije']);
    if (dimensionValue) {
        characteristics['Dimenzije'] = dimensionValue;
    }

    // Add "Ukupna debljina" second
    const thicknessValue = color.overall_thickness || (color.characteristics && color.characteristics['Ukupna debljina']);
    if (thicknessValue) {
        characteristics['Ukupna debljina'] = thicknessValue;
    }

    // Add remaining characteristics
    if (color.characteristics) {
        Object.entries(color.characteristics).forEach(([key, value]) => {
            if (key !== 'Dimenzije' && key !== 'Ukupna debljina') {
                if (typeof value === 'string') {
                    characteristics[key] = value;
                }
            }
        });
    }

    // Legacy fields
    if (color.format && !characteristics['Format']) {
        characteristics['Format'] = color.format;
    }
    if (color.welding_rod && !characteristics['Elektroda za varenje']) {
        characteristics['Elektroda za varenje'] = color.welding_rod;
    }

    return NextResponse.json({ documents, characteristics });
}
