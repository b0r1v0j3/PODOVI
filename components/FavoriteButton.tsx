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

    const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
    const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    return (
        <button
            onClick={handleClick}
            title={active ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
            className={`
        inline-flex items-center justify-center rounded-full
        transition-all duration-200 
        ${sizeClasses}
        ${active
                    ? 'bg-red-50 text-red-500 hover:bg-red-100'
                    : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-red-50 backdrop-blur-sm'
                }
      `}
        >
            <svg
                className={`${iconSize} transition-transform duration-200 ${active ? 'scale-110' : 'hover:scale-110'}`}
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
