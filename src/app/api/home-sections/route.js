export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store'
};

// Default fallback sections
const DEFAULT_SECTIONS = {
  heroCarousel: { id: 'heroCarousel', name: 'Hero Banner Carousel', isEnabled: true },
  categoryGrid: { id: 'categoryGrid', name: 'Featured Categories Grid', isEnabled: true },
  bestSellers: { id: 'bestSellers', name: 'Artisan Best Sellers', isEnabled: true },
  promotionalBanners: { id: 'promotionalBanners', name: 'Dual Promotional Banners', isEnabled: true },
  shopTheGram: { id: 'shopTheGram', name: 'Shop The Gram Reels', isEnabled: true },
  brandStory: { id: 'brandStory', name: 'Brand Story Strip', isEnabled: true },
  blogPreview: { id: 'blogPreview', name: 'Blog Preview', isEnabled: true },
  contactSection: { id: 'contactSection', name: 'Contact Inquiries', isEnabled: true }
};

// GET /api/home-sections - Get all sections state
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('home_sections')
      .select('*')
      .order('section_key', { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ sections: DEFAULT_SECTIONS }, { headers: NO_CACHE_HEADERS });
    }

    // Convert rows to an object keyed by section_key
    const sectionsObj = {};
    for (const row of data) {
      sectionsObj[row.section_key] = {
        id: row.section_key,
        sectionKey: row.section_key,
        name: row.name,
        isEnabled: Boolean(row.is_enabled),
        is_enabled: Boolean(row.is_enabled),
        description: row.description,
        ...(row.config || {})
      };
    }

    return NextResponse.json({ sections: sectionsObj }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('home-sections GET error:', err);
    return NextResponse.json({ sections: DEFAULT_SECTIONS }, { headers: NO_CACHE_HEADERS });
  }
}

// PUT /api/home-sections - Update section config or toggle visibility
export async function PUT(request) {
  try {
    const body = await request.json();
    const { sectionKey, isEnabled, config, name, description } = body;

    if (!sectionKey) {
      return NextResponse.json({ error: 'sectionKey is required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const updatePayload = {
      updated_at: new Date().toISOString()
    };
    if (isEnabled !== undefined) updatePayload.is_enabled = Boolean(isEnabled);
    if (name !== undefined) updatePayload.name = name;
    if (description !== undefined) updatePayload.description = description;
    if (config !== undefined) updatePayload.config = config;

    const { data, error } = await supabaseAdmin
      .from('home_sections')
      .upsert({
        section_key: sectionKey,
        name: name || sectionKey,
        ...updatePayload
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: true, section: data }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('home-sections PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

// POST is alias to PUT
export async function POST(request) {
  return PUT(request);
}
