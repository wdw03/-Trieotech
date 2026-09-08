import { createClient } from '@supabase/supabase-js';

// Service role client — ONLY for server-side operations
// This bypasses RLS and should NEVER be exposed to the browser
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
