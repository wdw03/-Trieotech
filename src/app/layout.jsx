import './globals.css';
import { Providers } from './providers';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import MobileNav from '../components/layout/MobileNav';
import CartDrawer from '../components/cart/CartDrawer';

export const metadata = {
  metadataBase: new URL('https://trioenterprises.com'),
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
    url: 'https://trioenterprises.com/',
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
      <body className="bg-ivory-100 text-stone-900 dark:bg-ethnic-dark dark:text-ethnic-text font-sans antialiased selection:bg-gold-500 selection:text-maroon-950 transition-colors duration-200" suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen flex flex-col w-full max-w-full overflow-x-clip">
            <Navbar />
            <main className="flex-1 w-full max-w-full overflow-x-clip">
              {children}
            </main>
            <Footer />
            <MobileNav />
            <CartDrawer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
