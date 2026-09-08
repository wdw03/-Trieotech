'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import TrioLogo from '../../components/common/TrioLogo';
import {
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  Sparkles,
  Loader2,
  KeyRound,
  RefreshCw,
  Edit2,
  CheckCircle2,
  ShoppingBag
} from 'lucide-react';

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || searchParams.get('next') || '/profile';
  const action = searchParams.get('action');

  const { sendSignupOtp, verifySignupOtp, resendSignupOtp } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP Verification States
  const [showVerification, setShowVerification] = useState(false);
  const [otp, setOtp] = useState('');
  const [tokenData, setTokenData] = useState({ verificationToken: '', expiresAt: 0 });
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval = null;
    if (showVerification && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showVerification, resendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendSignupOtp(formData.email, formData.name);
      if (result.success) {
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          verificationToken: result.verificationToken,
          expiresAt: result.expiresAt,
        };

        try {
          sessionStorage.setItem('trio_pending_signup', JSON.stringify(payload));
          localStorage.setItem('trio_pending_signup', JSON.stringify(payload));
        } catch (_) {}

        setTokenData({
          verificationToken: result.verificationToken,
          expiresAt: result.expiresAt,
        });
        setShowVerification(true);
        setResendTimer(60);
        setOtp('');

        // Dedicated URL navigation to /verify-otp
        if (typeof window !== 'undefined') {
          window.location.href = `/verify-otp?email=${encodeURIComponent(formData.email)}&redirect=${encodeURIComponent(redirectTo)}`;
        } else {
          router.push(
            `/verify-otp?email=${encodeURIComponent(formData.email)}&redirect=${encodeURIComponent(redirectTo)}`
          );
        }
      } else {
        setError(result.error || 'Failed to send verification code');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setError('Please enter the 6-digit OTP sent to your email');
      return;
    }

    setIsVerifying(true);

    try {
      const result = await verifySignupOtp({
        email: formData.email,
        otp: cleanOtp,
        verificationToken: tokenData.verificationToken,
        expiresAt: tokenData.expiresAt,
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
      });

      if (result.success) {
        // Auto-logged in! Redirect directly
        router.push(redirectTo);
      } else {
        setError(result.error || 'Invalid or expired OTP code. Please check and retry.');
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isResending) return;
    setIsResending(true);
    setError('');

    try {
      const result = await resendSignupOtp(formData.email, formData.name);
      if (result.success) {
        setTokenData({
          verificationToken: result.verificationToken,
          expiresAt: result.expiresAt,
        });
        setResendTimer(60);
      } else {
        setError(result.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again in a moment.');
    } finally {
      setIsResending(false);
    }
  };

  // ── OTP Verification Screen ──
  if (showVerification) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="ethnic-card max-w-md w-full p-8 sm:p-10 rounded-3xl space-y-6 shadow-2xl border-2 border-gold-500/30 text-center animate-fade-in">
          
          <div className="w-16 h-16 rounded-full bg-gold-500/10 border-2 border-gold-500/30 text-gold-600 flex items-center justify-center mx-auto">
            <KeyRound className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100">
              Verify &amp; Login
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              We have sent a 6-digit verification code to
              <br />
              <strong className="text-maroon-800 dark:text-gold-300 font-mono text-sm">{formData.email}</strong>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl px-4 py-3 text-left">
              {error}
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block text-center uppercase tracking-wider">
                Enter 6-Digit Email OTP
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
                className="w-full text-center tracking-[0.5em] font-mono text-2xl font-bold py-3.5 px-4 rounded-2xl bg-ivory-100 dark:bg-stone-900 border-2 border-gold-500/40 text-stone-900 dark:text-ivory-100 outline-none focus:border-maroon-700 transition-colors placeholder:text-stone-300 dark:placeholder:text-stone-700"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying || otp.length < 4}
              className="w-full btn-primary py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-maroon-md disabled:opacity-50 transition-all"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying &amp; Logging In...</span>
                </>
              ) : (
                <>
                  <span>Verify &amp; Login Automatically</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend & Actions */}
          <div className="pt-2 border-t border-gold-500/20 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Didn&apos;t get the code?</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || isResending}
                className="font-bold text-maroon-700 dark:text-gold-400 hover:underline disabled:opacity-40 inline-flex items-center gap-1"
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

            <button
              type="button"
              onClick={() => {
                setShowVerification(false);
                setError('');
                setOtp('');
              }}
              className="inline-flex items-center gap-1.5 text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            >
              <Edit2 className="w-3 h-3" />
              <span>Entered wrong email? Edit details</span>
            </button>

            <p className="text-[10px] text-stone-400 pt-1">
              Tip: You can also simply click the direct confirmation link sent to your inbox.
            </p>
          </div>

        </div>
      </div>
    );
  }

  // ── Standard Register Form ──
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      
      <div className="ethnic-card max-w-md w-full p-8 sm:p-10 rounded-3xl space-y-6 shadow-2xl border-2 border-gold-500/30">
        <div className="text-center space-y-2">
          <TrioLogo className="justify-center" />
          <h1 className="font-serif font-black text-2xl text-stone-900 dark:text-ivory-100 pt-2">
            Join the Artisan Guild
          </h1>
          <p className="text-xs text-stone-500">
            Create an account to enjoy 15% off your first order with code <strong>FIRSTBUY</strong>.
          </p>
        </div>

        {(action === 'cart' || action === 'buy') && (
          <div className="p-3.5 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-xs text-maroon-800 dark:text-gold-300 flex items-center gap-2.5 shadow-xs animate-fade-in">
            <ShoppingBag className="w-5 h-5 shrink-0 text-gold-600" />
            <div className="leading-tight text-left">
              <span className="font-bold block">One last step!</span>
              <span className="text-[11px] opacity-90">Register or sign in below to finish adding your item to bag.</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Full Name *</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. Radhika Singhania"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs outline-none focus:border-maroon-700 disabled:opacity-50"
              />
              <User className="w-4 h-4 text-gold-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Email Address *</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs outline-none focus:border-maroon-700 disabled:opacity-50"
              />
              <Mail className="w-4 h-4 text-gold-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Phone Number</label>
            <div className="relative">
              <input
                type="tel"
                placeholder="+91 98234 56789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs outline-none focus:border-maroon-700 disabled:opacity-50"
              />
              <Phone className="w-4 h-4 text-gold-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Password *</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs outline-none focus:border-maroon-700 disabled:opacity-50"
              />
              <Lock className="w-4 h-4 text-gold-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            {formData.password && formData.password.length < 6 && (
              <p className="text-[10px] text-red-500 mt-1">Password must be at least 6 characters</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-maroon-md disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending Verification Code...</span>
              </>
            ) : (
              <>
                <span>Create My Artisan Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-stone-500">
          <span>Already an artisan patron? </span>
          <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="font-bold text-maroon-700 dark:text-gold-400 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
