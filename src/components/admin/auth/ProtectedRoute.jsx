'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useAdmin } from '../../../context/AdminContext';
import { Loader2, ShieldAlert, Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const ProtectedRoute = ({ children }) => {
  const { user, profile, loading: authLoading, login: authLogin } = useAuth();
  const { isAuthenticated, isAuthChecking, isSeoManager, canAccessRoute, login: adminLogin } = useAdmin();
  const router = useRouter();
  const pathname = usePathname() || '';

  // Direct inline admin login state
  const [adminEmail, setAdminEmail] = useState('trioenterprises10@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  const userEmail = (user?.email || '').toLowerCase();
  const isMasterAdmin = userEmail === 'trioenterprises10@gmail.com';
  const role = (profile?.role || user?.user_metadata?.role || user?.role || '').toLowerCase();
  const hasAdminAccess = isMasterAdmin || ['super_admin', 'admin', 'seo_manager'].includes(role) || isAuthenticated;

  const isChecking = authLoading && isAuthChecking;

  useEffect(() => {
    if (isChecking) return;

    // If logged in and has admin access -> redirect SEO manager to their workspace if at root
    if (hasAdminAccess && isSeoManager() && (pathname === '/admin' || pathname === '/admin/')) {
      router.replace('/admin/cms/home');
    }
  }, [hasAdminAccess, isChecking, isSeoManager, pathname, router]);

  const handleAdminSignIn = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    try {
      const cleanEmail = (adminEmail || '').trim().toLowerCase();
      const cleanPassword = (adminPassword || '').trim();

      // 1. Authenticate via AuthContext
      let res = null;
      if (authLogin) {
        res = await authLogin(cleanEmail, cleanPassword);
      }

      // 2. Fallback to AdminContext login
      if (!res?.success && adminLogin) {
        res = await adminLogin(cleanEmail, cleanPassword);
      }

      if (res?.success) {
        if (typeof window !== 'undefined') {
          window.location.href = pathname && pathname.startsWith('/admin') ? pathname : '/admin';
        }
      } else {
        setLoginError(res?.error || 'Invalid admin credentials. Please verify your email and password.');
      }
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs font-mono tracking-wider">Verifying Admin Permissions...</span>
      </div>
    );
  }

  // If user does not have admin access (unauthenticated OR customer session)
  // Display the dedicated Super Admin Gateway Login directly on screen!
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-[#070A11] flex items-center justify-center p-4 antialiased text-slate-200">
        <div className="w-full max-w-md bg-[#0F172A]/90 border border-amber-500/20 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              Trio Admin Gateway
            </h1>
            <p className="text-xs text-slate-400">
              Restricted management portal for Trio Enterprises staff.
            </p>
          </div>

          {user && !hasAdminAccess && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-[11px] leading-relaxed">
                <p>
                  Currently active: <strong className="text-amber-200">{user.email}</strong> (Customer).
                </p>
                <p className="text-slate-400">
                  Please enter Super Admin credentials below to unlock the dashboard.
                </p>
              </div>
            </div>
          )}

          {loginError && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Admin Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="trioenterprises10@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 text-xs text-white outline-none transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Admin Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 text-xs text-white outline-none transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Unlock Admin Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Storefront</span>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // Check role-based route permissions (e.g. SEO manager restricted from ecommerce orders/payments)
  const relativePath = pathname.replace(/^\/admin/, '') || '/';
  if (!canAccessRoute(relativePath)) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center gap-4 text-center p-6 text-slate-300">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">Access Restricted</h2>
          <p className="text-xs text-slate-400 max-w-sm">
            Your role does not have permission to view this section. Please contact the Super Admin for elevated privileges.
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/cms/home')}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          Go to SEO Workspace
        </button>
      </div>
    );
  }

  return children;
};
