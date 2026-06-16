'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product, Brand } from '@/types';
import {
  type CategoryListingMode,
  filterCategoryListingCollections,
  resolveCategoryListingMode,
} from '@/lib/catalog/listing-curation';
import ProductCardClient from '@/components/ProductCardClient';

interface ColorFromJSON {
  collection: string;
  collection_name: string;
  collection_slug?: string; // For Vinil
  code: string;
  name: string;
  full_name: string;
  slug: string;
  image_url?: string;
  texture_url?: string;
  lifestyle_url?: string;
  image_count: number;
  type?: 'homogeneous' | 'heterogeneous'; // For Vinil
}

interface CategoryTabsProps {
  collections: Product[];
  colors: Product[]; // Legacy fallback for non-JSON categories (Parket)
  brandsRecord: Record<string, Brand>;
  categorySlug: string; // 'lvt' | 'linoleum' | 'vinil' | 'tekstilne-ploce' | 'parket' | 'lajsne'
  initialColorSlug?: string; // Optional color slug to automatically open and highlight
  vinylType?: string; // For vinyl type filter: 'homogeni' | 'heterogeni'
  safetyOnly?: boolean; // For vinyl safety filter: only protivklizni/sigurnosni collections
  listingMode?: CategoryListingMode;
  searchParams?: {
    search?: string;
    brands?: string;
    collections?: string;
    family?: string;
    thickness?: string;
    woodType?: string;
    listing?: string;
  };
}

const NESTED_JSON_CATEGORIES = ['vinil', 'elektroprovodni', 'industrijske-ploce', 'sport', 'lajsne'] as const;

const CATEGORY_ID_BY_SLUG: Record<string, string> = {
  lvt: '6',
  linoleum: '7',
  vinil: '2',
  deking: '5',
  elektroprovodni: '8',
  'industrijske-ploce': '9',
  sport: '10',
  lajsne: '11',
};

const CATEGORY_API_BY_SLUG: Record<string, string> = {
  lvt: 'lvt',
  linoleum: 'linoleum',
  vinil: 'vinil',
  elektroprovodni: 'elektroprovodni',
  'industrijske-ploce': 'industrijske-ploce',
  sport: 'sport',
  lajsne: 'lajsne',
};

export default function CategoryTabs({
  collections,
  colors: legacyColors,
  brandsRecord,
  categorySlug,
  initialColorSlug,
  vinylType,
  safetyOnly,
  listingMode,
  searchParams: searchParamsProp
}: CategoryTabsProps) {
  // Get search params from URL (fallback to prop if provided)
  const urlSearchParams = useSearchParams();
  const searchParams = useMemo(() => searchParamsProp || {
    search: urlSearchParams.get('search') || undefined,
    brands: urlSearchParams.get('brands') || undefined,
    collections: urlSearchParams.get('collections') || undefined,
    family: urlSearchParams.get('family') || undefined,
    thickness: urlSearchParams.get('thickness') || undefined,
    listing: urlSearchParams.get('listing') || undefined,
    }, [searchParamsProp, urlSearchParams]);

  const resolvedListingMode = useMemo(
    () => resolveCategoryListingMode(listingMode || searchParams.listing, categorySlug),
    [listingMode, searchParams.listing, categorySlug]
  );

  // If initialColorSlug is provided, start with 'colors' tab active
  const [activeTab, setActiveTab] = useState<'collections' | 'colors'>(
    initialColorSlug || (searchParams.collections) ? 'colors' : 'collections'
  );

  // Effect to switch to colors tab if collections filter is applied via URL
  useEffect(() => {
    if (searchParams.collections) {
      setActiveTab('colors');
    }
  }, [searchParams.collections]);
  const [colorsFromJSON, setColorsFromJSON] = useState<Product[]>([]);
  const [loadingColors, setLoadingColors] = useState(false);
  const [totalColorsCount, setTotalColorsCount] = useState<number | null>(null);
  const hasLoadedColors = useRef(false);
  const lastDatasetKey = useRef<string>('');
  const useJsonColors = categorySlug === 'linoleum' || categorySlug === 'lvt' || NESTED_JSON_CATEGORIES.includes(categorySlug as (typeof NESTED_JSON_CATEGORIES)[number]);
  const isColorsLoading = useJsonColors && activeTab === 'colors' && (!hasLoadedColors.current || loadingColors);
  const isVariantLabelCategory = categorySlug === 'lajsne' || categorySlug === 'deking';
  const colorsTabLabel = isVariantLabelCategory ? 'Varijante' : 'Boje';
  const colorsCountLabel = isVariantLabelCategory ? 'varijanti' : 'boja';
  const colorsLoadingLabel = isVariantLabelCategory ? 'Učitavam varijante...' : 'Učitavam boje...';
  const collectionsToRender = useMemo(() => {
    let filtered = collections;

    if (!useJsonColors) {
      return filtered;
    }

    filtered = filtered.filter((product) => !/^\d{4}$/.test(product.sku ?? ''));

    // Filter by vinyl type if specified
    if (categorySlug === 'vinil' && vinylType) {
      const typeFilter = vinylType.toLowerCase();
      filtered = filtered.filter(p => {
        const typeSpec = p.specs.find(s => s.key === 'type');
        if (!typeSpec) return false;
        const productType = typeSpec.value.toLowerCase();
        if (typeFilter === 'homogeni') {
          return productType === 'homogeni';
        } else if (typeFilter === 'heterogeni') {
          return productType === 'heterogeni';
        }
        return false;
      });
    }

    // Filter by safety (protivklizno) — keep only safety collections (S5)
    if (categorySlug === 'vinil' && safetyOnly) {
      filtered = filtered.filter(p => p.specs.some(s => s.key === 'protivklizno'));
    }

    // Filter by thickness (for LVT, Vinil, and Linoleum)
    if ((categorySlug === 'lvt' || categorySlug === 'vinil' || categorySlug === 'linoleum') && searchParams?.thickness) {
      const selectedThicknesses = searchParams.thickness.split(',');
      filtered = filtered.filter(collection => {
        const thicknessSpec = collection.specs.find(s =>
          s.key === 'thickness' ||
          s.key === 'overall_thickness' ||
          s.key === 'debljina'
        );
        if (thicknessSpec) {
          const normalizedValue = thicknessSpec.value.replace(/,/g, '.').replace(/\s+/g, '').replace(/mm/gi, '').trim();
          const thicknessValue = parseFloat(normalizedValue);
          if (!isNaN(thicknessValue)) {
            const thicknessStr = thicknessValue.toFixed(2);
            return selectedThicknesses.some(selected => {
              const normalizedSelected = selected.replace(/,/g, '.').replace(/\s+/g, '').replace(/mm/gi, '').trim();
              const selectedValue = parseFloat(normalizedSelected);
              if (!isNaN(selectedValue)) {
                const selectedStr = selectedValue.toFixed(2);
                return thicknessStr === selectedStr;
              }
              return false;
            });
          }
        }
        return false;
      });
    }

    return filterCategoryListingCollections(categorySlug, filtered, resolvedListingMode);
  }, [collections, useJsonColors, categorySlug, vinylType, safetyOnly, searchParams, resolvedListingMode]);

  // Filter colors by all active filters
  const colorsToRender = useMemo(() => {
    let filtered = colorsFromJSON;

    if (!useJsonColors) {
      return filtered;
    }

    // For Vinil and Linoleum: ensure thickness is added from collections if missing
    // This ensures thickness is always available even if collections prop changes
    if (categorySlug === 'vinil' || categorySlug === 'linoleum') {
      filtered = filtered.map(color => {
        // If thickness already exists, return color as is
        if (color.specs.find(s => s.key === 'thickness')) {
          return color;
        }

        // Try to find matching collection and add thickness
        const collectionSlug = ((color as any).collectionSlug || '').toLowerCase();
        const matchingCollection = collections.find(c => {
          const collectionSlugFromProduct = c.slug.toLowerCase().replace(/^(gerflor|tarkett|wolflor)-/, '');
          const collectionNameFromProduct = c.name.toLowerCase();
          const colorCollectionName = ((color as any).collection_name || (color as any).collection || '').toLowerCase();

          return collectionSlugFromProduct === collectionSlug ||
            collectionNameFromProduct === colorCollectionName ||
            collectionSlugFromProduct === collectionSlug.replace(/\s+/g, '-');
        });

        if (matchingCollection) {
          const thicknessSpec = matchingCollection.specs.find(s => s.key === 'thickness');
          if (thicknessSpec) {
            return {
              ...color,
              specs: [...color.specs, { key: 'thickness', label: 'Ukupna debljina', value: thicknessSpec.value }]
            };
          }
        }

        return color;
      });
    }

    // Filter by vinyl type (for Vinil category)
    if (categorySlug === 'vinil' && vinylType) {
      const typeFilter = vinylType.toLowerCase();
      filtered = filtered.filter(color => {
        const typeSpec = color.specs.find(s => s.key === 'type');
        if (!typeSpec) return false;
        const productType = typeSpec.value.toLowerCase();
        if (typeFilter === 'homogeni') {
          return productType === 'homogeni';
        } else if (typeFilter === 'heterogeni') {
          return productType === 'heterogeni';
        }
        return false;
      });
    }

    // Filter by safety (protivklizno) — keep only colors from safety collections (S5)
    if (categorySlug === 'vinil' && safetyOnly) {
      filtered = filtered.filter(color => color.specs.some(s => s.key === 'protivklizno'));
    }

    // Filter by search term
    if (searchParams?.search) {
      const searchTerm = searchParams.search.toLowerCase();
      filtered = filtered.filter(color => {
        const searchableText = `${color.name} ${color.sku} ${color.shortDescription || ''}`.toLowerCase();
        return searchableText.includes(searchTerm);
      });
    }

    // Filter by brands
    if (searchParams?.brands) {
      const selectedBrandIds = searchParams.brands.split(',');
      filtered = filtered.filter(color => {
        return selectedBrandIds.includes(color.brandId);
      });
    }

    // Filter by collections (for LVT and generic categories like Parket)
    // Za Parket: boje su već filtrirane po efektivnoj kolekciji na serveru (category page), preskačemo
    if (searchParams?.collections && (categorySlug as string) !== 'parket') {
      const selectedCollections = searchParams.collections.split(',');
      filtered = filtered.filter(color => {
        // LVT Logic using collectionSlug prop
        if (categorySlug === 'lvt') {
          const collectionName = (color as any).collectionSlug || '';
          const collectionNameWithoutPrefix = collectionName.replace(/^(gerflor|tarkett|wolflor)-/, '');

          return selectedCollections.some(collection => {
            if (collection === 'Creation 30') {
              return collectionNameWithoutPrefix.includes('creation-30');
            } else if (collection === 'Creation 40') {
              return collectionNameWithoutPrefix.includes('creation-40');
            } else if (collection === 'Creation 55') {
              return collectionNameWithoutPrefix.includes('creation-55');
            } else if (collection === 'Creation 70') {
              return collectionNameWithoutPrefix.includes('creation-70');
            } else if (collection === 'SAGA²' || collection.includes('SAGA')) {
              return collectionNameWithoutPrefix.includes('saga');
            }
            return false;
          });
        }

        // Ostale kategorije (linoleum, vinil) – po spec kolekciji
        const collectionSpec = color.specs.find(s => s.key === 'collection');
        if (collectionSpec) {
          return selectedCollections.includes(collectionSpec.value);
        }
        return false;
      });
    }

    // Filter by thickness (for LVT, Vinil, and Linoleum)
    if ((categorySlug === 'lvt' || categorySlug === 'vinil' || categorySlug === 'linoleum') && searchParams?.thickness) {
      const selectedThicknesses = searchParams.thickness.split(',');
      filtered = filtered.filter(color => {
        // Get thickness from specs - check multiple possible keys
        const thicknessSpec = color.specs.find(s =>
          s.key === 'thickness' ||
          s.key === 'overall_thickness' ||
          s.key === 'debljina'
        );
        if (thicknessSpec) {
          const normalizedValue = thicknessSpec.value.replace(/,/g, '.').replace(/\s+/g, '').replace(/mm/gi, '').trim();
          const thicknessValue = parseFloat(normalizedValue);
          if (!isNaN(thicknessValue)) {
            const thicknessStr = thicknessValue.toFixed(2);
            return selectedThicknesses.some(selected => {
              // Normalize selected thickness value for comparison
              const normalizedSelected = selected.replace(/,/g, '.').replace(/\s+/g, '').replace(/mm/gi, '').trim();
              const selectedValue = parseFloat(normalizedSelected);
              if (!isNaN(selectedValue)) {
                const selectedStr = selectedValue.toFixed(2);
                return thicknessStr === selectedStr;
              }
              return false;
            });
          }
        }
        return false;
      });
    }

    return filtered;
  }, [colorsFromJSON, categorySlug, vinylType, safetyOnly, useJsonColors, searchParams, collections]);

  // Load total count from JSON on mount (without loading all colors)
  useEffect(() => {
    if (!useJsonColors) {
      setTotalColorsCount(null);
      return;
    }

    const categoryParam = CATEGORY_API_BY_SLUG[categorySlug] || 'lvt';
    const listingParam = resolvedListingMode === 'all' ? '' : `&listing=${resolvedListingMode}`;
    const jsonPath = `/api/colors?category=${categoryParam}${listingParam}`;

    fetch(jsonPath)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch colors: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (NESTED_JSON_CATEGORIES.includes(categorySlug as (typeof NESTED_JSON_CATEGORIES)[number]) && Array.isArray(data.collections)) {
          const visibleCollections = filterCategoryListingCollections(
            categorySlug,
            data.collections,
            resolvedListingMode
          );
          const total = visibleCollections.reduce((sum: number, collection: any) =>
            sum + (collection.colors?.length || 0), 0);
          setTotalColorsCount(total);
        } else if (data && typeof data.totalColors === 'number') {
          setTotalColorsCount(data.totalColors);
        } else if (data && typeof data.total === 'number') {
          setTotalColorsCount(data.total);
        }
      })
      .catch(err => {
        console.error('Error loading colors count:', err);
      });
  }, [categorySlug, useJsonColors, resolvedListingMode]);

  // Reset loaded state when the API dataset changes.
  // `listing` mode changes the server payload for nested categories, so we must invalidate the cached client copy too.
  useEffect(() => {
    const datasetKey = `${categorySlug}:${resolvedListingMode}`;
    if (lastDatasetKey.current !== datasetKey) {
      hasLoadedColors.current = false;
      setColorsFromJSON([]);
      setLoadingColors(false);
      setTotalColorsCount(null);
      lastDatasetKey.current = datasetKey;
    }
  }, [categorySlug, resolvedListingMode]);

  // Load colors from JSON when colors tab is active or when initialColorSlug is provided
  useEffect(() => {
    if (!useJsonColors) {
      return;
    }

    // If initialColorSlug is provided, ensure colors tab is active and colors are loaded
    if (initialColorSlug && activeTab !== 'colors') {
      setActiveTab('colors');
    }

    // Load colors immediately when component mounts (for LVT, linoleum, and vinil)
    // This ensures colors are ready when user clicks the "Boje" tab
    if (useJsonColors && !hasLoadedColors.current && !loadingColors) {
      setLoadingColors(true);
      const categoryParam2 = CATEGORY_API_BY_SLUG[categorySlug] || 'lvt';
      const listingParam = resolvedListingMode === 'all' ? '' : `&listing=${resolvedListingMode}`;
      const jsonPath = `/api/colors?category=${categoryParam2}${listingParam}`;

      fetch(jsonPath)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch colors: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          // Handle different JSON structures: LVT has data.colors, Linoleum/Vinil have data.collections[].colors
          let colorsArray: any[] = [];
          if (NESTED_JSON_CATEGORIES.includes(categorySlug as (typeof NESTED_JSON_CATEGORIES)[number]) && data.collections && Array.isArray(data.collections)) {
            const visibleCollections = filterCategoryListingCollections(
              categorySlug,
              data.collections,
              resolvedListingMode
            );
            // Flatten colors from all collections
            colorsArray = visibleCollections.flatMap((collection: any) =>
              (collection.colors || []).map((color: any) => ({
                ...color,
                collection_name: collection.name,
                collection_slug: collection.slug,
                collection: collection.slug
              }))
            );
          } else if (data.colors && Array.isArray(data.colors)) {
            colorsArray = data.colors;
          } else {
            console.error('CategoryTabs: Invalid data structure', data);
            setLoadingColors(false);
            return;
          }

          // Convert colors from JSON to Product objects
          const colorsAsProducts: Product[] = colorsArray.map((color: any, index: number) => {
            // Use brandId from JSON/API if available, otherwise default to Gerflor (6)
            const defaultBrandId = categorySlug === 'lajsne'
              ? '3'
              : (Object.values(brandsRecord).find(b => b.slug === 'gerflor')?.id || '6');
            const brandId = color.brandId || defaultBrandId;

            // Find category ID
            const categoryId = CATEGORY_ID_BY_SLUG[categorySlug] || '6';

            // For LVT: use texture_url (pod images) first, then lifestyle_url (illustrations) as fallback
            // For Linoleum: use image, texture_url, or image_url (gerflor_linoleum uses 'image' field)
            // For Vinil: use image field (local path) or image_url
            const primaryImageUrl = categorySlug === 'lvt'
              ? (color.texture_url || color.lifestyle_url || color.image_url || '')
              : categorySlug === 'vinil' || categorySlug === 'elektroprovodni' || categorySlug === 'industrijske-ploce' || categorySlug === 'sport' || categorySlug === 'lajsne'
                ? (color.image || color.image_url || '')
                : (color.image || color.texture_url || color.image_url || '');

            // Generate slug for nested collection categories
            const colorSlug = color.slug || (
              NESTED_JSON_CATEGORIES.includes(categorySlug as (typeof NESTED_JSON_CATEGORIES)[number])
                ? `${color.collection_slug || color.collection}-${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}`
                : color.slug
            );

            // Determine vinyl type from collection slug
            const collectionSlug = (color.collection_slug || color.collection || '').toLowerCase();
            const characteristicType = typeof color.characteristics?.Tip === 'string' ? color.characteristics.Tip.trim() : '';
            const isHomogeniCollection = collectionSlug.startsWith('mipolam-');
            const productVinylType = characteristicType || (isHomogeniCollection ? 'Homogeni' : 'Heterogeni');

            // Build specs from color data
            const specs: any[] = [];

            // Add collection_specs if available (includes thickness, format, etc.)
            if (color.collection_specs && Array.isArray(color.collection_specs)) {
              specs.push(...color.collection_specs);
            }

            // Add overall_thickness as thickness spec if not already in collection_specs
            if (color.overall_thickness && !specs.find(s => s.key === 'thickness')) {
              specs.push({ key: 'thickness', label: 'Ukupna debljina', value: color.overall_thickness });
            }

            // Add format if available
            if (color.format && !specs.find(s => s.key === 'format')) {
              specs.push({ key: 'format', label: 'Format', value: color.format });
            }

            // Add dimension if available
            if (color.dimension && !specs.find(s => s.key === 'dimension')) {
              specs.push({ key: 'dimension', label: 'Dimenzije', value: color.dimension });
            }

            if (color.characteristics && typeof color.characteristics === 'object') {
              Object.entries(color.characteristics).forEach(([label, value]) => {
                const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                if (typeof value === 'string' && !specs.find(s => s.key === key)) {
                  specs.push({ key, label, value });
                }
              });
            }

            // Add vinyl-specific specs
            if (categorySlug === 'vinil') {
              // Always set the correct type based on collection slug, even if it exists in collection_specs
              const existingTypeIndex = specs.findIndex(s => s.key === 'type');
              if (existingTypeIndex >= 0) {
                specs[existingTypeIndex] = { key: 'type', label: 'Tip', value: productVinylType };
              } else {
                specs.push({ key: 'type', label: 'Tip', value: productVinylType });
              }
              if (!specs.find(s => s.key === 'collection')) {
                specs.push({ key: 'collection', label: 'Kolekcija', value: color.collection_name || color.collection });
              }

              // Add thickness from collection if not already present
              if (!specs.find(s => s.key === 'thickness')) {
                // Find matching collection by slug
                // Try multiple matching strategies:
                // 1. Direct match after removing 'gerflor-' prefix
                // 2. Match by collection name
                const matchingCollection = collections.find(c => {
                  const collectionSlugFromProduct = c.slug.toLowerCase().replace(/^(gerflor|tarkett|wolflor)-/, '');
                  const collectionNameFromProduct = c.name.toLowerCase();
                  const colorCollectionName = (color.collection_name || color.collection || '').toLowerCase();

                  return collectionSlugFromProduct === collectionSlug ||
                    collectionNameFromProduct === colorCollectionName ||
                    collectionSlugFromProduct === collectionSlug.replace(/\s+/g, '-');
                });

                if (matchingCollection) {
                  const thicknessSpec = matchingCollection.specs.find(s => s.key === 'thickness');
                  if (thicknessSpec) {
                    specs.push({ key: 'thickness', label: 'Ukupna debljina', value: thicknessSpec.value });
                  }
                }
              }
            }

            if (!specs.find(s => s.key === 'collection')) {
              specs.push({ key: 'collection', label: 'Kolekcija', value: color.collection_name || color.collection });
            }

            return {
              id: `color-${categorySlug}-${colorSlug}`,
              name: color.full_name || `${color.code} ${color.name}`,
              slug: colorSlug,
              sku: color.code,
              categoryId: categoryId,
              brandId: brandId,
              shortDescription: `${color.collection_name || color.collection} - ${color.name}`,
              description: color.description || `${color.code} ${color.name} iz kolekcije ${color.collection_name || color.collection}`,
              images: primaryImageUrl ? [{
                id: `color-img-${index}`,
                url: primaryImageUrl,
                alt: color.full_name || `${color.code} ${color.name}`,
                isPrimary: true,
                order: 1,
              }] : [],
              specs: specs,
              price: undefined,
              priceUnit: undefined,
              inStock: true,
              featured: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              collectionSlug: color.collection_slug || color.collection,
            } as Product & { collectionSlug: string };
          });

          setColorsFromJSON(colorsAsProducts);
          setLoadingColors(false);
          hasLoadedColors.current = true;
        })
        .catch(err => {
          console.error('Error loading colors from JSON:', err);
          setColorsFromJSON([]);
          setLoadingColors(false);
          hasLoadedColors.current = true; // Mark as loaded even on error to prevent retry loop
        });
    }
  }, [activeTab, categorySlug, loadingColors, brandsRecord, useJsonColors, vinylType, collections, initialColorSlug, resolvedListingMode]);

  // Kolekcije: grid kao ostale kategorije (2–3 kolone). Parket isto kao ceo sajt.
  const isCollectionsSingleColumn = false;

  const renderProducts = (products: Product[], gridKey: string, singleColumn = false) => {
    if (products.length === 0) {
      return (
        <div className="border border-ink-200 bg-white p-12 text-center">
          <h3 className="text-lg font-medium text-ink-900 mb-2">
            Nema proizvoda
          </h3>
          <p className="text-[13px] text-ink-500">
            Trenutno nema proizvoda koji odgovaraju izabranim filterima.
          </p>
        </div>
      );
    }
    const gridClass = singleColumn
      ? 'grid grid-cols-1 gap-6 max-w-2xl'
      : 'grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4';
    return (
      <div key={gridKey} className={gridClass}>
        {products.map((product) => {
          const brand = brandsRecord[product.brandId] || null;
          return (
            <ProductCardClient key={product.id} product={product} brand={brand} />
          );
        })}
      </div>
    );
  };

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 border-b border-ink-200">
        <div className="flex gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('collections')}
            className={`min-h-[44px] px-1 pb-3 text-base font-normal transition-colors duration-200 ${activeTab === 'collections'
              ? 'text-ink-900 border-b-2 border-ink-900'
              : 'text-ink-500 hover:text-ink-600 border-b-2 border-transparent'
              }`}
          >
            Kolekcije ({collectionsToRender.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('colors')}
            className={`min-h-[44px] px-1 pb-3 text-base font-normal transition-colors duration-200 ${activeTab === 'colors'
              ? 'text-ink-900 border-b-2 border-ink-900'
              : 'text-ink-500 hover:text-ink-600 border-b-2 border-transparent'
              }`}
          >
            {colorsTabLabel} ({useJsonColors
              ? (loadingColors
                ? '...'
                : colorsToRender.length)
              : legacyColors.length
            })
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'collections' ? (
          <div>
            <p className="text-[13px] text-ink-500 mb-6">
              {collectionsToRender.length === 0 ? 'Nema' : collectionsToRender.length} {collectionsToRender.length === 1 ? 'kolekcija' : 'kolekcija'}
            </p>
            {renderProducts(collectionsToRender, 'collections', isCollectionsSingleColumn)}
          </div>
        ) : (
          <div>
            {useJsonColors ? (
              isColorsLoading ? (
                <div role="status" aria-busy="true" aria-label={colorsLoadingLabel}>
                  <div className="mb-6 h-4 w-32 animate-pulse bg-paper" />
                  <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index}>
                        <div className="aspect-[4/5] animate-pulse bg-paper" />
                        <div className="mt-3 h-3 w-1/3 animate-pulse bg-paper" />
                        <div className="mt-2 h-4 w-2/3 animate-pulse bg-paper" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[13px] text-ink-500 mb-6">
                    {colorsToRender.length === 0 ? 'Nema' : colorsToRender.length} {colorsCountLabel}
                  </p>
                  {renderProducts(colorsToRender, 'colors')}
                </>
              )
            ) : (
              <>
                <p className="text-[13px] text-ink-500 mb-6">
                  {legacyColors.length === 0 ? 'Nema' : legacyColors.length} {colorsCountLabel}
                </p>

                {(() => {
                  let filteredLegacyColors = legacyColors;
                  if (searchParams?.collections && categorySlug !== 'parket') {
                    const selectedCollections = searchParams.collections.split(',');
                    filteredLegacyColors = legacyColors.filter(color => {
                      const collectionSpec = color.specs.find(s => s.key === 'collection');
                      if (collectionSpec) return selectedCollections.includes(collectionSpec.value);
                      return false;
                    });
                  }
                  return renderProducts(filteredLegacyColors, 'colors-legacy');
                })()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
