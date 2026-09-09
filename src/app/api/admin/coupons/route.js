export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { formatCoupon, serializeCouponDescription } from '../../../../lib/couponHelper';

// GET: List all coupons for Admin Dashboard
export async function GET() {
  try {
    const { data: coupons, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (coupons || []).map(formatCoupon);

    return NextResponse.json({ coupons: formatted });
  } catch (err) {
    console.error('Fetch admin coupons error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create a new promotional discount coupon
export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.code || !body.code.trim()) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const cleanCode = body.code.trim().toUpperCase();

    // Check if code already exists
    const { data: existing } = await supabaseAdmin
      .from('coupons')
      .select('id')
      .eq('code', cleanCode)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: `Coupon code "${cleanCode}" already exists` }, { status: 400 });
    }

    const discountType = body.discount_type || body.type || 'percentage';
    const normalizedType = discountType.toLowerCase().includes('flat') ? 'flat' : 'percentage';
    const value = Number(body.value) || 0;
    const minSpend = Number(body.min_spend || body.minSpend || body.minOrderValue) || 0;
    const maxDiscount = body.max_discount || body.maxDiscount ? Number(body.max_discount || body.maxDiscount) : null;
    const maxUses = body.max_uses || body.maxUses ? Number(body.max_uses || body.maxUses) : null;

    // Handle expiry timestamp (can be ISO string from datetime-local input)
    let expiresAt = null;
    if (body.expires_at || body.expiresAt || body.endDate) {
      const rawDate = body.expires_at || body.expiresAt || body.endDate;
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        expiresAt = parsedDate.toISOString();
      }
    }

    // Serialize target product IDs and names into description metadata
    const descriptionText = body.description || '';
    const applicableProductIds = body.applicable_product_ids || body.applicableProductIds || [];
    const applicableProductNames = body.applicable_product_names || body.applicableProductNames || [];

    const serializedDescription = serializeCouponDescription({
      description: descriptionText,
      applicableProductIds,
      applicableProductNames
    });

    const { data: newCoupon, error } = await supabaseAdmin
      .from('coupons')
      .insert({
        code: cleanCode,
        description: serializedDescription,
        discount_type: normalizedType,
        value,
        min_spend: minSpend,
        max_discount: maxDiscount,
        max_uses: maxUses,
        used_count: 0,
        is_active: true,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      coupon: formatCoupon(newCoupon)
    }, { status: 201 });
  } catch (err) {
    console.error('Create admin coupon error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
