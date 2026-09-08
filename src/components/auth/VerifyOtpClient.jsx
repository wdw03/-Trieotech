'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import TrioLogo from '../common/TrioLogo';
import {
  KeyRound,
  ArrowRight,
  Loader2,
  RefreshCw,
  Edit2,
  CheckCircle2,
  Mail,
  Lock,
  User,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

export default function VerifyOtpClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlEmail = searchParams.get('email') || '';
  const urlOtp = searchParams.get('otp') || '';
  const urlToken = searchParams.get('token') || '';
  const urlExpires = searchParams.get('expires') || '';
  const redirectTo = searchParams.get('redirect') || searchParams.get('next') || '/profile';

  const { verifySignupOtp, sendSignupOtp } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState(urlEmail);
  const [otp, setOtp] = useState(urlOtp);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [signupData, setSignupData] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load pending signup details from sessionStorage and localStorage
  useEffect(() => {
    try {
      let stored = null;
      if (typeof window !== 'undefined') {
        stored = sessionStorage.getItem('trio_pending_signup') || localStorage.getItem('trio_pending_signup');
      }
      if (stored) {
        const parsed = JSON.parse(stored);
        setSignupData(parsed);
        if (!email && parsed.email) setEmail(parsed.email);
        if (parsed.password) setPassword(parsed.password);
        if (parsed.name) setName(parsed.name);
        if (parsed.phone) setPhone(parsed.phone);
      }
    } catch (_) {}
  }, [email]);

  // Resend countdown timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Submit OTP Verification
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const cleanOtp = String(otp).trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    const targetEmail = (email || signupData?.email || '').trim().toLowerCase();
    if (!targetEmail) {
      setError('Please provide your email address.');
      return;
    }

    const targetPassword = password || signupData?.password;
    if (!targetPassword || targetPassword.length < 6) {
      setError('Please set a password of at least 6 characters.');
      return;
    }

    const token = urlToken || signupData?.verificationToken;
    const expires = urlExpires || signupData?.expiresAt || Date.now() + 600000;

    setIsVerifying(true);

    try {
      const result = await verifySignupOtp({
        email: targetEmail,
        otp: cleanOtp,
        verificationToken: token,
        expiresAt: expires,
        name: name || signupData?.name || '',
        phone: phone || signupData?.phone || '',
        password: targetPassword,
      });

      if (result.success) {
        setSuccessMessage('Account verified successfully! Logging you in...');
        try {
          sessionStorage.removeItem('trio_pending_signup');
          localStorage.removeItem('trio_pending_signup');
        } catch (_) {}

        setTimeout(() => {
          router.push(redirectTo);
        }, 600);
      } else {
        setError(result.error || 'Invalid or expired OTP code. Please check and retry.');
      }
    } catch (err) {
      setError('Verification failed. Please retry or click Resend OTP.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendTimer > 0 || isResending) return;
    const targetEmail = (email || signupData?.email || '').trim();
    if (!targetEmail) {
      setError('Please enter your email to resend code.');
      return;
    }

    setIsResending(true);
    setError('');

    try {
      const result = await sendSignupOtp(targetEmail, name || signupData?.name || '');
      if (result.success) {
        const updated = {
          ...(signupData || {}),
          email: targetEmail,
          verificationToken: result.verificationToken,
          expiresAt: result.expiresAt,
        };
        setSignupData(updated);
        try {
          sessionStorage.setItem('trio_pending_signup', JSON.stringify(updated));
          localStorage.setItem('trio_pending_signup', JSON.stringify(updated));
        } catch (_) {}

        setResendTimer(60);
        addToast('A fresh OTP has been sent to ' + targetEmail, 'success');
      } else {
        setError(result.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Needs password input if user landed here directly without pending registration state
  const needsPassword = !password && !signupData?.password;

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="ethnic-card max-w-md w-full p-8 sm:p-10 rounded-3xl space-y-6 shadow-2xl border-2 border-gold-500/30 text-center animate-fade-in">
        
        {/* Brand Header */}
        <div className="flex justify-center">
          <TrioLogo />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-gold-500/15 border-2 border-gold-500/40 text-gold-600 flex items-center justify-center mx-auto shadow-md">
          <KeyRound className="w-8 h-8" />
        </div>

        {/* Title & Email Display */}
        <div className="space-y-2">
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100">
            Verify &amp; Login
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            We have sent a 6-digit verification code to
            <br />
            <strong className="text-maroon-800 dark:text-gold-300 font-mono text-sm inline-flex items-center gap-1.5 mt-1 bg-gold-500/10 px-3 py-1 rounded-full border border-gold-500/20">
              <Mail className="w-3.5 h-3.5 text-gold-600" />
              <span>{email || signupData?.email || 'your email address'}</span>
            </strong>
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl px-4 py-3 text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl px-4 py-3 text-left flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          
          {/* If email was not preloaded, allow entering email */}
          {(!email && !signupData?.email) && (
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isVerifying}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs outline-none focus:border-maroon-700"
                />
                <Mail className="w-4 h-4 text-gold-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* If password was not in session (e.g. cross-device verification link), allow entering */}
          {needsPassword && (
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Create Account Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isVerifying}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs outline-none focus:border-maroon-700"
                />
                <Lock className="w-4 h-4 text-gold-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* OTP Code Input */}
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block text-center uppercase tracking-wider">
              Enter 6-Digit Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              placeholder="1 2 3 4 5 6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={isVerifying}
              className="w-full text-center tracking-[0.45em] font-mono text-2xl font-bold py-3.5 px-4 rounded-2xl bg-ivory-100 dark:bg-stone-900 border-2 border-gold-500/40 text-stone-900 dark:text-ivory-100 outline-none focus:border-maroon-700 dark:focus:border-gold-500 transition-colors placeholder:text-stone-300 dark:placeholder:text-stone-700 shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying || otp.length < 6}
            className="w-full btn-primary py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-maroon-md disabled:opacity-50 transition-all cursor-pointer"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying &amp; Logging In...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify &amp; Login Automatically</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Resend Code & Edit Option */}
        <div className="pt-3 border-t border-gold-500/20 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-stone-500">Didn&apos;t get the code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendTimer > 0 || isResending}
              className="font-bold text-maroon-700 dark:text-gold-400 hover:underline disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : resendTimer > 0 ? (
                <span>Resend code in {resendTimer}s</span>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend OTP</span>
                </>
              )}
            </button>
          </div>

          <Link
            href={`/register${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
            className="inline-flex items-center gap-1.5 text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
          >
            <Edit2 className="w-3 h-3" />
            <span>Entered wrong details? Back to Register</span>
          </Link>

          <p className="text-[11px] text-stone-400 pt-1">
            Valid for 10 minutes. Check your Promotions or Spam folder if not in inbox.
          </p>
        </div>

      </div>
    </div>
  );
}
