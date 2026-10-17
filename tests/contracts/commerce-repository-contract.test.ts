import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getIdempotentOrder, getOwnOrder, listOrders } from '@/lib/commerce/repository';
import { getServerSupabase } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({ hasSupabaseServiceRoleConfig: () => true, getServerSupabase: vi.fn() }));

const row = { id: 'order', order_number: 1, customer_id: 'alice', customer_email: 'alice@example.test', status: 'pending_confirmation',
  quote: {}, contact: {}, note: '', request_hash: 'original-hash', commerce_order_items: [] };
let query: Record<string, any>;
beforeEach(() => {
  query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
  for (const method of ['select', 'eq', 'order', 'limit']) query[method].mockReturnValue(query);
  query.then = (resolve: (value: unknown) => void) => resolve({ data: [], error: null });
  vi.mocked(getServerSupabase).mockReturnValue({ from: vi.fn().mockReturnValue(query) });
});

describe('commerce repository access', () => {
  it('scopes own order detail and list queries by verified customer ID', async () => {
    expect(await getOwnOrder('alice', 'bobs-order')).toBeNull();
    expect(query.eq).toHaveBeenCalledWith('customer_id', 'alice');
    expect(query.eq).toHaveBeenCalledWith('id', 'bobs-order');
    query.eq.mockClear();
    await listOrders('alice');
    expect(query.eq).toHaveBeenCalledWith('customer_id', 'alice');
  });

  it('binds idempotency to customer and payload, never just the user-provided key', async () => {
    query.maybeSingle.mockResolvedValue({ data: row, error: null });
    await expect(getIdempotentOrder('alice', 'request-123', 'changed-hash')).rejects.toMatchObject({ status: 409, code: 'IDEMPOTENCY_CONFLICT' });
    expect(query.eq).toHaveBeenCalledWith('customer_id', 'alice');
    expect(query.eq).toHaveBeenCalledWith('idempotency_key', 'request-123');
    expect((await getIdempotentOrder('alice', 'request-123', 'original-hash'))?.id).toBe('order');
  });

  it('fails closed on DB errors instead of manufacturing an empty history', async () => {
    query.maybeSingle.mockResolvedValue({ data: null, error: { message: 'private database internals' } });
    await expect(getOwnOrder('alice', 'order')).rejects.toMatchObject({ status: 503, code: 'DATABASE_UNAVAILABLE' });
  });
});
