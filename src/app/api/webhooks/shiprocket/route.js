export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { sendShippingUpdate } from '../../../../lib/resend';

// Status code & text mapping for Shiprocket
const STATUS_MAP = {
  // Numeric codes from Shiprocket webhook specification
  '1': 'pickup_scheduled',     // AWB Assigned
  '2': 'pickup_scheduled',     // Label Generated
  '3': 'pickup_scheduled',     // Pickup Scheduled
  '4': 'pickup_scheduled',     // Pickup Queued
  '5': 'pickup_scheduled',     // Manifest Generated
  '6': 'shipped',              // Shipped
  '7': 'delivered',            // Delivered
  '8': 'cancelled',            // Cancelled
  '9': 'rto_initiated',       // RTO Initiated
  '10': 'rto_delivered',      // RTO Delivered
  '11': 'pickup_scheduled',   // Pending Pickup
  '12': 'lost',               // Lost
  '13': 'pickup_scheduled',   // Pickup Error
  '14': 'rto_initiated',      // RTO Acknowledged
  '15': 'pickup_scheduled',   // Pickup Rescheduled
  '16': 'cancelled',          // Cancellation Requested
  '17': 'out_for_delivery',   // Out for Delivery
  '18': 'in_transit',         // In Transit
  '19': 'out_for_pickup',     // Out for Pickup
  '20': 'pickup_scheduled',   // Pickup Exception
  '21': 'failed_delivery',    // Undelivered / NDR
  '22': 'pickup_rescheduled', // Delayed
  '23': 'pickup_rescheduled', // Partial Delivered
  '24': 'destroyed',          // Destroyed
  '25': 'damaged',            // Damaged
  '26': 'fulfilled',          // Fulfilled
  '38': 'in_transit',         // Reached Destination Hub
  '42': 'picked_up',          // Picked Up
  '44': 'failed_delivery',    // Delivery Failed
  '45': 'rto_initiated',      // RTO In Transit

  // Common String Fallbacks
  'awb assigned': 'pickup_scheduled',
  'label generated': 'pickup_scheduled',
  'pickup scheduled': 'pickup_scheduled',
  'pickup queued': 'pickup_scheduled',
  'manifest generated': 'pickup_scheduled',
  'picked up': 'picked_up',
  'shipped': 'shipped',
  'in transit': 'in_transit',
  'out for delivery': 'out_for_delivery',
  'delivered': 'delivered',
  'cancelled': 'cancelled',
  'canceled': 'cancelled',
  'rto initiated': 'rto_initiated',
  'rto delivered': 'rto_delivered',
  'rto in transit': 'rto_initiated',
  'undelivered': 'failed_delivery',
  'ndr': 'failed_delivery',
  'delivery failed': 'failed_delivery',
  'reattempt': 'failed_delivery',
};

// Order status hierarchy weights to prevent out-of-order webhook regression
const STATUS_WEIGHTS = {
  pending_payment: 5,
  pending: 10,
  confirmed: 20,
  processing: 30,
  packed: 35,
  pickup_scheduled: 40,
  picked_up: 45,
  shipped: 50,
  in_transit: 55,
  out_for_delivery: 60,
  failed_delivery: 65,
  delivered: 70,
  cancelled: 80,
  return_requested: 85,
  return_approved: 86,
  rto_initiated: 87,
  rto_delivered: 88,
  returned: 90,
  refunded: 95,
};

// Map Shiprocket shipment status to order lifecycle status
const SHIPMENT_TO_ORDER_STATUS = {
  pickup_scheduled: 'packed',
  picked_up: 'shipped',
  shipped: 'shipped',
  in_transit: 'in_transit',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
  failed_delivery: 'failed_delivery',
  cancelled: 'cancelled',
  rto_initiated: 'rto_initiated',
  rto_delivered: 'rto_delivered',
};

export async function POST(request) {
  try {
    // 1. Webhook Security Verification (Optional token check if configured)
    const expectedToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    if (expectedToken) {
      const incomingToken = request.headers.get('x-api-key') || request.headers.get('x-shiprocket-token');
      if (!incomingToken || incomingToken !== expectedToken) {
        console.warn('Unauthorized Shiprocket webhook attempt with invalid token');
        return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
      }
    }

    const body = await request.json();

    const shiprocketOrderId = body.order_id || body.shipment_id || body.shiprocket_order_id;
    const statusCode = String(body.current_status_id || body.status_id || body.current_status || '').trim();
    const rawStatusText = String(body.current_status || body.status || '').toLowerCase().trim();
    const awbNumber = body.awb || body.awb_code;
    const courierName = body.courier_name;
    const estimatedDelivery = body.etd;
    const activity = body.activity || body.current_status || 'Carrier scan update';
    const location = body.location || body.city || '';
    const ndrReason = body.ndr_reason || body.reason || '';
    const eventTime = body.event_time || body.scanned_date || new Date().toISOString();

    if (!awbNumber && !shiprocketOrderId) {
      return NextResponse.json({ error: 'Missing awb or order_id in webhook payload' }, { status: 400 });
    }

    // 2. Webhook Idempotency Check (Prevent duplicate execution)
    const eventId = String(body.event_id || body.id || `sr_${awbNumber || shiprocketOrderId}_${statusCode}_${eventTime}`).replace(/[^a-zA-Z0-9_-]/g, '_');

    const { data: existingLog } = await supabaseAdmin
      .from('webhook_logs')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingLog) {
      return NextResponse.json({
        received: true,
        duplicate: true,
        message: 'Event already processed',
        eventId,
      });
    }

    // Record this webhook event in webhook_logs
    await supabaseAdmin.from('webhook_logs').insert({
      source: 'shiprocket',
      event_id: eventId,
      payload: body,
      processed_at: new Date().toISOString(),
    });

    // 3. Determine mapped shipment status
    let mappedShipmentStatus = STATUS_MAP[statusCode] || STATUS_MAP[rawStatusText];
    if (!mappedShipmentStatus) {
      if (rawStatusText.includes('deliver') && !rawStatusText.includes('undeliver')) {
        mappedShipmentStatus = 'delivered';
      } else if (rawStatusText.includes('out for delivery')) {
        mappedShipmentStatus = 'out_for_delivery';
      } else if (rawStatusText.includes('transit')) {
        mappedShipmentStatus = 'in_transit';
      } else if (rawStatusText.includes('pick')) {
        mappedShipmentStatus = 'picked_up';
      } else if (rawStatusText.includes('rto')) {
        mappedShipmentStatus = 'rto_initiated';
      } else if (rawStatusText.includes('cancel')) {
        mappedShipmentStatus = 'cancelled';
      } else {
        mappedShipmentStatus = 'in_transit';
      }
    }

    // 4. Locate shipment in database
    let shipmentQuery = supabaseAdmin.from('shipments').select('*');
    if (awbNumber) {
      shipmentQuery = shipmentQuery.eq('awb_number', awbNumber);
    } else {
      shipmentQuery = shipmentQuery.eq('shiprocket_order_id', String(shiprocketOrderId));
    }

    const { data: shipment } = await shipmentQuery.maybeSingle();

    if (!shipment) {
      console.warn(`Shiprocket Webhook: Shipment not found for AWB ${awbNumber} / SR Order ${shiprocketOrderId}`);
      return NextResponse.json({ received: true, note: 'Shipment not found in database', eventId });
    }

    const nowIso = new Date().toISOString();

    // 5. Update shipment record
    const updateShipmentPayload = {
      status: mappedShipmentStatus,
      updated_at: nowIso,
    };

    if (courierName && !shipment.courier_name) updateShipmentPayload.courier_name = courierName;
    if (awbNumber && !shipment.awb_number) updateShipmentPayload.awb_number = awbNumber;
    if (estimatedDelivery) updateShipmentPayload.estimated_delivery = estimatedDelivery;

    if (mappedShipmentStatus === 'delivered') {
      updateShipmentPayload.delivered_at = nowIso;
    }

    if (mappedShipmentStatus === 'failed_delivery' && ndrReason) {
      updateShipmentPayload.ndr_reason = ndrReason;
    }

    if (body.freight_charges) {
      updateShipmentPayload.courier_freight_cost = Number(body.freight_charges);
    }
    if (body.rto_charges) {
      updateShipmentPayload.rto_cost = Number(body.rto_charges);
    }

    await supabaseAdmin
      .from('shipments')
      .update(updateShipmentPayload)
      .eq('id', shipment.id);

    // 6. Log carrier event to shipment_events
    await supabaseAdmin.from('shipment_events').insert({
      shipment_id: shipment.id,
      status: mappedShipmentStatus,
      status_code: statusCode || mappedShipmentStatus.toUpperCase(),
      activity: activity || `Carrier scan: ${mappedShipmentStatus}`,
      location: location || '',
      shiprocket_status_id: String(statusCode || ''),
      event_time: eventTime,
      raw_data: body,
    });

    // 7. Synchronize Order Status with Out-of-Order Regression Protection
    if (shipment.order_id) {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', shipment.order_id)
        .single();

      if (order) {
        const currentOrderStatus = (order.status || 'pending').toLowerCase();
        const targetOrderStatus = SHIPMENT_TO_ORDER_STATUS[mappedShipmentStatus];

        const currentWeight = STATUS_WEIGHTS[currentOrderStatus] || 0;
        const targetWeight = targetOrderStatus ? (STATUS_WEIGHTS[targetOrderStatus] || 0) : 0;

        // Terminal states cannot be overwritten by older transit events
        const isTerminalState = ['delivered', 'cancelled', 'returned', 'refunded'].includes(currentOrderStatus);

        // If target status is defined and does not regress an advanced state
        if (targetOrderStatus && (!isTerminalState || targetWeight >= currentWeight)) {
          if (targetOrderStatus !== currentOrderStatus) {
            const orderUpdate = {
              status: targetOrderStatus,
              updated_at: nowIso,
            };

            // Auto-mark COD cash collection on delivery
            if (targetOrderStatus === 'delivered') {
              orderUpdate.delivered_at = nowIso;
              if (order.payment_method === 'cod') {
                orderUpdate.payment_status = 'paid';
              }
            }

            await supabaseAdmin
              .from('orders')
              .update(orderUpdate)
              .eq('id', order.id);

            // Record audit log in order_status_history
            await supabaseAdmin.from('order_status_history').insert({
              order_id: order.id,
              from_status: currentOrderStatus,
              to_status: targetOrderStatus,
              source: 'shiprocket_webhook',
              changed_by: 'shiprocket',
              reason: activity || `Carrier update: ${mappedShipmentStatus} (${location || 'In Transit'})`,
              metadata: {
                awb: awbNumber || shipment.awb_number,
                courier: courierName || shipment.courier_name,
                statusCode,
                location,
                eventId,
              },
            });

            // Send customer email notification via Resend
            try {
              const customerEmail = order.customer_email || order.shipping_address?.email;
              if (customerEmail) {
                const statusLabels = {
                  pickup_scheduled: 'Pickup Scheduled',
                  picked_up: 'Package Picked Up',
                  shipped: 'Order Shipped',
                  in_transit: 'In Transit',
                  out_for_delivery: 'Out for Delivery Today! 🏍️',
                  delivered: 'Order Delivered Successfully! 🎉',
                  failed_delivery: 'Delivery Attempt Failed — We Will Reattempt',
                  rto_initiated: 'Return to Origin Initiated',
                };

                if (statusLabels[mappedShipmentStatus]) {
                  await sendShippingUpdate({
                    to: customerEmail,
                    orderNumber: order.order_number,
                    status: statusLabels[mappedShipmentStatus],
                    trackingNumber: awbNumber || shipment.awb_number,
                    courierName: courierName || shipment.courier_name || 'Shiprocket Express',
                    trackingUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://trioenterprises.in'}/track-order?id=${encodeURIComponent(order.order_number)}`,
                  });
                }
              }
            } catch (emailErr) {
              console.warn('Webhook customer email warning:', emailErr.message);
            }
          }
        } else {
          console.log(`Shiprocket Webhook: Prevented status regression. Order is at "${currentOrderStatus}" (weight ${currentWeight}), incoming status was "${targetOrderStatus}" (weight ${targetWeight}). Carrier scan still logged in events.`);
        }
      }
    }

    return NextResponse.json({
      received: true,
      mappedStatus: mappedShipmentStatus,
      shipmentId: shipment.id,
      eventId,
    });
  } catch (err) {
    console.error('Shiprocket webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed', details: err.message }, { status: 500 });
  }
}
