export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { getAuthenticatedUser } from '../../../lib/auth/validate';

// GET: Fetch user's wishlist
export async function GET(request) {
  try {
    const { user } = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from('wishlist')
      .select('*, product:products(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ items: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Toggle product in wishlist
export async function POST(request) {
  try {
    const { user } = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { productId } = await request.json();

    // Check if already in wishlist
    const { data: existing } = await supabaseAdmin
      .from('wishlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      // Remove from wishlist
      await supabaseAdmin.from('wishlist').delete().eq('id', existing.id);
      return NextResponse.json({ action: 'removed' });
    } else {
      // Add to wishlist
      const { data, error } = await supabaseAdmin
        .from('wishlist')
        .insert({ user_id: user.id, product_id: productId })
        .select('*, product:products(*)')
        .single();

      if (error) throw error;
      return NextResponse.json({ action: 'added', item: data });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove from wishlist
export async function DELETE(request) {
  try {
    const { user } = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    await supabaseAdmin
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
