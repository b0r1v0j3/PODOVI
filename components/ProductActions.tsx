'use client';

import { Product } from '@/types';
import FavoriteButton from './FavoriteButton';
import CompareButton from './CompareButton';
import { useState } from 'react';

interface ProductActionsProps {
    product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const url = window.location.href;
        const title = product.name;

        // Try native share first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
                return;
            } catch {
                // User cancelled or not supported
            }
        }

        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <FavoriteButton productId={product.id} size="md" />
            <CompareButton product={product} size="md" />
            <button
                onClick={handleShare}
                title={copied ? 'Link kopiran!' : 'Podeli'}
                className={`
          inline-flex items-center justify-center gap-1.5 rounded-lg font-medium
          transition-all duration-200 border px-3 py-1.5 text-sm
          ${copied
                        ? 'bg-green-50 text-green-600 border-green-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-primary-50 hover:border-primary-400 hover:text-primary-700'
                    }
        `}
            >
                {copied ? (
                    <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Kopirano
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Podeli
                    </>
                )}
            </button>
        </div>
    );
}
