export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

const OTP_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'trio-secret-otp-signing-key-2026';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp, verificationToken, expiresAt, name, phone, password } = body;

    if (!email || !otp || !verificationToken || !expiresAt) {
      return NextResponse.json(
        { error: 'Email, OTP, and verification token are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // 1. Check expiration
    if (Date.now() > Number(expiresAt)) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please click Resend OTP.' },
        { status: 400 }
      );
    }

    // 2. Verify HMAC token
    const expectedPayload = `${cleanEmail}:${cleanOtp}:${expiresAt}`;
    const expectedToken = crypto
      .createHmac('sha256', OTP_SECRET)
      .update(expectedPayload)
      .digest('hex');

    if (expectedToken !== verificationToken) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please check the code sent to your email.' },
        { status: 400 }
      );
    }

    // 3. OTP is valid! Create or update user in Supabase
    let userId = null;
    const cleanPassword = password ? String(password).trim() : '';

    try {
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      let existing = userList?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);

      if (existing) {
        // User already in auth.users - update their password and confirm email
        const updatePayload = {
          email_confirm: true,
          user_metadata: {
            full_name: name || existing.user_metadata?.full_name || '',
            phone: phone || existing.user_metadata?.phone || '',
          },
        };
        if (cleanPassword && cleanPassword.length >= 6) {
          updatePayload.password = cleanPassword;
        }

        const { data: updated, error: updateErr } =
          await supabaseAdmin.auth.admin.updateUserById(existing.id, updatePayload);

        if (updateErr) {
          console.error('Update user error:', updateErr);
          return NextResponse.json({ error: updateErr.message }, { status: 500 });
        }
        userId = existing.id;
      } else {
        // Create new user in Supabase with email confirmed
        const { data: created, error: createErr } =
          await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: cleanPassword || undefined,
            email_confirm: true,
            user_metadata: {
              full_name: name || '',
              phone: phone || '',
            },
          });

        if (createErr) {
          if (createErr.code === 'email_exists' || createErr.message?.toLowerCase().includes('already')) {
            const { data: retryList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
            const retryUser = retryList?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
            if (retryUser) {
              const retryPayload = { email_confirm: true };
              if (cleanPassword && cleanPassword.length >= 6) retryPayload.password = cleanPassword;
              await supabaseAdmin.auth.admin.updateUserById(retryUser.id, retryPayload);
              userId = retryUser.id;
            }
          }
          if (!userId) {
            console.error('Create user error:', createErr);
            return NextResponse.json({ error: createErr.message }, { status: 500 });
          }
        } else {
          userId = created?.user?.id;
        }
      }

      // Upsert profile
      if (userId) {
        await supabaseAdmin.from('profiles').upsert(
          {
            id: userId,
            full_name: name || '',
            phone: phone || '',
            role: 'customer',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      }
    } catch (authErr) {
      console.error('Supabase admin user creation error:', authErr);
      return NextResponse.json(
        { error: authErr.message || 'Failed to setup account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified and account activated successfully',
      userId,
    });
  } catch (err) {
    console.error('Verify signup OTP error:', err);
    return NextResponse.json(
      { error: err.message || 'OTP verification failed' },
      { status: 500 }
    );
  }
}
