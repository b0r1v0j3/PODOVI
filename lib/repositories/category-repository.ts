import { Category } from '@/types';
import { categories as mockCategories } from '@/lib/data/mock-data';
import { hasSupabaseAnonConfig, supabase } from '@/lib/supabase/client';
import { mapCategoryId, mapCategoryIdToUUID } from './id-mapping';
import { selectPreferredCatalogAsset } from '@/lib/utils/catalog-assets';

export interface ICategoryRepository {
  findAll(): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | null>;
  findById(id: string): Promise<Category | null>;
}

// =========================================
// Transform DB row → Category interface
// =========================================
function toCategory(row: any): Category {
  const fallbackCategory = mockCategories.find((category) => category.slug === row.slug);

  return {
    id: fallbackCategory?.id || mapCategoryId(row.id),
    name: row.name || fallbackCategory?.name || '',
    slug: row.slug,
    description: row.description || fallbackCategory?.description || '',
    image: selectPreferredCatalogAsset(fallbackCategory?.image, row.image),
    parentId: row.parent_id || fallbackCategory?.parentId || undefined,
    order: row.order_num ?? fallbackCategory?.order ?? 0,
  };
}

// =========================================
// Supabase implementation
// =========================================
export class SupabaseCategoryRepository implements ICategoryRepository {
  async findAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('order_num', { ascending: true });

    if (error) {
      console.error('SupabaseCategoryRepository.findAll error:', error.message);
      return [...mockCategories].sort((a: Category, b: Category) => a.order - b.order);
    }
    const supabaseCategories: Category[] = ((data as any[]) || []).map((row: any) => toCategory(row));
    // Merge mock-only categories (e.g., Elektroprovodni) not present in Supabase
    const existingSlugs = new Set(supabaseCategories.map((c: Category) => c.slug));
    const mockOnlyCategories = mockCategories.filter(c => !existingSlugs.has(c.slug));
    return [...supabaseCategories, ...mockOnlyCategories].sort((a: Category, b: Category) => a.order - b.order);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      // Fallback: check mock-data categories (e.g., Elektroprovodni)
      return mockCategories.find(c => c.slug === slug) || null;
    }
    return toCategory(data);
  }

  async findById(id: string): Promise<Category | null> {
    const uuid = mapCategoryIdToUUID(id);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', uuid)
      .single();

    if (error || !data) {
      // Fallback: check mock-data categories
      return mockCategories.find(c => c.id === id) || null;
    }
    return toCategory(data);
  }
}

// =========================================
// Mock implementation (kept as fallback)
// =========================================
export class MockCategoryRepository implements ICategoryRepository {
  private categories: Category[] = mockCategories;

  async findAll(): Promise<Category[]> {
    return [...this.categories].sort((a: Category, b: Category) => a.order - b.order);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.categories.find(c => c.slug === slug) || null;
  }

  async findById(id: string): Promise<Category | null> {
    return this.categories.find(c => c.id === id) || null;
  }
}

// Switch: use Supabase by default, set USE_MOCK=true to use mock data
const USE_MOCK = process.env.USE_MOCK_DATA === 'true' || !hasSupabaseAnonConfig();
export const categoryRepository = USE_MOCK
  ? new MockCategoryRepository()
  : new SupabaseCategoryRepository();
