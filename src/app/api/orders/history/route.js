export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// GET: Fetch user's order history
export async function GET(request) {
  try {
    let user = null;
    try {
      const supabase = await createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser || null;
    } catch (_) {}

    if (!user && request) {
      const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const { data: { user: tokenUser } } = await supabaseAdmin.auth.getUser(token);
          user = tokenUser || null;
        } catch (_) {}
      }
    }

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (*),
        payments (*),
        shipments (*)
      `)
      .eq('user_id', user.id)
      .neq('status', 'pending_payment')
      .neq('status', 'payment_failed')
      .neq('status', 'draft')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ orders: orders || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
