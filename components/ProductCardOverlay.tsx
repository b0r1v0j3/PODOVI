'use client';

import { Product } from '@/types';
import CompareButton from './CompareButton';
import FavoriteButton from './FavoriteButton';

interface ProductCardOverlayProps {
    product: Product;
}

export default function ProductCardOverlay({ product }: ProductCardOverlayProps) {
    return (
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
            <FavoriteButton productId={product.id} size="sm" />
            <CompareButton product={product} size="sm" />
        </div>
    );
}
