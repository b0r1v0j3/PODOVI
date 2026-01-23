import { notFound } from 'next/navigation';
import { readFileSync } from 'fs';
import { join } from 'path';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import LVTTabs from '@/components/LVTTabs';

interface CategoryPageProps {
  params: { slug: string };
  searchParams: {
    search?: string;
    brands?: string;
    priceMin?: string;
    priceMax?: string;
    inStock?: string;
    color?: string;
    type?: string; // For vinyl type filter: 'homogeni' | 'heterogeni'
    collections?: string; // For LVT collection filter (comma-separated)
    thickness?: string; // For overall thickness filter (comma-separated values)
  };
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';
  const category = await categoryRepository.findBySlug(params.slug);

  if (!category) {
    return {
      metadataBase: new URL(baseUrl),
      title: 'Kategorija nije pronađena',
    };
  }

  const allCategoryProducts = await productRepository.findByCategory(category.id);
  const productCount = allCategoryProducts.length;

  return {
    metadataBase: new URL(baseUrl),
    title: `${category.name} - ${productCount} Proizvoda | Podovi.online`,
    description: `${category.description} Pregledajte našu ponudu od ${productCount} proizvoda u kategoriji ${category.name}.`,
    keywords: `${category.name}, podovi, podne obloge, laminat, vinil, parket, Srbija`,
    openGraph: {
      title: `${category.name} - Podovi.online`,
      description: category.description,
      type: 'website',
      locale: 'sr_RS',
      url: `${baseUrl}/kategorije/${params.slug}`,
      siteName: 'Podovi.online',
      images: category.image ? [
        {
          url: category.image,
          width: 1200,
          height: 630,
          alt: category.name,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} - Podovi.online`,
      description: category.description,
      images: category.image ? [category.image] : [],
    },
    alternates: {
      canonical: `${baseUrl}/kategorije/${params.slug}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = await categoryRepository.findBySlug(params.slug);

  if (!category) {
    notFound();
  }

  // Parse filters from search params (but exclude collections filter for now)
  const filtersWithoutCollections = {
    categoryId: category.id,
    search: searchParams.search,
    brandIds: searchParams.brands ? searchParams.brands.split(',') : undefined,
    priceMin: searchParams.priceMin ? parseFloat(searchParams.priceMin) : undefined,
    priceMax: searchParams.priceMax ? parseFloat(searchParams.priceMax) : undefined,
    inStock: searchParams.inStock === 'true' ? true : undefined,
    type: searchParams.type, // For vinyl type filter
    thickness: searchParams.thickness ? searchParams.thickness.split(',') : undefined,
    // collections filter will be applied separately after separating collections from colors
  };

  // Get all products first (without collection filter) to properly separate collections from colors
  const allProducts = await productRepository.findByCategory(category.id, filtersWithoutCollections);
  const allBrands = await brandRepository.findAll();

  // Get unique brands used in this category
  const categoryProducts = await productRepository.findByCategory(category.id);
  const categoryBrandIds = new Set(categoryProducts.map(p => p.brandId));
  const availableBrands = allBrands.filter(b => categoryBrandIds.has(b.id));

  // Get ALL products without any filters to calculate available thickness options
  // This ensures all thickness options remain visible even when one is selected
  const allProductsForThickness = await productRepository.findByCategory(category.id);

  // For LVT, Linoleum, Carpet, and Vinil categories, separate collections from colors
  const isLVTCategory = category.slug === 'lvt' || category.slug === 'linoleum' || category.slug === 'tekstilne-ploce' || category.slug === 'vinil';
  let collections: typeof allProducts = [];
  let colors: typeof allProducts = [];
  let availableCollections: string[] = [];
  let availableThickness: string[] = [];
  let availableThicknessByType: { homogeni: string[]; heterogeni: string[] } = { homogeni: [], heterogeni: [] };
  
  // For non-LVT categories, get filtered products
  const filteredProducts = isLVTCategory ? [] : allProducts;

  // Create brands object for Client Component (serializable)
  const brandsRecord: Record<string, typeof allBrands[0]> = {};
  if (isLVTCategory) {
    // Collections are products with SKU starting with "GER-" (LVT/Vinil), "LINOLEUM-" (Linoleum), "VINIL-" (Vinil)
    // Colors are individual color products with 4-digit SKU codes or other patterns
    const allCollections = allProducts.filter(p => (p.sku?.startsWith('GER-') || p.sku?.startsWith('LINOLEUM-') || p.sku?.startsWith('VINIL-')) ?? false);
    colors = allProducts.filter(p => !(p.sku?.startsWith('GER-') || p.sku?.startsWith('LINOLEUM-') || p.sku?.startsWith('VINIL-')));

    // Extract unique LVT collection names for filter FIRST (before filtering)
    // This ensures all collections remain visible in the filter dropdown
    if (category.slug === 'lvt') {
      const collectionGroups = new Set<string>();
      allCollections.forEach(p => {
        const name = p.name;
        // Check for Saga first (since "Creation Saga²" contains both "Creation" and "Saga")
        if (name.includes('Saga') || name.includes('SAGA')) {
          collectionGroups.add('SAGA²');
        } else if (name.includes('Creation')) {
          // Extract base collection number (30, 40, 55, 70)
          // Zen variants are included in their base collection
          if (name.includes('Creation 30')) {
            collectionGroups.add('Creation 30');
          } else if (name.includes('Creation 40')) {
            collectionGroups.add('Creation 40');
          } else if (name.includes('Creation 55')) {
            collectionGroups.add('Creation 55');
          } else if (name.includes('Creation 70')) {
            collectionGroups.add('Creation 70');
          }
        }
      });
      // Sort in specific order: Creation 30, 40, 55, 70, SAGA²
      const order = ['Creation 30', 'Creation 40', 'Creation 55', 'Creation 70', 'SAGA²'];
      availableCollections = Array.from(collectionGroups).sort((a, b) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }

    // Extract unique thickness values from our actual data (collections + colors from JSON)
    // For LVT: from collections specs and JSON colors
    // For Vinil: from collections specs and JSON colors (if available)
    // For Linoleum: from collections specs
    // IMPORTANT: Use allProductsForThickness (without filters) to ensure all options remain visible
    if (category.slug === 'lvt' || category.slug === 'vinil' || category.slug === 'linoleum') {
      const thicknessSet = new Set<string>();
      const thicknessSetHomogeni = new Set<string>();
      const thicknessSetHeterogeni = new Set<string>();
      
      // Get all collections from unfiltered products to calculate available thickness
      const allCollectionsForThickness = allProductsForThickness.filter(p => (p.sku?.startsWith('GER-') || p.sku?.startsWith('LINOLEUM-') || p.sku?.startsWith('VINIL-')) ?? false);
      
      // Get thicknesses from collections (using unfiltered products)
      allCollectionsForThickness.forEach(p => {
        const thicknessSpec = p.specs.find(s => s.key === 'thickness');
        if (thicknessSpec) {
          const normalizedValue = thicknessSpec.value.replace(/,/g, '.').replace(/\s+/g, '').replace(/mm/gi, '').trim();
          const thicknessValue = parseFloat(normalizedValue);
          if (!isNaN(thicknessValue)) {
            const thicknessStr = thicknessValue.toFixed(2);
            thicknessSet.add(thicknessStr);
            
            // For Vinil: separate by type
            if (category.slug === 'vinil') {
              const typeSpec = p.specs.find(s => s.key === 'type');
              if (typeSpec) {
                const productType = typeSpec.value.toLowerCase();
                if (productType === 'homogeni') {
                  thicknessSetHomogeni.add(thicknessStr);
                } else if (productType === 'heterogeni') {
                  thicknessSetHeterogeni.add(thicknessStr);
                }
              }
            }
          }
        }
      });
      
      // Get thicknesses from colors in JSON file
      try {
        let jsonFileName: string;
        if (category.slug === 'lvt') {
          jsonFileName = 'lvt_colors_complete.json';
        } else if (category.slug === 'vinil') {
          jsonFileName = 'vinyl_colors_complete.json';
        } else if (category.slug === 'linoleum') {
          jsonFileName = 'linoleum_colors_complete.json';
        } else {
          jsonFileName = '';
        }
        
        if (jsonFileName) {
          const jsonPath = join(process.cwd(), 'public', 'data', jsonFileName);
          const jsonData = JSON.parse(readFileSync(jsonPath, 'utf8'));
          
          if (category.slug === 'vinil' && jsonData.collections && Array.isArray(jsonData.collections)) {
            // For Vinil: process collections structure
            jsonData.collections.forEach((collection: any) => {
              const collectionSlug = (collection.slug || '').toLowerCase();
              const isHomogeniCollection = collectionSlug.startsWith('mipolam-');
              
              if (collection.colors && Array.isArray(collection.colors)) {
                collection.colors.forEach((color: any) => {
                  const thicknessValue = color.overall_thickness || color.thickness || color.debljina;
                  if (thicknessValue) {
                    const normalizedValue = String(thicknessValue).replace(/,/g, '.').replace(/\s+/g, '').replace(/mm/gi, '').trim();
                    const parsedValue = parseFloat(normalizedValue);
                    if (!isNaN(parsedValue)) {
                      const thicknessStr = parsedValue.toFixed(2);
                      thicknessSet.add(thicknessStr);
                      if (isHomogeniCollection) {
                        thicknessSetHomogeni.add(thicknessStr);
                      } else {
                        thicknessSetHeterogeni.add(thicknessStr);
                      }
                    }
                  }
                });
              }
            });
          } else if (jsonData.colors && Array.isArray(jsonData.colors)) {
            // For LVT and Linoleum: process colors array
            jsonData.colors.forEach((color: any) => {
              const thicknessValue = color.overall_thickness || color.thickness || color.debljina;
              if (thicknessValue) {
                const normalizedValue = String(thicknessValue).replace(/,/g, '.').replace(/\s+/g, '').replace(/mm/gi, '').trim();
                const parsedValue = parseFloat(normalizedValue);
                if (!isNaN(parsedValue)) {
                  thicknessSet.add(parsedValue.toFixed(2));
                }
              }
            });
          }
        }
      } catch (error) {
        console.error(`Error reading ${category.slug} colors JSON:`, error);
      }
      
      // Sort thickness values numerically
      availableThickness = Array.from(thicknessSet).sort((a, b) => parseFloat(a) - parseFloat(b));
      
      // For Vinil: also sort by type
      if (category.slug === 'vinil') {
        availableThicknessByType = {
          homogeni: Array.from(thicknessSetHomogeni).sort((a, b) => parseFloat(a) - parseFloat(b)),
          heterogeni: Array.from(thicknessSetHeterogeni).sort((a, b) => parseFloat(a) - parseFloat(b))
        };
      }
    }

    // Apply collection filter ONLY to collections (not to colors) - only for LVT
    // This happens AFTER extracting availableCollections so filter options remain visible
    if (category.slug === 'lvt') {
      const selectedCollections = searchParams.collections ? searchParams.collections.split(',') : [];
      if (selectedCollections.length > 0) {
        collections = allCollections.filter(p => {
          const productName = p.name;
          return selectedCollections.some(collection => {
            if (collection === 'Creation 30') {
              return productName.includes('Creation 30');
            } else if (collection === 'Creation 40') {
              return productName.includes('Creation 40');
            } else if (collection === 'Creation 55') {
              return productName.includes('Creation 55');
            } else if (collection === 'Creation 70') {
              return productName.includes('Creation 70');
            } else if (collection === 'SAGA²' || collection.includes('SAGA')) {
              return productName.includes('Saga');
            }
            return false;
          });
        });
      } else {
        // If no collection filter is selected, show all collections
        collections = allCollections;
      }
    } else {
      // For Vinil and other categories, show all collections (no collection filter)
      collections = allCollections;
    }

    // Build brands record for all products
    for (const product of allProducts) {
      if (!brandsRecord[product.brandId]) {
        const brand = allBrands.find(b => b.id === product.brandId);
        if (brand) {
          brandsRecord[product.brandId] = brand;
        }
      }
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container py-6">
          <nav className="text-sm text-gray-600 mb-4">
            <a href="/" className="hover:text-primary-600">Početna</a>
            <span className="mx-2">/</span>
            <a href="/kategorije" className="hover:text-primary-600">Kategorije</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{category.name}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
            {category.name}
          </h1>
          <p className="text-base md:text-lg text-gray-600">
            {category.description}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:w-60 flex-shrink-0">
            <ProductFilters
              availableBrands={availableBrands}
              currentFilters={filtersWithoutCollections}
              availableCollections={availableCollections}
              availableThickness={availableThickness}
              availableThicknessByType={category.slug === 'vinil' ? availableThicknessByType : undefined}
            />
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {isLVTCategory ? (
              <LVTTabs
                collections={collections}
                colors={colors}
                brandsRecord={brandsRecord}
                categorySlug={category.slug}
                initialColorSlug={searchParams.color}
                vinylType={searchParams.type}
                searchParams={{
                  search: searchParams.search,
                  brands: searchParams.brands,
                  collections: searchParams.collections,
                  thickness: searchParams.thickness,
                }}
              />
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-gray-600">
                    {filteredProducts.length === 0 ? 'Nema' : filteredProducts.length} {filteredProducts.length === 1 ? 'proizvod' : 'proizvoda'}
                  </p>
                </div>

                {filteredProducts.length === 0 ? (
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
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
