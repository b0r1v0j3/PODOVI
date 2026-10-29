import { Product, Brand, Category } from '@/types';
import { SITE_URL } from './site-config';
import { getCanonicalProductHref } from '@/lib/utils/product-routes';
import { resolveMetadataImageUrl } from '@/lib/utils/product-images';

export function generateProductSchema(
  product: Product,
  brand: Brand | null,
  category: Category | null,
  options: {
    url?: string;
    image?: string | null;
    baseUrl?: string;
  } = {}
) {
  const normalizedImage = options.image
    ? resolveMetadataImageUrl(options.image, options.baseUrl || SITE_URL)
    : null;
  const url = options.url || `${SITE_URL}${getCanonicalProductHref(product)}`;
  const offer = (price: number, unit: string | undefined, sku?: string) => ({
    '@type': 'Offer',
    price,
    priceCurrency: 'RSD',
    sku,
    url,
    priceValidUntil: product.priceValidUntil,
    availability: product.availability === 'on_request' || product.slug === 'tarkett-iq-granit-sd'
      ? undefined
      : product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price,
      priceCurrency: 'RSD',
      unitText: unit,
      valueAddedTaxIncluded: product.priceIncludesVat,
    },
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.shortDescription || '',
    image: normalizedImage || undefined,
    url,
    sku: product.sku,
    brand: brand ? {
      '@type': 'Brand',
      name: brand.name,
    } : undefined,
    category: category?.name,
    offers: typeof product.price === 'number' && Number.isFinite(product.price) && product.price > 0
      ? product.priceOptions?.length
        ? product.priceOptions.map(option => offer(option.price, `pakovanje (${option.packagingLabel})`, option.manufacturerSku))
        : offer(product.price, product.priceUnit)
      : undefined,
    aggregateRating: product.featured ? {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
    } : undefined,
  };
}

export function generateCollectionPageSchema(params: {
  name: string;
  description?: string;
  url: string;
  image?: string | null;
  about?: Record<string, unknown>;
  baseUrl?: string;
}) {
  const normalizedImage = params.image
    ? resolveMetadataImageUrl(params.image, params.baseUrl || SITE_URL)
    : null;

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: params.name,
    description: params.description,
    url: params.url,
    inLanguage: 'sr-RS',
    image: normalizedImage || undefined,
    about: params.about,
  };
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Podovi DOO',
    description: 'Distributer podnih obloga, lajsni, otirača i pratećih sistema za stambene, poslovne i tehničke prostore u Srbiji',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    email: 'podovidoo@gmail.com',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+381-21-2982-444',
      contactType: 'customer service',
      areaServed: 'RS',
      availableLanguage: 'Serbian',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Hajduk Veljkova 11',
      addressLocality: 'Novi Sad',
      postalCode: '21000',
      addressCountry: 'RS',
    },
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Podovi.online',
    description: 'Katalog podnih obloga, lajsni, otirača i pratećih sistema',
    url: SITE_URL,
  };
}

export function generateProductListSchema(products: Product[], category?: Category) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category ? `${category.name} - Podovi` : 'Asortiman - Podovi',
    description: category?.description,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}${getCanonicalProductHref(product)}`,
      name: product.name,
    })),
  };
}
