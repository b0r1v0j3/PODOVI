'use client';

import { useFavorites } from '@/lib/context/FavoritesContext';

interface FavoriteButtonProps {
    productId: string;
    size?: 'sm' | 'md';
}

export default function FavoriteButton({ productId, size = 'sm' }: FavoriteButtonProps) {
    const { toggleFavorite, isFavorite } = useFavorites();
    const active = isFavorite(productId);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(productId);
    };

    const sizeClasses = size === 'sm' ? 'w-11 h-11 md:w-8 md:h-8' : 'w-11 h-11';
    const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    return (
        <button
            onClick={handleClick}
            title={active ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
            aria-label={active ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
            aria-pressed={active}
            className={`
        inline-flex items-center justify-center bg-white/95 border
        transition-colors duration-200
        ${sizeClasses}
        ${active
                    ? 'border-ink-900 text-ink-900'
                    : 'border-ink-200 text-ink-500 hover:border-ink-900 hover:text-ink-900'
                }
      `}
        >
            <svg
                className={iconSize}
                fill={active ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        </button>
    );
}
