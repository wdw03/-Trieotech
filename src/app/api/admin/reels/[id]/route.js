export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

// GET: Fetch single reel by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Reel ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('reels')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('API /api/admin/reels/[id] GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT / PATCH: Update reel details
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Reel ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const updatePayload = {
      updated_at: new Date().toISOString(),
    };

    if (body.influencer_name !== undefined) updatePayload.influencer_name = body.influencer_name.trim();
    if (body.influencer_username !== undefined) updatePayload.influencer_username = body.influencer_username.trim();
    if (body.influencer_avatar !== undefined) updatePayload.influencer_avatar = body.influencer_avatar;
    if (body.video_url !== undefined) updatePayload.video_url = body.video_url.trim();
    if (body.thumbnail_url !== undefined) updatePayload.thumbnail_url = body.thumbnail_url;
    if (body.caption !== undefined) updatePayload.caption = body.caption;
    if (body.tags !== undefined) updatePayload.tags = Array.isArray(body.tags) ? body.tags : ['Trending'];
    if (body.song_title !== undefined) updatePayload.song_title = body.song_title;
    if (body.views_count !== undefined) updatePayload.views_count = String(body.views_count);
    if (body.likes_count !== undefined) updatePayload.likes_count = String(body.likes_count);
    if (body.comments_count !== undefined) updatePayload.comments_count = String(body.comments_count);
    if (body.product_id !== undefined) updatePayload.product_id = body.product_id ? String(body.product_id) : null;
    if (body.product_name !== undefined) updatePayload.product_name = body.product_name;
    if (body.product_slug !== undefined) updatePayload.product_slug = body.product_slug;
    if (body.product_price !== undefined) updatePayload.product_price = Number(body.product_price) || 0;
    if (body.product_old_price !== undefined) updatePayload.product_old_price = Number(body.product_old_price) || 0;
    if (body.product_image !== undefined) updatePayload.product_image = body.product_image;
    if (body.product_discount !== undefined) updatePayload.product_discount = body.product_discount;
    if (body.display_order !== undefined) updatePayload.display_order = Number(body.display_order) || 0;
    if (body.is_active !== undefined) updatePayload.is_active = Boolean(body.is_active);

    const { data, error } = await supabaseAdmin
      .from('reels')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('API /api/admin/reels/[id] update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reel: data });
  } catch (err) {
    console.error('API /api/admin/reels/[id] PUT error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove a reel
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Reel ID is required' }, { status: 400 });
    }

    // Optional: fetch reel to delete associated video from Supabase Storage if it was uploaded there
    const { data: reel } = await supabaseAdmin
      .from('reels')
      .select('video_url')
      .eq('id', id)
      .single();

    if (reel && reel.video_url && reel.video_url.includes('/storage/v1/object/public/reels/')) {
      try {
        const parts = reel.video_url.split('/reels/');
        if (parts.length > 1) {
          const fileName = decodeURIComponent(parts[1].split('?')[0]);
          await supabaseAdmin.storage.from('reels').remove([fileName]);
        }
      } catch (storageErr) {
        console.warn('Could not remove file from reels storage bucket:', storageErr.message);
      }
    }

    const { error } = await supabaseAdmin
      .from('reels')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('API /api/admin/reels/[id] delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Reel deleted successfully' });
  } catch (err) {
    console.error('API /api/admin/reels/[id] DELETE error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
