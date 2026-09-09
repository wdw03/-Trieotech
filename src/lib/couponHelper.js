/**
 * Helper utilities for coupon serialization, metadata parsing, and discount calculation.
 */

export function serializeCouponDescription({ description, applicableProductIds, applicableProductNames }) {
  const metadata = {
    text: (description || '').trim(),
    applicableProductIds: Array.isArray(applicableProductIds) ? applicableProductIds.map(String) : [],
    applicableProductNames: Array.isArray(applicableProductNames) ? applicableProductNames : []
  };
  return JSON.stringify(metadata);
}

export function parseCouponDescription(rawDescription) {
  if (!rawDescription) {
    return { text: '', applicableProductIds: [], applicableProductNames: [] };
  }
  try {
    if (typeof rawDescription === 'string' && rawDescription.trim().startsWith('{')) {
      const parsed = JSON.parse(rawDescription);
      const productIds = Array.isArray(parsed.applicableProductIds)
        ? parsed.applicableProductIds
        : (Array.isArray(parsed.product_ids) ? parsed.product_ids : []);
      const productNames = Array.isArray(parsed.applicableProductNames)
        ? parsed.applicableProductNames
        : (Array.isArray(parsed.product_names) ? parsed.product_names : []);

      return {
        text: parsed.text || '',
        applicableProductIds: productIds.map(String),
        applicableProductNames: productNames
      };
    }
  } catch (_) {}

  return {
    text: String(rawDescription),
    applicableProductIds: [],
    applicableProductNames: []
  };
}

/**
 * Format raw coupon DB row for client / dashboard responses
 */
export function formatCoupon(raw) {
  const meta = parseCouponDescription(raw.description);
  const now = new Date();
  const isExpired = raw.expires_at ? new Date(raw.expires_at) < now : false;

  return {
    id: raw.id,
    code: raw.code,
    description: meta.text || raw.description || '',
    discountType: raw.discount_type, // 'percentage' | 'flat'
    value: Number(raw.value) || 0,
    minSpend: Number(raw.min_spend) || 0,
    maxDiscount: raw.max_discount ? Number(raw.max_discount) : null,
    maxUses: raw.max_uses ? Number(raw.max_uses) : null,
    usedCount: Number(raw.used_count) || 0,
    isActive: Boolean(raw.is_active),
    isExpired,
    startsAt: raw.starts_at,
    expiresAt: raw.expires_at,
    createdAt: raw.created_at,
    applicableProductIds: meta.applicableProductIds,
    applicableProductNames: meta.applicableProductNames,
    scope: meta.applicableProductIds.length > 0 ? 'specific' : 'all'
  };
}

/**
 * Validates coupon against cart items & calculates eligible discount.
 * Returns { valid: boolean, error?: string, errorType?: string, discount: number, eligibleItemCount: number, eligibleSubtotal: number }
 */
export function evaluateCouponEligibility(coupon, cartItems = [], cartSubtotal = 0) {
  const cleanCode = coupon.code.toUpperCase();
  const now = new Date();

  // 1. Check Active
  if (!coupon.is_active) {
    return {
      valid: false,
      error: `Coupon "${cleanCode}" is inactive or disabled.`,
      errorType: 'INACTIVE'
    };
  }

  // 2. Check Expiry
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    const formattedDate = new Date(coupon.expires_at).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return {
      valid: false,
      error: `This coupon code expired on ${formattedDate}.`,
      errorType: 'EXPIRED'
    };
  }

  // 3. Check Usage Limits
  if (coupon.max_uses && (coupon.used_count || 0) >= coupon.max_uses) {
    return {
      valid: false,
      error: `Coupon "${cleanCode}" has reached its maximum redemption limit.`,
      errorType: 'MAX_USES_REACHED'
    };
  }

  // 4. Product-specific eligibility check
  const meta = parseCouponDescription(coupon.description);
  const applicableIds = meta.applicableProductIds || [];

  let eligibleItems = [];
  let eligibleSubtotal = 0;

  if (applicableIds.length > 0) {
    // Specific products required!
    eligibleItems = cartItems.filter(item => {
      const itemPid = String(item.productId || item.id || (item.product && item.product.id) || '');
      return applicableIds.includes(itemPid);
    });

    if (eligibleItems.length === 0) {
      return {
        valid: false,
        error: 'This item is not eligible for this coupon code',
        errorType: 'NOT_ELIGIBLE',
        applicableProductIds: applicableIds,
        applicableProductNames: meta.applicableProductNames
      };
    }

    eligibleSubtotal = eligibleItems.reduce((sum, item) => {
      const itemPrice = Number(item.price) || 0;
      const itemQty = Number(item.quantity) || 1;
      return sum + (itemPrice * itemQty);
    }, 0);
  } else {
    // Applicable to all items in cart
    eligibleItems = [...cartItems];
    eligibleSubtotal = cartSubtotal > 0
      ? cartSubtotal
      : cartItems.reduce((sum, item) => sum + (Number(item.price || 0) * (Number(item.quantity) || 1)), 0);
  }

  // 5. Min Spend Check (based on eligible subtotal or overall subtotal)
  const minSpend = Number(coupon.min_spend) || 0;
  if (minSpend > 0 && eligibleSubtotal < minSpend) {
    return {
      valid: false,
      error: `Minimum spend of ₹${minSpend.toLocaleString('en-IN')} on eligible items required for ${cleanCode}.`,
      errorType: 'MIN_SPEND_NOT_MET',
      requiredMinSpend: minSpend,
      eligibleSubtotal
    };
  }

  // 6. Discount Calculation (strictly over eligible items)
  let discount = 0;
  const val = Number(coupon.value) || 0;

  if (coupon.discount_type === 'percentage') {
    discount = Math.round((eligibleSubtotal * val) / 100);
    if (coupon.max_discount) {
      discount = Math.min(discount, Number(coupon.max_discount));
    }
  } else {
    // Flat discount capped at eligible subtotal
    discount = Math.min(eligibleSubtotal, val);
  }

  return {
    valid: true,
    discount,
    eligibleItemCount: eligibleItems.length,
    eligibleSubtotal,
    eligibleProductIds: eligibleItems.map(i => String(i.productId || i.id)),
    applicableProductIds: applicableIds,
    applicableProductNames: meta.applicableProductNames
  };
}
