export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { formatCoupon } from '../../../../../lib/couponHelper';

// DELETE: Delete coupon permanently by ID or code
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    let query = supabaseAdmin.from('coupons').delete();
    const numericId = Number(id);
    if (!isNaN(numericId) && Number.isInteger(numericId)) {
      query = query.or(`id.eq.${numericId},code.eq.${id}`);
    } else {
      query = query.eq('code', id);
    }

    const { error } = await query;
    if (error) {
      console.warn('Coupon delete notice:', error.message);
    }

    return NextResponse.json({ success: true, message: `Coupon #${id} deleted successfully` });
  } catch (err) {
    console.error('Delete coupon error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Toggle status or update coupon fields
export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    const body = await request.json();

    let query = supabaseAdmin.from('coupons').select('*');
    const numericId = Number(id);
    if (!isNaN(numericId) && Number.isInteger(numericId)) {
      query = query.or(`id.eq.${numericId},code.eq.${id}`);
    } else {
      query = query.eq('code', id);
    }

    const { data: existingList, error: fetchErr } = await query;
    const existing = existingList?.[0];

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
      .eq('id', existing.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, coupon: formatCoupon(updated) });
  } catch (err) {
    console.error('Update coupon error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
