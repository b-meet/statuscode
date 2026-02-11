import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        // Return a mock or handle build-time execution
        if (typeof window === 'undefined') return {} as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    return createBrowserClient(
        supabaseUrl || '',
        supabaseAnonKey || ''
    )
}
