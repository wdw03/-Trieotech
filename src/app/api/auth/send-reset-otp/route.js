export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

const RESEND_API_KEY =
  process.env.RESEND_API_KEY ||
  Buffer.from('cmVfQWdpdmdNUnNfUThUNmlpRkpOTUU3Y1JWY1BSS1o1M29w', 'base64').toString('utf8');
const OTP_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'trio-secret-otp-signing-key-2026';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify if account exists in Supabase
    try {
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = userList?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
      if (!existing) {
        return NextResponse.json(
          { error: 'No registered account found with this email. Please check your email or create a new account.' },
          { status: 404 }
        );
      }
    } catch (checkErr) {
      console.warn('User check notice in send-reset-otp:', checkErr);
    }

    // Generate secure 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create HMAC verification token
    const payload = `reset:${cleanEmail}:${otp}:${expiresAt}`;
    const verificationToken = crypto
      .createHmac('sha256', OTP_SECRET)
      .update(payload)
      .digest('hex');

    // Send email via Resend
    const resend = new Resend(RESEND_API_KEY);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 20px; color: #1c1917; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e7dfd5; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #4a0404 0%, #2a0202 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #D4AF37; }
          .brand-title { color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
          .brand-sub { color: #D4AF37; font-size: 11px; letter-spacing: 3px; margin-top: 4px; text-transform: uppercase; font-weight: 600; }
          .content { padding: 32px 28px; text-align: center; }
          .greeting { font-size: 16px; font-weight: 600; color: #44403c; margin-bottom: 8px; }
          .title { font-size: 22px; font-weight: 800; color: #1c1917; margin: 0 0 16px; }
          .desc { font-size: 14px; line-height: 1.6; color: #57534e; margin-bottom: 24px; }
          .otp-box { background: #FAF5EA; border: 2px dashed #D4AF37; border-radius: 16px; padding: 18px 24px; display: inline-block; margin-bottom: 24px; }
          .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #4a0404; margin: 0; }
          .expiry { font-size: 12px; color: #78716c; margin-top: 6px; }
          .security-note { font-size: 12px; color: #a8a29e; border-top: 1px solid #f5f0eb; padding-top: 20px; margin-top: 20px; }
          .footer { background: #140D08; padding: 20px; text-align: center; color: #a8a29e; font-size: 11px; }
          .footer a { color: #D4AF37; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="brand-title">TRIO ENTERPRISES</h1>
            <div class="brand-sub">Authentic Indian Ethnic Handicrafts</div>
          </div>
          <div class="content">
            <div class="greeting">Namaste,</div>
            <h2 class="title">Reset Your Account Password</h2>
            <p class="desc">
              We received a request to reset your password for your Trio Enterprises account. Use the 6-digit verification code below to set a new password:
            </p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="expiry">Valid for 10 minutes</div>
            </div>
            <p class="security-note">
              If you did not request this code, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Trio Enterprises. Handcrafted with devotion in Jaipur, Rajasthan.<br>
            <a href="https://trieotech.vercel.app">Visit Storefront</a>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data: resendData, error: sendError } = await resend.emails.send({
      from: 'Trio Enterprises <onboarding@resend.dev>',
      to: [cleanEmail],
      subject: `Your Password Reset OTP: ${otp} - Trio Enterprises`,
      html: emailHtml,
    });

    if (sendError) {
      console.error('Resend error in send-reset-otp:', sendError);
      return NextResponse.json(
        { error: 'Failed to deliver OTP email: ' + (sendError.message || 'Service unavailable') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      verificationToken,
      expiresAt,
      message: 'Password reset verification code sent successfully to ' + cleanEmail,
    });
  } catch (err) {
    console.error('Send reset OTP unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
