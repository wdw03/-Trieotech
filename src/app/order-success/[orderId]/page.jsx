import OrderSuccessClient from '../../../components/checkout/OrderSuccessClient';

export const metadata = {
  title: 'Order Confirmed | Trio Enterprises',
  description: 'Thank you for your order with Trio Enterprises.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OrderSuccessPage({ params }) {
  const { orderId } = await params;
  return <OrderSuccessClient initialOrderId={orderId} />;
}
