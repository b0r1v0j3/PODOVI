import { Category } from '@/types';
import { categories as mockCategories } from '@/lib/data/mock-data';
import { supabase } from '@/lib/supabase/client';

export interface ICategoryRepository {
  findAll(): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | null>;
  findById(id: string): Promise<Category | null>;
}

// =========================================
// Transform DB row → Category interface
// =========================================
function toCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    image: row.image || '',
    parentId: row.parent_id || undefined,
    order: row.order_num ?? 0,
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
      return [];
    }
    return (data || []).map(toCategory);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return toCategory(data);
  }

  async findById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return toCategory(data);
  }
}

// =========================================
// Mock implementation (kept as fallback)
// =========================================
export class MockCategoryRepository implements ICategoryRepository {
  private categories: Category[] = mockCategories;

  async findAll(): Promise<Category[]> {
    return [...this.categories].sort((a, b) => a.order - b.order);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.categories.find(c => c.slug === slug) || null;
  }

  async findById(id: string): Promise<Category | null> {
    return this.categories.find(c => c.id === id) || null;
  }
}

// Switch: use Supabase by default, set USE_MOCK=true to use mock data
const USE_MOCK = process.env.USE_MOCK_DATA === 'true';
export const categoryRepository = USE_MOCK
  ? new MockCategoryRepository()
  : new SupabaseCategoryRepository();
