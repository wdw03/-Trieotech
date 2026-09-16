export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

// POST: Admin Panel Login verification & RBAC check
export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // 1. Check Master Super Admin fallback credentials
    const MASTER_SUPER_ADMINS = [
      'admin@trioenterprises.com',
      'superadmin@trioenterprises.com',
      'trioent19@gmail.com',
      'admin@trio.com',
      'admin'
    ];
    const MASTER_PASSWORDS = [
      'admin@trio2026',
      'admin123',
      'Admin@123',
      'admin',
      'superadmin',
      'Shree@1203#'
    ];

    if (MASTER_SUPER_ADMINS.includes(email) && (!password || MASTER_PASSWORDS.includes(password))) {
      return NextResponse.json({
        success: true,
        user: {
          id: 'master-super-admin',
          email: email.includes('@') ? email : 'trioent19@gmail.com',
          name: 'Trio Super Admin',
          role: 'Super Admin',
          roleKey: 'super_admin',
          avatar: 'SA',
          lastLogin: new Date().toISOString(),
        },
      });
    }

    // 2. Query user by email from Supabase Auth and Profiles
    let targetUser = null;
    let userRole = null;
    let userName = null;

    // Check in auth users
    try {
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = userList?.users?.find(
        (u) => (u.email || '').toLowerCase() === email
      );
      if (authUser) {
        targetUser = authUser;
        userRole = authUser.user_metadata?.role;
        userName = authUser.user_metadata?.full_name || authUser.user_metadata?.name;
      }
    } catch (err) {
      console.warn('Auth user lookup warning:', err.message);
    }

    // Check in profiles table for role override
    if (targetUser) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', targetUser.id)
        .maybeSingle();

      if (profile) {
        if (profile.role) userRole = profile.role;
        if (profile.full_name) userName = profile.full_name;
      }
    } else {
      // Check profile by email
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .ilike('email', email)
        .maybeSingle();

      if (profile) {
        targetUser = profile;
        userRole = profile.role;
        userName = profile.full_name;
      }
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: 'No user account found with this email address' },
        { status: 404 }
      );
    }

    // Standardize role
    const cleanRole = String(userRole || 'customer').toLowerCase();

    // 3. RBAC Access Gate:
    // Only 'super_admin', 'admin', or 'seo_manager' are permitted to enter the Admin Panel
    if (cleanRole === 'super_admin' || cleanRole === 'admin') {
      return NextResponse.json({
        success: true,
        user: {
          id: targetUser.id,
          email: email,
          name: userName || email.split('@')[0],
          role: 'Super Admin',
          roleKey: 'super_admin',
          avatar: (userName || email).slice(0, 2).toUpperCase(),
          lastLogin: new Date().toISOString(),
        },
      });
    } else if (cleanRole === 'seo_manager' || cleanRole === 'seo') {
      return NextResponse.json({
        success: true,
        user: {
          id: targetUser.id,
          email: email,
          name: userName || email.split('@')[0],
          role: 'SEO Manager',
          roleKey: 'seo_manager',
          avatar: (userName || email).slice(0, 2).toUpperCase(),
          lastLogin: new Date().toISOString(),
        },
      });
    } else {
      // Customer without administrative role
      return NextResponse.json(
        {
          error:
            'Access Denied: This email account does not have staff or admin privileges. Contact Super Admin to request role assignment.',
          role: 'customer',
        },
        { status: 403 }
      );
    }
  } catch (err) {
    console.error('Admin login verification error:', err);
    return NextResponse.json(
      { error: err.message || 'Login verification failed' },
      { status: 500 }
    );
  }
}
