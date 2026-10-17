import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { addCartItem, cartLineKey, formatMoney, isValidQuantity, MAX_CART_LINES, parseStoredCart, safeAccountReturn, selectedCartItem, subtractOrderedItems } from '@/components/commerce/cart-state';
import { QuoteTotals } from '@/components/commerce/OrderSummary';
import ProductOrderPanel from '@/components/commerce/ProductOrderPanel';
import CartPageClient from '@/components/commerce/CartPageClient';
import type { CommerceQuote } from '@/lib/commerce/types';

const state = vi.hoisted(() => ({ customer: null as any, quote: null as any, quoteInputs: [] as any[], items: [] as any[], quoteError: '', errorLineKey: undefined as string | undefined }));
vi.mock('@/lib/context/CommerceContext', () => ({ useCommerce: () => ({ addItem: vi.fn(), removeItem: vi.fn(), updateQuantity: vi.fn(), completeOrder: vi.fn(), refreshCustomer: vi.fn(), items: state.items, customer: state.customer, authLoading: false, authError: '', storageError: '', hydrated: true }) }));
vi.mock('@/components/commerce/useQuote', () => ({ useQuote: (items: any[]) => { state.quoteInputs = items; return { quote: state.quote, loading: false, error: state.quoteError, errorLineKey: state.errorLineKey, refresh: vi.fn() }; } }));
vi.stubGlobal('React', React);
afterAll(() => vi.unstubAllGlobals());

const knownQuote: CommerceQuote = {
  currency: 'RSD', requiresConfirmation: true, quoteKey: 'quote', discountPercent: 10, knownTotalMinor: 90000, hasUnpricedItems: false,
  lines: [{ key: 'winter:oak', productSlug: 'winter', variantSlug: 'oak', quantity: 1, name: 'Oak', sku: 'OAK', image: '', url: '/proizvodi/winter?color=oak', unit: 'm²', listUnitPriceMinor: 100000, discountPercent: 10, unitPriceMinor: 90000, lineTotalMinor: 90000 }],
};

describe('browser cart references', () => {
  it('persists only validated product, variant and quantity; never price, rebate or identity', () => {
    const input = { productSlug: 'winter', variantSlug: 'oak', quantity: 12.345, price: 1, discountPercent: 100, customerId: 'other' };
    const restored = parseStoredCart(JSON.stringify([input]));
    expect(restored).toEqual([{ productSlug: 'winter', variantSlug: 'oak', quantity: 12.345 }]);
    expect(parseStoredCart(JSON.stringify(restored))).toEqual(restored);
  });

  it('discards corrupt storage, invalid quantities/slugs and duplicate references', () => {
    expect(parseStoredCart('{broken')).toEqual([]);
    expect(parseStoredCart('{"items":[]}')).toEqual([]);
    expect(parseStoredCart(JSON.stringify([
      { productSlug: '../secret', quantity: 1 }, { productSlug: 'unsafe_name', quantity: 1 },
      { productSlug: 'winter', quantity: 0 }, { productSlug: 'winter', quantity: 1.1234 },
      { productSlug: 'winter', variantSlug: 'oak', quantity: 1 }, { productSlug: 'winter', variantSlug: 'oak', quantity: 2 },
    ]))).toEqual([{ productSlug: 'winter', variantSlug: 'oak', quantity: 1 }]);
    for (const value of [NaN, Infinity, -1, 0, 100001, 0.1234]) expect(isValidQuantity(value)).toBe(false);
  });

  it('keeps distinct selected variants and sums decimal quantities without floating drift', () => {
    let items = addCartItem([], { productSlug: 'winter', variantSlug: 'oak', quantity: 0.1 });
    items = addCartItem(items, { productSlug: 'winter', variantSlug: 'oak', quantity: 0.2 });
    items = addCartItem(items, { productSlug: 'winter', variantSlug: 'ash', quantity: 1 });
    expect(items.map((item) => [cartLineKey(item), item.quantity])).toEqual([['winter:oak', 0.3], ['winter:ash', 1]]);
    expect(() => addCartItem([{ productSlug: 'winter', quantity: 100000 }], { productSlug: 'winter', quantity: 1 })).toThrow();
    const full = Array.from({ length: MAX_CART_LINES }, (_, index) => ({ productSlug: `p-${index}`, quantity: 1 }));
    expect(() => addCartItem(full, { productSlug: 'extra', quantity: 1 })).toThrow();
  });

  it('requires an explicit variant and never silently adds a collection preview', () => {
    expect(selectedCartItem('winter', null, true, 1)).toBeNull();
    expect(selectedCartItem('winter', 'oak', true, 2)).toEqual({ productSlug: 'winter', variantSlug: 'oak', quantity: 2 });
    expect(selectedCartItem('schonox-zm', 'unrelated-query', false, 1)).toEqual({ productSlug: 'schonox-zm', quantity: 1 });
  });

  it('preserves additions from another tab when a submitted order completes', () => {
    expect(subtractOrderedItems([{ productSlug: 'winter', quantity: 5 }, { productSlug: 'schonox-zm', quantity: 1 }], [{ productSlug: 'winter', quantity: 2 }])).toEqual([{ productSlug: 'winter', quantity: 3 }, { productSlug: 'schonox-zm', quantity: 1 }]);
  });

  it('returns only to approved local account/cart routes after login', () => {
    expect(safeAccountReturn('/korpa')).toBe('/korpa');
    for (const path of ['//evil.test', 'https://evil.test', '/\\evil.test', '/api/ops', null]) expect(safeAccountReturn(path)).toBe('/nalog');
  });
});

describe('customer price and order presentation', () => {
  beforeEach(() => { state.customer = null; state.quote = null; state.quoteInputs = []; state.items = []; state.quoteError = ''; state.errorLineKey = undefined; });

  it('shows server-calculated customer price and the exact selected variant', () => {
    state.customer = { id: 'customer', email: 'test@example.com', discountPercent: 10 };
    state.quote = knownQuote;
    const html = renderToStaticMarkup(React.createElement(ProductOrderPanel, { productSlug: 'winter', variantSlug: 'oak', requiresVariant: true }));
    expect(state.quoteInputs).toEqual([{ productSlug: 'winter', variantSlug: 'oak', quantity: 1 }]);
    expect(html).toContain('900,00 RSD');
    expect(html).toContain('rabat 10%');
    expect(html).not.toContain('Potvrdite mejl');
  });

  it('offers guest login while keeping a collection-only purchase disabled', () => {
    const html = renderToStaticMarkup(React.createElement(ProductOrderPanel, { productSlug: 'winter', requiresVariant: true }));
    expect(state.quoteInputs).toEqual([]);
    expect(html).toContain('Izaberite konkretnu boju');
    expect(html).toContain('Potvrdite mejl za 10% rabata');
    expect(html).toContain('disabled=""');
  });

  it('turns pattern-group collections into an inquiry note without requesting a quote', () => {
    const html = renderToStaticMarkup(React.createElement(ProductOrderPanel, { productSlug: 'podovi-parket-four-seasons', variantSlug: 'podovi-parket-four-seasons-grupa-1', requiresVariant: true, inquiryOnly: true }));
    expect(state.quoteInputs).toEqual([]);
    expect(html).toContain('id="product-order"');
    expect(html).toContain('poručuje preko upita');
    expect(html).not.toContain('Dodaj u korpu');
    expect(html).not.toContain('Ponovi obračun');
  });

  it('marks the one cart line the server rejected and offers to remove it', () => {
    state.customer = { id: 'customer', email: 'test@example.com', discountPercent: 10 };
    state.items = [{ productSlug: 'winter', variantSlug: 'oak', quantity: 1 }, { productSlug: 'stari-proizvod', quantity: 2 }];
    state.quoteError = 'Proizvod više nije u ponudi.';
    state.errorLineKey = 'stari-proizvod:';
    const html = renderToStaticMarkup(React.createElement(CartPageClient));
    expect(html.match(/Ukloni ovu stavku/g)).toHaveLength(1);
    expect(html.match(/border-red-700/g)).toHaveLength(1);
    expect(html.indexOf('Ukloni ovu stavku')).toBeGreaterThan(html.indexOf('stari-proizvod'));
    expect(html).toContain('Proizvod više nije u ponudi. Ispravite ili uklonite ovu stavku');
    expect(html).not.toContain('Proverite stavke');
    state.errorLineKey = undefined;
    const generic = renderToStaticMarkup(React.createElement(CartPageClient));
    expect(generic).toContain('Proverite stavke');
    expect(generic).not.toContain('Ukloni ovu stavku');
  });

  it('explains an empty cart to a customer who signed in from another browser', () => {
    expect(renderToStaticMarkup(React.createElement(CartPageClient))).not.toContain('Korpa se čuva samo u pregledaču');
    state.customer = { id: 'customer', email: 'test@example.com', discountPercent: 10 };
    expect(renderToStaticMarkup(React.createElement(CartPageClient))).toContain('Korpa se čuva samo u pregledaču');
  });

  it('does not invent zero prices for unknown or fully unpriced orders', () => {
    expect(formatMoney(null)).toBe('Cena na upit');
    const quote: CommerceQuote = { ...knownQuote, hasUnpricedItems: true, knownTotalMinor: 0, lines: knownQuote.lines.map((line) => ({ ...line, listUnitPriceMinor: null, unitPriceMinor: null, lineTotalMinor: null })) };
    const html = renderToStaticMarkup(React.createElement(QuoteTotals, { quote }));
    expect(html).toContain('Cena na upit');
    expect(html).not.toContain('0,00 RSD');
    expect(html).toContain('PDV');
    expect(html).toContain('ne predstavlja naplatu');
  });

  it('labels a mixed basket amount as partial and honors a zero-percent override', () => {
    const html = renderToStaticMarkup(React.createElement(QuoteTotals, { quote: { ...knownQuote, discountPercent: 0, hasUnpricedItems: true } }));
    expect(html).toContain('Poznati deo iznosa');
    expect(html).toContain('Ovo nije ukupan iznos');
    expect(html).toContain('Obračunati rabat: 0%');
  });
});
