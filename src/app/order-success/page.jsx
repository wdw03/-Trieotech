import { redirect } from 'next/navigation';

export default function OrderSuccessIndexPage() {
  redirect('/profile');
}
