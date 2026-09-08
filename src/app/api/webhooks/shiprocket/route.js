export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { sendShippingUpdate } from '../../../../lib/resend';

// POST: Shiprocket webhook for shipment status updates
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      order_id: shiprocketOrderId,
      current_status: status,
      awb: awbNumber,
      courier_name: courierName,
      etd: estimatedDelivery,
    } = body;

    if (!shiprocketOrderId) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
    }

    // Map Shiprocket status to our status
    const statusMap = {
      '1': 'pickup_scheduled',     // AWB Assigned
      '2': 'pickup_scheduled',     // Ready to Pick
      '3': 'picked_up',            // Picked Up
      '4': 'picked_up',            // Pickup Queued
      '5': 'in_transit',           // Shipped
      '6': 'out_for_delivery',     // Out for Delivery
      '7': 'delivered',            // Delivered
      '8': 'cancelled',            // Cancelled
      '9': 'rto_initiated',        // RTO Initiated
      '10': 'rto_delivered',       // RTO Delivered
    };

    const mappedStatus = statusMap[String(status)] || 'in_transit';

    // Update shipment record
    const { data: shipment } = await supabaseAdmin
      .from('shipments')
      .update({
        status: mappedStatus,
        awb_number: awbNumber || undefined,
        courier_name: courierName || undefined,
        estimated_delivery: estimatedDelivery || undefined,
        delivered_at: mappedStatus === 'delivered' ? new Date().toISOString() : undefined,
      })
      .eq('shiprocket_order_id', String(shiprocketOrderId))
      .select('order_id')
      .single();

    if (shipment) {
      // Update order status
      const orderStatus = mappedStatus === 'delivered' ? 'delivered' :
        mappedStatus === 'out_for_delivery' ? 'out_for_delivery' :
        mappedStatus === 'in_transit' ? 'shipped' :
        mappedStatus === 'cancelled' ? 'cancelled' : undefined;

      if (orderStatus) {
        await supabaseAdmin
          .from('orders')
          .update({
            status: orderStatus,
            delivered_at: mappedStatus === 'delivered' ? new Date().toISOString() : undefined,
          })
          .eq('id', shipment.order_id);
      }

      // Send email notification
      try {
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('order_number, user_id')
          .eq('id', shipment.order_id)
          .single();

        if (order) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('id', order.user_id)
            .single();

          // Get user email from auth
          const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(order.user_id);

          if (user?.email) {
            const statusLabels = {
              pickup_scheduled: 'Pickup Scheduled',
              picked_up: 'Package Picked Up',
              in_transit: 'In Transit',
              out_for_delivery: 'Out for Delivery',
              delivered: 'Delivered! 🎉',
            };

            await sendShippingUpdate({
              to: user.email,
              orderNumber: order.order_number,
              status: statusLabels[mappedStatus] || mappedStatus,
              trackingNumber: awbNumber,
              courierName,
            });
          }
        }
      } catch (emailErr) {
        console.error('Shipping email failed:', emailErr);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Shiprocket webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
