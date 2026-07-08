"use client";

import { useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Brand, ProductFilters as IProductFilters } from '@/types';
import {
  getCategoryDefaultListingMode,
  hasCategoryAccessoryListingMode,
  resolveCategoryListingMode,
  type CategoryListingMode,
} from '@/lib/catalog/listing-curation';
import { normalizeThicknessValue } from '@/lib/catalog/spec-normalize';
import {
  facetOptionLabel,
  getFacetDefsForCategory,
  type CategoryFacetDef,
  type FacetSelections,
} from '@/lib/catalog/facet-config';
import { useScrollLock } from './useScrollLock';

// FILTERI 2.0 Faza 1: opcije stižu sa servera u {value, count} obliku —
// count je broj rezultata kad se ta opcija primeni preko OSTALIH aktivnih filtera.
export interface FilterOption {
  value: string;
  count: number;
}

export interface BrandFilterOption {
  value: Brand;
  count: number;
}

// URL parametri stižu i ručno kucani ("?brands=Tarkett", "?thickness=8.00") — sve što
// se ne poklopi sa stvarnim opcijama odbacujemo, inače brojač "N aktivno" broji
// fantomske filtere koje nijedan checkbox ne prikazuje kao čekirane.
function sanitizeBrandIds(values: string[], availableBrands: BrandFilterOption[]): string[] {
  return values.filter((value) => availableBrands.some((option) => option.value.id === value));
}

function sanitizeThicknessValues(values: string[], availableThickness?: FilterOption[]): string[] {
  if (!availableThickness || availableThickness.length === 0) return [];
  const canonical = new Map(
    availableThickness.map((option) => [normalizeThicknessValue(option.value), option.value])
  );
  return values
    .map((value) => canonical.get(normalizeThicknessValue(value)))
    .filter((value): value is string => Boolean(value));
}

function sanitizeWoodTypes(
  values: string[],
  availableWoodTypes?: FilterOption[]
): string[] {
  if (!availableWoodTypes || availableWoodTypes.length === 0) return [];
  return values.filter((value) => availableWoodTypes.some((option) => option.value === value));
}

// FILTERI 2.0 Faza 1b: opcije novih grupa (klasa/dezen/ton/...) stižu sa servera,
// definicije (labela, prevod, collapsed) žive u lib/catalog/facet-config.ts.
export interface DynamicFacetGroupData {
  param: string;
  options: FilterOption[];
}

// URL vrednosti novih grupa se sanitizuju protiv stvarnih opcija (isti obrazac kao
// brend/debljina) — "?klasa=99" ne sme da uđe u brojač "N aktivno".
function sanitizeFacetSelections(
  defs: CategoryFacetDef[],
  raw: Record<string, string[]>,
  optionsByParam: Map<string, FilterOption[]>
): FacetSelections {
  const out: FacetSelections = {};
  for (const def of defs) {
    const values = raw[def.param] || [];
    if (values.length === 0) continue;
    if (def.boolean) {
      if (values.includes('1')) out[def.param] = ['1'];
      continue;
    }
    const options = optionsByParam.get(def.param) || [];
    const valid = values.filter((value) => options.some((option) => option.value === value));
    if (valid.length > 0) out[def.param] = valid;
  }
  return out;
}

function readFacetParamsFromUrl(searchParams: URLSearchParams, defs: CategoryFacetDef[]): Record<string, string[]> {
  const raw: Record<string, string[]> = {};
  for (const def of defs) {
    const value = searchParams.get(def.param);
    if (value) raw[def.param] = value.split(',').map((token) => token.trim()).filter(Boolean);
  }
  return raw;
}

// 1 rezultat / 2 rezultata / 5 rezultata (mobilno dugme "Prikaži N rezultata")
function pluralizeResults(count: number): string {
  return count % 10 === 1 && count % 100 !== 11 ? 'rezultat' : 'rezultata';
}

// '+ Prikaži još' za checkbox liste duže od 8 opcija (npr. LVT kolekcije, 26 opcija).
const FILTER_LIST_LIMIT = 8;

function ExpandableFilterList<T>({ items, renderItem }: { items: T[]; renderItem: (item: T) => ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, FILTER_LIST_LIMIT);

  return (
    <>
      {visibleItems.map(renderItem)}
      {items.length > FILTER_LIST_LIMIT && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="block text-left text-[12px] text-ink-500 transition-colors hover:text-ink-900"
        >
          {expanded ? 'Prikaži manje' : `Prikaži još (${items.length - FILTER_LIST_LIMIT})`}
        </button>
      )}
    </>
  );
}

// Minimalan collapse obrazac za sklopljene grupe: hairline naslov sa +/− (dizajn jezik
// se ne menja — border-ink-200, "label" klasa, bez zaobljenih ivica).
function CollapsibleFilterGroup({ title, defaultOpen, children }: { title: string; defaultOpen: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-ink-200 pt-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="label">{title}</span>
        <span aria-hidden="true" className="text-[15px] leading-none text-ink-500">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

// Jedan generički blok za SVE nove grupe (klasa/dezen/ton/ugradnja/materijal/rklasa/
// grejanje/uzorak/obrada/format/tip) — auto-hide <2 opcije, sivljenje count 0,
// boolean grupe kao jedan checkbox.
function DynamicFacetGroups({
  defs,
  groups,
  selectedFacets,
  onToggle,
}: {
  defs: CategoryFacetDef[];
  groups: DynamicFacetGroupData[];
  selectedFacets: FacetSelections;
  onToggle: (param: string, value: string) => void;
}) {
  return (
    <>
      {defs.map((def) => {
        const options = groups.find((group) => group.param === def.param)?.options || [];
        const selected = selectedFacets[def.param] || [];

        if (def.boolean) {
          const option = options[0];
          const isSelected = selected.includes('1');
          // Boolean grupa je namerno jedna opcija — krije se samo kad nema pokrivenih proizvoda.
          if (!option || (option.count === 0 && !isSelected)) return null;
          const checkbox = (
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="flex min-w-0 items-center">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(def.param, '1')}
                  className="h-4 w-4 border-ink-400 text-ink-900"
                />
                <span className="ml-2.5 text-sm text-ink-700">{facetOptionLabel(def, 'Da')}</span>
              </span>
              <span className="shrink-0 text-[12px] text-ink-500">({option.count})</span>
            </label>
          );
          return def.collapsed ? (
            <CollapsibleFilterGroup key={def.param} title={def.label} defaultOpen={isSelected}>
              {checkbox}
            </CollapsibleFilterGroup>
          ) : (
            <div key={def.param}>
              <p className="label mb-2">{def.label}</p>
              {checkbox}
            </div>
          );
        }

        // Auto-hide: grupa sa <2 opcije nema diskriminatornu vrednost.
        if (options.length < 2) return null;

        const list = (
          <div className="space-y-2">
            <ExpandableFilterList
              items={options}
              renderItem={(option) => {
                const isSelected = selected.includes(option.value);
                const isDisabled = option.count === 0 && !isSelected;
                return (
                  <label
                    key={option.value}
                    className={`flex items-center justify-between gap-3 ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    <span className="flex min-w-0 items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => !isDisabled && onToggle(def.param, option.value)}
                        disabled={isDisabled}
                        className="h-4 w-4 border-ink-400 text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <span className={`ml-2.5 truncate text-sm ${isDisabled ? 'text-ink-500' : 'text-ink-700'}`}>
                        {facetOptionLabel(def, option.value)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] text-ink-500">({option.count})</span>
                  </label>
                );
              }}
            />
          </div>
        );

        return def.collapsed ? (
          <CollapsibleFilterGroup key={def.param} title={def.label} defaultOpen={selected.length > 0}>
            {list}
          </CollapsibleFilterGroup>
        ) : (
          <div key={def.param}>
            <p className="label mb-2">{def.label}</p>
            {list}
          </div>
        );
      })}
    </>
  );
}

interface ProductFiltersProps {
  availableBrands: BrandFilterOption[];
  currentFilters: IProductFilters;
  availableCollections?: FilterOption[]; // For LVT collection filter
  availableFamilies?: FilterOption[]; // For BLOQ family filter
  availableWoodTypes?: FilterOption[]; // For Parket: Hrast / Jasen
  availableThickness?: FilterOption[]; // For LVT overall thickness filter
  availableThicknessByType?: { homogeni: string[]; heterogeni: string[] }; // For Vinil thickness by type
  availableToolGroups?: { value: string; slug: string; count: number }[]; // For Alat: Romus tool groups
  availableToolSubcategories?: { value: string; slug: string; group: string; groupSlug: string; count: number }[]; // For Alat: Romus tool subcategories
  dynamicFacetGroups?: DynamicFacetGroupData[]; // FILTERI 2.0 Faza 1b: nove grupe iz facet-config
  resultsCount?: number; // Broj filtriranih rezultata sa servera (živo dugme mobilne fioke)
  hasPrices?: boolean; // 'Cena' grupa se prikazuje samo kad bar 1 proizvod kategorije ima cenu
}

export default function ProductFilters({ availableBrands, currentFilters, availableCollections, availableFamilies, availableWoodTypes, availableThickness, availableThicknessByType, availableToolGroups, availableToolSubcategories, dynamicFacetGroups, resultsCount, hasPrices }: ProductFiltersProps) {
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
  const currentZidne = searchParams.get('zidne');
  const currentCollections = searchParams.get('collections');
  const currentFamily = searchParams.get('family');
  const currentListing = searchParams.get('listing');
  const currentThickness = searchParams.get('thickness');
  const currentWoodTypes = searchParams.get('woodType')?.split(',').filter(Boolean) || [];
  const currentToolGroups = searchParams.get('toolGroup')?.split(',').filter(Boolean) || [];
  const currentToolSubcategories = searchParams.get('toolSubcategory')?.split(',').filter(Boolean) || [];

  const [search, setSearch] = useState(currentFilters.search || '');
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    sanitizeBrandIds(currentFilters.brandIds || [], availableBrands)
  );
  const [priceMin, setPriceMin] = useState(currentFilters.priceMin?.toString() || '');
  const [priceMax, setPriceMax] = useState(currentFilters.priceMax?.toString() || '');
  const [vinylType, setVinylType] = useState<'homogeni' | 'heterogeni' | null>(
    currentType === 'homogeni' ? 'homogeni' : currentType === 'heterogeni' ? 'heterogeni' : null
  );
  const [safetyOnly, setSafetyOnly] = useState<boolean>(currentSafety === '1');
  const [wallOnly, setWallOnly] = useState<boolean>(currentZidne === '1');
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
    sanitizeThicknessValues(currentThickness ? currentThickness.split(',') : [], availableThickness)
  );
  const [selectedWoodTypes, setSelectedWoodTypes] = useState<string[]>(
    sanitizeWoodTypes(currentWoodTypes, availableWoodTypes)
  );
  const [selectedToolGroups, setSelectedToolGroups] = useState<string[]>(currentToolGroups);
  const [selectedToolSubcategories, setSelectedToolSubcategories] = useState<string[]>(currentToolSubcategories);
  // FILTERI 2.0 Faza 1b: nove grupe — definicije po kategoriji + selekcije po URL parametru.
  const facetDefs = useMemo(() => getFacetDefsForCategory(categorySlug), [categorySlug]);
  const facetOptionsByParam = useMemo(() => {
    const map = new Map<string, FilterOption[]>();
    for (const group of dynamicFacetGroups || []) map.set(group.param, group.options);
    return map;
  }, [dynamicFacetGroups]);
  const [selectedFacets, setSelectedFacets] = useState<FacetSelections>(() =>
    sanitizeFacetSelections(facetDefs, readFacetParamsFromUrl(searchParams, facetDefs), facetOptionsByParam)
  );
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
    const urlBrands = sanitizeBrandIds(
      searchParams.get('brands')?.split(',').filter(Boolean) || [],
      availableBrands
    );
    const urlPriceMin = searchParams.get('priceMin') || '';
    const urlPriceMax = searchParams.get('priceMax') || '';
    const urlType = searchParams.get('type');
    const urlSafety = searchParams.get('safety');
    const urlZidne = searchParams.get('zidne');
    const urlCollections = searchParams.get('collections')?.split(',').filter(Boolean) || [];
    const urlFamily = searchParams.get('family')?.split(',').filter(Boolean) || [];
    const urlListingMode = resolveCategoryListingMode(searchParams.get('listing'), categorySlug);
    const urlThickness = sanitizeThicknessValues(
      searchParams.get('thickness')?.split(',').filter(Boolean) || [],
      availableThickness
    );
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
      setWallOnly(urlZidne === '1');
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
      setSelectedWoodTypes(sanitizeWoodTypes(urlWoodType?.split(',').filter(Boolean) || [], availableWoodTypes));
    }
    if (isToolCategory) {
      setSelectedToolGroups(urlToolGroups);
      setSelectedToolSubcategories(urlToolSubcategories);
    }
    // Nove grupe (Faza 1b) — sanitizovano protiv stvarnih opcija; identičan objekat se ne
    // upisuje ponovo da auto-apply ne bi ušao u petlju.
    const urlFacets = sanitizeFacetSelections(facetDefs, readFacetParamsFromUrl(searchParams, facetDefs), facetOptionsByParam);
    setSelectedFacets((prev) => (JSON.stringify(prev) === JSON.stringify(urlFacets) ? prev : urlFacets));
  }, [searchParams, searchParamsString, categorySlug, supportsListingMode, isVinilCategory, isLVTCategory, pathname, isLinoleumCategory, isLaminatCategory, isParketCategory, isToolCategory, availableBrands, availableThickness, availableWoodTypes, facetDefs, facetOptionsByParam]);

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
    params.delete('zidne');
    params.delete('collections');
    params.delete('family');
    params.delete('listing');
    params.delete('thickness');
    params.delete('woodType');
    params.delete('toolGroup');
    params.delete('toolSubcategory');
    // Nove grupe (Faza 1b): brišemo SAMO parametre grupa ove kategorije — tuđi parametri
    // (npr. 'color' za tab Boje) preživljavaju auto-apply.
    for (const def of facetDefs) params.delete(def.param);

    // Add new filter params based on current state - ALL filters are preserved
    if (search) params.set('search', search);
    if (selectedBrands.length > 0) params.set('brands', selectedBrands.join(','));
    if (priceMin) params.set('priceMin', priceMin);
    if (priceMax) params.set('priceMax', priceMax);
    if (isVinilCategory && vinylType) params.set('type', vinylType);
    if (isVinilCategory && safetyOnly) params.set('safety', '1');
    if (isVinilCategory && wallOnly) params.set('zidne', '1');
    if (pathname?.includes('/kategorije/lvt') && selectedCollections.length > 0) params.set('collections', selectedCollections.join(','));
    if (pathname?.includes('/kategorije/tekstilne-ploce') && selectedFamilies.length > 0) params.set('family', selectedFamilies.join(','));
    if (supportsListingMode && selectedListingMode !== defaultListingMode) params.set('listing', selectedListingMode);
    if ((isLVTCategory || isVinilCategory || isLinoleumCategory || isLaminatCategory) && selectedThickness.length > 0) params.set('thickness', selectedThickness.join(','));
    if (isParketCategory && selectedWoodTypes.length > 0) params.set('woodType', selectedWoodTypes.join(','));
    if (isToolCategory && selectedToolGroups.length > 0) params.set('toolGroup', selectedToolGroups.join(','));
    if (isToolCategory && selectedToolSubcategories.length > 0) params.set('toolSubcategory', selectedToolSubcategories.join(','));
    for (const [param, values] of Object.entries(selectedFacets)) {
      if (values.length > 0) params.set(param, values.join(','));
    }

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
  }, [search, selectedBrands, priceMin, priceMax, vinylType, safetyOnly, wallOnly, selectedCollections, selectedFamilies, selectedListingMode, selectedThickness, selectedWoodTypes, selectedToolGroups, selectedToolSubcategories, selectedFacets, facetDefs, pathname, router, searchParams, supportsListingMode, defaultListingMode, isVinilCategory, isLVTCategory, isLinoleumCategory, isLaminatCategory, isParketCategory, isToolCategory]);

  const clearFilters = () => {
    setSearch('');
    setSelectedBrands([]);
    setPriceMin('');
    setPriceMax('');
    setVinylType(null);
    setSafetyOnly(false);
    setWallOnly(false);
    setSelectedCollections([]);
    setSelectedFamilies([]);
    setSelectedListingMode(defaultListingMode);
    setSelectedThickness([]);
    setSelectedWoodTypes([]);
    setSelectedToolGroups([]);
    setSelectedToolSubcategories([]);
    setSelectedFacets({});
    // Sort nije filter — preživljava i 'Očisti sve'
    const sortParam = searchParams.get('sort');
    router.push(sortParam ? `${pathname}?sort=${encodeURIComponent(sortParam)}` : pathname);
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

  const toggleFacetValue = (param: string, value: string) => {
    setSelectedFacets(prev => {
      const current = prev[param] || [];
      const nextValues = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      const next = { ...prev };
      if (nextValues.length > 0) {
        next[param] = nextValues;
      } else {
        delete next[param];
      }
      return next;
    });
  };

  const activeFacetValueCount = Object.values(selectedFacets).reduce((sum, values) => sum + values.length, 0);

  const hasActiveFilters =
    Boolean(search || selectedBrands.length > 0 || priceMin || priceMax) ||
    Boolean(isVinilCategory && vinylType) ||
    Boolean(isVinilCategory && safetyOnly) ||
    Boolean(isVinilCategory && wallOnly) ||
    Boolean(pathname?.includes('/kategorije/lvt') && selectedCollections.length > 0) ||
    Boolean(pathname?.includes('/kategorije/tekstilne-ploce') && selectedFamilies.length > 0) ||
    Boolean(supportsListingMode && selectedListingMode !== defaultListingMode) ||
    Boolean(isParketCategory && selectedWoodTypes.length > 0) ||
    Boolean((isLVTCategory || isVinilCategory || isLinoleumCategory || isLaminatCategory) && selectedThickness.length > 0) ||
    Boolean(isToolCategory && (selectedToolGroups.length > 0 || selectedToolSubcategories.length > 0)) ||
    activeFacetValueCount > 0;
  const priceUnitLabel = isToolCategory ? 'Cena (RSD/kom)' : 'Cena (RSD/m²)';

  const activeFilterCount =
    (search ? 1 : 0) +
    selectedBrands.length +
    (priceMin || priceMax ? 1 : 0) +
    (isVinilCategory && vinylType ? 1 : 0) +
    (isVinilCategory && safetyOnly ? 1 : 0) +
    (isVinilCategory && wallOnly ? 1 : 0) +
    (pathname?.includes('/kategorije/lvt') ? selectedCollections.length : 0) +
    (pathname?.includes('/kategorije/tekstilne-ploce') ? selectedFamilies.length : 0) +
    (supportsListingMode && selectedListingMode !== defaultListingMode ? 1 : 0) +
    ((isLVTCategory || isVinilCategory || isLinoleumCategory || isLaminatCategory) ? selectedThickness.length : 0) +
    (isParketCategory ? selectedWoodTypes.length : 0) +
    (isToolCategory ? selectedToolGroups.length + selectedToolSubcategories.length : 0) +
    activeFacetValueCount;

  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-lg border border-ink-200 bg-white p-4 shadow-[0_20px_55px_rgba(17,17,17,0.06)]">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-ink-200 pb-4">
            <div>
              <h2 className="text-base font-medium text-ink-900">Filteri</h2>
              {activeFilterCount > 0 && (
                <p className="mt-1 text-[12px] text-ink-500">{activeFilterCount} aktivno</p>
              )}
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[12px] text-ink-500 transition-colors hover:text-ink-900"
              >
                Očisti sve
              </button>
            )}
          </div>

          <div className="space-y-6">
            {isToolCategory && (
              <div>
                <p className="label mb-2">Pretraga</p>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Naziv, kolekcija, šifra..."
                  className="input text-sm"
                />
              </div>
            )}

            {supportsListingMode && (
              <div>
                <p className="label mb-2">Prikaz</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    ['core', 'Kolekcije'],
                    ['accessory', 'Prateći asortiman'],
                    ['all', 'Sve stavke'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedListingMode(value as CategoryListingMode)}
                      className={`min-h-[36px] border px-3 text-left text-[13px] transition-colors ${
                        selectedListingMode === value
                          ? 'border-ink-900 bg-ink-900 text-white'
                          : 'border-ink-200 bg-white text-ink-700 hover:border-ink-400'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {availableBrands.length >= 2 && (
              <div>
                <p className="label mb-2">Brend</p>
                <div className="space-y-2">
                  <ExpandableFilterList
                    items={availableBrands}
                    renderItem={(option) => {
                      const brand = option.value;
                      const isSelected = selectedBrands.includes(brand.id);
                      const isDisabled = option.count === 0 && !isSelected;
                      return (
                        <label
                          key={brand.id}
                          className={`flex items-center justify-between gap-3 text-sm ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          <span className="flex min-w-0 items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => !isDisabled && toggleBrand(brand.id)}
                              disabled={isDisabled}
                              className="h-4 w-4 border-ink-400 text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <span className={`ml-2.5 truncate ${isDisabled ? 'text-ink-500' : 'text-ink-700'}`}>{brand.name}</span>
                          </span>
                          <span className="shrink-0 text-[12px] text-ink-500">({option.count})</span>
                        </label>
                      );
                    }}
                  />
                </div>
              </div>
            )}

            {isVinilCategory && (
              <div>
                <p className="label mb-2">Tip vinila</p>
                <div className="space-y-2">
                  {[
                    ['heterogeni', 'Heterogeni'],
                    ['homogeni', 'Homogeni'],
                    ['svi', 'Svi'],
                  ].map(([value, label]) => (
                    <label key={value} className="flex cursor-pointer items-center">
                      <input
                        type="radio"
                        name="desktopVinylType"
                        checked={value === 'svi' ? vinylType === null : vinylType === value}
                        onChange={() => setVinylType(value === 'svi' ? null : value as 'homogeni' | 'heterogeni')}
                        className="h-4 w-4 border-ink-400 text-ink-900"
                      />
                      <span className="ml-2.5 text-sm text-ink-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {isVinilCategory && (
              <div>
                <p className="label mb-2">Namena</p>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={safetyOnly}
                      onChange={(e) => setSafetyOnly(e.target.checked)}
                      className="h-4 w-4 border-ink-400 text-ink-900"
                    />
                    <span className="ml-2.5 text-sm text-ink-700">Protivklizni/Sigurnosni</span>
                  </label>
                  <label className="flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={wallOnly}
                      onChange={(e) => setWallOnly(e.target.checked)}
                      className="h-4 w-4 border-ink-400 text-ink-900"
                    />
                    <span className="ml-2.5 text-sm text-ink-700">Zidne obloge</span>
                  </label>
                </div>
              </div>
            )}

            {pathname?.includes('/kategorije/lvt') && availableCollections && availableCollections.length >= 2 && (
              <div>
                <p className="label mb-2">Kolekcije</p>
                <div className="space-y-2">
                  <ExpandableFilterList
                    items={availableCollections}
                    renderItem={(option) => {
                      const isSelected = selectedCollections.includes(option.value);
                      const isDisabled = option.count === 0 && !isSelected;
                      return (
                        <label
                          key={option.value}
                          className={`flex items-center ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => !isDisabled && toggleCollection(option.value)}
                            disabled={isDisabled}
                            className="h-4 w-4 border-ink-400 text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                          <span className={`ml-2.5 text-sm ${isDisabled ? 'text-ink-500' : 'text-ink-700'}`}>
                            {option.value} <span className="text-[12px] text-ink-500">({option.count})</span>
                          </span>
                        </label>
                      );
                    }}
                  />
                </div>
              </div>
            )}

            {pathname?.includes('/kategorije/tekstilne-ploce') && availableFamilies && availableFamilies.length >= 2 && (
              <div>
                <p className="label mb-2">Familija</p>
                <div className="space-y-2">
                  <ExpandableFilterList
                    items={availableFamilies}
                    renderItem={(option) => {
                      const isSelected = selectedFamilies.includes(option.value);
                      const isDisabled = option.count === 0 && !isSelected;
                      return (
                        <label
                          key={option.value}
                          className={`flex items-center ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => !isDisabled && toggleFamily(option.value)}
                            disabled={isDisabled}
                            className="h-4 w-4 border-ink-400 text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                          <span className={`ml-2.5 text-sm ${isDisabled ? 'text-ink-500' : 'text-ink-700'}`}>
                            {option.value} <span className="text-[12px] text-ink-500">({option.count})</span>
                          </span>
                        </label>
                      );
                    }}
                  />
                </div>
              </div>
            )}

            {isParketCategory && availableWoodTypes && availableWoodTypes.length >= 2 && (
              <div>
                <p className="label mb-2">Vrsta drveta</p>
                <div className="space-y-2">
                  {availableWoodTypes.map((woodType) => {
                    const isSelected = selectedWoodTypes.includes(woodType.value);
                    const isDisabled = woodType.count === 0 && !isSelected;
                    return (
                      <label
                        key={woodType.value}
                        className={`flex items-center justify-between gap-3 ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      >
                        <span className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => !isDisabled && toggleWoodType(woodType.value)}
                            disabled={isDisabled}
                            className="h-4 w-4 border-ink-400 text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                          <span className={`ml-2.5 text-sm ${isDisabled ? 'text-ink-500' : 'text-ink-700'}`}>{woodType.value}</span>
                        </span>
                        <span className="text-[12px] text-ink-500">({woodType.count})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {isToolCategory && availableToolGroups && availableToolGroups.length >= 2 && (
              <div>
                <p className="label mb-2">Grupa alata</p>
                <div className="space-y-2">
                  <ExpandableFilterList
                    items={availableToolGroups}
                    renderItem={(option) => (
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
                    )}
                  />
                </div>
              </div>
            )}

            {isToolCategory && availableToolSubcategories && availableToolSubcategories.length >= 2 && (
              <div>
                <p className="label mb-2">Podgrupa</p>
                <div className="space-y-2">
                  <ExpandableFilterList
                    items={availableToolSubcategories}
                    renderItem={(option) => (
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
                    )}
                  />
                </div>
              </div>
            )}

            {(isLVTCategory || isVinilCategory || isLinoleumCategory || isLaminatCategory) && availableThickness && availableThickness.length >= 2 && (
              <div>
                <p className="label mb-2">Debljina</p>
                <div className="grid grid-cols-2 gap-2">
                  {availableThickness.map((option) => {
                    const thickness = option.value;
                    const isSelected = selectedThickness.includes(thickness);
                    let isDisabled = false;
                    if (isVinilCategory && availableThicknessByType && vinylType) {
                      isDisabled = vinylType === 'homogeni'
                        ? !availableThicknessByType.homogeni.includes(thickness)
                        : !availableThicknessByType.heterogeni.includes(thickness);
                    }
                    if (option.count === 0 && !isSelected) {
                      isDisabled = true;
                    }

                    return (
                      <button
                        key={thickness}
                        type="button"
                        onClick={() => !isDisabled && toggleThickness(thickness)}
                        disabled={isDisabled}
                        className={`min-h-[34px] border px-2 text-[12px] transition-colors ${
                          isSelected
                            ? 'border-ink-900 bg-ink-900 text-white'
                            : 'border-ink-200 bg-white text-ink-700 hover:border-ink-400 disabled:cursor-not-allowed disabled:opacity-40'
                        }`}
                      >
                        {thickness} mm ({option.count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FILTERI 2.0 Faza 1b: nove grupe iz facet-config — jedan generički blok */}
            {dynamicFacetGroups && facetDefs.length > 0 && (
              <DynamicFacetGroups
                defs={facetDefs}
                groups={dynamicFacetGroups}
                selectedFacets={selectedFacets}
                onToggle={toggleFacetValue}
              />
            )}

            {hasPrices && (
              <div>
                <p className="label mb-2">{priceUnitLabel}</p>
                <div className="grid grid-cols-2 gap-3">
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
            )}
          </div>
        </div>
      </aside>

      {/* Hairline traka: levo brend cipovi, desno dugme Filteri */}
      <div className="flex items-center justify-between gap-4 border-b border-ink-200 lg:hidden">
        <div className="no-scrollbar -mx-1 flex flex-1 items-center gap-5 overflow-x-auto px-1">
          {availableBrands.length >= 2 && availableBrands.map((option) => {
            const brand = option.value;
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
              {/* Search (samo Alat) */}
              {isToolCategory && (
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
              )}

              {/* Brands */}
              {availableBrands.length >= 2 && (
                <div className="mb-8">
                  <p className="label mb-3">Brendovi</p>
                  <div className="space-y-2">
                    <ExpandableFilterList
                      items={availableBrands}
                      renderItem={(option) => {
                        const brand = option.value;
                        const isSelected = selectedBrands.includes(brand.id);
                        const isDisabled = option.count === 0 && !isSelected;
                        return (
                          <label
                            key={brand.id}
                            className={`flex items-center ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => !isDisabled && toggleBrand(brand.id)}
                              disabled={isDisabled}
                              className="h-4 w-4 border-ink-400 text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <span className={`ml-2.5 text-sm ${isDisabled ? 'text-ink-500' : 'text-ink-700'}`}>
                              {brand.name} <span className="text-[12px] text-ink-500">({option.count})</span>
                            </span>
                          </label>
                        );
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Price Range */}
              {hasPrices && (
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
              )}

              {/* Romus Tool Group Filter (samo Alat) */}
              {isToolCategory && availableToolGroups && availableToolGroups.length >= 2 && (
                <div className="mb-8">
                  <p className="label mb-3">Grupa alata</p>
                  <div className="space-y-2">
                    <ExpandableFilterList
                      items={availableToolGroups}
                      renderItem={(option) => (
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
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Romus Tool Subcategory Filter (samo Alat) */}
              {isToolCategory && availableToolSubcategories && availableToolSubcategories.length >= 2 && (
                <div className="mb-8">
                  <p className="label mb-3">Podgrupa</p>
                  <div className="space-y-2">
                    <ExpandableFilterList
                      items={availableToolSubcategories}
                      renderItem={(option) => (
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
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Collections Filter (samo LVT – ne Parket) */}
              {pathname?.includes('/kategorije/lvt') && availableCollections && availableCollections.length >= 2 && (
                <div className="mb-8">
                  <p className="label mb-3">Kolekcije</p>
                  <div className="space-y-2">
                    <ExpandableFilterList
                      items={availableCollections}
                      renderItem={(option) => {
                        const isSelected = selectedCollections.includes(option.value);
                        const isDisabled = option.count === 0 && !isSelected;
                        return (
                          <label
                            key={option.value}
                            className={`flex items-center ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => !isDisabled && toggleCollection(option.value)}
                              disabled={isDisabled}
                              className="h-4 w-4 border-ink-400 text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <span className={`ml-2.5 text-sm ${isDisabled ? 'text-ink-500' : 'text-ink-700'}`}>
                              {option.value} <span className="text-[12px] text-ink-500">({option.count})</span>
                            </span>
                          </label>
                        );
                      }}
                    />
                  </div>
                </div>
              )}

              {/* BLOQ Family Filter (samo Tekstilne ploče) */}
              {pathname?.includes('/kategorije/tekstilne-ploce') && availableFamilies && availableFamilies.length >= 2 && (
                <div className="mb-8">
                  <p className="label mb-3">Familija</p>
                  <div className="space-y-2">
                    <ExpandableFilterList
                      items={availableFamilies}
                      renderItem={(option) => {
                        const isSelected = selectedFamilies.includes(option.value);
                        const isDisabled = option.count === 0 && !isSelected;
                        return (
                          <label
                            key={option.value}
                            className={`flex items-center ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => !isDisabled && toggleFamily(option.value)}
                              disabled={isDisabled}
                              className="h-4 w-4 border-ink-400 text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <span className={`ml-2.5 text-sm ${isDisabled ? 'text-ink-500' : 'text-ink-700'}`}>
                              {option.value} <span className="text-[12px] text-ink-500">({option.count})</span>
                            </span>
                          </label>
                        );
                      }}
                    />
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
              {isParketCategory && availableWoodTypes && availableWoodTypes.length >= 2 && (
                <div className="mb-8">
                  <p className="label mb-3">Vrsta drveta</p>
                  <div className="space-y-2">
                    {availableWoodTypes.map((w) => {
                      const isSelected = selectedWoodTypes.includes(w.value);
                      const isDisabled = w.count === 0 && !isSelected;
                      return (
                        <label
                          key={w.value}
                          className={`flex items-center ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => !isDisabled && toggleWoodType(w.value)}
                            disabled={isDisabled}
                            className="h-4 w-4 border-ink-400 text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                          <span className={`ml-2.5 text-sm ${isDisabled ? 'text-ink-500' : 'text-ink-700'}`}>
                            {w.value} <span className="text-[12px] text-ink-500">({w.count})</span>
                          </span>
                        </label>
                      );
                    })}
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

              {/* Protivklizni / Sigurnosni (S5) + Zidne obloge (S9) filter */}
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
                  <label className="mt-3 flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      name="wallOnly"
                      checked={wallOnly}
                      onChange={(e) => setWallOnly(e.target.checked)}
                      className="h-4 w-4 border-ink-400 text-ink-900"
                    />
                    <span className="ml-2.5 text-sm text-ink-700">Zidne obloge</span>
                  </label>
                </div>
              )}

              {/* Overall Thickness Filter (for LVT, Vinil, Linoleum, and Laminat) */}
              {(isLVTCategory || isVinilCategory || isLinoleumCategory || isLaminatCategory) && availableThickness && availableThickness.length >= 2 && (
                <div className="mb-8">
                  <p className="label mb-3">Debljina</p>
                  <div className="space-y-2">
                    {availableThickness.map((option) => {
                      const thickness = option.value;
                      const isSelected = selectedThickness.includes(thickness);
                      // For Vinil: check if thickness is available for selected type
                      let isDisabled = false;
                      if (isVinilCategory && availableThicknessByType && vinylType) {
                        if (vinylType === 'homogeni') {
                          isDisabled = !availableThicknessByType.homogeni.includes(thickness);
                        } else if (vinylType === 'heterogeni') {
                          isDisabled = !availableThicknessByType.heterogeni.includes(thickness);
                        }
                      }
                      if (option.count === 0 && !isSelected) {
                        isDisabled = true;
                      }

                      return (
                        <label
                          key={thickness}
                          className={`flex items-center ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => !isDisabled && toggleThickness(thickness)}
                            disabled={isDisabled}
                            className="h-4 w-4 border-ink-400 text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                          <span className={`ml-2.5 text-sm ${isDisabled ? 'text-ink-500' : 'text-ink-700'}`}>
                            {thickness} mm <span className="text-[12px] text-ink-500">({option.count})</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FILTERI 2.0 Faza 1b: nove grupe iz facet-config — isti generički blok kao na desktopu */}
              {dynamicFacetGroups && facetDefs.length > 0 && (
                <div className="mb-8 space-y-6">
                  <DynamicFacetGroups
                    defs={facetDefs}
                    groups={dynamicFacetGroups}
                    selectedFacets={selectedFacets}
                    onToggle={toggleFacetValue}
                  />
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
                {typeof resultsCount === 'number'
                  ? `Prikaži ${resultsCount} ${pluralizeResults(resultsCount)}`
                  : 'Prikaži rezultate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
