export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { sendShippingUpdate } from '../../../../../lib/resend';
import { createOrderAndAssignAWB, requestPickup as shiprocketRequestPickup, cancelShipment } from '../../../../../lib/shiprocket';

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
  'Return Initiated': 'return_initiated',
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
  cancelled: '❌ Order Cancelled',
};

/**
 * GET: Retrieve detailed view of a single order (including items, shipment, audit events, financials)
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    let findQuery = supabaseAdmin
      .from('orders')
      .select('*, order_items(*), payments(*), shipments(*)')
      .or(`id.eq.${id},order_number.eq.${id}`);

    const { data: matches, error } = await findQuery;
    let order = matches?.[0];

    if (!order) {
      const { data: fallback } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*), payments(*), shipments(*)')
        .ilike('order_number', `%${id}%`)
        .limit(1);
      order = fallback?.[0];
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const shipment = Array.isArray(order.shipments) ? (order.shipments[0] || null) : (order.shipments || null);

    // Fetch tracking / audit events if shipment exists
    let auditEvents = [];
    if (shipment?.id) {
      const { data: events } = await supabaseAdmin
        .from('shipment_events')
        .select('*')
        .eq('shipment_id', shipment.id)
        .order('event_time', { ascending: false });
      auditEvents = events || [];
    }

    const isCod = order.payment_method === 'cod';
    const codCollectable = isCod ? Number(shipment?.cod_collectable || order.total || 0) : 0;

    const financials = {
      itemSubtotal: Number(order.subtotal || 0),
      discount: Number(order.discount || 0),
      customerShippingCharge: Number(order.shipping_cost || 0),
      platformFee: Number(order.platform_fee || 0),
      tax: Number(order.tax || 0),
      grandTotal: Number(order.total || 0),
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status || (isCod ? 'cod_pending' : 'paid'),
      codCollectable,
      courierFreightCost: Number(shipment?.courier_freight_cost || 0),
      rtoCost: Number(shipment?.rto_cost || 0),
      refundAmount: Number(order.refund_amount || 0),
    };

    return NextResponse.json({
      success: true,
      order,
      shipment: shipment ? {
        ...shipment,
        labelUrl: shipment.label_url || `/api/admin/shipments/label?orderId=${encodeURIComponent(order.order_number)}`,
        invoiceUrl: `/api/admin/orders/${order.id}/invoice`,
        events: auditEvents,
      } : null,
      financials,
    });
  } catch (err) {
    console.error('Get single order error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PATCH: Update order status or details and manage shipment lifecycle
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, trackingNumber, courierName, paymentStatus, cancelReason } = body;

    const mappedStatus = DB_STATUS_MAP[status] || (status ? status.toLowerCase().replace(/\s+/g, '_') : undefined);

    const nowIso = new Date().toISOString();
    const updates = {
      updated_at: nowIso,
    };
    if (mappedStatus) {
      updates.status = mappedStatus;
      if (mappedStatus === 'delivered') {
        updates.delivered_at = nowIso;
        updates.payment_status = 'paid'; // COD collected
      }
    }

    // Find order first by id or order_number
    let findQuery = supabaseAdmin
      .from('orders')
      .select('id, order_number, customer_email, shipping_address, user_id, payment_method, total')
      .or(`id.eq.${id},order_number.eq.${id}`);

    const { data: orderMatches } = await findQuery;
    let targetOrder = orderMatches?.[0];

    if (!targetOrder) {
      const { data: fallbackMatches } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, customer_email, shipping_address, user_id, payment_method, total')
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
      .select('*, order_items(*)')
      .single();

    if (orderError) throw orderError;

    if (paymentStatus) {
      await supabaseAdmin
        .from('payments')
        .update({ status: paymentStatus.toLowerCase(), updated_at: nowIso })
        .eq('order_id', orderDbId);
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: paymentStatus.toLowerCase(), updated_at: nowIso })
        .eq('id', orderDbId);
    }

    // If manual tracking number provided, update shipment
    if (trackingNumber) {
      const { data: existingShipment } = await supabaseAdmin
        .from('shipments')
        .select('id')
        .eq('order_id', orderDbId)
        .maybeSingle();

      if (existingShipment) {
        await supabaseAdmin
          .from('shipments')
          .update({
            awb_number: trackingNumber,
            courier_name: courierName || 'Shiprocket Express',
            status: mappedStatus === 'shipped' ? 'in_transit' : (mappedStatus === 'delivered' ? 'delivered' : 'in_transit'),
            updated_at: nowIso,
          })
          .eq('id', existingShipment.id);
      } else {
        await supabaseAdmin.from('shipments').insert({
          order_id: orderDbId,
          awb_number: trackingNumber,
          courier_name: courierName || 'Shiprocket Express',
          status: 'in_transit',
        });
      }
    }

    // ═══════════════════════════════════════════════════════════
    // AUTO-SHIPROCKET ACTIONS ON STATUS CHANGE
    // ═══════════════════════════════════════════════════════════

    // When admin marks as "Packed" → auto-create Shiprocket shipment + AWB if not already done
    if (mappedStatus === 'packed') {
      try {
        const { data: existingShipment } = await supabaseAdmin
          .from('shipments')
          .select('*')
          .eq('order_id', orderDbId)
          .maybeSingle();

        const isCod = updatedOrder.payment_method === 'cod';
        const codCollectable = isCod ? Number(updatedOrder.total || 0) : 0;

        if (!existingShipment?.shiprocket_order_id) {
          const shiprocketResult = await createOrderAndAssignAWB({
            orderNumber: updatedOrder.order_number,
            orderDate: new Date(updatedOrder.created_at || Date.now()).toISOString().split('T')[0],
            billingAddress: updatedOrder.shipping_address,
            shippingAddress: updatedOrder.shipping_address,
            items: updatedOrder.order_items || [],
            paymentMethod: isCod ? 'cod' : 'prepaid',
            subtotal: updatedOrder.subtotal,
            discount: updatedOrder.discount,
            shippingCharges: updatedOrder.shipping_cost,
          });

          const shipmentData = {
            order_id: orderDbId,
            shiprocket_order_id: String(shiprocketResult.order_id || ''),
            shiprocket_shipment_id: String(shiprocketResult.shipment_id || ''),
            awb_number: shiprocketResult.awb_code || '',
            courier_name: shiprocketResult.courier_name || '',
            courier_id: shiprocketResult.courier_company_id || null,
            routing_code: shiprocketResult.routing_code || '',
            cod_collectable: codCollectable,
            status: 'pending',
            updated_at: nowIso,
          };

          let savedId = existingShipment?.id;
          if (existingShipment) {
            await supabaseAdmin.from('shipments').update(shipmentData).eq('id', existingShipment.id);
          } else {
            const { data: ins } = await supabaseAdmin.from('shipments').insert(shipmentData).select('id').single();
            savedId = ins?.id;
          }

          if (savedId) {
            await supabaseAdmin.from('shipment_events').insert({
              shipment_id: savedId,
              status: 'pending',
              status_code: 'PACKED',
              activity: `Order packed & shipment initialized (AWB: ${shiprocketResult.awb_code || 'Pending'})`,
              location: 'Packing Station',
            });
          }
        }
      } catch (packErr) {
        console.warn('Auto Shiprocket on Packed notice:', packErr.message);
      }
    }

    // When admin marks as "Shipped" → auto-request pickup if shipment has AWB
    if (mappedStatus === 'shipped') {
      try {
        const { data: existingShipment } = await supabaseAdmin
          .from('shipments')
          .select('*')
          .eq('order_id', orderDbId)
          .maybeSingle();

        if (existingShipment?.shiprocket_shipment_id && existingShipment.pickup_status !== 'scheduled') {
          const pickupResult = await shiprocketRequestPickup(existingShipment.shiprocket_shipment_id);
          const pickupToken = pickupResult?.pickup_token_number || pickupResult?.response?.pickup_token_number || '';

          await supabaseAdmin
            .from('shipments')
            .update({
              status: 'pickup_scheduled',
              pickup_status: 'scheduled',
              pickup_token: String(pickupToken || ''),
              updated_at: nowIso,
            })
            .eq('id', existingShipment.id);

          await supabaseAdmin.from('shipment_events').insert({
            shipment_id: existingShipment.id,
            status: 'pickup_scheduled',
            status_code: 'PICKUP_SCHEDULED',
            activity: `Courier pickup scheduled (Token: ${pickupToken || 'Active'})`,
            location: 'Faridabad Hub',
          });
        }
      } catch (shipErr) {
        console.warn('Auto pickup on Shipped notice:', shipErr.message);
      }
    }

    // When admin cancels order → cancel shipment in Shiprocket & DB
    if (mappedStatus === 'cancelled') {
      try {
        const { data: existingShipment } = await supabaseAdmin
          .from('shipments')
          .select('*')
          .eq('order_id', orderDbId)
          .maybeSingle();

        if (existingShipment) {
          if (existingShipment.awb_number && !existingShipment.awb_number.startsWith('SR-')) {
            await cancelShipment(existingShipment.awb_number).catch(() => {});
          }

          await supabaseAdmin
            .from('shipments')
            .update({
              status: 'cancelled',
              cancel_reason: cancelReason || 'Order cancelled by admin',
              updated_at: nowIso,
            })
            .eq('id', existingShipment.id);

          await supabaseAdmin.from('shipment_events').insert({
            shipment_id: existingShipment.id,
            status: 'cancelled',
            status_code: 'CANCELLED',
            activity: `Shipment cancelled: ${cancelReason || 'Order cancelled by admin'}`,
            location: 'Admin Panel',
          });
        }
      } catch (cancelErr) {
        console.warn('Cancel shipment on order cancel notice:', cancelErr.message);
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

        let awb = trackingNumber || '';
        let courier = courierName || '';
        if (!awb) {
          const { data: ship } = await supabaseAdmin
            .from('shipments')
            .select('awb_number, courier_name')
            .eq('order_id', orderDbId)
            .maybeSingle();
          awb = ship?.awb_number || '';
          courier = ship?.courier_name || '';
        }

        try {
          await sendShippingUpdate({
            to: customerEmail,
            orderNumber,
            status: statusLabel,
            trackingNumber: awb,
            courierName: courier || 'Shiprocket Express',
            trackingUrl,
          });
        } catch (emailErr) {
          console.error('Status update email failed (non-blocking):', emailErr);
        }
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error('Update order error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
