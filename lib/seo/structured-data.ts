import { Product, Brand, Category } from '@/types';

export function generateProductSchema(product: Product, brand: Brand | null, category: Category | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: brand ? {
      '@type': 'Brand',
      name: brand.name,
    } : undefined,
    category: category?.name,
    offers: product.price ? {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'RSD',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: product.price,
        priceCurrency: 'RSD',
        unitText: product.priceUnit,
      },
    } : undefined,
    aggregateRating: product.featured ? {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
    } : undefined,
  };
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Podovi DOO',
    description: 'Vodeći uvoznik i distributer kvalitetnih podnih obloga u Srbiji',
    url: 'https://podovi.online',
    logo: 'https://podovi.online/logo.png',
    email: 'prodaja@podovi.online',
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
    url: 'https://podovi.online',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://podovi.online/kategorije?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateProductListSchema(products: Product[], category?: Category) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category ? `${category.name} - Podovi` : 'Proizvodi - Podovi',
    description: category?.description,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://podovi.online/proizvodi/${product.slug}`,
      name: product.name,
    })),
  };
}
