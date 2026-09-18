export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store'
};

// GET /api/admin/reels - Get all reels including inactive
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('reels')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (status === 'active') query = query.eq('is_active', true);
    else if (status === 'inactive') query = query.eq('is_active', false);

    if (search && search.trim()) {
      query = query.or(`influencer_name.ilike.%${search}%,influencer_username.ilike.%${search}%,caption.ilike.%${search}%,product_name.ilike.%${search}%`);
    }

    const { data: reels, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json(reels || [], { headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

// POST /api/admin/reels - Create reel
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
      instagram_url: (body.instagram_url || '').trim(),
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
