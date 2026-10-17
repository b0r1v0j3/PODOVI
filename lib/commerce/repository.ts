import { getServerSupabase, hasSupabaseServiceRoleConfig } from '@/lib/supabase/client';
import { CommerceError } from './errors';
import type { CommerceOrder, CommerceQuote, OrderContact, OrderEmailStatus, OrderStatus } from './types';

export function commerceDb() {
  if (!hasSupabaseServiceRoleConfig()) throw new CommerceError('Poručivanje trenutno nije dostupno. Obratite se Podovi prodaji.', 503, 'NOT_CONFIGURED');
  return getServerSupabase();
}

function check(error: unknown) {
  if (error) throw new CommerceError('Podaci trenutno nisu dostupni. Pokušajte ponovo.', 503, 'DATABASE_UNAVAILABLE');
}

const orderSelection = '*, commerce_order_items(position,snapshot)';

function mapOrder(row: any): CommerceOrder {
  return { id: row.id, orderNumber: `P-${row.order_number}`, customerId: row.customer_id, customerEmail: row.customer_email,
    status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, contact: row.contact, note: row.note,
    emailStatus: row.email_status,
    quote: { ...row.quote, lines: [...(row.commerce_order_items || [])].sort((a, b) => a.position - b.position).map((item) => item.snapshot) } };
}

export async function getDiscountOverride(customerId: string): Promise<number | null> {
  const { data, error } = await commerceDb().from('commerce_customers').select('discount_override').eq('user_id', customerId).maybeSingle();
  check(error);
  return data?.discount_override ?? null;
}

export async function getOwnOrder(customerId: string, id: string): Promise<CommerceOrder | null> {
  const { data, error } = await commerceDb().from('commerce_orders').select(orderSelection).eq('customer_id', customerId).eq('id', id).maybeSingle();
  check(error);
  return data ? mapOrder(data) : null;
}

export async function listOrders(customerId?: string): Promise<CommerceOrder[]> {
  // shortcut: newest 100 orders per view; add pagination when history exceeds this limit.
  let query = commerceDb().from('commerce_orders').select(orderSelection).order('created_at', { ascending: false }).limit(100);
  if (customerId) query = query.eq('customer_id', customerId);
  const { data, error } = await query;
  check(error);
  return (data || []).map(mapOrder);
}

export async function getIdempotentOrder(customerId: string, key: string, hash: string): Promise<CommerceOrder | null> {
  const { data, error } = await commerceDb().from('commerce_orders').select(orderSelection).eq('customer_id', customerId).eq('idempotency_key', key).maybeSingle();
  check(error);
  if (!data) return null;
  if (data.request_hash !== hash) throw new CommerceError('Ovaj ključ slanja je već iskorišćen za drugačiju porudžbinu.', 409, 'IDEMPOTENCY_CONFLICT');
  return mapOrder(data);
}

export async function createOrder(input: { customerId: string; customerEmail: string; idempotencyKey: string; requestHash: string;
  contact: OrderContact; note: string; quote: CommerceQuote }): Promise<{ order: CommerceOrder; created: boolean }> {
  const { data, error } = await commerceDb().rpc('commerce_create_order', {
    p_customer_id: input.customerId, p_customer_email: input.customerEmail, p_idempotency_key: input.idempotencyKey,
    p_request_hash: input.requestHash, p_contact: input.contact, p_note: input.note, p_quote: input.quote,
  });
  if (error?.message?.includes('COMMERCE_IDEMPOTENCY_CONFLICT')) {
    throw new CommerceError('Ovaj ključ slanja je već iskorišćen za drugačiju porudžbinu.', 409, 'IDEMPOTENCY_CONFLICT');
  }
  check(error);
  if (!data?.order) throw new CommerceError('Porudžbina nije potvrđena u bazi. Pokušajte ponovo istim ključem.', 503);
  return { order: mapOrder(data.order), created: data.created === true };
}

export async function setEmailStatus(id: string, status: OrderEmailStatus) {
  const { error } = await commerceDb().from('commerce_orders').update({ email_status: status }).eq('id', id);
  check(error);
}

export async function updateOrderStatus(id: string, status: OrderStatus, actorId: string): Promise<CommerceOrder> {
  const { data, error } = await commerceDb().from('commerce_orders').update({ status, updated_by: actorId, updated_at: new Date().toISOString() })
    .eq('id', id).select(orderSelection).maybeSingle();
  check(error);
  if (!data) throw new CommerceError('Porudžbina nije pronađena.', 404);
  return mapOrder(data);
}

export async function updateDiscount(customerId: string, email: string, discount: number | null, actorId: string) {
  const { error } = await commerceDb().from('commerce_customers').upsert({ user_id: customerId, email, discount_override: discount,
    updated_by: actorId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  check(error);
}
