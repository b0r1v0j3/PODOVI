import { notFound } from 'next/navigation';
import { readFileSync } from 'fs';
import { join } from 'path';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { productRepository } from '@/lib/repositories/product-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import { getEffectiveParketCollection, getAllParketVariantSlugs, getParketCollectionSlug } from '@/lib/data/parket-collection-mapping';
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

  // For LVT, Linoleum, Carpet, Vinil, Parket, Laminat – separate collections from colors
  const hasCollectionTabs = category.slug === 'lvt' || category.slug === 'linoleum' || category.slug === 'tekstilne-ploce' || category.slug === 'vinil' || category.slug === 'parket' || category.slug === 'laminat' || category.slug === 'ugradnja' || category.slug === 'lajsne' || category.slug === 'alati';
  let collections: typeof allProducts = [];
  let colors: typeof allProducts = [];
  let availableCollections: string[] = [];
  let availableWoodTypes: { value: string; count: number }[] = [];
  let availableThickness: string[] = [];
  let availableThicknessByType: { homogeni: string[]; heterogeni: string[] } = { homogeni: [], heterogeni: [] };

  // For non-LVT categories, get filtered products
  const filteredProducts = hasCollectionTabs ? [] : allProducts;

  // Create brands object for Client Component (serializable)
  const brandsRecord: Record<string, typeof allBrands[0]> = {};
  if (hasCollectionTabs) {
    // Collections: GER- (LVT/Vinil), LINOLEUM-, VINIL-, PARKET-, LAM- (Laminat), EGGER- (EGGER)
    // Colors: products without those SKU prefixes
    const hasCollectionSku = (p: { sku?: string | null }) =>
      (p.sku?.startsWith('GER-') || p.sku?.startsWith('LINOLEUM-') || p.sku?.startsWith('VINIL-') || p.sku?.startsWith('PARKET-') || p.sku?.startsWith('LAM-') || p.sku?.startsWith('BLOQ-') || p.sku?.startsWith('EGGER-')) ?? false;
    const allCollections = allProducts.filter(p => hasCollectionSku(p));
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

    // Laminat: kolekcije iz LAM- proizvoda (spec "collection" ili name)
    if (category.slug === 'laminat') {
      const names = allCollections
        .filter(p => p.sku?.startsWith('LAM-') || p.sku?.startsWith('EGGER-'))
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
        collections = allCollections;
      }
    } else if (category.slug === 'laminat') {
      // Laminat: samo LAM- proizvodi (header po kolekciji), jedna kartica po kolekciji – bez duplikata
      const laminatHeaders = allCollections.filter(p => p.sku?.startsWith('LAM-'));
      const byCollectionName = new Map<string, (typeof allProducts)[0]>();
      for (const p of laminatHeaders) {
        const name = p.specs?.find(s => s.key === 'collection')?.value || p.name;
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
          .filter((p): p is (typeof allProducts)[0] => !!p.sku?.startsWith('LAM-'))
          .sort((a, b) =>
            (a.specs?.find(s => s.key === 'collection')?.value || a.name).localeCompare(b.specs?.find(s => s.key === 'collection')?.value || b.name)
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

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTItMnYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTIgMnYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bS0yIDJ2Mmgydi0yaC0yem0tNCAwdjJoMnYtMmgtMnptLTQgMHYyaDJ2LTJoLTJ6bS00IDB2Mmgydi0yaC0yem0tNCAwdjJoMnYtMmgtMnptLTItMnYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
        <div className="container py-12 md:py-16 relative z-10">
          <div className="mb-4">
            <Breadcrumbs items={[
              { label: 'Kategorije', href: '/kategorije' },
              { label: category.name }
            ]} variant="dark" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {category.name}
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl">
            {category.description}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:w-60 flex-shrink-0">
            <ProductFilters
              availableBrands={availableBrands}
              currentFilters={filtersWithoutCollections}
              availableCollections={availableCollections}
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
                searchParams={{
                  search: searchParams.search,
                  brands: searchParams.brands,
                  collections: searchParams.collections,
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
