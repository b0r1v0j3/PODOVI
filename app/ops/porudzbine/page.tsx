import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { NextRequest } from 'next/server';
import { requireCommerceStaff } from '@/lib/commerce/auth';
import StaffOrdersClient from '@/components/commerce/StaffOrdersClient';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const metadata: Metadata = { title: 'Porudžbine | Podovi prodaja', robots: { index: false, follow: false } };

export default async function StaffOrdersPage() {
  try {
    await requireCommerceStaff(new NextRequest('https://www.podovi.online/ops/porudzbine', { headers: new Headers(headers()) }));
  } catch {
    notFound();
  }
  return <StaffOrdersClient />;
}
