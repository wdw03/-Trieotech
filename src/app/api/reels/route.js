export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store'
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';

    let query = supabaseAdmin
      .from('reels')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!showAll) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase /api/reels query error:', error.message);
      return NextResponse.json([], { headers: NO_CACHE_HEADERS });
    }

    if (!data || data.length === 0) {
      return NextResponse.json([], { headers: NO_CACHE_HEADERS });
    }

    // Enrich with live product data from Supabase products table
    const productIds = data
      .map((r) => r.product_id)
      .filter((id) => id && String(id).trim() !== '');

    if (productIds.length > 0) {
      const { data: liveProducts } = await supabaseAdmin
        .from('products')
        .select('id, name, slug, price, original_price, images, stock, in_stock')
        .in('id', productIds);

      if (liveProducts && liveProducts.length > 0) {
        const prodMap = new Map(liveProducts.map((p) => [String(p.id), p]));

        const enriched = data.map((reel) => {
          const live = reel.product_id ? prodMap.get(String(reel.product_id)) : null;
          if (!live) return reel;

          const price = Number(live.price) || Number(reel.product_price) || 0;
          const oldPrice = Number(live.original_price) || Number(reel.product_old_price) || 0;
          const discount =
            oldPrice > price
              ? `${Math.round(((oldPrice - price) / oldPrice) * 100)}% OFF`
              : reel.product_discount || '';
          const img =
            Array.isArray(live.images) && live.images[0]
              ? live.images[0]
              : reel.product_image;

          return {
            ...reel,
            product_name: live.name || reel.product_name,
            product_slug: live.slug || reel.product_slug,
            product_price: price,
            product_old_price: oldPrice,
            product_image: img,
            product_discount: discount,
            product_stock: live.stock !== undefined ? live.stock : 50,
            product_in_stock: live.in_stock !== undefined ? live.in_stock : true,
          };
        });

        return NextResponse.json(enriched, { headers: NO_CACHE_HEADERS });
      }
    }

    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('API /api/reels GET error:', err);
    return NextResponse.json([], { headers: NO_CACHE_HEADERS });
  }
}

// POST: Create reel (Admin)
export async function POST(request) {
  try {
    const body = await request.json();
    const payload = {
      influencer_name: (body.influencer_name || body.name || 'Trio Influencer').trim(),
      influencer_username: (body.influencer_username || body.handle || '@trioenterprises').trim(),
      influencer_avatar: (body.influencer_avatar || body.img || '').trim(),
      video_url: (body.video_url || body.video || '').trim(),
      thumbnail_url: (body.thumbnail_url || body.influencer_avatar || body.img || '').trim(),
      caption: (body.caption || '').trim(),
      song_title: (body.song_title || body.song || 'Original Audio · Trio Trends').trim(),
      views_count: (body.views_count || body.views || '150K').trim(),
      likes_count: (body.likes_count || body.likes || '18.5K').trim(),
      comments_count: (body.comments_count || body.comments || '320').trim(),
      product_id: body.product_id ? String(body.product_id) : '',
      product_name: (body.product_name || body.product || '').trim(),
      product_slug: (body.product_slug || body.slug || '').trim(),
      product_price: Number(body.product_price) || 0,
      product_old_price: Number(body.product_old_price) || 0,
      product_image: (body.product_image || '').trim(),
      product_discount: (body.product_discount || '').trim(),
      display_order: Number(body.display_order) || 0,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
    };

    const { data, error } = await supabaseAdmin
      .from('reels')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: true, reel: data }, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
