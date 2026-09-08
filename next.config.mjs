/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/account',
        destination: '/profile',
        permanent: true,
      },
      {
        source: '/account/orders',
        destination: '/profile/orders',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
