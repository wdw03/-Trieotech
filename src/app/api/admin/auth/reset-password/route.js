export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

const OTP_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'trio-secret-otp-signing-key-2026';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp, verificationToken, expiresAt, newPassword } = body;

    if (!email || !otp || !verificationToken || !expiresAt) {
      return NextResponse.json(
        { error: 'Email, OTP, and verification token are required' },
        { status: 400 }
      );
    }

    if (!newPassword || String(newPassword).trim().length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();
    const cleanPassword = String(newPassword).trim();

    // 1. Check expiration
    if (Date.now() > Number(expiresAt)) {
      return NextResponse.json(
        { error: 'Security OTP has expired. Please request a fresh OTP.' },
        { status: 400 }
      );
    }

    // 2. Verify HMAC token
    const expectedPayload = `admin-reset:${cleanEmail}:${cleanOtp}:${expiresAt}`;
    const expectedToken = crypto
      .createHmac('sha256', OTP_SECRET)
      .update(expectedPayload)
      .digest('hex');

    if (expectedToken !== verificationToken) {
      return NextResponse.json(
        { error: 'Invalid security code. Please enter the exact 6-digit OTP received in your email.' },
        { status: 400 }
      );
    }

    // 3. Find admin user in Supabase
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const targetUser = userList?.users?.find(
      (u) => (u.email || '').toLowerCase() === cleanEmail
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Administrative account not found' },
        { status: 404 }
      );
    }

    // 4. Update admin password
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
      password: cleanPassword,
      email_confirm: true,
    });

    if (updateErr) {
      console.error('Password reset update error:', updateErr);
      return NextResponse.json(
        { error: updateErr.message || 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Super Admin password reset successfully! You can now log in with your new credentials.',
    });
  } catch (err) {
    console.error('Admin reset-password error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while resetting password' },
      { status: 500 }
    );
  }
}
