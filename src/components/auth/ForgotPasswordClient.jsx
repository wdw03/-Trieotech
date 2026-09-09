'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import TrioLogo from '../../components/common/TrioLogo';
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Edit2
} from 'lucide-react';

export default function ForgotPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const redirectParam = searchParams.get('redirect') || searchParams.get('next');
  const redirectTo = (redirectParam && redirectParam !== '/profile') ? redirectParam : '/';

  const { sendResetOtp, verifyResetOtp, user } = useAuth();

  // Step 1: 'email' | Step 2: 'otp_and_password'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tokenData, setTokenData] = useState({ verificationToken: '', expiresAt: 0 });

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // If already logged in, redirect to main page
  useEffect(() => {
    if (user) {
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval = null;
    if (step === 'otp_and_password' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  // Step 1: Send Reset OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendResetOtp(cleanEmail);
      if (result.success) {
        setTokenData({
          verificationToken: result.verificationToken,
          expiresAt: result.expiresAt,
        });
        setStep('otp_and_password');
        setResendTimer(60);
        setOtp('');
      } else {
        setError(result.error || 'Failed to send verification code. Please check email address.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isResending) return;
    setIsResending(true);
    setError('');

    try {
      const result = await sendResetOtp(email.trim().toLowerCase());
      if (result.success) {
        setTokenData({
          verificationToken: result.verificationToken,
          expiresAt: result.expiresAt,
        });
        setResendTimer(60);
      } else {
        setError(result.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Verify OTP & Update Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setIsVerifying(true);

    try {
      const result = await verifyResetOtp({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
        verificationToken: tokenData.verificationToken,
        expiresAt: tokenData.expiresAt,
        newPassword: newPassword.trim(),
      });

      if (result.success) {
        setSuccessMessage('Password reset successfully! Logging you in...');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = redirectTo;
          } else {
            router.push(redirectTo);
          }
        }, 800);
      } else {
        setError(result.error || 'Failed to reset password. Please check the code.');
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again or request a new code.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="ethnic-card max-w-md w-full p-8 sm:p-10 rounded-3xl space-y-6 shadow-2xl border-2 border-gold-500/30 animate-fade-in">
        
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <TrioLogo className="justify-center" />
          <h1 className="font-serif font-black text-2xl text-stone-900 dark:text-ivory-100 pt-2">
            {step === 'email' ? 'Reset Your Password' : 'Create New Password'}
          </h1>
          <p className="text-xs text-stone-500 leading-relaxed">
            {step === 'email'
              ? 'Enter your registered email address. We will send you a 6-digit verification code to reset your password.'
              : `Enter the 6-digit OTP sent to ${email} and choose your new password.`}
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl px-4 py-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ── STEP 1: Enter Email ── */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Registered Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs outline-none focus:border-maroon-700 disabled:opacity-50"
                />
                <Mail className="w-4 h-4 text-gold-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-maroon-md disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <>
                  <span>Send 6-Digit OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ── STEP 2: Enter OTP & New Password ── */}
        {step === 'otp_and_password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Email display with edit button */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 text-xs">
              <span className="text-stone-600 dark:text-stone-400 truncate max-w-[240px]">
                Sending code to: <strong className="text-maroon-800 dark:text-gold-300">{email}</strong>
              </span>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-maroon-700 dark:text-gold-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
              >
                <Edit2 className="w-3 h-3" /> Change
              </button>
            </div>

            {/* 6-Digit OTP Code Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block text-center uppercase tracking-wider">
                Enter 6-Digit Verification Code *
              </label>
              <div className="relative">
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
                  className="w-full text-center tracking-[0.35em] font-mono text-xl font-bold py-2.5 px-4 rounded-xl bg-ivory-100 dark:bg-stone-900 border-2 border-gold-500/40 text-stone-900 dark:text-ivory-100 outline-none focus:border-maroon-700"
                />
                <KeyRound className="w-4 h-4 text-gold-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Resend OTP Button */}
            <div className="text-right">
              <button
                type="button"
                disabled={resendTimer > 0 || isResending}
                onClick={handleResendOtp}
                className="text-[11px] font-bold text-maroon-700 dark:text-gold-400 hover:underline disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP Code'}
              </button>
            </div>

            {/* New Password Input with Show/Hide Toggle */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isVerifying}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs outline-none focus:border-maroon-700"
                />
                <Lock className="w-4 h-4 text-gold-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-1 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gold-600" />
                  ) : (
                    <Eye className="w-4 h-4 text-gold-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isVerifying}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs outline-none focus:border-maroon-700"
                />
                <Lock className="w-4 h-4 text-gold-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying || otp.length < 6 || newPassword.length < 6}
              className="w-full btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-maroon-md disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resetting Password &amp; Signing In...</span>
                </>
              ) : (
                <>
                  <span>Confirm New Password &amp; Login</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="text-center pt-2 text-xs text-stone-500">
          <Link
            href="/login"
            className="font-bold text-maroon-700 dark:text-gold-400 hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
