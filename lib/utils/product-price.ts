import type { Product } from '@/types';

export type ProductPriceSummary = Pick<Product, 'price' | 'priceUnit' | 'priceFrom' | 'priceIncludesVat' | 'priceValidUntil'>;

const belgradeDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Belgrade', year: 'numeric', month: '2-digit', day: '2-digit' });

export function isProductPriceExpired(priceValidUntil?: string, now = new Date()): boolean {
  if (!priceValidUntil) return false;
  const parts = Object.fromEntries(belgradeDate.formatToParts(now).map(part => [part.type, part.value]));
  return priceValidUntil < `${parts.year}-${parts.month}-${parts.day}`;
}

/** Explicit undefined values also clear outdated prices in saved browser snapshots. */
export function getProductPriceSummary(product: ProductPriceSummary): ProductPriceSummary {
  const current: ProductPriceSummary = isProductPriceExpired(product.priceValidUntil) ? {} : product;
  return {
    price: current.price,
    priceUnit: current.priceUnit,
    priceFrom: current.priceFrom,
    priceIncludesVat: current.priceIncludesVat,
    priceValidUntil: current.priceValidUntil,
  };
}

export function formatProductPrice(product: ProductPriceSummary): string {
  if (typeof product.price !== 'number' || !Number.isFinite(product.price) || product.price <= 0 || isProductPriceExpired(product.priceValidUntil)) return 'Cena na upit';
  const amount = product.price.toLocaleString('sr-RS', { maximumFractionDigits: 2 });
  const unit = product.priceUnit ? `/${product.priceUnit}` : '';
  const vat = product.priceIncludesVat === true ? ' · sa PDV-om' : product.priceIncludesVat === false ? ' · bez PDV-a' : '';
  return `${product.priceFrom ? 'od ' : ''}${amount} RSD${unit}${vat}`;
}
