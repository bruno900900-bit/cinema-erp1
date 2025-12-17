// Supabase client configuration for the frontend (cinema-erp)
// This file was updated to prevent AUTH TIMEOUT errors caused by waiting for URL session detection.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// -----------------------------------------------------------------------------
// Configuration values – can be overridden by Vite environment variables.
// -----------------------------------------------------------------------------
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required env vars early – this will surface a clear error during dev/build
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.\nConfigure them in Cloudflare Pages > Settings > Environment Variables.'
  );
  throw new Error('Supabase configuration missing');
}

// -----------------------------------------------------------------------------
// Create the Supabase client with an optimized auth configuration.
// -----------------------------------------------------------------------------
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      // Keep the session alive across page reloads.
      persistSession: true,
      // Refresh the JWT automatically before it expires.
      autoRefreshToken: true,
      // Do NOT try to read a session from the URL – this prevents the 10‑second
      // timeout that appears when the app starts without a `?access_token=` param.
      detectSessionInUrl: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'cinema-erp-frontend',
      },
    },
  }
);

/**
 * Initialise Supabase and ensure the session is restored before the rest of the
 * application starts. Call this once (e.g. in `main.tsx`) and await the promise.
 */
export async function initSupabase(): Promise<SupabaseClient> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Supabase session restore error:', error);
    } else if (data?.session) {
      console.log('✅ Supabase session restored – user:', data.session.user.id);
    } else {
      console.log('ℹ️ No Supabase session found – user not logged in');
    }
  } catch (e) {
    console.error('❌ Unexpected error while restoring Supabase session:', e);
  }
  return supabase;
}

// Export URL and key for any modules that need direct access.
export { SUPABASE_URL, SUPABASE_ANON_KEY };

// Export default for legacy imports.
export default supabase;
