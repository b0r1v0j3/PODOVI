import { Product } from '@/types';

export const COLLECTION_SKU_PREFIXES = [
  'GER-',
  'TARKETT-',
  'PODOVI-COLLECTION-',
  'WOLFLOR-VINYL-',
  'LINOLEUM-',
  'LVT-',
  'VINIL-',
  'PARKET-',
  'LAM-',
  'BLOQ-',
  'DESSO-',
  'DEKING-',
  'TIMBERTECH-',
  'GRASS-',
  'PRIBOR-',
  'SCHONOX-',
  'ESD-',
  'IND-',
  'SPORT-',
  'TARKETT-LAJSNE-',
  'GERFLOR-LAJSNE-',
  'ROMUS-',
  'TECHEM-',
] as const;

export function hasCollectionSku(product: Product): boolean {
  return COLLECTION_SKU_PREFIXES.some((prefix) => product.sku?.startsWith(prefix));
}

/** Homepage cards/filters never read SCHÖNOX documents, long-form sections or source provenance; keep them out of the client payload. */
export function toHomepageListingProduct(product: Product): Product {
  if (!product.sku?.startsWith('SCHONOX-')) return product;
  const { documents, detailsSections, externalLink, source, ...card } = product as Product & { source?: unknown };
  return card;
}
