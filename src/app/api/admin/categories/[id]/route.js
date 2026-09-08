import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

// PUT: Update category
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.description !== undefined) updates.description = body.description;
    if (body.image !== undefined) updates.image = body.image;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    const { data: updated, error } = await supabaseAdmin
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, category: updated });
  } catch (err) {
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
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
