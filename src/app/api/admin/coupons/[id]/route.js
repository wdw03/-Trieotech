export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { formatCoupon, serializeCouponDescription } from '../../../../../lib/couponHelper';

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

// PUT: Fully update a coupon by ID or code
export async function PUT(request, { params }) {
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

    const cleanCode = body.code ? body.code.trim().toUpperCase() : existing.code;
    // Check if another coupon has this code
    if (cleanCode !== existing.code) {
      const { data: duplicate } = await supabaseAdmin
        .from('coupons')
        .select('id')
        .eq('code', cleanCode)
        .neq('id', existing.id)
        .maybeSingle();
      if (duplicate) {
        return NextResponse.json({ error: `Coupon code "${cleanCode}" already exists` }, { status: 400 });
      }
    }

    const discountType = body.discount_type || body.type || existing.discount_type;
    const normalizedType = String(discountType).toLowerCase().includes('flat') ? 'flat' : 'percentage';
    const value = typeof body.value !== 'undefined' ? Number(body.value) : existing.value;
    const minSpend = typeof body.min_spend !== 'undefined' || typeof body.minSpend !== 'undefined' || typeof body.minOrderValue !== 'undefined'
      ? Number(body.min_spend ?? body.minSpend ?? body.minOrderValue)
      : existing.min_spend;
    const maxDiscount = (typeof body.max_discount !== 'undefined' || typeof body.maxDiscount !== 'undefined')
      ? (body.max_discount || body.maxDiscount ? Number(body.max_discount || body.maxDiscount) : null)
      : existing.max_discount;
    const maxUses = (typeof body.max_uses !== 'undefined' || typeof body.maxUses !== 'undefined')
      ? (body.max_uses || body.maxUses ? Number(body.max_uses || body.maxUses) : null)
      : existing.max_uses;

    let expiresAt = existing.expires_at;
    if (typeof body.expires_at !== 'undefined' || typeof body.expiresAt !== 'undefined' || typeof body.endDate !== 'undefined') {
      const rawDate = body.expires_at || body.expiresAt || body.endDate;
      if (rawDate) {
        const parsedDate = new Date(rawDate);
        expiresAt = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null;
      } else {
        expiresAt = null;
      }
    }

    const descriptionText = body.description !== undefined ? body.description : '';
    const applicableProductIds = body.applicable_product_ids || body.applicableProductIds || [];
    const applicableProductNames = body.applicable_product_names || body.applicableProductNames || [];

    const serializedDescription = serializeCouponDescription({
      description: descriptionText,
      applicableProductIds,
      applicableProductNames
    });

    const updatePayload = {
      code: cleanCode,
      description: serializedDescription,
      discount_type: normalizedType,
      value,
      min_spend: minSpend,
      max_discount: maxDiscount,
      max_uses: maxUses,
      expires_at: expiresAt,
    };

    if (typeof body.is_active !== 'undefined') {
      updatePayload.is_active = Boolean(body.is_active);
    } else if (typeof body.isActive !== 'undefined') {
      updatePayload.is_active = Boolean(body.isActive);
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

