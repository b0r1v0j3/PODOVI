'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductImage from './ProductImage';
import { isRetiredBloqProduct } from '@/lib/catalog/retired-bloq';
import { formatProductPrice, getProductPriceSummary, type ProductPriceSummary } from '@/lib/utils/product-price';

interface ViewedProduct extends ProductPriceSummary {
    id: string;
    name: string;
    slug: string;
    image: string;
    imageCandidates?: Array<{ url: string; alt?: string }>;
    categoryId?: string;
    url?: string;
    timestamp: number;
}

export default function RecentlyViewed() {
    const [products, setProducts] = useState<ViewedProduct[]>([]);

    useEffect(() => {
        let cancelled = false;
        try {
            const stored = localStorage.getItem('recentlyViewed');
            if (stored) {
                const parsed: ViewedProduct[] = JSON.parse(stored);
                const activeProducts = Array.isArray(parsed) ? parsed.filter(product => product && !isRetiredBloqProduct(product)) : [];
                setProducts(activeProducts.slice(0, 10));
                if (!Array.isArray(parsed) || activeProducts.length !== parsed.length) {
                    localStorage.setItem('recentlyViewed', JSON.stringify(activeProducts));
                }
                const visibleProducts = activeProducts.slice(0, 10);
                if (visibleProducts.length > 0) {
                    const ids = visibleProducts.map(product => product.id).join(',');
                    const categoryIds = Array.from(new Set(visibleProducts.map(product => product.categoryId).filter(Boolean))).join(',');
                    fetch(`/api/products?ids=${encodeURIComponent(ids)}&categoryIds=${encodeURIComponent(categoryIds)}`)
                        .then(response => response.ok ? response.json() : { products: [] })
                        .then((payload: { products?: Array<ProductPriceSummary & { id: string }> }) => {
                            if (cancelled) return;
                            const fresh = new Map((payload.products || []).map(product => [product.id, product]));
                            setProducts(visibleProducts.map(product => fresh.has(product.id)
                                ? { ...product, ...getProductPriceSummary(fresh.get(product.id)!) }
                                : product));
                        })
                        .catch(() => { /* The saved names and links remain usable when refresh fails. */ });
                }
            }
        } catch (e) {
            console.error('Failed to load recently viewed products', e);
        }
        return () => { cancelled = true; };
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
                                {typeof product.price === 'number' && product.price > 0 && (
                                    <p className="text-[13px] text-ink-500 mt-1">
                                        {formatProductPrice(product)}
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
    categoryId?: string;
    url?: string;
} & ProductPriceSummary) {
    if (typeof window === 'undefined' || isRetiredBloqProduct(product)) return;
    try {
        const stored = localStorage.getItem('recentlyViewed');
        let products: ViewedProduct[] = stored ? JSON.parse(stored) : [];

        // Remove if already exists to move to top
        products = products.filter(p => p.id !== product.id && !isRetiredBloqProduct(p));

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
