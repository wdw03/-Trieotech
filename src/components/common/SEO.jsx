import React from 'react';
import { Helmet } from 'react-helmet-async';

export const SEO = ({
  title,
  description = "Shop exquisite handcrafted Indian embroidery patches, pure copper bottles, pooja aasans, cotton gamchas, and festive decor from master karigars at Trio Ecart.",
  keywords = "trio ecart, indian handicrafts, embroidery patches, zardosi, pooja aasan, copper bottle, paranda, gamcha",
  image = "/products/shreenathji-statement-patch-1.jpg",
  url = "https://trioecart.com",
  product = null,
  breadcrumbs = null,
}) => {
  const fullTitle = title ? `${title} | Trio Ecart - Indian Handicrafts & Ethnic Decor` : "Trio Ecart | Handcrafted Indian Ethnic Elegance & Devotional Crafts";
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://trioecart.com';
  const fullImage = image?.startsWith('http') ? image : `${origin}${image}`;

  // Structured Data (JSON-LD)
  const productSchema = product ? {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images?.map(img => img.startsWith('http') ? img : `${origin}${img}`) || [fullImage],
    "description": product.shortDescription || product.description,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Trio Ecart"
    },
    "offers": {
      "@type": "Offer",
      "url": typeof window !== 'undefined' ? window.location.href : url,
      "priceCurrency": "INR",
      "price": product.price,
      "priceValidUntil": "2027-12-31",
      "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating || 4.8,
      "reviewCount": product.reviewCount || 12
    }
  } : null;

  const breadcrumbSchema = breadcrumbs ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((b, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": b.name,
      "item": `${origin}${b.url}`
    }))
  } : null;

  return (
    <Helmet>
      {/* Primary HTML Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={product ? "product" : "website"} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : url} />
      <meta property="og:site_name" content="Trio Ecart" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImage} />

      {/* Structured Data Scripts */}
      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      )}

      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
