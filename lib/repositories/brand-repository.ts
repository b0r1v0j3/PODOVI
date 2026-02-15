import { Brand } from '@/types';
import { brands as mockBrands } from '@/lib/data/mock-data';
import { supabase } from '@/lib/supabase/client';
import { mapBrandIdToUUID } from './id-mapping';

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
      // Fallback to mock data if DB fails
      return mockBrands;
    }

    const dbBrands = (data || []).map(toBrand);

    // Merge with mock brands (BLOQ, etc.) that might not be in DB yet
    // Prefer DB version if duplicate ID exists
    const dbBrandIds = new Set(dbBrands.map(b => b.id));
    const uniqueMockBrands = mockBrands.filter(mb => !dbBrandIds.has(mb.id));

    return [...dbBrands, ...uniqueMockBrands].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findBySlug(slug: string): Promise<Brand | null> {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      // Fallback: check mock-data
      const mockBrand = mockBrands.find(b => b.slug === slug);
      return mockBrand || null;
    }
    return toBrand(data);
  }

  async findById(id: string): Promise<Brand | null> {
    // Try to map ID to UUID for Supabase lookup
    // If it's a legacy ID like '8' (BLOQ) that might not be in DB or ID mapping, 
    // we should check mock data first or handle the mapping failure gracefully.
    try {
      const uuid = mapBrandIdToUUID(id);
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', uuid)
        .single();

      if (!error && data) {
        return toBrand(data);
      }
    } catch (e) {
      // ID mapping might fail for pure mock IDs if not in id-mapping.ts
      // Continue to mock check
    }

    // Fallback: check mock-data
    const mockBrand = mockBrands.find(b => b.id === id);
    return mockBrand || null;
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
