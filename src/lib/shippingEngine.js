import { calculateDynamicShipping } from './shiprocket.js';
import { isCodAvailableForPincode } from './codPincodes.js';
import { supabaseAdmin } from './supabase/admin.js';

// Base domestic shipping rates per item unit (in INR)
export const DEFAULT_UNIT_SHIPPING = 70;
export const DEFAULT_EXPRESS_SURCHARGE = 40; // 70 + 40 = 110 express per unit

/**
 * Calculates shipping charges according to production e-commerce rules:
 * - 1 item (Qty 1) = 1x base shipping (₹70)
 * - 2 items (Qty 2) = 2x base shipping (₹140)
 * - N items (Qty N) = N * base shipping
 * - Multiple products: sum of (product_quantity * product_unit_shipping)
 *
 * @param {Object} params
 * @param {Array} params.items - Cart line items with productId, quantity, and optional product details
 * @param {string} [params.pincode] - 6-digit delivery pincode
 * @param {string} [params.deliveryMethod='standard'] - 'standard' | 'express'
 * @param {boolean} [params.cod=false] - Whether payment is Cash on Delivery
 * @returns {Promise<Object>} Calculated shipping breakdown & total
 */
export async function calculateCartShipping({
  items = [],
  pincode = '',
  deliveryMethod = 'standard',
  cod = false,
} = {}) {
  // If cart is empty, shipping is 0
  if (!Array.isArray(items) || items.length === 0) {
    return {
      success: true,
      shippingFee: 0,
      standardRate: 0,
      expressRate: 0,
      itemCount: 0,
      productCount: 0,
      itemsBreakdown: [],
      deliveryMethod: deliveryMethod || 'standard',
      pincode: pincode || '',
      isCodAvailable: true,
      courierName: 'Standard Surface Shipping',
      estimatedDays: 5,
    };
  }

  // Sanitize delivery pincode
  const cleanPincode = String(pincode || '')
    .trim()
    .replace(/\D/g, '')
    .slice(0, 6);

  let totalStandardShipping = 0;
  let totalExpressShipping = 0;
  let totalQuantity = 0;
  const itemsBreakdown = [];

  // Optional: check product DB for specific custom shipping costs or weights
  for (const item of items) {
    const rawQty = item.quantity !== undefined ? item.quantity : 1;
    const quantity = Math.max(1, parseInt(rawQty, 10) || 1);
    totalQuantity += quantity;

    // Unit rate resolution (check item.shippingCost, product.shipping_cost, or default)
    let unitStandardRate = DEFAULT_UNIT_SHIPPING;
    let unitExpressRate = DEFAULT_UNIT_SHIPPING + DEFAULT_EXPRESS_SURCHARGE;

    // If item or attached product specifies a custom shipping fee
    if (typeof item.shippingCost === 'number' && item.shippingCost > 0) {
      unitStandardRate = item.shippingCost;
      unitExpressRate = unitStandardRate + DEFAULT_EXPRESS_SURCHARGE;
    } else if (typeof item.product?.shipping_cost === 'number' && item.product.shipping_cost > 0) {
      unitStandardRate = item.product.shipping_cost;
      unitExpressRate = unitStandardRate + DEFAULT_EXPRESS_SURCHARGE;
    }

    const itemStandardShipping = quantity * unitStandardRate;
    const itemExpressShipping = quantity * unitExpressRate;

    totalStandardShipping += itemStandardShipping;
    totalExpressShipping += itemExpressShipping;

    itemsBreakdown.push({
      productId: item.productId || item.product_id || item.id || null,
      name: item.name || item.product?.name || 'Craft Product',
      quantity,
      unitStandardRate,
      unitExpressRate,
      itemStandardShipping,
      itemExpressShipping,
    });
  }

  // Check COD availability if pincode is present
  let isCodAvailable = true;
  let courierName = 'Standard Surface Shipping';
  let estimatedDays = 5;
  let carrierDetails = null;

  if (cleanPincode.length === 6) {
    try {
      isCodAvailable = await isCodAvailableForPincode(cleanPincode);
    } catch (_) {
      isCodAvailable = true;
    }

    // Optional carrier details from Shiprocket
    try {
      const approxWeight = Math.max(0.5, totalQuantity * 0.25);
      const srRates = await calculateDynamicShipping(cleanPincode, {
        weight: approxWeight,
        cod: !!cod,
      });

      if (srRates && srRates.available) {
        carrierDetails = srRates;
        if (srRates.standardCourier) {
          courierName = srRates.standardCourier;
        }
        if (srRates.standardDays) {
          estimatedDays = srRates.standardDays;
        }
        if (typeof srRates.isCodAvailable === 'boolean') {
          isCodAvailable = isCodAvailable && srRates.isCodAvailable;
        }
      }
    } catch (srErr) {
      console.warn('Shiprocket rate hint notice:', srErr?.message);
    }
  }

  const isExpress = deliveryMethod === 'express';
  const effectiveShippingFee = isExpress ? totalExpressShipping : totalStandardShipping;

  return {
    success: true,
    shippingFee: effectiveShippingFee,
    standardRate: totalStandardShipping,
    expressRate: totalExpressShipping,
    itemCount: totalQuantity,
    productCount: items.length,
    itemsBreakdown,
    deliveryMethod: isExpress ? 'express' : 'standard',
    pincode: cleanPincode,
    isCodAvailable,
    courierName: isExpress ? 'BlueDart Air Express' : courierName,
    estimatedDays: isExpress ? Math.max(2, estimatedDays - 2) : estimatedDays,
    carrierDetails: carrierDetails || undefined,
  };
}

export async function checkCodServiceability(pincode) {
  try {
    const isAvailable = await isCodAvailableForPincode(pincode);
    return { pincode, isAvailable };
  } catch (_) {
    return { pincode, isAvailable: false };
  }
}

