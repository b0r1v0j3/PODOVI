'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductImage from './ProductImage';

interface ViewedProduct {
    id: string;
    name: string;
    slug: string;
    image: string;
    imageCandidates?: Array<{ url: string; alt?: string }>;
    price?: number;
    url?: string;
    timestamp: number;
}

export default function RecentlyViewed() {
    const [products, setProducts] = useState<ViewedProduct[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('recentlyViewed');
            if (stored) {
                const parsed: ViewedProduct[] = JSON.parse(stored);
                // Filter out expired items (optional, e.g., > 30 days) and sort by timestamp desc
                setProducts(parsed.slice(0, 10)); // Limit to 10 items
            }
        } catch (e) {
            console.error('Failed to load recently viewed products', e);
        }
    }, []);

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="py-16 bg-white border-t border-ink-200">
            <div className="container">
                <p className="eyebrow mb-3">Istorija pregleda</p>
                <h2 className="text-xl md:text-2xl font-normal text-ink-900 mb-8">
                    Nedavno pregledano
                </h2>
                <div className="relative">
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                        {products.map((product) => (
                            <Link
                                key={product.id}
                                href={product.url || `/proizvodi/${product.slug}`}
                                className="flex-shrink-0 w-48 snap-start group"
                            >
                                <div className="aspect-square relative overflow-hidden bg-paper mb-3">
                                    <ProductImage
                                        src={product.image}
                                        alt={product.name}
                                        sources={product.imageCandidates}
                                        sizes="192px"
                                        className={`group-hover:scale-[1.03] transition-transform duration-700${product.image.includes('/deking/') ? ' object-left' : ''}`}
                                    />
                                </div>
                                <h3 className="text-sm font-normal text-ink-900 truncate">
                                    {product.name}
                                </h3>
                                {product.price && (
                                    <p className="text-[13px] text-ink-500 mt-1">
                                        {product.price.toLocaleString('sr-RS')} RSD
                                    </p>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

// Helper to add product to history
export function addToRecentlyViewed(product: {
    id: string;
    name: string;
    slug: string;
    image: string;
    imageCandidates?: Array<{ url: string; alt?: string }>;
    price?: number;
    url?: string;
}) {
    if (typeof window === 'undefined') return;
    try {
        const stored = localStorage.getItem('recentlyViewed');
        let products: ViewedProduct[] = stored ? JSON.parse(stored) : [];

        // Remove if already exists to move to top
        products = products.filter(p => p.id !== product.id);

        // Add to beginning
        products.unshift({
            ...product,
            timestamp: Date.now(),
        });

        // Limit to 20 items in storage
        if (products.length > 20) {
            products = products.slice(0, 20);
        }

        localStorage.setItem('recentlyViewed', JSON.stringify(products));
    } catch (e) {
        console.error('Failed to save recently viewed product', e);
    }
}
