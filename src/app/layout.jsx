import './globals.css';
import Script from 'next/script';
import { Providers } from './providers';
import StorefrontShell from '../components/layout/StorefrontShell';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://trioenterprises.in'),
  title: {
    default: 'Trio Enterprises | Handcrafted Indian Ethnic Elegance & Devotional Crafts',
    template: '%s | Trio Enterprises',
  },
  description: 'Discover exquisite handmade embroidery patches, zardosi motifs, pure copper hammered bottles, devotional pooja thalis, gamchas, parandas, and festive decor by Trio Enterprises.',
  keywords: [
    'trio enterprises',
    'indian handicrafts',
    'embroidery patches',
    'zardosi butti',
    'pure copper bottles',
    'pooja aasan',
    'devotional thali',
    'artificial flowers',
    'chudi rings',
    'cup chain',
    'paranda',
  ],
  authors: [{ name: 'Trio Enterprises' }],
  creator: 'Trio Enterprises',
  publisher: 'Trio Enterprises',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://trioenterprises.in/',
    siteName: 'Trio Enterprises',
    title: 'Trio Enterprises | Authentic Indian Handicrafts & Festivity',
    description: 'Shop artisan-crafted zardosi patches, pure copper drinkware, and sacred pooja essentials handcrafted with love in India.',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Trio Enterprises Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trio Enterprises | Authentic Indian Handicrafts',
    description: 'Handcrafted Indian ethnic embroidery patches, pooja essentials & pure copper bottles.',
    images: ['/logo.png'],
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          rel="preload"
          href="/products/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2JL7SUc.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-ivory-100 text-stone-900 dark:bg-ethnic-dark dark:text-ethnic-text font-sans antialiased selection:bg-gold-500 selection:text-maroon-950 transition-colors duration-200" suppressHydrationWarning>
        <Providers>
          <StorefrontShell>
            {children}
          </StorefrontShell>
        </Providers>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
