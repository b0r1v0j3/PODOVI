'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

const STORAGE_KEY = 'podovi_favorites';

interface FavoritesContextType {
    favoriteIds: string[];
    toggleFavorite: (productId: string) => void;
    isFavorite: (productId: string) => boolean;
    count: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setFavoriteIds(JSON.parse(stored));
            }
        } catch { }
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (hydrated) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
        }
    }, [favoriteIds, hydrated]);

    const toggleFavorite = useCallback((productId: string) => {
        setFavoriteIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    }, []);

    const isFavorite = useCallback((productId: string) => {
        return favoriteIds.includes(productId);
    }, [favoriteIds]);

    return (
        <FavoritesContext.Provider value={{
            favoriteIds,
            toggleFavorite,
            isFavorite,
            count: favoriteIds.length,
        }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (!context) throw new Error('useFavorites must be used within FavoritesProvider');
    return context;
}
