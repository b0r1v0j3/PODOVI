import { createHash } from 'node:crypto';
import { CommerceError } from './errors';
import type { CartLineInput, CommerceQuote, CommerceQuoteLine } from './types';

export interface ResolvedCommerceLine {
  name: string;
  sku: string;
  image: string;
  url: string;
  unit: string;
  price?: number | null;
  coveragePerPackage?: number;
  identity?: string; // canonical slug of the resolved article, shared by every cart key that reaches it
}

export function customerDiscount(override: number | null | undefined): number {
  const discount = override ?? 10;
  if (!Number.isInteger(discount) || discount < 0 || discount > 100) {
    throw new CommerceError('Rabat nije ispravno podešen. Obratite se Podovi prodaji.', 503, 'INVALID_DISCOUNT');
  }
  return discount;
}

export function validateCartItems(value: unknown): CartLineInput[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) {
    throw new CommerceError('Korpa mora da sadrži od 1 do 50 stavki.');
  }
  const keys = new Set<string>();
  return value.map((raw) => {
    if (!raw || typeof raw !== 'object') throw new CommerceError('Stavka korpe nije ispravna.');
    const { productSlug, variantSlug, quantity } = raw;
    if (typeof productSlug !== 'string' || !/^[a-z0-9][a-z0-9-]{0,199}$/.test(productSlug) ||
      (variantSlug !== undefined && (typeof variantSlug !== 'string' || !/^[a-z0-9][a-z0-9-]{0,199}$/.test(variantSlug)))) {
      throw new CommerceError('Proizvod ili varijanta nisu ispravni.');
    }
    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0 || quantity > 100000 ||
      Math.abs(quantity * 1000 - Math.round(quantity * 1000)) > 0.000001) {
      throw new CommerceError('Količina mora biti veća od nule, do 100.000, sa najviše tri decimale.');
    }
    const key = `${productSlug}:${variantSlug || ''}`;
    if (keys.has(key)) throw new CommerceError('Spojite ponovljene stavke u korpi.');
    keys.add(key);
    return { productSlug, ...(variantSlug ? { variantSlug } : {}), quantity };
  });
}

export function payloadHash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export async function buildQuote(
  inputs: CartLineInput[],
  discountPercent: number,
  resolve: (item: CartLineInput) => Promise<ResolvedCommerceLine>,
): Promise<CommerceQuote> {
  customerDiscount(discountPercent);
  const items = validateCartItems(inputs);
  const lines: CommerceQuoteLine[] = [];
  const seen = new Set<string>();
  // Serial on purpose: the first invalid line fails fast, and resolveCommerceLine memoizes lookups.
  for (const item of items) {
    const key = `${item.productSlug}:${item.variantSlug || ''}`;
    try {
      const product = await resolve(item);
      if (product.identity) {
        if (seen.has(product.identity)) throw new CommerceError(`„${product.name}” je u korpi više puta — uklonite jednu stavku.`, 400, 'DUPLICATE_ITEM');
        seen.add(product.identity);
      }
      let quantity = item.quantity;
      if (!/^(m²|m2|m|ml|kg|l)$/i.test(product.unit) && !Number.isInteger(quantity)) {
        throw new CommerceError(`Za „${product.name}” unesite ceo broj jedinica (${product.unit}).`);
      }
      if ((product.unit === 'm²' || product.unit === 'm2') && product.coveragePerPackage) {
        const coverage = Math.round(product.coveragePerPackage * 1000);
        if (!Number.isSafeInteger(coverage) || coverage <= 0) throw new CommerceError('Pakovanje proizvoda nije ispravno podešeno.', 503);
        quantity = Math.ceil(Math.round(quantity * 1000) / coverage) * coverage / 1000;
        if (quantity > 100000) throw new CommerceError('Količina posle zaokruživanja pakovanja prelazi dozvoljenu vrednost.');
      }
      const price = product.price;
      if (price != null && (!Number.isFinite(price) || price < 0)) {
        throw new CommerceError('Cena proizvoda trenutno nije dostupna.', 503, 'INVALID_CATALOG_PRICE');
      }
      const listUnitPriceMinor = price && price > 0 ? Math.round(price * 100) : null;
      const unitPriceMinor = listUnitPriceMinor === null ? null : Math.round(listUnitPriceMinor * (100 - discountPercent) / 100);
      const lineTotalMinor = unitPriceMinor === null ? null : Math.round(unitPriceMinor * Math.round(quantity * 1000) / 1000);
      if ([listUnitPriceMinor, unitPriceMinor, lineTotalMinor].some((amount) => amount !== null && !Number.isSafeInteger(amount))) {
        throw new CommerceError('Iznos korpe prelazi dozvoljenu vrednost.');
      }
      lines.push({ ...item, quantity, key,
        name: product.name, sku: product.sku, image: product.image, url: product.url, unit: product.unit,
        listUnitPriceMinor, discountPercent, unitPriceMinor, lineTotalMinor });
    } catch (error) {
      // Lets the cart mark the one line to fix (same format as the client's cartLineKey). Temporary 5xx stay cart-level so the retry remains.
      if (error instanceof CommerceError && error.status < 500) error.lineKey ??= key;
      throw error;
    }
  }
  const knownTotalMinor = lines.reduce((sum, line) => sum + (line.lineTotalMinor ?? 0), 0);
  if (!Number.isSafeInteger(knownTotalMinor)) throw new CommerceError('Iznos korpe prelazi dozvoljenu vrednost.');
  const quote = { lines, discountPercent, knownTotalMinor, hasUnpricedItems: lines.some((line) => line.lineTotalMinor === null),
    currency: 'RSD' as const, requiresConfirmation: true as const };
  // Display fields (name/image/url) stay out of the key so asset or copy deploys don't force a re-submit.
  const commercial = { discountPercent, knownTotalMinor, currency: quote.currency, lines: lines.map((line) =>
    [line.productSlug, line.variantSlug ?? null, line.quantity, line.sku, line.unit, line.listUnitPriceMinor, line.unitPriceMinor, line.lineTotalMinor]) };
  return { ...quote, quoteKey: payloadHash(commercial) };
}
