export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

// PATCH/PUT: Update inquiry status, star status, or reply
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates = {
      updated_at: new Date().toISOString(),
    };

    if (body.status !== undefined) updates.status = body.status;
    if (body.is_starred !== undefined) updates.is_starred = Boolean(body.is_starred);
    if (body.admin_reply !== undefined) {
      updates.admin_reply = body.admin_reply;
      updates.replied_at = new Date().toISOString();
      updates.status = 'replied';
    }

    const { data, error } = await supabaseAdmin
      .from('contact_messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: data });
  } catch (err) {
    console.error('API /api/admin/contact/[id] update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
  return PATCH(request, context);
}

// DELETE: Delete an inquiry
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    console.error('API /api/admin/contact/[id] delete error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
