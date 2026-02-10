import { Brand } from '@/types';
import { brands as mockBrands } from '@/lib/data/mock-data';
import { supabase } from '@/lib/supabase/client';

export interface IBrandRepository {
  findAll(): Promise<Brand[]>;
  findBySlug(slug: string): Promise<Brand | null>;
  findById(id: string): Promise<Brand | null>;
}

// =========================================
// Transform DB row → Brand interface
// =========================================
function toBrand(row: any): Brand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo || '',
    description: row.description || '',
    website: row.website || undefined,
    countryOfOrigin: row.country_of_origin || undefined,
  };
}

// =========================================
// Supabase implementation
// =========================================
export class SupabaseBrandRepository implements IBrandRepository {
  async findAll(): Promise<Brand[]> {
    const { data, error } = await supabase
      .from('brands')
      .select('*');

    if (error) {
      console.error('SupabaseBrandRepository.findAll error:', error.message);
      return [];
    }
    return (data || []).map(toBrand);
  }

  async findBySlug(slug: string): Promise<Brand | null> {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return toBrand(data);
  }

  async findById(id: string): Promise<Brand | null> {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return toBrand(data);
  }
}

// =========================================
// Mock implementation (kept as fallback)
// =========================================
export class MockBrandRepository implements IBrandRepository {
  private brands: Brand[] = mockBrands;

  async findAll(): Promise<Brand[]> {
    return [...this.brands];
  }

  async findBySlug(slug: string): Promise<Brand | null> {
    return this.brands.find(b => b.slug === slug) || null;
  }

  async findById(id: string): Promise<Brand | null> {
    return this.brands.find(b => b.id === id) || null;
  }
}

// Switch: use Supabase by default, set USE_MOCK=true to use mock data
const USE_MOCK = process.env.USE_MOCK_DATA === 'true';
export const brandRepository = USE_MOCK
  ? new MockBrandRepository()
  : new SupabaseBrandRepository();

// Helper functions for easier imports
export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  return brandRepository.findBySlug(slug);
}
