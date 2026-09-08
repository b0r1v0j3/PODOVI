import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { GET as searchProducts } from '@/app/api/search/route';
import { GET as getProducts } from '@/app/api/products/route';
import { GET as getHomeColors } from '@/app/api/home-colors/route';
import { GET as getColorData } from '@/app/api/color-data/route';
import sitemap from '@/app/sitemap';
import { brandRepository } from '@/lib/repositories/brand-repository';
import { productRepository, SupabaseProductRepository } from '@/lib/repositories/product-repository';
import { getAllDessoCarpetProducts, getGerflorCarpetCollections, getProductBySlug } from '@/lib/utils/productDataLoader';
import { loadColorFromJson } from '@/lib/product-page/color-helpers';
import { resolveProductBySlug } from '@/lib/product-page/resolve-product';
import { getColorsForCategory } from '@/lib/colors/get-colors';
import {
  RETIRED_BLOQ_COLLECTION_SLUGS,
  RETIRED_BLOQ_COLOR_SLUGS,
  isRetiredBloqProduct,
  isRetiredBloqReference,
} from '@/lib/catalog/retired-bloq';

vi.mock('@/lib/supabase/client', () => ({
  hasSupabaseAnonConfig: () => false,
  supabase: {
    from: () => {
      const query: Record<string, any> = {
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve),
        single: async () => ({ data: null, error: null }),
      };
      for (const method of ['select', 'eq', 'in', 'gte', 'lte', 'or', 'order']) query[method] = () => query;
      return query;
    },
  },
}));

describe('retired BLOQ catalog', () => {
  it('removes the brand and products from both catalog implementations while preserving Gerflor and Desso', async () => {
    expect(await brandRepository.findById('8')).toBeNull();
    expect(await brandRepository.findBySlug('bloq')).toBeNull();
    expect((await brandRepository.findAll()).some((brand) => brand.id === '8' || brand.slug === 'bloq')).toBe(false);

    const repository = new SupabaseProductRepository();
    expect((await productRepository.findAll()).some(isRetiredBloqProduct)).toBe(false);
    expect(await productRepository.findByBrand('8')).toEqual([]);
    for (const catalog of [productRepository, repository]) {
      expect(await catalog.findByCategory('4', { brandIds: ['8'] })).toEqual([]);
      expect((await catalog.findByCategory('4')).some(isRetiredBloqProduct)).toBe(false);
    }

    const carpet = await repository.findByCategory('4');
    const gerflor = getGerflorCarpetCollections();
    const desso = getAllDessoCarpetProducts();
    expect(gerflor.length).toBeGreaterThan(0);
    expect(desso.filter((product) => product.sku.startsWith('DESSO-'))).toHaveLength(46);
    for (const product of [...gerflor, ...desso]) {
      expect(carpet.some((entry) => entry.slug === product.slug), product.slug).toBe(true);
    }
  });

  it('does not reconstruct any of the 18 old collections or 210 bare color URLs', async () => {
    expect(RETIRED_BLOQ_COLLECTION_SLUGS).toHaveLength(18);
    expect(RETIRED_BLOQ_COLOR_SLUGS).toHaveLength(210);
    for (const slug of [...RETIRED_BLOQ_COLLECTION_SLUGS, ...RETIRED_BLOQ_COLOR_SLUGS]) {
      expect(getProductBySlug(slug), slug).toBeUndefined();
      expect(await productRepository.findBySlug(slug), slug).toBeNull();
      expect(await resolveProductBySlug(slug), slug).toBeNull();
      expect(await loadColorFromJson(slug), slug).toBeNull();
    }
    expect(isRetiredBloqReference('/proizvodi/bloq-assembly?color=assembly-201-saffron')).toBe(true);
    expect(isRetiredBloqReference('/upiti?product=assembly-201-saffron')).toBe(true);
    expect(isRetiredBloqReference('new-assembly-collection')).toBe(false);
    expect(isRetiredBloqReference('flow')).toBe(false);
  }, 60000); // Exhaustively runs the full resolver for all 228 retired identities.

  it('excludes retired products from search, saved-product lookup, home colors, color data and sitemap', async () => {
    const search = await searchProducts(new NextRequest('http://localhost/api/search?q=BLOQ'));
    expect((await search.json()).products).toEqual([]);
    const products = await getProducts(new NextRequest('http://localhost/api/products?ids=bloq-coll-bloq-assembly,assembly-201-saffron'));
    expect((await products.json()).products).toEqual([]);
    const homeColors = await getHomeColors(new NextRequest('http://localhost/api/home-colors?categoryIds=4'));
    expect((await homeColors.json()).groups[0].products.some(isRetiredBloqProduct)).toBe(false);
    const colorData = await getColorData(new NextRequest('http://localhost/api/color-data?categoryId=4&color=assembly-201-saffron'));
    expect(await colorData.json()).toEqual({ documents: [], characteristics: {}, specs: [] });
    const colors = await getColorsForCategory('tekstilne-ploce', { collection: 'bloq-assembly' });
    expect(colors.body.colors).toEqual([]);
    expect((await sitemap()).some((entry) => isRetiredBloqReference(entry.url))).toBe(false);
  });
});
