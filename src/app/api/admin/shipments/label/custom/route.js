export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../../lib/supabase/admin';
import { generateShippingLabelHTML } from '../../../../../../lib/shippingLabel';

/**
 * GET: Renders full print-ready HTML shipping label
 * Usage: /api/admin/shipments/label/custom?orderId=<uuid_or_order_number>
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId') || searchParams.get('orderNumber');

    if (!orderId) {
      return new Response('<h3>Error: orderId or orderNumber query param is required</h3>', {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

    // Fetch order with items
    let query = supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .maybeSingle();

    if (isUuid) {
      query = query.eq('id', orderId);
    } else {
      query = query.eq('order_number', orderId);
    }

    const { data: order, error: orderErr } = await query;
    if (orderErr || !order) {
      return new Response(`<h3>Error: Order not found (${orderErr?.message || 'invalid ID'})</h3>`, {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Fetch shipment
    const { data: shipment } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .eq('order_id', order.id)
      .maybeSingle();

    const html = generateShippingLabelHTML(order, shipment || {});

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('Custom shipping label error:', err);
    return new Response(`<h3>Server Error: ${err.message}</h3>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
