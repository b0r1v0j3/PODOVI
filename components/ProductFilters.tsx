"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Brand, ProductFilters as IProductFilters } from '@/types';
import {
  getCategoryDefaultListingMode,
  hasCategoryAccessoryListingMode,
  resolveCategoryListingMode,
  type CategoryListingMode,
} from '@/lib/catalog/listing-curation';

interface ProductFiltersProps {
  availableBrands: Brand[];
  currentFilters: IProductFilters;
  availableCollections?: string[]; // For LVT collection filter
  availableFamilies?: string[]; // For BLOQ family filter
  availableWoodTypes?: { value: string; count: number }[]; // For Parket: Hrast / Jasen
  availableThickness?: string[]; // For LVT overall thickness filter
  availableThicknessByType?: { homogeni: string[]; heterogeni: string[] }; // For Vinil thickness by type
  availableToolGroups?: { value: string; slug: string; count: number }[]; // For Alat: Romus tool groups
  availableToolSubcategories?: { value: string; slug: string; group: string; groupSlug: string; count: number }[]; // For Alat: Romus tool subcategories
}

export default function ProductFilters({ availableBrands, currentFilters, availableCollections, availableFamilies, availableWoodTypes, availableThickness, availableThicknessByType, availableToolGroups, availableToolSubcategories }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const categorySlug = pathname?.split('/').filter(Boolean).pop() || '';
  const supportsListingMode = hasCategoryAccessoryListingMode(categorySlug);
  const defaultListingMode = getCategoryDefaultListingMode(categorySlug);

  const isVinilCategory = pathname?.includes('/kategorije/vinil');
  const isLVTCategory = pathname?.includes('/kategorije/lvt') || pathname?.includes('/kategorije/parket');
  const isParketCategory = pathname?.includes('/kategorije/parket');
  const isLinoleumCategory = pathname?.includes('/kategorije/linoleum');
  const isLaminatCategory = pathname?.includes('/kategorije/laminat');
  const isToolCategory = pathname?.includes('/kategorije/alat');
  const currentType = searchParams.get('type');
  const currentCollections = searchParams.get('collections');
  const currentFamily = searchParams.get('family');
  const currentListing = searchParams.get('listing');
  const currentThickness = searchParams.get('thickness');
  const currentWoodTypes = searchParams.get('woodType')?.split(',').filter(Boolean) || [];
  const currentToolGroups = searchParams.get('toolGroup')?.split(',').filter(Boolean) || [];
  const currentToolSubcategories = searchParams.get('toolSubcategory')?.split(',').filter(Boolean) || [];

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
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>(
    currentFamily ? currentFamily.split(',') : []
  );
  const [selectedListingMode, setSelectedListingMode] = useState<CategoryListingMode>(
    resolveCategoryListingMode(currentListing || currentFilters.listing, categorySlug)
  );
  const [selectedThickness, setSelectedThickness] = useState<string[]>(
    currentThickness ? currentThickness.split(',') : []
  );
  const [selectedWoodTypes, setSelectedWoodTypes] = useState<string[]>(currentWoodTypes);
  const [selectedToolGroups, setSelectedToolGroups] = useState<string[]>(currentToolGroups);
  const [selectedToolSubcategories, setSelectedToolSubcategories] = useState<string[]>(currentToolSubcategories);

  // Sync state with URL params when they change externally (e.g., browser back/forward)
  // This ensures state stays in sync with URL, but we skip updates that would cause loops
  const isSyncingRef = useRef(false);

  useEffect(() => {
    // Sync only when the URL changes externally. Local state changes are pushed by
    // the auto-apply effect below and must not be immediately overwritten here.
    if (isSyncingRef.current) return;

    const urlSearch = searchParams.get('search') || '';
    const urlBrands = searchParams.get('brands')?.split(',').filter(Boolean) || [];
    const urlPriceMin = searchParams.get('priceMin') || '';
    const urlPriceMax = searchParams.get('priceMax') || '';
    const urlType = searchParams.get('type');
    const urlCollections = searchParams.get('collections')?.split(',').filter(Boolean) || [];
    const urlFamily = searchParams.get('family')?.split(',').filter(Boolean) || [];
    const urlListingMode = resolveCategoryListingMode(searchParams.get('listing'), categorySlug);
    const urlThickness = searchParams.get('thickness')?.split(',').filter(Boolean) || [];
    const urlWoodType = searchParams.get('woodType');
    const urlToolGroups = searchParams.get('toolGroup')?.split(',').filter(Boolean) || [];
    const urlToolSubcategories = searchParams.get('toolSubcategory')?.split(',').filter(Boolean) || [];

    setSearch(urlSearch);
    setSelectedBrands(urlBrands);
    setPriceMin(urlPriceMin);
    setPriceMax(urlPriceMax);
    if (isVinilCategory) {
      const newType = urlType === 'homogeni' ? 'homogeni' : urlType === 'heterogeni' ? 'heterogeni' : null;
      setVinylType(newType);
    }
    if (isLVTCategory) {
      setSelectedCollections(urlCollections);
    }
    if (pathname?.includes('/kategorije/tekstilne-ploce')) {
      setSelectedFamilies(urlFamily);
    }
    if (supportsListingMode) {
      setSelectedListingMode(urlListingMode);
    }
    if (isLVTCategory || isVinilCategory || isLinoleumCategory || isLaminatCategory) {
      setSelectedThickness(urlThickness);
    }
    if (isParketCategory) {
      setSelectedWoodTypes(urlWoodType?.split(',').filter(Boolean) || []);
    }
    if (isToolCategory) {
      setSelectedToolGroups(urlToolGroups);
      setSelectedToolSubcategories(urlToolSubcategories);
    }
  }, [searchParams, searchParamsString, categorySlug, supportsListingMode, isVinilCategory, isLVTCategory, pathname, isLinoleumCategory, isLaminatCategory, isParketCategory, isToolCategory]);

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
  }, [vinylType, isVinilCategory, availableThicknessByType, selectedThickness]);

  useEffect(() => {
    if (!isToolCategory || !availableToolSubcategories || selectedToolSubcategories.length === 0) {
      return;
    }

    const availableSubcategorySlugs = new Set(availableToolSubcategories.map((option) => option.slug));
    const validSubcategories = selectedToolSubcategories.filter((slug) => availableSubcategorySlugs.has(slug));
    if (validSubcategories.length !== selectedToolSubcategories.length) {
      setSelectedToolSubcategories(validSubcategories);
    }
  }, [isToolCategory, availableToolSubcategories, selectedToolSubcategories]);

  // Auto-apply filters when values change (with debounce for search)
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
    params.delete('family');
    params.delete('listing');
    params.delete('thickness');
    params.delete('woodType');
    params.delete('toolGroup');
    params.delete('toolSubcategory');

    // Add new filter params based on current state - ALL filters are preserved
    if (search) params.set('search', search);
    if (selectedBrands.length > 0) params.set('brands', selectedBrands.join(','));
    if (priceMin) params.set('priceMin', priceMin);
    if (priceMax) params.set('priceMax', priceMax);
    if (isVinilCategory && vinylType) params.set('type', vinylType);
    if (pathname?.includes('/kategorije/lvt') && selectedCollections.length > 0) params.set('collections', selectedCollections.join(','));
    if (pathname?.includes('/kategorije/tekstilne-ploce') && selectedFamilies.length > 0) params.set('family', selectedFamilies.join(','));
    if (supportsListingMode && selectedListingMode !== defaultListingMode) params.set('listing', selectedListingMode);
    if ((isLVTCategory || isVinilCategory || isLinoleumCategory || isLaminatCategory) && selectedThickness.length > 0) params.set('thickness', selectedThickness.join(','));
    if (isParketCategory && selectedWoodTypes.length > 0) params.set('woodType', selectedWoodTypes.join(','));
    if (isToolCategory && selectedToolGroups.length > 0) params.set('toolGroup', selectedToolGroups.join(','));
    if (isToolCategory && selectedToolSubcategories.length > 0) params.set('toolSubcategory', selectedToolSubcategories.join(','));

    // Debounce for search input (500ms), immediate for other filters
    const delay = search ? 500 : 0;

    const timeoutId = setTimeout(() => {
      router.push(`${pathname}?${params.toString()}`);
      // Reset sync flag after navigation
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 100);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [search, selectedBrands, priceMin, priceMax, vinylType, selectedCollections, selectedFamilies, selectedListingMode, selectedThickness, selectedWoodTypes, selectedToolGroups, selectedToolSubcategories, pathname, router, searchParams, supportsListingMode, defaultListingMode, isVinilCategory, isLVTCategory, isLinoleumCategory, isLaminatCategory, isParketCategory, isToolCategory]);

  const clearFilters = () => {
    setSearch('');
    setSelectedBrands([]);
    setPriceMin('');
    setPriceMax('');
    setVinylType(null);
    setSelectedCollections([]);
    setSelectedFamilies([]);
    setSelectedListingMode(defaultListingMode);
    setSelectedThickness([]);
    setSelectedWoodTypes([]);
    setSelectedToolGroups([]);
    setSelectedToolSubcategories([]);
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

  const toggleFamily = (family: string) => {
    setSelectedFamilies(prev =>
      prev.includes(family)
        ? prev.filter(c => c !== family)
        : [...prev, family]
    );
  };

  const toggleThickness = (thickness: string) => {
    setSelectedThickness(prev =>
      prev.includes(thickness)
        ? prev.filter(t => t !== thickness)
        : [...prev, thickness]
    );
  };

  const toggleWoodType = (value: string) => {
    setSelectedWoodTypes(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleToolGroup = (slug: string) => {
    setSelectedToolGroups(prev =>
      prev.includes(slug) ? prev.filter(value => value !== slug) : [...prev, slug]
    );
  };

  const toggleToolSubcategory = (slug: string) => {
    setSelectedToolSubcategories(prev =>
      prev.includes(slug) ? prev.filter(value => value !== slug) : [...prev, slug]
    );
  };

  const hasActiveFilters =
    Boolean(search || selectedBrands.length > 0 || priceMin || priceMax) ||
    Boolean(isVinilCategory && vinylType) ||
    Boolean(pathname?.includes('/kategorije/lvt') && selectedCollections.length > 0) ||
    Boolean(pathname?.includes('/kategorije/tekstilne-ploce') && selectedFamilies.length > 0) ||
    Boolean(supportsListingMode && selectedListingMode !== defaultListingMode) ||
    Boolean(isParketCategory && selectedWoodTypes.length > 0) ||
    Boolean((isLVTCategory || isVinilCategory || isLinoleumCategory || isLaminatCategory) && selectedThickness.length > 0) ||
    Boolean(isToolCategory && (selectedToolGroups.length > 0 || selectedToolSubcategories.length > 0));
  const priceUnitLabel = isToolCategory ? 'Cena (RSD/kom)' : 'Cena (RSD/m²)';

  return (
    <div className="sticky top-24 max-h-[calc(100vh-7.5rem)] overflow-y-auto overscroll-contain rounded-xl border border-gray-200/70 bg-white p-5 shadow-sm [scrollbar-gutter:stable]">
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
          <div className="space-y-2">
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
        <label className="label text-xs uppercase tracking-wide text-gray-500">{priceUnitLabel}</label>
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

      {/* Romus Tool Group Filter (samo Alat) */}
      {isToolCategory && availableToolGroups && availableToolGroups.length > 0 && (
        <div className="mb-6">
          <label className="label text-xs uppercase tracking-wide text-gray-500">Grupa alata</label>
          <div className="space-y-2">
            {availableToolGroups.map((option) => (
              <label key={option.slug} className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedToolGroups.includes(option.slug)}
                  onChange={() => toggleToolGroup(option.slug)}
                  className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm leading-5 text-gray-700">
                  {option.value} <span className="text-gray-400">({option.count})</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Romus Tool Subcategory Filter (samo Alat) */}
      {isToolCategory && availableToolSubcategories && availableToolSubcategories.length > 0 && (
        <div className="mb-6">
          <label className="label text-xs uppercase tracking-wide text-gray-500">Podgrupa</label>
          <div className="space-y-2">
            {availableToolSubcategories.map((option) => (
              <label key={`${option.groupSlug}-${option.slug}`} className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedToolSubcategories.includes(option.slug)}
                  onChange={() => toggleToolSubcategory(option.slug)}
                  className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm leading-5 text-gray-700">
                  {option.value} <span className="text-gray-400">({option.count})</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Collections Filter (samo LVT – ne Parket) */}
      {pathname?.includes('/kategorije/lvt') && availableCollections && availableCollections.length > 0 && (
        <div className="mb-6">
          <label className="label text-xs uppercase tracking-wide text-gray-500">Kolekcije</label>
          <div className="space-y-2">
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

      {/* BLOQ Family Filter (samo Tekstilne ploče) */}
      {pathname?.includes('/kategorije/tekstilne-ploce') && availableFamilies && availableFamilies.length > 0 && (
        <div className="mb-6">
          <label className="label text-xs uppercase tracking-wide text-gray-500">Familija</label>
          <div className="space-y-2">
            {availableFamilies.map((family) => (
              <label key={family} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFamilies.includes(family)}
                  onChange={() => toggleFamily(family)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">{family}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Listing Segment Filter (core / prateći asortiman) */}
      {supportsListingMode && (
        <div className="mb-6">
          <label className="label text-xs uppercase tracking-wide text-gray-500">Prikaz asortimana</label>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="listingMode"
                checked={selectedListingMode === 'core'}
                onChange={() => setSelectedListingMode('core')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Kolekcije</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="listingMode"
                checked={selectedListingMode === 'accessory'}
                onChange={() => setSelectedListingMode('accessory')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Prateći asortiman</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="listingMode"
                checked={selectedListingMode === 'all'}
                onChange={() => setSelectedListingMode('all')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Sve stavke</span>
            </label>
          </div>
        </div>
      )}

      {/* Vrsta drveta (samo Parket) – više izbora kao brendovi */}
      {isParketCategory && availableWoodTypes && availableWoodTypes.length > 0 && (
        <div className="mb-6">
          <label className="label text-xs uppercase tracking-wide text-gray-500">Vrsta drveta</label>
          <div className="space-y-2">
            {availableWoodTypes.map((w) => (
              <label key={w.value} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedWoodTypes.includes(w.value)}
                  onChange={() => toggleWoodType(w.value)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">{w.value} ({w.count})</span>
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

      {/* Overall Thickness Filter (for LVT, Vinil, Linoleum, and Laminat) */}
      {(isLVTCategory || isVinilCategory || isLinoleumCategory || isLaminatCategory) && availableThickness && availableThickness.length > 0 && (
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
