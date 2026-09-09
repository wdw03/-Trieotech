export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { formatCoupon } from '../../../../lib/couponHelper';

// GET: Fetch currently active and non-expired promo coupons for the storefront
export async function GET() {
  try {
    const { data: coupons, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (error) throw error;

    const now = new Date();
    // Filter out expired coupons
    const activeCoupons = (coupons || [])
      .map(formatCoupon)
      .filter((c) => !c.expiresAt || new Date(c.expiresAt) > now);

    return NextResponse.json({ coupons: activeCoupons });
  } catch (err) {
    console.error('Fetch available coupons error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
