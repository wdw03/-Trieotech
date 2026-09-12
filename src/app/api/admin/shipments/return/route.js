export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { createReturnOrder } from '../../../../../lib/shiprocket';

/**
 * POST: Initiate customer return order in Shiprocket and update DB
 */
export async function POST(request) {
  try {
    const { orderId, reason = 'Customer return requested', items: requestedItems } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let orderQuery = supabaseAdmin.from('orders').select('*, order_items(*), shipments(*)').maybeSingle();
    if (isUuid) {
      orderQuery = orderQuery.eq('id', orderId);
    } else {
      orderQuery = orderQuery.eq('order_number', orderId);
    }

    const { data: order, error: orderErr } = await orderQuery;
    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const address = order.shipping_address || {};
    const items = (requestedItems && requestedItems.length > 0) ? requestedItems : (order.order_items || []);

    let returnResult = null;
    try {
      returnResult = await createReturnOrder({
        orderNumber: order.order_number,
        orderDate: new Date().toISOString().split('T')[0],
        pickupCustomerName: address.name || 'Customer',
        pickupAddress: address.address_line || address.address || '',
        pickupCity: address.city || '',
        pickupState: address.state || '',
        pickupPincode: address.pincode || address.zip || '',
        pickupPhone: address.phone || '',
        items,
        subtotal: order.subtotal,
      });
    } catch (apiErr) {
      console.warn('Shiprocket createReturnOrder API notice:', apiErr.message);
    }

    const shipment = Array.isArray(order.shipments) ? order.shipments[0] : order.shipments;

    // Update shipment if exists
    if (shipment) {
      await supabaseAdmin
        .from('shipments')
        .update({
          status: 'return_initiated',
          updated_at: new Date().toISOString(),
        })
        .eq('id', shipment.id);

      await supabaseAdmin.from('shipment_events').insert({
        shipment_id: shipment.id,
        status: 'return_initiated',
        status_code: 'RETURN_INITIATED',
        activity: `Return initiated: ${reason}`,
        location: address.city || 'Customer Address',
        raw_data: { reason, returnResult },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Return initiated successfully',
      returnResult,
    });
  } catch (err) {
    console.error('Shipment return error:', err);
    return NextResponse.json({ error: err.message || 'Failed to initiate return' }, { status: 500 });
  }
}
