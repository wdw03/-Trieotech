import { createClient } from '../supabase/server';

/**
 * Get authenticated user from the request.
 * Returns { user, supabase } if authenticated, throws if not.
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, supabase, profile: null };
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { user, supabase, profile };
}

/**
 * Require authentication — returns NextResponse 401 if not authenticated
 */
export async function requireAuth() {
  const { user, supabase, profile } = await getAuthenticatedUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  return { user, supabase, profile };
}
