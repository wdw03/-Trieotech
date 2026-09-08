'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import TrioLogo from '../../components/common/TrioLogo';
import { User, Mail, Lock, Phone, ArrowRight, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

export default function RegisterClient() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(formData);
      if (result.success) {
        if (result.needsVerification) {
          setShowVerification(true);
        } else {
          router.push('/profile');
        }
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="ethnic-card max-w-md w-full p-8 sm:p-10 rounded-3xl space-y-6 shadow-2xl border-2 border-gold-500/30 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="font-serif font-black text-2xl text-stone-900 dark:text-ivory-100">
            Check Your Email
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            We&apos;ve sent a verification link to <strong>{formData.email}</strong>.
            Please check your inbox and click the link to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block btn-primary py-3 px-8 rounded-xl text-xs font-bold uppercase tracking-wider"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

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
                <span>Creating Account...</span>
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
          <Link href="/login" className="font-bold text-maroon-700 dark:text-gold-400 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
