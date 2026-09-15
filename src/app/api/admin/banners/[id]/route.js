export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

// PUT: Update an existing hero slide
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.mobile_title !== undefined) updates.mobile_title = body.mobile_title.trim();
    if (body.subtitle !== undefined) updates.subtitle = body.subtitle.trim();
    if (body.mobile_subtitle !== undefined) updates.mobile_subtitle = body.mobile_subtitle.trim();
    if (body.badge !== undefined) updates.badge = body.badge.trim();
    if (body.tag !== undefined) updates.tag = body.tag.trim();
    if (body.cta_text !== undefined) updates.cta_text = body.cta_text.trim();
    if (body.desktop_cta_text !== undefined) updates.desktop_cta_text = body.desktop_cta_text.trim();
    if (body.cta_link !== undefined) updates.cta_link = body.cta_link.trim();
    if (body.secondary_cta_text !== undefined) updates.secondary_cta_text = body.secondary_cta_text.trim();
    if (body.secondary_cta_link !== undefined) updates.secondary_cta_link = body.secondary_cta_link.trim();
    if (body.desktop_image !== undefined) updates.desktop_image = body.desktop_image.trim();
    if (body.image !== undefined && body.desktop_image === undefined) updates.desktop_image = body.image.trim();
    if (body.mobile_image !== undefined) updates.mobile_image = body.mobile_image.trim();
    if (body.secondary_image !== undefined) updates.secondary_image = body.secondary_image.trim();
    if (body.display_order !== undefined) updates.display_order = Number(body.display_order);
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);

    const { data: updated, error } = await supabaseAdmin
      .from('hero_slides')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, slide: updated });
  } catch (err) {
    console.error('Admin update hero_slide error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete a hero slide
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('hero_slides')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Slide deleted' });
  } catch (err) {
    console.error('Admin delete hero_slide error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
