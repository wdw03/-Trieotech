import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

// Map dashboard status to DB status
const DB_STATUS_MAP = {
  'New': 'pending',
  'Confirmed': 'confirmed',
  'Processing': 'processing',
  'Packed': 'packed',
  'Shipped': 'shipped',
  'Out for Delivery': 'out_for_delivery',
  'Delivered': 'delivered',
  'Cancelled': 'cancelled',
  'Return Requested': 'return_requested',
  'Returned': 'returned',
  'Refunded': 'refunded',
};

// PATCH: Update order status or details
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, trackingNumber, courierName, paymentStatus } = body;

    // Convert dashboard status to db status if needed
    const mappedStatus = DB_STATUS_MAP[status] || (status ? status.toLowerCase().replace(/\s+/g, '_') : undefined);

    const updates = {};
    if (mappedStatus) updates.status = mappedStatus;
    if (paymentStatus) updates.payment_status = paymentStatus.toLowerCase();

    // Find order first by id or order_number
    let findQuery = supabaseAdmin
      .from('orders')
      .select('id, order_number')
      .or(`id.eq.${id},order_number.eq.${id}`);

    const { data: orderMatches } = await findQuery;
    const targetOrder = orderMatches?.[0];

    if (!targetOrder) {
      // Try single search by order_number ilike
      const { data: fallbackMatches } = await supabaseAdmin
        .from('orders')
        .select('id, order_number')
        .ilike('order_number', `%${id}%`)
        .limit(1);

      if (!fallbackMatches?.[0]) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    }

    const orderDbId = targetOrder ? targetOrder.id : (await supabaseAdmin.from('orders').select('id').ilike('order_number', `%${id}%`).single()).data?.id;

    const { data: updatedOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', orderDbId)
      .select()
      .single();

    if (orderError) throw orderError;

    // If tracking number provided, update or create shipment
    if (trackingNumber) {
      const { data: existingShipment } = await supabaseAdmin
        .from('shipments')
        .select('id')
        .eq('order_id', orderDbId)
        .single();

      if (existingShipment) {
        await supabaseAdmin
          .from('shipments')
          .update({
            awb_number: trackingNumber,
            courier_name: courierName || 'BlueDart Express',
          })
          .eq('id', existingShipment.id);
      } else {
        await supabaseAdmin.from('shipments').insert({
          order_id: orderDbId,
          awb_number: trackingNumber,
          courier_name: courierName || 'BlueDart Express',
          status: 'in_transit',
        });
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error('Update order error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
