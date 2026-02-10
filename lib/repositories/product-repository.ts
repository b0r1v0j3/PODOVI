import { Product, ProductFilters, ProductImage, ProductSpec } from '@/types';
import { products as mockProducts } from '@/lib/data/mock-data';
import { getAllGerflorProducts } from '@/lib/utils/productDataLoader';
import { tarkettProducts } from '@/lib/data/tarkett-products';
import { getEffectiveParketCollection } from '@/lib/data/parket-collection-mapping';
import { supabase } from '@/lib/supabase/client';

export interface IProductRepository {
  findAll(filters?: ProductFilters): Promise<Product[]>;
  findBySlug(slug: string): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
  findByCategory(categoryId: string, filters?: ProductFilters): Promise<Product[]>;
  findByBrand(brandId: string): Promise<Product[]>;
  findFeatured(): Promise<Product[]>;
}

// =========================================
// Transform DB rows → Product interface
// =========================================
function toProduct(row: any, images: any[] = [], specs: any[] = []): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku || '',
    categoryId: row.category_id,
    brandId: row.brand_id,
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
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters?.brandIds && filters.brandIds.length > 0) {
      query = query.in('brand_id', filters.brandIds);
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

    let products = (data || []).map(row =>
      toProduct(row, row.product_images || [], row.product_specs || [])
    );

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

    if (error || !data) return null;
    return toProduct(data, data.product_images || [], data.product_specs || []);
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*), product_specs(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return toProduct(data, data.product_images || [], data.product_specs || []);
  }

  async findByCategory(categoryId: string, filters?: ProductFilters): Promise<Product[]> {
    return this.findAll({ ...filters, categoryId });
  }

  async findByBrand(brandId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*), product_specs(*)')
      .eq('brand_id', brandId);

    if (error) {
      console.error('SupabaseProductRepository.findByBrand error:', error.message);
      return [];
    }
    return (data || []).map(row =>
      toProduct(row, row.product_images || [], row.product_specs || [])
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
    return (data || []).map(row =>
      toProduct(row, row.product_images || [], row.product_specs || [])
    );
  }
}

// =========================================
// Mock implementation (kept as fallback)
// =========================================
export class MockProductRepository implements IProductRepository {
  private products: Product[] = [...mockProducts, ...getAllGerflorProducts(), ...tarkettProducts];

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
const USE_MOCK = process.env.USE_MOCK_DATA === 'true';
export const productRepository = USE_MOCK
  ? new MockProductRepository()
  : new SupabaseProductRepository();

// Helper functions for easier imports
export async function getProductsByBrand(brandId: string): Promise<Product[]> {
  return productRepository.findByBrand(brandId);
}
