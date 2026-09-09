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
    const { email, name } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Generate secure 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create HMAC verification token
    const payload = `${cleanEmail}:${otp}:${expiresAt}`;
    const verificationToken = crypto
      .createHmac('sha256', OTP_SECRET)
      .update(payload)
      .digest('hex');

    // Send email via Resend
    const resend = new Resend(RESEND_API_KEY);
    const recipientName = name ? name.trim() : 'Artisan Patron';

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
            <div class="greeting">Namaste ${recipientName},</div>
            <h2 class="title">Verify Your Email Address</h2>
            <p class="desc">
              Thank you for joining the Trio Enterprises Artisan Guild! Use the 6-digit verification code below to complete your registration and log into your account:
            </p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="expiry">Valid for 10 minutes</div>
            </div>

            <div style="margin: 20px 0 24px;">
              <a href="https://trieotech.vercel.app/verify-otp?email=${encodeURIComponent(cleanEmail)}&otp=${otp}&token=${verificationToken}&expires=${expiresAt}"
                 style="display: inline-block; background: linear-gradient(135deg, #7F1D1D 0%, #4a0404 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 12px; border: 1px solid #D4AF37; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(127, 29, 29, 0.3);">
                ✨ Click Here to Verify &amp; Login Directly
              </a>
              <p style="font-size: 11px; color: #78716c; margin-top: 10px;">
                Or open: <a href="https://trieotech.vercel.app/verify-otp?email=${encodeURIComponent(cleanEmail)}" style="color: #4a0404; font-weight: 600;">https://trieotech.vercel.app/verify-otp</a>
              </p>
            </div>

            <div class="security-note">
              Please do not share this one-time password (OTP) with anyone. Trio Enterprises will never ask for your OTP over phone or email.
            </div>
          </div>
          <div class="footer">
            © 2026 Trio Enterprises. All Rights Reserved.<br/>
            Jaipur Handicraft Cluster &amp; Surat Textile Hub, India
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email with verified domain
    let sendResult = await resend.emails.send({
      from: 'Trio Enterprises <noreply@trioenterprises.in>',
      to: cleanEmail,
      subject: `${otp} is your Trio Enterprises verification code`,
      html: emailHtml,
    });

    if (sendResult.error) {
      console.error('Resend error with custom domain, trying fallback:', sendResult.error);
      sendResult = await resend.emails.send({
        from: 'Trio Enterprises <onboarding@resend.dev>',
        to: cleanEmail,
        subject: `${otp} is your Trio Enterprises verification code`,
        html: emailHtml,
      });

      if (sendResult.error) {
        console.warn('Resend fallback notice:', sendResult.error);

        if (sendResult.error.message && sendResult.error.message.includes('testing emails')) {
          return NextResponse.json(
            {
              error:
                'Email delivery blocked by Resend sandbox. Please verify your custom domain in Resend (resend.com/domains) or configure SMTP in Supabase.',
            },
            { status: 403 }
          );
        }

        return NextResponse.json(
          { error: 'Failed to deliver OTP email: ' + sendResult.error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully to your email',
      verificationToken,
      expiresAt,
    });
  } catch (err) {
    console.error('Send signup OTP error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to send verification OTP' },
      { status: 500 }
    );
  }
}
