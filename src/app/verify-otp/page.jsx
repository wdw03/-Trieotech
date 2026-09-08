import { Suspense } from 'react';
import VerifyOtpClient from '../../components/auth/VerifyOtpClient';

export const metadata = {
  title: 'Verify Email & Login | Trio Enterprises',
  description: 'Enter your 6-digit verification code to activate your artisan patron account.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center text-stone-500 text-xs">
          Loading verification...
        </div>
      }
    >
      <VerifyOtpClient />
    </Suspense>
  );
}
