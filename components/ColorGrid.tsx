'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

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
}

interface ColorGridProps {
  collectionSlug: string;
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

function ImageWithFallback({ src, alt, className, sizes, priority, quality }: any) {
  const [errored, setErrored] = useState(false);
  const normalized = normalizeSrc(src);

  if (!normalized || errored) {
    // Render a regular img with placeholder to avoid Next/Image crashes when src is empty
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/images/placeholder.svg"
        alt={alt}
        className={className}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  }

  return (
    <Image
      src={normalized}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      quality={quality}
      unoptimized
      priority={priority}
      onError={() => setErrored(true)}
    />
  );
}

export default function ColorGrid({ collectionSlug }: ColorGridProps) {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);

  useEffect(() => {
    // Validate collectionSlug
    if (!collectionSlug || typeof collectionSlug !== 'string') {
      console.error('ColorGrid: Invalid collectionSlug', collectionSlug);
      setLoading(false);
      return;
    }

    fetch('/data/lvt_colors_complete.json')
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

        // Extract collection name from slug
        // e.g., "gerflor-creation-30" → "creation-30"
        // e.g., "creation-saga2-terra-35021566" → "creation-saga2"
        // e.g., "creation-55-clic-acoustic-ball-39750555" → "creation-55-clic-acoustic"
        let collectionName = collectionSlug.replace('gerflor-', '');

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

        const filtered = data.colors.filter((c: Color) => c.collection === collectionName || c.collection === collectionSlug);

        // Normalize urls inside colors to make rendering consistent
        const normalizedColors = filtered.map((c: Color) => ({
          ...c,
          image_url: normalizeSrc(c.image_url),
          texture_url: normalizeSrc(c.texture_url),
          lifestyle_url: normalizeSrc(c.lifestyle_url),
        }));

        setColors(normalizedColors);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading colors:', err);
        setLoading(false);
      });
  }, [collectionSlug]);

  const filteredColors = useMemo(() => {
    return colors.filter(color =>
      (color.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (color.code || '').includes(searchTerm)
    );
  }, [colors, searchTerm]);

  // Keyboard navigation
  useEffect(() => {
    if (selectedColorIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedColorIndex(null);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedColorIndex(prev => {
          if (prev === null) return null;
          return (prev - 1 + filteredColors.length) % filteredColors.length;
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedColorIndex(prev => {
          if (prev === null) return null;
          return (prev + 1) % filteredColors.length;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedColorIndex, filteredColors]);

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
      {/* Header */}
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

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredColors.map((color, index) => (
          <button
            key={color.slug}
            onClick={() => setSelectedColorIndex(index)}
            className="group bg-white rounded-lg shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-200 text-left cursor-pointer focus:outline-none"
          >
            {/* Image */}
            <div className="aspect-square relative overflow-hidden bg-gray-100">
              {(color.texture_url || color.image_url) ? (
                <ImageWithFallback
                  src={color.texture_url || color.image_url || ''}
                  alt={color.full_name}
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  quality={100}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Bez slike</div>
              )}

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="font-semibold text-gray-900 text-sm truncate">{color.code}</p>
              <p className="text-xs text-gray-600 truncate mt-1">{color.name}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Gallery Modal */}
      {selectedColorIndex !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedColorIndex(null)}>
          <div className="max-w-6xl w-full relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedColorIndex(null)} className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
              {filteredColors[selectedColorIndex] && (
                <>
                  <div className="relative aspect-video bg-gray-100">
                    <ImageWithFallback
                      src={filteredColors[selectedColorIndex].texture_url || filteredColors[selectedColorIndex].image_url || ''}
                      alt={filteredColors[selectedColorIndex].full_name}
                      className="object-contain"
                      sizes="90vw"
                      priority
                      quality={100}
                    />
                  </div>
                  <div className="p-6 bg-white">
                    <h3 className="text-2xl font-bold text-gray-900">{filteredColors[selectedColorIndex].name}</h3>
                    <p className="text-gray-600 mt-2">Šifra: {filteredColors[selectedColorIndex].code}</p>
                  </div>
                </>
              )}
            </div>

            {filteredColors.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setSelectedColorIndex((selectedColorIndex - 1 + filteredColors.length) % filteredColors.length); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 rounded-full p-3 shadow-lg transition-all">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setSelectedColorIndex((selectedColorIndex + 1) % filteredColors.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 rounded-full p-3 shadow-lg transition-all">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}

            {filteredColors.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {filteredColors.map((color, index) => (
                  <button key={color.slug} onClick={(e) => { e.stopPropagation(); setSelectedColorIndex(index); }} className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${index === selectedColorIndex ? 'border-primary-600 ring-2 ring-primary-400' : 'border-transparent hover:border-gray-400'}`}>
                    <ImageWithFallback
                      src={color.texture_url || color.image_url || ''}
                      alt={color.full_name}
                      className="object-cover"
                      sizes="(max-width: 768px) 20vw, 10vw"
                      quality={100}
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white text-sm">{selectedColorIndex + 1} / {filteredColors.length}</div>
          </div>
        </div>
      )}

      {filteredColors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Nije pronađena nijed na boja sa "{searchTerm}"</p>
          <button onClick={() => setSearchTerm('')} className="mt-4 text-primary-600 hover:text-primary-700 font-medium">Očisti pretragu</button>
        </div>
      )}
    </div>
  );
}
