import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

// PUT: Update product
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.price !== undefined) updates.price = Number(body.price);
    if (body.original_price !== undefined) updates.original_price = Number(body.original_price);
    if (body.originalPrice !== undefined) updates.original_price = Number(body.originalPrice);

    if (body.stock !== undefined) {
      updates.stock = Number(body.stock);
      updates.in_stock = Number(body.stock) > 0;
    }
    if (body.availableStock !== undefined) {
      updates.stock = Number(body.availableStock);
      updates.in_stock = Number(body.availableStock) > 0;
    }
    if (body.in_stock !== undefined) updates.in_stock = Boolean(body.in_stock);
    if (body.inStock !== undefined) updates.in_stock = Boolean(body.inStock);

    if (body.category !== undefined) updates.category = body.category;
    if (body.subcategory !== undefined) updates.subcategory = body.subcategory;
    if (body.description !== undefined) updates.description = body.description;

    if (body.images !== undefined) {
      updates.images = Array.isArray(body.images) ? body.images : [body.images];
    } else if (body.image !== undefined) {
      updates.images = [body.image];
    }

    if (body.badge !== undefined) {
      updates.is_best_seller = body.badge === 'Best Seller';
      updates.is_wedding_special = body.badge === 'Wedding Special';
      updates.is_festival_special = body.badge === 'Festival Special';
      updates.is_trending = body.badge === 'Trending';
    }

    if (body.is_featured !== undefined) updates.is_featured = Boolean(body.is_featured);
    if (body.is_best_seller !== undefined) updates.is_best_seller = Boolean(body.is_best_seller);

    const { data: updated, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, product: updated });
  } catch (err) {
    console.error('Update product error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete product
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
