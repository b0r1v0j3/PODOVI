'use client';

import { useFavorites } from '@/lib/context/FavoritesContext';
import { useEffect, useState } from 'react';
import { Product } from '@/types';
import Link from 'next/link';
import FavoriteButton from '@/components/FavoriteButton';
import ProductImage from '@/components/ProductImage';
import { getProductImageCandidates } from '@/lib/utils/product-images';

export default function FavoritesPageClient() {
    const { favoriteIds, count } = useFavorites();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch product details for favorited IDs
    useEffect(() => {
        if (favoriteIds.length === 0) {
            setProducts([]);
            setLoading(false);
            return;
        }

        // Fetch each product by ID
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/products?ids=${favoriteIds.join(',')}`);
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data.products || []);
                }
            } catch (err) {
                console.error('Failed to load favorites:', err);
            }
            setLoading(false);
        };

        fetchProducts();
    }, [favoriteIds]);

    if (!loading && count === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">Nemate omiljenih proizvoda</h1>
                <p className="text-gray-600 mb-6">
                    Kliknite na srce ❤️ na karticama proizvoda da ih dodate u omiljene.
                </p>
                <Link href="/" className="btn-primary inline-flex items-center gap-2">
                    <span>Pogledaj proizvode</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Omiljeni proizvodi</h1>
                <p className="text-gray-600 mt-1">{count} {count === 1 ? 'proizvod' : 'proizvoda'} sačuvano</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: count }).map((_, i) => (
                        <div key={i} className="card animate-pulse">
                            <div className="h-48 bg-gray-200 rounded-t-xl" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-3 bg-gray-200 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map(product => {
                        const imageCandidates = getProductImageCandidates(product, 'card').slice(0, 4);
                        const img = imageCandidates[0];
                        return (
                            <div key={product.id} className="card card-hover relative group">
                                <div className="absolute top-3 right-3 z-10">
                                    <FavoriteButton productId={product.id} />
                                </div>
                                <Link href={`/proizvodi/${product.slug}`}>
                                    <div className="relative h-48 bg-gray-100 overflow-hidden rounded-t-xl">
                                        {img?.url ? (
                                            <ProductImage
                                                sources={imageCandidates}
                                                alt={product.name}
                                                className="group-hover:scale-105 transition-transform duration-300"
                                                sizes="(max-width: 768px) 100vw, 25vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">{product.name}</h3>
                                        <p className="text-sm text-gray-600 line-clamp-2">{product.shortDescription}</p>
                                        {product.price && product.price > 0 && (
                                            <p className="mt-2 text-lg font-bold text-gray-900">
                                                {product.price.toLocaleString('sr-RS')} <span className="text-sm text-gray-500 font-normal">RSD/{product.priceUnit}</span>
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
