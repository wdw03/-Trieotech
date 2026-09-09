import { Suspense } from 'react';
import ForgotPasswordClient from '../../components/auth/ForgotPasswordClient';

export const metadata = {
  title: 'Reset Account Password | Trio Enterprises',
  description: 'Recover access to your Trio Enterprises account.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-stone-500">Loading reset...</div>}>
      <ForgotPasswordClient />
    </Suspense>
  );
}
