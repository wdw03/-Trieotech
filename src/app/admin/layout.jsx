'use client';

import React, { useEffect } from 'react';
import { AdminProvider } from '../../context/AdminContext';
import { ProtectedRoute } from '../../components/admin/auth/ProtectedRoute';
import { Layout } from '../../components/admin/layout/Layout';

export default function AdminRootLayout({ children }) {
  useEffect(() => {
    // Force document root and body into dark mode for native controls in admin
    const root = document.documentElement;
    const body = document.body;
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
    body.classList.add('dark', 'admin-portal');
    body.style.colorScheme = 'dark';
    body.style.backgroundColor = '#0B0F19';

    return () => {
      const savedTheme = localStorage.getItem('trio_theme');
      if (savedTheme !== 'dark') {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
      body.classList.remove('admin-portal');
      body.style.backgroundColor = '';
      body.style.colorScheme = '';
    };
  }, []);

  useEffect(() => {
    // Intercept and gracefully suppress browser extension & network/QUIC drops from crashing React
    const handleUnhandledRejection = (event) => {
      const reason = event?.reason;
      const message = String(reason?.message || reason || '');
      const isNetworkOrExtensionDrop =
        message.includes('network error') ||
        message.includes('Failed to fetch') ||
        message.includes('QUIC') ||
        message.includes('ObjectMultiplex') ||
        message.includes('app-init-liveness') ||
        (reason?.name === 'TypeError' && message.includes('fetch'));

      if (isNetworkOrExtensionDrop) {
        console.warn('[AdminPortal] Safely caught network/extension event:', message);
        event.preventDefault();
      }
    };

    const handleError = (event) => {
      const message = String(event?.message || '');
      if (
        message.includes('ObjectMultiplex') ||
        message.includes('contentscript') ||
        message.includes('QUIC')
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <div
      suppressHydrationWarning
      className="admin-portal dark min-h-screen w-full bg-[#0B0F19] text-slate-100"
      style={{ colorScheme: 'dark' }}
    >
      <AdminProvider>
        <ProtectedRoute>
          <Layout>
            {children}
          </Layout>
        </ProtectedRoute>
      </AdminProvider>
    </div>
  );
}

