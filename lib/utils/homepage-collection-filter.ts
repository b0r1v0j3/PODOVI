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
  'ESD-',
  'IND-',
  'SPORT-',
  'TARKETT-LAJSNE-',
  'ROMUS-',
  'TECHEM-',
] as const;

export function hasCollectionSku(product: Product): boolean {
  return COLLECTION_SKU_PREFIXES.some((prefix) => product.sku?.startsWith(prefix));
}
