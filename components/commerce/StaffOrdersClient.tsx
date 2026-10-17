'use client';

import { useEffect, useState } from 'react';
import type { CommerceOrder, OrderStatus } from '@/lib/commerce/types';
import { ORDER_STATUSES } from '@/lib/commerce/types';
import OrderSummary, { ORDER_STATUS_LABELS } from './OrderSummary';

async function staffRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/ops/commerce${path}`, { ...options, cache: 'no-store', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...options.headers } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Interni pristup nije dostupan. Proverite ovlašćenje naloga.');
  return data as T;
}

export default function StaffOrdersClient() {
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  const [loadedDiscountFor, setLoadedDiscountFor] = useState('');
  const customers = Array.from(new Map(orders.map((order) => [order.customerId, order.customerEmail])).entries());

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    staffRequest<{ orders: CommerceOrder[] }>('/orders', { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setOrders(data.orders); })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  useEffect(() => {
    if (!customerId) return;
    const controller = new AbortController();
    setDiscountLoading(true);
    setLoadedDiscountFor('');
    setMessage('');
    staffRequest<{ customer: { discountOverride: number | null } }>(`/customers/${encodeURIComponent(customerId)}/discount`, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) { setDiscount(data.customer.discountOverride === null ? '' : String(data.customer.discountOverride)); setLoadedDiscountFor(customerId); } })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setDiscountLoading(false); });
    return () => controller.abort();
  }, [customerId]);

  async function updateStatus(event: React.FormEvent<HTMLFormElement>, order: CommerceOrder) {
    event.preventDefault();
    const status = String(new FormData(event.currentTarget).get('status')) as OrderStatus;
    setSaving(order.id); setError(''); setMessage('');
    try {
      const data = await staffRequest<{ order: CommerceOrder }>(`/orders/${order.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setOrders((current) => current.map((entry) => entry.id === order.id ? data.order : entry));
      setMessage(`Status porudžbine ${order.orderNumber} je sačuvan.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Čuvanje nije uspelo.'); }
    finally { setSaving(''); }
  }

  async function updateDiscount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loadedDiscountFor !== customerId) return;
    setSaving('discount'); setError(''); setMessage('');
    try {
      await staffRequest(`/customers/${encodeURIComponent(customerId)}/discount`, { method: 'PATCH', body: JSON.stringify({ discountPercent: discount === '' ? null : Number(discount) }) });
      setMessage('Rabat je sačuvan za buduće obračune. Prethodne porudžbine zadržavaju svoj obračun.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Čuvanje nije uspelo.'); }
    finally { setSaving(''); }
  }

  return <div className="container max-w-6xl py-10 sm:py-16">
    <div className="flex flex-wrap justify-between gap-5"><div><p className="eyebrow mb-3">Podovi prodaja · interni pregled</p><h1 className="text-3xl font-normal">Porudžbine i rabati</h1></div><button onClick={() => setRevision((value) => value + 1)} className="btn-secondary self-start">Osveži pregled</button></div>
    {error && <p role="alert" className="my-6 border border-red-200 p-4 text-sm text-red-700">{error}</p>}{message && <p role="status" className="my-6 border border-ink-200 p-4 text-sm">{message}</p>}
    <section aria-label="Individualni rabat" className="my-8 border-y border-ink-200 py-6"><h2 className="mb-4 text-xl font-normal">Individualni rabat kupca</h2><form onSubmit={updateDiscount} className="flex flex-wrap items-end gap-4">
      <label className="block max-w-full text-sm">Kupac<select required value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="mt-2 block min-h-[44px] max-w-full border border-ink-300 bg-white px-3"><option value="">Izaberite kupca iz porudžbina</option>{customers.map(([id, email]) => <option key={id} value={id}>{email}</option>)}</select></label>
      <label className="block text-sm">Individualni rabat (%)<input type="number" min="0" max="100" step="1" value={discount} disabled={!customerId || discountLoading || loadedDiscountFor !== customerId} onChange={(event) => setDiscount(event.target.value)} placeholder="Osnovnih 10%" className="mt-2 block min-h-[44px] w-44 border border-ink-300 px-3" /></label><button disabled={!customerId || discountLoading || loadedDiscountFor !== customerId || Boolean(saving)} className="btn-primary min-h-[44px] disabled:opacity-40">{saving === 'discount' ? 'Čuvamo…' : 'Sačuvaj rabat'}</button>
    </form><p className="mt-3 text-xs text-ink-500">Prazno polje vraća osnovnih 10%. Vrednost 0 ukida rabat. Individualni rabat zamenjuje osnovni.</p></section>
    {loading ? <p role="status">Učitavamo porudžbine…</p> : orders.length === 0 ? <p className="text-ink-600">Nema porudžbina za prikaz.</p> : <ul className="space-y-5">{orders.map((order) => <li key={order.id} className="border border-ink-200 p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-5"><div><h2 className="text-lg">{order.orderNumber}</h2><p className="mt-1 break-all text-sm text-ink-600">{order.customerEmail} · {new Date(order.createdAt).toLocaleDateString('sr-RS')}</p><p className="mt-1 text-xs text-ink-500">{ORDER_STATUS_LABELS[order.status]}</p></div><form onSubmit={(event) => void updateStatus(event, order)} className="flex flex-wrap gap-3"><label className="sr-only" htmlFor={`status-${order.id}`}>Status {order.orderNumber}</label><select id={`status-${order.id}`} name="status" defaultValue={order.status} key={order.status} className="min-h-[44px] border border-ink-300 bg-white px-3 text-sm">{ORDER_STATUSES.map((status) => <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>)}</select><button disabled={Boolean(saving)} className="btn-secondary disabled:opacity-40">{saving === order.id ? 'Čuvamo…' : 'Sačuvaj status'}</button></form></div><details><summary className="cursor-pointer py-3 text-sm underline underline-offset-4">Stavke, kontakt i obračun</summary><OrderSummary order={order} /></details></li>)}</ul>}
  </div>;
}
