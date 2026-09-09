export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { evaluateCouponEligibility, parseCouponDescription } from '../../../../lib/couponHelper';

// POST: Validate a coupon code server-side with product-level eligibility & expiry checks
export async function POST(request) {
  try {
    const { code, subtotal = 0, items = [] } = await request.json();

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Coupon code required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle();

    if (error || !coupon) {
      return NextResponse.json({ error: `Invalid coupon code "${cleanCode}".` }, { status: 400 });
    }

    // Evaluate eligibility using shared helper
    const evaluation = evaluateCouponEligibility(coupon, items, Number(subtotal) || 0);

    if (!evaluation.valid) {
      return NextResponse.json({
        valid: false,
        error: evaluation.error,
        errorType: evaluation.errorType,
        applicableProductIds: evaluation.applicableProductIds || [],
        applicableProductNames: evaluation.applicableProductNames || []
      }, { status: 400 });
    }

    const meta = parseCouponDescription(coupon.description);

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: meta.text || coupon.description || '',
        discountType: coupon.discount_type,
        value: coupon.value,
        discount: evaluation.discount,
        applicableProductIds: evaluation.applicableProductIds,
        applicableProductNames: evaluation.applicableProductNames,
        eligibleItemCount: evaluation.eligibleItemCount,
        eligibleSubtotal: evaluation.eligibleSubtotal,
        expiresAt: coupon.expires_at,
      },
    });
  } catch (err) {
    console.error('Coupon validation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
