'use client';

import { useCompare } from '@/lib/context/CompareContext';
import Link from 'next/link';
import ProductImage from './ProductImage';
import { splitProductTitle } from '@/lib/utils/name-parser';
import { getProductImageCandidates } from '@/lib/utils/product-images';

export default function CompareBar() {
    const { compareItems, removeFromCompare, clearAll } = useCompare();

    if (compareItems.length === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-ink-200">
            <div className="container py-3">
                <div className="flex items-center justify-between gap-4">
                    {/* Product thumbnails */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="eyebrow whitespace-nowrap hidden sm:block">
                            Poređenje ({compareItems.length}/3)
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto">
                            {compareItems.map((product: any) => {
                                const imageCandidates = getProductImageCandidates(product, 'thumb').slice(0, 4);
                                const img = imageCandidates[0]?.url;

                                let displayName = product.name;
                                if (product.categoryId === '6' && product.name.startsWith('Gerflor ')) {
                                    displayName = product.name.replace(/^Gerflor\s+/, '');
                                }

                                const rawCollection = product.specs?.find((s: any) => s.key === 'collection')?.value || product.collectionSlug;
                                const { collection, color } = splitProductTitle(displayName, rawCollection);
                                const formattedName = collection && collection.toLowerCase() !== color.toLowerCase()
                                    ? `${color} (${collection})`
                                    : color;

                                return (
                                    <div key={product.id} className="relative flex items-center gap-2 border border-ink-200 bg-white px-2 py-1.5 min-w-0 flex-shrink-0">
                                        {img && (
                                            <div className="relative w-8 h-8 overflow-hidden flex-shrink-0 bg-paper">
                                                <ProductImage
                                                    sources={imageCandidates}
                                                    alt={product.name}
                                                    className="object-cover"
                                                    sizes="32px"
                                                />
                                            </div>
                                        )}
                                        <span className="text-xs text-ink-900 truncate max-w-[100px]" title={formattedName}>
                                            {formattedName}
                                        </span>
                                        <button
                                            onClick={() => removeFromCompare(product.id)}
                                            className="flex-shrink-0 p-3.5 -m-2.5 text-ink-500 hover:text-ink-900 flex items-center justify-center transition-colors"
                                            title="Ukloni"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={clearAll}
                            className="text-[13px] text-ink-500 hover:text-ink-900 transition-colors px-2 py-1 min-h-[44px]"
                        >
                            Obriši sve
                        </button>
                        <Link
                            href="/uporedi"
                            className="btn-primary inline-flex items-center whitespace-nowrap min-h-[44px]"
                        >
                            Uporedi ({compareItems.length})
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
