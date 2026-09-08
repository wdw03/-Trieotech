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
  return <ForgotPasswordClient />;
}
