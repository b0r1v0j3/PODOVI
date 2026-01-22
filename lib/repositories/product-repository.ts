import { Product, ProductFilters } from '@/types';
import { products as mockProducts } from '@/lib/data/mock-data';
import { getAllGerflorProducts } from '@/lib/utils/productDataLoader';

export interface IProductRepository {
  findAll(filters?: ProductFilters): Promise<Product[]>;
  findBySlug(slug: string): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
  findByCategory(categoryId: string, filters?: ProductFilters): Promise<Product[]>;
  findByBrand(brandId: string): Promise<Product[]>;
  findFeatured(): Promise<Product[]>;
}

export class MockProductRepository implements IProductRepository {
  private products: Product[] = [...mockProducts, ...getAllGerflorProducts()];

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

    // Filter by vinyl type (homogeni/heterogeni)
    if (filters?.type) {
      const typeFilter = filters.type.toLowerCase();
      filtered = filtered.filter(p => {
        const typeSpec = p.specs.find(s => s.key === 'type');
        if (!typeSpec) return false;
        const productType = typeSpec.value.toLowerCase();
        // Map 'homogeni' to 'homogeni', 'heterogeni' to 'heterogeni'
        if (typeFilter === 'homogeni') {
          return productType === 'homogeni';
        } else if (typeFilter === 'heterogeni') {
          return productType === 'heterogeni';
        }
        return false;
      });
    }

    // Filter by collections (for LVT products) - grouped like Gerflor
    if (filters?.collections && filters.collections.length > 0) {
      filtered = filtered.filter(p => {
        const productName = p.name;
        // Check if any selected collection group matches the product
        return filters.collections!.some(collection => {
          if (collection === 'Creation 30') {
            return productName.includes('Creation 30') && !productName.includes('Zen');
          } else if (collection === 'Creation 40') {
            return productName.includes('Creation 40') && !productName.includes('Zen');
          } else if (collection === 'Creation 55') {
            return productName.includes('Creation 55') && !productName.includes('Zen');
          } else if (collection === 'Creation 70') {
            return productName.includes('Creation 70') && !productName.includes('Zen');
          } else if (collection === 'Creation Zen') {
            return productName.includes('Creation') && productName.includes('Zen');
          } else if (collection === 'SAGA²' || collection.includes('SAGA')) {
            return productName.includes('Saga');
          }
          return false;
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

export const productRepository = new MockProductRepository();

// Helper functions for easier imports
export async function getProductsByBrand(brandId: string): Promise<Product[]> {
  return productRepository.findByBrand(brandId);
}
