export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// GET: List all hero slides for admin (including inactive)
export async function GET() {
  try {
    const { data: slides, error } = await supabaseAdmin
      .from('hero_slides')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ slides: slides || [] });
  } catch (err) {
    console.error('Admin get hero_slides error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create a new hero slide
export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const newSlide = {
      title: body.title.trim(),
      mobile_title: body.mobile_title?.trim() || body.title.trim(),
      subtitle: body.subtitle?.trim() || '',
      mobile_subtitle: body.mobile_subtitle?.trim() || body.subtitle?.trim() || '',
      badge: body.badge?.trim() || 'Festive Special',
      tag: body.tag?.trim() || 'Authentic Craft',
      cta_text: body.cta_text?.trim() || 'Shop Now',
      desktop_cta_text: body.desktop_cta_text?.trim() || body.cta_text?.trim() || 'Explore Collection',
      cta_link: body.cta_link?.trim() || '/shop',
      secondary_cta_text: body.secondary_cta_text?.trim() || 'Learn More',
      secondary_cta_link: body.secondary_cta_link?.trim() || '/blog',
      desktop_image: body.desktop_image?.trim() || body.image?.trim() || '/products/shreenathji-statement-patch-1.jpg',
      mobile_image: body.mobile_image?.trim() || body.desktop_image?.trim() || body.image?.trim() || '',
      secondary_image: body.secondary_image?.trim() || '',
      display_order: Number(body.display_order ?? 0),
      is_active: body.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: created, error } = await supabaseAdmin
      .from('hero_slides')
      .insert([newSlide])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, slide: created }, { status: 201 });
  } catch (err) {
    console.error('Admin create hero_slide error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
