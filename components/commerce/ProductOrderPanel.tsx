'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCommerce } from '@/lib/context/CommerceContext';
import { formatMoney, isValidQuantity, MAX_QUANTITY, selectedCartItem } from './cart-state';
import { useQuote } from './useQuote';

interface ProductOrderPanelProps {
  productSlug: string;
  variantSlug?: string | null;
  requiresVariant?: boolean;
  unit?: string;
  /** Pattern-group collections have no concrete variant the server can quote, so they are ordered by inquiry. */
  inquiryOnly?: boolean;
}

export default function ProductOrderPanel({ productSlug, variantSlug, requiresVariant = false, unit, inquiryOnly = false }: ProductOrderPanelProps) {
  const { addItem, customer, authLoading, hydrated } = useCommerce();
  const [quantity, setQuantity] = useState('1');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const item = inquiryOnly ? null : selectedCartItem(productSlug, variantSlug, requiresVariant, Number(quantity));
  const { quote, loading, error: quoteError, refresh } = useQuote(item ? [item] : []);
  const line = quote?.lines[0];
  const needsVariant = requiresVariant && !variantSlug;

  useEffect(() => { setMessage(''); setError(''); }, [productSlug, variantSlug, quantity]);

  function addToCart(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item || !quote) return;
    try {
      addItem(item);
      setMessage('Dodato u korpu.');
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Dodavanje nije uspelo.');
    }
  }

  // Keeps the #product-order anchor for the mobile sticky CTA.
  if (inquiryOnly) return (
    <section id="product-order" aria-label="Poručivanje proizvoda" className="my-6 border-y border-ink-200 py-6 scroll-mt-24">
      <p className="text-sm text-ink-700">Ova kolekcija se poručuje preko upita — u upitu navedite željene varijante i količinu.</p>
    </section>
  );

  return (
    <section id="product-order" aria-label="Poručivanje proizvoda" className="my-6 border-y border-ink-200 py-6 scroll-mt-24">
      {needsVariant ? (
        <p className="text-sm text-ink-700">Izaberite konkretnu boju ili varijantu za cenu i dodavanje u korpu.</p>
      ) : (
        <div aria-live="polite" className="mb-4">
          {line ? <>
            {line.discountPercent > 0 && line.listUnitPriceMinor !== null && <p className="text-xs text-ink-500"><span className="line-through">{formatMoney(line.listUnitPriceMinor)}</span> · rabat {line.discountPercent}%</p>}
            <p className="text-xl text-ink-900">{formatMoney(line.unitPriceMinor)}{line.unitPriceMinor !== null ? ` / ${line.unit}` : ''}</p>
            {line.unitPriceMinor === null && customer && <p className="mt-1 text-xs text-ink-600">Vaš rabat od {line.discountPercent}% primenjuje se u ponudi prodaje.</p>}
            {line.quantity !== Number(quantity) && <p className="mt-1 text-xs text-ink-600">Obračun po pakovanju: {line.quantity.toLocaleString('sr-RS')} {line.unit}.</p>}
          </> : <p className="text-sm text-ink-500">{loading || authLoading ? 'Proveravamo cenu…' : quoteError || 'Unesite količinu za obračun.'}</p>}
          {quoteError && <button type="button" onClick={refresh} className="mt-2 min-h-[44px] text-sm underline">Ponovi obračun</button>}
        </div>
      )}
      {!customer && !authLoading && <p className="my-3 text-xs text-ink-600"><Link href="/nalog?returnTo=/korpa" className="underline underline-offset-4">Potvrdite mejl za 10% rabata.</Link> Korpu možete pripremiti pre prijave.</p>}
      <form onSubmit={addToCart} className="mt-4 flex items-end gap-3">
        <label className="block w-28 shrink-0 text-xs text-ink-600">
          Količina{line?.unit || unit ? ` (${line?.unit || unit})` : ''}
          <input type="number" name="quantity" min="0.001" max={MAX_QUANTITY} step="0.001" required value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-2 min-h-[44px] w-full border border-ink-300 bg-white px-3 text-base text-ink-900 focus:outline-ink-900" />
        </label>
        <button type="submit" disabled={!hydrated || !item || !quote || loading || authLoading} className="btn-primary min-h-[44px] flex-1 disabled:cursor-not-allowed disabled:opacity-40">Dodaj u korpu</button>
      </form>
      {quantity && !isValidQuantity(Number(quantity)) && <p role="alert" className="mt-2 text-xs text-red-700">Količina mora biti veća od nule, sa najviše tri decimale.</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      <p role="status" className="mt-3 text-sm text-ink-700">{message && <>{message} <Link href="/korpa" className="underline underline-offset-4">Otvori korpu →</Link></>}</p>
      <p className="mt-3 text-xs leading-relaxed text-ink-500">Porudžbinu potvrđuje Podovi prodaja. Cene su informativne; konačna ponuda potvrđuje PDV, dostavu i raspoloživost. Bez online plaćanja.</p>
    </section>
  );
}
