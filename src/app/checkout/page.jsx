import CheckoutClient from '../../components/checkout/CheckoutClient';

export const metadata = {
  title: 'Secure Checkout | Trio Enterprises',
  description: 'Complete your purchase with encrypted payments, COD, UPI, and verified express shipping across India.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
