export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// POST: Verify signup OTP or email code
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const cleanOtp = String(otp).trim();

    // 1. Try signup verification
    let { data, error } = await supabaseAdmin.auth.verifyOtp({
      email,
      token: cleanOtp,
      type: 'signup',
    });

    // 2. Try email verification
    if (error) {
      const emailRetry = await supabaseAdmin.auth.verifyOtp({
        email,
        token: cleanOtp,
        type: 'email',
      });
      if (!emailRetry.error) {
        data = emailRetry.data;
        error = null;
      }
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data?.user, session: data?.session });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
