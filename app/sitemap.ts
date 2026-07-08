import { MetadataRoute } from 'next';
import { productRepository } from '@/lib/repositories/product-repository';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { SITE_URL } from '@/lib/seo/site-config';
import { getTechemDatasetGeneratedAt } from '@/lib/utils/productDataLoader';
import { getCanonicalProductHref, ProductWithCollectionSlug } from '@/lib/utils/product-routes';

function getNewestDate(...values: Array<Date | null | undefined>) {
  const validDates = values.filter((value): value is Date => Boolean(value && !Number.isNaN(value.getTime())));
  if (validDates.length === 0) {
    return null;
  }

  return new Date(Math.max(...validDates.map((value) => value.getTime())));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
  const techemLastModified = getTechemDatasetGeneratedAt();
  const products = await productRepository.findAll();

  const categoryLastModifiedMap = new Map<string, Date>();
  const seenProductUrls = new Set<string>();

  const productPages: MetadataRoute.Sitemap = products.reduce<MetadataRoute.Sitemap>((pages, product) => {
    const canonicalHref = getCanonicalProductHref(product as ProductWithCollectionSlug);
    const canonicalUrl = `${baseUrl}${canonicalHref}`;
    if (seenProductUrls.has(canonicalUrl)) {
      return pages;
    }

    seenProductUrls.add(canonicalUrl);

    const lastModified =
      product.categoryId === '12' && techemLastModified
        ? techemLastModified
        : product.updatedAt;

    const nextCategoryLastModified = getNewestDate(
      categoryLastModifiedMap.get(product.categoryId),
      lastModified
    );
    if (nextCategoryLastModified) {
      categoryLastModifiedMap.set(product.categoryId, nextCategoryLastModified);
    }

    pages.push({
      url: canonicalUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    });

    return pages;
  }, []);

  const sharedCatalogLastModified = getNewestDate(
    ...productPages.map((page) => page.lastModified as Date | undefined),
    techemLastModified
  ) || new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: sharedCatalogLastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/upiti`,
      lastModified: sharedCatalogLastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/parket/essence`,
      lastModified: sharedCatalogLastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // /kategorije/* strane su obrisane (odluka vlasnika 08.07.2026) — katalog živi
  // isključivo na početnoj, pa sitemap više ne emituje kategorijske URL-ove.
  return [...staticPages, ...productPages];
}
