export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { createRefund } from '../../../../../lib/razorpay';
import { sendOrderCancellation } from '../../../../../lib/resend';
import { cancelShipment } from '../../../../../lib/shiprocket';

// Statuses that allow customer cancellation — strictly before order is packed
const CANCELLABLE_STATUSES = ['pending_payment', 'pending', 'confirmed', 'processing'];

export async function POST(request, { params }) {
  try {
    // 1. Authenticate user
    let user = null;
    try {
      const supabase = await createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      user = u;
    } catch (_) {}

    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // 2. Fetch the order with items, payments, and shipments
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (*),
        payments (*),
        shipments (*)
      `);

    if (isUuid) {
      query = query.eq('id', orderId);
    } else {
      query = query.eq('order_number', orderId);
    }

    const { data: order, error: fetchError } = await query.maybeSingle();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return await processCancellation(order, user, request);
  } catch (err) {
    console.error('Order cancellation error:', err);
    return NextResponse.json({ error: err.message || 'Failed to cancel order' }, { status: 500 });
  }
}

async function processCancellation(order, user, request) {
  // 3. Authorization check — only the order owner (or guest by order token) can cancel
  if (order.user_id && user && order.user_id !== user.id) {
    return NextResponse.json(
      { error: 'Unauthorized — you can only cancel your own orders' },
      { status: 403 }
    );
  }

  // 4. Check if order is in a cancellable state (Strictly before Packed)
  const currentStatus = (order.status || '').toLowerCase();
  if (!CANCELLABLE_STATUSES.includes(currentStatus)) {
    const statusLabel = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1).replace(/_/g, ' ');
    return NextResponse.json(
      {
        error: `Order cannot be cancelled. Current status is "${statusLabel}". Orders can only be cancelled while in Confirmed or Processing stage, before being packed for shipping.`,
        currentStatus,
      },
      { status: 400 }
    );
  }

  // 5. Parse cancellation reason
  let reason = 'Customer requested cancellation';
  try {
    const body = await request.json();
    if (body?.reason) reason = body.reason.trim();
  } catch (_) {}

  const nowIso = new Date().toISOString();

  // 6. If shipment was already registered in Shiprocket, trigger Shiprocket cancellation
  let shipmentCancelled = false;
  const shipmentsList = Array.isArray(order.shipments)
    ? order.shipments
    : order.shipments
    ? [order.shipments]
    : [];

  for (const sh of shipmentsList) {
    if (sh?.id) {
      try {
        const awb = sh.awb_number;
        if (awb && !awb.startsWith('SR-') && awb.length > 5) {
          await cancelShipment([awb]).catch(() => {});
          shipmentCancelled = true;
        }

        await supabaseAdmin
          .from('shipments')
          .update({
            status: 'cancelled',
            cancel_reason: reason,
            updated_at: nowIso,
          })
          .eq('id', sh.id);

        await supabaseAdmin.from('shipment_events').insert({
          shipment_id: sh.id,
          status: 'cancelled',
          status_code: 'CANCELLED_BY_CUSTOMER',
          activity: `Order cancelled by customer. Reason: ${reason}`,
          location: 'Customer Service',
          raw_data: { cancelledBy: user?.id || 'customer', reason },
        }).catch(() => {});
      } catch (shipErr) {
        console.warn('Shiprocket cancellation notice:', shipErr.message);
      }
    }
  }

  // 7. Update order status in database (Single Source of Truth)
  const isCod = order.payment_method === 'cod';
  const orderUpdatePayload = {
    status: 'cancelled',
    cancelled_at: nowIso,
    cancellation_reason: reason,
    updated_at: nowIso,
  };

  // If COD, mark payment_status as cancelled
  if (isCod) {
    orderUpdatePayload.payment_status = 'cancelled';
  }

  let { error: updateError } = await supabaseAdmin
    .from('orders')
    .update(orderUpdatePayload)
    .eq('id', order.id);

  if (updateError) {
    console.error('Failed to update order status with full payload, trying fallback:', updateError);
    const fallbackPayload = {
      status: 'cancelled',
      updated_at: nowIso,
      notes: reason,
    };
    if (isCod) fallbackPayload.payment_status = 'cancelled';

    const { error: fallbackErr } = await supabaseAdmin
      .from('orders')
      .update(fallbackPayload)
      .eq('id', order.id);

    if (fallbackErr) {
      console.error('Critical order update failure:', fallbackErr);
      return NextResponse.json({ error: 'Failed to cancel order in database' }, { status: 500 });
    }
  }

  // 8. Process refund if online payment was captured (Prepaid only, skip COD)
  let refundResult = null;
  const payment = (order.payments || []).find(
    (p) => (p.status === 'captured' || p.status === 'paid') && p.razorpay_payment_id
  );

  if (!isCod && payment?.razorpay_payment_id) {
    try {
      const refundAmount = Number(order.total) || Number(payment.amount);
      refundResult = await createRefund(payment.razorpay_payment_id, refundAmount, {
        order_id: order.order_number,
        reason,
      });

      // Update payment record safely
      try {
        await supabaseAdmin
          .from('payments')
          .update({
            status: 'refunded',
            refund_id: refundResult?.id || null,
            refunded_at: nowIso,
          })
          .eq('id', payment.id);
      } catch (payErr) {
        console.warn('Payment record update notice:', payErr.message);
      }

      // Update order payment_status & refund fields safely
      try {
        await supabaseAdmin
          .from('orders')
          .update({
            payment_status: 'refunded',
            refund_amount: refundAmount,
            refund_id: refundResult?.id || '',
          })
          .eq('id', order.id);
      } catch (orderRefErr) {
        console.warn('Order refund update notice:', orderRefErr.message);
      }
    } catch (refundErr) {
      console.error('Razorpay refund notice:', refundErr.message || refundErr);
      try {
        await supabaseAdmin
          .from('payments')
          .update({ status: 'refund_failed', error_description: refundErr.message || 'Refund error' })
          .eq('id', payment.id);
      } catch (_) {}
    }
  }

  // 9. Restore product inventory
  for (const item of order.order_items || []) {
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
        console.warn('Stock restore notice for product', item.product_id, stockErr.message);
      }
    }
  }

  // 10. Audit Log in order_status_history
  try {
    await supabaseAdmin.from('order_status_history').insert({
      order_id: order.id,
      from_status: currentStatus,
      to_status: 'cancelled',
      source: 'customer',
      changed_by: user?.id || order.user_id || 'customer',
      reason,
      metadata: {
        refundInitiated: !!refundResult,
        refundId: refundResult?.id || null,
        refundAmount: refundResult ? Number(order.total) : 0,
        paymentMethod: order.payment_method,
        shipmentCancelled,
      },
    });
  } catch (auditErr) {
    console.warn('Audit log insert notice:', auditErr.message);
  }

  // 11. Send customer email notification via Resend
  try {
    let recipientEmail = user?.email;
    if (!recipientEmail && order.user_id) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
      recipientEmail = u?.user?.email;
    }
    if (!recipientEmail) {
      recipientEmail = order.shipping_address?.email || order.customer_email;
    }

    if (recipientEmail) {
      await sendOrderCancellation({
        to: recipientEmail,
        orderNumber: order.order_number,
        orderId: order.id,
        cancelDate: nowIso,
        reason,
        items: order.order_items || [],
        total: order.total,
        paymentMethod: order.payment_method,
        refundAmount: refundResult ? Number(order.total) : 0,
        refundId: refundResult?.id || null,
        shippingAddress: order.shipping_address || {},
      });
    }
  } catch (emailErr) {
    console.warn('Cancellation email send failed (non-critical):', emailErr);
  }

  // 12. Return clean production response
  return NextResponse.json({
    success: true,
    message: 'Order cancelled successfully',
    orderId: order.id,
    orderNumber: order.order_number,
    status: 'cancelled',
    refundInitiated: !!refundResult,
    refundId: refundResult?.id || null,
    shipmentCancelled,
  });
}
