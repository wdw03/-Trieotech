import { products, getProductBySlug } from '../../../data/products';
import ProductClient from '../../../components/product/ProductClient';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return products.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = getProductBySlug(slug) || products.find(p => p.id === Number(slug));

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
  const product = getProductBySlug(slug) || products.find(p => p.id === Number(slug));

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
