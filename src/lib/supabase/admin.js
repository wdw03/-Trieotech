import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gkskeljvgphslkzctjfp.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrc2tlbGp2Z3Boc2xremN0amZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODY3NzUzMSwiZXhwIjoyMTA0MjUzNTMxfQ.gq20-OF-t95J3xWz6I3oQ1_F5uwfP29g6FI-IM6bzGs';

// Service role client — ONLY for server-side operations
// This bypasses RLS and should NEVER be exposed to the browser
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

