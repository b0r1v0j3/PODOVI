'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

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
  }) => void;
  compact?: boolean;
  initialColorSlug?: string;
  limit?: number;
  onColorsLoaded?: (count: number) => void;
}

function normalizeSrc(raw?: string | null) {
  if (!raw) return '';
  let p = String(raw);
  try {
    p = decodeURI(p);
  } catch (e) {
    // ignore
  }
  p = p.replace(/\\/g, '/');
  // remove duplicate slashes but keep leading '/'
  p = p.replace(/\/\/+/g, '/');
  if (!p.startsWith('/')) p = '/' + p;
  return p;
}

function ImageWithFallback({ src, alt, className }: any) {
  const [imgSrc, setImgSrc] = useState(() => normalizeSrc(src));

  return (
    <img
      src={imgSrc || '/images/placeholder.svg'}
      alt={alt}
      className={className}
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
}: ColorGridProps) {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const hasAutoSelected = useRef(false);

  // Extract collection name for URL construction
  const getCollectionName = (slug: string): string => {
    let collectionName = slug.replace('gerflor-', '');
    if (collectionName.startsWith('creation-')) {
      const parts = collectionName.split('-');
      if (parts.length >= 2) {
        if (parts.length >= 4 && parts[2] === 'clic' && parts[3] === 'acoustic') {
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
  const handleColorClick = (color: Color) => {
    if (onColorSelect) {
      // Use lifestyle_url if available, otherwise texture_url or image_url
      // URLs are already normalized in the useEffect
      const imageUrl = color.lifestyle_url || color.texture_url || color.image_url || '';
      const imageAlt = color.full_name || color.name || '';
      const colorCode = color.code || '';
      const colorName = color.name || '';
      const characteristics = buildCharacteristics(color);
      
      // Ensure URL is normalized
      const normalizedUrl = normalizeSrc(imageUrl);
      
      if (normalizedUrl) {
        onColorSelect({ imageUrl: normalizedUrl, imageAlt, colorCode, colorName, characteristics });
      } else {
        console.warn('ColorGrid: No valid image URL for color', color);
      }
    }
  };

  useEffect(() => {
    // Validate collectionSlug
    if (!collectionSlug || typeof collectionSlug !== 'string') {
      console.error('ColorGrid: Invalid collectionSlug', collectionSlug);
      setLoading(false);
      return;
    }

    const collectionName = getCollectionName(collectionSlug);

    // Determine which JSON to load based on collection slug
    const isLinoleum = collectionSlug.startsWith('dlw-');
    const jsonPath = isLinoleum ? '/data/linoleum_colors_complete.json' : '/data/lvt_colors_complete.json';

    fetch(jsonPath)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch colors: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (!data || !data.colors || !Array.isArray(data.colors)) {
          console.error('ColorGrid: Invalid data structure', data);
          setLoading(false);
          return;
        }

        const filtered = data.colors.filter((c: Color) => c.collection === collectionName || c.collection === collectionSlug);

        // Normalize urls inside colors to make rendering consistent
        const normalizedColors = filtered.map((c: Color) => ({
          ...c,
          image_url: normalizeSrc(c.image_url),
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
  }, [collectionSlug]);

  useEffect(() => {
    if (!initialColorSlug || !onColorSelect || hasAutoSelected.current || colors.length === 0) {
      return;
    }

    const match = colors.find(color => color.slug === initialColorSlug);
    if (match) {
      hasAutoSelected.current = true;
      handleColorClick(match);
    }
  }, [colors, initialColorSlug, onColorSelect]);

  const filteredColors = useMemo(() => {
    return colors.filter(color =>
      (color.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (color.code || '').includes(searchTerm)
    );
  }, [colors, searchTerm]);

  const visibleColors = useMemo(() => {
    if (typeof limit === 'number' && limit > 0) {
      return filteredColors.slice(0, limit);
    }
    return filteredColors;
  }, [filteredColors, limit]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Učitavam boje...</p>
      </div>
    );
  }

  if (colors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header - only show if not compact */}
      {!compact && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dostupne boje</h2>
            <p className="text-gray-600 mt-1">{colors.length} {colors.length === 1 ? 'boja' : colors.length < 5 ? 'boje' : 'boja'}</p>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Pretraži po šifri ili nazivu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
            )}
          </div>
        </div>
      )}


      {/* Grid */}
      <div className={`grid gap-3 ${compact ? 'grid-cols-4 md:grid-cols-5 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
        {visibleColors.map((color) => (
          <button
            key={color.slug}
            onClick={() => handleColorClick(color)}
            className="group bg-white rounded-lg shadow-sm hover:shadow-lg transition-all overflow-hidden border-2 border-gray-200 hover:border-primary-500 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {/* Image */}
            <div className="aspect-square relative overflow-hidden bg-gray-100">
              {(color.texture_url || color.image_url) ? (
                <ImageWithFallback
                  src={color.texture_url || color.image_url || ''}
                  alt={color.full_name}
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes={compact ? "(max-width: 768px) 25vw, 15vw" : "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"}
                  quality={100}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Bez slike</div>
              )}
            </div>

            {/* Info - only show if not compact */}
            {!compact && (
              <div className="p-3">
                <p className="font-semibold text-gray-900 text-sm truncate">{color.code}</p>
                <p className="text-xs text-gray-600 truncate mt-1">{color.name}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {filteredColors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Nije pronađena nijed na boja sa "{searchTerm}"</p>
          <button onClick={() => setSearchTerm('')} className="mt-4 text-primary-600 hover:text-primary-700 font-medium">Očisti pretragu</button>
        </div>
      )}
    </div>
  );
}
