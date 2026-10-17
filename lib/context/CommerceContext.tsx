'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { CartItemInput, CommerceCustomer } from '@/lib/commerce/types';
import { addCartItem, CART_STORAGE_KEY, cartLineKey, isValidQuantity, parseStoredCart, subtractOrderedItems } from '@/components/commerce/cart-state';
import { commerceRequest, isAuthTokenKey, loadSupabase, mayHaveSession, sessionClient, watchCustomerIdentity } from '@/components/commerce/api';

interface CommerceContextValue {
  items: CartItemInput[];
  hydrated: boolean;
  count: number;
  customer: CommerceCustomer | null;
  authLoading: boolean;
  authError: string;
  storageError: string;
  addItem: (item: CartItemInput) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  completeOrder: (submitted: CartItemInput[]) => void;
  refreshCustomer: () => Promise<CommerceCustomer | null>;
  signOut: () => Promise<void>;
}

const CommerceContext = createContext<CommerceContextValue | undefined>(undefined);

export function CommerceProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemInput[]>([]);
  const itemsRef = useRef<CartItemInput[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [customer, setCustomer] = useState<CommerceCustomer | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [storageError, setStorageError] = useState('');
  const sessionRequest = useRef(0);

  const saveItems = useCallback((next: CartItemInput[]) => {
    itemsRef.current = next;
    setItems(next);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
      setStorageError('');
    } catch {
      setStorageError('Pregledač ne može da sačuva korpu. Ostavite ovu stranicu otvorenu dok završavate porudžbinu.');
    }
  }, []);

  useEffect(() => {
    try {
      const stored = parseStoredCart(localStorage.getItem(CART_STORAGE_KEY));
      itemsRef.current = stored;
      setItems(stored);
    } catch {
      setStorageError('Čuvanje korpe nije dostupno u ovom pregledaču.');
    }
    setHydrated(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY && event.key !== null) return;
      const next = parseStoredCart(event.newValue);
      itemsRef.current = next;
      setItems(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const refreshCustomer = useCallback(async () => {
    const requestId = ++sessionRequest.current;
    setAuthLoading(true);
    setCustomer(null);
    setAuthError('');
    try {
      const client = await sessionClient();
      const session = client ? await client.auth.getSession() : null;
      const result = session?.data?.session?.access_token
        ? await commerceRequest<{ customer: CommerceCustomer | null }>('/session')
        : { customer: null };
      if (requestId === sessionRequest.current) setCustomer(result.customer);
      return requestId === sessionRequest.current ? result.customer : null;
    } catch (error) {
      if (requestId === sessionRequest.current) setAuthError(error instanceof Error ? error.message : 'Provera naloga nije uspela.');
      return null;
    } finally {
      if (requestId === sessionRequest.current) setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe(): void } | undefined;
    const start = async () => {
      const client = await loadSupabase().catch(() => null);
      if (!active || subscription) return;
      if (!client) { void refreshCustomer(); return; } // no config, or the chunk failed and refreshCustomer reports it with a retry
      // The first auth event (SIGNED_IN or INITIAL_SESSION) is the single initial session check.
      subscription = watchCustomerIdentity(client, () => {
        // Supabase auth callbacks must return before requesting the session again.
        ++sessionRequest.current;
        setCustomer(null);
        setAuthLoading(true);
        window.setTimeout(() => { void refreshCustomer(); }, 0);
      });
    };
    if (mayHaveSession()) void start(); else void refreshCustomer();
    // A guest tab has no Supabase client yet, so pick up a sign-in finished in another tab.
    const onAuthStorage = (event: StorageEvent) => { if (isAuthTokenKey(event.key) && event.newValue) void start(); };
    window.addEventListener('storage', onAuthStorage);
    return () => {
      active = false;
      ++sessionRequest.current;
      subscription?.unsubscribe();
      window.removeEventListener('storage', onAuthStorage);
    };
  }, [refreshCustomer]);

  const addItem = useCallback((item: CartItemInput) => saveItems(addCartItem(itemsRef.current, item)), [saveItems]);
  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (!isValidQuantity(quantity)) throw new Error('Unesite količinu veću od nule, sa najviše tri decimale.');
    saveItems(itemsRef.current.map((item) => cartLineKey(item) === key ? { ...item, quantity } : item));
  }, [saveItems]);
  const removeItem = useCallback((key: string) => saveItems(itemsRef.current.filter((item) => cartLineKey(item) !== key)), [saveItems]);
  const clearCart = useCallback(() => saveItems([]), [saveItems]);
  const completeOrder = useCallback((submitted: CartItemInput[]) => saveItems(subtractOrderedItems(itemsRef.current, submitted)), [saveItems]);
  const signOut = useCallback(async () => {
    // Local scope: signing out here must not revoke the customer's sessions on other devices.
    const result = await (await loadSupabase())?.auth.signOut({ scope: 'local' });
    if (result?.error) throw new Error('Odjava nije uspela. Pokušajte ponovo.');
    await refreshCustomer();
  }, [refreshCustomer]);

  return <CommerceContext.Provider value={{ items, hydrated, count: items.length, customer, authLoading, authError, storageError, addItem, updateQuantity, removeItem, clearCart, completeOrder, refreshCustomer, signOut }}>{children}</CommerceContext.Provider>;
}

export function useCommerce() {
  const context = useContext(CommerceContext);
  if (!context) throw new Error('CommerceProvider is required.');
  return context;
}
