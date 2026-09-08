import ProfileClient from '../../components/profile/ProfileClient';

export const metadata = {
  title: 'My Profile & Addresses | Trio Enterprises',
  description: 'Manage your delivery addresses and account information on Trio Enterprises.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
