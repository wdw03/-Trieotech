import { categories, getCategoryBySlug as getFallbackCategoryBySlug } from '../../../data/categories';
import { getCategoryBySlug as getLiveCategoryBySlug } from '../../../lib/api/products';
import { products } from '../../../data/products';
import CategoryClient from '../../../components/category/CategoryClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

async function findCategory(rawSlug) {
  if (!rawSlug) return null;
  const slug = decodeURIComponent(rawSlug).trim();
  try {
    const live = await getLiveCategoryBySlug(slug.toLowerCase());
    if (live) return live;
  } catch (_) {}
  return getFallbackCategoryBySlug(slug) || categories.find(c => c.slug?.toLowerCase() === slug.toLowerCase()) || null;
}

export async function generateStaticParams() {
  const slugs = new Set(categories.map((c) => c.slug));
  slugs.add('pooja-articles');
  slugs.add('aasan');
  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await findCategory(slug);

  if (!category) {
    const matchingProduct = products.find(
      p => p.category.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-') === slug?.toLowerCase()
    );
    if (matchingProduct) {
      return {
        title: `${matchingProduct.category} Collection | Trio Enterprises`,
        description: `Explore our collection of authentic ${matchingProduct.category} handcrafted by Indian artisans.`,
      };
    }
    const clean = decodeURIComponent(slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (clean === 'aasan' || clean === 'pooja-articles') {
      return {
        title: `Pooja Articles Collection | Trio Enterprises`,
        description: `Explore our collection of authentic Pooja Articles and sacred aasans handcrafted by Indian artisans.`,
      };
    }
    return {
      title: 'Category Not Found | Trio Enterprises',
      description: 'The requested craft category is not available.',
    };
  }

  const title = `${category.name} Collection | Trio Enterprises`;
  const description = category.description || `Handcrafted ${category.name} collection by master artisans.`;
  const image = category.image || '/logo.png';
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trioenterprises.in';
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image.startsWith('/') ? '' : '/'}${image}`;
  const url = `${siteUrl}/category/${category.slug}`;

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
      images: [{ url: fullImageUrl, alt: category.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullImageUrl],
    },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  let category = await findCategory(slug);
  const matchingProduct = !category ? products.find(
    p => p.category.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-') === slug?.toLowerCase()
  ) : null;

  if (!category && !matchingProduct) {
    const clean = decodeURIComponent(slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (clean === 'aasan' || clean === 'pooja-articles') {
      category = categories.find(c => c.id === 3 || c.slug === 'pooja-articles' || c.slug === 'aasan');
    } else {
      notFound();
    }
  }

  const currentCategory = category || {
    name: matchingProduct?.category || 'Pooja Articles',
    slug: slug,
    description: `Explore our collection of authentic ${matchingProduct?.category || 'Pooja Articles'} handcrafted by Indian artisans.`,
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: currentCategory.name,
    description: currentCategory.description,
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://trioenterprises.in'}/category/${currentCategory.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryClient initialSlug={slug} initialCategory={currentCategory} />
    </>
  );
}
