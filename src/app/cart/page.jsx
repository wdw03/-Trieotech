import CartClient from '../../components/cart/CartClient';

export const metadata = {
  title: 'Shopping Cart | Trio Enterprises',
  description: 'View your selected handcrafted Indian embroidery patches, pure copper bottles, and pooja essentials.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function CartPage() {
  return <CartClient />;
}
