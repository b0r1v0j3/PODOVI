import type { CommerceQuote } from '@/lib/commerce/types';

export class CommerceApiError extends Error {
  constructor(message: string, public status: number, public code?: string, public quote?: CommerceQuote, public lineKey?: string) {
    super(message);
  }
}

const networkError = () => new CommerceApiError('Veza sa serverom je prekinuta. Proverite internet i pokušajte ponovo.', 0, 'NETWORK');

// supabase-js (~45 KB gz) loads on demand, so guests on normal pages download none of it.
let supabaseLoad: Promise<any> | null = null;
export const loadSupabase = () => (supabaseLoad ??= import('@/lib/supabase/client').then((module) => module.getSupabaseOrNull(), () => {
  supabaseLoad = null; // a failed chunk download must not stick; the next call retries it
  throw networkError();
}));
export const isAuthTokenKey = (key: string | null) => /^sb-.+-auth-token$/.test(key ?? '');

export function mayHaveSession() {
  if (supabaseLoad) return true;
  try { if (Object.keys(localStorage).some(isAuthTokenKey)) return true; } catch { /* storage blocked: only the URL can carry a session */ }
  return location.pathname === '/nalog/potvrda' || /access_token=/.test(location.hash);
}

export const sessionClient = async () => (mayHaveSession() ? loadSupabase() : null);

// Refresh only when the signed-in identity changes: refocus SIGNED_IN, TOKEN_REFRESHED and INITIAL_SESSION for the same user must not clear the cart form.
export function watchCustomerIdentity(client: any, onChange: () => void): { unsubscribe(): void } {
  let lastKey: string | undefined; // undefined, so a signed-out first event still ends authLoading
  return client.auth.onAuthStateChange((event: string, session: { user?: { id: string; email?: string; email_confirmed_at?: string } } | null) => {
    const user = session?.user;
    const key = user ? `${user.id}:${user.email ?? ''}:${user.email_confirmed_at ?? ''}` : '';
    if (key === lastKey && event !== 'USER_UPDATED') return;
    lastKey = key;
    onChange();
  }).data.subscription;
}

export async function commerceRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const client = await sessionClient();
  const session = client ? await client.auth.getSession() : null;
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  const token = session?.data?.session?.access_token;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`/api/commerce${path}`, { ...options, headers, cache: 'no-store' }).catch((cause) => {
    if ((cause as Error)?.name === 'AbortError') throw cause; // callers ignore their own aborts
    throw networkError();
  });
  const data = await response.json().catch(() => null);
  // A rejected token (revoked on another device, expired) is unrecoverable: drop it locally so guest cart and quotes work again.
  if (token && data?.code === 'AUTH_REQUIRED') await client.auth.signOut({ scope: 'local' });
  if (!response.ok) throw new CommerceApiError(data?.error || 'Zahtev nije uspeo. Pokušajte ponovo.', response.status, data?.code, data?.quote, data?.lineKey);
  if (!data) throw new Error('Odgovor nije dostupan. Pokušajte ponovo.');
  return data as T;
}
