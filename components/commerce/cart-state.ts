import type { CartItemInput } from '@/lib/commerce/types';

export const CART_STORAGE_KEY = 'podovi_cart_v1';
export const MAX_CART_LINES = 50;
export const MAX_QUANTITY = 100000;

const validSlug = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,199}$/.test(value);

export function isValidQuantity(value: number) {
  return Number.isFinite(value) && value > 0 && value <= MAX_QUANTITY &&
    Math.abs(value * 1000 - Math.round(value * 1000)) <= 0.000001;
}

export function cartLineKey(item: Pick<CartItemInput, 'productSlug' | 'variantSlug'>) {
  return `${item.productSlug}:${item.variantSlug || ''}`;
}

export function parseStoredCart(raw: string | null): CartItemInput[] {
  if (!raw || raw.length > 100000) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const items: CartItemInput[] = [];
    const keys = new Set<string>();
    for (const entry of value.slice(0, MAX_CART_LINES)) {
      if (!entry || typeof entry !== 'object' || !validSlug(entry.productSlug) ||
        (entry.variantSlug !== undefined && !validSlug(entry.variantSlug)) ||
        typeof entry.quantity !== 'number' || !isValidQuantity(entry.quantity)) continue;
      const item: CartItemInput = {
        productSlug: entry.productSlug,
        ...(entry.variantSlug ? { variantSlug: entry.variantSlug } : {}),
        quantity: entry.quantity,
      };
      if (!keys.has(cartLineKey(item))) items.push(item);
      keys.add(cartLineKey(item));
    }
    return items;
  } catch {
    return [];
  }
}

export function addCartItem(items: CartItemInput[], item: CartItemInput): CartItemInput[] {
  const cleaned = parseStoredCart(JSON.stringify([item]))[0];
  if (!cleaned) throw new Error('Proverite proizvod i količinu (najviše tri decimale).');
  const existing = items.find((entry) => cartLineKey(entry) === cartLineKey(cleaned));
  if (!existing && items.length >= MAX_CART_LINES) throw new Error('Korpa može sadržati najviše 50 različitih stavki.');
  if (!existing) return [...items, cleaned];
  const quantity = Math.round((existing.quantity + cleaned.quantity) * 1000) / 1000;
  if (!isValidQuantity(quantity)) throw new Error('Ukupna količina ove stavke je prevelika.');
  return items.map((entry) => entry === existing ? { ...entry, quantity } : entry);
}

export function selectedCartItem(productSlug: string, variantSlug: string | null | undefined, requiresVariant: boolean, quantity: number): CartItemInput | null {
  if (requiresVariant && !variantSlug) return null;
  return parseStoredCart(JSON.stringify([{ productSlug, ...(requiresVariant && variantSlug ? { variantSlug } : {}), quantity }]))[0] || null;
}

export function subtractOrderedItems(items: CartItemInput[], submitted: CartItemInput[]) {
  return items.map((item) => {
    const ordered = submitted.find((entry) => cartLineKey(entry) === cartLineKey(item));
    return ordered ? { ...item, quantity: Math.round((item.quantity - ordered.quantity) * 1000) / 1000 } : item;
  }).filter((item) => item.quantity > 0);
}

export function safeAccountReturn(value: string | null | undefined) {
  return value === '/korpa' ? '/korpa' : '/nalog';
}

export function formatMoney(minor: number | null) {
  return minor === null ? 'Cena na upit' : `${(minor / 100).toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RSD`;
}
