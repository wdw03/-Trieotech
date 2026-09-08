import { getAllBlogs, getBlogBySlug } from '../../../lib/blogs';
import { blogs as fallbackBlogs } from '../../../data/blogs';
import BlogDetailClient from '../../../components/blog/BlogDetailClient';
import { notFound } from 'next/navigation';

export const dynamicParams = true;

export async function generateStaticParams() {
  const blogs = getAllBlogs();
  return blogs.map((b) => ({
    slug: b.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = getBlogBySlug(slug) || fallbackBlogs.find(b => b.slug === slug);

  if (!blog) {
    return {
      title: 'Article Not Found | Trio Enterprises',
      description: 'The requested craft article is not available.',
    };
  }

  const title = `${blog.title} | Trio Enterprises`;
  const description = blog.excerpt || 'Read this article from the Trio Enterprises Craft Journal.';
  const image = blog.image || '/logo.png';
  const url = `https://trioenterprises.com/blog/${blog.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      images: [{ url: image, alt: blog.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const blog = getBlogBySlug(slug) || fallbackBlogs.find(b => b.slug === slug);

  if (!blog) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description: blog.excerpt,
    image: blog.image ? (blog.image.startsWith('http') ? [blog.image] : [`https://trioenterprises.com${blog.image}`]) : [],
    datePublished: blog.date,
    author: {
      '@type': 'Person',
      name: blog.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Trio Enterprises',
      logo: {
        '@type': 'ImageObject',
        url: 'https://trioenterprises.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://trioenterprises.com/blog/${blog.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogDetailClient initialSlug={slug} initialBlog={blog} />
    </>
  );
}
