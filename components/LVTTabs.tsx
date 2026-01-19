'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  colors: Product[]; // Legacy fallback for non-JSON categories
  brandsRecord: Record<string, Brand>;
  categorySlug: string; // 'lvt', 'linoleum', or 'tekstilne-ploce'
  initialColorSlug?: string; // Optional color slug to automatically open and highlight
  vinylType?: string; // For vinyl type filter: 'homogeni' | 'heterogeni'
}

export default function LVTTabs({ collections, colors: legacyColors, brandsRecord, categorySlug, initialColorSlug, vinylType }: LVTTabsProps) {
  // If initialColorSlug is provided, start with 'colors' tab active
  const [activeTab, setActiveTab] = useState<'collections' | 'colors'>(
    initialColorSlug ? 'colors' : 'collections'
  );
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
    
    return filtered;
  }, [collections, useJsonColors, categorySlug, vinylType]);

  // Filter colors by vinyl type
  const colorsToRender = useMemo(() => {
    if (!useJsonColors || categorySlug !== 'vinil' || !vinylType) {
      return colorsFromJSON;
    }
    
    const typeFilter = vinylType.toLowerCase();
    return colorsFromJSON.filter(color => {
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
  }, [colorsFromJSON, categorySlug, vinylType, useJsonColors]);

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

    if ((activeTab === 'colors' || initialColorSlug) && !hasLoadedColors.current && !loadingColors) {
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
            // For Linoleum: use texture_url or image_url (no lifestyle_url available)
            // For Vinil: use image field (local path) or image_url
            const primaryImageUrl = categorySlug === 'lvt' 
              ? (color.texture_url || color.lifestyle_url || color.image_url || '')
              : categorySlug === 'vinil'
              ? (color.image || color.image_url || '')
              : (color.texture_url || color.image_url || '');

            // Generate slug for Vinil colors (format: collection-slug-color-code-color-name)
            const colorSlug = categorySlug === 'vinil' 
              ? `${color.collection_slug || color.collection}-${color.code}-${color.name.toLowerCase().replace(/\s+/g, '-')}`
              : color.slug;

            // Determine vinyl type from color or collection
            // For now, all vinyl collections are homogeneous, but this can be extended
            const productVinylType = color.type === 'heterogeneous' ? 'Heterogeni' : 'Homogeni';
            
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
              specs: categorySlug === 'vinil' ? [
                { key: 'type', label: 'Tip', value: productVinylType },
                { key: 'collection', label: 'Kolekcija', value: color.collection_name || color.collection },
              ] : [],
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
  }, [activeTab, categorySlug, loadingColors, brandsRecord, useJsonColors, vinylType]);

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
            className={`pb-3 px-1 font-semibold text-base transition-colors duration-200 ${
              activeTab === 'collections'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Kolekcije ({collectionsToRender.length})
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`pb-3 px-1 font-semibold text-base transition-colors duration-200 ${
              activeTab === 'colors'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Boje ({useJsonColors
              ? (loadingColors
                  ? '...'
                  : (colorsToRender.length > 0
                      ? colorsToRender.length
                      : (vinylType && categorySlug === 'vinil' ? 0 : (totalColorsCount ?? '...'))))
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
                  {legacyColors.length === 0 ? 'Nema' : legacyColors.length} {legacyColors.length === 1 ? 'boja' : 'boja'}
                </p>
                {renderProducts(legacyColors, 'colors-legacy')}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}