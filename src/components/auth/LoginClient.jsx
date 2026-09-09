'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import TrioLogo from '../../components/common/TrioLogo';
import { Mail, Lock, ArrowRight, Sparkles, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectParam = searchParams.get('redirect') || searchParams.get('next');
  // Redirect directly to main home page '/' on login completion
  const redirectTo = (redirectParam && redirectParam !== '/profile') ? redirectParam : '/';

  // If already logged in, redirect to main page
  useEffect(() => {
    if (user) {
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        // Direct redirect to main page
        if (typeof window !== 'undefined') {
          window.location.href = redirectTo;
        } else {
          router.push(redirectTo);
        }
      } else {
        setError(result.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      
      <div className="ethnic-card max-w-md w-full p-8 sm:p-10 rounded-3xl space-y-6 shadow-2xl border-2 border-gold-500/30">
        <div className="text-center space-y-2">
          <TrioLogo className="justify-center" />
          <h1 className="font-serif font-black text-2xl text-stone-900 dark:text-ivory-100 pt-2">
            Welcome to Artisan Guild
          </h1>
          <p className="text-xs text-stone-500">
            Sign in to track handcrafted orders, view invoices, and access VIP festive discounts.
          </p>
        </div>

        {user && (
          <div className="p-3.5 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-xs text-maroon-800 dark:text-gold-300 flex items-center justify-between gap-2 shadow-xs">
            <div className="min-w-0 flex-1">
              <span className="font-bold block">Currently signed in as:</span>
              <span className="text-[11px] opacity-90 truncate block">{user.email}</span>
            </div>
            <Link href="/" className="btn-gold py-1.5 px-3 rounded-xl text-[11px] font-bold shrink-0 shadow-xs">
              Go to Home Page
            </Link>
          </div>
        )}

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

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <label className="font-bold text-stone-700 dark:text-stone-300">Password</label>
              <Link href="/forgot-password" className="text-gold-700 dark:text-gold-400 hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs outline-none focus:border-maroon-700 disabled:opacity-50"
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-maroon-md disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-stone-500">
          <span>New to Trio Ecart? </span>
          <Link
            href={`/register${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
            className="font-bold text-maroon-700 dark:text-gold-400 hover:underline"
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
