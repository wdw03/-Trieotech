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

let cachedPickupLocation = null;

/**
 * Fetch primary pickup location nickname from Shiprocket dynamically
 */
export async function getPrimaryPickupLocation() {
  if (cachedPickupLocation) return cachedPickupLocation;
  try {
    const data = await shiprocketFetch('/settings/company/pickup');
    const addresses = data?.data?.shipping_address;
    if (Array.isArray(addresses) && addresses.length > 0) {
      const primary = addresses.find((a) => a.is_primary_location === 1) || addresses[0];
      if (primary?.pickup_location) {
        cachedPickupLocation = primary.pickup_location;
        return cachedPickupLocation;
      }
    }
  } catch (err) {
    console.warn('Could not fetch pickup location, falling back to Home:', err.message);
  }
  return 'Home';
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
  weight,
  length,
  breadth,
  height,
}) {
  let pickupLocation = 'Home';
  try {
    pickupLocation = await getPrimaryPickupLocation();
  } catch (_) {}

  // Calculate package weight and dimensions from items if not directly provided
  let computedWeight = Number(weight);
  let computedLength = Number(length);
  let computedBreadth = Number(breadth);
  let computedHeight = Number(height);

  if (isNaN(computedWeight) || computedWeight <= 0) {
    computedWeight = (items || []).reduce((sum, it) => {
      const w = Number(it.weight || 0.5);
      const q = Number(it.quantity || it.units || 1);
      return sum + (w * q);
    }, 0);
  }

  if (isNaN(computedLength) || computedLength <= 0) {
    computedLength = Math.max(15, ...(items || []).map(it => Number(it.length || it.dimensions?.length || 15)));
  }

  if (isNaN(computedBreadth) || computedBreadth <= 0) {
    computedBreadth = Math.max(10, ...(items || []).map(it => Number(it.breadth || it.dimensions?.breadth || 10)));
  }

  if (isNaN(computedHeight) || computedHeight <= 0) {
    computedHeight = (items || []).reduce((sum, it) => {
      const h = Number(it.height || it.dimensions?.height || 5);
      const q = Number(it.quantity || it.units || 1);
      return sum + (h * q);
    }, 0);
  }

  const finalWeight = Math.max(0.1, Number(computedWeight ? computedWeight.toFixed(3) : 0.5));
  const finalLength = Math.max(10, Math.round(computedLength || 15));
  const finalBreadth = Math.max(10, Math.round(computedBreadth || 10));
  const finalHeight = Math.max(5, Math.min(100, Math.round(computedHeight || 5)));

  const orderData = {
    order_id: orderNumber,
    order_date: orderDate || new Date().toISOString().split('T')[0],
    pickup_location: pickupLocation || 'Home',
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
      name: (item.name || 'Handicraft Item').trim(),
      sku: item.sku || `TRIO-${item.product_id || item.productId || 'GEN'}`,
      units: Number(item.quantity || item.units) || 1,
      selling_price: Number(item.price || item.selling_price) || 0,
      discount: Number(item.discount_amount || item.discount || 0),
      tax: Number(item.tax_rate || 0),
      hsn: String(item.hsn || '6304'),
    })),
    payment_method: paymentMethod === 'cod' ? 'COD' : 'Prepaid',
    sub_total: subtotal,
    length: finalLength,
    breadth: finalBreadth,
    height: finalHeight,
    weight: finalWeight,
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
  pickupPincode = '121001', // Faridabad NIT pickup default
  deliveryPincode,
  weight = 0.5,
  length = 15,
  breadth = 10,
  height = 5,
  cod = false,
}) {
  const cleanPin = String(deliveryPincode || '').trim().replace(/\D/g, '').slice(0, 6);
  const params = new URLSearchParams({
    pickup_postcode: String(pickupPincode || '121001'),
    delivery_postcode: cleanPin,
    weight: String(weight || 0.5),
    length: String(length || 15),
    breadth: String(breadth || 10),
    height: String(height || 5),
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
      length: options.length || 15,
      breadth: options.breadth || 10,
      height: options.height || 5,
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

/**
 * Cancel shipments by AWB numbers
 */
export async function cancelShipment(awbNumbers) {
  const awbs = Array.isArray(awbNumbers) ? awbNumbers : [awbNumbers];
  return shiprocketFetch('/orders/cancel/shipment/awbs', {
    method: 'POST',
    body: JSON.stringify({ awbs }),
  });
}

/**
 * Fully cancel an order and/or shipment in Shiprocket
 * Cancels both the courier AWB (if assigned) and the Shiprocket Order itself.
 * If shiprocketOrderId is not known, searches by channel_order_id (orderNumber).
 */
export async function cancelShiprocketComplete({ orderNumber, shiprocketOrderId, awbNumber } = {}) {
  const result = {
    awbCancelled: false,
    orderCancelled: false,
    shiprocketOrderIds: [],
    errors: [],
  };

  try {
    // 1. Cancel AWB if assigned
    if (awbNumber && !awbNumber.startsWith('SR-') && awbNumber.length > 5) {
      try {
        const awbRes = await cancelShipment([awbNumber]);
        result.awbCancelled = true;
        result.awbResponse = awbRes;
      } catch (awbErr) {
        console.warn('Shiprocket AWB cancel notice:', awbErr.message);
        result.errors.push(`AWB cancel: ${awbErr.message}`);
      }
    }

    // 2. Identify all Shiprocket order IDs to cancel
    const idsToCancel = new Set();
    if (shiprocketOrderId) {
      idsToCancel.add(String(shiprocketOrderId));
    }

    // Also search Shiprocket by channel_order_id if orderNumber is provided
    if (orderNumber) {
      try {
        const searchData = await shiprocketFetch(
          `/orders?filter_by=channel_order_id&filter_value=${encodeURIComponent(orderNumber)}`
        );
        const found = searchData?.data || [];
        for (const o of found) {
          if (o?.id) idsToCancel.add(String(o.id));
        }
      } catch (searchErr) {
        console.warn('Shiprocket order search by channel_order_id notice:', searchErr.message);
      }
    }

    // 3. Cancel the Shiprocket order(s)
    if (idsToCancel.size > 0) {
      const idsArray = Array.from(idsToCancel);
      result.shiprocketOrderIds = idsArray;
      try {
        const cancelRes = await cancelShiprocketOrder(idsArray);
        result.orderCancelled = true;
        result.cancelResponse = cancelRes;
      } catch (cancelErr) {
        console.warn('Shiprocket order cancel notice:', cancelErr.message);
        result.errors.push(`Order cancel: ${cancelErr.message}`);
      }
    }
  } catch (err) {
    console.warn('cancelShiprocketComplete notice:', err.message);
    result.errors.push(err.message);
  }

  return result;
}

/**
 * Get available couriers for a specific Shiprocket order
 */
export async function getAvailableCouriers(orderId) {
  return shiprocketFetch(`/courier/courierListWithCounts?order_id=${orderId}`);
}

/**
 * Assign a specific courier company to a shipment
 */
export async function assignCourier(shipmentId, courierId) {
  return shiprocketFetch('/courier/assign/awb', {
    method: 'POST',
    body: JSON.stringify({
      shipment_id: shipmentId,
      courier_id: courierId,
    }),
  });
}

/**
 * Generate manifest PDF for one or multiple shipments
 */
export async function generateManifest(shipmentIds) {
  const ids = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];
  return shiprocketFetch('/manifests/generate', {
    method: 'POST',
    body: JSON.stringify({
      shipment_id: ids,
    }),
  });
}

/**
 * Print manifest for orders
 */
export async function printManifest(orderIds) {
  const ids = Array.isArray(orderIds) ? orderIds : [orderIds];
  return shiprocketFetch('/manifests/print', {
    method: 'POST',
    body: JSON.stringify({
      order_ids: ids,
    }),
  });
}

/**
 * Generate official Shiprocket invoice PDF for orders
 */
export async function generateInvoice(orderIds) {
  const ids = Array.isArray(orderIds) ? orderIds : [orderIds];
  return shiprocketFetch('/orders/print/invoice', {
    method: 'POST',
    body: JSON.stringify({
      ids: ids,
    }),
  });
}

/**
 * Get NDR details by AWB or retrieve open NDRs
 */
export async function getShiprocketNDR(awb) {
  if (awb) {
    return shiprocketFetch(`/ndr?awb=${encodeURIComponent(awb)}`);
  }
  return shiprocketFetch('/ndr/all');
}

/**
 * Submit NDR action (reattempt, RTO, or cancellation)
 */
export async function ndrReattempt({ awb, action, comments = '', deferredDate = '' }) {
  const body = {
    awb,
    action: action || 'reattempt', // 'reattempt' | 'rto' | 'cancel'
    comments: comments || 'Customer requested reattempt via admin',
  };
  if (deferredDate) {
    body.deferred_date = deferredDate;
  }
  return shiprocketFetch('/ndr', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Get detailed live shipment information by shipment ID
 */
export async function getShipmentDetails(shipmentId) {
  return shiprocketFetch(`/shipments/${shipmentId}`);
}

/**
 * Create a return order in Shiprocket
 */
export async function createReturnOrder({
  orderNumber,
  orderDate,
  pickupCustomerName,
  pickupAddress,
  pickupCity,
  pickupState,
  pickupPincode,
  pickupPhone,
  items,
  subtotal,
  length = 20,
  breadth = 15,
  height = 10,
  weight = 0.5,
}) {
  let deliveryLocation = 'Home';
  try {
    deliveryLocation = await getPrimaryPickupLocation();
  } catch (_) {}

  const returnData = {
    order_id: `RET-${orderNumber}`,
    order_date: orderDate || new Date().toISOString().split('T')[0],
    channel_id: '',
    pickup_customer_name: pickupCustomerName?.split(' ')[0] || 'Customer',
    pickup_last_name: pickupCustomerName?.split(' ').slice(1).join(' ') || '',
    pickup_address: pickupAddress,
    pickup_city: pickupCity,
    pickup_state: pickupState,
    pickup_pincode: pickupPincode,
    pickup_phone: pickupPhone?.replace(/[^0-9]/g, '').slice(-10) || '',
    pickup_is_primary: 0,
    shipping_customer_name: 'Trio Enterprises (Attn: Kashyap ji)',
    shipping_last_name: '',
    shipping_address: 'UNIT NO. 16, first floor, E-43, Nehru ground, N.I.T Faridabad, Near R.B.A COLLEGE',
    shipping_city: 'Faridabad',
    shipping_pincode: '121001',
    shipping_state: 'Haryana',
    shipping_country: 'India',
    shipping_phone: '7065120322',
    order_items: items.map((item) => ({
      name: (item.name || 'Handicraft Item').trim(),
      sku: item.sku || `TRIO-${item.product_id || item.productId || 'GEN'}`,
      units: Number(item.quantity) || 1,
      selling_price: Number(item.price) || 0,
      discount: 0,
      tax: 0,
      hsn: String(item.hsn || '6304'),
    })),
    sub_total: subtotal,
    length,
    breadth,
    height,
    weight,
  };

  return shiprocketFetch('/orders/create/return', {
    method: 'POST',
    body: JSON.stringify(returnData),
  });
}
