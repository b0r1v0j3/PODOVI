import { Product, ProductFilters, ProductImage, ProductSpec } from '@/types';
import { products as mockProducts } from '@/lib/data/mock-data';
import { getAllGerflorProducts, getAllBloqCarpetProducts, getAllCarpetProducts, getAllTarkettLVTProducts, getGerflorLinoleumCollections, getGerflorLVTCollections, getTarkettLVTCollections, getProductBySlug as getJsonProductBySlug, getAllDekingProducts, getVinylCollectionProducts, getEsdCollectionProducts, getTarkettSportCollections, getTarkettVinylHomeCollections, getTarkettHomogeneousVinylCollections, getTarkettHeterogeneousVinylCollections, getWolflorVinylCollections } from '@/lib/utils/productDataLoader';
import { tarkettProducts } from '@/lib/data/tarkett-products';
import { getEffectiveParketCollection } from '@/lib/data/parket-collection-mapping';
import { hasSupabaseAnonConfig, supabase } from '@/lib/supabase/client';
import { getManualCollectionProducts } from '@/lib/data/manual-collection-products';
import { enrichTarkettWoodProduct } from '@/lib/data/tarkett-wood-enrichment';

export interface IProductRepository {
  findAll(filters?: ProductFilters): Promise<Product[]>;
  findBySlug(slug: string): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
  findByCategory(categoryId: string, filters?: ProductFilters): Promise<Product[]>;
  findByBrand(brandId: string): Promise<Product[]>;
  findFeatured(): Promise<Product[]>;
}

import { mapCategoryId, mapBrandId, mapCategoryIdToUUID, mapBrandIdToUUID } from './id-mapping';

// =========================================
// Transform DB rows → Product interface
// =========================================
function toProduct(row: any, images: any[] = [], specs: any[] = []): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku || '',
    categoryId: mapCategoryId(row.category_id),
    brandId: mapBrandId(row.brand_id),
    shortDescription: row.short_description || '',
    description: row.description || '',
    images: images.map(img => ({
      id: img.id,
      url: img.url,
      alt: img.alt || '',
      isPrimary: img.is_primary ?? false,
      order: img.order_num ?? 0,
    })),
    specs: specs.map(s => ({
      key: s.key,
      label: s.label,
      value: s.value,
    })),
    price: row.price ? parseFloat(row.price) : undefined,
    priceUnit: row.price_unit || undefined,
    inStock: row.in_stock ?? true,
    featured: row.featured ?? false,
    coveragePerPackage: row.coverage_per_package ? parseFloat(row.coverage_per_package) : undefined,
    externalLink: row.external_link || undefined,
    detailsSections: row.details_sections || undefined,
    documents: row.documents || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function dedupeProductsBySlug(products: Product[]): Product[] {
  const uniqueProducts = new Map<string, Product>();

  for (const product of products) {
    if (!uniqueProducts.has(product.slug)) {
      uniqueProducts.set(product.slug, product);
    }
  }

  return Array.from(uniqueProducts.values());
}

function enrichCatalogProduct(product: Product): Product {
  return enrichTarkettWoodProduct(product);
}

// =========================================
// Supabase implementation
// =========================================
export class SupabaseProductRepository implements IProductRepository {

  async findAll(filters?: ProductFilters): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*, product_images(*), product_specs(*)');

    // Apply filters via SQL
    if (filters?.categoryId) {
      const mappedCategoryId = mapCategoryIdToUUID(filters.categoryId);
      // Only apply Supabase filter if UUID mapping exists (not mock-only categories)
      if (mappedCategoryId !== filters.categoryId || mappedCategoryId.includes('-')) {
        query = query.eq('category_id', mappedCategoryId);
      } else {
        // For mock-only categories (no UUID), skip Supabase query entirely
        // Products will be added via merge blocks below
        query = query.eq('category_id', '00000000-0000-0000-0000-000000000000');
      }
    }

    if (filters?.brandIds && filters.brandIds.length > 0) {
      query = query.in('brand_id', filters.brandIds.map(mapBrandIdToUUID));
    }

    if (filters?.priceMin !== undefined) {
      query = query.gte('price', filters.priceMin);
    }

    if (filters?.priceMax !== undefined) {
      query = query.lte('price', filters.priceMax);
    }

    if (filters?.inStock !== undefined) {
      query = query.eq('in_stock', filters.inStock);
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm},sku.ilike.${searchTerm}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('SupabaseProductRepository.findAll error:', error.message);
      return [];
    }

    let products: Product[] = ((data as any[]) || []).map((row: any) =>
      enrichCatalogProduct(toProduct(row, row.product_images || [], row.product_specs || []))
    );

    // Merge BLOQ + Gerflor carpet tile products from JSON for category 4 (Tekstilne ploče)
    // Note: categoryId may be a UUID or legacy '4' string depending on caller
    const legacyCategoryId = filters?.categoryId ? mapCategoryId(filters.categoryId) : undefined;

    // Category 4: Carpet Tiles
    if (!filters?.categoryId || legacyCategoryId === '4' || filters.categoryId === '4') {
      let jsonProducts = [...getAllBloqCarpetProducts(), ...getAllCarpetProducts()];
      // Apply same filters to JSON products
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        jsonProducts = jsonProducts.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower)
        );
      }
      if (filters?.brandIds && filters.brandIds.length > 0) {
        jsonProducts = jsonProducts.filter(p => filters.brandIds!.includes(p.brandId));
      }
      products = [...products, ...jsonProducts];
    }

    // Category 5: Deking (Add TimberTech Deking products)
    if (!filters?.categoryId || legacyCategoryId === '5' || filters.categoryId === '5') {
      let dekingProducts = getAllDekingProducts();

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        dekingProducts = dekingProducts.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower)
        );
      }
      if (filters?.brandIds && filters.brandIds.length > 0) {
        dekingProducts = dekingProducts.filter(p => filters.brandIds!.includes(p.brandId));
      }
      products = [...products, ...dekingProducts];
    }

    // Category 6: LVT (Add Tarkett LVT products + collection headers)
    if (!filters?.categoryId || legacyCategoryId === '6' || filters.categoryId === '6') {
      let lvtJsonProducts = getAllTarkettLVTProducts();
      let lvtCollections = getTarkettLVTCollections();
      let gerflorLvtCollections = getGerflorLVTCollections();

      // Implement Local Collection Images
      const collectionImagesModule = await import('@/public/data/collection_images.json').then(m => m.default || m).catch(() => ({}));
      const collectionImages = collectionImagesModule as Record<string, string>;

      lvtCollections = lvtCollections.map(c => {
        let localImg: string | undefined;

        // 1. Try exact name match or name without "Tarkett " prefix
        const nameWithoutPrefix = c.name.replace(/^Tarkett\s+/i, '');
        localImg = collectionImages[c.name] || collectionImages[nameWithoutPrefix];

        // 2. Try case-insensitive matching for name
        if (!localImg) {
          const lowerName = nameWithoutPrefix.toLowerCase();
          const matchingKey = Object.keys(collectionImages).find(k => k.toLowerCase() === lowerName);
          if (matchingKey) localImg = collectionImages[matchingKey];
        }

        // 3. Try matching by slug part
        // c.slug is like "tarkett-id-inspiration-55"
        // collectionImages key is like "kolekcija-c000770-id-inspiration-55"
        if (!localImg && c.slug) {
          const slugPart = c.slug.replace(/^tarkett-/i, '');
          // Look for a key that contains this slug part
          const matchingKey = Object.keys(collectionImages).find(k => k.includes(slugPart));
          if (matchingKey) localImg = collectionImages[matchingKey];
        }

        if (localImg) {
          return {
            ...c,
            images: [{
              id: 'local-' + c.id,
              url: localImg,
              alt: c.name,
              isPrimary: true,
              order: 0
            }, ...c.images.slice(1)]
          };
        }
        return c;
      });

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        lvtJsonProducts = lvtJsonProducts.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower)
        );
        lvtCollections = lvtCollections.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
        );
        gerflorLvtCollections = gerflorLvtCollections.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
        );
      }
      if (filters?.brandIds && filters.brandIds.length > 0) {
        lvtJsonProducts = lvtJsonProducts.filter(p => filters.brandIds!.includes(p.brandId));
        lvtCollections = lvtCollections.filter(p => filters.brandIds!.includes(p.brandId));
        gerflorLvtCollections = gerflorLvtCollections.filter(p => filters.brandIds!.includes(p.brandId));
      }
      const existingLvtSlugs = new Set(products.map((p: Product) => p.slug));
      gerflorLvtCollections = gerflorLvtCollections.filter((product) => !existingLvtSlugs.has(product.slug));
      products = [...products, ...gerflorLvtCollections, ...lvtCollections, ...lvtJsonProducts];

      // Add Creation Evo collection if not already present from Supabase
      const nextExistingLvtSlugs = new Set(products.map((p: Product) => p.slug));
      if (!nextExistingLvtSlugs.has('gerflor-creation-evo')) {
        const lvtData = require('@/public/data/lvt_colors_complete.json');
        const evoColors = (lvtData.colors || []).filter((c: any) => c.collection === 'creation-evo');
        if (evoColors.length > 0) {
          const firstEvo = evoColors[0];
          const evoProduct = {
            id: 'lvt-coll-creation-evo',
            name: 'Creation Evo',
            slug: 'gerflor-creation-evo',
            sku: 'GER-CREATION-EVO',
            categoryId: '6',
            brandId: '6',
            shortDescription: `Creation Evo — ${evoColors.length} boja`,
            description: firstEvo.description || 'PVC-free LVT kolekcija sa ProtecShield™ zaštitom',
            images: [{
              id: 'lvt-coll-creation-evo-img',
              url: '/images/products/lvt/creation-evo-collection.jpg',
              alt: 'Creation Evo',
              isPrimary: true,
              order: 0,
            }],
            specs: [],
            inStock: true,
            featured: false,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          } as Product;
          products.push(evoProduct);
        }
      }
    }

    // Category 2: Vinil (Merge JSON-only vinyl collections not already in Supabase)
    if (!filters?.categoryId || legacyCategoryId === '2' || filters.categoryId === '2') {
      const existingSlugs = new Set(products.map((p: Product) => p.slug));
      let vinylJsonCollections = [
        ...getVinylCollectionProducts(),
        ...getTarkettVinylHomeCollections(),
        ...getTarkettHeterogeneousVinylCollections(),
        ...getTarkettHomogeneousVinylCollections(),
        ...getWolflorVinylCollections(),
      ].filter(vc => !existingSlugs.has(vc.slug)); // Only add collections not already from Supabase

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        vinylJsonCollections = vinylJsonCollections.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower)
        );
      }
      if (filters?.brandIds && filters.brandIds.length > 0) {
        vinylJsonCollections = vinylJsonCollections.filter(p => filters.brandIds!.includes(p.brandId));
      }
      products = [...products, ...vinylJsonCollections];
    }

    // Category 8: Elektroprovodni (ESD)
    if (!filters?.categoryId || legacyCategoryId === '8' || filters.categoryId === '8') {
      const existingSlugs = new Set(products.map((p: Product) => p.slug));
      let esdProducts = getEsdCollectionProducts()
        .filter(ep => !existingSlugs.has(ep.slug));

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        esdProducts = esdProducts.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower)
        );
      }
      if (filters?.brandIds && filters.brandIds.length > 0) {
        esdProducts = esdProducts.filter(p => filters.brandIds!.includes(p.brandId));
      }
      products = [...products, ...esdProducts];
    }

    if (!filters?.categoryId || legacyCategoryId === '7' || filters.categoryId === '7') {
      let linoleumCollections = getGerflorLinoleumCollections();

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        linoleumCollections = linoleumCollections.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
        );
      }

      if (filters?.brandIds && filters.brandIds.length > 0) {
        linoleumCollections = linoleumCollections.filter(p => filters.brandIds!.includes(p.brandId));
      }

      const existingLinoleumSlugs = new Set(products.map((product: Product) => product.slug));
      linoleumCollections = linoleumCollections.filter((product) => !existingLinoleumSlugs.has(product.slug));
      products = [...products, ...linoleumCollections];
    }

    // Category 10: Tarkett sport collections from JSON
    if (!filters?.categoryId || legacyCategoryId === '10' || filters.categoryId === '10') {
      const existingSlugs = new Set(products.map((p: Product) => p.slug));
      let tarkettSportProducts = getTarkettSportCollections()
        .filter(sp => !existingSlugs.has(sp.slug));

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        tarkettSportProducts = tarkettSportProducts.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower)
        );
      }
      if (filters?.brandIds && filters.brandIds.length > 0) {
        tarkettSportProducts = tarkettSportProducts.filter(p => filters.brandIds!.includes(p.brandId));
      }
      products = [...products, ...tarkettSportProducts];
    }

    if (!filters?.categoryId || legacyCategoryId === '1' || legacyCategoryId === '3' || filters.categoryId === '1' || filters.categoryId === '3') {
      const requestedCategoryId = legacyCategoryId === '1' || filters?.categoryId === '1'
        ? '1'
        : legacyCategoryId === '3' || filters?.categoryId === '3'
          ? '3'
          : null;

      let tarkettWoodProducts = tarkettProducts
        .map(enrichCatalogProduct)
        .filter((product) => !requestedCategoryId || product.categoryId === requestedCategoryId);

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        tarkettWoodProducts = tarkettWoodProducts.filter((product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower)
        );
      }

      if (filters?.brandIds && filters.brandIds.length > 0) {
        tarkettWoodProducts = tarkettWoodProducts.filter((product) => filters.brandIds!.includes(product.brandId));
      }

      const existingWoodSlugs = new Set(products.map((product: Product) => product.slug));
      products = [...products, ...tarkettWoodProducts.filter((product) => !existingWoodSlugs.has(product.slug))];
    }

    let manualCollectionProducts = getManualCollectionProducts();

    if (filters?.categoryId) {
      manualCollectionProducts = manualCollectionProducts.filter(p => p.categoryId === legacyCategoryId);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      manualCollectionProducts = manualCollectionProducts.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.brandIds && filters.brandIds.length > 0) {
      manualCollectionProducts = manualCollectionProducts.filter(p => filters.brandIds!.includes(p.brandId));
    }

    const existingSlugs = new Set(products.map((p: Product) => p.slug));
    products = [...products, ...manualCollectionProducts.filter(p => !existingSlugs.has(p.slug))];

    // Post-fetch filters that require specs data
    if (filters?.type) {
      const typeFilter = filters.type.toLowerCase();
      products = products.filter(p => {
        const typeSpec = p.specs.find(s => s.key === 'type');
        if (!typeSpec) return false;
        return typeSpec.value.toLowerCase() === typeFilter;
      });
    }

    if (filters?.collections && filters.collections.length > 0) {
      products = products.filter(p => {
        const productName = p.name;
        const specCollection = p.specs?.find(s => s.key === 'collection')?.value;
        const effectiveParket = p.categoryId && specCollection === 'Parket'
          ? getEffectiveParketCollection(p.slug, specCollection)
          : specCollection;
        return filters.collections!.some(collection => {
          if (collection === 'Creation 30') return productName.includes('Creation 30');
          if (collection === 'Creation 40') return productName.includes('Creation 40');
          if (collection === 'Creation 55') return productName.includes('Creation 55');
          if (collection === 'Creation 70') return productName.includes('Creation 70');
          if (collection === 'SAGA²' || collection.includes('SAGA')) return productName.includes('Saga');
          if (effectiveParket && effectiveParket === collection) return true;
          return false;
        });
      });
    }

    if (filters?.thickness && filters.thickness.length > 0) {
      products = products.filter(p => {
        const thicknessSpec = p.specs.find(s => s.key === 'thickness');
        if (!thicknessSpec) return false;
        const normalizedValue = thicknessSpec.value.replace(/,/g, '.').replace(/\s+/g, '').replace(/mm/gi, '').trim();
        const thicknessValue = parseFloat(normalizedValue);
        if (isNaN(thicknessValue)) return false;
        const formattedValue = thicknessValue.toFixed(2);
        return filters.thickness!.some(selectedThickness => {
          const selectedValue = parseFloat(selectedThickness);
          if (isNaN(selectedValue)) return false;
          return formattedValue === selectedValue.toFixed(2);
        });
      });
    }

    return products;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*), product_specs(*)')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      // Fallback: check JSON products (Gerflor, Bloq, Tarkett LVT)
      const jsonProduct = getJsonProductBySlug(slug);
      if (jsonProduct) return jsonProduct;

      // Fallback: check mock-data and legacy Tarkett products
      const mockProduct = mockProducts.find(p => p.slug === slug) || tarkettProducts.find(p => p.slug === slug);
      return mockProduct ? enrichCatalogProduct(mockProduct) : null;
    }
    return enrichCatalogProduct(toProduct(data, data.product_images || [], data.product_specs || []));
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*), product_specs(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return enrichCatalogProduct(toProduct(data, data.product_images || [], data.product_specs || []));
  }

  async findByCategory(categoryId: string, filters?: ProductFilters): Promise<Product[]> {
    return this.findAll({ ...filters, categoryId });
  }

  async findByBrand(brandId: string): Promise<Product[]> {
    if (brandId === '8') {
      return getAllBloqCarpetProducts();
    }

    if (brandId === '10') {
      return getAllDekingProducts();
    }

    if (brandId === '6') {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(*), product_specs(*)')
        .eq('brand_id', mapBrandIdToUUID(brandId));

      let products = error
        ? []
        : ((data as any[]) || []).map((row: any) =>
          enrichCatalogProduct(toProduct(row, row.product_images || [], row.product_specs || []))
        );

      const existingSlugs = new Set(products.map((product: Product) => product.slug));
      const supplementalCollections = [
        ...getVinylCollectionProducts(),
        ...getEsdCollectionProducts(),
        ...getGerflorLVTCollections(),
        ...getGerflorLinoleumCollections(),
        ...getManualCollectionProducts(),
      ].filter(product => !existingSlugs.has(product.slug));

      return [...products, ...supplementalCollections];
    }

    if (brandId === '3') {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(*), product_specs(*)')
        .eq('brand_id', mapBrandIdToUUID(brandId));

      const products = error
        ? []
        : ((data as any[]) || []).map((row: any) =>
          enrichCatalogProduct(toProduct(row, row.product_images || [], row.product_specs || []))
        );

      const existingSlugs = new Set(products.map((product: Product) => product.slug));
      const supplementalCollections = tarkettProducts
        .map(enrichCatalogProduct)
        .concat(getTarkettSportCollections())
        .concat(getTarkettVinylHomeCollections())
        .concat(getTarkettHeterogeneousVinylCollections())
        .concat(getTarkettHomogeneousVinylCollections())
        .filter(product => !existingSlugs.has(product.slug));

      return [...products, ...supplementalCollections];
    }

    if (brandId === '11') {
      return getWolflorVinylCollections();
    }

    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*), product_specs(*)')
      .eq('brand_id', mapBrandIdToUUID(brandId));

    if (error) {
      console.error('SupabaseProductRepository.findByBrand error:', error.message);
      return [];
    }
    return ((data as any[]) || []).map((row: any) =>
      enrichCatalogProduct(toProduct(row, row.product_images || [], row.product_specs || []))
    );
  }

  async findFeatured(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*), product_specs(*)')
      .eq('featured', true);

    if (error) {
      console.error('SupabaseProductRepository.findFeatured error:', error.message);
      return [];
    }
    return ((data as any[]) || []).map((row: any) =>
      enrichCatalogProduct(toProduct(row, row.product_images || [], row.product_specs || []))
    );
  }
}

// =========================================
// Mock implementation (kept as fallback)
// =========================================
export class MockProductRepository implements IProductRepository {
  private products: Product[] = dedupeProductsBySlug([
    ...getAllGerflorProducts(),
    ...getGerflorLVTCollections(),
    ...getGerflorLinoleumCollections(),
    ...getAllBloqCarpetProducts(),
    ...tarkettProducts.map(enrichCatalogProduct),
    ...getAllTarkettLVTProducts(),
    ...getTarkettVinylHomeCollections(),
    ...getTarkettHeterogeneousVinylCollections(),
    ...getTarkettHomogeneousVinylCollections(),
    ...getWolflorVinylCollections(),
    ...getTarkettSportCollections(),
    ...getAllDekingProducts(),
    ...getVinylCollectionProducts(),
    ...getEsdCollectionProducts(),
    ...getManualCollectionProducts(),
    ...mockProducts,
  ]);

  async findAll(filters?: ProductFilters): Promise<Product[]> {
    let filtered = [...this.products];

    if (filters?.categoryId) {
      filtered = filtered.filter(p => p.categoryId === filters.categoryId);
    }

    if (filters?.brandIds && filters.brandIds.length > 0) {
      filtered = filtered.filter(p => filters.brandIds!.includes(p.brandId));
    }

    if (filters?.priceMin !== undefined) {
      filtered = filtered.filter(p => p.price && p.price >= filters.priceMin!);
    }

    if (filters?.priceMax !== undefined) {
      filtered = filtered.filter(p => p.price && p.price <= filters.priceMax!);
    }

    if (filters?.inStock !== undefined) {
      filtered = filtered.filter(p => p.inStock === filters.inStock);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.type) {
      const typeFilter = filters.type.toLowerCase();
      filtered = filtered.filter(p => {
        const typeSpec = p.specs.find(s => s.key === 'type');
        if (!typeSpec) return false;
        const productType = typeSpec.value.toLowerCase();
        if (typeFilter === 'homogeni') return productType === 'homogeni';
        if (typeFilter === 'heterogeni') return productType === 'heterogeni';
        return false;
      });
    }

    if (filters?.collections && filters.collections.length > 0) {
      filtered = filtered.filter(p => {
        const productName = p.name;
        const specCollection = p.specs?.find(s => s.key === 'collection')?.value;
        const effectiveParket = p.categoryId === '3' && specCollection === 'Parket'
          ? getEffectiveParketCollection(p.slug, specCollection)
          : specCollection;
        return filters.collections!.some(collection => {
          if (collection === 'Creation 30') return productName.includes('Creation 30');
          if (collection === 'Creation 40') return productName.includes('Creation 40');
          if (collection === 'Creation 55') return productName.includes('Creation 55');
          if (collection === 'Creation 70') return productName.includes('Creation 70');
          if (collection === 'SAGA²' || collection.includes('SAGA')) return productName.includes('Saga');
          if (effectiveParket && effectiveParket === collection) return true;
          return false;
        });
      });
    }

    if (filters?.thickness && filters.thickness.length > 0) {
      filtered = filtered.filter(p => {
        const thicknessSpec = p.specs.find(s => s.key === 'thickness');
        if (!thicknessSpec) return false;
        const normalizedValue = thicknessSpec.value.replace(/,/g, '.').replace(/\s+/g, '').replace(/mm/gi, '').trim();
        const thicknessValue = parseFloat(normalizedValue);
        if (isNaN(thicknessValue)) return false;
        const formattedValue = thicknessValue.toFixed(2);
        return filters.thickness!.some(selectedThickness => {
          const selectedValue = parseFloat(selectedThickness);
          if (isNaN(selectedValue)) return false;
          return formattedValue === selectedValue.toFixed(2);
        });
      });
    }

    return filtered;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.products.find(p => p.slug === slug) || null;
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find(p => p.id === id) || null;
  }

  async findByCategory(categoryId: string, filters?: ProductFilters): Promise<Product[]> {
    return this.findAll({ ...filters, categoryId });
  }

  async findByBrand(brandId: string): Promise<Product[]> {
    return this.products.filter(p => p.brandId === brandId);
  }

  async findFeatured(): Promise<Product[]> {
    return this.products.filter(p => p.featured);
  }
}

// Switch: use Supabase by default, set USE_MOCK=true to use mock data
const USE_MOCK = process.env.USE_MOCK_DATA === 'true' || !hasSupabaseAnonConfig();
export const productRepository = USE_MOCK
  ? new MockProductRepository()
  : new SupabaseProductRepository();

// Helper functions for easier imports
export async function getProductsByBrand(brandId: string): Promise<Product[]> {
  return productRepository.findByBrand(brandId);
}
