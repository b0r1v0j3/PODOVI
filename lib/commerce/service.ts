import { CommerceError } from './errors';
import { buildQuote, payloadHash, validateCartItems } from './pricing';
import { resolveCommerceLine } from './catalog';
import { createOrder, getIdempotentOrder, setEmailStatus } from './repository';
import { sendOrderEmail } from './email';
import type { CommerceCustomer, CommerceQuote, OrderContact } from './types';

function field(value: unknown, label: string, max: number, required = false, multiline = false) {
  if (value === undefined || value === null) {
    if (required) throw new CommerceError(`Unesite ${label}.`);
    return '';
  }
  // Only the note may span lines; elsewhere a line break could fake extra fields in the plain-text staff email.
  const forbidden = multiline ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/ : /[\u0000-\u0008\u000a-\u001f\u0085\u2028\u2029]/;
  if (typeof value !== 'string' || value.length > max || forbidden.test(value)) {
    throw new CommerceError(`Polje „${label}” nije ispravno.`);
  }
  const result = value.trim();
  if (required && !result) throw new CommerceError(`Unesite ${label}.`);
  return result;
}

export function validateOrderContact(value: unknown): OrderContact {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new CommerceError('Unesite podatke za kontakt.');
  const raw = value as Record<string, unknown>;
  const deliveryMethod = raw.deliveryMethod;
  if (deliveryMethod !== 'pickup' && deliveryMethod !== 'delivery') throw new CommerceError('Izaberite način preuzimanja.');
  const contact: OrderContact = { fullName: field(raw.fullName, 'ime i prezime', 120, true),
    phone: field(raw.phone, 'telefon', 40, true), city: field(raw.city, 'mesto', 120, true), deliveryMethod,
    address: field(raw.address, 'adresu', 250, deliveryMethod === 'delivery'), company: field(raw.company, 'firmu', 200), pib: field(raw.pib, 'PIB', 9) };
  if (!/^[+\d ()/.-]{6,40}$/.test(contact.phone)) throw new CommerceError('Unesite ispravan broj telefona.');
  if (contact.pib && !/^\d{9}$/.test(contact.pib)) throw new CommerceError('PIB mora da sadrži devet cifara.');
  return contact;
}

export function quoteCart(items: unknown, customer: CommerceCustomer | null) {
  return buildQuote(validateCartItems(items), customer?.discountPercent ?? 0, resolveCommerceLine);
}

export class QuoteChangedError extends CommerceError {
  constructor(public quote: CommerceQuote) {
    super('Obračun je promenjen. Pregledajte novu cenu i ponovo pošaljite porudžbinu.', 409, 'QUOTE_CHANGED');
  }
}

export async function submitOrder(body: Record<string, unknown>, customer: CommerceCustomer) {
  const items = validateCartItems(body.items);
  const contact = validateOrderContact(body.contact);
  const note = field(body.note, 'napomenu', 2000, false, true);
  const idempotencyKey = field(body.idempotencyKey, 'ključ slanja', 128, true);
  const quoteKey = field(body.quoteKey, 'obračun', 64, true);
  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(idempotencyKey) || !/^[0-9a-f]{64}$/.test(quoteKey)) {
    throw new CommerceError('Osvežite korpu pre slanja porudžbine.');
  }
  const requestHash = payloadHash({ items, contact, note, quoteKey });
  const existing = await getIdempotentOrder(customer.id, idempotencyKey, requestHash);
  if (existing) return { order: existing, emailStatus: existing.emailStatus };
  const quote = await quoteCart(items, customer);
  if (quote.quoteKey !== quoteKey) throw new QuoteChangedError(quote);
  const saved = await createOrder({ customerId: customer.id, customerEmail: customer.email, idempotencyKey, requestHash, contact, note, quote });
  if (!saved.created) return { order: saved.order, emailStatus: saved.order.emailStatus };
  let emailStatus: typeof saved.order.emailStatus = 'failed';
  try { emailStatus = await sendOrderEmail(saved.order); } catch { /* The committed order survives a mail failure. */ }
  try { await setEmailStatus(saved.order.id, emailStatus); } catch { /* Delivery reporting must not undo a committed order. */ }
  return { order: { ...saved.order, emailStatus }, emailStatus };
}
