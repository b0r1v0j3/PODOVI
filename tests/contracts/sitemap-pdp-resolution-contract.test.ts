// Sitemap → PDP: URL iz sitemap-a mora da se renderuje, a ne da završi na 404.
// Regresija 16.05–25.11.2026: TimberTech deking URL-ovi išli su 307 → /proizvodi/timbertech-… → 404,
// jer je normalizeCollectionSlugForProductRoute() dodavao `timbertech-` prefiks koji resolver ne poznaje.
// Koristi prave mock-mode repozitorijume (USE_MOCK_DATA iz setup.ts), pa proverava ceo put sitemap → resolver → PDP.
import tisDekingProducts from '@/public/data/tis_deking_products.json';
import { alpodDekingCollections } from '@/lib/product-page/color-helpers';
import { getAllDekingProducts } from '@/lib/utils/productDataLoader';
import { getCanonicalCollectionAliasHref, getCanonicalProductHref } from '@/lib/utils/product-routes';
import { describe, expect, it, vi } from 'vitest';

const SITE_URL = 'https://www.podovi.online';

const componentStub = vi.hoisted(() => () => ({ default: () => null }));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  // React 18 klijentski build nema `cache`; PDP ga koristi samo za deljenje čitanja unutar jednog zahteva.
  return { ...actual, cache: <T extends (...args: any[]) => any>(fn: T) => fn };
});
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation');
  return {
    ...actual,
    redirect: (url: string) => {
      const error = new Error(`NEXT_REDIRECT:${url}`) as Error & { digest?: string };
      error.digest = `NEXT_REDIRECT;replace;${url}`;
      throw error;
    },
    notFound: () => {
      throw new Error('NEXT_NOT_FOUND');
    },
  };
});
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

// Prati PDP redirect-e kao pregledač: vraća sve posećene putanje i da li je poslednja renderovana ili 404.
async function followPdp(path: string) {
  (globalThis as any).React = await import('react');
  const { default: ProductPage } = await import('@/app/proizvodi/[slug]/page');
  const hops = [path];
  for (let hop = 0; hop < 6; hop++) {
    const url = new URL(hops[hops.length - 1], SITE_URL);
    const slug = decodeURIComponent(url.pathname.replace(/^\/proizvodi\//, ''));
    try {
      await ProductPage({ params: { slug }, searchParams: Object.fromEntries(url.searchParams) } as any);
      return { outcome: 'render', hops };
    } catch (error) {
      const message = String((error as Error)?.message || error);
      if (!message.startsWith('NEXT_REDIRECT:')) {
        return { outcome: message === 'NEXT_NOT_FOUND' ? 'notFound' : message, hops };
      }
      hops.push(message.slice('NEXT_REDIRECT:'.length));
    }
  }
  return { outcome: 'redirect-loop', hops };
}

describe('sitemap → PDP rezolucija', () => {
  const timbertechProducts = getAllDekingProducts().filter((product) => product.brandId === '10');

  it('TimberTech deking je flat katalog: kanonski href je sopstveni slug, bez alias prefiksa', () => {
    expect(timbertechProducts).toHaveLength((tisDekingProducts as unknown[]).length);

    for (const product of timbertechProducts) {
      expect(getCanonicalProductHref(product)).toBe(`/proizvodi/${product.slug}`);
      expect(getCanonicalCollectionAliasHref(product.slug, product)).toBeNull();
    }
  });

  it('svaki deking URL iz sitemap-a se renderuje; TimberTech bez redirecta i sa canonical-om = sitemap URL', async () => {
    const { default: sitemap } = await import('@/app/sitemap');
    const { generateMetadata } = await import('@/app/proizvodi/[slug]/page');
    const { productRepository } = await import('@/lib/repositories/product-repository');
    const sitemapUrls = new Set((await sitemap()).map((entry) => entry.url));
    const dekingProducts = (await productRepository.findAll()).filter((product) => product.categoryId === '5');
    const dekingHrefs = Array.from(new Set(dekingProducts.map((product) => getCanonicalProductHref(product))));

    expect(dekingHrefs.length).toBeGreaterThanOrEqual(timbertechProducts.length);
    for (const href of dekingHrefs) {
      expect(sitemapUrls.has(`${SITE_URL}${href}`), href).toBe(true);
      expect(await followPdp(href), href).toMatchObject({ outcome: 'render' });
    }

    for (const product of timbertechProducts) {
      const path = `/proizvodi/${product.slug}`;
      expect(await followPdp(path)).toEqual({ outcome: 'render', hops: [path] });

      const metadata = await generateMetadata({ params: { slug: product.slug }, searchParams: {} } as any);
      expect(metadata.alternates?.canonical).toBe(`${SITE_URL}${path}`);
      expect((metadata.openGraph as any)?.url).toBe(`${SITE_URL}${path}`);
    }
  }, 120_000);

  it('TimberTech nema boje: tuđi ?color= (Podovi deking dekor) se skida jednim redirectom, canonical ostaje bez query-ja', async () => {
    const { generateMetadata } = await import('@/app/proizvodi/[slug]/page');
    const foreignColorSlug = (alpodDekingCollections as any[])
      .flatMap((collection) => collection.colors || [])
      .find((color: any) => color.slug)?.slug as string;
    expect(foreignColorSlug).toBeTruthy();

    for (const product of timbertechProducts) {
      const path = `/proizvodi/${product.slug}`;
      const withForeignColor = `${path}?color=${encodeURIComponent(foreignColorSlug)}`;
      expect(await followPdp(withForeignColor)).toEqual({ outcome: 'render', hops: [withForeignColor, path] });

      const metadata = await generateMetadata({ params: { slug: product.slug }, searchParams: { color: foreignColorSlug } } as any);
      expect(metadata.alternates?.canonical).toBe(`${SITE_URL}${path}`);
    }
  }, 120_000);
});
