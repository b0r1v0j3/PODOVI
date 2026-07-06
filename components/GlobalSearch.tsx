'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import ProductImage from './ProductImage';
import { useScrollLock } from './useScrollLock';

interface SearchProduct {
    id: string;
    slug: string;
    name: string;
    categoryId: string;
    image: string;
    imageCandidates?: Array<{ url: string; alt?: string }>;
    price?: number;
    subtitle?: string;
    url?: string;
}

interface SearchCategory {
    id: string;
    slug: string;
    name: string;
    image?: string;
}

interface SearchBrand {
    id: string;
    slug: string;
    name: string;
    logo?: string;
}

interface SearchResults {
    products: SearchProduct[];
    categories: SearchCategory[];
    brands: SearchBrand[];
}

interface GlobalSearchProps {
    variant?: 'icon' | 'bar';
}

export default function GlobalSearch({ variant = 'icon' }: GlobalSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [expanded, setExpanded] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const totalResults = results
        ? results.products.length
        : 0;

    // Fetch search results
    const fetchResults = useCallback(async (q: string) => {
        if (q.length < 2) {
            setResults(null);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            const data: SearchResults = await res.json();
            setResults(data);
            setIsOpen(true);
            setActiveIndex(-1);
        } catch {
            setResults(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.length < 2) {
            setResults(null);
            setIsOpen(false);
            return;
        }

        debounceRef.current = setTimeout(() => {
            fetchResults(query);
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, fetchResults]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setExpanded(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Build flat list of all result items for keyboard navigation
    const getAllItems = (): { type: string; href: string }[] => {
        if (!results) return [];
        const items: { type: string; href: string }[] = [];
        results.products.forEach(p => items.push({ type: 'product', href: p.url || `/proizvodi/${p.slug}` }));
        return items;
    };

    const closeAndReset = useCallback(() => {
        setIsOpen(false);
        setExpanded(false);
        setQuery('');
        setResults(null);
        setActiveIndex(-1);
        // Fokus se vraća na trigger dugme ove instance
        triggerRef.current?.focus();
    }, []);

    // Scroll lock dok je pretraga otvorena
    useScrollLock(expanded);

    // Escape na nivou dokumenta dok je pretraga otvorena
    useEffect(() => {
        if (!expanded) return;

        const handleDocumentKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeAndReset();
            }
        };
        document.addEventListener('keydown', handleDocumentKeyDown);

        return () => {
            document.removeEventListener('keydown', handleDocumentKeyDown);
        };
    }, [expanded, closeAndReset]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        const items = getAllItems();

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
        } else if (e.key === 'Enter' && activeIndex >= 0 && items[activeIndex]) {
            e.preventDefault();
            window.location.href = items[activeIndex].href;
            closeAndReset();
        }
    };

    const openSearch = () => {
        setExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleResultClick = () => {
        closeAndReset();
    };

    // Track which flat index each result is at
    let flatIndex = 0;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('sr-RS', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price) + ' RSD/m²';
    };

    return (
        <div ref={containerRef}>
            {/* Trigger */}
            <button
                ref={triggerRef}
                type="button"
                className={
                    variant === 'bar'
                        ? 'flex min-h-[36px] w-full items-center gap-3 rounded-[4px] border border-ink-200 bg-white px-3 text-left text-[13px] text-ink-500 transition-colors duration-200 hover:border-ink-400 hover:text-ink-700'
                        : 'flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-600 transition-colors duration-200 hover:text-ink-900'
                }
                onClick={openSearch}
                aria-label="Otvori pretragu"
                aria-expanded={expanded}
            >
                <Search className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.7} />
                {variant === 'bar' && (
                    <span className="truncate">Pretraži proizvode, kolekcije, brendove...</span>
                )}
            </button>

            {/* Full-width search overlay preko headera */}
            {expanded && (
                <div className="fixed inset-0 z-[70] flex flex-col bg-white md:bottom-auto md:max-h-[85vh] md:border-b md:border-ink-200">
                    {/* Input red — puna širina */}
                    <div className="border-b border-ink-200">
                        <div className="container flex h-14 items-center gap-4 md:h-16">
                            <svg
                                className="h-5 w-5 flex-shrink-0 text-ink-500"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => { if (results && totalResults > 0) setIsOpen(true); }}
                                placeholder="Pretraži proizvode..."
                                className="h-full flex-1 border-0 bg-transparent p-0 text-base text-ink-900 placeholder:text-ink-500 focus:outline-none md:text-lg"
                                aria-label="Pretraži proizvode"
                                aria-expanded={isOpen}
                                role="combobox"
                                aria-autocomplete="list"
                                aria-controls="search-results-list"
                            />
                            <button
                                type="button"
                                onClick={closeAndReset}
                                className="flex min-h-[44px] items-center text-[13px] text-ink-600 transition-colors duration-200 hover:text-ink-900"
                            >
                                Zatvori
                            </button>
                        </div>
                    </div>

                    {/* Rezultati */}
                    <div className="flex-1 overflow-y-auto overscroll-contain md:max-h-[60vh] md:flex-none">
                        <div className="container py-4">
                            {isLoading && !results ? (
                                <div className="space-y-2" aria-hidden="true">
                                    <div className="h-14 animate-pulse bg-paper" />
                                    <div className="h-14 animate-pulse bg-paper" />
                                    <div className="h-14 animate-pulse bg-paper" />
                                </div>
                            ) : query.length < 2 && !results ? (
                                <div>
                                    <h3 className="eyebrow mb-3">Popularno</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {['LVT', 'Laminat', 'Parket', 'Vodootporno', 'Hrast', 'Tamno sivo', 'Belo'].map(term => (
                                            <button
                                                key={term}
                                                onClick={() => { setQuery(term); fetchResults(term); }}
                                                className="min-h-[44px] border border-ink-200 px-4 text-[13px] text-ink-600 transition-colors duration-200 hover:border-ink-900 hover:text-ink-900"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                renderResults()
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    function renderResults() {
        if (!results) return null;

        if (totalResults === 0) {
            return (
                <div className="py-10 text-center">
                    <p className="text-sm text-ink-600">Nema rezultata za &ldquo;{query}&rdquo;</p>
                    <p className="mt-1 text-[13px] text-ink-500">Pokušajte sa drugim pojmom</p>
                </div>
            );
        }

        flatIndex = 0;

        return (
            <>
                {/* Products */}
                {results.products.length > 0 && (
                    <div id="search-results-list">
                        <div className="border-b border-ink-200 pb-2">
                            <span className="eyebrow">
                                Proizvodi ({results.products.length})
                            </span>
                        </div>
                        {results.products.map((product) => {
                            const idx = flatIndex++;
                            return (
                                <Link
                                    key={product.id}
                                    href={product.url || `/proizvodi/${product.slug}`}
                                    onClick={handleResultClick}
                                    className={`flex items-center gap-4 border-b border-ink-200 px-1 py-3 transition-colors duration-200 hover:bg-paper ${idx === activeIndex ? 'bg-paper' : ''
                                        }`}
                                >
                                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden bg-paper">
                                        <ProductImage
                                            src={product.image}
                                            alt={product.name}
                                            sources={product.imageCandidates}
                                            sizes="48px"
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm text-ink-900">{product.name}</p>
                                        {product.price && (
                                            <p className="text-[13px] text-ink-600">{formatPrice(product.price)}</p>
                                        )}
                                        {!product.price && product.subtitle && (
                                            <p className="truncate text-[13px] text-ink-600">{product.subtitle}</p>
                                        )}
                                    </div>
                                    <svg className="h-4 w-4 flex-shrink-0 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            );
                        })}
                    </div>
                )}

            </>
        );
    }
}
