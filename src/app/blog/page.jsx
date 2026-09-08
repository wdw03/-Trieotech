import BlogListClient from '../../components/blog/BlogListClient';

export const metadata = {
  title: 'Artisan Craft Journal & DIY Guides | Trio Enterprises',
  description: 'Explore the cultural heritage of Indian Zardosi embroidery, Ayurvedic benefits of copper bottles, and sacred home mandir decoration guides.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Artisan Craft Journal & DIY Guides | Trio Enterprises',
    description: 'Explore stories of royal needlework, ancient Vedic wellness, and festive decor guides.',
    url: 'https://trioenterprises.com/blog',
  },
};

export default function BlogPage() {
  return <BlogListClient />;
}
