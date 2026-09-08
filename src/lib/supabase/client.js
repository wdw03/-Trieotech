import { createBrowserClient } from '@supabase/ssr';

let client = null;

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gkskeljvgphslkzctjfp.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrc2tlbGp2Z3Boc2xremN0amZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2Nzc1MzEsImV4cCI6MjEwNDI1MzUzMX0.Ivn1_8l1j_6HM46-NcKELDIVZk5L2COUNKGmA8kIOr4';

export function createClient() {
  if (client) return client;

  client = createBrowserClient(supabaseUrl, supabaseAnonKey);

  return client;
}

