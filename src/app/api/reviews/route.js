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
    const productId = body.product_id ?? body.productId;
    const userName = body.user_name ?? body.userName ?? body.name;
    const rating = body.rating;
    const title = body.title || 'Verified Patron Experience';
    const comment = body.comment || '';

    if (!productId || !userName || !rating) {
      return NextResponse.json({ error: 'Missing required fields (productId, userName, rating)' }, { status: 400 });
    }

    const numProductId = Number(productId);
    const numRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
    const isVerified = Boolean(body.is_verified ?? body.verified_purchase ?? true);

    // Compute safe next ID to avoid Postgres serial sequence desync collisions
    const { data: lastReview } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextId = (Number(lastReview?.id) || 0) + 1;

    const { data: newReview, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        id: nextId,
        product_id: numProductId,
        user_name: String(userName).trim(),
        user_avatar: body.user_avatar || '',
        rating: numRating,
        title: title ? String(title).trim() : '',
        comment: comment ? String(comment).trim() : '',
        is_verified: isVerified,
        location: body.location || 'India',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Recalculate average rating & review count for the product
    try {
      const { data: allReviews } = await supabaseAdmin
        .from('reviews')
        .select('rating')
        .eq('product_id', numProductId);

      if (allReviews && allReviews.length > 0) {
        const avg = allReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / allReviews.length;
        await supabaseAdmin
          .from('products')
          .update({
            rating: Number(avg.toFixed(1)),
            review_count: allReviews.length,
            updated_at: new Date().toISOString(),
          })
          .eq('id', numProductId);
      }
    } catch (recErr) {
      console.warn('Product rating sync warning:', recErr.message);
    }

    return NextResponse.json({
      success: true,
      review: {
        ...newReview,
        verified_purchase: newReview.is_verified,
      }
    }, { status: 201 });
  } catch (err) {
    console.error('Create review error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
