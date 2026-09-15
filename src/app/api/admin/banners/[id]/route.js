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

// GET /api/admin/banners/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('hero_slides')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ slide: data }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

// PUT /api/admin/banners/[id] - Update slide
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData = {};
    if (body.title !== undefined) updateData.title = String(body.title).trim();
    if (body.mobile_title !== undefined) updateData.mobile_title = String(body.mobile_title).trim();
    if (body.mobileTitle !== undefined && body.mobile_title === undefined) updateData.mobile_title = String(body.mobileTitle).trim();
    if (body.subtitle !== undefined) updateData.subtitle = String(body.subtitle).trim();
    if (body.mobile_subtitle !== undefined) updateData.mobile_subtitle = String(body.mobile_subtitle).trim();
    if (body.mobileSubtitle !== undefined && body.mobile_subtitle === undefined) updateData.mobile_subtitle = String(body.mobileSubtitle).trim();
    if (body.badge !== undefined) updateData.badge = String(body.badge).trim();
    if (body.tag !== undefined) updateData.tag = String(body.tag).trim();
    if (body.cta_text !== undefined) updateData.cta_text = String(body.cta_text).trim();
    if (body.desktop_cta_text !== undefined) updateData.desktop_cta_text = String(body.desktop_cta_text).trim();
    if (body.mobile_cta_text !== undefined) updateData.mobile_cta_text = String(body.mobile_cta_text).trim();
    if (body.cta_link !== undefined) updateData.cta_link = String(body.cta_link).trim();
    if (body.secondary_cta_text !== undefined) updateData.secondary_cta_text = String(body.secondary_cta_text).trim();
    if (body.secondary_cta_link !== undefined) updateData.secondary_cta_link = String(body.secondary_cta_link).trim();
    if (body.desktop_image !== undefined) updateData.desktop_image = String(body.desktop_image).trim();
    if (body.desktopImage !== undefined && body.desktop_image === undefined) updateData.desktop_image = String(body.desktopImage).trim();
    if (body.mobile_image !== undefined) updateData.mobile_image = String(body.mobile_image).trim();
    if (body.mobileImage !== undefined && body.mobile_image === undefined) updateData.mobile_image = String(body.mobileImage).trim();
    if (body.secondary_image !== undefined) updateData.secondary_image = String(body.secondary_image).trim();
    if (body.display_order !== undefined) updateData.display_order = Number(body.display_order);
    if (body.is_active !== undefined) updateData.is_active = Boolean(body.is_active);
    if (body.isActive !== undefined && body.is_active === undefined) updateData.is_active = Boolean(body.isActive);
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('hero_slides')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: true, slide: data }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

// DELETE /api/admin/banners/[id] - Delete slide
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('hero_slides')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: true, message: 'Slide deleted successfully' }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
