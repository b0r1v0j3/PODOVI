'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCommerce } from '@/lib/context/CommerceContext';
import type { CommerceOrder } from '@/lib/commerce/types';
import { commerceRequest, loadSupabase } from './api';
import { formatMoney, safeAccountReturn } from './cart-state';
import OrderSummary, { ORDER_STATUS_LABELS } from './OrderSummary';

export default function AccountPageClient({ returnTo = '/nalog', orderId }: { returnTo?: string; orderId?: string }) {
  const { customer, authLoading, authError, storageError, refreshCustomer, signOut } = useCommerce();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [ordersState, setOrdersState] = useState<{ customerId: string; orders: CommerceOrder[]; error: string } | null>(null);
  const target = safeAccountReturn(returnTo);

  useEffect(() => {
    setOrdersState(null);
    if (!customer || authLoading) return;
    const controller = new AbortController();
    const request = orderId
      ? commerceRequest<{ order: CommerceOrder }>(`/orders/${encodeURIComponent(orderId)}`, { signal: controller.signal }).then((data) => [data.order])
      : commerceRequest<{ orders: CommerceOrder[] }>('/orders', { signal: controller.signal }).then((data) => data.orders);
    request.then((orders) => { if (!controller.signal.aborted) setOrdersState({ customerId: customer.id, orders, error: '' }); })
      .catch((cause) => { if (!controller.signal.aborted) setOrdersState({ customerId: customer.id, orders: [], error: cause instanceof Error ? cause.message : 'Porudžbine nisu dostupne.' }); });
    return () => controller.abort();
  }, [customer, authLoading, orderId, revision]);

  async function sendLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError('');
    try {
      const client = await loadSupabase();
      if (!client) throw new Error('Prijava trenutno nije dostupna. Za ponudu nam pošaljite upit.');
      const callback = new URL('/nalog/potvrda', window.location.origin);
      callback.searchParams.set('returnTo', target);
      const result = await client.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: callback.href } });
      if (result.error) throw new Error('Link nije poslat. Proverite mejl adresu ili pokušajte ponovo malo kasnije.');
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Prijava nije uspela.');
    } finally { setSending(false); }
  }

  if (authLoading) return <div className="container max-w-5xl py-16"><p role="status">Proveravamo nalog…</p></div>;

  if (!customer) return <div className="container max-w-xl py-12 sm:py-20">
    <p className="eyebrow mb-3">Moj nalog</p><h1 className="text-3xl font-normal sm:text-4xl">Vaš mejl. Vaš rabat.</h1>
    <p className="mt-5 text-base leading-relaxed text-ink-600">Potvrdite mejl i ostvarite 10% rabata. U nalogu pratite svoje porudžbine; ako vam je odobren individualni rabat, on zamenjuje osnovnih 10%.</p>
    {storageError && <p role="alert" className="mt-5 text-sm text-red-700">{storageError}</p>}
    {authError && <div role="alert" className="mt-5 border border-ink-200 p-4 text-sm"><p>{authError}</p><button onClick={() => void refreshCustomer()} className="min-h-[44px] underline">Ponovi proveru</button></div>}
    {sent ? <div role="status" className="mt-8 border border-ink-200 p-6"><h2 className="text-lg">Proverite svoje sanduče</h2><p className="mt-3 break-words text-sm leading-relaxed">Poslali smo link na {email.trim()}. Otvorite ga u ovom pregledaču da nastavite sa sačuvanom korpom. Proverite i neželjenu poštu.</p><button type="button" onClick={() => setSent(false)} className="mt-4 min-h-[44px] text-sm underline">Promeni adresu ili pošalji novi link</button></div> : <form onSubmit={sendLink} className="mt-8 border-y border-ink-200 py-7">
      <label htmlFor="account-email" className="block text-sm">Mejl adresa</label><input id="account-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-[48px] w-full border border-ink-300 px-4 text-base focus:outline-ink-900" />
      <button type="submit" disabled={sending} className="btn-primary mt-4 min-h-[48px] w-full disabled:opacity-40">{sending ? 'Šaljemo link…' : 'Pošalji link za prijavu'}</button><p className="mt-4 text-xs leading-relaxed text-ink-500">Lozinka nije potrebna. Slanjem linka ne šaljete porudžbinu.</p>
    </form>}
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    <div className="mt-6 flex flex-wrap gap-6 text-sm"><Link href="/korpa" className="min-h-[44px] underline">Nazad u korpu</Link><Link href="/upiti" className="min-h-[44px] underline">Pošalji upit prodaji</Link></div>
  </div>;

  const state = ordersState?.customerId === customer.id ? ordersState : null;
  return <div className="container max-w-5xl py-10 sm:py-16">
    <div className="flex flex-wrap items-start justify-between gap-6 border-b border-ink-200 pb-7"><div><p className="eyebrow mb-3">Moj nalog</p><h1 className="text-3xl font-normal">{orderId ? 'Detalji porudžbine' : 'Dobro došli'}</h1><p className="mt-3 break-all text-sm text-ink-600">{customer.email}</p></div><div className="text-right"><p className="text-3xl font-normal">{customer.discountPercent}%</p><p className="mt-1 text-xs text-ink-600">Vaš trenutni rabat</p></div></div>
    <div className="my-6 flex flex-wrap items-center gap-6 text-sm">{orderId && <Link href="/nalog" className="min-h-[44px] content-center underline">Sve porudžbine</Link>}<Link href="/korpa" className="min-h-[44px] content-center underline">Otvori korpu →</Link><button type="button" onClick={() => { setRevision((value) => value + 1); void refreshCustomer(); }} className="min-h-[44px] underline">Osveži</button><button type="button" onClick={async () => { setError(''); try { await signOut(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Odjava nije uspela.'); } }} className="ml-auto min-h-[44px] underline">Odjavi se</button></div>
    {error && <p role="alert" className="mb-5 text-sm text-red-700">{error}</p>}
    {!state ? <p role="status">Učitavamo porudžbine…</p> : state.error ? <p role="alert" className="border border-ink-200 p-5 text-sm">{state.error}</p> : orderId && state.orders[0] ? <OrderSummary order={state.orders[0]} /> : <section aria-label="Moje porudžbine">
      <h2 className="mb-6 text-xl font-normal">Moje porudžbine</h2>
      {state.orders.length === 0 ? <p className="border border-ink-200 p-6 text-sm text-ink-600">Još nemate porudžbina. Dodajte proizvode u korpu i pošaljite ih prodaji na potvrdu.</p> : <ul className="divide-y divide-ink-200 border-y border-ink-200">{state.orders.map((order) => <li key={order.id}><Link href={`/nalog/porudzbine/${order.id}`} className="flex flex-wrap items-center justify-between gap-4 py-6 hover:bg-paper"><div><h3 className="text-base">{order.orderNumber}</h3><p className="mt-2 text-xs text-ink-500">{new Date(order.createdAt).toLocaleDateString('sr-RS')} · {ORDER_STATUS_LABELS[order.status]}</p></div><div className="text-right"><p className="text-sm">{formatMoney(order.quote.lines.every((line) => line.unitPriceMinor === null) ? null : order.quote.knownTotalMinor)}</p><p className="mt-1 text-xs text-ink-500">{order.quote.hasUnpricedItems ? 'Iznos čeka konačnu ponudu' : 'Informativni iznos'} · Pogledaj →</p></div></Link></li>)}</ul>}
    </section>}
  </div>;
}
