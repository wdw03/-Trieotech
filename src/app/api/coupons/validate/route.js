import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// POST: Validate a coupon code server-side
export async function POST(request) {
  try {
    const { code, subtotal } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Coupon code required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', cleanCode)
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
    }

    // Check min spend
    if (coupon.min_spend && subtotal < coupon.min_spend) {
      return NextResponse.json({
        error: `Minimum spend of ₹${coupon.min_spend} required for ${cleanCode}`,
      }, { status: 400 });
    }

    // Check usage limit
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.max_discount) {
        discount = Math.min(discount, coupon.max_discount);
      }
    } else {
      discount = Math.min(subtotal, coupon.value);
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discount_type,
        value: coupon.value,
        discount,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
