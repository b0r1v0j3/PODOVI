import type { Product, ProductImage as ProductImageType, ProductSpec, ProductDetailsSection } from '@/types';

// Re-export for convenience
export type { Product, ProductImageType, ProductSpec, ProductDetailsSection };

export interface Props {
    params: { slug: string };
    searchParams?: { color?: string };
}

export interface ColorFromJSON {
    collection: string;
    collection_name: string;
    collection_slug?: string;
    code: string;
    name: string;
    full_name: string;
    slug: string;
    image_url?: string;
    texture_url?: string;
    lifestyle_url?: string;
    image_count: number;
    welding_rod?: string;
    dimension?: string;
    format?: string;
    overall_thickness?: string;
    characteristics?: Record<string, string>;
    description?: string;
    collection_specs?: ProductSpec[];
    specs?: Record<string, string>;
    brandId?: string;
}

export type ColorSource = {
    categorySlug: 'lvt' | 'linoleum' | 'vinil' | 'elektroprovodni' | 'industrijske-ploce' | 'sport' | 'lajsne';
    color: ColorFromJSON;
    brandId?: string;
};
