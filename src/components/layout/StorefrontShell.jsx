'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileNav from './MobileNav';
import CartDrawer from '../cart/CartDrawer';
import AuthRequiredModal from '../auth/AuthRequiredModal';
import WhatsAppFloatingButton from '../common/WhatsAppFloatingButton';

export default function StorefrontShell({ children }) {
  const pathname = usePathname() || '';
  const isAdminRoute = pathname.startsWith('/admin');

  // If on administrative routes, render isolated full-screen content without storefront chrome
  if (isAdminRoute) {
    return (
      <div className="min-h-screen w-full bg-[#0B0F19] text-[#F1F5F9] antialiased">
        {children}
      </div>
    );
  }

  // Regular Storefront Layout
  return (
    <div className="min-h-screen flex flex-col w-full max-w-full overflow-x-clip">
      <Navbar />
      <main className="flex-1 w-full max-w-full overflow-x-clip">
        {children}
      </main>
      <Footer />
      <MobileNav />
      <CartDrawer />
      <AuthRequiredModal />
      <WhatsAppFloatingButton />
    </div>
  );
}
