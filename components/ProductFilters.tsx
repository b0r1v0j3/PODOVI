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
import { useScrollLock } from './useScrollLock';

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
  const currentSafety = searchParams.get('safety');
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
  const [safetyOnly, setSafetyOnly] = useState<boolean>(currentSafety === '1');
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const filtersTriggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
    const urlSafety = searchParams.get('safety');
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
      setSafetyOnly(urlSafety === '1');
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

  // Zakljucaj scroll pozadine dok je fioka otvorena
  useScrollLock(isDrawerOpen);

  // Zatvori fioku na Escape i upravljaj fokusom dok je otvorena
  useEffect(() => {
    if (!isDrawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    // Pri otvaranju fokus ulazi u dijalog — na dugme za zatvaranje
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Vrati fokus na dugme "Filteri" koje je otvorilo fioku
      filtersTriggerRef.current?.focus();
    };
  }, [isDrawerOpen]);

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
    params.delete('safety');
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
    if (isVinilCategory && safetyOnly) params.set('safety', '1');
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
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      // Reset sync flag after navigation
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 100);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [search, selectedBrands, priceMin, priceMax, vinylType, safetyOnly, selectedCollections, selectedFamilies, selectedListingMode, selectedThickness, selectedWoodTypes, selectedToolGroups, selectedToolSubcategories, pathname, router, searchParams, supportsListingMode, defaultListingMode, isVinilCategory, isLVTCategory, isLinoleumCategory, isLaminatCategory, isParketCategory, isToolCategory]);

  const clearFilters = () => {
    setSearch('');
    setSelectedBrands([]);
    setPriceMin('');
    setPriceMax('');
    setVinylType(null);
    setSafetyOnly(false);
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
    Boolean(isVinilCategory && safetyOnly) ||
    Boolean(pathname?.includes('/kategorije/lvt') && selectedCollections.length > 0) ||
    Boolean(pathname?.includes('/kategorije/tekstilne-ploce') && selectedFamilies.length > 0) ||
    Boolean(supportsListingMode && selectedListingMode !== defaultListingMode) ||
    Boolean(isParketCategory && selectedWoodTypes.length > 0) ||
    Boolean((isLVTCategory || isVinilCategory || isLinoleumCategory || isLaminatCategory) && selectedThickness.length > 0) ||
    Boolean(isToolCategory && (selectedToolGroups.length > 0 || selectedToolSubcategories.length > 0));
  const priceUnitLabel = isToolCategory ? 'Cena (RSD/kom)' : 'Cena (RSD/m²)';

  const activeFilterCount =
    (search ? 1 : 0) +
    selectedBrands.length +
    (priceMin || priceMax ? 1 : 0) +
    (isVinilCategory && vinylType ? 1 : 0) +
    (isVinilCategory && safetyOnly ? 1 : 0) +
    (pathname?.includes('/kategorije/lvt') ? selectedCollections.length : 0) +
    (pathname?.includes('/kategorije/tekstilne-ploce') ? selectedFamilies.length : 0) +
    (supportsListingMode && selectedListingMode !== defaultListingMode ? 1 : 0) +
    ((isLVTCategory || isVinilCategory || isLinoleumCategory || isLaminatCategory) ? selectedThickness.length : 0) +
    (isParketCategory ? selectedWoodTypes.length : 0) +
    (isToolCategory ? selectedToolGroups.length + selectedToolSubcategories.length : 0);

  return (
    <>
      {/* Hairline traka: levo brend cipovi, desno dugme Filteri */}
      <div className="flex items-center justify-between gap-4 border-b border-ink-200">
        <div className="no-scrollbar -mx-1 flex flex-1 items-center gap-5 overflow-x-auto px-1">
          {availableBrands.map((brand) => {
            const active = selectedBrands.includes(brand.id);
            return (
              <button
                key={brand.id}
                type="button"
                onClick={() => toggleBrand(brand.id)}
                aria-pressed={active}
                className={`min-h-[44px] shrink-0 border-b-2 text-[13px] transition-colors ${
                  active
                    ? 'border-ink-900 text-ink-900'
                    : 'border-transparent text-ink-500 hover:text-ink-900'
                }`}
              >
                {brand.name}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          ref={filtersTriggerRef}
          onClick={() => setIsDrawerOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isDrawerOpen}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-2 text-[13px] text-ink-900 transition-opacity hover:opacity-60"
        >
          Filteri{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
        </button>
      </div>

      {/* Modalni sloj: overlay + fioka iznad lepljivog headera (z-50) i z-40 plutajucih elemenata */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[60]">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/20"
            aria-hidden="true"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Fioka filtera zdesna */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filteri"
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-ink-200 bg-white"
          >
            <div className="flex items-center justify-between border-b border-ink-200 px-6 py-4">
              <h2 className="eyebrow">Filteri</h2>
              <button
                type="button"
                ref={closeButtonRef}
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Zatvori filtere"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-900 transition-opacity hover:opacity-60"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Search */}
              <div className="mb-8">
                <p className="label mb-3">Pretraga</p>
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
                <div className="mb-8">
                  <p className="label mb-3">Brendovi</p>
                  <div className="space-y-2">
                    {availableBrands.map((brand) => (
                      <label key={brand.id} className="flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand.id)}
                          onChange={() => toggleBrand(brand.id)}
                          className="h-4 w-4 border-ink-400 text-ink-900"
                        />
                        <span className="ml-2.5 text-sm text-ink-700">{brand.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="mb-8">
                <p className="label mb-3">{priceUnitLabel}</p>
                <div className="flex gap-4">
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
                <div className="mb-8">
                  <p className="label mb-3">Grupa alata</p>
                  <div className="space-y-2">
                    {availableToolGroups.map((option) => (
                      <label key={option.slug} className="flex cursor-pointer items-start">
                        <input
                          type="checkbox"
                          checked={selectedToolGroups.includes(option.slug)}
                          onChange={() => toggleToolGroup(option.slug)}
                          className="mt-0.5 h-4 w-4 border-ink-400 text-ink-900"
                        />
                        <span className="ml-2.5 text-sm leading-5 text-ink-700">
                          {option.value} <span className="text-ink-500">({option.count})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Romus Tool Subcategory Filter (samo Alat) */}
              {isToolCategory && availableToolSubcategories && availableToolSubcategories.length > 0 && (
                <div className="mb-8">
                  <p className="label mb-3">Podgrupa</p>
                  <div className="space-y-2">
                    {availableToolSubcategories.map((option) => (
                      <label key={`${option.groupSlug}-${option.slug}`} className="flex cursor-pointer items-start">
                        <input
                          type="checkbox"
                          checked={selectedToolSubcategories.includes(option.slug)}
                          onChange={() => toggleToolSubcategory(option.slug)}
                          className="mt-0.5 h-4 w-4 border-ink-400 text-ink-900"
                        />
                        <span className="ml-2.5 text-sm leading-5 text-ink-700">
                          {option.value} <span className="text-ink-500">({option.count})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Collections Filter (samo LVT – ne Parket) */}
              {pathname?.includes('/kategorije/lvt') && availableCollections && availableCollections.length > 0 && (
                <div className="mb-8">
                  <p className="label mb-3">Kolekcije</p>
                  <div className="space-y-2">
                    {availableCollections.map((collection) => (
                      <label key={collection} className="flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={selectedCollections.includes(collection)}
                          onChange={() => toggleCollection(collection)}
                          className="h-4 w-4 border-ink-400 text-ink-900"
                        />
                        <span className="ml-2.5 text-sm text-ink-700">{collection}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* BLOQ Family Filter (samo Tekstilne ploče) */}
              {pathname?.includes('/kategorije/tekstilne-ploce') && availableFamilies && availableFamilies.length > 0 && (
                <div className="mb-8">
                  <p className="label mb-3">Familija</p>
                  <div className="space-y-2">
                    {availableFamilies.map((family) => (
                      <label key={family} className="flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={selectedFamilies.includes(family)}
                          onChange={() => toggleFamily(family)}
                          className="h-4 w-4 border-ink-400 text-ink-900"
                        />
                        <span className="ml-2.5 text-sm text-ink-700">{family}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Listing Segment Filter (core / prateći asortiman) */}
              {supportsListingMode && (
                <div className="mb-8">
                  <p className="label mb-3">Prikaz asortimana</p>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center">
                      <input
                        type="radio"
                        name="listingMode"
                        checked={selectedListingMode === 'core'}
                        onChange={() => setSelectedListingMode('core')}
                        className="h-4 w-4 border-ink-400 text-ink-900"
                      />
                      <span className="ml-2.5 text-sm text-ink-700">Kolekcije</span>
                    </label>
                    <label className="flex cursor-pointer items-center">
                      <input
                        type="radio"
                        name="listingMode"
                        checked={selectedListingMode === 'accessory'}
                        onChange={() => setSelectedListingMode('accessory')}
                        className="h-4 w-4 border-ink-400 text-ink-900"
                      />
                      <span className="ml-2.5 text-sm text-ink-700">Prateći asortiman</span>
                    </label>
                    <label className="flex cursor-pointer items-center">
                      <input
                        type="radio"
                        name="listingMode"
                        checked={selectedListingMode === 'all'}
                        onChange={() => setSelectedListingMode('all')}
                        className="h-4 w-4 border-ink-400 text-ink-900"
                      />
                      <span className="ml-2.5 text-sm text-ink-700">Sve stavke</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Vrsta drveta (samo Parket) – više izbora kao brendovi */}
              {isParketCategory && availableWoodTypes && availableWoodTypes.length > 0 && (
                <div className="mb-8">
                  <p className="label mb-3">Vrsta drveta</p>
                  <div className="space-y-2">
                    {availableWoodTypes.map((w) => (
                      <label key={w.value} className="flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={selectedWoodTypes.includes(w.value)}
                          onChange={() => toggleWoodType(w.value)}
                          className="h-4 w-4 border-ink-400 text-ink-900"
                        />
                        <span className="ml-2.5 text-sm text-ink-700">{w.value} ({w.count})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Vinyl Type Filter */}
              {isVinilCategory && (
                <div className="mb-8">
                  <p className="label mb-3">Tip Vinila</p>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center">
                      <input
                        type="radio"
                        name="vinylType"
                        checked={vinylType === 'homogeni'}
                        onChange={() => setVinylType('homogeni')}
                        className="h-4 w-4 border-ink-400 text-ink-900"
                      />
                      <span className="ml-2.5 text-sm text-ink-700">Homogeni</span>
                    </label>
                    <label className="flex cursor-pointer items-center">
                      <input
                        type="radio"
                        name="vinylType"
                        checked={vinylType === 'heterogeni'}
                        onChange={() => setVinylType('heterogeni')}
                        className="h-4 w-4 border-ink-400 text-ink-900"
                      />
                      <span className="ml-2.5 text-sm text-ink-700">Heterogeni</span>
                    </label>
                    <label className="flex cursor-pointer items-center">
                      <input
                        type="radio"
                        name="vinylType"
                        checked={vinylType === null}
                        onChange={() => setVinylType(null)}
                        className="h-4 w-4 border-ink-400 text-ink-900"
                      />
                      <span className="ml-2.5 text-sm text-ink-700">Svi</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Protivklizni / Sigurnosni filter (S5) */}
              {isVinilCategory && (
                <div className="mb-8">
                  <p className="label mb-3">Namena</p>
                  <label className="flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      name="safetyOnly"
                      checked={safetyOnly}
                      onChange={(e) => setSafetyOnly(e.target.checked)}
                      className="h-4 w-4 border-ink-400 text-ink-900"
                    />
                    <span className="ml-2.5 text-sm text-ink-700">Protivklizni/Sigurnosni</span>
                  </label>
                </div>
              )}

              {/* Overall Thickness Filter (for LVT, Vinil, Linoleum, and Laminat) */}
              {(isLVTCategory || isVinilCategory || isLinoleumCategory || isLaminatCategory) && availableThickness && availableThickness.length > 0 && (
                <div className="mb-8">
                  <p className="label mb-3">Debljina</p>
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
                            className="h-4 w-4 border-ink-400 text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                          <span className={`ml-2.5 text-sm ${isDisabled ? 'text-ink-500' : 'text-ink-700'}`}>
                            {thickness} mm
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-ink-200 px-6 py-4">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn-secondary flex-1"
                >
                  Obriši filtere
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="btn-primary flex-1"
              >
                Prikaži rezultate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
