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

  const rawPassword = process.env.SHIPROCKET_PASSWORD || '';
  const password = rawPassword.length > 25
    ? rawPassword
    : (rawPassword.includes('#') ? rawPassword : 'R62RFi2KqMCbCFN4UuzU&tr#h4KhqKj3');
  const email = process.env.SHIPROCKET_EMAIL || 'trioent19@gmail.com';

  const res = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error(`Shiprocket auth failed (${res.status}):`, errText);
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
 * Create a Shiprocket order and attempt to assign/generate live AWB number
 */
export async function createOrderAndAssignAWB(orderParams) {
  const result = await createShiprocketOrder(orderParams);
  let awbCode = result?.awb_code || '';
  let courierName = result?.courier_name || '';

  // If AWB is not immediately in create response, attempt to assign AWB using shipment_id
  if (!awbCode && result?.shipment_id) {
    try {
      const awbRes = await generateAWB(result.shipment_id);
      if (awbRes?.response?.data?.awb_code) {
        awbCode = awbRes.response.data.awb_code;
        courierName = awbRes.response.data.courier_name || courierName;
      } else if (awbRes?.awb_code) {
        awbCode = awbRes.awb_code;
      }
    } catch (awbErr) {
      console.warn('Shiprocket AWB assignment attempt notice:', awbErr.message);
    }
  }

  const finalAwb = awbCode || `SR-${result?.order_id || result?.shipment_id || orderParams.orderNumber}`;
  const finalCourier = courierName || 'Shiprocket Express';

  return {
    ...result,
    awb_code: finalAwb,
    courier_name: finalCourier,
  };
}

/**
 * Get available shipping rates for a delivery from Shiprocket
 */
export async function getShippingRates({
  pickupPincode = '121005', // Faridabad pickup default
  deliveryPincode,
  weight = 0.5,
  cod = false,
}) {
  const cleanPin = String(deliveryPincode || '').trim().replace(/\D/g, '').slice(0, 6);
  const params = new URLSearchParams({
    pickup_postcode: String(pickupPincode || '121005'),
    delivery_postcode: cleanPin,
    weight: String(weight || 0.5),
    cod: cod ? '1' : '0',
  });

  return shiprocketFetch(`/courier/serviceability/?${params.toString()}`);
}

/**
 * Calculate dynamic shipping rates, courier options, and delivery dates
 */
export async function calculateDynamicShipping(deliveryPincode, options = {}) {
  const cleanPin = String(deliveryPincode || '').trim().replace(/\D/g, '').slice(0, 6);

  if (!cleanPin || cleanPin.length !== 6) {
    return {
      available: false,
      pincode: cleanPin,
      shippingFee: 70,
      message: 'Please enter a valid 6-digit delivery pincode',
    };
  }

  try {
    const rawData = await getShippingRates({
      pickupPincode: options.pickupPincode || '121005',
      deliveryPincode: cleanPin,
      weight: options.weight || 0.5,
      cod: !!options.cod,
    });

    const couriers = rawData?.data?.available_courier_companies || [];

    if (couriers.length === 0) {
      return {
        available: false,
        pincode: cleanPin,
        shippingFee: 70,
        standardRate: 70,
        expressRate: 110,
        message: 'No direct Shiprocket courier available for this pincode.',
        fallback: true,
      };
    }

    // Sort couriers by rate ascending
    const sorted = [...couriers].sort((a, b) => Number(a.rate) - Number(b.rate));

    // Find recommended courier
    const recId = rawData.data?.recommended_courier_company_id || rawData.data?.shiprocket_recommended_courier_id;
    const recommended = couriers.find((c) => c.courier_company_id === recId) || sorted[0];

    // Surface courier (economical / standard)
    const surfaceCourier =
      couriers.find((c) => c.courier_name?.toLowerCase().includes('surface')) || sorted[0];

    // Air courier (express)
    const airCourier =
      couriers.find(
        (c) =>
          c.courier_name?.toLowerCase().includes('air') ||
          c.courier_name?.toLowerCase().includes('express') ||
          c.courier_name?.toLowerCase().includes('blue dart')
      ) || sorted[sorted.length - 1];

    const standardRate = Math.round(Number(surfaceCourier.rate || recommended.rate));
    const expressRate = Math.round(Number(airCourier.rate || standardRate + 40));

    // Check if COD is supported by any courier
    const isCodAvailable = couriers.some((c) => c.cod === 1);

    return {
      success: true,
      available: true,
      pincode: cleanPin,
      shippingFee: standardRate,
      courierName: surfaceCourier.courier_name || 'Standard Surface Delivery',
      etd: surfaceCourier.etd || `${surfaceCourier.estimated_delivery_days || 5} days`,
      standardRate,
      standardCourier: surfaceCourier.courier_name || 'Standard Surface Delivery',
      standardDays: surfaceCourier.estimated_delivery_days || 5,
      standardEtd: surfaceCourier.etd || `${surfaceCourier.estimated_delivery_days || 5} days`,
      expressRate,
      expressCourier: airCourier.courier_name || 'BlueDart Air Express',
      expressDays: airCourier.estimated_delivery_days || 3,
      expressEtd: airCourier.etd || `${airCourier.estimated_delivery_days || 3} days`,
      recommendedRate: Math.round(Number(recommended.rate)),
      recommendedCourier: recommended.courier_name,
      isCodAvailable,
      couriers: couriers.slice(0, 5).map((c) => ({
        id: c.courier_company_id,
        name: c.courier_name,
        rate: Math.round(Number(c.rate)),
        etd: c.etd,
        days: c.estimated_delivery_days,
        cod: c.cod === 1,
      })),
    };
  } catch (err) {
    console.warn(`Shiprocket dynamic rate lookup failed for PIN ${cleanPin}:`, err.message);
    return {
      available: true,
      fallback: true,
      pincode: cleanPin,
      shippingFee: 70,
      courierName: 'Standard Surface Shipping',
      etd: '5-7 business days',
      standardRate: 70,
      standardCourier: 'Standard Surface Shipping',
      standardDays: 5,
      standardEtd: '5-7 business days',
      expressRate: 110,
      expressCourier: 'BlueDart Air Express',
      expressDays: 3,
      expressEtd: '2-3 business days',
      isCodAvailable: true,
    };
  }
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

/**
 * Generate official Shiprocket shipping label PDF
 */
export async function generateLabel(shipmentIds) {
  return shiprocketFetch('/courier/generate/label', {
    method: 'POST',
    body: JSON.stringify({
      shipment_id: Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds],
    }),
  });
}

/**
 * Get Shiprocket order details
 */
export async function getShiprocketOrderDetails(shiprocketOrderId) {
  return shiprocketFetch(`/orders/show/${shiprocketOrderId}`);
}
