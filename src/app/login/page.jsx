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
  return <LoginClient />;
}
