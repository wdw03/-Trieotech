'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useAdmin } from '../../../context/AdminContext';
import { Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export const ProtectedRoute = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const { user, profile, loading: authLoading } = useAuth();
  const { isAuthenticated, isAuthChecking, isSeoManager, canAccessRoute } = useAdmin();
  const router = useRouter();
  const pathname = usePathname() || '';

  useEffect(() => {
    setMounted(true);
  }, []);

  const userEmail = (user?.email || '').toLowerCase();
  const isMasterAdmin = userEmail === 'trioenterprises10@gmail.com' || userEmail === 'admin@trioenterprises.com';
  const role = (profile?.role || user?.user_metadata?.role || user?.role || '').toLowerCase();
  const isSeo = !isMasterAdmin && (role === 'seo_manager' || role === 'seo' || role.includes('seo') || isSeoManager());
  const isSuper = isMasterAdmin || role === 'super_admin' || role === 'admin';
  
  // Only users with verified staff permissions have admin access
  const hasAdminAccess = isMasterAdmin || isSuper || isSeo || (!user && isAuthenticated);

  const isChecking = authLoading || isAuthChecking;

  useEffect(() => {
    if (!mounted || isChecking) return;

    // 1. Unauthenticated visitor -> Redirect to login with redirect param
    if (!user && !isAuthenticated) {
      const redirectTarget = pathname && pathname.startsWith('/admin') ? pathname : '/admin';
      router.replace(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
      return;
    }

    // 2. Regular customer (no admin or seo role) -> Immediately boot to storefront
    if (user && !hasAdminAccess) {
      router.replace('/');
      return;
    }

    // 3. SEO Manager accessing root /admin or /admin/ -> Route directly to SEO workspace
    if (isSeo && (pathname === '/admin' || pathname === '/admin/')) {
      router.replace('/admin/cms/home');
      return;
    }

    // 4. SEO Manager attempting unauthorized sections -> Route to SEO workspace
    if (isSeo) {
      const relativePath = pathname.replace(/^\/admin/, '') || '/';
      if (!canAccessRoute(relativePath)) {
        router.replace('/admin/cms/home');
      }
    }
  }, [mounted, isChecking, user, isAuthenticated, hasAdminAccess, isSeo, pathname, router, canAccessRoute]);

  // Loading / hydration safety guard
  if (!mounted || isChecking) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs font-mono tracking-wider">Verifying Admin Permissions...</span>
      </div>
    );
  }

  // If unauthenticated: keep clean loading state while redirecting to /login
  if (!user && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs font-mono tracking-wider">Authentication Required. Redirecting to login...</span>
      </div>
    );
  }

  // If regular customer: Block completely and redirect to storefront
  if (user && !hasAdminAccess) {
    return (
      <div className="min-h-screen bg-[#070A11] flex flex-col items-center justify-center gap-4 text-center p-6 text-slate-300">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">Access Denied</h2>
          <p className="text-xs text-slate-400 max-w-sm">
            This management portal is strictly restricted to Trio Enterprises administrators. Redirecting to storefront...
          </p>
        </div>
        <Link
          href="/"
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md"
        >
          Return to Storefront
        </Link>
      </div>
    );
  }

  // Check role-based route permissions for SEO manager
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
            Your role does not have permission to view this section. Please access your dedicated SEO Workspace.
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
