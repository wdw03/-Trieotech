export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/checkout',
          '/cart',
          '/profile',
          '/profile/*',
          '/order-success/*',
          '/api/*',
        ],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://trioenterprises.in'}/sitemap.xml`,
  };
}
