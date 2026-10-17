import type { Metadata } from 'next';
import AccountPageClient from '@/components/commerce/AccountPageClient';
import { safeAccountReturn } from '@/components/commerce/cart-state';

export const metadata: Metadata = { title: 'Moj nalog | Podovi', robots: { index: false, follow: false } };

export default function AccountPage({ searchParams }: { searchParams?: { returnTo?: string } }) {
  return <AccountPageClient returnTo={safeAccountReturn(searchParams?.returnTo)} />;
}
