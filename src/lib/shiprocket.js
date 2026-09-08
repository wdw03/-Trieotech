const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken = null;
let tokenExpiry = 0;

/**
 * Authenticate with Shiprocket and get JWT token
 */
export async function getShiprocketToken() {
  // Return cached token if still valid (tokens last 10 days, we refresh daily)
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const res = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  if (!res.ok) {
    throw new Error(`Shiprocket auth failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = data.token;
  tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // Cache for 24 hours
  return cachedToken;
}

/**
 * Make authenticated Shiprocket API request
 */
async function shiprocketFetch(endpoint, options = {}) {
  const token = await getShiprocketToken();

  const res = await fetch(`${SHIPROCKET_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Shiprocket API error [${endpoint}]:`, errorText);
    throw new Error(`Shiprocket API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Create a Shiprocket order
 */
export async function createShiprocketOrder({
  orderNumber,
  orderDate,
  billingAddress,
  shippingAddress,
  items,
  paymentMethod,
  subtotal,
  discount = 0,
  shippingCharges = 0,
}) {
  const orderData = {
    order_id: orderNumber,
    order_date: orderDate || new Date().toISOString().split('T')[0],
    pickup_location: 'Primary',
    channel_id: '',
    comment: `Trio Enterprises Order ${orderNumber}`,
    billing_customer_name: billingAddress.name?.split(' ')[0] || '',
    billing_last_name: billingAddress.name?.split(' ').slice(1).join(' ') || '',
    billing_address: billingAddress.address || billingAddress.address_line,
    billing_city: billingAddress.city,
    billing_pincode: billingAddress.pincode || billingAddress.zip,
    billing_state: billingAddress.state,
    billing_country: billingAddress.country || 'India',
    billing_email: billingAddress.email || '',
    billing_phone: billingAddress.phone?.replace(/[^0-9]/g, '').slice(-10) || '',
    shipping_is_billing: true,
    shipping_customer_name: shippingAddress.name?.split(' ')[0] || '',
    shipping_last_name: shippingAddress.name?.split(' ').slice(1).join(' ') || '',
    shipping_address: shippingAddress.address || shippingAddress.address_line,
    shipping_city: shippingAddress.city,
    shipping_pincode: shippingAddress.pincode || shippingAddress.zip,
    shipping_state: shippingAddress.state,
    shipping_country: shippingAddress.country || 'India',
    shipping_email: shippingAddress.email || '',
    shipping_phone: shippingAddress.phone?.replace(/[^0-9]/g, '').slice(-10) || '',
    order_items: items.map((item) => ({
      name: item.name?.substring(0, 100),
      sku: `TRIO-${item.product_id || item.productId}`,
      units: item.quantity,
      selling_price: item.price,
      discount: 0,
      tax: 0,
      hsn: '',
    })),
    payment_method: paymentMethod === 'cod' ? 'COD' : 'Prepaid',
    sub_total: subtotal,
    length: 20,
    breadth: 15,
    height: 10,
    weight: 0.5,
  };

  return shiprocketFetch('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

/**
 * Get available shipping rates for a delivery
 */
export async function getShippingRates({
  pickupPincode = '302001', // Jaipur default
  deliveryPincode,
  weight = 0.5,
  cod = false,
}) {
  const params = new URLSearchParams({
    pickup_postcode: pickupPincode,
    delivery_postcode: deliveryPincode,
    weight: String(weight),
    cod: cod ? '1' : '0',
  });

  return shiprocketFetch(`/courier/serviceability?${params.toString()}`);
}

/**
 * Track shipment by AWB number
 */
export async function trackShipment(awbNumber) {
  return shiprocketFetch(`/courier/track/awb/${awbNumber}`);
}

/**
 * Track shipment by Shiprocket order ID
 */
export async function trackByOrderId(shiprocketOrderId) {
  return shiprocketFetch(`/courier/track?order_id=${shiprocketOrderId}`);
}

/**
 * Cancel a Shiprocket order
 */
export async function cancelShiprocketOrder(shiprocketOrderIds) {
  return shiprocketFetch('/orders/cancel', {
    method: 'POST',
    body: JSON.stringify({ ids: Array.isArray(shiprocketOrderIds) ? shiprocketOrderIds : [shiprocketOrderIds] }),
  });
}

/**
 * Generate AWB for a shipment
 */
export async function generateAWB(shipmentId, courierId) {
  return shiprocketFetch('/courier/assign/awb', {
    method: 'POST',
    body: JSON.stringify({
      shipment_id: shipmentId,
      courier_id: courierId,
    }),
  });
}

/**
 * Request pickup for a shipment
 */
export async function requestPickup(shipmentId) {
  return shiprocketFetch('/courier/generate/pickup', {
    method: 'POST',
    body: JSON.stringify({
      shipment_id: [shipmentId],
    }),
  });
}
