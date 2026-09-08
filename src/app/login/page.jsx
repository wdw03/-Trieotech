import { Suspense } from 'react';
import LoginClient from '../../components/auth/LoginClient';

export const metadata = {
  title: 'Sign In to Your Account | Trio Enterprises',
  description: 'Log in to track your handcrafted ethnic orders, manage wishlists, and view exclusive patron discounts.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-stone-500">Loading sign in...</div>}>
      <LoginClient />
    </Suspense>
  );
}
