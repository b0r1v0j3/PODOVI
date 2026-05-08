'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import ProductImage from './ProductImage';

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

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [mobileExpanded, setMobileExpanded] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
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
                setMobileExpanded(false);
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

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        const items = getAllItems();

        if (e.key === 'Escape') {
            setIsOpen(false);
            setMobileExpanded(false);
            inputRef.current?.blur();
            return;
        }

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

    const closeAndReset = () => {
        setIsOpen(false);
        setMobileExpanded(false);
        setQuery('');
        setResults(null);
        setActiveIndex(-1);
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
        <div ref={containerRef} className="relative">
            {/* Desktop search bar */}
            <div className="hidden md:flex items-center relative">
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => { if (results && totalResults > 0) setIsOpen(true); }}
                        placeholder="Pretraži proizvode..."
                        className="w-72 lg:w-80 xl:w-96 pl-9 pr-3 py-2 text-sm bg-gray-100/80 border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-400 focus:bg-white
                       transition-all duration-200 placeholder:text-gray-400"
                        aria-label="Pretraži proizvode"
                        aria-expanded={isOpen}
                        role="combobox"
                        aria-autocomplete="list"
                        aria-controls="search-results-list"
                    />
                    {isLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile search toggle */}
            <button
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => {
                    setMobileExpanded(!mobileExpanded);
                    setTimeout(() => inputRef.current?.focus(), 100);
                }}
                aria-label="Otvori pretragu"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>

            {/* Mobile expanded search */}
            {mobileExpanded && (
                <div className="md:hidden fixed inset-0 z-[60] bg-white flex flex-col">
                    <div className="flex items-center gap-3 p-4 border-b">
                        <div className="relative flex-1">
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Pretraži proizvode..."
                                className="w-full pl-9 pr-3 py-3 text-base bg-gray-50 border border-gray-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-400
                           transition-all duration-200"
                                aria-label="Pretraži proizvode"
                            />
                            {isLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => { closeAndReset(); }}
                            className="text-base text-gray-500 hover:text-gray-700 font-medium px-2"
                        >
                            Otkaži
                        </button>
                    </div>

                    {/* Mobile results area */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {query.length < 2 && !results ? (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Popularno</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {['LVT', 'Laminat', 'Parket', 'Vodootporno', 'Hrast', 'Tamno sivo', 'Belo'].map(term => (
                                            <button
                                                key={term}
                                                onClick={() => { setQuery(term); fetchResults(term); }}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-primary-50 hover:text-primary-600 transition-colors"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            renderResults()
                        )}
                    </div>
                </div>
            )}

            {/* Desktop dropdown */}
            {isOpen && results && !mobileExpanded && (
                <div className="hidden md:block absolute top-full left-1/2 mt-2 w-[28rem] -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 lg:w-[32rem]">
                    <div className="max-h-[70vh] overflow-y-auto">
                        {renderResults()}
                    </div>
                </div>
            )}
        </div>
    );

    function renderResults() {
        if (!results) return null;

        if (totalResults === 0) {
            return (
                <div className="p-6 text-center">
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm text-gray-500">Nema rezultata za &ldquo;{query}&rdquo;</p>
                    <p className="text-xs text-gray-400 mt-1">Pokušajte sa drugim pojmom</p>
                </div>
            );
        }

        flatIndex = 0;

        return (
            <>
                {/* Products */}
                {results.products.length > 0 && (
                    <div>
                        <div className="px-4 py-2 bg-gray-50 border-b">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
                                    className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${idx === activeIndex ? 'bg-primary-50' : ''
                                        }`}
                                >
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
                                        <ProductImage
                                            src={product.image}
                                            alt={product.name}
                                            sources={product.imageCandidates}
                                            sizes="48px"
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                        {product.price && (
                                            <p className="text-xs text-primary-600 font-medium">{formatPrice(product.price)}</p>
                                        )}
                                        {!product.price && product.subtitle && (
                                            <p className="text-xs text-gray-500 truncate">{product.subtitle}</p>
                                        )}
                                    </div>
                                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
