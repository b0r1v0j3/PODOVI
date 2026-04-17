import { notFound } from 'next/navigation';
import { readFileSync } from 'fs';
import { join } from 'path';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import { getEffectiveParketCollection, getAllParketVariantSlugs, getParketCollectionSlug } from '@/lib/data/parket-collection-mapping';
import { filterCategoryListingCollections, resolveCategoryListingMode } from '@/lib/catalog/listing-curation';
import { generateBreadcrumbSchema, generateCollectionPageSchema, generateProductListSchema } from '@/lib/seo/structured-data';
import { getCategoryPageCopy } from '@/lib/seo/listing-page-copy';
import { createMetadataImage, getMetadataImageUrls } from '@/lib/utils/product-images';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import CategoryTabs from '@/components/CategoryTabs';
import Breadcrumbs from '@/components/Breadcrumbs';

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
    family?: string; // For BLOQ family filter (comma-separated)
    listing?: string; // For core/accessory listing segmentation
    thickness?: string; // For overall thickness filter (comma-separated values)
    woodType?: string; // For Parket: Hrast | Jasen
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

  const categoryCopy = getCategoryPageCopy(category);
  const metadataImages = [
    createMetadataImage(category.image, baseUrl, {
      width: 1200,
      height: 630,
      alt: category.name,
    }),
  ].filter((image): image is NonNullable<ReturnType<typeof createMetadataImage>> => Boolean(image));
  const twitterImages = getMetadataImageUrls(metadataImages);

  return {
    metadataBase: new URL(baseUrl),
    title: categoryCopy.metaTitle,
    description: categoryCopy.metaDescription,
    keywords: categoryCopy.keywords,
    openGraph: {
      title: categoryCopy.metaTitle,
      description: categoryCopy.metaDescription,
      type: 'website',
      locale: 'sr_RS',
      url: `${baseUrl}/kategorije/${params.slug}`,
      siteName: 'podovi.online',
      images: metadataImages.length > 0 ? metadataImages : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: categoryCopy.metaTitle,
      description: categoryCopy.metaDescription,
      images: twitterImages,
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';
  const categoryCopy = getCategoryPageCopy(category);

  // Parse filters from search params (but exclude collections filter for now)
  // For laminat: don't apply thickness filter here - we handle it manually since laminat uses 'overall_thickness' spec
  const isLaminat = category.slug === 'laminat';
  const filtersWithoutCollections = {
    categoryId: category.id,
    search: searchParams.search,
    brandIds: searchParams.brands ? searchParams.brands.split(',') : undefined,
    priceMin: searchParams.priceMin ? parseFloat(searchParams.priceMin) : undefined,
    priceMax: searchParams.priceMax ? parseFloat(searchParams.priceMax) : undefined,
    inStock: searchParams.inStock === 'true' ? true : undefined,
    type: searchParams.type, // For vinyl type filter
    // Laminat: don't filter by thickness in repository (we do it manually); others: use repository filter
    thickness: isLaminat ? undefined : (searchParams.thickness ? searchParams.thickness.split(',') : undefined),
    woodType: searchParams.woodType, // For Parket: Hrast | Jasen
    // collections and family filter will be applied separately after separating collections from colors
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

  // For LVT, Linoleum, Carpet, Vinil, Parket, Laminat – separate collections from colors
  const isTechemMatCategory = category.slug === 'otiraci';
  // Techem enters the catalog as a flat branch until the supplier data model proves real
  // color/variant selectors that should split listing into collection tabs.
  const hasCollectionTabs = !isTechemMatCategory && (
    category.slug === 'lvt' ||
    category.slug === 'linoleum' ||
    category.slug === 'tekstilne-ploce' ||
    category.slug === 'vinil' ||
    category.slug === 'parket' ||
    category.slug === 'laminat' ||
    category.slug === 'elektroprovodni' ||
    category.slug === 'industrijske-ploce' ||
    category.slug === 'sport' ||
    category.slug === 'lajsne'
  );
  const listingMode = resolveCategoryListingMode(searchParams.listing, category.slug);
  let collections: typeof allProducts = [];
  let colors: typeof allProducts = [];
  let availableCollections: string[] = [];
  let availableFamilies: string[] = [];
  let availableWoodTypes: { value: string; count: number }[] = [];
  let availableThickness: string[] = [];
  let availableThicknessByType: { homogeni: string[]; heterogeni: string[] } = { homogeni: [], heterogeni: [] };

  // For non-LVT categories, get filtered products
  const filteredProducts = hasCollectionTabs ? [] : allProducts;

  // Create brands object for Client Component (serializable)
  const brandsRecord: Record<string, typeof allBrands[0]> = {};
  if (hasCollectionTabs) {
    // Collections: GER-, TARKETT-, WOLFLOR-VINYL-, LINOLEUM-, VINIL-, PARKET-, LAM-, BLOQ-, DEKING-, ESD-, IND-, SPORT-
    // Colors: products without those SKU prefixes
    const hasCollectionSku = (p: { sku?: string | null }) =>
      (
        p.sku?.startsWith('GER-') ||
        p.sku?.startsWith('TARKETT-') ||
        p.sku?.startsWith('WOLFLOR-VINYL-') ||
        p.sku?.startsWith('LINOLEUM-') ||
        p.sku?.startsWith('VINIL-') ||
        p.sku?.startsWith('PARKET-') ||
        p.sku?.startsWith('LAM-') ||
        p.sku?.startsWith('BLOQ-') ||
        p.sku?.startsWith('DEKING-') ||
        p.sku?.startsWith('ESD-') ||
        p.sku?.startsWith('IND-') ||
        p.sku?.startsWith('SPORT-') ||
        p.sku?.startsWith('TARKETT-LAJSNE-')
      ) ?? false;
    const allCollections = filterCategoryListingCollections(
      category.slug,
      allProducts.filter(p => hasCollectionSku(p)),
      listingMode
    );
    if (category.slug === 'parket') {
      // Parket: tab Boje prikazuje samo 73 varijante iz kolekcija (jedan proizvod po slug-u), ne sve proizvode
      const validSlugs = new Set(getAllParketVariantSlugs());
      const seen = new Set<string>();
      colors = allProducts
        .filter(p => !hasCollectionSku(p))
        .filter(p => {
          if (!validSlugs.has(p.slug)) return false;
          if (seen.has(p.slug)) return false;
          seen.add(p.slug);
          return true;
        });
    } else {
      colors = allProducts.filter(p => !hasCollectionSku(p));
      // Laminat: jedan proizvod po slug-u u tabu Boje (bez duplikata)
      if (category.slug === 'laminat') {
        const seen = new Set<string>();
        colors = colors.filter(p => {
          if (!p.slug) return true;
          if (seen.has(p.slug)) return false;
          seen.add(p.slug);
          return true;
        });

        // Takođe dedup kolekcija (za svaki slučaj) i BACKFILL slika iz varijanti ako header nema sliku
        const byCollectionName = new Map<string, typeof collections[0]>();
        for (const p of collections) {
          const collectionName = p.specs?.find(s => s.key === 'collection')?.value || p.specs?.find(s => s.key === 'brand_line')?.value || p.name;

          // Try to find a better image if current one is missing
          let productToStore = p;
          if ((!p.images || p.images.length === 0) && colors.length > 0) {
            const variant = colors.find(c => c.specs?.find(s => s.key === 'collection')?.value === collectionName);
            if (variant && variant.images && variant.images.length > 0) {
              productToStore = { ...p, images: variant.images };
            }
          }

          if (!byCollectionName.has(collectionName)) {
            byCollectionName.set(collectionName, productToStore);
          }
        }
        collections = Array.from(byCollectionName.values());
      }
    }

    // Extract unique LVT collection names for filter FIRST (before filtering)
    // This ensures all collections remain visible in the filter dropdown
    if (category.slug === 'lvt') {
      const collectionGroups = new Set<string>();
      allCollections.forEach(p => {
        // For Tarkett collections: use the 'collection' spec value
        const collSpec = p.specs?.find((s: { key: string }) => s.key === 'collection')?.value;
        if (p.sku?.startsWith('TARKETT-') && collSpec) {
          collectionGroups.add(collSpec);
          return;
        }
        // For Gerflor collections: use name-based matching
        const name = p.name;
        if (name.includes('Saga') || name.includes('SAGA')) {
          collectionGroups.add('SAGA²');
        } else if (name.includes('Creation')) {
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
      // Sort: Gerflor first (Creation order), then Tarkett alphabetically
      const gerflorOrder = ['Creation 30', 'Creation 40', 'Creation 55', 'Creation 70', 'SAGA²'];
      availableCollections = Array.from(collectionGroups).sort((a, b) => {
        const indexA = gerflorOrder.indexOf(a);
        const indexB = gerflorOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }

    // Laminat: kolekcije iz LAM- proizvoda (spec "collection" ili name)
    if (category.slug === 'laminat') {
      const names = allCollections
        .filter(p => p.sku?.startsWith('LAM-'))
        .map(p => p.specs?.find(s => s.key === 'collection')?.value || p.specs?.find(s => s.key === 'brand_line')?.value || p.name)
        .filter((v): v is string => Boolean(v));
      availableCollections = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    }

    // Parket: kolekcije iz spec "collection", za varijante (collection "Parket") koristimo efektivnu kolekciju iz mapiranja
    if (category.slug === 'parket') {
      const names = allCollections
        .map(p => {
          const specVal = p.specs?.find(s => s.key === 'collection')?.value;
          return getEffectiveParketCollection(p.slug, specVal) || specVal || p.name;
        })
        .filter((v): v is string => Boolean(v) && v !== 'Parket');
      availableCollections = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));

      // Parket: vrsta drveta (Hrast / Jasen) – iz spec wood_type/wood_species ili iz slug-a (hrast-*, jasen-*, *-oak)
      const getWoodTypes = (p: { specs?: { key: string; value: string }[]; slug: string }): string[] => {
        const spec = p.specs?.find(s => s.key === 'wood_type' || s.key === 'wood_species');
        const raw = spec?.value?.trim();
        if (raw) return raw.split(',').map(part => part.trim()).filter(Boolean);
        const s = (p.slug || '').toLowerCase();
        if (s.startsWith('jasen') || s.includes('-jasen-')) return ['Jasen'];
        if (s.startsWith('hrast') || s.includes('-hrast-') || s.includes('oak')) return ['Hrast'];
        return ['Hrast'];
      };
      const woodCounts: Record<string, number> = {};
      colors.forEach(p => {
        getWoodTypes(p).forEach(value => {
          woodCounts[value] = (woodCounts[value] ?? 0) + 1;
        });
      });
      availableWoodTypes = Object.entries(woodCounts)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value));
    }

    // Tekstilne ploče: extract BLOQ families (brand 8)
    if (category.slug === 'tekstilne-ploce') {
      const familySet = new Set<string>();
      allCollections.forEach(p => {
        if (p.brandId !== '8') return; // Only BLOQ
        const familySpec = p.specs?.find((s: { key: string }) => s.key === 'family')?.value;
        if (familySpec) {
          familySet.add(familySpec);
        }
      });
      availableFamilies = Array.from(familySet).sort((a, b) => a.localeCompare(b));
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
      const allCollectionsForThickness = allProductsForThickness.filter(p =>
        (
          p.sku?.startsWith('GER-') ||
          p.sku?.startsWith('TARKETT-') ||
          p.sku?.startsWith('WOLFLOR-VINYL-') ||
          p.sku?.startsWith('LINOLEUM-') ||
          p.sku?.startsWith('VINIL-')
        ) ?? false
      );

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

    // Laminat: extract thickness values from product specs
    // IMPORTANT: Use allProductsForThickness (without filters) to ensure all options remain visible
    if (category.slug === 'laminat') {
      const thicknessSet = new Set<string>();

      // Get thickness from all laminate products (using unfiltered products)
      allProductsForThickness.forEach(p => {
        const thicknessSpec = p.specs?.find(s => s.key === 'thickness' || s.key === 'overall_thickness');
        if (thicknessSpec) {
          // Normalize: "8 mm" -> "8", "10mm" -> "10"
          const normalizedValue = thicknessSpec.value.replace(/\s+/g, '').replace(/mm/gi, '').trim();
          const thicknessValue = parseFloat(normalizedValue);
          if (!isNaN(thicknessValue)) {
            thicknessSet.add(thicknessValue.toString());
          }
        }
      });

      availableThickness = Array.from(thicknessSet).sort((a, b) => parseFloat(a) - parseFloat(b));
    }

    // Apply collection filter ONLY to collections (not to colors) - for LVT and Parket
    // This happens AFTER extracting availableCollections so filter options remain visible
    if (category.slug === 'lvt') {
      const selectedCollections = searchParams.collections ? searchParams.collections.split(',') : [];
      if (selectedCollections.length > 0) {
        collections = allCollections.filter(p => {
          // For Tarkett: match by collection spec value
          const collSpec = p.specs?.find((s: { key: string }) => s.key === 'collection')?.value;
          if (p.sku?.startsWith('TARKETT-') && collSpec) {
            return selectedCollections.includes(collSpec);
          }
          // For Gerflor: match by product name
          const productName = p.name;
          return selectedCollections.some(collection => {
            if (collection === 'Creation 30') return productName.includes('Creation 30');
            if (collection === 'Creation 40') return productName.includes('Creation 40');
            if (collection === 'Creation 55') return productName.includes('Creation 55');
            if (collection === 'Creation 70') return productName.includes('Creation 70');
            if (collection === 'SAGA²' || collection.includes('SAGA')) return productName.includes('Saga');
            return false;
          });
        });
        // Also filter Tarkett colors by their collection spec
        colors = colors.filter(p => {
          const collSpec = p.specs?.find((s: { key: string }) => s.key === 'collection')?.value;
          if (!collSpec) return true; // Keep non-Tarkett colors
          return selectedCollections.includes(collSpec);
        });
      } else {
        collections = allCollections;
      }
    } else if (category.slug === 'laminat') {
      // Laminat: LAM- proizvodi (header po kolekciji), jedna kartica po kolekciji – bez duplikata
      const isLaminatCollection = (p: { sku?: string | null }) => p.sku?.startsWith('LAM-');
      const laminatHeaders = allCollections.filter(p => isLaminatCollection(p));
      const byCollectionName = new Map<string, (typeof allProducts)[0]>();
      for (const p of laminatHeaders) {
        const name = p.specs?.find(s => s.key === 'collection')?.value || p.specs?.find(s => s.key === 'brand_line')?.value || p.name;
        if (!byCollectionName.has(name)) byCollectionName.set(name, p);
      }
      const selectedCollections = searchParams.collections ? searchParams.collections.split(',') : [];
      if (selectedCollections.length > 0) {
        collections = selectedCollections
          .map(name => byCollectionName.get(name))
          .filter((p): p is (typeof allProducts)[0] => p != null);
        colors = colors.filter(p => {
          const name = p.specs?.find(s => s.key === 'collection')?.value;
          return name && selectedCollections.includes(name);
        });
      } else {
        collections = Array.from(byCollectionName.values())
          .filter((p): p is (typeof allProducts)[0] => !!isLaminatCollection(p))
          .sort((a, b) =>
            (a.specs?.find(s => s.key === 'collection')?.value || a.specs?.find(s => s.key === 'brand_line')?.value || a.name).localeCompare(b.specs?.find(s => s.key === 'collection')?.value || b.specs?.find(s => s.key === 'brand_line')?.value || b.name)
          );
      }

      // Laminat: filter by thickness
      // Build a map of collection name -> thickness value from collection headers
      const collectionThicknessMap = new Map<string, string>();
      byCollectionName.forEach((collProduct, collName) => {
        const thicknessSpec = collProduct.specs?.find((s: { key: string; value: string }) => s.key === 'thickness' || s.key === 'overall_thickness');
        if (thicknessSpec) {
          const normalizedValue = thicknessSpec.value.replace(/\s+/g, '').replace(/mm/gi, '').trim();
          const thicknessValue = parseFloat(normalizedValue);
          if (!isNaN(thicknessValue)) {
            collectionThicknessMap.set(collName, thicknessValue.toString());
          }
        }
      });

      const selectedThickness = searchParams.thickness ? searchParams.thickness.split(',') : [];
      if (selectedThickness.length > 0) {
        // Filter collections by their direct thickness spec
        collections = collections.filter(p => {
          const thicknessSpec = p.specs?.find(s => s.key === 'thickness' || s.key === 'overall_thickness');
          if (!thicknessSpec) return false;
          const normalizedValue = thicknessSpec.value.replace(/\s+/g, '').replace(/mm/gi, '').trim();
          const thicknessValue = parseFloat(normalizedValue);
          if (isNaN(thicknessValue)) return false;
          return selectedThickness.includes(thicknessValue.toString());
        });

        // Filter colors by their collection's thickness (since variants don't have thickness spec)
        colors = colors.filter(p => {
          const collName = p.specs?.find(s => s.key === 'collection')?.value;
          if (!collName) return false;
          const thickness = collectionThicknessMap.get(collName);
          return thickness && selectedThickness.includes(thickness);
        });
      }
    } else if (category.slug === 'parket') {
      const selectedCollections = searchParams.collections ? searchParams.collections.split(',') : [];
      if (selectedCollections.length > 0) {
        collections = allCollections.filter(p => {
          const specVal = p.specs?.find(s => s.key === 'collection')?.value;
          const collectionName = getEffectiveParketCollection(p.slug, specVal) || specVal || p.name;
          return selectedCollections.includes(collectionName);
        });
        // Za Parket, filtriraj i "boje" (varijante) po efektivnoj kolekciji da CategoryTabs prikaže ispravne varijante
        colors = colors.filter(p => {
          const specVal = p.specs?.find(s => s.key === 'collection')?.value;
          const effective = getEffectiveParketCollection(p.slug, specVal);
          return effective && selectedCollections.includes(effective);
        });
      } else {
        collections = allCollections;
      }
      // Parket: filtriraj boje po vrstama drveta (Hrast / Jasen) – više izbora, spec ili infer iz slug-a
      const selectedWoodTypes = searchParams.woodType?.split(',').map(s => s.trim()).filter(Boolean) || [];
      if (selectedWoodTypes.length > 0) {
        const matchWood = (p: { specs?: { key: string; value: string }[]; slug: string }, wt: string): boolean => {
          const spec = p.specs?.find(s => s.key === 'wood_type' || s.key === 'wood_species');
          const raw = spec?.value?.trim();
          if (raw) return raw.split(',').map(s => s.trim()).includes(wt);
          const s = (p.slug || '').toLowerCase();
          if (wt === 'Jasen') return s.startsWith('jasen') || s.includes('-jasen-');
          if (wt === 'Hrast') return s.startsWith('hrast') || s.includes('-hrast-') || s.includes('oak');
          return false;
        };
        colors = colors.filter(p => selectedWoodTypes.some(wt => matchWood(p, wt)));
        // Prikaži samo kolekcije koje imaju bar jednu varijantu izabrane vrste drveta
        const collectionNamesWithSelectedWood = new Set(
          colors.map(p => getEffectiveParketCollection(p.slug, p.specs?.find(s => s.key === 'collection')?.value)).filter(Boolean)
        );
        collections = collections.filter(p => {
          const specVal = p.specs?.find(s => s.key === 'collection')?.value;
          const name = getEffectiveParketCollection(p.slug, specVal) || specVal || p.name;
          return collectionNamesWithSelectedWood.has(name);
        });
      }
    } else if (category.slug === 'tekstilne-ploce') {
      const selectedFamilies = searchParams.family ? searchParams.family.split(',') : [];
      if (selectedFamilies.length > 0) {
        // Obuhvati i BLOQ (porodice) i ostale (npr. Gerflor nema family filter)
        collections = allCollections.filter(p => {
          if (p.brandId !== '8') return true; // Gerflor prođe nepovređen
          const familySpec = p.specs?.find(s => s.key === 'family')?.value;
          return familySpec && selectedFamilies.includes(familySpec);
        });

        colors = colors.filter(p => {
          if (p.brandId !== '8') return true;
          const familySpec = p.specs?.find(s => s.key === 'family')?.value;
          return familySpec && selectedFamilies.includes(familySpec);
        });
      } else {
        collections = allCollections;
      }
    } else {
      // For Vinil and other categories, show all collections (no collection filter)
      collections = allCollections;
    }

    // Za parket u tabu Boje prikazujemo stvarne boje (varijante) sa njihovim imenom i slikom, kao na Tekstilne ploče – bez preslikavanja na kolekciju.

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

  const breadcrumbItems = [
    { name: 'Kategorije', url: `${baseUrl}/kategorije` },
    { name: category.name, url: `${baseUrl}/kategorije/${params.slug}` },
  ];
  const schemaProducts = (hasCollectionTabs ? collections : allProducts).slice(0, 100);
  const categoryPageSchema = generateCollectionPageSchema({
    name: categoryCopy.heading,
    description: categoryCopy.metaDescription,
    url: `${baseUrl}/kategorije/${params.slug}`,
    image: category.image,
    baseUrl,
    about: {
      '@type': 'Thing',
      name: category.name,
    },
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            generateBreadcrumbSchema(breadcrumbItems),
            categoryPageSchema,
            generateProductListSchema(schemaProducts, {
              ...category,
              description: categoryCopy.metaDescription,
            }),
          ]),
        }}
      />
      {/* Main Content */}
      <div className="container py-6">
        <div className="mb-4">
          <Breadcrumbs items={[
            { label: 'Kategorije', href: '/kategorije' },
            { label: category.name }
          ]} />
        </div>
        <section className="mb-6 rounded-[1.75rem] border border-stone-200 bg-white px-6 py-8 shadow-sm">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Kategorija
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                {categoryCopy.heading}
              </h1>
              <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-600">
                {allProducts.length} proizvoda
              </span>
            </div>
            <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700 sm:text-lg">
              {categoryCopy.lead}
            </p>
            {categoryCopy.body ? (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600 sm:text-base">
                {categoryCopy.body}
              </p>
            ) : null}
            {categoryCopy.bullets.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {categoryCopy.bullets.map((bullet) => (
                  <span
                    key={bullet}
                    className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700"
                  >
                    {bullet}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:w-60 flex-shrink-0">
            <ProductFilters
              availableBrands={availableBrands}
              currentFilters={{ ...filtersWithoutCollections, listing: listingMode }}
              availableCollections={availableCollections}
              availableFamilies={category.slug === 'tekstilne-ploce' ? availableFamilies : undefined}
              availableWoodTypes={category.slug === 'parket' ? availableWoodTypes : undefined}
              availableThickness={availableThickness}
              availableThicknessByType={category.slug === 'vinil' ? availableThicknessByType : undefined}
            />
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {hasCollectionTabs ? (
              <CategoryTabs
                collections={collections}
                colors={colors}
                brandsRecord={brandsRecord}
                categorySlug={category.slug}
                initialColorSlug={searchParams.color}
                vinylType={searchParams.type}
                listingMode={listingMode}
                searchParams={{
                  search: searchParams.search,
                  brands: searchParams.brands,
                  collections: searchParams.collections,
                  family: searchParams.family,
                  listing: searchParams.listing,
                  thickness: searchParams.thickness,
                  woodType: searchParams.woodType,
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
