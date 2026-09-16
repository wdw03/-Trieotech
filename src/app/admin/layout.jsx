'use client';

import React from 'react';
import { AdminProvider } from '../../context/AdminContext';
import { ProtectedRoute } from '../../components/admin/auth/ProtectedRoute';
import { Layout } from '../../components/admin/layout/Layout';

export default function AdminRootLayout({ children }) {
  return (
    <div suppressHydrationWarning className="admin-portal min-h-screen w-full bg-[#0B0F19] text-slate-100">
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
