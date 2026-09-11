export const dynamic = 'force-dynamic';
export const revalidate = 0;
import HomeClient from '../components/home/HomeClient';

export const metadata = {
  title: 'Ethnic Craft E-Commerce | Handcrafted Indian Embroidery Patches & Devotional Decor',
  description: 'Shop authentic Indian handcrafted embroidery patches, pure copper hammered water bottles, pooja aasans, desi cotton gamchas, and bridal hair parandas directly from Jaipur & Surat master artisans.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Trio Enterprises | Handcrafted Indian Ethnic Elegance',
    description: 'Shop artisan-crafted zardosi patches, pure copper drinkware, and sacred pooja essentials handcrafted with love in India.',
    url: 'https://trioenterprises.in/',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Trio Enterprises',
  url: 'https://trioenterprises.in',
  logo: 'https://trioenterprises.in/logo.png',
  description: 'Handcrafted Indian Ethnic Elegance & Devotional Crafts',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Jaipur',
    addressRegion: 'Rajasthan',
    addressCountry: 'India',
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
