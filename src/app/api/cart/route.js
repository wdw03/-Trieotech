export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';

// GET: Fetch user's cart
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: items, error } = await supabaseAdmin
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ items: items || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Add item to cart
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { productId, quantity = 1, color = '', size = '' } = await request.json();

    // Validate product exists and has stock
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id, stock, in_stock')
      .eq('id', productId)
      .single();

    if (!product || !product.in_stock) {
      return NextResponse.json({ error: 'Product unavailable' }, { status: 400 });
    }

    // Upsert cart item (increment quantity if exists)
    const { data: existing } = await supabaseAdmin
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .eq('color', color)
      .eq('size', size)
      .single();

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > product.stock) {
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('id', existing.id)
        .select('*, product:products(*)')
        .single();

      if (error) throw error;
      return NextResponse.json({ item: data });
    } else {
      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity,
          color,
          size,
        })
        .select('*, product:products(*)')
        .single();

      if (error) throw error;
      return NextResponse.json({ item: data });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Update cart item quantity
export async function PUT(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { cartItemId, quantity } = await request.json();

    if (quantity <= 0) {
      // Delete item
      await supabaseAdmin.from('cart_items').delete().eq('id', cartItemId).eq('user_id', user.id);
      return NextResponse.json({ deleted: true });
    }

    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .eq('user_id', user.id)
      .select('*, product:products(*)')
      .single();

    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove from cart or clear cart
export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('id');
    const clearAll = searchParams.get('clear');

    if (clearAll === 'true') {
      await supabaseAdmin.from('cart_items').delete().eq('user_id', user.id);
      return NextResponse.json({ cleared: true });
    }

    if (cartItemId) {
      await supabaseAdmin.from('cart_items').delete().eq('id', cartItemId).eq('user_id', user.id);
      return NextResponse.json({ deleted: true });
    }

    return NextResponse.json({ error: 'Missing id or clear param' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
