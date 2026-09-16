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

