import { products, getProductBySlug as getFallbackProductBySlug } from '../../../data/products';
import { getProductBySlug as getLiveProductBySlug } from '../../../lib/api/products';
import ProductClient from '../../../components/product/ProductClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

async function findProduct(rawSlug) {
  if (!rawSlug) return null;
  const slug = decodeURIComponent(rawSlug).trim();
  try {
    const isNumeric = /^\d+$/.test(slug);
    let live = null;
    if (isNumeric) {
      const { getProductById } = await import('../../../lib/api/products');
      live = await getProductById(Number(slug));
    } else {
      live = await getLiveProductBySlug(slug.toLowerCase());
      if (!live && slug !== slug.toLowerCase()) {
        live = await getLiveProductBySlug(slug);
      }
    }
    if (live) return live;
  } catch (_) {}
  return getFallbackProductBySlug(slug) || products.find((p) => p.slug?.toLowerCase() === slug.toLowerCase() || p.id === Number(slug)) || null;
}

export async function generateStaticParams() {
  return products.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await findProduct(slug);

  if (!product) {
    return {
      title: 'Craft Not Found | Trio Enterprises',
      description: 'The requested handcrafted ethnic item is not available.',
    };
  }

  const title = `${product.name} | Trio Enterprises`;
  const description = product.shortDescription || product.description?.slice(0, 155) || 'Authentic handcrafted Indian ethnic craft.';
  const image = product.images?.[0] || '/logo.png';
  const url = `https://trioenterprises.com/product/${product.slug}`;

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
      siteName: 'Trio Enterprises',
      type: 'article',
      images: [
        {
          url: image,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await findProduct(slug);

  if (!product) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images || [],
    description: product.description || product.shortDescription,
    sku: `TRIO-${product.id}`,
    brand: {
      '@type': 'Brand',
      name: 'Trio Enterprises',
    },
    offers: {
      '@type': 'Offer',
      url: `https://trioenterprises.com/product/${product.slug}`,
      priceCurrency: 'INR',
      price: product.price,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating || 5,
      reviewCount: product.reviewCount || 1,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClient initialSlug={slug} />
    </>
  );
}
