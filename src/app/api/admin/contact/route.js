export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// GET: List all customer contact inquiries for admin dashboard
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      const clean = search.trim();
      query = query.or(`name.ilike.%${clean}%,email.ilike.%${clean}%,subject.ilike.%${clean}%,message.ilike.%${clean}%`);
    }

    const { data: messages, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      messages: messages || [],
      total: messages ? messages.length : 0,
    });
  } catch (err) {
    console.error('API /api/admin/contact error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
