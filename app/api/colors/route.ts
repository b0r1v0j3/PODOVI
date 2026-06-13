import { NextRequest, NextResponse } from 'next/server';
import { getColorsForCategory } from '@/lib/colors/get-colors';

/**
 * GET /api/colors?category=lvt|linoleum|vinil|tekstilne-ploce|elektroprovodni|industrijske-ploce|sport|lajsne
 *
 * - Nested format: vinil, elektroprovodni, industrijske-ploce, sport, lajsne
 * - Flat format: lvt, linoleum, tekstilne-ploce
 *
 * Logika je izdvojena u lib/colors/get-colors.ts radi deljenja sa server-side pozivaocima.
 */
export async function GET(request: NextRequest) {
    const category = request.nextUrl.searchParams.get('category') || 'lvt';
    const requestedCollection = request.nextUrl.searchParams.get('collection');
    const requestedListingMode = request.nextUrl.searchParams.get('listing');

    const { status, body } = await getColorsForCategory(category, {
        collection: requestedCollection,
        listing: requestedListingMode,
    });

    return NextResponse.json(body, { status });
}
