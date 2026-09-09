export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

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
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();
    const cleanPassword = String(newPassword).trim();

    // 1. Check expiration
    if (Date.now() > Number(expiresAt)) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // 2. Verify HMAC token
    const expectedPayload = `reset:${cleanEmail}:${cleanOtp}:${expiresAt}`;
    const expectedToken = crypto
      .createHmac('sha256', OTP_SECRET)
      .update(expectedPayload)
      .digest('hex');

    if (expectedToken !== verificationToken) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please check the 6-digit code in your email.' },
        { status: 400 }
      );
    }

    // 3. Find user in Supabase
    const { data: userList, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = userList?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);

    if (!user) {
      return NextResponse.json(
        { error: 'Account not found. Please register or contact support.' },
        { status: 404 }
      );
    }

    // 4. Update user's password and confirm email
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: cleanPassword,
      email_confirm: true,
    });

    if (updateErr) {
      console.error('Password reset update error:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully!',
    });
  } catch (err) {
    console.error('Verify reset OTP unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
