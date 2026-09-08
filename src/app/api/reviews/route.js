export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';

// GET: Fetch reviews (optional productId)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    let query = supabaseAdmin
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data: reviews, error } = await query;

    if (error) {
      console.warn('Reviews query error:', error);
      return NextResponse.json({ reviews: [] });
    }

    return NextResponse.json({ reviews: reviews || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Submit a new review
export async function POST(request) {
  try {
    const body = await request.json();
    const { product_id, user_name, rating, title, comment } = body;

    if (!product_id || !user_name || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: newReview, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        product_id,
        user_name,
        rating: Number(rating) || 5,
        title: title || '',
        comment: comment || '',
        verified_purchase: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, review: newReview }, { status: 201 });
  } catch (err) {
    console.error('Create review error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
