import { createClient } from '@supabase/supabase-js';

type SupabaseClientInstance = any;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let browserClient: SupabaseClientInstance | null = null;
let serverClient: SupabaseClientInstance | null = null;

export function hasSupabaseAnonConfig() {
    return Boolean(supabaseUrl && supabaseAnonKey);
}

export function hasSupabaseServiceRoleConfig() {
    return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

export function getSupabase() {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.');
    }

    if (!browserClient) {
        browserClient = createClient(supabaseUrl, supabaseAnonKey);
    }

    return browserClient;
}

export function getSupabaseOrNull() {
    return hasSupabaseAnonConfig() ? getSupabase() : null;
}

// Client-side Supabase client (uses anon key, respects RLS)
export const supabase = new Proxy({} as SupabaseClientInstance, {
    get(_target, prop, receiver) {
        const client = getSupabase();
        const value = Reflect.get(client as object, prop, receiver);
        return typeof value === 'function' ? value.bind(client) : value;
    },
});

// Server-side Supabase client (uses service_role key, bypasses RLS)
// Only use in server components, API routes, and scripts
export function getServerSupabase() {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    }

    if (!serverClient) {
        serverClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    }

    return serverClient;
}
