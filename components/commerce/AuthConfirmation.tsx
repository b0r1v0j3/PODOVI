'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCommerce } from '@/lib/context/CommerceContext';
import { safeAccountReturn } from './cart-state';

export default function AuthConfirmation() {
  const { customer, authLoading, authError, refreshCustomer } = useCommerce();
  const router = useRouter();
  const [linkError, setLinkError] = useState('');
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.has('error') || new URLSearchParams(window.location.search).has('error')) {
      setLinkError('Link je istekao ili nije ispravan. Zatražite novi link za prijavu.');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);
  useEffect(() => {
    if (customer && !authLoading) router.replace(safeAccountReturn(new URLSearchParams(window.location.search).get('returnTo')));
  }, [customer, authLoading, router]);
  return <div className="container max-w-xl py-16"><p className="eyebrow mb-3">Potvrda mejla</p><h1 className="mb-5 text-3xl font-normal">{customer ? 'Nalog je potvrđen.' : 'Prijava u vaš nalog'}</h1>
    {authLoading ? <p role="status">Proveravamo link i vaš rabat…</p> : !customer && <><p role="alert" className="text-sm text-ink-600">{linkError || authError || 'Prijava nije potvrđena. Ako je link već iskorišćen ili istekao, zatražite novi.'}</p><div className="mt-6 flex flex-wrap gap-4"><Link href="/nalog?returnTo=/korpa" className="btn-primary">Zatraži novi link</Link><button type="button" onClick={() => void refreshCustomer()} className="btn-secondary">Proveri ponovo</button></div></>}
  </div>;
}
