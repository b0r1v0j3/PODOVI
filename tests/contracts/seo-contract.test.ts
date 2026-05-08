import techemData from '@/public/data/techem_mats.json';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';
import bloqCarpetData from '@/public/data/bloq_carpet_tiles.json';
import tarkettVinylHomeColorsData from '@/public/data/tarkett_vinyl_home_colors.json';
import wolflorVinylColorsData from '@/public/data/wolflor_vinyl_colors.json';
import tarkettSportColorsData from '@/public/data/tarkett_sport_colors.json';
import type { Brand, Category, Product } from '@/types';
import { getCanonicalProductHref } from '@/lib/utils/product-routes';
import { getPrimaryColorImage, resolveMetadataImageUrl } from '@/lib/utils/product-images';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const repositoryMocks = vi.hoisted(() => ({
  productFindAll: vi.fn(),
  productFindByCategory: vi.fn(),
  productFindByBrand: vi.fn(),
  productFindBySlug: vi.fn(),
  categoryFindAll: vi.fn(),
  categoryFindById: vi.fn(),
  categoryFindBySlug: vi.fn(),
  brandFindAll: vi.fn(),
  brandFindById: vi.fn(),
  brandFindBySlug: vi.fn(),
}));

const componentStub = vi.hoisted(() => () => ({
  default: () => null,
}));

const navigationMocks = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    const error = new Error(`NEXT_REDIRECT:${url}`) as Error & { digest?: string };
    error.digest = `NEXT_REDIRECT;replace;${url}`;
    throw error;
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/lib/repositories/product-repository', () => ({
  productRepository: {
    findAll: repositoryMocks.productFindAll,
    findByCategory: repositoryMocks.productFindByCategory,
    findBySlug: repositoryMocks.productFindBySlug,
  },
  getProductsByBrand: repositoryMocks.productFindByBrand,
}));

vi.mock('@/lib/repositories/category-repository', () => ({
  categoryRepository: {
    findAll: repositoryMocks.categoryFindAll,
    findById: repositoryMocks.categoryFindById,
    findBySlug: repositoryMocks.categoryFindBySlug,
  },
}));

vi.mock('@/lib/repositories/brand-repository', () => ({
  brandRepository: {
    findAll: repositoryMocks.brandFindAll,
    findById: repositoryMocks.brandFindById,
    findBySlug: repositoryMocks.brandFindBySlug,
  },
  getBrandBySlug: repositoryMocks.brandFindBySlug,
}));

vi.mock('@/components/Breadcrumbs', componentStub);
vi.mock('@/components/ProductColorSelector', componentStub);
vi.mock('@/components/ColorGrid', componentStub);
vi.mock('@/components/ProductActions', componentStub);
vi.mock('@/components/ProductDocuments', componentStub);
vi.mock('@/components/RecommendedAccessories', componentStub);
vi.mock('@/components/EcoFeatures', componentStub);
vi.mock('@/components/CertificationBadges', componentStub);
vi.mock('@/components/RelatedProducts', componentStub);
vi.mock('@/components/RecentlyViewed', componentStub);
vi.mock('@/components/ProductInquiryStickyCTA', componentStub);
vi.mock('@/components/ProductViewTracker', componentStub);
vi.mock('@/components/ProductDetailsTabs', componentStub);
vi.mock('@/components/ProductImage', componentStub);
vi.mock('@/components/ProductCharacteristics', componentStub);
vi.mock('@/components/ProductDescriptionWithCharacteristics', componentStub);
vi.mock('@/components/ProductBenefits', componentStub);
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation');
  return {
    ...actual,
    redirect: navigationMocks.redirect,
    notFound: navigationMocks.notFound,
  };
});

const techemGeneratedAt = new Date((techemData as any).generatedAt);
const selectedColorMetadataFixture = ((((lvtColorsData as any).colors || []) as Array<Record<string, any>>).find((color) =>
  color.collection &&
  color.slug &&
  color.texture_url &&
  color.lifestyle_url &&
  color.texture_url !== color.lifestyle_url
));
const bloqSelectedColorFixture = ((((bloqCarpetData as any).colors || []) as Array<Record<string, any>>).find((color) =>
  color.collection_slug &&
  color.slug &&
  color.image_url
));
const creation30FirstColorSlug = (((lvtColorsData as any).colors || []) as Array<Record<string, any>>)
  .find((color) => color.collection === 'creation-30' && color.slug)?.slug;
const foreignCreation30ColorFixture = ((((lvtColorsData as any).colors || []) as Array<Record<string, any>>).find((color) =>
  color.collection &&
  color.collection !== 'creation-30' &&
  color.slug
));
const boldFixtureCollection = ((((tarkettVinylHomeColorsData as any).collections || []) as Array<Record<string, any>>)).find(
  (collection) => collection.slug === 'tarkett-bold'
);
const boldFirstColorSlug = (boldFixtureCollection?.colors || []).find((color: any) => color.slug)?.slug;
const boldSecondColorSlug = (boldFixtureCollection?.colors || []).map((color: any) => color.slug).filter(Boolean)[1];
const foreignBoldColorSlug = ((((wolflorVinylColorsData as any).collections || []) as Array<Record<string, any>>)
  .flatMap((collection) => collection.colors || [])
  .find((color) => color.slug))?.slug;
const tarkettSportCollections = (((tarkettSportColorsData as any).collections || []) as Array<Record<string, any>>);
const dancefloorFixtureCollection = tarkettSportCollections.find((collection) => collection.slug === 'tarkett-dancefloor');
const dancefloorFirstColorSlug = (dancefloorFixtureCollection?.colors || []).find((color: any) => color.slug)?.slug;
const dancefloorSecondColorSlug = (dancefloorFixtureCollection?.colors || [])
  .map((color: any) => color.slug)
  .filter(Boolean)[1];
const foreignSportColorSlug = tarkettSportCollections
  .filter((collection) => collection.slug !== 'tarkett-dancefloor')
  .flatMap((collection) => collection.colors || [])
  .find((color) => color.slug)?.slug;
const gerflorSportForeignColorSlug = 'dlw-colorette-sport-1001-banana-yellow';
const linoleumFirstColorSlug = (((linoleumColorsData as any).colors || []) as Array<Record<string, any>>)
  .find((color) => color.collection === 'dlw-uni-walton' && color.slug)?.slug;
const techemOwnedImageHosts = new Set([
  'nnjmrfwepylrheykalik.supabase.co',
  'www.podovi.online',
  'podovi.online',
]);
const techemSupplierImageHosts = new Set(['www.techem-wycieraczki.com.pl', 'techem-wycieraczki.com.pl']);

function extractTechemMetadataImageUrls(product: Record<string, any>) {
  const rawCandidates = [
    product.heroImage,
    ...(Array.isArray(product.galleryImages) ? product.galleryImages : []),
    ...(Array.isArray(product.images) ? product.images : []),
    product.image,
    product.image_url,
    product.thumbnail,
    product.thumbnail_url,
  ].filter(Boolean);

  const uniqueUrls: string[] = [];
  for (const candidate of rawCandidates) {
    let url = '';
    let variantUrls: string[] = [];

    if (typeof candidate === 'string') {
      url = candidate;
    } else if (candidate && typeof candidate === 'object') {
      url = String(candidate.url || candidate.src || candidate.image || candidate.image_url || '').trim();
      if (candidate.variants && typeof candidate.variants === 'object') {
        variantUrls = Object.values(candidate.variants)
          .map((value) => String(value || '').trim())
          .filter(Boolean);
      }
    }

    if (url && !uniqueUrls.includes(url)) {
      uniqueUrls.push(url);
    }

    for (const variantUrl of variantUrls) {
      if (variantUrl && !uniqueUrls.includes(variantUrl)) {
        uniqueUrls.push(variantUrl);
      }
    }
  }

  return uniqueUrls;
}

function extractJsonLdScripts(node: any, collected: string[] = []): string[] {
  if (!node) {
    return collected;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      extractJsonLdScripts(child, collected);
    }
    return collected;
  }

  if (typeof node !== 'object') {
    return collected;
  }

  if (
    node.type === 'script' &&
    node.props?.type === 'application/ld+json' &&
    typeof node.props?.dangerouslySetInnerHTML?.__html === 'string'
  ) {
    collected.push(node.props.dangerouslySetInnerHTML.__html);
  }

  if (node.props?.children) {
    extractJsonLdScripts(node.props.children, collected);
  }

  return collected;
}

const techemCategory: Category = {
  id: '12',
  name: 'Otirači',
  slug: 'otiraci',
  description: 'Otirači i ulazni sistemi.',
  image: '/images/categories/otiraci.jpg',
  order: 12,
};

const lvtCategory: Category = {
  id: '6',
  name: 'LVT',
  slug: 'lvt',
  description: 'LVT podovi.',
  image: '/images/collections/kolekcija-c000770-id-inspiration-55.jpg',
  order: 6,
};

const techemBrand: Brand = {
  id: '12',
  name: 'Techem',
  slug: 'techem',
  logo: '/images/brands/techem-logo-en.png',
  description: 'Techem',
  website: 'https://www.techem-wycieraczki.com.pl',
  countryOfOrigin: 'Poljska',
};

const gerflorBrand: Brand = {
  id: '6',
  name: 'Gerflor',
  slug: 'gerflor',
  logo: '/images/brands/gerflor.svg',
  description: 'Gerflor',
  website: 'https://www.gerflor.com',
  countryOfOrigin: 'Francuska',
};

const timbertechPlaceholderBrand: Brand = {
  id: '10',
  name: 'TimberTech',
  slug: 'timbertech',
  logo: '/images/placeholder.svg',
  description: 'TimberTech',
  website: 'https://www.timbertech.com/',
  countryOfOrigin: 'SAD',
};

if (!selectedColorMetadataFixture?.collection || !selectedColorMetadataFixture?.slug) {
  throw new Error('Contract test fixture missing: no LVT color with distinct texture/lifestyle candidates.');
}

if (!bloqSelectedColorFixture?.collection_slug || !bloqSelectedColorFixture?.slug) {
  throw new Error('Contract test fixture missing: no BLOQ color with image-backed selected-color route.');
}

if (!creation30FirstColorSlug) {
  throw new Error('Contract test fixture missing: no first color slug for Creation 30.');
}

if (!foreignCreation30ColorFixture?.slug) {
  throw new Error('Contract test fixture missing: no foreign LVT color slug outside Creation 30.');
}

if (!boldFirstColorSlug) {
  throw new Error('Contract test fixture missing: no first color slug for Tarkett Bold.');
}

if (!boldSecondColorSlug) {
  throw new Error('Contract test fixture missing: no second color slug for Tarkett Bold.');
}

if (!foreignBoldColorSlug) {
  throw new Error('Contract test fixture missing: no foreign vinyl color slug outside Tarkett Bold.');
}

if (!dancefloorFirstColorSlug) {
  throw new Error('Contract test fixture missing: no first color slug for Tarkett Dancefloor.');
}

if (!dancefloorSecondColorSlug) {
  throw new Error('Contract test fixture missing: no second color slug for Tarkett Dancefloor.');
}

if (!foreignSportColorSlug) {
  throw new Error('Contract test fixture missing: no foreign sport color slug outside Tarkett Dancefloor.');
}

if (!gerflorSportForeignColorSlug) {
  throw new Error('Contract test fixture missing: no Gerflor sport foreign color slug.');
}

if (!linoleumFirstColorSlug) {
  throw new Error('Contract test fixture missing: no first color slug for DLW Uni Walton.');
}

const redirectingVariantFixture: Product & { collectionSlug?: string } = {
  id: 'variant-ballerina',
  name: 'Ballerina',
  slug: 'ballerina-41870347',
  sku: 'GER-VARIANT-BALLERINA',
  categoryId: '6',
  brandId: '6',
  shortDescription: 'Dekor za LVT kolekciju.',
  description: 'Dekor za LVT kolekciju.',
  images: [
    {
      id: 'variant-ballerina-img',
      url: '/images/lvt/ballerina.jpg',
      alt: 'Ballerina',
      isPrimary: true,
      order: 0,
    },
  ],
  specs: [
    { key: 'collection', label: 'Kolekcija', value: 'Creation 30' },
  ],
  price: 0,
  priceUnit: 'm²',
  inStock: true,
  featured: false,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-02-01T00:00:00.000Z'),
  collectionSlug: 'gerflor-creation-30',
};

const techemFixture: Product = {
  id: 'techem-clean-rubber',
  name: 'Clean Rubber (gumeni umetak)',
  slug: 'techem-clean-rubber',
  sku: 'TECHEM-CLEAN-RUBBER',
  categoryId: '12',
  brandId: '12',
  shortDescription: 'Otirač sa gumenim gaznim površinama i ispunom za sušenje ugrađenim u aluminijumske profile.',
  description: 'Otirač sa gumenim gaznim površinama i ispunom za sušenje ugrađenim u aluminijumske profile. Zahvaljujući kombinaciji ovih elemenata, otirač lako uklanja blato i sneg sa đonova obuće.',
  images: [
    {
      id: 'techem-clean-rubber-img',
      url: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/otiraci/techem-clean-rubber/01-ryps-mini-scaled.jpg',
      alt: 'Clean Rubber',
      isPrimary: true,
      order: 0,
      variants: {
        thumb: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/otiraci/techem-clean-rubber/01-thumb-ryps-mini-scaled.jpg',
        card: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/otiraci/techem-clean-rubber/01-card-ryps-mini-scaled.jpg',
        hero: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/otiraci/techem-clean-rubber/01-hero-ryps-mini-scaled.jpg',
        og: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/otiraci/techem-clean-rubber/01-og-ryps-mini-scaled.jpg',
      },
    },
  ],
  specs: [
    { key: 'collection', label: 'Kolekcija', value: 'Clean System Standard otirači' },
    { key: '__techem_family', label: '__Techem Family', value: 'Clean System Standard otirači' },
    { key: '__techem_top_category', label: '__Techem Top Category', value: 'Aluminijumski otirači' },
  ],
  documents: [],
  price: 0,
  priceUnit: 'kom',
  inStock: true,
  featured: false,
  createdAt: techemGeneratedAt,
  updatedAt: techemGeneratedAt,
};

describe('SEO contracts', () => {
  beforeEach(() => {
    vi.resetModules();

    repositoryMocks.productFindAll.mockReset();
    repositoryMocks.productFindByCategory.mockReset();
    repositoryMocks.productFindByBrand.mockReset();
    repositoryMocks.productFindBySlug.mockReset();
    repositoryMocks.categoryFindAll.mockReset();
    repositoryMocks.categoryFindById.mockReset();
    repositoryMocks.categoryFindBySlug.mockReset();
    repositoryMocks.brandFindAll.mockReset();
    repositoryMocks.brandFindById.mockReset();
    repositoryMocks.brandFindBySlug.mockReset();
    navigationMocks.redirect.mockClear();
    navigationMocks.notFound.mockClear();

    repositoryMocks.productFindAll.mockResolvedValue([redirectingVariantFixture, techemFixture]);
    repositoryMocks.productFindByCategory.mockResolvedValue([]);
    repositoryMocks.productFindByBrand.mockResolvedValue([]);
    repositoryMocks.productFindBySlug.mockImplementation(async (slug: string) => {
      return [redirectingVariantFixture, techemFixture].find((product) => product.slug === slug) || null;
    });
    repositoryMocks.categoryFindAll.mockResolvedValue([lvtCategory, techemCategory]);
    repositoryMocks.categoryFindById.mockImplementation(async (id: string) => {
      return [lvtCategory, techemCategory].find((category) => category.id === id) || null;
    });
    repositoryMocks.categoryFindBySlug.mockImplementation(async (slug: string) => {
      return [lvtCategory, techemCategory].find((category) => category.slug === slug) || null;
    });
    repositoryMocks.brandFindAll.mockResolvedValue([gerflorBrand, techemBrand]);
    repositoryMocks.brandFindById.mockImplementation(async (id: string) => {
      return [gerflorBrand, techemBrand].find((brand) => brand.id === id) || null;
    });
    repositoryMocks.brandFindBySlug.mockImplementation(async (slug: string) => {
      return [gerflorBrand, techemBrand].find((brand) => brand.slug === slug) || null;
    });
  });

  it('emits canonical PDP hrefs in sitemap instead of redirecting raw slugs', async () => {
    const { default: sitemap } = await import('@/app/sitemap');
    const sitemapEntries = await sitemap();
    const canonicalUrl = `https://www.podovi.online${getCanonicalProductHref(redirectingVariantFixture)}`;
    const rawUrl = `https://www.podovi.online/proizvodi/${redirectingVariantFixture.slug}`;

    expect(sitemapEntries.some((entry) => entry.url === canonicalUrl)).toBe(true);
    expect(sitemapEntries.some((entry) => entry.url === rawUrl)).toBe(false);
  });

  it('uses Techem dataset freshness for Techem product sitemap surface', async () => {
    const { default: sitemap } = await import('@/app/sitemap');
    const sitemapEntries = await sitemap();
    const techemProductUrl = `https://www.podovi.online${getCanonicalProductHref(techemFixture)}`;

    expect(sitemapEntries.find((entry) => entry.url === techemProductUrl)?.lastModified?.toISOString()).toBe(techemGeneratedAt.toISOString());
  });

  it('keeps category detail pages but omits removed hub brand and contact surfaces from the sitemap', async () => {
    const { default: sitemap } = await import('@/app/sitemap');
    const sitemapEntries = await sitemap();
    const removedUrls = [
      'https://www.podovi.online/kategorije',
      'https://www.podovi.online/brendovi',
      'https://www.podovi.online/brendovi/techem',
      'https://www.podovi.online/kontakt',
    ];

    for (const removedUrl of removedUrls) {
      expect(sitemapEntries.some((entry) => entry.url === removedUrl)).toBe(false);
    }

    expect(sitemapEntries.some((entry) => entry.url === 'https://www.podovi.online/kategorije/otiraci')).toBe(true);
  });

  it('keeps Techem product metadata aligned with flat-product SEO copy rules', async () => {
    const { generateMetadata } = await import('@/app/proizvodi/[slug]/page');
    const metadata = await generateMetadata({
      params: { slug: techemFixture.slug },
      searchParams: {},
    } as any);

    const description = String(metadata.description || '');
    const ogDescription = metadata.openGraph?.description;
    const twitterDescription = metadata.twitter?.description;
    const ogImages = (((metadata.openGraph as any)?.images) || []) as Array<any>;
    const twitterImages = (((metadata.twitter as any)?.images) || []) as Array<any>;

    expect(description).toBeTruthy();
    expect(description.toLowerCase()).not.toContain('dostupne boje');
    expect(description.toLowerCase()).not.toContain('dokumentacija');
    expect(ogDescription).toBe(description);
    expect(twitterDescription).toBe(description);
    expect(ogImages.length).toBeGreaterThan(0);
    expect(ogImages[0]).toMatchObject({
      url: techemFixture.images[0].variants?.og,
      alt: techemFixture.images[0].alt,
      width: 1200,
      height: 630,
    });
    expect(new URL(String(ogImages[0].url)).hostname).toBe('nnjmrfwepylrheykalik.supabase.co');
    expect(String(ogImages[0].url)).not.toContain('/images/placeholder');
    expect(twitterImages).toEqual([techemFixture.images[0].variants?.og]);
  });

  it('keeps PDP Product JSON-LD image aligned with shared OG/Twitter metadata image output', async () => {
    (globalThis as any).React = await import('react');
    const { default: ProductPage, generateMetadata } = await import('@/app/proizvodi/[slug]/page');
    const metadata = await generateMetadata({
      params: { slug: techemFixture.slug },
      searchParams: {},
    } as any);
    const page = await ProductPage({
      params: { slug: techemFixture.slug },
      searchParams: {},
    } as any);

    const jsonLdScripts = extractJsonLdScripts(page);
    const jsonLdNodes = jsonLdScripts.flatMap((rawScript) => {
      const parsed = JSON.parse(rawScript);
      return Array.isArray(parsed) ? parsed : [parsed];
    });
    const productSchema = jsonLdNodes.find((node) => node?.['@type'] === 'Product');
    const ogImages = (((metadata.openGraph as any)?.images) || []) as Array<any>;
    const twitterImages = (((metadata.twitter as any)?.images) || []) as Array<any>;

    expect(productSchema).toBeTruthy();
    expect(productSchema.image).toBe(ogImages[0]?.url);
    expect(productSchema.image).toBe(twitterImages[0]);
  });

  it('keeps colored PDP metadata image aligned with the shared selected-color image precedence', async () => {
    const { generateMetadata } = await import('@/app/proizvodi/[slug]/page');
    const metadata = await generateMetadata({
      params: { slug: `gerflor-${selectedColorMetadataFixture.collection}` },
      searchParams: { color: selectedColorMetadataFixture.slug },
    } as any);

    const ogImages = (((metadata.openGraph as any)?.images) || []) as Array<any>;
    const twitterImages = (((metadata.twitter as any)?.images) || []) as Array<any>;
    const expectedUrl = resolveMetadataImageUrl(
      getPrimaryColorImage(selectedColorMetadataFixture)?.url || '',
      'https://www.podovi.online'
    );

    expect(expectedUrl).toBeTruthy();
    expect(ogImages[0]?.url).toBe(expectedUrl);
    expect(twitterImages).toEqual([expectedUrl]);
  });

  it('canonicalizes alias collection metadata URLs when a valid selected color is requested on the alias route', async () => {
    const { generateMetadata } = await import('@/app/proizvodi/[slug]/page');
    const metadata = await generateMetadata({
      params: { slug: 'creation-30' },
      searchParams: { color: 'ballerina-41870347' },
    } as any);

    const expectedUrl = 'https://www.podovi.online/proizvodi/gerflor-creation-30?color=ballerina-41870347';

    expect(metadata.alternates?.canonical).toBe(expectedUrl);
    expect(metadata.openGraph?.url).toBe(expectedUrl);
  });

  it('canonicalizes alias collection metadata URLs when a foreign same-catalog color is requested on the alias route', async () => {
    const { generateMetadata } = await import('@/app/proizvodi/[slug]/page');
    const metadata = await generateMetadata({
      params: { slug: 'creation-30' },
      searchParams: { color: foreignCreation30ColorFixture.slug },
    } as any);

    const expectedUrl = `https://www.podovi.online/proizvodi/gerflor-creation-30?color=${creation30FirstColorSlug}`;

    expect(metadata.alternates?.canonical).toBe(expectedUrl);
    expect(metadata.openGraph?.url).toBe(expectedUrl);
  });

  it('canonicalizes mixed-brand vinyl alias metadata URLs when a foreign same-category color is requested', async () => {
    const { generateMetadata } = await import('@/app/proizvodi/[slug]/page');
    const metadata = await generateMetadata({
      params: { slug: 'bold' },
      searchParams: { color: foreignBoldColorSlug },
    } as any);

    const expectedUrl = `https://www.podovi.online/proizvodi/tarkett-bold?color=${boldFirstColorSlug}`;

    expect(metadata.alternates?.canonical).toBe(expectedUrl);
    expect(metadata.openGraph?.url).toBe(expectedUrl);
  });

  it('canonicalizes direct-color vinyl metadata URLs back to the parent collection route when a foreign same-category color is requested', async () => {
    const { generateMetadata } = await import('@/app/proizvodi/[slug]/page');
    const metadata = await generateMetadata({
      params: { slug: boldSecondColorSlug },
      searchParams: { color: foreignBoldColorSlug },
    } as any);

    const expectedUrl = `https://www.podovi.online/proizvodi/tarkett-bold?color=${boldSecondColorSlug}`;

    expect(metadata.alternates?.canonical).toBe(expectedUrl);
    expect(metadata.openGraph?.url).toBe(expectedUrl);
  });

  it('redirects mixed-brand vinyl alias routes with foreign same-category colors directly to the final canonical URL', async () => {
    const { default: ProductPage } = await import('@/app/proizvodi/[slug]/page');

    await expect(ProductPage({
      params: { slug: 'bold' },
      searchParams: { color: foreignBoldColorSlug },
    } as any)).rejects.toThrow(`NEXT_REDIRECT:/proizvodi/tarkett-bold?color=${boldFirstColorSlug}`);

    expect(navigationMocks.redirect).toHaveBeenCalledTimes(1);
    expect(navigationMocks.redirect).toHaveBeenCalledWith(`/proizvodi/tarkett-bold?color=${boldFirstColorSlug}`);
  });

  it('redirects direct-color vinyl routes with foreign same-category colors straight to the parent collection PDP', async () => {
    const { default: ProductPage } = await import('@/app/proizvodi/[slug]/page');

    await expect(ProductPage({
      params: { slug: boldSecondColorSlug },
      searchParams: { color: foreignBoldColorSlug },
    } as any)).rejects.toThrow(`NEXT_REDIRECT:/proizvodi/tarkett-bold?color=${boldSecondColorSlug}`);

    expect(navigationMocks.redirect).toHaveBeenCalledTimes(1);
    expect(navigationMocks.redirect).toHaveBeenCalledWith(`/proizvodi/tarkett-bold?color=${boldSecondColorSlug}`);
  });

  it('canonicalizes direct-color sport metadata URLs back to the parent collection route when a foreign same-category color is requested', async () => {
    const { generateMetadata } = await import('@/app/proizvodi/[slug]/page');
    const metadata = await generateMetadata({
      params: { slug: dancefloorSecondColorSlug },
      searchParams: { color: foreignSportColorSlug },
    } as any);

    const expectedUrl = `https://www.podovi.online/proizvodi/tarkett-dancefloor?color=${dancefloorSecondColorSlug}`;

    expect(metadata.alternates?.canonical).toBe(expectedUrl);
    expect(metadata.openGraph?.url).toBe(expectedUrl);
  });

  it('redirects direct-color sport routes with foreign same-category colors straight to the parent collection PDP', async () => {
    const { default: ProductPage } = await import('@/app/proizvodi/[slug]/page');

    await expect(ProductPage({
      params: { slug: dancefloorSecondColorSlug },
      searchParams: { color: foreignSportColorSlug },
    } as any)).rejects.toThrow(`NEXT_REDIRECT:/proizvodi/tarkett-dancefloor?color=${dancefloorSecondColorSlug}`);

    expect(navigationMocks.redirect).toHaveBeenCalledTimes(1);
    expect(navigationMocks.redirect).toHaveBeenCalledWith(`/proizvodi/tarkett-dancefloor?color=${dancefloorSecondColorSlug}`);
  });

  it('canonicalizes direct-color sport metadata URLs when the foreign same-category color comes from the Gerflor sport dataset', async () => {
    const { generateMetadata } = await import('@/app/proizvodi/[slug]/page');
    const metadata = await generateMetadata({
      params: { slug: dancefloorSecondColorSlug },
      searchParams: { color: gerflorSportForeignColorSlug },
    } as any);

    const expectedUrl = `https://www.podovi.online/proizvodi/tarkett-dancefloor?color=${dancefloorSecondColorSlug}`;

    expect(metadata.alternates?.canonical).toBe(expectedUrl);
    expect(metadata.openGraph?.url).toBe(expectedUrl);
  });

  it('redirects direct-color sport routes to the parent collection PDP when the foreign same-category color comes from the Gerflor sport dataset', async () => {
    const { default: ProductPage } = await import('@/app/proizvodi/[slug]/page');

    await expect(ProductPage({
      params: { slug: dancefloorSecondColorSlug },
      searchParams: { color: gerflorSportForeignColorSlug },
    } as any)).rejects.toThrow(`NEXT_REDIRECT:/proizvodi/tarkett-dancefloor?color=${dancefloorSecondColorSlug}`);

    expect(navigationMocks.redirect).toHaveBeenCalledTimes(1);
    expect(navigationMocks.redirect).toHaveBeenCalledWith(`/proizvodi/tarkett-dancefloor?color=${dancefloorSecondColorSlug}`);
  });

  it('canonicalizes legacy code-only vinyl direct-color routes to the parent collection route with the generated color slug', async () => {
    const { generateMetadata } = await import('@/app/proizvodi/[slug]/page');
    const metadata = await generateMetadata({
      params: { slug: '0319' },
      searchParams: {},
    } as any);

    const expectedUrl = 'https://www.podovi.online/proizvodi/gerflor-mipolam-accord?color=mipolam-accord-0319-toba';

    expect(metadata.alternates?.canonical).toBe(expectedUrl);
    expect(metadata.openGraph?.url).toBe(expectedUrl);
  });

  it('redirects legacy code-only vinyl direct-color routes to the parent collection route with the generated color slug', async () => {
    const { default: ProductPage } = await import('@/app/proizvodi/[slug]/page');

    await expect(ProductPage({
      params: { slug: '0319' },
      searchParams: {},
    } as any)).rejects.toThrow('NEXT_REDIRECT:/proizvodi/gerflor-mipolam-accord?color=mipolam-accord-0319-toba');

    expect(navigationMocks.redirect).toHaveBeenCalledTimes(1);
    expect(navigationMocks.redirect).toHaveBeenCalledWith('/proizvodi/gerflor-mipolam-accord?color=mipolam-accord-0319-toba');
  });

  it('canonicalizes legacy code-only sport direct-color routes to the parent collection route with the generated color slug', async () => {
    const { generateMetadata } = await import('@/app/proizvodi/[slug]/page');
    const metadata = await generateMetadata({
      params: { slug: '1123' },
      searchParams: {},
    } as any);

    const expectedUrl = 'https://www.podovi.online/proizvodi/gerflor-dlw-colorette-sport?color=dlw-colorette-sport-1123-poppy-blue';

    expect(metadata.alternates?.canonical).toBe(expectedUrl);
    expect(metadata.openGraph?.url).toBe(expectedUrl);
  });

  it('redirects legacy code-only sport direct-color routes to the parent collection route with the generated color slug', async () => {
    const { default: ProductPage } = await import('@/app/proizvodi/[slug]/page');

    await expect(ProductPage({
      params: { slug: '1123' },
      searchParams: {},
    } as any)).rejects.toThrow('NEXT_REDIRECT:/proizvodi/gerflor-dlw-colorette-sport?color=dlw-colorette-sport-1123-poppy-blue');

    expect(navigationMocks.redirect).toHaveBeenCalledTimes(1);
    expect(navigationMocks.redirect).toHaveBeenCalledWith('/proizvodi/gerflor-dlw-colorette-sport?color=dlw-colorette-sport-1123-poppy-blue');
  });

  it('redirects linoleum alias routes with invalid colors directly to the final canonical URL', async () => {
    const { default: ProductPage } = await import('@/app/proizvodi/[slug]/page');

    await expect(ProductPage({
      params: { slug: 'gerflor-dlw-uni-walton' },
      searchParams: { color: 'bogus-color' },
    } as any)).rejects.toThrow(`NEXT_REDIRECT:/proizvodi/dlw-uni-walton?color=${linoleumFirstColorSlug}`);

    expect(navigationMocks.redirect).toHaveBeenCalledTimes(1);
    expect(navigationMocks.redirect).toHaveBeenCalledWith(`/proizvodi/dlw-uni-walton?color=${linoleumFirstColorSlug}`);
  });

  it('keeps BLOQ colored PDP metadata image aligned with the selected tile image instead of the collection cover', async () => {
    const { generateMetadata } = await import('@/app/proizvodi/[slug]/page');
    const metadata = await generateMetadata({
      params: { slug: bloqSelectedColorFixture.collection_slug },
      searchParams: { color: bloqSelectedColorFixture.slug },
    } as any);

    const ogImages = (((metadata.openGraph as any)?.images) || []) as Array<any>;
    const twitterImages = (((metadata.twitter as any)?.images) || []) as Array<any>;
    const expectedUrl = resolveMetadataImageUrl(
      getPrimaryColorImage(bloqSelectedColorFixture)?.url || '',
      'https://www.podovi.online'
    );

    expect(expectedUrl).toBeTruthy();
    expect(ogImages[0]?.url).toBe(expectedUrl);
    expect(twitterImages).toEqual([expectedUrl]);
  });

  it('keeps Techem mirrored metadata image candidates on first-party controlled hosts', () => {
    const techemProducts = ((techemData as any).products || []) as Array<Record<string, any>>;

    for (const product of techemProducts) {
      const urls = extractTechemMetadataImageUrls(product);
      expect(urls.length).toBeGreaterThan(0);

      for (const imageUrl of urls) {
        const parsedUrl = new URL(imageUrl);
        expect(parsedUrl.protocol).toBe('https:');
        expect(techemOwnedImageHosts.has(parsedUrl.hostname)).toBe(true);
        expect(techemSupplierImageHosts.has(parsedUrl.hostname)).toBe(false);
        expect(parsedUrl.pathname).toMatch(/\.(avif|gif|jpe?g|png|svg|webp)$/i);
      }
    }
  });

  it('omits non-https product schema images through the shared metadata normalizer', async () => {
    const { generateProductSchema } = await import('@/lib/seo/structured-data');
    const schema = generateProductSchema(techemFixture, techemBrand, techemCategory, {
      image: 'http://example.com/unsafe.jpg',
      url: 'https://www.podovi.online/proizvodi/techem-clean-rubber',
      baseUrl: 'https://www.podovi.online',
    });

    expect(schema.image).toBeUndefined();
  });
});
