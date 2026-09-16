import { createClient } from '../lib/supabase/client';

let clientInstance = null;

export const getAdminSupabase = () => {
  if (typeof window === 'undefined') return null;
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
};

export const supabase = typeof window !== 'undefined' ? createClient() : null;
