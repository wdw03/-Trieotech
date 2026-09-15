export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// GET: List all reels for admin panel (both active and inactive)
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

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive' || status === 'draft') {
      query = query.eq('is_active', false);
    }

    if (search) {
      query = query.or(`influencer_name.ilike.%${search}%,influencer_username.ilike.%${search}%,caption.ilike.%${search}%,product_name.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('API /api/admin/reels fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('API /api/admin/reels GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new reel record
export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.video_url || !body.video_url.trim()) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    const payload = {
      influencer_name: body.influencer_name?.trim() || 'Trio Influencer',
      influencer_username: body.influencer_username?.trim() || '@trioenterprises',
      influencer_avatar: body.influencer_avatar || '',
      video_url: body.video_url.trim(),
      thumbnail_url: body.thumbnail_url || body.influencer_avatar || '',
      caption: body.caption || '',
      tags: Array.isArray(body.tags) ? body.tags : ['Trending', 'Handcrafted'],
      song_title: body.song_title || 'Original Audio · Trio Trends',
      views_count: String(body.views_count || '100K'),
      likes_count: String(body.likes_count || '10K'),
      comments_count: String(body.comments_count || '250'),
      product_id: body.product_id ? String(body.product_id) : null,
      product_name: body.product_name || '',
      product_slug: body.product_slug || '',
      product_price: Number(body.product_price) || 0,
      product_old_price: Number(body.product_old_price) || 0,
      product_image: body.product_image || '',
      product_discount: body.product_discount || '',
      display_order: Number(body.display_order) || 0,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('reels')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('API /api/admin/reels create error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reel: data }, { status: 201 });
  } catch (err) {
    console.error('API /api/admin/reels POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
