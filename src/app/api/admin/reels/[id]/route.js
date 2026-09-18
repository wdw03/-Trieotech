export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store'
};

// GET /api/admin/reels/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('reels')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ reel: data }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

// PUT /api/admin/reels/[id] - Update reel
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData = {};
    if (body.influencer_name !== undefined) updateData.influencer_name = String(body.influencer_name).trim();
    if (body.name !== undefined && body.influencer_name === undefined) updateData.influencer_name = String(body.name).trim();
    if (body.influencer_username !== undefined) updateData.influencer_username = String(body.influencer_username).trim();
    if (body.handle !== undefined && body.influencer_username === undefined) updateData.influencer_username = String(body.handle).trim();
    if (body.influencer_avatar !== undefined) updateData.influencer_avatar = String(body.influencer_avatar).trim();
    if (body.video_url !== undefined) updateData.video_url = String(body.video_url).trim();
    if (body.video !== undefined && body.video_url === undefined) updateData.video_url = String(body.video).trim();
    if (body.thumbnail_url !== undefined) updateData.thumbnail_url = String(body.thumbnail_url).trim();
    if (body.caption !== undefined) updateData.caption = String(body.caption).trim();
    if (body.song_title !== undefined) updateData.song_title = String(body.song_title).trim();
    if (body.views_count !== undefined) updateData.views_count = String(body.views_count).trim();
    if (body.likes_count !== undefined) updateData.likes_count = String(body.likes_count).trim();
    if (body.comments_count !== undefined) updateData.comments_count = String(body.comments_count).trim();
    if (body.product_id !== undefined) updateData.product_id = String(body.product_id);
    if (body.product_name !== undefined) updateData.product_name = String(body.product_name).trim();
    if (body.product_slug !== undefined) updateData.product_slug = String(body.product_slug).trim();
    if (body.product_price !== undefined) updateData.product_price = Number(body.product_price);
    if (body.product_old_price !== undefined) updateData.product_old_price = Number(body.product_old_price);
    if (body.product_image !== undefined) updateData.product_image = String(body.product_image).trim();
    if (body.product_discount !== undefined) updateData.product_discount = String(body.product_discount).trim();
    if (body.display_order !== undefined) updateData.display_order = Number(body.display_order);
    if (body.is_active !== undefined) updateData.is_active = Boolean(body.is_active);
    if (body.instagram_url !== undefined) updateData.instagram_url = String(body.instagram_url).trim();
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('reels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: true, reel: data }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

// DELETE /api/admin/reels/[id] - Delete reel
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('reels')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: true, message: 'Reel deleted successfully' }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
