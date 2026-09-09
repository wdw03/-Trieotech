export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { formatCoupon } from '../../../../../lib/couponHelper';

// DELETE: Delete coupon permanently by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: `Coupon #${id} deleted successfully` });
  } catch (err) {
    console.error('Delete coupon error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Toggle status or update coupon fields
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    const body = await request.json();

    // Fetch existing
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const updatePayload = {};

    if (typeof body.is_active !== 'undefined') {
      updatePayload.is_active = Boolean(body.is_active);
    } else if (typeof body.isActive !== 'undefined') {
      updatePayload.is_active = Boolean(body.isActive);
    } else if (body.toggleStatus) {
      updatePayload.is_active = !existing.is_active;
    }

    if (body.expires_at !== undefined) {
      updatePayload.expires_at = body.expires_at ? new Date(body.expires_at).toISOString() : null;
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('coupons')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, coupon: formatCoupon(updated) });
  } catch (err) {
    console.error('Update coupon error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
