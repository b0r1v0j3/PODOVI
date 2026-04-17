import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  selectPreferredCatalogAsset,
  selectPreferredCollectionHeroAsset,
} from '@/lib/utils/catalog-assets';

describe('Catalog asset selection contract', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('prefers curated fallback assets over weaker database overrides', () => {
    expect(
      selectPreferredCatalogAsset(
        '/images/brands/gerflor.svg',
        'https://cdn.example.com/legacy-gerflor-logo.png'
      )
    ).toBe('/images/brands/gerflor.svg');

    expect(
      selectPreferredCatalogAsset(
        '/images/categories/lvt.jpg',
        'https://cdn.example.com/legacy-lvt-hero.jpg'
      )
    ).toBe('/images/categories/lvt.jpg');
  });

  it('falls back to database assets when the curated fallback is only a placeholder', () => {
    expect(
      selectPreferredCatalogAsset(
        '/images/placeholder.svg',
        'https://cdn.example.com/timbertech-logo.png'
      )
    ).toBe('https://cdn.example.com/timbertech-logo.png');
  });

  it('keeps collection hero precedence ordered while skipping placeholder candidates', () => {
    expect(
      selectPreferredCollectionHeroAsset(
        '',
        '/images/placeholder.svg',
        '/images/collections/hero.jpg',
        'https://cdn.example.com/fallback.jpg'
      )
    ).toBe('/images/collections/hero.jpg');

    expect(
      selectPreferredCollectionHeroAsset(
        '',
        'https://cdn.example.com/roomshot.jpg',
        'https://cdn.example.com/swatch.jpg'
      )
    ).toBe('https://cdn.example.com/roomshot.jpg');
  });

  it('keeps brand repository logos aligned with curated metadata-ready fallbacks', async () => {
    vi.doMock('@/lib/supabase/client', () => ({
      hasSupabaseAnonConfig: () => true,
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: 'a347a773-07a3-4cbe-a114-26cd8bace2ec',
                  slug: 'gerflor',
                  name: 'Gerflor',
                  logo: 'https://cdn.example.com/legacy-gerflor-logo.png',
                },
                error: null,
              }),
            }),
          }),
        }),
      },
    }));

    const { SupabaseBrandRepository } = await import('@/lib/repositories/brand-repository');
    const repository = new SupabaseBrandRepository();
    const brand = await repository.findBySlug('gerflor');

    expect(brand?.logo).toBe('/images/brands/gerflor.svg');
  }, 15000);

  it('uses real database logos when curated fallback is only a placeholder', async () => {
    vi.doMock('@/lib/supabase/client', () => ({
      hasSupabaseAnonConfig: () => true,
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: 'timbertech-db-id',
                  slug: 'timbertech',
                  name: 'TimberTech',
                  logo: 'https://cdn.example.com/timbertech-logo.png',
                },
                error: null,
              }),
            }),
          }),
        }),
      },
    }));

    const { SupabaseBrandRepository } = await import('@/lib/repositories/brand-repository');
    const repository = new SupabaseBrandRepository();
    const brand = await repository.findBySlug('timbertech');

    expect(brand?.logo).toBe('https://cdn.example.com/timbertech-logo.png');
  }, 15000);

  it('keeps category repository images aligned with curated fallback heroes', async () => {
    vi.doMock('@/lib/supabase/client', () => ({
      hasSupabaseAnonConfig: () => true,
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: '0910335d-8f7d-41bd-91a6-363b947e6165',
                  slug: 'lvt',
                  name: 'LVT',
                  image: 'https://cdn.example.com/legacy-lvt-hero.jpg',
                },
                error: null,
              }),
            }),
          }),
        }),
      },
    }));

    const { SupabaseCategoryRepository } = await import('@/lib/repositories/category-repository');
    const repository = new SupabaseCategoryRepository();
    const category = await repository.findBySlug('lvt');

    expect(category?.image).toBe('/images/collections/kolekcija-c000770-id-inspiration-55.jpg');
  }, 15000);
});
