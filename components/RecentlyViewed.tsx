'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ViewedProduct {
    id: string;
    name: string;
    slug: string;
    image: string;
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
        <section className="py-12 bg-white border-t border-gray-100">
            <div className="container">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
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
                                <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 mb-2 border border-gray-200">
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        sizes="192px"
                                        className={`object-cover group-hover:scale-105 transition-transform duration-300${product.image.includes('/deking/') ? ' object-left' : ''}`}
                                    />
                                </div>
                                <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                                    {product.name}
                                </h3>
                                {product.price && (
                                    <p className="text-xs text-gray-500 font-semibold mt-1">
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
export function addToRecentlyViewed(product: { id: string; name: string; slug: string; image: string; price?: number; url?: string }) {
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
