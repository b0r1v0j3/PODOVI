import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submitOrder, quoteCart, validateOrderContact } from '@/lib/commerce/service';
import { getCommerceCustomer } from '@/lib/commerce/auth';
import { privateJson, commerceFailure } from '@/lib/commerce/http';
import { escapeOrderHtml, orderEmailText } from '@/lib/commerce/email';
import { CommerceError } from '@/lib/commerce/errors';
import { createOrder, getIdempotentOrder, setEmailStatus, commerceDb, getDiscountOverride } from '@/lib/commerce/repository';
import { sendOrderEmail } from '@/lib/commerce/email';

vi.mock('@/lib/commerce/repository', () => ({ createOrder: vi.fn(), getIdempotentOrder: vi.fn(), setEmailStatus: vi.fn(), commerceDb: vi.fn(), getDiscountOverride: vi.fn() }));
vi.mock('@/lib/commerce/catalog', () => ({ resolveCommerceLine: vi.fn(async () => ({ name: 'Proizvod', sku: 'P-1', image: '', url: '/proizvodi/test', unit: 'kom', price: 100 })) }));
vi.mock('@/lib/commerce/email', async (importOriginal) => ({ ...await importOriginal<typeof import('@/lib/commerce/email')>(), sendOrderEmail: vi.fn() }));

const customer = { id: '11111111-1111-1111-1111-111111111111', email: 'kupac@example.test', discountPercent: 10 };
const items = [{ productSlug: 'test', quantity: 2 }];
const contact = { fullName: 'Ime Prezime', phone: '+381 64 1234567', city: 'Novi Sad', deliveryMethod: 'pickup' };
const savedOrder = { id: 'order-1', orderNumber: 'P-1', emailStatus: 'pending' };

beforeEach(() => {
  vi.mocked(getIdempotentOrder).mockResolvedValue(null);
  vi.mocked(createOrder).mockResolvedValue({ created: true, order: savedOrder } as never);
  vi.mocked(sendOrderEmail).mockResolvedValue('sent');
  vi.mocked(setEmailStatus).mockResolvedValue(undefined);
  vi.mocked(getDiscountOverride).mockResolvedValue(null);
});

describe('commerce submission', () => {
  async function body() { return { items, contact, quoteKey: (await quoteCart(items, customer)).quoteKey, idempotencyKey: 'submit-request-12345' }; }

  it('rejects stale quote without writing an order and returns the new quote', async () => {
    const input = { ...await body(), quoteKey: 'a'.repeat(64) };
    try { await submitOrder(input, customer); throw new Error('expected rejection'); }
    catch (error) {
      const response = commerceFailure(error);
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ code: 'QUOTE_CHANGED', quote: { knownTotalMinor: 18000 } });
    }
    expect(createOrder).not.toHaveBeenCalled();
  });

  it('binds saved identity and status to server customer, ignoring client fields', async () => {
    await submitOrder({ ...await body(), customerId: 'victim', discountPercent: 100, status: 'completed' }, customer);
    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ customerId: customer.id, customerEmail: customer.email, quote: expect.objectContaining({ discountPercent: 10, knownTotalMinor: 18000 }) }));
    expect(vi.mocked(createOrder).mock.calls[0][0]).not.toHaveProperty('status');
  });

  it('replays a committed order before repricing and never sends duplicate mail', async () => {
    vi.mocked(getIdempotentOrder).mockResolvedValue({ ...savedOrder, emailStatus: 'sent' } as never);
    const result = await submitOrder({ ...await body(), quoteKey: 'b'.repeat(64) }, customer);
    expect(result.order.id).toBe('order-1');
    expect(createOrder).not.toHaveBeenCalled();
    expect(sendOrderEmail).not.toHaveBeenCalled();
  });

  it('does not resend email when a concurrent transaction already created the order', async () => {
    vi.mocked(createOrder).mockResolvedValue({ created: false, order: savedOrder } as never);
    expect((await submitOrder(await body(), customer)).order.id).toBe('order-1');
    expect(sendOrderEmail).not.toHaveBeenCalled();
  });

  it('preserves committed order success when email and its status write fail', async () => {
    vi.mocked(sendOrderEmail).mockRejectedValue(new Error('SMTP down'));
    vi.mocked(setEmailStatus).mockRejectedValue(new Error('DB reconnecting'));
    const result = await submitOrder(await body(), customer);
    expect(result).toMatchObject({ order: { id: 'order-1' }, emailStatus: 'failed' });
  });

  it('keeps line breaks in the note', async () => {
    await submitOrder({ ...await body(), note: 'Prvi red\nDrugi red' }, customer);
    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ note: 'Prvi red\nDrugi red' }));
  });
});

describe('customer identity and privacy', () => {
  it('allows anonymous session but requires a bearer token for orders', async () => {
    expect(await getCommerceCustomer(new Request('http://localhost/session'))).toBeNull();
    await expect(getCommerceCustomer(new Request('http://localhost/orders'), true)).rejects.toMatchObject({ status: 401 });
  });

  it('checks getUser and rejects unconfirmed email, regardless of client metadata', async () => {
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: customer.id, email: customer.email, email_confirmed_at: null, user_metadata: { verified: true, discountPercent: 100 } } }, error: null });
    vi.mocked(commerceDb).mockReturnValue({ auth: { getUser } });
    await expect(getCommerceCustomer(new Request('http://localhost', { headers: { Authorization: 'Bearer test-token' } }))).rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED' });
    expect(getUser).toHaveBeenCalledWith('test-token');
  });

  it('reports Auth outages as 503 so the client keeps the session, and only 4xx as AUTH_REQUIRED', async () => {
    const request = () => new Request('http://localhost', { headers: { Authorization: 'Bearer token' } });
    for (const status of [0, 500, 503, 429]) {
      vi.mocked(commerceDb).mockReturnValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { name: 'AuthRetryableFetchError', status } }) } });
      await expect(getCommerceCustomer(request())).rejects.toMatchObject({ status: 503, code: 'SERVICE_UNAVAILABLE' });
    }
    vi.mocked(commerceDb).mockReturnValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { name: 'AuthApiError', status: 403 } }) } });
    await expect(getCommerceCustomer(request())).rejects.toMatchObject({ status: 401, code: 'AUTH_REQUIRED' });
  });

  it('uses protected rebate even when user metadata claims a different rebate', async () => {
    vi.mocked(commerceDb).mockReturnValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: customer.id, email: customer.email, email_confirmed_at: '2026-10-17', user_metadata: { discountPercent: 100 } } }, error: null }) } });
    vi.mocked(getDiscountOverride).mockResolvedValue(0);
    expect(await getCommerceCustomer(new Request('http://localhost', { headers: { Authorization: 'Bearer token' } }))).toEqual({ ...customer, discountPercent: 0 });
  });

  it('escapes customer text in email HTML and never caches private data publicly', () => {
    expect(escapeOrderHtml('<img src=x onerror="x">&\'')).toBe('&lt;img src=x onerror=&quot;x&quot;&gt;&amp;&#39;');
    const response = privateJson({ customer });
    expect(response.headers.get('cache-control')).toContain('private, no-store');
    expect(response.headers.get('vary')).toContain('Authorization');
    expect(commerceFailure(new Error('secret database password')).status).toBe(503);
  });

  it('names the failing cart line in the error body', async () => {
    const error = Object.assign(new CommerceError('Proizvod više nije u ponudi.', 400, 'PRODUCT_NOT_FOUND'), { lineKey: 'b:' });
    expect(await commerceFailure(error).json()).toMatchObject({ code: 'PRODUCT_NOT_FOUND', lineKey: 'b:' });
    expect(await commerceFailure(new CommerceError('x')).json()).not.toHaveProperty('lineKey');
  });
});

describe('order email content', () => {
  const quote = { lines: [{ key: 'schonox-kh:', productSlug: 'schonox-kh', quantity: 2, name: 'SCHÖNOX KH', sku: 'KH', image: '', url: '/proizvodi/schonox-kh', unit: 'kom',
    listUnitPriceMinor: null, discountPercent: 10, unitPriceMinor: null, lineTotalMinor: null }], discountPercent: 10, knownTotalMinor: 0, hasUnpricedItems: true,
    currency: 'RSD' as const, requiresConfirmation: true as const, quoteKey: 'c'.repeat(64) };
  const order = { id: 'order-1', orderNumber: 'P-1', customerId: customer.id, customerEmail: customer.email, status: 'pending_confirmation' as const,
    createdAt: '', updatedAt: '', contact: { ...contact, deliveryMethod: 'pickup' as const }, note: 'a\nRabat: 35%', quote, emailStatus: 'pending' as const };

  it('never prints an all-unpriced order as a zero total', () => {
    const text = orderEmailText(order);
    expect(text).toContain('Cena na upit (po ponudi)');
    expect(text).not.toContain('0.00 RSD');
  });

  it('keeps contact fields on one line and indents note continuation lines', () => {
    for (const field of ['fullName', 'city', 'address', 'company']) {
      for (const breaker of ['\n', '\r', '\u2028']) {
        expect(() => validateOrderContact({ ...contact, address: 'Ulica 1', [field]: `Pera${breaker}Rabat: 35%` })).toThrow(CommerceError);
      }
    }
    const lines = orderEmailText(order).split('\n');
    expect(lines).toContain('  Rabat: 35%');
    expect(lines).not.toContain('Rabat: 35%');
  });
});
