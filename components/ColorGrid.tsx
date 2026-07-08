'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getPrimaryColorImage } from '@/lib/utils/product-images';

interface Color {
  collection: string;
  collection_name: string;
  code: string;
  name: string;
  full_name: string;
  slug: string;
  image_url?: string;
  texture_url?: string;
  lifestyle_url?: string;
  image_count: number;
  welding_rod?: string;
  dimension?: string;
  format?: string;
  overall_thickness?: string;
  characteristics?: Record<string, string>;
}

interface ColorGridProps {
  collectionSlug: string;
  onColorSelect?: (payload: {
    imageUrl: string;
    imageAlt: string;
    colorCode?: string;
    colorName?: string;
    characteristics?: Record<string, string>;
    colorSlug?: string;
  }) => void;
  compact?: boolean;
  initialColorSlug?: string;
  limit?: number;
  onColorsLoaded?: (count: number) => void;
  selectedColorSlug?: string; // Slug of currently selected color for highlighting

  customColors?: Color[]; // Optional custom colors to use instead of fetching
  apiCategory?: string;
  uiMode?: 'colors' | 'variants';
}

function normalizeSrc(raw?: string | null) {
  if (!raw) return '';
  let p = String(raw).trim();
  try {
    p = decodeURI(p);
  } catch (e) {
    // ignore
  }
  p = p.replace(/\\/g, '/');
  // remove duplicate slashes but keep leading '/' (only for relative paths)
  if (!p.startsWith('http://') && !p.startsWith('https://')) {
    p = p.replace(/\/\/+/g, '/');
    if (!p.startsWith('/')) p = '/' + p;
  }
  return p;
}

function ImageWithFallback({ src, alt, className }: any) {
  const [imgSrc, setImgSrc] = useState(() => normalizeSrc(src));

  return (
    <img
      src={imgSrc || '/images/placeholder.svg'}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }}
      onError={() => setImgSrc('/images/placeholder.svg')}
    />
  );
}

function buildCharacteristics(color: Color): Record<string, string> | undefined {
  if (color.characteristics && Object.keys(color.characteristics).length > 0) {
    return color.characteristics;
  }

  const characteristics: Record<string, string> = {};
  if (color.format) {
    characteristics['Format'] = color.format;
  }
  if (color.overall_thickness) {
    characteristics['Ukupna debljina'] = color.overall_thickness;
  }
  if (color.dimension) {
    characteristics['Dimenzije'] = color.dimension;
  }
  if (color.welding_rod) {
    characteristics['Šifra šipke za varenje'] = color.welding_rod;
  }

  return Object.keys(characteristics).length > 0 ? characteristics : undefined;
}

export default function ColorGrid({
  collectionSlug,
  onColorSelect,
  compact = false,
  initialColorSlug,
  limit,
  onColorsLoaded,
  selectedColorSlug,
  customColors,
  apiCategory,
  uiMode = 'colors',
}: ColorGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [colors, setColors] = useState<Color[]>(customColors || []);
  const [loading, setLoading] = useState(!customColors);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const hasAutoSelected = useRef(false);
  const uiText = useMemo(() => (
    uiMode === 'variants'
      ? {
        loading: 'Učitavam varijante...',
        available: 'Dostupne varijante',
        count: (count: number) => count === 1 ? 'varijanta' : 'varijanti',
        empty: 'nijedna varijanta',
      }
      : {
        loading: 'Učitavam boje...',
        available: 'Dostupne boje',
        count: (_count: number) => 'boja',
        empty: 'nijedna boja',
      }
  ), [uiMode]);

  // Pagination settings for compact mode
  // In compact mode, show 12 colors per page (2 rows x 6 columns)
  const itemsPerPage = compact ? 12 : 20;

  // Track selected color slug for highlighting
  const [currentSelectedSlug, setCurrentSelectedSlug] = useState<string | undefined>(selectedColorSlug || initialColorSlug);

  // Update selected slug when prop changes
  useEffect(() => {
    setCurrentSelectedSlug(selectedColorSlug || initialColorSlug);
  }, [selectedColorSlug, initialColorSlug]);

  // Extract collection name for URL construction
  const getCollectionName = (slug: string): string => {
    let collectionName = slug.replace(/^(gerflor|tarkett|wolflor|podovi)-/, '');
    if (collectionName.startsWith('creation-')) {
      const parts = collectionName.split('-');
      if (parts.length >= 2) {
        // Handle "looselay-acoustic" or "clic-acoustic" - need to include "acoustic" in collection name
        if (parts.length >= 4 && parts[2] === 'clic' && parts[3] === 'acoustic') {
          collectionName = parts.slice(0, 4).join('-');
        } else if (parts.length >= 4 && parts[2] === 'looselay' && parts[3] === 'acoustic') {
          collectionName = parts.slice(0, 4).join('-');
        } else if (
          parts.length >= 3 &&
          ['looselay', 'clic', 'zen', 'connect', 'megaclic', 'saga2'].includes(parts[2])
        ) {
          collectionName = parts.slice(0, 3).join('-');
        } else {
          collectionName = parts.slice(0, 2).join('-');
        }
      }
    }
    return collectionName;
  };

  // Handle color selection
  const handleColorClick = useCallback((color: Color, event?: React.MouseEvent) => {
    // Update selected slug
    setCurrentSelectedSlug(color.slug);

    // If in compact mode (ProductColorSelector) ILI pattern-grupa (parket po meri, non-compact),
    // update URL with ?color= and update hero image. (Bez ovoga non-compact klik ne radi ništa.)
    if (compact || (color as { isPatternGroup?: boolean }).isPatternGroup) {
      // Update URL with ?color= parameter
      // Use replace instead of push to avoid creating unnecessary history entries
      // when changing colors on the same page
      const params = new URLSearchParams(searchParams);
      params.set('color', color.slug);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      // Also call onColorSelect if provided
      if (onColorSelect) {
        const primaryColorImage = getPrimaryColorImage(color);
        const imageUrl = primaryColorImage?.url || '';
        const imageAlt = primaryColorImage?.alt || color.full_name || color.name || '';
        const colorCode = color.code || '';
        const colorName = color.name || '';
        const characteristics = buildCharacteristics(color);

        // Ensure URL is normalized
        const normalizedUrl = normalizeSrc(imageUrl);

        if (normalizedUrl) {
          onColorSelect({ imageUrl: normalizedUrl, imageAlt, colorCode, colorName, characteristics, colorSlug: color.slug });
        } else {
          console.warn('ColorGrid: No valid image URL for color', color);
        }
      }
      return;
    }

    // If not in compact mode, navigate to individual color page
    // (Link will handle navigation)
  }, [compact, onColorSelect, pathname, router, searchParams]);

  useEffect(() => {
    hasAutoSelected.current = false;
  }, [collectionSlug, initialColorSlug]);

  useEffect(() => {
    // If custom colors provided, use them and skip fetch (dedupe by slug)
    if (customColors && customColors.length > 0) {
      const seen = new Set<string>();
      const deduped = customColors.filter((c: Color) => {
        if (!c.slug) return true;
        if (seen.has(c.slug)) return false;
        seen.add(c.slug);
        return true;
      });
      setColors(deduped);
      setLoading(false);
      if (onColorsLoaded) {
        onColorsLoaded(deduped.length);
      }
      return;
    }
    if (customColors && customColors.length === 0) {
      setColors([]);
      setLoading(false);
      if (onColorsLoaded) onColorsLoaded(0);
      return;
    }

    // Parket kolekcije (allegro, privilege, ...) – NIKAD ne učitavati iz LVT JSON-a (prikazivalo bi winter-832)
    const parketCollectionSlugs = ['allegro', 'privilege', 'privilege-waltz', 'rumba', 'salsa', 'salsa-art', 'salsa-premium', 'sommer-europarquet', 'step-xl-and-l', 'tango', 'tango-classic'];
    if (collectionSlug && parketCollectionSlugs.includes(collectionSlug)) {
      setColors([]);
      setLoading(false);
      if (onColorsLoaded) onColorsLoaded(0);
      return;
    }

    // Validate collectionSlug
    if (!collectionSlug || typeof collectionSlug !== 'string') {
      console.error('ColorGrid: Invalid collectionSlug', collectionSlug);
      setLoading(false);
      return;
    }

    const collectionName = getCollectionName(collectionSlug);

    // Determine which category to load from API
    const sportCollectionSlugs = ['dlw-colorette-sport', 'dlw-marmorette-sport-32mm', 'dlw-linodur-sport'];
    const industrialCollectionSlugs = ['gti-max-cleantech', 'gti-max-connect', 'gti-pure-connect', 'attraction-connect'];
    const normalizedCollectionSlug = collectionSlug.replace(/^(gerflor|tarkett|wolflor|podovi)-/, '');
    const isSport = sportCollectionSlugs.includes(normalizedCollectionSlug);
    const isIndustrial = industrialCollectionSlugs.includes(normalizedCollectionSlug);
    const isLinoleum = !isSport && normalizedCollectionSlug.startsWith('dlw-');
    const isCarpet = collectionSlug.startsWith('armonia-') || collectionSlug.startsWith('gerflor-armonia-');
    // Vinil includes mipolam collections and heterogeneous collections (nerok-55, nerok-70, premium-acoustic, etc.)
    const heterogeneousSlugs = ['nerok-55', 'nerok-70', 'premium-acoustic', 'premium-compact',
      'taralay-impression-acoustic', 'taralay-impression-compact',
      'taralay-impression-hop-acoustic', 'taralay-impression-hop-compact',
      'taralay-initial-acoustic', 'taralay-initial-compact',
      'taralay-millenium-acoustic', 'taralay-millenium-compact'];
    const collectionNameWithoutPrefix = collectionSlug.replace(/^(gerflor|tarkett|wolflor|podovi)-/, '');
    const isVinil = collectionSlug.startsWith('mipolam-') ||
      collectionSlug.startsWith('gerflor-mipolam-') ||
      collectionSlug.startsWith('wolflor-') ||
      heterogeneousSlugs.includes(collectionNameWithoutPrefix) ||
      heterogeneousSlugs.some(slug => collectionSlug.includes(slug));
    const categoryParam = apiCategory || (
      isSport
        ? 'sport'
        : isIndustrial
          ? 'industrijske-ploce'
          : isLinoleum
            ? 'linoleum'
            : isCarpet
              ? 'tekstilne-ploce'
              : isVinil
                ? 'vinil'
                : 'lvt'
    );
    const jsonPath = `/api/colors?category=${categoryParam}`;

    fetch(jsonPath)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch colors: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        let filtered: Color[] = [];

        // Handle different JSON structures
        if (data.collections && Array.isArray(data.collections)) {
          // Nested categories have collections[].colors structure
          // Normalize collection slug - remove 'order' suffix if present
          const normalizedSlug = collectionSlug.replace(/^(gerflor|tarkett|wolflor|podovi)-/, '').replace('-order', '');
          const normalizedCollectionName = collectionName.replace('-order', '');

          const collection = data.collections.find((col: any) =>
            col.slug === collectionName ||
            col.slug === collectionSlug ||
            col.slug === collectionSlug.replace(/^(gerflor|tarkett|wolflor|podovi)-/, '') ||
            col.slug === normalizedSlug ||
            col.slug === normalizedCollectionName ||
            (col.slug && col.slug.replace('-order', '') === normalizedSlug)
          );

          if (collection && collection.colors) {
            filtered = collection.colors.map((color: any) => ({
              ...color,
              collection: collection.slug,
              collection_name: collection.name,
              collection_slug: collection.slug,
              full_name: `${color.code} ${color.name}`,
              slug: color.slug || `${collection.slug}-${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}`,
              image_url: color.image || color.image_url,
            })) as Color[];
          }
        } else if (data.colors && Array.isArray(data.colors)) {
          // LVT/Linoleum/Carpet have colors array
          // Filter by collection - try exact match first, then with/without 'gerflor-' prefix
          // Saga: slug je gerflor-creation-saga, u JSON-u je creation-saga2
          const sagaMatch = (collectionName === 'creation-saga' || collectionSlug === 'gerflor-creation-saga') ? 'creation-saga2' : null;
          filtered = data.colors.filter((c: Color) =>
            c.collection === collectionName ||
            c.collection === collectionSlug ||
            c.collection === `gerflor-${collectionName}` ||
            c.collection.replace(/^(gerflor|tarkett|wolflor)-/, '') === collectionName ||
            (sagaMatch !== null && c.collection === sagaMatch)
          );
        } else {
          console.error('ColorGrid: Invalid data structure', data);
          setLoading(false);
          return;
        }

        // Normalize urls inside colors to make rendering consistent
        const normalizedColors = filtered.map((c: Color) => ({
          ...c,
          image_url: normalizeSrc(c.image_url || (c as any).image),
          texture_url: normalizeSrc(c.texture_url),
          lifestyle_url: normalizeSrc(c.lifestyle_url),
        }));

        setColors(normalizedColors);
        if (onColorsLoaded) {
          onColorsLoaded(normalizedColors.length);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading colors:', err);
        setColors([]);
        setLoading(false);
      });
  }, [apiCategory, collectionSlug, customColors, onColorsLoaded]);

  // Preload all color images for instant switching (avoids white flash on color change)
  // Store URLs in state to render hidden img elements in DOM
  const [preloadUrls, setPreloadUrls] = useState<string[]>([]);

  useEffect(() => {
    if (colors.length === 0) return;

    const urls: string[] = [];
    colors.forEach((color: Color) => {
      const imageUrl = getPrimaryColorImage(color)?.url;
      if (imageUrl) {
        urls.push(imageUrl);
      }
    });
    setPreloadUrls(urls);
  }, [colors]);

  const filteredColors = useMemo(() => {
    return colors.filter(color =>
      (color.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (color.code || '').includes(searchTerm)
    );
  }, [colors, searchTerm]);

  // Auto-select first color or initial color when colors are loaded
  useEffect(() => {
    if (!onColorSelect || hasAutoSelected.current || colors.length === 0) {
      return;
    }

    if (!initialColorSlug) {
      return;
    }

    const colorToSelect = filteredColors.find(color => color.slug === initialColorSlug);

    if (colorToSelect) {
      hasAutoSelected.current = true;
      setCurrentSelectedSlug(colorToSelect.slug);
      handleColorClick(colorToSelect);

      // If in compact mode with pagination, navigate to the page containing this color
      if (compact) {
        const index = filteredColors.findIndex(c => c.slug === colorToSelect.slug);
        if (index >= 0) {
          setCurrentPage(Math.floor(index / itemsPerPage));
        }
      }
    }
  }, [colors, initialColorSlug, onColorSelect, compact, filteredColors, itemsPerPage, handleColorClick]);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  // Pagination for compact mode - use ALL filteredColors, not limited
  const totalPages = useMemo(() => {
    if (!compact) {
      return 1;
    }
    // Calculate pages based on ALL filteredColors (not limited)
    const pages = Math.ceil(filteredColors.length / itemsPerPage);
    return pages > 1 ? pages : 1;
  }, [filteredColors.length, itemsPerPage, compact]);

  // Pagination for compact mode - show all colors with pagination
  const paginatedColors = useMemo(() => {
    if (!compact || totalPages <= 1) {
      // If not compact or no pagination needed, return filteredColors (all colors)
      return filteredColors;
    }
    const startIndex = currentPage * itemsPerPage;
    return filteredColors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredColors, currentPage, itemsPerPage, compact, totalPages]);

  // Grupisanje po pod-liniji (spec 'Podkolekcija' — npr. Artisan: Chalet/Herringbone/
  // Palace/Cottage/Chevron/Project/Lounge). Samo u punom (modal) prikazu i samo kad
  // SVAKA boja nosi liniju a postoje bar 2 različite — inače ostaje ravan grid.
  const subcollectionGroups = useMemo(() => {
    if (compact) return null;
    const groups = new Map<string, Color[]>();
    for (const color of paginatedColors) {
      const line = String(((color as { characteristics?: Record<string, string> }).characteristics || {})['Podkolekcija'] || '').trim();
      if (!line) return null;
      const group = groups.get(line) || [];
      group.push(color);
      groups.set(line, group);
    }
    return groups.size >= 2 ? Array.from(groups.entries()) : null;
  }, [paginatedColors, compact]);

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPrevious = () => {
    goToPage(currentPage - 1);
  };

  const goToNext = () => {
    goToPage(currentPage + 1);
  };

  if (loading) {
    return (
      <div
        role="status"
        aria-busy="true"
        className={`grid gap-3 ${compact ? 'grid-cols-6' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}
        aria-label={uiText.loading}
      >
        {Array.from({ length: compact ? 12 : 10 }).map((_, idx) => (
          <div key={idx} className="aspect-square bg-paper animate-pulse" />
        ))}
      </div>
    );
  }

  if (colors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Hidden preload images - browser downloads these in background */}
      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', visibility: 'hidden' }}>
        {preloadUrls.map((url, idx) => (
          <img key={idx} src={url} alt="" />
        ))}
      </div>
      {/* Header - only show if not compact */}
      {!compact && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="eyebrow">{uiText.available}</h2>
            <p className="text-[13px] text-ink-500 mt-1">{colors.length} {uiText.count(colors.length)}</p>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Pretraži po šifri ili nazivu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input text-sm py-2 sm:w-64"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-0 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-600">✕</button>
            )}
          </div>
        </div>
      )}

      {/* Grid — items-start: kartice poravnate na vrh (slike u istoj ravni i kad liste imena
           različite dužine, npr. pattern-grupe Rhombus 11 / Waves 4).
           Sa pod-linijama: jedna sekcija po liniji sa hairline podnaslovom. */}
      {(subcollectionGroups || [[null, paginatedColors] as [string | null, Color[]]]).map(([groupLabel, groupColors]) => (
        <div key={groupLabel ?? 'sve'}>
          {groupLabel && (
            <div className="mt-6 mb-3 flex items-baseline gap-3 border-b border-ink-200 pb-2 first:mt-0">
              <h3 className="eyebrow">{groupLabel}</h3>
              <span className="text-[12px] text-ink-500">{groupColors.length}</span>
            </div>
          )}
          <div className={`grid items-start gap-3 ${compact ? 'grid-cols-6 mb-4' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
        {groupColors.map((color) => {
          const isSelected = currentSelectedSlug === color.slug;
          const primaryColorImage = getPrimaryColorImage(color);
          const isGroup = Boolean((color as { variantList?: string[] }).variantList);
          const hideImage = Boolean((color as { hideImage?: boolean }).hideImage);
          return (
            <button
              key={color.slug}
              onClick={() => handleColorClick(color)}
              className={`group overflow-hidden border-2 text-left cursor-pointer w-full transition-colors ${isSelected
                ? 'border-ink-900'
                : 'border-transparent hover:border-ink-200'
                }`}
            >
              {/* Image — pattern-grupe: uspravan okvir + object-contain (cela foto, bez sečenja).
                   hideImage (jedna deljena generička slika, npr. Four Seasons baner) → bez slike. */}
              {!hideImage && (
                <div className={`${isGroup ? 'aspect-[3/4]' : 'aspect-square'} relative overflow-hidden bg-paper`}>
                  {primaryColorImage?.url ? (
                    <ImageWithFallback
                      src={primaryColorImage.url}
                      alt={primaryColorImage.alt || color.full_name}
                      className={`${isGroup ? 'object-contain' : 'object-cover'} group-hover:scale-[1.03] transition-transform duration-700`}
                      sizes={compact ? "(max-width: 768px) 25vw, 15vw" : "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"}
                      quality={100}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-500 text-xs">Bez slike</div>
                  )}
                </div>
              )}

              {/* Info - only show if not compact */}
              {!compact && (
                (color as { variantList?: string[] }).variantList ? (
                  <div className="px-1 pt-2 pb-3">
                    <p className="text-[13px] text-ink-900">{color.name}</p>
                    <p className="eyebrow mt-0.5">{color.code}</p>
                    <p className="text-[11px] text-ink-500 mt-1.5 leading-relaxed">
                      {((color as { variantList?: string[] }).variantList || []).join(' · ')}
                    </p>
                  </div>
                ) : (
                  <div className="px-1 pt-2 pb-3">
                    <p className="text-[13px] text-ink-900 truncate">{color.code}</p>
                    {color.collection_name && (
                      <p className="eyebrow truncate mt-0.5">{color.collection_name}</p>
                    )}
                    <p className="text-[13px] text-ink-600 truncate mt-1">{color.name}</p>
                  </div>
                )
              )}
            </button>
          );
        })}
          </div>
        </div>
      ))}

      {/* Pagination Controls - below grid for compact mode */}
      {compact && totalPages > 1 && (
        <div className="flex flex-col items-center gap-2 mt-4">
          {/* Arrows */}
          <div className="flex items-center gap-4">
            <button
              onClick={goToPrevious}
              disabled={currentPage === 0}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center bg-white border border-ink-200 hover:border-ink-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Prethodna strana"
            >
              <svg className="w-5 h-5 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page Indicators (dots) */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                  className="py-3 px-0.5"
                  aria-label={`Strana ${index + 1}`}
                >
                  <span
                    className={`block h-[3px] transition-all ${index === currentPage
                      ? 'w-6 bg-ink-900'
                      : 'w-2 bg-ink-200 hover:bg-ink-400'
                      }`}
                  />
                </button>
              ))}
            </div>

            <button
              onClick={goToNext}
              disabled={currentPage === totalPages - 1}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center bg-white border border-ink-200 hover:border-ink-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Sledeća strana"
            >
              <svg className="w-5 h-5 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {filteredColors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-ink-600">Nije pronađena {uiText.empty} sa &quot;{searchTerm}&quot;</p>
          <button onClick={() => setSearchTerm('')} className="btn-link mt-4">Očisti pretragu</button>
        </div>
      )}
    </div>
  );
}
