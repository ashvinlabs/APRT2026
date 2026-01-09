import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Supabase URL or Anon Key is missing. Please check your .env.local file. ' +
        'Found: URL=' + (supabaseUrl ? 'exists' : 'MISSING') +
        ', Key=' + (supabaseAnonKey ? 'exists' : 'MISSING')
    );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
