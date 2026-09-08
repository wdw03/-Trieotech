'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import TrioLogo from '../../components/common/TrioLogo';
import { Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordClient() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        setIsSent(true);
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="ethnic-card max-w-md w-full p-8 sm:p-10 rounded-3xl space-y-6 shadow-2xl border-2 border-gold-500/30 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="font-serif font-black text-2xl text-stone-900 dark:text-ivory-100">
            Reset Link Sent
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            We&apos;ve sent a password reset link to <strong>{email}</strong>.
            Check your inbox and follow the instructions.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 btn-primary py-3 px-8 rounded-xl text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      
      <div className="ethnic-card max-w-md w-full p-8 sm:p-10 rounded-3xl space-y-6 shadow-2xl border-2 border-gold-500/30">
        <div className="text-center space-y-2">
          <TrioLogo className="justify-center" />
          <h1 className="font-serif font-black text-2xl text-stone-900 dark:text-ivory-100 pt-2">
            Reset Your Password
          </h1>
          <p className="text-xs text-stone-500">
            Enter your registered email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Email Address</label>
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
            className="w-full btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-maroon-md disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-stone-500">
          <Link href="/login" className="font-bold text-maroon-700 dark:text-gold-400 hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
