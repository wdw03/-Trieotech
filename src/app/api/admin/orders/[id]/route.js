export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { sendShippingUpdate, sendOrderCancellation } from '../../../../../lib/resend';
import { createShiprocketOrder, createOrderAndAssignAWB, requestPickup as shiprocketRequestPickup, cancelShipment, cancelShiprocketComplete } from '../../../../../lib/shiprocket';
import { createRefund } from '../../../../../lib/razorpay';

// Map dashboard status to DB status
const DB_STATUS_MAP = {
  'New': 'pending',
  'Confirmed': 'confirmed',
  'Processing': 'processing',
  'Packed': 'packed',
  'Pickup Scheduled': 'pickup_scheduled',
  'Picked Up': 'picked_up',
  'Shipped': 'shipped',
  'In Transit': 'in_transit',
  'Out for Delivery': 'out_for_delivery',
  'Delivered': 'delivered',
  'Cancelled': 'cancelled',
  'Delivery Failed': 'failed_delivery',
  'RTO Initiated': 'rto_initiated',
  'RTO Delivered': 'rto_delivered',
  'Return Requested': 'return_requested',
  'Return Approved': 'return_approved',
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
 * GET: Retrieve detailed view of a single order (including items, shipment, audit events, financials, status history)
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

    // Fetch tracking / carrier events if shipment exists
    let auditEvents = [];
    if (shipment?.id) {
      const { data: events } = await supabaseAdmin
        .from('shipment_events')
        .select('*')
        .eq('shipment_id', shipment.id)
        .order('event_time', { ascending: false });
      auditEvents = events || [];
    }

    // Fetch order status history audit log
    const { data: statusHistory } = await supabaseAdmin
      .from('order_status_history')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false });

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
      statusHistory: statusHistory || [],
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
    const { status, trackingNumber, courierName, paymentStatus, cancelReason, adminUser } = body;

    const mappedStatus = DB_STATUS_MAP[status] || (status ? status.toLowerCase().replace(/\s+/g, '_') : undefined);
    const nowIso = new Date().toISOString();

    // 1. Find target order first (including related items and payments)
    let findQuery = supabaseAdmin
      .from('orders')
      .select('*, order_items(*), payments(*), shipments(*)')
      .or(`id.eq.${id},order_number.eq.${id}`);

    const { data: orderMatches } = await findQuery;
    let targetOrder = orderMatches?.[0];

    if (!targetOrder) {
      const { data: fallbackMatches } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*), payments(*), shipments(*)')
        .ilike('order_number', `%${id}%`)
        .limit(1);

      if (!fallbackMatches?.[0]) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      targetOrder = fallbackMatches[0];
    }

    const orderDbId = targetOrder.id;
    const previousStatus = (targetOrder.status || '').toLowerCase();

    // 2. Cancellation validation: cannot update if already cancelled
    if (previousStatus === 'cancelled' && mappedStatus !== 'cancelled') {
      return NextResponse.json(
        { error: 'This order is cancelled and cannot be updated to an active status or shipped.' },
        { status: 400 }
      );
    }

    if (mappedStatus === 'cancelled') {
      if (['delivered', 'returned', 'refunded'].includes(previousStatus)) {
        return NextResponse.json(
          { error: `Cannot cancel order with status "${targetOrder.status}". Please process as a return or refund.` },
          { status: 400 }
        );
      }

      // 2-Step cancellation guard: If an active shipment exists that is NOT cancelled, block order cancellation
      const existingShipment = Array.isArray(targetOrder.shipments) ? targetOrder.shipments[0] : targetOrder.shipments;
      if (existingShipment && existingShipment.status && existingShipment.status !== 'cancelled' && existingShipment.status !== 'not_created') {
        return NextResponse.json(
          { error: 'Active shipment exists in Shiprocket for this order. Please cancel the shipment first before cancelling the order.' },
          { status: 400 }
        );
      }
    }

    const updates = {
      updated_at: nowIso,
    };

    if (mappedStatus) {
      updates.status = mappedStatus;
      if (mappedStatus === 'delivered') {
        updates.delivered_at = nowIso;
        if (targetOrder.payment_method === 'cod') {
          updates.payment_status = 'paid';
        }
      }
    }

    let refundResult = null;
    let shipmentCancelled = false;

    // 3. Admin Cancellation Workflow (Stock restore, Shiprocket sync, Razorpay refund)
    if (mappedStatus === 'cancelled') {
      updates.cancelled_at = nowIso;
      updates.cancellation_reason = cancelReason || 'Order cancelled by admin';

      const isCod = targetOrder.payment_method === 'cod';

      // 3a. Razorpay refund for online payments
      if (!isCod) {
        const payment = (targetOrder.payments || []).find(
          (p) => (p.status === 'captured' || p.status === 'paid') && p.razorpay_payment_id
        );

        if (payment?.razorpay_payment_id) {
          try {
            const refundAmount = Number(targetOrder.total) || Number(payment.amount);
            refundResult = await createRefund(payment.razorpay_payment_id, refundAmount, {
              order_id: targetOrder.order_number,
              reason: cancelReason || 'Order cancelled by admin',
            });

            try {
              await supabaseAdmin
                .from('payments')
                .update({
                  status: 'refunded',
                  refund_id: refundResult?.id || null,
                  refunded_at: nowIso,
                })
                .eq('id', payment.id);
            } catch (pErr) {
              console.warn('Admin payment record update notice:', pErr.message);
            }

            updates.payment_status = 'refunded';
            updates.refund_amount = refundAmount;
            updates.refund_id = refundResult?.id || '';
          } catch (refundErr) {
            console.error('Admin order refund error:', refundErr);
            try {
              await supabaseAdmin
                .from('payments')
                .update({ status: 'refund_failed', error_description: refundErr.message })
                .eq('id', payment.id);
            } catch (_) {}
          }
        }
      } else {
        updates.payment_status = 'cancelled';
      }

      // 3b. Restore inventory
      for (const item of targetOrder.order_items || []) {
        if (item.product_id) {
          try {
            const { data: prod } = await supabaseAdmin
              .from('products')
              .select('stock')
              .eq('id', item.product_id)
              .single();

            if (prod) {
              await supabaseAdmin
                .from('products')
                .update({
                  stock: (prod.stock || 0) + (item.quantity || 1),
                  in_stock: true,
                })
                .eq('id', item.product_id);
            }
          } catch (stockErr) {
            console.warn('Admin cancel: stock restore failed for product', item.product_id, stockErr.message);
          }
        }
      }

      // 3c. Cancel shipment in Shiprocket & DB
      try {
        const existingShipment = Array.isArray(targetOrder.shipments) ? targetOrder.shipments[0] : targetOrder.shipments;
        await cancelShiprocketComplete({
          orderNumber: targetOrder.order_number,
          shiprocketOrderId: existingShipment?.shiprocket_order_id,
          awbNumber: existingShipment?.awb_number,
        }).catch((err) => console.warn('Admin cancel Shiprocket complete notice:', err.message));
        shipmentCancelled = true;

        if (existingShipment?.id) {
          await supabaseAdmin
            .from('shipments')
            .update({
              status: 'cancelled',
              cancel_reason: cancelReason || 'Order cancelled by admin',
              updated_at: nowIso,
            })
            .eq('id', existingShipment.id);

          try {
            await supabaseAdmin.from('shipment_events').insert({
              shipment_id: existingShipment.id,
              status: 'cancelled',
              status_code: 'CANCELLED_BY_ADMIN',
              activity: `Shipment cancelled by admin: ${cancelReason || 'Order cancelled'}`,
              location: 'Admin Panel',
              raw_data: { adminUser: adminUser || 'admin', cancelReason },
            });
          } catch (_) {}
        }
      } catch (cancelErr) {
        console.warn('Admin cancel: Shiprocket shipment cancel warning:', cancelErr.message);
      }
    }

    // 4. Update the order record in database
    let { data: updatedOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', orderDbId)
      .select('*, order_items(*)')
      .single();

    if (orderError) {
      console.warn('Admin order update with full payload failed, trying fallback:', orderError.message);
      const fallbackUpdates = { status: updates.status, updated_at: nowIso };
      if (updates.payment_status) fallbackUpdates.payment_status = updates.payment_status;
      if (updates.notes) fallbackUpdates.notes = updates.notes;
      const res = await supabaseAdmin
        .from('orders')
        .update(fallbackUpdates)
        .eq('id', orderDbId)
        .select('*, order_items(*)')
        .single();
      if (res.error) throw res.error;
      updatedOrder = res.data;
    }

    // 5. Update payment status if explicitly passed
    if (paymentStatus && mappedStatus !== 'cancelled') {
      await supabaseAdmin
        .from('payments')
        .update({ status: paymentStatus.toLowerCase(), updated_at: nowIso })
        .eq('order_id', orderDbId);
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: paymentStatus.toLowerCase(), updated_at: nowIso })
        .eq('id', orderDbId);
    }

    // 6. Record status transition audit log in order_status_history
    if (mappedStatus && mappedStatus !== previousStatus) {
      await supabaseAdmin.from('order_status_history').insert({
        order_id: orderDbId,
        from_status: previousStatus,
        to_status: mappedStatus,
        source: 'admin',
        changed_by: adminUser || 'admin',
        reason: cancelReason || `Status updated from ${previousStatus} to ${mappedStatus} via admin panel`,
        metadata: {
          courierName,
          trackingNumber,
          paymentStatus,
          refundId: updates.refund_id || null,
          shipmentCancelled,
        },
      });
    }

    // 7. Manual tracking number update
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

    // 7b. Keep shipments table in sync with order status across all transitions
    const ORDER_TO_SHIPMENT_STATUS = {
      pending: 'pending',
      confirmed: 'pending',
      processing: 'pending',
      packed: 'packed',
      pickup_scheduled: 'pickup_scheduled',
      picked_up: 'picked_up',
      shipped: 'shipped',
      in_transit: 'in_transit',
      out_for_delivery: 'out_for_delivery',
      delivered: 'delivered',
      cancelled: 'cancelled',
      failed_delivery: 'failed_delivery',
      rto_initiated: 'rto_initiated',
      rto_delivered: 'rto_delivered',
    };

    if (mappedStatus && ORDER_TO_SHIPMENT_STATUS[mappedStatus]) {
      const targetShipmentStatus = ORDER_TO_SHIPMENT_STATUS[mappedStatus];
      const shipmentUpdates = {
        status: targetShipmentStatus,
        updated_at: nowIso,
      };
      if (targetShipmentStatus === 'delivered') {
        shipmentUpdates.delivered_at = nowIso;
      }
      if (targetShipmentStatus === 'cancelled') {
        shipmentUpdates.cancel_reason = cancelReason || 'Order cancelled by admin';
      }

      await supabaseAdmin
        .from('shipments')
        .update(shipmentUpdates)
        .eq('order_id', orderDbId);

      const { data: currentShipment } = await supabaseAdmin
        .from('shipments')
        .select('id')
        .eq('order_id', orderDbId)
        .maybeSingle();

      if (currentShipment?.id) {
        try {
          await supabaseAdmin.from('shipment_events').insert({
            shipment_id: currentShipment.id,
            status: targetShipmentStatus,
            status_code: targetShipmentStatus.toUpperCase(),
            activity: `Status updated to ${mappedStatus.replace(/_/g, ' ')} via admin panel`,
            location: targetShipmentStatus === 'delivered' ? 'Doorstep Handover' : targetShipmentStatus === 'out_for_delivery' ? 'Local Hub' : 'Logistics Desk',
          });
        } catch (_) {}
      }
    }

    // 8. Auto-Shiprocket actions on status change
    // Packed → create shipment + AWB
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
          // IMPORTANT: Only create order in Shiprocket, DO NOT assign AWB or deduct freight wallet!
          const shiprocketResult = await createShiprocketOrder({
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
            awb_number: '',
            courier_name: 'Awaiting AWB Assignment',
            courier_id: null,
            routing_code: '',
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
              status: 'packed',
              status_code: 'PACKED',
              activity: `Order packed & registered in Shiprocket (Order ID: ${shiprocketResult.order_id || 'Pending'}). Courier AWB assignment pending.`,
              location: 'Packing Station',
            });
          }
        }
      } catch (packErr) {
        console.warn('Auto Shiprocket on Packed notice:', packErr.message);
      }
    }

    // Shipped → auto-request pickup
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

    // 9. Send notification email on status change
    if (mappedStatus && NOTIFY_STATUS_MAP[mappedStatus]) {
      const addr = targetOrder.shipping_address || {};
      const customerEmail = targetOrder.customer_email || addr.email;
      const orderNumber = targetOrder.order_number || id;

      if (customerEmail) {
        if (mappedStatus === 'cancelled') {
          try {
            await sendOrderCancellation({
              to: customerEmail,
              orderNumber,
              orderId: orderDbId,
              cancelDate: nowIso,
              reason: cancelReason || 'Order cancelled by store administrator',
              items: targetOrder.order_items || [],
              total: targetOrder.total,
              paymentMethod: targetOrder.payment_method,
              refundAmount: updates.refund_amount || 0,
              refundId: updates.refund_id || null,
              shippingAddress: addr,
            });
          } catch (emailErr) {
            console.warn('Admin cancel email failed:', emailErr.message);
          }
        } else {
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
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error('Update order error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
