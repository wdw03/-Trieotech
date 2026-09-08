import { categories, getCategoryBySlug as getFallbackCategoryBySlug } from '../../../data/categories';
import { getCategoryBySlug as getLiveCategoryBySlug } from '../../../lib/api/products';
import { products } from '../../../data/products';
import CategoryClient from '../../../components/category/CategoryClient';
import { notFound } from 'next/navigation';

export const dynamicParams = true;

async function findCategory(slug) {
  try {
    const live = await getLiveCategoryBySlug(slug);
    if (live) return live;
  } catch (_) {}
  return getFallbackCategoryBySlug(slug) || categories.find(c => c.slug === slug) || null;
}

export async function generateStaticParams() {
  return categories.map((c) => ({
    slug: c.slug,
  }));
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
    return {
      title: 'Category Not Found | Trio Enterprises',
      description: 'The requested craft category is not available.',
    };
  }

  const title = `${category.name} Collection | Trio Enterprises`;
  const description = category.description || `Handcrafted ${category.name} collection by master artisans.`;
  const image = category.image || '/logo.png';
  const url = `https://trioenterprises.com/category/${category.slug}`;

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
      images: [{ url: image, alt: category.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = await findCategory(slug);
  const matchingProduct = !category ? products.find(
    p => p.category.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-') === slug?.toLowerCase()
  ) : null;

  if (!category && !matchingProduct) {
    notFound();
  }

  const currentCategory = category || {
    name: matchingProduct.category,
    slug: slug,
    description: `Explore our collection of authentic ${matchingProduct.category} handcrafted by Indian artisans.`,
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: currentCategory.name,
    description: currentCategory.description,
    url: `https://trioenterprises.com/category/${currentCategory.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryClient initialSlug={slug} />
    </>
  );
}
