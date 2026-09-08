import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// GET: Fetch single order details
export async function GET(request, { params }) {
  try {
    let user = null;
    try {
      const supabase = await createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      user = u;
    } catch (_) {}

    const { orderId } = await params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (*),
        payments (*),
        shipments (*)
      `);

    if (isUuid) {
      query = query.eq('id', orderId);
    } else {
      query = query.eq('order_number', orderId);
    }

    const { data: order, error } = await query.single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If order has user_id, check that authenticated user matches
    if (order.user_id && user && order.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
