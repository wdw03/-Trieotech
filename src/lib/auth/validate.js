import { createClient } from '../supabase/server';
import { supabaseAdmin } from '../supabase/admin';

/**
 * Get authenticated user from cookie session or request Authorization header.
 * Returns { user, supabase, profile }.
 */
export async function getAuthenticatedUser(request) {
  let user = null;
  let supabase = null;

  try {
    supabase = await createClient();
    const { data: { user: cookieUser }, error } = await supabase.auth.getUser();
    if (!error && cookieUser) {
      user = cookieUser;
    }
  } catch (_) {}

  // Fallback: Check Bearer token from request Authorization header
  if (!user && request) {
    const authHeader = request.headers?.get('Authorization') || request.headers?.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { data: { user: tokenUser } } = await supabaseAdmin.auth.getUser(token);
        if (tokenUser) {
          user = tokenUser;
        }
      } catch (_) {}
    }
  }

  if (!user) {
    return { user: null, supabase, profile: null };
  }

  // Fetch profile data safely
  let profile = null;
  try {
    const client = supabase || supabaseAdmin;
    const { data: p } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    profile = p;
  } catch (_) {}

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
