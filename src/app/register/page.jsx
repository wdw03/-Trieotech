import RegisterClient from '../../components/auth/RegisterClient';

export const metadata = {
  title: 'Create an Artisan Guild Account | Trio Enterprises',
  description: 'Join the Trio Enterprises community for handcrafted Indian ethnic crafts, exclusive festival drops, and patron benefits.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterPage() {
  return <RegisterClient />;
}
