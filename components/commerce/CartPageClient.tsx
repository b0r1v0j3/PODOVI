'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { useCommerce } from '@/lib/context/CommerceContext';
import type { CommerceOrder, OrderContact, OrderEmailStatus } from '@/lib/commerce/types';
import ProductImage from '@/components/ProductImage';
import { cartLineKey, formatMoney, isValidQuantity, MAX_QUANTITY } from './cart-state';
import { commerceRequest, CommerceApiError } from './api';
import { useQuote } from './useQuote';
import OrderSummary, { QuoteTotals } from './OrderSummary';

const fieldClass = 'mt-2 min-h-[44px] w-full border border-ink-300 bg-white px-3 py-2 text-base text-ink-900 focus:outline-ink-900';

function QuantityInput({ quantity, unit, disabled, onCommit }: { quantity: number; unit: string; disabled: boolean; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState(String(quantity));
  const [error, setError] = useState('');
  useEffect(() => { setDraft(String(quantity)); }, [quantity]);
  function commit() {
    const value = Number(draft);
    if (!isValidQuantity(value)) { setError('Unesite ispravnu količinu.'); setDraft(String(quantity)); return; }
    setError('');
    onCommit(value);
  }
  return <label className="block text-xs text-ink-500">Količina ({unit})<input type="number" min="0.001" max={MAX_QUANTITY} step="0.001" value={draft} disabled={disabled} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); commit(); } }} className={`${fieldClass} max-w-[120px]`} />{error && <span role="alert" className="mt-1 block text-red-700">{error}</span>}</label>;
}

export default function CartPageClient() {
  const { items, hydrated, customer, authLoading, authError, storageError, updateQuantity, removeItem, completeOrder, refreshCustomer } = useCommerce();
  const { quote, loading, error: quoteError, errorLineKey, refresh } = useQuote(items, hydrated);
  const invalidKey = items.some((item) => cartLineKey(item) === errorLineKey) ? errorLineKey : undefined;
  const [submitting, setSubmitting] = useState(false);
  const submissionLock = useRef(false);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const [delivery, setDelivery] = useState<OrderContact['deliveryMethod']>('pickup');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ order: CommerceOrder; emailStatus: OrderEmailStatus } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quote || !customer || authLoading || submissionLock.current) return;
    submissionLock.current = true;
    setSubmitting(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const field = (name: string) => String(form.get(name) || '').trim();
    const submittedItems = [...items];
    const body = { items: submittedItems, quoteKey: quote.quoteKey, contact: { fullName: field('fullName'), phone: field('phone'), city: field('city'), address: field('address'), company: field('company'), pib: field('pib'), deliveryMethod: delivery }, note: field('note') };
    try {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([customer.id, body])));
      const fingerprint = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
      if (!attempt.current) {
        try {
          const stored = JSON.parse(sessionStorage.getItem('podovi_order_attempt') || 'null');
          if (typeof stored?.fingerprint === 'string' && typeof stored?.key === 'string') attempt.current = stored;
        } catch { /* An in-memory key still protects retries in this tab. */ }
      }
      if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
      try { sessionStorage.setItem('podovi_order_attempt', JSON.stringify(attempt.current)); } catch { /* Same-tab retries retain the key in the ref. */ }
      const result = await commerceRequest<{ order: CommerceOrder; emailStatus: OrderEmailStatus }>('/orders', { method: 'POST', body: JSON.stringify({ ...body, idempotencyKey: attempt.current.key }) });
      setSuccess(result);
      completeOrder(submittedItems);
      attempt.current = null;
      try { sessionStorage.removeItem('podovi_order_attempt'); } catch { /* The committed order is already available in account history. */ }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (cause) {
      if (cause instanceof CommerceApiError && cause.status === 409 && cause.code === 'QUOTE_CHANGED') {
        refresh();
        setError('Cena, rabat ili pakovanje su promenjeni. Prikazujemo novi obračun; pregledajte ga pre ponovnog slanja.');
      } else if (cause instanceof CommerceApiError && cause.code === 'NETWORK') {
        setError('Veza je prekinuta pre potvrde, pa je porudžbina možda već sačuvana. Ponovno slanje istih podataka neće napraviti duplu porudžbinu; možete proveriti i u svom nalogu.');
      } else {
        setError(cause instanceof Error ? cause.message : 'Slanje nije uspelo. Pokušajte ponovo.');
      }
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  if (success && customer?.id === success.order.customerId && !authLoading) return <div className="container max-w-4xl py-10 sm:py-16">
    <p className="eyebrow mb-3">Porudžbina je sačuvana</p><h1 className="mb-4 text-3xl font-normal">Hvala. Prodaja će vam se javiti.</h1>
    <p className="mb-6 text-sm leading-relaxed text-ink-600">Zahtev čeka potvrdu Podovi prodaje. Sačuvajte broj porudžbine; nema online plaćanja.</p>
    {success.emailStatus !== 'sent' && <p role="status" className="mb-6 border border-ink-200 p-4 text-sm">Porudžbina je uspešno sačuvana, ali potvrdu mejlom nismo uspeli da pošaljemo. Porudžbinu i njen status vidite u svom nalogu.</p>}
    <OrderSummary order={success.order} /><div className="mt-6 flex flex-wrap gap-5"><Link href={`/nalog/porudzbine/${success.order.id}`} className="btn-primary">Prati porudžbinu</Link><Link href="/" className="btn-secondary">Nastavi pregled kataloga</Link></div>
  </div>;

  return <div className="container py-10 sm:py-16">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow mb-3">Poručivanje uz potvrdu prodaje</p><h1 className="text-3xl font-normal sm:text-4xl">Vaša korpa</h1></div><Link href="/" className="btn-link">Nastavi pregled →</Link></div>
    {storageError && <p role="alert" className="mb-5 border border-ink-200 p-4 text-sm">{storageError}</p>}
    {!hydrated ? <p role="status">Učitavamo korpu…</p> : items.length === 0 ? <div className="border-y border-ink-200 py-12"><p className="mb-6 text-ink-600">Korpa je prazna. Izaberite proizvod i željenu količinu.</p>{customer && !authLoading && <p className="mb-6 text-sm text-ink-600">Korpa se čuva samo u pregledaču u kom je napravljena. Ako ste link za prijavu otvorili u drugom pregledaču, aplikaciji za mejl ili na drugom uređaju, stavke su ostale tamo. Ovde ste već prijavljeni, pa proizvode možete ponovo dodati i poslati porudžbinu.</p>}<Link href="/" className="btn-primary">Pogledaj katalog</Link></div> : <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section aria-label="Stavke korpe">
        <ul className="divide-y divide-ink-200 border-y border-ink-200">
          {items.map((item) => {
            const key = cartLineKey(item);
            const line = quote?.lines.find((entry) => entry.productSlug === item.productSlug && (entry.variantSlug || '') === (item.variantSlug || ''));
            return <li key={key} className={`grid grid-cols-[72px_minmax(0,1fr)] gap-4 py-6 sm:grid-cols-[100px_minmax(0,1fr)]${key === invalidKey ? ' border-l-2 border-red-700 pl-3' : ''}`}>
              <div className="relative aspect-square bg-paper">{line?.image && <ProductImage src={line.image} alt={line.name} sizes="100px" className="object-contain" />}</div>
              <div><div className="flex justify-between gap-3"><Link href={line?.url || `/proizvodi/${item.productSlug}${item.variantSlug ? `?color=${encodeURIComponent(item.variantSlug)}` : ''}`} className="text-sm font-medium hover:underline">{line?.name || item.variantSlug || item.productSlug}</Link><button type="button" disabled={submitting} onClick={() => removeItem(key)} aria-label={`Ukloni ${line?.name || item.productSlug}`} className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center hover:bg-ink-100 disabled:opacity-40"><FiTrash2 size={18} aria-hidden="true" /></button></div>
                {line && <p className="mb-3 text-xs text-ink-500">Šifra: {line.sku}</p>}
                <div className="flex flex-wrap items-end justify-between gap-4"><QuantityInput quantity={item.quantity} unit={line?.unit || 'jedinica'} disabled={submitting} onCommit={(value) => updateQuantity(key, value)} /><div className="text-right text-sm">{line ? <><p>{formatMoney(line.lineTotalMinor)}</p><p className="mt-1 text-xs text-ink-500">{formatMoney(line.unitPriceMinor)}{line.unitPriceMinor !== null ? ` / ${line.unit}` : ''}</p>{line.discountPercent > 0 && <p className="mt-1 text-xs text-ink-500">Rabat {line.discountPercent}%</p>}</> : <span className="text-ink-500">{loading ? 'Obračunavamo…' : 'Obračun nije dostupan'}</span>}</div></div>
                {line && line.quantity !== item.quantity && <p className="mt-3 text-xs text-ink-600">Obračun po pakovanju: {line.quantity.toLocaleString('sr-RS')} {line.unit}.</p>}
                {key === invalidKey && <div role="alert" className="mt-3 text-sm text-red-700"><p>{quoteError} Ispravite ili uklonite ovu stavku da biste poslali ostatak korpe.</p><button type="button" disabled={submitting} onClick={() => removeItem(key)} className="mt-1 min-h-[44px] underline disabled:opacity-40">Ukloni ovu stavku</button><button type="button" onClick={refresh} className="ml-4 mt-1 min-h-[44px] underline">Ponovi obračun</button></div>}
              </div>
            </li>;
          })}
        </ul>
        {quoteError && !invalidKey && <div role="alert" className="mt-5 border border-ink-200 p-4 text-sm"><p>{quoteError}</p><p className="mt-2 text-ink-500">Proverite stavke i količine. Nevažeću stavku možete ukloniti iz korpe.</p><button type="button" onClick={refresh} className="mt-3 min-h-[44px] underline">Ponovi obračun</button></div>}
      </section>
      <aside aria-label="Obračun i kontakt" className="lg:sticky lg:top-24 lg:self-start">
        <h2 className="mb-5 text-xl font-normal">Pregled porudžbine</h2>
        {quote ? <QuoteTotals quote={quote} /> : <p role="status" className="text-sm text-ink-500">{loading || authLoading ? 'Proveravamo aktuelne cene i rabat…' : 'Obračun je potreban pre slanja porudžbine.'}</p>}
        {authError && <div role="alert" className="mt-5 text-sm"><p>{authError}</p><button type="button" onClick={() => void refreshCustomer()} className="min-h-[44px] underline">Ponovi proveru naloga</button></div>}
        {!authLoading && !customer ? <div className="mt-6 border border-ink-200 p-5"><h3 className="mb-2 text-base">10% rabata uz potvrđen mejl</h3><p className="mb-4 text-sm leading-relaxed text-ink-600">Prijavite se mejl linkom da pošaljete porudžbinu i pratite njen status. Stavke ostaju u korpi.</p><Link href="/nalog?returnTo=/korpa" className="btn-primary block text-center">Prijavi se i ostvari rabat</Link></div> : customer && <form onSubmit={submit} className="mt-8">
          <p className="mb-4 break-all text-xs text-ink-500">Nalog: {customer.email} · rabat {customer.discountPercent}%</p>
          <fieldset disabled={submitting} className="space-y-4 disabled:opacity-60"><legend className="mb-4 text-base">Kontakt za potvrdu</legend>
            <label className="block text-sm">Ime i prezime<input name="fullName" autoComplete="name" required maxLength={120} className={fieldClass} /></label>
            <label className="block text-sm">Telefon<input name="phone" type="tel" autoComplete="tel" required maxLength={40} className={fieldClass} /></label>
            <label className="block text-sm">Grad<input name="city" autoComplete="address-level2" required maxLength={100} className={fieldClass} /></label>
            <label className="block text-sm">Preuzimanje<select value={delivery} onChange={(event) => setDelivery(event.target.value as OrderContact['deliveryMethod'])} className={fieldClass}><option value="pickup">Lično preuzimanje po dogovoru</option><option value="delivery">Dostava po dogovoru</option></select></label>
            {delivery === 'delivery' && <label className="block text-sm">Adresa za dostavu<input name="address" autoComplete="street-address" required maxLength={250} className={fieldClass} /></label>}
            <label className="block text-sm">Firma (opciono)<input name="company" autoComplete="organization" maxLength={200} className={fieldClass} /></label>
            <label className="block text-sm">PIB (opciono)<input name="pib" inputMode="numeric" pattern="[0-9]{9}" title="PIB sadrži devet cifara." maxLength={9} className={fieldClass} /></label>
            <label className="block text-sm">Napomena (opciono)<textarea name="note" rows={3} maxLength={2000} className={fieldClass} /></label>
          </fieldset>
          {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={submitting || loading || !quote || authLoading} className="btn-primary mt-6 min-h-[48px] w-full disabled:cursor-not-allowed disabled:opacity-40">{submitting ? 'Čuvamo porudžbinu…' : 'Pošalji porudžbinu na potvrdu'}</button>
          <p className="mt-3 text-xs leading-relaxed text-ink-500">Kontakt podatke koristimo da potvrdimo i obradimo vašu porudžbinu.</p>
        </form>}
      </aside>
    </div>}
  </div>;
}
