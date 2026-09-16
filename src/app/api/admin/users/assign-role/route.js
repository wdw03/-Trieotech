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

    const cleanRole = String(newRole || '').trim().toLowerCase();
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

    if (!targetUserId && targetUserEmail) {
      // Find user by email in auth
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const match = userList?.users?.find(
        (u) => (u.email || '').toLowerCase() === targetUserEmail
      );
      if (match) {
        targetUserId = match.id;
      }
    }

    if (!targetUserId) {
      // Check in profiles table
      const { data: p } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .ilike('email', targetUserEmail)
        .maybeSingle();

      if (p) {
        targetUserId = p.id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: `User with email "${targetUserEmail}" not found` },
        { status: 404 }
      );
    }

    // 3. Update profiles table
    const { error: profileUpdateErr } = await supabaseAdmin
      .from('profiles')
      .update({ role: cleanRole, updated_at: new Date().toISOString() })
      .eq('id', targetUserId);

    if (profileUpdateErr) {
      console.warn('Profile table role update error:', profileUpdateErr.message);
    }

    // 4. Update auth.users metadata if it's a valid auth user
    try {
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        user_metadata: { role: cleanRole },
      });
    } catch (authErr) {
      console.warn('Auth metadata role update error:', authErr.message);
    }

    return NextResponse.json({
      success: true,
      message: `Role successfully updated to "${cleanRole}"`,
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
