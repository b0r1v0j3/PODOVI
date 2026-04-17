'use client';

import { useEffect } from 'react';
import { Product } from '@/types';
import { addToRecentlyViewed } from './RecentlyViewed';
import { getPrimaryProductImage, getProductImageCandidates } from '@/lib/utils/product-images';

interface ProductViewTrackerProps {
    product: Pick<Product, 'id' | 'name' | 'slug' | 'images' | 'price'> & { url?: string };
}

export default function ProductViewTracker({ product }: ProductViewTrackerProps) {
    useEffect(() => {
        // Determine the best image URL to save
        const imageUrl = getPrimaryProductImage(product as Product, 'thumb')?.url || '/images/placeholder.svg';
        const imageCandidates = getProductImageCandidates(product as Product, 'thumb').slice(0, 4);

        addToRecentlyViewed({
            id: product.id,
            name: product.name,
            slug: product.slug,
            image: imageUrl,
            imageCandidates,
            price: product.price,
            url: product.url
        });
    }, [product]);

    return null; // This component doesn't render anything
}
