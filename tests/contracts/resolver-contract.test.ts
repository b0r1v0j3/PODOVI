import vinylColorsData from '@/public/data/vinyl_colors_complete.json';
import tarkettLajsneData from '@/public/data/tarkett_lajsne_variants.json';
import type { Product } from '@/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mergeSelectedColor, prepareCustomColors } from '@/lib/product-page/prepare-colors';
import { normalizeCollectionSlug, resolveProductBySlug } from '@/lib/product-page/resolve-product';

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

if (!vinylFixtureCollection) {
  throw new Error('Contract test fixture missing: no vinyl collection with at least two image-backed colors.');
}

if (!lajsneFixtureCollection) {
  throw new Error('Contract test fixture missing: no lajsne collection with image-backed variants.');
}

const vinylRouteSlug = vinylFixtureCollection.slug.startsWith('gerflor-')
  ? vinylFixtureCollection.slug
  : `gerflor-${vinylFixtureCollection.slug}`;

const lajsneRouteSlug = lajsneFixtureCollection.slug.startsWith('tarkett-')
  ? lajsneFixtureCollection.slug
  : `tarkett-${lajsneFixtureCollection.slug}`;

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
    primaryImageUrl: product.images?.[0]?.url || null,
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

  it('merges selected color data into collection product without breaking base contract fields', async () => {
    const resolved = await resolveProductBySlug(vinylRouteSlug);
    expect(resolved).not.toBeNull();

    const customColors = await prepareCustomColors(resolved as Product, vinylRouteSlug);
    expect(customColors).toBeDefined();
    expect(customColors!.length).toBeGreaterThan(1);

    const selectedColor = customColors![1];
    const before = resolved as Product;
    const mutated = structuredClone(before) as Product;

    await mergeSelectedColor(mutated, selectedColor.slug);

    expect(mutated.name).not.toBe(before.name);
    expect(mutated.images?.length).toBeGreaterThan(0);

    expect({
      selectedColorSlug: selectedColor.slug,
      beforeName: before.name,
      afterName: mutated.name,
      afterShortDescription: mutated.shortDescription,
      imageUrl: mutated.images?.[0]?.url || null,
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
});
