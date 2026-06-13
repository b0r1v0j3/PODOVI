import { describe, expect, it } from 'vitest';
import type { Product } from '@/types';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';
import bloqCarpetData from '@/public/data/bloq_carpet_tiles.json';
import collectionImagesData from '@/public/data/collection_images.json';
import tarkettLajsneData from '@/public/data/tarkett_lajsne_variants.json';
import tarkettLvtData from '@/public/data/tarkett_lvt_products.json';
import {
  getColorImageCandidates,
  getCustomColorHeroImageState,
  getMetadataImageSet,
  getPrimaryColorImage,
  getPrimaryProductImage,
  getProductImageCandidates,
  normalizeProductImageCandidates,
} from '@/lib/utils/product-images';
import {
  getAllTechemProducts,
  getAllBloqCarpetProducts,
  getGerflorLVTCollections,
  getGerflorLinoleumCollections,
  getTarkettLVTCollections,
  getTarkettLajsneCollections,
  getVinylCollectionProducts,
} from '@/lib/utils/productDataLoader';

const productFixture: Product = {
  id: 'techem-variant-fixture',
  name: 'Techem Variant Fixture',
  slug: 'techem-variant-fixture',
  sku: 'TECHEM-VARIANT-FIXTURE',
  categoryId: '12',
  brandId: '12',
  shortDescription: 'Test fixture.',
  description: 'Test fixture.',
  images: [
    {
      id: 'fixture-image-1',
      url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/otiraci/fixture/01-full.jpg',
      alt: 'Fixture image',
      isPrimary: true,
      order: 0,
      variants: {
        thumb: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/otiraci/fixture/01-thumb.jpg',
        card: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/otiraci/fixture/01-card.jpg',
        hero: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/otiraci/fixture/01-hero.jpg',
        og: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/otiraci/fixture/01-og.jpg',
      },
    },
  ],
  specs: [],
  inStock: true,
  featured: false,
  createdAt: new Date('2026-04-17T00:00:00.000Z'),
  updatedAt: new Date('2026-04-17T00:00:00.000Z'),
};

type FlatCollectionColor = {
  collection?: string;
  lifestyle_url?: string;
  image_url?: string;
};

type NestedCollection = {
  slug?: string;
  collection_image_url?: string;
  colors?: Array<{
    image?: string;
    image_url?: string;
  }>;
};

function normalizeCandidate(value: string | null | undefined) {
  return String(value || '').trim();
}

function pickFirstNonEmpty(values: Array<string | null | undefined>) {
  return values.map(normalizeCandidate).find(Boolean) || '';
}

function pickLongestNonEmpty(values: Array<string | null | undefined>) {
  return values
    .map(normalizeCandidate)
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)[0] || '';
}

function buildOrderedCollectionHeroFixture(
  colors: FlatCollectionColor[],
  buildCandidates: (groupedColors: FlatCollectionColor[]) => Array<string | null | undefined>
) {
  const grouped = new Map<string, FlatCollectionColor[]>();

  for (const color of colors) {
    const collectionSlug = normalizeCandidate(color.collection);
    if (!collectionSlug) {
      continue;
    }

    if (!grouped.has(collectionSlug)) {
      grouped.set(collectionSlug, []);
    }

    grouped.get(collectionSlug)!.push(color);
  }

  const fixtures = Array.from(grouped.entries())
    .map(([collectionSlug, groupedColors]) => {
      const candidates = buildCandidates(groupedColors);
      const expectedImage = pickFirstNonEmpty(candidates);
      const longestCandidate = pickLongestNonEmpty(candidates);

      return {
        slug: `gerflor-${collectionSlug}`,
        expectedImage,
        longestCandidate,
      };
    })
    .filter((fixture) => Boolean(fixture.expectedImage));

  const precedenceFixture = fixtures.find((fixture) => fixture.expectedImage !== fixture.longestCandidate);
  if (precedenceFixture) {
    return precedenceFixture;
  }

  const fallbackFixture = fixtures[0];
  if (!fallbackFixture) {
    throw new Error('Contract test fixture missing: no grouped collection hero candidate found.');
  }

  return fallbackFixture;
}

const gerflorLvtHeroFixture = buildOrderedCollectionHeroFixture(
  (((lvtColorsData as any).colors || []) as FlatCollectionColor[]),
  (groupedColors) => [
    ...groupedColors.map((color) => color.lifestyle_url),
    ...groupedColors.map((color) => color.image_url),
  ]
);

const gerflorLinoleumHeroFixture = buildOrderedCollectionHeroFixture(
  (((linoleumColorsData as any).colors || []) as FlatCollectionColor[]),
  (groupedColors) => groupedColors.map((color) => color.image_url)
);

const tarkettLajsneHeroFixture = (() => {
  const collection = ((((tarkettLajsneData as any).collections || []) as NestedCollection[]).find((item) => {
    const firstVariantImage = normalizeCandidate(item.colors?.[0]?.image || item.colors?.[0]?.image_url);
    return Boolean(item.slug && item.collection_image_url && firstVariantImage && firstVariantImage !== item.collection_image_url);
  }));

  if (!collection?.slug || !collection.collection_image_url) {
    throw new Error('Contract test fixture missing: no Tarkett lajsne collection with distinct collection_image_url.');
  }

  return {
    slug: collection.slug,
    expectedImage: collection.collection_image_url,
  };
})();

const bloqHeroFixture = (() => {
  const collection = ((((bloqCarpetData as any).colors || []) as any[]).find((item) => {
    const collectionSlug = normalizeCandidate(item.collection_slug || item.collection);
    const firstSwatchImage = normalizeCandidate(item.image_url);
    const normalizedRoomshotSlug = collectionSlug.startsWith('bloq-')
      ? collectionSlug
      : `bloq-${collectionSlug}`;
    const expectedImage = normalizedRoomshotSlug
      ? `/images/products/bloq-roomshots/${normalizedRoomshotSlug}-roomshot.jpg`
      : '';

    return Boolean(collectionSlug && firstSwatchImage && expectedImage && firstSwatchImage !== expectedImage);
  }));

  if (!collection) {
    throw new Error('Contract test fixture missing: no BLOQ collection with distinct roomshot path.');
  }

  const collectionSlug = normalizeCandidate(collection.collection_slug || collection.collection);
  const normalizedRoomshotSlug = collectionSlug.startsWith('bloq-')
    ? collectionSlug
    : `bloq-${collectionSlug}`;

  return {
    slug: collectionSlug,
    expectedImage: `/images/products/bloq-roomshots/${normalizedRoomshotSlug}-roomshot.jpg`,
    firstSwatchImage: normalizeCandidate(collection.image_url),
  };
})();

function resolveMappedTarkettCollectionImage(collectionSlug: string) {
  const collectionImages = (collectionImagesData as Record<string, string>) || {};
  const normalizedSlug = normalizeCandidate(collectionSlug);
  if (!normalizedSlug) {
    return '';
  }

  return Object.entries(collectionImages).find(([key]) =>
    key.toLowerCase().includes(normalizedSlug.toLowerCase())
  )?.[1] || '';
}

const tarkettLvtHeroFixture = (() => {
  const products = ((tarkettLvtData as any[]) || []);
  const fixture = products
    .map((item) => {
      const collectionSlug = normalizeCandidate(item.collection);
      const expectedImage = resolveMappedTarkettCollectionImage(collectionSlug);
      const firstDesignImage = normalizeCandidate(item.images?.[0]);

      if (!collectionSlug || !expectedImage || !firstDesignImage) {
        return null;
      }

      return {
        slug: `tarkett-${collectionSlug}`,
        expectedImage,
        firstDesignImage,
      };
    })
    .find((item) => item && item.expectedImage !== item.firstDesignImage);

  if (!fixture) {
    throw new Error('Contract test fixture missing: no Tarkett LVT collection with distinct curated cover path.');
  }

  return fixture;
})();

describe('Product image variant contracts', () => {
  it('resolves the right image variant per surface', () => {
    expect(getPrimaryProductImage(productFixture, 'thumb')?.url).toBe(productFixture.images[0].variants?.thumb);
    expect(getPrimaryProductImage(productFixture, 'card')?.url).toBe(productFixture.images[0].variants?.card);
    expect(getPrimaryProductImage(productFixture, 'hero')?.url).toBe(productFixture.images[0].variants?.hero);
  });

  it('uses og variants for metadata images', () => {
    const metadataImages = getMetadataImageSet(productFixture, 'https://www.podovi.online');

    expect(metadataImages[0]).toMatchObject({
      url: productFixture.images[0].variants?.og,
      alt: productFixture.images[0].alt,
      width: 1200,
      height: 630,
    });
  });

  it('builds ordered fallback candidates for runtime surfaces', () => {
    expect(getProductImageCandidates(productFixture, 'thumb')).toEqual([
      {
        url: productFixture.images[0].variants?.thumb,
        alt: productFixture.images[0].alt,
      },
    ]);

    expect(
      normalizeProductImageCandidates(
        { url: productFixture.images[0].variants?.card, alt: productFixture.images[0].alt },
        [
          { url: productFixture.images[0].variants?.card, alt: 'duplicate should be removed' },
          { url: productFixture.images[0].variants?.hero, alt: productFixture.images[0].alt },
          { url: '', alt: 'empty should be removed' },
        ]
      )
    ).toEqual([
      {
        url: productFixture.images[0].variants?.card,
        alt: productFixture.images[0].alt,
      },
      {
        url: productFixture.images[0].variants?.hero,
        alt: productFixture.images[0].alt,
      },
    ]);
  });

  it('preserves Techem surface variants when loading the dataset', () => {
    const techemProduct = getAllTechemProducts().find((product) =>
      (product.images || []).some((image) =>
        Boolean(image.variants?.thumb && image.variants?.card && image.variants?.hero && image.variants?.og)
      )
    );

    expect(techemProduct).toBeTruthy();
    expect(techemProduct?.images[0]?.variants).toMatchObject({
      thumb: expect.any(String),
      card: expect.any(String),
      hero: expect.any(String),
      og: expect.any(String),
    });
  });

  it('keeps the collection cover visible before any custom color is selected', () => {
    const initialImage = {
      url: '/images/collections/kolekcija-c000770-id-inspiration-55.jpg',
      alt: 'Collection cover',
    };
    const customColors = [
      {
        slug: 'variant-a',
        image_url: 'https://cdn.example.com/variant-a.jpg',
        name: 'Variant A',
      },
      {
        slug: 'variant-b',
        texture_url: 'https://cdn.example.com/variant-b.jpg',
        full_name: 'Variant B',
      },
    ];

    expect(getCustomColorHeroImageState(customColors, undefined, initialImage)).toEqual({
      activeColorSlug: undefined,
      image: initialImage,
    });
  });

  it('switches the PDP hero to the selected custom color only after an explicit color slug exists', () => {
    const initialImage = {
      url: '/images/collections/kolekcija-c000770-id-inspiration-55.jpg',
      alt: 'Collection cover',
    };
    const customColors = [
      {
        slug: 'variant-a',
        image_url: 'https://cdn.example.com/variant-a.jpg',
        name: 'Variant A',
      },
      {
        slug: 'variant-b',
        texture_url: 'https://cdn.example.com/variant-b.jpg',
        full_name: 'Variant B',
      },
    ];

    expect(getCustomColorHeroImageState(customColors, 'variant-b', initialImage)).toEqual({
      activeColorSlug: 'variant-b',
      image: {
        url: 'https://cdn.example.com/variant-b.jpg',
        alt: 'Variant B',
      },
    });
  });

  it('keeps explicit selected-color image precedence on texture before lifestyle and image_url', () => {
    const color = {
      slug: 'variant-a',
      texture_url: 'https://cdn.example.com/variant-a-texture.jpg',
      lifestyle_url: 'https://cdn.example.com/variant-a-lifestyle.jpg',
      image_url: 'https://cdn.example.com/variant-a-image.jpg',
      image: 'https://cdn.example.com/variant-a-legacy.jpg',
      full_name: 'Variant A',
    };

    expect(getColorImageCandidates(color)).toEqual([
      {
        url: 'https://cdn.example.com/variant-a-texture.jpg',
        alt: 'Variant A',
      },
      {
        url: 'https://cdn.example.com/variant-a-lifestyle.jpg',
        alt: 'Variant A',
      },
      {
        url: 'https://cdn.example.com/variant-a-image.jpg',
        alt: 'Variant A',
      },
      {
        url: 'https://cdn.example.com/variant-a-legacy.jpg',
        alt: 'Variant A',
      },
    ]);
    expect(getPrimaryColorImage(color)?.url).toBe('https://cdn.example.com/variant-a-texture.jpg');
    expect(
      getCustomColorHeroImageState([color], 'variant-a', {
        url: '/images/collections/kolekcija-c000770-id-inspiration-55.jpg',
        alt: 'Collection cover',
      }).image?.url
    ).toBe('https://cdn.example.com/variant-a-texture.jpg');
  });

  it.each([
    'gerflor-mipolam-evo',
    'gerflor-taralay-impression-acoustic',
    'gerflor-taralay-impression-compact',
    'gerflor-taralay-impression-hop-acoustic',
    'gerflor-taralay-impression-hop-compact',
    'gerflor-taralay-millenium-acoustic',
  ])('keeps Gerflor vinyl collection %s cover as self-hosted Supabase hero before color images', (slug) => {
    const product = getVinylCollectionProducts().find((item) => item.slug === slug);
    const coverUrl = product?.images?.[0]?.url ?? '';
    const collectionSlug = slug.replace(/^gerflor-/, '');

    // Posle S2 obogaćivanja, hero (images[0]) je self-hostovan Supabase
    // collection_image_url pod putanjom te kolekcije (otporno na ?v= cache-bust
    // i na ponovni ingest — proverava se obrazac putanje, ne tačan fajl/stamp).
    expect(coverUrl).toMatch(
      new RegExp(`^https://nnjmrfwepylrheykalik\\.supabase\\.co/storage/v1/object/public/product-images/products/vinil/${collectionSlug}/`),
    );
  });

  it('keeps Tarkett lajsne collection headers on collection_image_url before variant images', () => {
    const product = getTarkettLajsneCollections().find((item) => item.slug === tarkettLajsneHeroFixture.slug);

    expect(product?.images?.[0]?.url).toBe(tarkettLajsneHeroFixture.expectedImage);
  });

  it('keeps BLOQ collection headers on the dedicated roomshot before tile swatches', () => {
    const product = getAllBloqCarpetProducts().find((item) => item.slug === bloqHeroFixture.slug);

    expect(product?.images?.[0]?.url).toBe(bloqHeroFixture.expectedImage);
    expect(product?.images?.[0]?.url).not.toBe(bloqHeroFixture.firstSwatchImage);
  });

  it('keeps Tarkett LVT collection headers on the curated collection cover before design images', () => {
    const product = getTarkettLVTCollections().find((item) => item.slug === tarkettLvtHeroFixture.slug);

    expect(product?.images?.[0]?.url).toBe(tarkettLvtHeroFixture.expectedImage);
    expect(product?.images?.[0]?.url).not.toBe(tarkettLvtHeroFixture.firstDesignImage);
  });

  it('uses the first ordered lifestyle-or-swatch candidate for Gerflor LVT collection heroes', () => {
    const product = getGerflorLVTCollections().find((item) => item.slug === gerflorLvtHeroFixture.slug);

    expect(product?.images?.[0]?.url).toBe(gerflorLvtHeroFixture.expectedImage);
    expect(gerflorLvtHeroFixture.expectedImage).not.toBe('');
  });

  it('uses the first ordered swatch candidate for Gerflor linoleum collection heroes', () => {
    const product = getGerflorLinoleumCollections().find((item) => item.slug === gerflorLinoleumHeroFixture.slug);

    expect(product?.images?.[0]?.url).toBe(gerflorLinoleumHeroFixture.expectedImage);
    expect(gerflorLinoleumHeroFixture.expectedImage).not.toBe('');
  });
});
