import { Brand } from '@/types';
import { brands as mockBrands } from '@/lib/data/mock-data';
import { hasSupabaseAnonConfig, supabase } from '@/lib/supabase/client';
import { mapBrandIdToUUID, mapBrandId } from './id-mapping';
import { selectPreferredCatalogAsset } from '@/lib/utils/catalog-assets';

export interface IBrandRepository {
  findAll(): Promise<Brand[]>;
  findBySlug(slug: string): Promise<Brand | null>;
  findById(id: string): Promise<Brand | null>;
}

// =========================================
// Transform DB row → Brand interface
// =========================================
function toBrand(row: any): Brand {
  const fallbackBrand = mockBrands.find((brand) => brand.slug === row.slug);

  return {
    id: fallbackBrand?.id || mapBrandId(row.id),
    name: row.name || fallbackBrand?.name || '',
    slug: row.slug,
    logo: selectPreferredCatalogAsset(fallbackBrand?.logo, row.logo),
    description: row.description || fallbackBrand?.description || '',
    website: row.website || fallbackBrand?.website || undefined,
    countryOfOrigin: row.country_of_origin || fallbackBrand?.countryOfOrigin || undefined,
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

    const dbBrands: Brand[] = ((data as any[]) || []).map((row: any) => toBrand(row));

    // Merge with mock brands (BLOQ, etc.) that might not be in DB yet
    // Prefer DB version if duplicate SLUG exists (DB has UUIDs, Mock has legacy IDs)
    const dbBrandSlugs = new Set(dbBrands.map((b: Brand) => b.slug));
    const uniqueMockBrands = mockBrands.filter(mb => !dbBrandSlugs.has(mb.slug));

    return [...dbBrands, ...uniqueMockBrands].sort((a: Brand, b: Brand) => a.name.localeCompare(b.name));
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
const USE_MOCK = process.env.USE_MOCK_DATA === 'true' || !hasSupabaseAnonConfig();
export const brandRepository = USE_MOCK
  ? new MockBrandRepository()
  : new SupabaseBrandRepository();

// Helper functions for easier imports
export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  return brandRepository.findBySlug(slug);
}
