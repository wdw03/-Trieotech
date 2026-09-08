import WishlistClient from '../../components/wishlist/WishlistClient';

export const metadata = {
  title: 'My Wishlist | Trio Enterprises',
  description: 'Saved artisanal crafts and favorite Indian ethnic designs on Trio Enterprises.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function WishlistPage() {
  return <WishlistClient />;
}
