import MyOrdersClient from '../../../components/profile/MyOrdersClient';

export const metadata = {
  title: 'My Orders | Trio Enterprises',
  description: 'View order history, shipping status, and order tracking on Trio Enterprises.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyOrdersPage() {
  return <MyOrdersClient />;
}
