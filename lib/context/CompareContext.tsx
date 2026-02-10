'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product } from '@/types';

const MAX_COMPARE = 3;
const STORAGE_KEY = 'podovi_compare';

interface CompareContextType {
    compareItems: Product[];
    addToCompare: (product: Product) => void;
    removeFromCompare: (productId: string) => void;
    isInCompare: (productId: string) => boolean;
    clearAll: () => void;
    isFull: boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
    const [compareItems, setCompareItems] = useState<Product[]>([]);
    const [hydrated, setHydrated] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setCompareItems(JSON.parse(stored));
            }
        } catch { }
        setHydrated(true);
    }, []);

    // Persist to localStorage on change
    useEffect(() => {
        if (hydrated) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(compareItems));
        }
    }, [compareItems, hydrated]);

    const addToCompare = useCallback((product: Product) => {
        setCompareItems(prev => {
            if (prev.length >= MAX_COMPARE) return prev;
            if (prev.some(p => p.id === product.id)) return prev;
            return [...prev, product];
        });
    }, []);

    const removeFromCompare = useCallback((productId: string) => {
        setCompareItems(prev => prev.filter(p => p.id !== productId));
    }, []);

    const isInCompare = useCallback((productId: string) => {
        return compareItems.some(p => p.id === productId);
    }, [compareItems]);

    const clearAll = useCallback(() => {
        setCompareItems([]);
    }, []);

    return (
        <CompareContext.Provider value={{
            compareItems,
            addToCompare,
            removeFromCompare,
            isInCompare,
            clearAll,
            isFull: compareItems.length >= MAX_COMPARE,
        }}>
            {children}
        </CompareContext.Provider>
    );
}

export function useCompare() {
    const context = useContext(CompareContext);
    if (!context) throw new Error('useCompare must be used within CompareProvider');
    return context;
}
