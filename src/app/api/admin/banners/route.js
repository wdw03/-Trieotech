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

// GET /api/admin/banners - Get all slides for admin
export async function GET() {
  try {
    const { data: slides, error } = await supabaseAdmin
      .from('hero_slides')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ slides: slides || [] }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

// POST /api/admin/banners - Create a new hero slide
export async function POST(request) {
  try {
    const body = await request.json();
    const payload = {
      title: (body.title || '').trim(),
      mobile_title: (body.mobile_title || body.mobileTitle || body.title || '').trim(),
      subtitle: (body.subtitle || '').trim(),
      mobile_subtitle: (body.mobile_subtitle || body.mobileSubtitle || body.subtitle || '').trim(),
      badge: (body.badge || 'Festive Special').trim(),
      tag: (body.tag || 'Authentic Craft').trim(),
      cta_text: (body.cta_text || body.ctaText || body.mobile_cta_text || 'Shop Now').trim(),
      desktop_cta_text: (body.desktop_cta_text || body.desktopCtaText || body.cta_text || 'Explore Collection').trim(),
      mobile_cta_text: (body.mobile_cta_text || body.mobileCtaText || body.cta_text || 'Shop Now').trim(),
      cta_link: (body.cta_link || body.ctaLink || '/shop').trim(),
      secondary_cta_text: (body.secondary_cta_text || body.secondaryCtaText || 'Learn More').trim(),
      secondary_cta_link: (body.secondary_cta_link || body.secondaryCtaLink || '/blog').trim(),
      desktop_image: (body.desktop_image || body.desktopImage || body.image || '').trim(),
      mobile_image: (body.mobile_image || body.mobileImage || body.desktop_image || body.image || '').trim(),
      secondary_image: (body.secondary_image || body.secondaryImage || '').trim(),
      display_order: Number(body.display_order ?? body.order ?? 0),
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : (body.isActive !== undefined ? Boolean(body.isActive) : true),
    };

    const { data, error } = await supabaseAdmin
      .from('hero_slides')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: true, slide: data }, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
