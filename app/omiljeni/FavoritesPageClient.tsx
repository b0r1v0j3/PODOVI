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
            <div className="container py-24 text-center">
                <p className="eyebrow mb-4">Omiljeni</p>
                <h1 className="text-3xl md:text-4xl font-normal text-ink-900 mb-4">Nemate omiljenih proizvoda</h1>
                <p className="text-ink-600 mb-10 max-w-md mx-auto">
                    Kliknite na srce na karticama proizvoda da ih dodate u omiljene.
                </p>
                <Link href="/" className="btn-primary inline-flex items-center min-h-[44px]">
                    Pogledaj proizvode
                </Link>
            </div>
        );
    }

    return (
        <div className="container py-12 md:py-16">
            <div className="mb-10">
                <p className="eyebrow mb-3">Omiljeni</p>
                <h1 className="text-3xl md:text-4xl font-normal text-ink-900">Omiljeni proizvodi</h1>
                <p className="text-[13px] text-ink-500 mt-2">{count} {count === 1 ? 'proizvod' : 'proizvoda'} sačuvano</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                    {Array.from({ length: count }).map((_, i) => (
                        <div key={i}>
                            <div className="aspect-[4/5] bg-paper animate-pulse" />
                            <div className="mt-4 space-y-2">
                                <div className="h-3 w-3/4 bg-paper animate-pulse" />
                                <div className="h-3 w-1/2 bg-paper animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                    {products.map(product => {
                        const imageCandidates = getProductImageCandidates(product, 'card').slice(0, 4);
                        const img = imageCandidates[0];
                        return (
                            <div key={product.id} className="relative group">
                                <div className="absolute top-3 right-3 z-10">
                                    <FavoriteButton productId={product.id} />
                                </div>
                                <Link href={`/proizvodi/${product.slug}`} className="block">
                                    <div className="relative aspect-[4/5] bg-paper overflow-hidden">
                                        {img?.url ? (
                                            <ProductImage
                                                sources={imageCandidates}
                                                alt={product.name}
                                                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-12 h-12 text-ink-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4">
                                        <h3 className="text-[15px] md:text-base font-normal text-ink-900">{product.name}</h3>
                                        <p className="text-[13px] text-ink-500 line-clamp-2 mt-1">{product.shortDescription}</p>
                                        <p className="mt-2 text-[13px] text-ink-500">
                                            {product.price && product.price > 0
                                                ? `${product.price.toLocaleString('sr-RS')} RSD/${product.priceUnit}`
                                                : 'Cena na upit'}
                                        </p>
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
