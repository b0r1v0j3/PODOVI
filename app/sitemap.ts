import { MetadataRoute } from 'next';
import { productRepository } from '@/lib/repositories/product-repository';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
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
  const brandLastModifiedMap = new Map<string, Date>();
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

    const existingCategoryLastModified = categoryLastModifiedMap.get(product.categoryId);
    const existingBrandLastModified = brandLastModifiedMap.get(product.brandId);
    const nextCategoryLastModified = getNewestDate(existingCategoryLastModified, lastModified);
    const nextBrandLastModified = getNewestDate(existingBrandLastModified, lastModified);

    if (nextCategoryLastModified) {
      categoryLastModifiedMap.set(product.categoryId, nextCategoryLastModified);
    }

    if (nextBrandLastModified) {
      brandLastModifiedMap.set(product.brandId, nextBrandLastModified);
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
      url: `${baseUrl}/kategorije`,
      lastModified: sharedCatalogLastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/brendovi`,
      lastModified: sharedCatalogLastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kontakt`,
      lastModified: sharedCatalogLastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/upiti`,
      lastModified: sharedCatalogLastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Category pages
  const categories = await categoryRepository.findAll();
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/kategorije/${category.slug}`,
    lastModified:
      getNewestDate(
        categoryLastModifiedMap.get(category.id),
        category.id === '12' ? techemLastModified : null
      ) || sharedCatalogLastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Brand pages
  const brands = await brandRepository.findAll();
  const brandPages: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${baseUrl}/brendovi/${brand.slug}`,
    lastModified:
      getNewestDate(
        brandLastModifiedMap.get(brand.id),
        brand.id === '12' ? techemLastModified : null
      ) || sharedCatalogLastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...brandPages, ...productPages];
}
