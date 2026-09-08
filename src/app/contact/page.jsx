import ContactClient from '../../components/static/ContactClient';

export const metadata = {
  title: 'Contact Trio Enterprises | Artisan Support & Inquiries',
  description: 'Get in touch with Trio Enterprises for custom bridal patch orders, bulk pooja thali gifting, copper jug requirements, and delivery support.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Trio Enterprises | Artisan Support & Inquiries',
    description: 'Get in touch with Trio Enterprises for orders, bridal patch customization, and support.',
    url: 'https://trioenterprises.com/contact',
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
