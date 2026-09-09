export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { sendShippingUpdate } from '../../../../../lib/resend';

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

// Statuses that trigger email notifications
const NOTIFY_STATUS_MAP = {
  confirmed: '✅ Order Confirmed',
  processing: '🔧 Order is Being Processed',
  packed: '📦 Order Packed & Ready to Ship',
  shipped: '🚚 Your Order Has Been Shipped!',
  out_for_delivery: '🏍️ Out for Delivery — Arriving Today!',
  delivered: '🎉 Order Delivered Successfully!',
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
      .select('id, order_number, customer_email, shipping_address, user_id')
      .or(`id.eq.${id},order_number.eq.${id}`);

    const { data: orderMatches } = await findQuery;
    let targetOrder = orderMatches?.[0];

    if (!targetOrder) {
      // Try single search by order_number ilike
      const { data: fallbackMatches } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, customer_email, shipping_address, user_id')
        .ilike('order_number', `%${id}%`)
        .limit(1);

      if (!fallbackMatches?.[0]) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      targetOrder = fallbackMatches[0];
    }

    const orderDbId = targetOrder.id;

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
            status: mappedStatus === 'shipped' ? 'in_transit' : (mappedStatus === 'delivered' ? 'delivered' : 'in_transit'),
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

    // Send notification email on status change
    if (mappedStatus && NOTIFY_STATUS_MAP[mappedStatus]) {
      const addr = targetOrder.shipping_address || {};
      const customerEmail = targetOrder.customer_email || addr.email;
      const orderNumber = targetOrder.order_number || id;

      if (customerEmail) {
        const statusLabel = NOTIFY_STATUS_MAP[mappedStatus];
        const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://trioenterprises.in'}/track-order?id=${encodeURIComponent(orderNumber)}`;

        // Get AWB from shipment (could be newly set or existing)
        let awb = trackingNumber || '';
        let courier = courierName || '';
        if (!awb) {
          const { data: ship } = await supabaseAdmin
            .from('shipments')
            .select('awb_number, courier_name')
            .eq('order_id', orderDbId)
            .single();
          awb = ship?.awb_number || '';
          courier = ship?.courier_name || '';
        }

        try {
          await sendShippingUpdate({
            to: customerEmail,
            orderNumber,
            status: statusLabel,
            trackingNumber: awb,
            courierName: courier || 'BlueDart Express',
            trackingUrl,
          });
        } catch (emailErr) {
          console.error('Status update email failed (non-blocking):', emailErr);
          // Non-blocking — order update still succeeds
        }
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error('Update order error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
