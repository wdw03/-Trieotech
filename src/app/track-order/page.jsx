import { Suspense } from 'react';
import OrderTrackingClient from '../../components/orders/OrderTrackingClient';

export const metadata = {
  title: 'Track Order Status | Trio Enterprises',
  description: 'Live delivery updates and tracking for your Trio Enterprises order.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-12 text-center text-stone-500">Loading tracking status...</div>}>
      <OrderTrackingClient />
    </Suspense>
  );
}
