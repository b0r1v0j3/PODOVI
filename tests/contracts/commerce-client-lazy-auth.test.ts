import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ loads: 0, token: '', signOut: [] as unknown[] }));
const client = vi.hoisted(() => ({
  auth: {
    getSession: async () => ({ data: { session: state.token ? { access_token: state.token } : null } }),
    signOut: async (options: unknown) => { state.signOut.push(options); state.token = ''; return { error: null }; },
  },
}));
vi.mock('@/lib/supabase/client', () => ({ getSupabaseOrNull: () => { state.loads++; return client; } }));

function browser({ pathname = '/', hash = '', search = '', storage = {} as Record<string, string> } = {}) {
  vi.stubGlobal('location', { pathname, hash, search });
  vi.stubGlobal('localStorage', { ...storage });
}

function respond(status: number, body: unknown) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const loadApi = () => import('@/components/commerce/api');

beforeEach(() => { vi.resetModules(); state.loads = 0; state.token = ''; state.signOut = []; });
afterEach(() => vi.unstubAllGlobals());

describe('lazy Supabase client for commerce requests', () => {
  it('keeps supabase out of every static client import on the layout and commerce path', () => {
    for (const file of ['lib/context/CommerceContext.tsx', 'components/commerce/api.ts', 'components/commerce/AccountPageClient.tsx', 'components/Header.tsx', 'app/layout.tsx']) {
      const source = readFileSync(path.resolve(__dirname, '../..', file), 'utf8');
      expect(source, file).not.toMatch(/^import[^;]*from ['"](@\/lib\/supabase\/client|@supabase\/supabase-js)['"]/m);
    }
  });

  it('sends a guest request without loading Supabase JS', async () => {
    browser();
    const fetchMock = respond(200, { ok: true });
    const { commerceRequest } = await loadApi();
    await commerceRequest('/quote', { method: 'POST', body: '{}' });
    expect(state.loads).toBe(0);
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization')).toBeNull();
  });

  it('loads the client and attaches the bearer token when a stored session exists', async () => {
    browser({ storage: { 'sb-127-auth-token': '{}', podovi_cart_v1: '[]' } });
    state.token = 'live-token';
    const fetchMock = respond(200, { ok: true });
    const { commerceRequest } = await loadApi();
    await commerceRequest('/session');
    expect(state.loads).toBe(1);
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer live-token');
  });

  it('treats only an auth token key, an auth callback URL or an earlier load as a possible session', async () => {
    const { mayHaveSession, isAuthTokenKey } = await loadApi();
    expect(isAuthTokenKey('sb-abc-auth-token')).toBe(true);
    for (const key of ['sb-abc-auth-token-code-verifier', 'podovi_cart_v1', null]) expect(isAuthTokenKey(key)).toBe(false);
    browser({ pathname: '/proizvodi/schonox-zm', search: '?color=oak' });
    expect(mayHaveSession()).toBe(false);
    browser({ pathname: '/nalog' });
    expect(mayHaveSession()).toBe(false);
    browser({ pathname: '/nalog/potvrda', search: '?returnTo=/korpa' });
    expect(mayHaveSession()).toBe(true);
    browser({ pathname: '/', hash: '#access_token=abc&refresh_token=def' });
    expect(mayHaveSession()).toBe(true);
  });

  it('drops a token the server rejects so the next quote is a guest quote', async () => {
    browser({ storage: { 'sb-127-auth-token': '{}' } });
    state.token = 'revoked-token';
    respond(401, { error: 'Prijava je istekla. Prijavite se ponovo.', code: 'AUTH_REQUIRED' });
    const { commerceRequest } = await loadApi();
    await expect(commerceRequest('/quote', { method: 'POST', body: '{}' })).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
    expect(state.signOut).toEqual([{ scope: 'local' }]);
    const fetchMock = respond(200, { ok: true });
    await commerceRequest('/quote', { method: 'POST', body: '{}' });
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization')).toBeNull();
  });

  it('does not sign out when the request carried no token', async () => {
    browser({ storage: { 'sb-127-auth-token': '{}' } });
    respond(401, { error: 'Prijavite se da biste nastavili.', code: 'AUTH_REQUIRED' });
    const { commerceRequest } = await loadApi();
    await expect(commerceRequest('/orders', { method: 'POST', body: '{}' })).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
    expect(state.signOut).toEqual([]);
  });

  it('reports a dropped connection in Serbian and passes aborts through', async () => {
    browser();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const { commerceRequest, CommerceApiError } = await loadApi();
    const failure = await commerceRequest<never>('/orders').catch((error: Error) => error);
    expect(failure).toBeInstanceOf(CommerceApiError);
    expect(failure).toMatchObject({ code: 'NETWORK', status: 0 });
    expect(failure.message).toContain('Proverite internet');
    const abort = new DOMException('Aborted', 'AbortError');
    vi.stubGlobal('fetch', vi.fn(async () => { throw abort; }));
    await expect(commerceRequest('/quote')).rejects.toBe(abort);
  });

  it('carries the rejected cart line key from the server error', async () => {
    browser();
    respond(400, { error: 'Proizvod više nije u ponudi.', code: 'PRODUCT_NOT_FOUND', lineKey: 'stari-proizvod:' });
    const { commerceRequest } = await loadApi();
    await expect(commerceRequest('/quote', { method: 'POST', body: '{}' })).rejects.toMatchObject({ lineKey: 'stari-proizvod:', code: 'PRODUCT_NOT_FOUND' });
  });
});

describe('auth events only refresh the customer when the identity changes', () => {
  function subscribe(watch: (client: any, onChange: () => void) => unknown) {
    let emit: (event: string, session: unknown) => void = () => undefined;
    const fake = { auth: { onAuthStateChange: (callback: typeof emit) => { emit = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; } } };
    const onChange = vi.fn();
    watch(fake, onChange);
    return { emit, onChange };
  }
  const user = (id: string) => ({ user: { id, email: `${id}@example.com`, email_confirmed_at: '2026-10-17T10:00:00Z' } });

  it('makes one refresh per page load and none on token refresh or tab refocus', async () => {
    const { watchCustomerIdentity } = await loadApi();
    const { emit, onChange } = subscribe(watchCustomerIdentity);
    emit('SIGNED_IN', user('a'));
    emit('INITIAL_SESSION', user('a'));
    emit('TOKEN_REFRESHED', user('a'));
    emit('SIGNED_IN', user('a'));
    expect(onChange).toHaveBeenCalledTimes(1);
    emit('USER_UPDATED', user('a'));
    expect(onChange).toHaveBeenCalledTimes(2);
    emit('SIGNED_IN', user('b'));
    expect(onChange).toHaveBeenCalledTimes(3);
    emit('SIGNED_OUT', null);
    expect(onChange).toHaveBeenCalledTimes(4);
  });

  it('still ends the loading state for a signed-out first event', async () => {
    const { watchCustomerIdentity } = await loadApi();
    const { emit, onChange } = subscribe(watchCustomerIdentity);
    emit('INITIAL_SESSION', null);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
