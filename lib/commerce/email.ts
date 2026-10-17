import nodemailer from 'nodemailer';
import type { CommerceOrder, OrderEmailStatus } from './types';

export function escapeOrderHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));
}

export function orderEmailText(order: CommerceOrder) {
  const lines = order.quote.lines.map((line) => `${line.name} (${line.sku}) — ${line.quantity} ${line.unit}: ${line.lineTotalMinor === null ? 'Cena na upit' : `${(line.lineTotalMinor / 100).toFixed(2)} RSD`}`);
  const allUnpriced = order.quote.lines.every((line) => line.lineTotalMinor === null);
  return [
    `Porudžbina ${order.orderNumber} — zahtev za potvrdu Podovi prodaje`,
    'Porudžbina je primljena. Nema naplate. Prodaja potvrđuje cene, PDV, dostavu i raspoloživost.',
    ...lines, allUnpriced ? 'Iznos: Cena na upit (po ponudi)' : `Poznati informativni zbir: ${(order.quote.knownTotalMinor / 100).toFixed(2)} RSD`,
    ...(order.quote.hasUnpricedItems && !allUnpriced ? ['Zbir ne uključuje stavke sa cenom na upit.'] : []),
    `Rabat: ${order.quote.discountPercent}%`,
    `Kupac: ${order.contact.fullName}`, `Mejl: ${order.customerEmail}`, `Telefon: ${order.contact.phone}`,
    `Mesto: ${order.contact.city}`, `Adresa: ${order.contact.address || '—'}`,
    `Firma: ${order.contact.company || '—'}`, `PIB: ${order.contact.pib || '—'}`,
    `Preuzimanje: ${order.contact.deliveryMethod === 'pickup' ? 'Lično preuzimanje' : 'Dostava uz potvrdu'}`,
    // Indent continuation lines so a note can't pass for a real field line.
    `Napomena: ${(order.note || '—').replace(/\r\n?|[\n\u0085\u2028\u2029]/g, '\n  ')}`,
  ].join('\n');
}

export async function sendOrderEmail(order: CommerceOrder): Promise<OrderEmailStatus> {
  if (!process.env.GMAIL_APP_PASSWORD) return 'not_configured';
  const user = process.env.GMAIL_USER || 'podovidoo@gmail.com';
  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass: process.env.GMAIL_APP_PASSWORD },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 });
  const text = orderEmailText(order);
  const results = await Promise.allSettled([process.env.ADMIN_EMAIL || 'podovidoo@gmail.com', order.customerEmail].map((to) =>
    transporter.sendMail({ from: `Podovi <${user}>`, to, subject: `Podovi — primljen zahtev ${order.orderNumber}`, text,
      html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeOrderHtml(text)}</div>` })));
  return results.every((result) => result.status === 'fulfilled') ? 'sent' : 'failed';
}
