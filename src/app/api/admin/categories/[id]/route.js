export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

// PUT: Update category
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.slug !== undefined) updates.slug = body.slug.trim();
    if (body.description !== undefined) updates.description = body.description.trim();
    if (body.image !== undefined) updates.image = body.image.trim();
    if (body.banner !== undefined) updates.banner = body.banner.trim();
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);
    if (body.subcategories !== undefined && Array.isArray(body.subcategories)) {
      updates.subcategories = body.subcategories;
    }

    const { data: updated, error } = await supabaseAdmin
      .from('categories')
      .update(updates)
      .eq('id', Number(id))
      .select()
      .single();

    if (error) {
      console.error('Supabase category update error:', error);
      throw error;
    }

    return NextResponse.json({ success: true, category: updated });
  } catch (err) {
    console.error('Update category error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete category
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', Number(id));

    if (error) {
      console.error('Supabase category delete error:', error);
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error('Delete category error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
