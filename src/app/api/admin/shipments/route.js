export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// GET: Fetch list of shipments for admin dashboard
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('shipments')
      .select('*, orders(order_number, total, status, shipping_address)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }

    const { data: shipments, error } = await query;

    if (error) {
      console.warn('Shipments query warning:', error.message);
      // Fallback: query orders with shipping information
      const { data: fallbackOrders } = await supabaseAdmin
        .from('orders')
        .select('*')
        .not('shipping_address', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      return NextResponse.json({
        success: true,
        shipments: (fallbackOrders || []).map((o) => ({
          id: `SHIP-${o.id}`,
          order_id: o.id,
          order_number: o.order_number,
          awb_code: o.awb_code || o.tracking_number || null,
          courier_name: o.courier_name || 'Delhivery',
          status: o.status || 'pending',
          shipping_address: o.shipping_address,
          created_at: o.created_at,
        })),
        count: (fallbackOrders || []).length,
      });
    }

    return NextResponse.json({
      success: true,
      shipments: shipments || [],
      count: (shipments || []).length,
    });
  } catch (err) {
    console.error('Shipments GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
