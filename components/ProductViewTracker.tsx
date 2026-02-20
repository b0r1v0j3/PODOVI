'use client';

import { useEffect } from 'react';
import { addToRecentlyViewed } from './RecentlyViewed';

interface ProductViewTrackerProps {
    product: {
        id: string;
        name: string;
        slug: string;
        images: { url: string; isPrimary?: boolean }[];
        price?: number;
        url?: string;
    };
}

export default function ProductViewTracker({ product }: ProductViewTrackerProps) {
    useEffect(() => {
        // Determine the best image URL to save
        const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
        const imageUrl = primaryImage ? primaryImage.url : '/images/placeholder.svg';

        addToRecentlyViewed({
            id: product.id,
            name: product.name,
            slug: product.slug,
            image: imageUrl,
            price: product.price,
            url: product.url
        });
    }, [product]);

    return null; // This component doesn't render anything
}
