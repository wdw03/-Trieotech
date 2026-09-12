export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { sendShippingUpdate } from '../../../../lib/resend';

// Status code & text mapping for Shiprocket
const STATUS_MAP = {
  // Numeric codes
  '1': 'pickup_scheduled',     // AWB Assigned
  '2': 'pickup_scheduled',     // Label Generated
  '3': 'pickup_scheduled',     // Pickup Scheduled
  '4': 'pickup_scheduled',     // Pickup Queued
  '5': 'pickup_scheduled',     // Manifest Generated
  '6': 'in_transit',           // Shipped / In Transit
  '7': 'out_for_delivery',     // Out for Delivery
  '8': 'delivered',            // Delivered
  '9': 'cancelled',            // Cancelled
  '10': 'rto_initiated',       // RTO Initiated
  '11': 'rto_delivered',       // RTO Delivered
  '12': 'rto_initiated',       // RTO In Transit
  '13': 'pickup_scheduled',    // Pickup Rescheduled
  '14': 'pickup_scheduled',    // Out for Pickup
  '15': 'pickup_scheduled',    // Pickup Rescheduled
  '16': 'cancelled',           // Pickup Cancelled
  '17': 'pickup_scheduled',    // Packed
  '18': 'in_transit',          // In Transit
  '19': 'out_for_delivery',    // Out for Delivery
  '20': 'in_transit',          // Reached at Destination Hub
  '21': 'ndr',                 // Undelivered / NDR
  '22': 'reattempt_scheduled', // Reattempt Scheduled
  '23': 'in_transit',          // Delivery Delayed
  '24': 'lost',                // Lost
  '25': 'disposed',            // Damaged / Disposed
  '26': 'return_initiated',    // Return Initiated

  // String keywords fallback
  'awb assigned': 'pickup_scheduled',
  'label generated': 'pickup_scheduled',
  'pickup scheduled': 'pickup_scheduled',
  'pickup queued': 'pickup_scheduled',
  'manifest generated': 'pickup_scheduled',
  'picked up': 'picked_up',
  'shipped': 'in_transit',
  'in transit': 'in_transit',
  'out for delivery': 'out_for_delivery',
  'delivered': 'delivered',
  'cancelled': 'cancelled',
  'canceled': 'cancelled',
  'rto initiated': 'rto_initiated',
  'rto delivered': 'rto_delivered',
  'rto in transit': 'rto_initiated',
  'undelivered': 'ndr',
  'ndr': 'ndr',
  'reattempt': 'reattempt_scheduled',
  'lost': 'lost',
  'damaged': 'disposed',
  'disposed': 'disposed',
};

export async function POST(request) {
  try {
    const body = await request.json();

    const shiprocketOrderId = body.order_id || body.shipment_id || body.shiprocket_order_id;
    const statusCode = String(body.current_status_id || body.status_id || body.current_status || '').trim();
    const rawStatusText = String(body.current_status || body.status || '').toLowerCase().trim();
    const awbNumber = body.awb || body.awb_code;
    const courierName = body.courier_name;
    const estimatedDelivery = body.etd;
    const activity = body.activity || body.current_status || 'Status update';
    const location = body.location || body.city || '';
    const ndrReason = body.ndr_reason || body.reason || '';

    // Determine mapped status
    let mappedStatus = STATUS_MAP[statusCode] || STATUS_MAP[rawStatusText];
    if (!mappedStatus) {
      if (rawStatusText.includes('deliver') && !rawStatusText.includes('undeliver')) {
        mappedStatus = 'delivered';
      } else if (rawStatusText.includes('out for delivery')) {
        mappedStatus = 'out_for_delivery';
      } else if (rawStatusText.includes('transit')) {
        mappedStatus = 'in_transit';
      } else if (rawStatusText.includes('pick')) {
        mappedStatus = 'picked_up';
      } else if (rawStatusText.includes('rto')) {
        mappedStatus = 'rto_initiated';
      } else if (rawStatusText.includes('cancel')) {
        mappedStatus = 'cancelled';
      } else {
        mappedStatus = 'in_transit';
      }
    }

    // 1. Locate shipment in Supabase
    let shipmentQuery = supabaseAdmin.from('shipments').select('*');
    if (awbNumber) {
      shipmentQuery = shipmentQuery.eq('awb_number', awbNumber);
    } else if (shiprocketOrderId) {
      shipmentQuery = shipmentQuery.eq('shiprocket_order_id', String(shiprocketOrderId));
    } else {
      return NextResponse.json({ error: 'Missing awb or order_id in webhook payload' }, { status: 400 });
    }

    const { data: shipment } = await shipmentQuery.maybeSingle();

    if (!shipment) {
      console.warn(`Webhook: Shipment not found for AWB ${awbNumber} / SR Order ${shiprocketOrderId}`);
      return NextResponse.json({ received: true, note: 'Shipment not found locally' });
    }

    const nowIso = new Date().toISOString();
    const updateShipmentPayload = {
      status: mappedStatus,
      updated_at: nowIso,
    };

    if (courierName && !shipment.courier_name) updateShipmentPayload.courier_name = courierName;
    if (awbNumber && !shipment.awb_number) updateShipmentPayload.awb_number = awbNumber;
    if (estimatedDelivery) updateShipmentPayload.estimated_delivery = estimatedDelivery;

    if (mappedStatus === 'delivered') {
      updateShipmentPayload.delivered_at = nowIso;
    }

    if (mappedStatus === 'ndr' && ndrReason) {
      updateShipmentPayload.ndr_reason = ndrReason;
    }

    if (body.freight_charges) {
      updateShipmentPayload.courier_freight_cost = Number(body.freight_charges);
    }
    if (body.rto_charges) {
      updateShipmentPayload.rto_cost = Number(body.rto_charges);
    }

    // 2. Update shipment record
    await supabaseAdmin
      .from('shipments')
      .update(updateShipmentPayload)
      .eq('id', shipment.id);

    // 3. Log into shipment_events audit trail
    await supabaseAdmin.from('shipment_events').insert({
      shipment_id: shipment.id,
      status: mappedStatus,
      status_code: statusCode || mappedStatus.toUpperCase(),
      activity: activity || `Carrier scan: ${mappedStatus}`,
      location: location || '',
      shiprocket_status_id: String(statusCode || ''),
      event_time: body.event_time || nowIso,
      raw_data: body,
    });

    // 4. Sync order status & financial collection
    const orderStatusMap = {
      in_transit: 'shipped',
      out_for_delivery: 'out_for_delivery',
      delivered: 'delivered',
      cancelled: 'cancelled',
      return_initiated: 'refunded',
    };

    const targetOrderStatus = orderStatusMap[mappedStatus];
    if (targetOrderStatus && shipment.order_id) {
      const orderUpdate = {
        status: targetOrderStatus,
        updated_at: nowIso,
      };

      if (mappedStatus === 'delivered') {
        orderUpdate.delivered_at = nowIso;
        orderUpdate.payment_status = 'paid'; // COD cash collected
      }

      await supabaseAdmin.from('orders').update(orderUpdate).eq('id', shipment.order_id);
    }

    // 5. Send customer email update via Resend
    try {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('order_number, user_id')
        .eq('id', shipment.order_id)
        .single();

      if (order?.user_id) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
        if (userData?.user?.email) {
          const statusLabels = {
            pickup_scheduled: 'Pickup Scheduled',
            picked_up: 'Package Picked Up',
            in_transit: 'In Transit',
            out_for_delivery: 'Out for Delivery Today!',
            delivered: 'Delivered Successfully! 🎉',
            ndr: 'Delivery Attempt Failed — We Will Reattempt',
            rto_initiated: 'Return Initiated',
          };

          if (statusLabels[mappedStatus]) {
            await sendShippingUpdate({
              to: userData.user.email,
              orderNumber: order.order_number,
              status: statusLabels[mappedStatus],
              trackingNumber: awbNumber || shipment.awb_number,
              courierName: courierName || shipment.courier_name,
            });
          }
        }
      }
    } catch (emailErr) {
      console.warn('Webhook email notification notice:', emailErr.message);
    }

    return NextResponse.json({
      received: true,
      mappedStatus,
      shipmentId: shipment.id,
    });
  } catch (err) {
    console.error('Shiprocket webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed', details: err.message }, { status: 500 });
  }
}
