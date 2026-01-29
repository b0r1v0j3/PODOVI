"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Brand, ProductFilters as IProductFilters } from '@/types';

interface ProductFiltersProps {
  availableBrands: Brand[];
  currentFilters: IProductFilters;
  availableCollections?: string[]; // For LVT collection filter
  availableThickness?: string[]; // For LVT overall thickness filter
  availableThicknessByType?: { homogeni: string[]; heterogeni: string[] }; // For Vinil thickness by type
}

export default function ProductFilters({ availableBrands, currentFilters, availableCollections, availableThickness, availableThicknessByType }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const isVinilCategory = pathname?.includes('/kategorije/vinil');
  const isLVTCategory = pathname?.includes('/kategorije/lvt') || pathname?.includes('/kategorije/parket');
  const isLinoleumCategory = pathname?.includes('/kategorije/linoleum');
  const currentType = searchParams.get('type');
  const currentCollections = searchParams.get('collections');
  const currentThickness = searchParams.get('thickness');
  
  const [search, setSearch] = useState(currentFilters.search || '');
  const [selectedBrands, setSelectedBrands] = useState<string[]>(currentFilters.brandIds || []);
  const [priceMin, setPriceMin] = useState(currentFilters.priceMin?.toString() || '');
  const [priceMax, setPriceMax] = useState(currentFilters.priceMax?.toString() || '');
  const [vinylType, setVinylType] = useState<'homogeni' | 'heterogeni' | null>(
    currentType === 'homogeni' ? 'homogeni' : currentType === 'heterogeni' ? 'heterogeni' : null
  );
  const [selectedCollections, setSelectedCollections] = useState<string[]>(
    currentCollections ? currentCollections.split(',') : []
  );
  const [selectedThickness, setSelectedThickness] = useState<string[]>(
    currentThickness ? currentThickness.split(',') : []
  );

  // Sync state with URL params when they change externally (e.g., browser back/forward)
  // This ensures state stays in sync with URL, but we skip updates that would cause loops
  const isSyncingRef = useRef(false);
  
  useEffect(() => {
    // Skip if we're currently applying filters (to avoid loops)
    if (isSyncingRef.current) return;
    
    const urlSearch = searchParams.get('search') || '';
    const urlBrands = searchParams.get('brands')?.split(',').filter(Boolean) || [];
    const urlPriceMin = searchParams.get('priceMin') || '';
    const urlPriceMax = searchParams.get('priceMax') || '';
    const urlType = searchParams.get('type');
    const urlCollections = searchParams.get('collections')?.split(',').filter(Boolean) || [];
    const urlThickness = searchParams.get('thickness')?.split(',').filter(Boolean) || [];

    // Only update state if URL values differ (to avoid infinite loops)
    if (urlSearch !== search) setSearch(urlSearch);
    if (JSON.stringify([...urlBrands].sort()) !== JSON.stringify([...selectedBrands].sort())) setSelectedBrands(urlBrands);
    if (urlPriceMin !== priceMin) setPriceMin(urlPriceMin);
    if (urlPriceMax !== priceMax) setPriceMax(urlPriceMax);
    if (isVinilCategory) {
      const newType = urlType === 'homogeni' ? 'homogeni' : urlType === 'heterogeni' ? 'heterogeni' : null;
      if (newType !== vinylType) setVinylType(newType);
    }
    if (isLVTCategory && JSON.stringify([...urlCollections].sort()) !== JSON.stringify([...selectedCollections].sort())) {
      setSelectedCollections(urlCollections);
    }
    if ((isLVTCategory || isVinilCategory || isLinoleumCategory) && JSON.stringify([...urlThickness].sort()) !== JSON.stringify([...selectedThickness].sort())) {
      setSelectedThickness(urlThickness);
    }
  }, [searchParams]);

  // Auto-remove incompatible thicknesses when vinyl type changes
  useEffect(() => {
    if (isVinilCategory && availableThicknessByType && vinylType && selectedThickness.length > 0) {
      const availableForType = vinylType === 'homogeni' 
        ? availableThicknessByType.homogeni 
        : vinylType === 'heterogeni' 
        ? availableThicknessByType.heterogeni 
        : [];
      
      const validThicknesses = selectedThickness.filter(t => availableForType.includes(t));
      if (validThicknesses.length !== selectedThickness.length) {
        setSelectedThickness(validThicknesses);
      }
    }
  }, [vinylType, isVinilCategory, availableThicknessByType]);

  // Auto-apply filters when values change (with debounce for search)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip auto-apply on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Mark that we're syncing to prevent URL sync from triggering
    isSyncingRef.current = true;

    const params = new URLSearchParams(searchParams);
    
    // Clear only filter params we control, keep other params (like 'color' for LVT tabs)
    params.delete('search');
    params.delete('brands');
    params.delete('priceMin');
    params.delete('priceMax');
    params.delete('type');
    params.delete('collections');
    params.delete('thickness');

    // Add new filter params based on current state - ALL filters are preserved
    if (search) params.set('search', search);
    if (selectedBrands.length > 0) params.set('brands', selectedBrands.join(','));
    if (priceMin) params.set('priceMin', priceMin);
    if (priceMax) params.set('priceMax', priceMax);
    if (isVinilCategory && vinylType) params.set('type', vinylType);
    if (isLVTCategory && selectedCollections.length > 0) params.set('collections', selectedCollections.join(','));
    if ((isLVTCategory || isVinilCategory || isLinoleumCategory) && selectedThickness.length > 0) params.set('thickness', selectedThickness.join(','));

    // Debounce for search input (500ms), immediate for other filters
    const delay = search ? 500 : 0;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      router.push(`${pathname}?${params.toString()}`);
      // Reset sync flag after navigation
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 100);
    }, delay);

        return () => {
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
          }
        };
      }, [search, selectedBrands, priceMin, priceMax, vinylType, selectedCollections, selectedThickness, pathname, router, searchParams, isVinilCategory, isLVTCategory, isLinoleumCategory]);

  const clearFilters = () => {
    setSearch('');
    setSelectedBrands([]);
    setPriceMin('');
    setPriceMax('');
    setVinylType(null);
    setSelectedCollections([]);
    setSelectedThickness([]);
    router.push(pathname);
  };

  const toggleBrand = (brandId: string) => {
    setSelectedBrands(prev => 
      prev.includes(brandId) 
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  const toggleCollection = (collection: string) => {
    setSelectedCollections(prev => 
      prev.includes(collection) 
        ? prev.filter(c => c !== collection)
        : [...prev, collection]
    );
  };

  const toggleThickness = (thickness: string) => {
    setSelectedThickness(prev => 
      prev.includes(thickness) 
        ? prev.filter(t => t !== thickness)
        : [...prev, thickness]
    );
  };

  const hasActiveFilters = search || selectedBrands.length > 0 || priceMin || priceMax || (isVinilCategory && vinylType) || (isLVTCategory && selectedCollections.length > 0) || ((isLVTCategory || isVinilCategory) && selectedThickness.length > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/70 p-5 sticky top-24">
      <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Filteri</h2>

      {/* Search */}
      <div className="mb-6">
        <label className="label text-xs uppercase tracking-wide text-gray-500">Pretraga</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pretraži proizvode..."
          className="input text-sm"
        />
      </div>

      {/* Brands */}
      {availableBrands.length > 0 && (
        <div className="mb-6">
          <label className="label text-xs uppercase tracking-wide text-gray-500">Brendovi</label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableBrands.map((brand) => (
              <label key={brand.id} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand.id)}
                  onChange={() => toggleBrand(brand.id)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">{brand.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="mb-6">
        <label className="label text-xs uppercase tracking-wide text-gray-500">Cena (RSD/m²)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="Od"
            className="input text-sm"
          />
          <input
            type="number"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="Do"
            className="input text-sm"
          />
        </div>
      </div>

      {/* Collections Filter (for LVT only) */}
      {isLVTCategory && availableCollections && availableCollections.length > 0 && (
        <div className="mb-6">
          <label className="label text-xs uppercase tracking-wide text-gray-500">Kolekcije</label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableCollections.map((collection) => (
              <label key={collection} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCollections.includes(collection)}
                  onChange={() => toggleCollection(collection)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">{collection}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Vinyl Type Filter */}
      {isVinilCategory && (
        <div className="mb-6">
          <label className="label text-xs uppercase tracking-wide text-gray-500">Tip Vinila</label>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="vinylType"
                checked={vinylType === 'homogeni'}
                onChange={() => setVinylType('homogeni')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Homogeni</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="vinylType"
                checked={vinylType === 'heterogeni'}
                onChange={() => setVinylType('heterogeni')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Heterogeni</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="vinylType"
                checked={vinylType === null}
                onChange={() => setVinylType(null)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Svi</span>
            </label>
          </div>
        </div>
      )}

      {/* Overall Thickness Filter (for LVT, Vinil, and Linoleum) */}
      {(isLVTCategory || isVinilCategory || isLinoleumCategory) && availableThickness && availableThickness.length > 0 && (
        <div className="mb-6">
          <label className="label text-xs uppercase tracking-wide text-gray-500">Debljina</label>
          <div className="space-y-2">
            {availableThickness.map((thickness) => {
              // For Vinil: check if thickness is available for selected type
              let isDisabled = false;
              if (isVinilCategory && availableThicknessByType && vinylType) {
                if (vinylType === 'homogeni') {
                  isDisabled = !availableThicknessByType.homogeni.includes(thickness);
                } else if (vinylType === 'heterogeni') {
                  isDisabled = !availableThicknessByType.heterogeni.includes(thickness);
                }
              }
              
              return (
                <label 
                  key={thickness} 
                  className={`flex items-center ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedThickness.includes(thickness)}
                    onChange={() => !isDisabled && toggleThickness(thickness)}
                    disabled={isDisabled}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className={`ml-2 text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
                    {thickness} mm
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="mt-6">
          <button
            onClick={clearFilters}
            className="btn-outline w-full"
          >
            Obriši filtere
          </button>
        </div>
      )}
    </div>
  );
}
