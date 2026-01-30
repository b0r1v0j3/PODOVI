'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product, Brand } from '@/types';
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

interface LVTTabsProps {
  collections: Product[];
  colors: Product[]; // Legacy fallback for non-JSON categories (Parket)
  brandsRecord: Record<string, Brand>;
  categorySlug: string; // 'lvt' | 'linoleum' | 'vinil' | 'tekstilne-ploce' | 'parket'
  initialColorSlug?: string; // Optional color slug to automatically open and highlight
  vinylType?: string; // For vinyl type filter: 'homogeni' | 'heterogeni'
  searchParams?: {
    search?: string;
    brands?: string;
    collections?: string;
    thickness?: string;
  };
}

export default function LVTTabs({ collections, colors: legacyColors, brandsRecord, categorySlug, initialColorSlug, vinylType, searchParams: searchParamsProp }: LVTTabsProps) {
  // Get search params from URL (fallback to prop if provided)
  const urlSearchParams = useSearchParams();
  const searchParams = searchParamsProp || {
    search: urlSearchParams.get('search') || undefined,
    brands: urlSearchParams.get('brands') || undefined,
    collections: urlSearchParams.get('collections') || undefined,
    thickness: urlSearchParams.get('thickness') || undefined,
  };

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
  const lastCategorySlug = useRef<string>('');
  const useJsonColors = categorySlug === 'linoleum' || categorySlug === 'lvt' || categorySlug === 'vinil';
  const isColorsLoading = useJsonColors && activeTab === 'colors' && (!hasLoadedColors.current || loadingColors);
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

    return filtered;
  }, [collections, useJsonColors, categorySlug, vinylType, searchParams]);

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
          const collectionSlugFromProduct = c.slug.toLowerCase().replace('gerflor-', '');
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
          const collectionNameWithoutPrefix = collectionName.replace('gerflor-', '');

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
  }, [colorsFromJSON, categorySlug, vinylType, useJsonColors, searchParams, collections, legacyColors]); // Added legacyColors dependency

  // Load total count from JSON on mount (without loading all colors)
  useEffect(() => {
    if (!useJsonColors) {
      setTotalColorsCount(null);
      return;
    }

    const jsonPath = categorySlug === 'linoleum'
      ? '/data/gerflor_linoleum_colors_complete.json'
      : categorySlug === 'vinil'
        ? '/data/vinyl_colors_complete.json'
        : '/data/lvt_colors_complete.json';

    fetch(jsonPath)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch colors: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if ((categorySlug === 'vinil' || categorySlug === 'linoleum') && data.collections) {
          // For Vinil/Linoleum, count colors from all collections
          const total = data.collections.reduce((sum: number, collection: any) =>
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
  }, [categorySlug, useJsonColors, legacyColors]);

  // Reset loaded state when category changes
  useEffect(() => {
    if (lastCategorySlug.current !== categorySlug) {
      hasLoadedColors.current = false;
      setColorsFromJSON([]);
      setTotalColorsCount(null);
      lastCategorySlug.current = categorySlug;
    }
  }, [categorySlug]);

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
      const jsonPath = categorySlug === 'linoleum'
        ? '/data/gerflor_linoleum_colors_complete.json'
        : categorySlug === 'vinil'
          ? '/data/vinyl_colors_complete.json'
          : '/data/lvt_colors_complete.json';

      console.log(`LVTTabs: Fetching colors from ${jsonPath}...`);
      fetch(jsonPath)
        .then(res => {
          console.log(`LVTTabs: Fetch response status:`, res.status, res.statusText);
          if (!res.ok) {
            throw new Error(`Failed to fetch colors: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log(`LVTTabs: JSON parsed successfully, data:`, data ? `total=${data.total}, colors=${data.colors?.length}` : 'null');

          // Handle different JSON structures: LVT has data.colors, Linoleum/Vinil have data.collections[].colors
          let colorsArray: any[] = [];
          if ((categorySlug === 'vinil' || categorySlug === 'linoleum') && data.collections && Array.isArray(data.collections)) {
            // Flatten colors from all collections
            colorsArray = data.collections.flatMap((collection: any) =>
              (collection.colors || []).map((color: any) => ({
                ...color,
                collection_name: collection.name,
                collection_slug: collection.slug,
                collection: collection.slug
              }))
            );
            console.log(`LVTTabs: Loaded ${colorsArray.length} colors from ${data.collections.length} collections for ${categorySlug}`);
          } else if (data.colors && Array.isArray(data.colors)) {
            colorsArray = data.colors;
            console.log(`LVTTabs: Loaded ${colorsArray.length} colors from JSON for category ${categorySlug}`);
          } else {
            console.error('LVTTabs: Invalid data structure', data);
            setLoadingColors(false);
            return;
          }

          // Convert colors from JSON to Product objects
          const colorsAsProducts: Product[] = colorsArray.map((color: any, index: number) => {
            // Find brand ID (Gerflor = '6')
            const gerflorBrand = Object.values(brandsRecord).find(b => b.slug === 'gerflor');
            const brandId = gerflorBrand?.id || '6';

            // Find category ID
            const categoryId = categorySlug === 'linoleum' ? '7' : categorySlug === 'vinil' ? '2' : '6';

            // For LVT: use texture_url (pod images) first, then lifestyle_url (illustrations) as fallback
            // For Linoleum: use image, texture_url, or image_url (gerflor_linoleum uses 'image' field)
            // For Vinil: use image field (local path) or image_url
            const primaryImageUrl = categorySlug === 'lvt'
              ? (color.texture_url || color.lifestyle_url || color.image_url || '')
              : categorySlug === 'vinil'
                ? (color.image || color.image_url || '')
                : (color.image || color.texture_url || color.image_url || '');

            // Generate slug for Vinil colors (format: collection-slug-color-code-color-name)
            const colorSlug = categorySlug === 'vinil'
              ? `${color.collection_slug || color.collection}-${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}`
              : color.slug;

            // Determine vinyl type from collection slug
            // Homogeni collections: mipolam-* (Mipolam Accord, Mipolam Affinity, etc.)
            // Heterogeni collections: nerok-*, premium-*, taralay-* (Nerok, Premium, Taralay)
            const collectionSlug = (color.collection_slug || color.collection || '').toLowerCase();
            const isHomogeniCollection = collectionSlug.startsWith('mipolam-');
            const productVinylType = isHomogeniCollection ? 'Homogeni' : 'Heterogeni';

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
                  const collectionSlugFromProduct = c.slug.toLowerCase().replace('gerflor-', '');
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

            return {
              id: `color-${categorySlug}-${colorSlug}`,
              name: color.full_name || `${color.code} ${color.name}`,
              slug: colorSlug,
              sku: color.code,
              categoryId: categoryId,
              brandId: brandId,
              shortDescription: `${color.collection_name || color.collection} - ${color.name}`,
              description: `${color.code} ${color.name} iz kolekcije ${color.collection_name || color.collection}`,
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

          console.log(`LVTTabs: Converted ${colorsAsProducts.length} colors to Product objects`);
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
  }, [activeTab, categorySlug, loadingColors, brandsRecord, useJsonColors, vinylType, collections]);

  const renderProducts = (products: Product[], gridKey: string) => {
    if (products.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nema proizvoda
          </h3>
          <p className="text-gray-600">
            Trenutno nema proizvoda koji odgovaraju izabranim filterima.
          </p>
        </div>
      );
    }
    return (
      <div key={gridKey} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('collections')}
            className={`pb-3 px-1 font-semibold text-base transition-colors duration-200 ${activeTab === 'collections'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            Kolekcije ({collectionsToRender.length})
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`pb-3 px-1 font-semibold text-base transition-colors duration-200 ${activeTab === 'colors'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            {(categorySlug as string) === 'parket' ? 'Proizvodi' : 'Boje'} ({useJsonColors
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
            <p className="text-gray-600 mb-6">
              {collectionsToRender.length === 0 ? 'Nema' : collectionsToRender.length} {collectionsToRender.length === 1 ? 'kolekcija' : 'kolekcija'}
            </p>
            {renderProducts(collectionsToRender, 'collections')}
          </div>
        ) : (
          <div>
            {useJsonColors ? (
              isColorsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <p className="mt-4 text-gray-600">Učitavam boje...</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-6">
                    {colorsToRender.length === 0 ? 'Nema' : colorsToRender.length} {colorsToRender.length === 1 ? 'boja' : 'boja'}
                  </p>
                  {renderProducts(colorsToRender, 'colors')}
                </>
              )
            ) : (
              <>
                <p className="text-gray-600 mb-6">
                  {legacyColors.length === 0
                    ? 'Nema'
                    : (categorySlug as string) === 'parket'
                      ? `${legacyColors.length} ${legacyColors.length === 1 ? 'proizvod' : 'proizvoda'}`
                      : `${legacyColors.length} ${legacyColors.length === 1 ? 'boja' : 'boja'}`
                  }
                </p>

                {/* Collection Header for Parket/Generic */}
                {searchParams?.collections && searchParams.collections.split(',').length === 1 && (
                  (() => {
                    const selectedCollectionName = searchParams.collections;
                    const collectionProduct = collections.find(c =>
                      c.name === selectedCollectionName ||
                      c.slug === selectedCollectionName ||
                      c.slug === selectedCollectionName.toLowerCase() ||
                      c.name.toLowerCase() === selectedCollectionName.toLowerCase()
                    );
                    if (collectionProduct) {
                      return (
                        <div className="mb-12 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                          <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="relative h-64 lg:h-auto min-h-[300px]">
                              <img
                                src={collectionProduct.images[0]?.url || '/images/placeholder.jpg'}
                                alt={collectionProduct.name}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-8 lg:p-10 flex flex-col justify-center">
                              <h2 className="text-3xl font-bold text-gray-900 mb-4">{collectionProduct.name}</h2>

                              {/* Description - handle HTML content safely */}
                              <div
                                className="prose prose-sm text-gray-600 mb-6"
                                dangerouslySetInnerHTML={{ __html: collectionProduct.description }}
                              />

                              {/* Features */}
                              {collectionProduct.detailsSections?.find(s => s.title === 'Ključne karakteristike') && (
                                <div className="bg-gray-50 rounded-lg p-5">
                                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                                    Ključne karakteristike
                                  </h3>
                                  <ul className="space-y-2">
                                    {collectionProduct.detailsSections
                                      .find(s => s.title === 'Ključne karakteristike')
                                      ?.items.map((item, idx) => (
                                        <li key={idx} className="flex items-start">
                                          <svg className="w-5 h-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                          <span className="text-sm text-gray-700">{item}</span>
                                        </li>
                                      ))
                                    }
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()
                )}



                {(() => {
                  // Za Parket: boje su već filtrirane po efektivnoj kolekciji na serveru, ne filtriraj ponovo (spec ima "Parket")
                  let filteredLegacyColors = legacyColors;
                  if (searchParams?.collections && categorySlug !== 'parket') {
                    const selectedCollections = searchParams.collections.split(',');
                    filteredLegacyColors = legacyColors.filter(color => {
                      const collectionSpec = color.specs.find(s => s.key === 'collection');
                      if (collectionSpec) {
                        return selectedCollections.includes(collectionSpec.value);
                      }
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