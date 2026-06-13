import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { isValidSessionToken, CENOVNIK_COOKIE } from '@/lib/cenovnik/auth';
import { loadPriceEntryTree } from '@/lib/cenovnik/tree';
import { VAT_RATE } from '@/lib/cenovnik/vat';
import PriceLoginForm from './PriceLoginForm';
import PriceEntryTable from './PriceEntryTable';

export const metadata: Metadata = {
  title: 'Unos cena — Podovi',
  robots: { index: false, follow: false },
};

// Čitamo kolačić sesije, pa stranica mora biti dinamička.
export const dynamic = 'force-dynamic';

export default async function CenovnikPage() {
  const token = cookies().get(CENOVNIK_COOKIE)?.value;

  if (!isValidSessionToken(token)) {
    return <PriceLoginForm />;
  }

  const tree = await loadPriceEntryTree();

  return <PriceEntryTable tree={tree} vatPercent={Math.round(VAT_RATE * 100)} />;
}
