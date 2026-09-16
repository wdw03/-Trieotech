'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../ui/ToastContainer';

export const Layout = ({ children }) => {
  return (
    <div className="flex h-screen w-full bg-[#0B0F19] text-[#F1F5F9] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0B0F19] no-scrollbar">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};
