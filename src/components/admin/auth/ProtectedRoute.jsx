'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdmin } from '../../../context/AdminContext';
import { Loader2, ShieldAlert } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isSeoManager, canAccessRoute, isAuthChecking } = useAdmin();
  const router = useRouter();
  const pathname = usePathname() || '';

  useEffect(() => {
    if (!isAuthChecking && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (!isAuthChecking && isAuthenticated && isSeoManager() && (pathname === '/admin' || pathname === '/admin/')) {
      router.replace('/admin/cms/home');
    }
  }, [isAuthenticated, isAuthChecking, isSeoManager, pathname, router]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs font-mono tracking-wider">Verifying Admin Permissions...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs font-mono tracking-wider">Redirecting to Secure Login...</span>
      </div>
    );
  }

  // Check route permission for role (e.g. SEO manager restricted from ecommerce orders/payments)
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
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
        >
          Go to SEO Workspace
        </button>
      </div>
    );
  }

  return children;
};
