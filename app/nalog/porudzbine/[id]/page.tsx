import type { Metadata } from 'next';
import AccountPageClient from '@/components/commerce/AccountPageClient';

export const metadata: Metadata = { title: 'Moja porudžbina | Podovi', robots: { index: false, follow: false } };

export default function CustomerOrderPage({ params }: { params: { id: string } }) {
  return <AccountPageClient orderId={params.id} />;
}
