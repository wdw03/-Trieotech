export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

// Allowed system roles
const ALLOWED_ROLES = ['super_admin', 'seo_manager', 'customer', 'admin'];

// POST: Assign role to user
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, email, newRole, requesterEmail } = body;

    // 1. Validate inputs
    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      );
    }

    let cleanRole = String(newRole || '').trim().toLowerCase();
    // Normalize aliases for CMS / SEO role
    if (['cms', 'csm', 'cms_manager', 'cms_editor', 'seo', 'seo_manager', 'editor', 'content_manager'].includes(cleanRole)) {
      cleanRole = 'seo_manager';
    } else if (['super_admin', 'superadmin', 'admin'].includes(cleanRole)) {
      cleanRole = 'super_admin';
    } else if (['customer', 'user', 'none'].includes(cleanRole)) {
      cleanRole = 'customer';
    }

    if (!ALLOWED_ROLES.includes(cleanRole)) {
      return NextResponse.json(
        {
          error: `Invalid role. Allowed roles are: ${ALLOWED_ROLES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 2. Find target user
    let targetUserId = userId;
    let targetUserEmail = email ? String(email).trim().toLowerCase() : '';

    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    let foundAuthUser = null;

    if (targetUserId) {
      foundAuthUser = userList?.users?.find((u) => u.id === targetUserId);
      if (foundAuthUser && !targetUserEmail) {
        targetUserEmail = (foundAuthUser.email || '').toLowerCase();
      }
    }

    if (!foundAuthUser && targetUserEmail) {
      foundAuthUser = userList?.users?.find(
        (u) => (u.email || '').toLowerCase() === targetUserEmail
      );
      if (foundAuthUser) {
        targetUserId = foundAuthUser.id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: `User with email "${targetUserEmail}" not found in auth system.` },
        { status: 404 }
      );
    }

    // Safety Guard: Cannot revoke Super Admin from primary master owner
    if (targetUserEmail === 'trioenterprises10@gmail.com' && cleanRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot revoke Super Admin role from the Primary Master Owner (trioenterprises10@gmail.com).' },
        { status: 400 }
      );
    }

    // 3. Update or Upsert profiles table
    // PostgreSQL constraint 'profiles_role_check' expects 'admin' or 'customer'
    const profileRole = cleanRole === 'customer' ? 'customer' : 'admin';
    try {
      const { error: profileUpdateErr } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: targetUserId,
          role: profileRole,
          full_name: foundAuthUser?.user_metadata?.full_name || 'Artisan Patron',
          phone: foundAuthUser?.user_metadata?.phone || '',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (profileUpdateErr) {
        console.warn('Profile table role update warning:', profileUpdateErr.message);
      }
    } catch (pErr) {
      console.warn('Profile table update exception:', pErr.message);
    }

    // 4. Update auth.users metadata with exact granular role ('super_admin', 'seo_manager', or 'customer')
    try {
      const existingMeta = foundAuthUser?.user_metadata || {};
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        user_metadata: { ...existingMeta, role: cleanRole },
      });
    } catch (authErr) {
      console.warn('Auth metadata role update error:', authErr.message);
    }

    const actionText = cleanRole === 'customer' 
      ? 'Role removed. User access revoked back to Customer.' 
      : `Role successfully updated to "${cleanRole}"`;

    return NextResponse.json({
      success: true,
      message: actionText,
      data: {
        userId: targetUserId,
        email: targetUserEmail,
        role: cleanRole,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Error assigning user role:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to assign role' },
      { status: 500 }
    );
  }
}
