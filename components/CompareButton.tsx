'use client';

import { useCompare } from '@/lib/context/CompareContext';
import { Product } from '@/types';

interface CompareButtonProps {
    product: Product;
    size?: 'sm' | 'md';
    variant?: 'icon' | 'text';
}

export default function CompareButton({ product, size = 'sm', variant = 'icon' }: CompareButtonProps) {
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

    if (variant === 'text') {
        return (
            <button
                onClick={handleClick}
                disabled={!active && isFull}
                title={active ? 'Ukloni iz poređenja' : isFull ? 'Maksimalno 3 proizvoda' : 'Uporedi'}
                aria-label={active ? 'Ukloni iz poređenja' : isFull ? 'Maksimalno 3 proizvoda' : 'Uporedi'}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 text-[12px] transition-colors ${
                    active
                        ? 'text-ink-900'
                        : isFull
                            ? 'cursor-not-allowed text-ink-400'
                            : 'text-ink-600 hover:text-ink-900'
                }`}
            >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 20V10M12 20V4M17 20v-7" />
                </svg>
                {active ? 'Izabrano' : 'Uporedi'}
            </button>
        );
    }

    const sizeClasses = size === 'sm'
        ? 'w-11 h-11 md:w-9 md:h-9 text-xs'
        : 'px-4 py-2.5 min-h-[44px] text-[13px]';

    return (
        <button
            onClick={handleClick}
            disabled={!active && isFull}
            title={active ? 'Ukloni iz poređenja' : isFull ? 'Maksimalno 3 proizvoda' : 'Uporedi'}
            aria-label={active ? 'Ukloni iz poređenja' : isFull ? 'Maksimalno 3 proizvoda' : 'Uporedi'}
            aria-pressed={active}
            className={`
        inline-flex items-center justify-center gap-1 font-medium
        transition-colors duration-200 border
        ${sizeClasses}
        ${active
                    ? 'bg-ink-900 text-white border-ink-900'
                    : isFull
                        ? 'bg-white text-ink-400 border-ink-200 cursor-not-allowed'
                        : 'bg-white text-ink-500 border-ink-200 hover:border-ink-900 hover:text-ink-900'
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
