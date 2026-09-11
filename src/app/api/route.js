import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const host = request.headers.get('host') || 'trioenterprises.in';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  return NextResponse.json({
    name: 'Trio Enterprises Fullstack API',
    status: 'online',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    baseUrl,
    endpoints: {
      health: `${baseUrl}/api/health`,
      storefront: {
        products: `${baseUrl}/api/products`,
        categories: `${baseUrl}/api/categories`,
        cart: `${baseUrl}/api/cart`,
        wishlist: `${baseUrl}/api/wishlist`,
        createOrder: `${baseUrl}/api/orders/create`,
        orderHistory: `${baseUrl}/api/orders/history`,
        verifyPayment: `${baseUrl}/api/payments/verify`,
        shippingRates: `${baseUrl}/api/shipping/rates`,
        shippingCalculate: `${baseUrl}/api/shipping/calculate`,
        shippingTrack: `${baseUrl}/api/shipping/track`,
        blogs: `${baseUrl}/api/blogs`,
        validateCoupon: `${baseUrl}/api/coupons/validate`,
      },
      admin: {
        stats: `${baseUrl}/api/admin/stats`,
        products: `${baseUrl}/api/admin/products`,
        categories: `${baseUrl}/api/admin/categories`,
        orders: `${baseUrl}/api/admin/orders`,
        customers: `${baseUrl}/api/admin/customers`,
        returns: `${baseUrl}/api/admin/returns`,
        shipments: `${baseUrl}/api/admin/shipments/create`,
        uploadImage: `${baseUrl}/api/admin/upload`,
      },
      webhooks: {
        razorpay: `${baseUrl}/api/payments/razorpay-webhook`,
        shiprocket: `${baseUrl}/api/webhooks/shiprocket`,
      },
    },
  });
}
