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
    sitemap: 'https://trioenterprises.com/sitemap.xml',
  };
}
