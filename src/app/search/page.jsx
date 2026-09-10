export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import SearchClient from '../../components/search/SearchClient';

export const metadata = {
  title: 'Search Handcrafted Indian Crafts | Trio Enterprises',
  description: 'Search across 43+ authentic Indian embroidery patches, zardosi motifs, copper bottles, and sacred pooja essentials.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12 text-center text-stone-500">Loading search...</div>}>
      <SearchClient />
    </Suspense>
  );
}
