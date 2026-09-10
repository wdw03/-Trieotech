export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { Suspense } from 'react';
import ShopClient from '../../components/shop/ShopClient';

export const metadata = {
  title: 'Shop All Indian Ethnic Crafts | Zardosi Patches, Copper Bottles & Pooja Decor',
  description: 'Browse the complete catalog of Trio Enterprises handcrafted Indian products: zardosi appliques, pure copper bottles, pooja aasans, cotton gamchas, and parandas.',
  alternates: {
    canonical: '/shop',
  },
  openGraph: {
    title: 'Shop All Indian Ethnic Crafts | Trio Enterprises',
    description: 'Browse the complete catalog of handcrafted Indian ethnic items: patches, copper bottles, pooja aasans & festive crafts.',
    url: 'https://trioenterprises.com/shop',
  },
};

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12 text-center text-stone-500">Loading catalog...</div>}>
      <ShopClient />
    </Suspense>
  );
}
