'use client';

import { useCompare } from '@/lib/context/CompareContext';
import Image from 'next/image';
import Link from 'next/link';

export default function CompareBar() {
    const { compareItems, removeFromCompare, clearAll } = useCompare();

    if (compareItems.length === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-primary-500 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] animate-slideUp">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    {/* Product thumbnails */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-700 whitespace-nowrap hidden sm:block">
                            Poređenje ({compareItems.length}/3):
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto">
                            {compareItems.map(product => {
                                const img = product.images?.[0]?.url;
                                return (
                                    <div key={product.id} className="relative flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1.5 min-w-0 flex-shrink-0">
                                        {img && img.startsWith('/') && (
                                            <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
                                                <Image src={img} alt={product.name} fill className="object-cover" sizes="32px" />
                                            </div>
                                        )}
                                        <span className="text-xs font-medium text-gray-700 truncate max-w-[100px]">
                                            {product.name}
                                        </span>
                                        <button
                                            onClick={() => removeFromCompare(product.id)}
                                            className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-600 flex items-center justify-center transition-colors"
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
                            className="text-xs text-gray-500 hover:text-red-600 transition-colors px-2 py-1"
                        >
                            Obriši sve
                        </button>
                        <Link
                            href="/uporedi"
                            className="btn-primary text-sm px-4 py-2 whitespace-nowrap"
                        >
                            Uporedi ({compareItems.length})
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
