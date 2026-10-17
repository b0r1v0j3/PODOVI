'use client';

import { useEffect, useState } from 'react';
import type { CartItemInput, CommerceQuote } from '@/lib/commerce/types';
import { useCommerce } from '@/lib/context/CommerceContext';
import { commerceRequest, CommerceApiError } from './api';

export function useQuote(items: CartItemInput[], enabled = true) {
  const { customer, authLoading } = useCommerce();
  const signature = JSON.stringify([items, customer?.id, customer?.discountPercent]);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ signature: string; revision: number; quote: CommerceQuote | null; error: string; errorLineKey?: string }>({ signature: '', revision: -1, quote: null, error: '' });
  const ready = enabled && !authLoading && items.length > 0;

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      commerceRequest<CommerceQuote>('/quote', { method: 'POST', body: JSON.stringify({ items: JSON.parse(signature)[0] }), signal: controller.signal })
        .then((quote) => {
          if (!controller.signal.aborted) setState({ signature, revision, quote, error: '' });
        })
        .catch((error) => {
          if (!controller.signal.aborted) setState({ signature, revision, quote: null, error: error instanceof Error ? error.message : 'Obračun nije dostupan.', errorLineKey: error instanceof CommerceApiError ? error.lineKey : undefined });
        });
    }, 200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [signature, revision, ready]);

  const current = ready && state.signature === signature && state.revision === revision;
  return {
    quote: current ? state.quote : null,
    error: current ? state.error : '',
    /** cartLineKey of the one line the server rejected, when it named one. */
    errorLineKey: current ? state.errorLineKey : undefined,
    loading: ready && !current,
    refresh: () => setRevision((value) => value + 1),
  };
}
