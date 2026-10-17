import Link from 'next/link';
import type { CommerceOrder, CommerceQuote, OrderStatus } from '@/lib/commerce/types';
import { formatMoney } from './cart-state';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_confirmation: 'Čeka potvrdu prodaje',
  confirmed: 'Potvrđena',
  processing: 'U obradi',
  completed: 'Završena',
  cancelled: 'Otkazana',
};

export function QuoteTotals({ quote }: { quote: CommerceQuote }) {
  const allUnpriced = quote.lines.every((line) => line.unitPriceMinor === null);
  return <div className="border-t border-ink-200 pt-5">
    <div className="flex items-baseline justify-between gap-4"><span className="text-sm text-ink-700">{allUnpriced ? 'Iznos po ponudi' : quote.hasUnpricedItems ? 'Poznati deo iznosa' : 'Informativni iznos'}</span><strong className="text-xl font-medium text-ink-900">{allUnpriced ? 'Cena na upit' : formatMoney(quote.knownTotalMinor)}</strong></div>
    <p className="mt-2 text-xs text-ink-600">Obračunati rabat: {quote.discountPercent}%</p>
    {quote.hasUnpricedItems && <p className="mt-3 text-sm text-ink-700">Ovo nije ukupan iznos porudžbine. Stavke „Cena na upit” nisu uključene u zbir; vaš rabat primenjuje se pri izradi ponude.</p>}
    <p className="mt-3 text-xs leading-relaxed text-ink-500">Prodaja potvrđuje konačne cene, PDV, dostavu, rok i raspoloživost. Slanje porudžbine ne predstavlja naplatu.</p>
  </div>;
}

export default function OrderSummary({ order }: { order: CommerceOrder }) {
  return <article className="border border-ink-200 p-5 sm:p-8">
    <div className="flex flex-wrap justify-between gap-3 border-b border-ink-200 pb-5">
      <div><h2 className="text-xl font-normal">Porudžbina {order.orderNumber}</h2><p className="mt-2 text-sm text-ink-500">{new Date(order.createdAt).toLocaleString('sr-RS')}</p></div>
      <p className="text-sm text-ink-700">{ORDER_STATUS_LABELS[order.status]}</p>
    </div>
    <ul className="divide-y divide-ink-200">
      {order.quote.lines.map((line) => <li key={line.key} className="py-5">
        <div className="flex justify-between gap-4"><Link href={line.url} className="text-sm underline-offset-4 hover:underline">{line.name}</Link><span className="shrink-0 text-sm">{formatMoney(line.lineTotalMinor)}</span></div>
        <p className="mt-2 text-xs text-ink-500">Šifra: {line.sku} · {line.quantity.toLocaleString('sr-RS')} {line.unit} · {formatMoney(line.unitPriceMinor)}{line.unitPriceMinor !== null ? ` / ${line.unit}` : ''}</p>
      </li>)}
    </ul>
    <QuoteTotals quote={order.quote} />
    <div className="mt-6 border-t border-ink-200 pt-5 text-sm leading-relaxed text-ink-700">
      <p>{order.contact.fullName} · {order.contact.phone}</p>
      <p>{order.contact.city}{order.contact.address ? `, ${order.contact.address}` : ''}</p>
      <p>{order.contact.deliveryMethod === 'delivery' ? 'Dostava po dogovoru' : 'Lično preuzimanje po dogovoru'}</p>
      {order.contact.company && <p>{order.contact.company}{order.contact.pib ? ` · PIB ${order.contact.pib}` : ''}</p>}
      {order.note && <p className="mt-3 whitespace-pre-wrap">Napomena: {order.note}</p>}
    </div>
  </article>;
}
