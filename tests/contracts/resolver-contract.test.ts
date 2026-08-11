import vinylColorsData from '@/public/data/vinyl_colors_complete.json';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';
import tarkettLajsneData from '@/public/data/tarkett_lajsne_variants.json';
import type { Product } from '@/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mergeSelectedColor, prepareCustomColors } from '@/lib/product-page/prepare-colors';
import { normalizeCollectionSlug, resolveProductBySlug } from '@/lib/product-page/resolve-product';
import { getGerflorLinoleumCollections } from '@/lib/utils/productDataLoader';
import { getPrimaryColorImage } from '@/lib/utils/product-images';
import { getCanonicalCollectionAliasHref } from '@/lib/utils/product-routes';
import tarkettVinylHomeColorsData from '@/public/data/tarkett_vinyl_home_colors.json';
import { buildSpecsFromColor, loadColorFromJson } from '@/lib/product-page/color-helpers';

type NestedCollection = {
  slug: string;
  name: string;
  colors?: Array<{
    code?: string;
    name?: string;
    slug?: string;
    image?: string;
    image_url?: string;
  }>;
};

const vinylFixtureCollection = (((vinylColorsData as any).collections || []) as NestedCollection[]).find(
  (collection) => collection.slug && (collection.colors || []).filter((color) => Boolean(color.image || color.image_url)).length > 1
);

const lajsneFixtureCollection = (((tarkettLajsneData as any).collections || []) as NestedCollection[]).find(
  (collection) => collection.slug && (collection.colors || []).some((color) => Boolean(color.image || color.image_url))
);
const linoleumFixtureCollection = Array.from(
  ((((linoleumColorsData as any).colors || []) as Array<{ collection?: string; image_url?: string }>))
    .reduce<Map<string, number>>((counts, color) => {
      const collectionSlug = String(color.collection || '').trim();
      if (!collectionSlug || !color.image_url) {
        return counts;
      }

      counts.set(collectionSlug, (counts.get(collectionSlug) || 0) + 1);
      return counts;
    }, new Map())
    .entries()
).find(([, count]) => count > 1);

if (!vinylFixtureCollection) {
  throw new Error('Contract test fixture missing: no vinyl collection with at least two image-backed colors.');
}

if (!lajsneFixtureCollection) {
  throw new Error('Contract test fixture missing: no lajsne collection with image-backed variants.');
}

if (!linoleumFixtureCollection?.[0]) {
  throw new Error('Contract test fixture missing: no linoleum collection with image-backed colors.');
}

const boldFixtureCollection = ((((tarkettVinylHomeColorsData as any).collections || []) as NestedCollection[])).find(
  (collection) => collection.slug === 'tarkett-bold'
);
const boldFixtureColor = (boldFixtureCollection?.colors || []).find((color: any) => color.slug === 'tarkett-bold-color-mist-1');

if (!boldFixtureCollection || !boldFixtureColor) {
  throw new Error('Contract test fixture missing: no Tarkett Bold selected-color docs fixture.');
}

const vinylRouteSlug = vinylFixtureCollection.slug.startsWith('gerflor-')
  ? vinylFixtureCollection.slug
  : `gerflor-${vinylFixtureCollection.slug}`;

const lajsneRouteSlug = lajsneFixtureCollection.slug.startsWith('tarkett-')
  ? lajsneFixtureCollection.slug
  : `tarkett-${lajsneFixtureCollection.slug}`;

const linoleumRouteSlug = linoleumFixtureCollection[0];

const repositoryMocks = vi.hoisted(() => ({
  findBySlug: vi.fn(),
  findAll: vi.fn(),
}));

vi.mock('@/lib/repositories/product-repository', () => ({
  productRepository: {
    findBySlug: repositoryMocks.findBySlug,
    findAll: repositoryMocks.findAll,
  },
}));

// Skida `?v=<stamp>` cache-bust token sa Supabase URL-ova da snapshot ostane
// stabilan kroz buduće re-ingeste (stamp se menja po pokretanju).
function stripCacheBust(url: string | null): string | null {
  return url ? url.split('?')[0] : url;
}

function summarizeProductContract(product: Product & { collectionSlug?: string }) {
  return {
    id: product.id,
    slug: product.slug,
    categoryId: product.categoryId,
    brandId: product.brandId,
    collectionSlug: product.collectionSlug || null,
    name: product.name,
    shortDescription: product.shortDescription,
    hasPrimaryImage: Boolean(product.images?.[0]?.url),
    primaryImageUrl: stripCacheBust(product.images?.[0]?.url || null),
    specSample: (product.specs || []).slice(0, 8).map((spec) => ({
      key: spec.key,
      label: spec.label,
      value: spec.value,
    })),
    specCount: product.specs?.length || 0,
    documentCount: product.documents?.length || 0,
    detailsSectionCount: product.detailsSections?.length || 0,
  };
}

describe('resolve-product contract', () => {
  beforeEach(() => {
    repositoryMocks.findBySlug.mockReset();
    repositoryMocks.findAll.mockReset();
    repositoryMocks.findBySlug.mockResolvedValue(null);
    repositoryMocks.findAll.mockResolvedValue([]);
  });

  it.each([
    { categoryId: '6', collectionSlug: 'creation-30', brandId: '6', expected: 'gerflor-creation-30' },
    { categoryId: '2', collectionSlug: 'andes', brandId: '11', expected: 'wolflor-andes' },
    { categoryId: '11', collectionSlug: 'aqua-oak', brandId: '3', expected: 'tarkett-aqua-oak' },
    { categoryId: '7', collectionSlug: 'gerflor-dlw-uni-walton', brandId: '6', expected: 'dlw-uni-walton' },
  ])('normalizes collection slug for category $categoryId', ({ categoryId, collectionSlug, brandId, expected }) => {
    expect(normalizeCollectionSlug(categoryId, collectionSlug, brandId)).toBe(expected);
  });

  it('does not issue HTTP requests after every local color catalog misses', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Not available', { status: 403 })
    );

    await expect(loadColorFromJson('__definitely-missing-color__')).resolves.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('resolves a vinyl collection slug into stable product contract', async () => {
    const resolved = await resolveProductBySlug(vinylRouteSlug);

    expect(resolved).not.toBeNull();
    expect(resolved?.categoryId).toBe('2');
    expect(resolved?.images?.length).toBeGreaterThan(0);
    expect(summarizeProductContract(resolved as Product & { collectionSlug?: string })).toMatchSnapshot();
  });

  it('resolves a lajsne collection slug into stable product contract', async () => {
    const resolved = await resolveProductBySlug(lajsneRouteSlug);

    expect(resolved).not.toBeNull();
    expect(resolved?.categoryId).toBe('11');
    expect(resolved?.brandId).toBe('3');
    expect(summarizeProductContract(resolved as Product & { collectionSlug?: string })).toMatchSnapshot();
  });

  it('resolves a linoleum collection slug to the same collection-cover contract as the loader fallback', async () => {
    const resolved = await resolveProductBySlug(linoleumRouteSlug);
    const loaderProduct = getGerflorLinoleumCollections().find((product) => product.slug === `gerflor-${linoleumRouteSlug}`);

    expect(resolved).not.toBeNull();
    expect(resolved?.categoryId).toBe('7');
    expect(loaderProduct?.images?.[0]?.url).toBeTruthy();
    expect(resolved?.images?.[0]?.url).toBe(loaderProduct?.images?.[0]?.url);
  });

  it('prepares linoleum custom colors on the collection route instead of falling back to global JSON lookups', async () => {
    const resolved = await resolveProductBySlug(linoleumRouteSlug);

    expect(resolved).not.toBeNull();

    const customColors = await prepareCustomColors(resolved as Product, linoleumRouteSlug);

    expect(customColors).toBeDefined();
    expect(customColors!.length).toBeGreaterThan(1);
    expect(customColors!.every((color) => color.collection === linoleumRouteSlug)).toBe(true);
  });

  it('merges selected color data into collection product without breaking base contract fields', async () => {
    const resolved = await resolveProductBySlug(vinylRouteSlug);
    expect(resolved).not.toBeNull();

    const customColors = await prepareCustomColors(resolved as Product, vinylRouteSlug);
    expect(customColors).toBeDefined();
    expect(customColors!.length).toBeGreaterThan(1);

    const before = resolved as Product;
    const selectedColor = customColors!.find((color) => {
      const candidateImage = color.image_url || color.texture_url;
      return Boolean(color.slug && candidateImage && candidateImage !== before.images?.[0]?.url);
    }) || customColors![1];
    const expectedHeroImage = getPrimaryColorImage(selectedColor)?.url;
    const mutated = structuredClone(before) as Product;

    expect(selectedColor.slug).toBeTruthy();
    expect(expectedHeroImage).toBeTruthy();

    await mergeSelectedColor(mutated, selectedColor.slug);

    expect(mutated.name).not.toBe(before.name);
    expect(mutated.images?.length).toBeGreaterThan(0);
    expect(mutated.images?.[0]?.url).toBe(expectedHeroImage);
    expect(mutated.images?.[0]?.url).not.toBe(before.images?.[0]?.url);

    expect({
      selectedColorSlug: selectedColor.slug,
      beforeName: before.name,
      afterName: mutated.name,
      afterShortDescription: mutated.shortDescription,
      documentCount: mutated.documents?.length || 0,
      imageUrl: stripCacheBust(mutated.images?.[0]?.url || null),
      specCount: mutated.specs?.length || 0,
      hasThicknessSpec: (mutated.specs || []).some((spec) => spec.key === 'thickness' || spec.key === 'overall_thickness'),
      hasFormatSpec: (mutated.specs || []).some((spec) => spec.key === 'format'),
      specSample: (mutated.specs || []).slice(0, 8).map((spec) => ({
        key: spec.key,
        label: spec.label,
        value: spec.value,
      })),
    }).toMatchSnapshot();
  });

  it('merges selected-color documents into the server product contract when the color has richer docs than the collection', async () => {
    const resolved = await resolveProductBySlug('tarkett-bold');
    expect(resolved).not.toBeNull();

    const mutated = structuredClone(resolved as Product) as Product;
    await mergeSelectedColor(mutated, boldFixtureColor.slug);

    expect(mutated.documents?.length).toBeGreaterThan(1);
    expect({
      collectionSlug: 'tarkett-bold',
      selectedColorSlug: boldFixtureColor.slug,
      documentCount: mutated.documents?.length || 0,
      documents: (mutated.documents || []).map((document) => ({
        title: document.title,
        url: document.url,
      })),
    }).toMatchSnapshot();
  });

  it('keeps key selected-color specs aligned with the canonical color helper output', async () => {
    const resolved = await resolveProductBySlug(vinylRouteSlug);
    expect(resolved).not.toBeNull();

    const customColors = await prepareCustomColors(resolved as Product, vinylRouteSlug);
    expect(customColors).toBeDefined();
    expect(customColors!.length).toBeGreaterThan(1);

    const selectedColor = customColors!.find((color) => color.slug === 'mipolam-accord-0303-manitoba') || customColors![0];
    const expectedSpecs = buildSpecsFromColor(selectedColor, {
      categoryId: (resolved as Product).categoryId,
      brandId: (resolved as Product).brandId,
    });

    const mutated = structuredClone(resolved as Product) as Product;
    await mergeSelectedColor(mutated, selectedColor.slug);

    const expectedSubset = ['format', 'thickness', 'dimension'];
    for (const key of expectedSubset) {
      const expectedSpec = expectedSpecs.find((spec) => spec.key === key);
      if (!expectedSpec) {
        continue;
      }

      expect(mutated.specs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: expectedSpec.key,
            value: expectedSpec.value,
          }),
        ])
      );
    }

    const expectedWeldingSpec = expectedSpecs.find((spec) => /(elektrod|varila|welding|vrpca)/i.test(spec.label));
    if (expectedWeldingSpec) {
      expect(mutated.specs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: expectedWeldingSpec.key,
            value: expectedWeldingSpec.value,
          }),
        ])
      );
    }
  });

  it.each([
    {
      routeSlug: 'creation-30',
      expectedHref: '/proizvodi/gerflor-creation-30?color=ballerina-41870347',
      colorSlug: 'ballerina-41870347',
    },
    {
      routeSlug: 'bold',
      expectedHref: '/proizvodi/tarkett-bold?color=tarkett-bold-color-mist-1',
      colorSlug: 'tarkett-bold-color-mist-1',
    },
    {
      routeSlug: 'gerflor-dlw-uni-walton',
      expectedHref: '/proizvodi/dlw-uni-walton?color=dolphin-184',
      colorSlug: 'dolphin-184',
    },
  ])('computes canonical collection alias redirect for $routeSlug', async ({ routeSlug, expectedHref, colorSlug }) => {
    const resolved = await resolveProductBySlug(routeSlug);
    expect(resolved).not.toBeNull();

    expect(
      getCanonicalCollectionAliasHref(routeSlug, resolved as Product & { collectionSlug?: string }, colorSlug)
    ).toBe(expectedHref);
  });
});
