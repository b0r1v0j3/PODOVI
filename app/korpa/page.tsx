import type { Metadata } from 'next';
import CartPageClient from '@/components/commerce/CartPageClient';

export const metadata: Metadata = { title: 'Korpa | Podovi', robots: { index: false, follow: false } };

export default function CartPage() {
  return <CartPageClient />;
}
