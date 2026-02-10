'use client';

import { useCompare } from '@/lib/context/CompareContext';
import { Product } from '@/types';

interface CompareButtonProps {
    product: Product;
    size?: 'sm' | 'md';
}

export default function CompareButton({ product, size = 'sm' }: CompareButtonProps) {
    const { addToCompare, removeFromCompare, isInCompare, isFull } = useCompare();
    const active = isInCompare(product.id);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (active) {
            removeFromCompare(product.id);
        } else if (!isFull) {
            addToCompare(product);
        }
    };

    const sizeClasses = size === 'sm'
        ? 'w-8 h-8 text-xs'
        : 'px-3 py-1.5 text-sm';

    return (
        <button
            onClick={handleClick}
            disabled={!active && isFull}
            title={active ? 'Ukloni iz poređenja' : isFull ? 'Maksimalno 3 proizvoda' : 'Uporedi'}
            className={`
        inline-flex items-center justify-center gap-1 rounded-lg font-medium
        transition-all duration-200 border
        ${sizeClasses}
        ${active
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : isFull
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white/90 text-gray-700 border-gray-300 hover:bg-primary-50 hover:border-primary-400 hover:text-primary-700 backdrop-blur-sm'
                }
      `}
        >
            <svg className={size === 'sm' ? 'w-4 h-4' : 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {size === 'md' && (active ? 'Izabrano' : 'Uporedi')}
        </button>
    );
}
