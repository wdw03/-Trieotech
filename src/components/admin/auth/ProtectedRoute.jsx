'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useAdmin } from '../../../context/AdminContext';
import { Loader2, ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const { isAuthenticated, isAuthChecking, isSeoManager, canAccessRoute } = useAdmin();
  const router = useRouter();
  const pathname = usePathname() || '';

  const userEmail = (user?.email || '').toLowerCase();
  const isMasterAdmin = userEmail === 'trioenterprises10@gmail.com';
  const role = (profile?.role || user?.user_metadata?.role || user?.role || '').toLowerCase();
  const hasAdminAccess = isMasterAdmin || ['super_admin', 'admin', 'seo_manager'].includes(role) || isAuthenticated;

  // We are checking auth if either provider is still evaluating
  const isChecking = authLoading && isAuthChecking;

  useEffect(() => {
    if (isChecking) return;

    // 1. Not logged in at all -> redirect to login
    if (!user && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. Logged in and has admin access -> redirect SEO manager to their workspace if at root
    if (hasAdminAccess && isSeoManager() && (pathname === '/admin' || pathname === '/admin/')) {
      router.replace('/admin/cms/home');
    }
  }, [user, isAuthenticated, hasAdminAccess, isChecking, isSeoManager, pathname, router]);

  // Loading state
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs font-mono tracking-wider">Verifying Admin Permissions...</span>
      </div>
    );
  }

  // Not logged in at all
  if (!user && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs font-mono tracking-wider">Redirecting to Secure Login...</span>
      </div>
    );
  }

  // User is signed in as a regular customer (NOT an admin)
  // CRITICAL: DO NOT redirect to /login (which would create an infinite redirect loop!)
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center gap-4 text-center p-6 text-slate-300">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-bold text-white">Admin Privileges Required</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            You are signed in as <span className="text-amber-400 font-semibold">{user?.email}</span>. This account does not have administrative access to the Trio Enterprises Admin Portal.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Storefront</span>
          </button>
          <button
            onClick={async () => {
              if (logout) await logout();
              router.push('/login?redirect=%2Fadmin');
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch Account / Sign In</span>
          </button>
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
