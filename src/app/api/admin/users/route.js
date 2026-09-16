export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// GET: Fetch all users from Supabase with roles & search support
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = (searchParams.get('search') || '').trim().toLowerCase();

    // 1. Fetch all profiles from public.profiles
    const { data: profiles, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileErr) {
      console.warn('Profiles fetch error (falling back to auth users):', profileErr.message);
    }

    // 2. Fetch all registered auth users from Supabase Auth admin
    let authUsers = [];
    try {
      const { data: userList, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
      if (!authErr && userList?.users) {
        authUsers = userList.users;
      }
    } catch (err) {
      console.warn('Auth admin listUsers error:', err.message);
    }

    // 3. Merge profiles and auth users into a single unified list
    const profileMap = new Map();
    (profiles || []).forEach((p) => {
      profileMap.set(p.id, p);
    });

    const userList = [];
    const seenIds = new Set();

    // First process auth users
    authUsers.forEach((authUser) => {
      const p = profileMap.get(authUser.id) || {};
      seenIds.add(authUser.id);

      const email = authUser.email || p.email || '';
      const fullName =
        p.full_name ||
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        (email ? email.split('@')[0] : 'User');

      const role =
        p.role ||
        authUser.user_metadata?.role ||
        (email === 'trioent19@gmail.com' ? 'super_admin' : 'customer');

      userList.push({
        id: authUser.id,
        email: email.toLowerCase(),
        full_name: fullName,
        phone: p.phone || authUser.phone || '',
        role: role,
        created_at: authUser.created_at || p.created_at,
        last_sign_in_at: authUser.last_sign_in_at || null,
      });
    });

    // Add any profile that might not be in auth list (e.g. mock or manual records)
    (profiles || []).forEach((p) => {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        const email = (p.email || '').toLowerCase();
        userList.push({
          id: p.id,
          email,
          full_name: p.full_name || (email ? email.split('@')[0] : 'Artisan Patron'),
          phone: p.phone || '',
          role: p.role || (email === 'trioent19@gmail.com' ? 'super_admin' : 'customer'),
          created_at: p.created_at,
          last_sign_in_at: null,
        });
      }
    });

    // 4. Filter by search query if provided
    let filteredUsers = userList;
    if (searchQuery) {
      filteredUsers = userList.filter((u) => {
        return (
          u.email.includes(searchQuery) ||
          u.full_name.toLowerCase().includes(searchQuery) ||
          u.role.toLowerCase().includes(searchQuery) ||
          (u.phone && u.phone.includes(searchQuery))
        );
      });
    }

    return NextResponse.json({
      success: true,
      total: filteredUsers.length,
      users: filteredUsers,
    });
  } catch (err) {
    console.error('Error fetching admin users:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
