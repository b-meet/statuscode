import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
    if (client) return client;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        if (typeof window === 'undefined') return {} as any;
    }

    client = createBrowserClient(
        supabaseUrl || '',
        supabaseAnonKey || ''
    );

    return client;
}
