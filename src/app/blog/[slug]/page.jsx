export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

import { getAllBlogs, getBlogBySlug } from '../../../lib/blogs';
import { blogs as fallbackBlogs } from '../../../data/blogs';
import BlogDetailClient from '../../../components/blog/BlogDetailClient';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const blogs = await getAllBlogs();
  return blogs.map((b) => ({
    slug: b.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = (await getBlogBySlug(slug)) || fallbackBlogs.find((b) => b.slug === slug);

  if (!blog) {
    return {
      title: 'Article Not Found | Trio Enterprises',
      description: 'The requested craft article is not available.',
    };
  }

  const title = `${blog.title} | Trio Enterprises`;
  const description = blog.excerpt || 'Read this article from the Trio Enterprises Craft Journal.';
  const image = blog.image || '/logo.png';
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trioenterprises.in';
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image.startsWith('/') ? '' : '/'}${image}`;
  const url = `${siteUrl}/blog/${blog.slug}`;

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
      images: [{ url: fullImageUrl, alt: blog.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullImageUrl],
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const blog = (await getBlogBySlug(slug)) || fallbackBlogs.find((b) => b.slug === slug);

  if (!blog) {
    notFound();
  }

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trioenterprises.in';
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: blog.title,
      description: blog.excerpt,
      image: blog.image ? (blog.image.startsWith('http') ? [blog.image] : [`${siteUrl}${blog.image}`]) : [],
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
          url: `${siteUrl}/logo.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${siteUrl}/blog/${blog.slug}`,
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
