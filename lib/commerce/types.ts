export interface CartLineInput {
  productSlug: string;
  variantSlug?: string;
  quantity: number;
}

export type CartItemInput = CartLineInput;

export interface CommerceCustomer {
  id: string;
  email: string;
  discountPercent: number;
}

export interface CommerceQuoteLine extends CartLineInput {
  key: string;
  name: string;
  sku: string;
  image: string;
  url: string;
  unit: string;
  listUnitPriceMinor: number | null;
  discountPercent: number;
  unitPriceMinor: number | null;
  lineTotalMinor: number | null;
}

export interface CommerceQuote {
  lines: CommerceQuoteLine[];
  discountPercent: number;
  knownTotalMinor: number;
  hasUnpricedItems: boolean;
  currency: 'RSD';
  requiresConfirmation: true;
  quoteKey: string;
}

export const ORDER_STATUSES = ['pending_confirmation', 'confirmed', 'processing', 'completed', 'cancelled'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export interface OrderContact {
  fullName: string;
  phone: string;
  city: string;
  address?: string;
  company?: string;
  pib?: string;
  deliveryMethod: 'pickup' | 'delivery';
}

export type OrderEmailStatus = 'pending' | 'sent' | 'failed' | 'not_configured';

export interface CommerceOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  contact: OrderContact;
  note: string;
  quote: CommerceQuote;
  emailStatus: OrderEmailStatus;
}
