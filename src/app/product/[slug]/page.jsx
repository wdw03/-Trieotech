import { products, getProductBySlug as getFallbackProductBySlug } from '../../../data/products';
import { getProductBySlug as getLiveProductBySlug } from '../../../lib/api/products';
import { normalizeProduct } from '../../../lib/api/store';
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
    if (live) return normalizeProduct(live);
  } catch (_) {}
  const fallback = getFallbackProductBySlug(slug) || products.find((p) => p.slug?.toLowerCase() === slug.toLowerCase() || p.id === Number(slug)) || null;
  return fallback ? normalizeProduct(fallback) : null;
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
  const image = (Array.isArray(product.images) && product.images[0]) || product.image || '/logo.png';
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trioenterprises.in';
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image.startsWith('/') ? '' : '/'}${image}`;
  const url = `${siteUrl}/product/${product.slug}`;

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
          url: fullImageUrl,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullImageUrl],
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await findProduct(slug);

  if (!product) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trioenterprises.in';
  const prodImages = (Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image || '/logo.png'])
    .map((img) => (img.startsWith('http') ? img : `${siteUrl}${img.startsWith('/') ? '' : '/'}${img}`));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: prodImages,
    description: product.description || product.shortDescription || 'Authentic handcrafted Indian ethnic craft.',
    sku: `TRIO-${product.id}`,
    brand: {
      '@type': 'Brand',
      name: 'Trio Enterprises',
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/product/${product.slug}`,
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
      <ProductClient initialSlug={slug} initialProduct={product} />
    </>
  );
}
