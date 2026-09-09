export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { createRefund } from '../../../../../lib/razorpay';
import { sendOrderCancellation } from '../../../../../lib/resend';

// Statuses that allow cancellation — only before order is confirmed
const CANCELLABLE_STATUSES = ['pending_payment', 'pending'];

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

    // 2. Fetch the order with related data
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (*),
        payments (*)
      `)
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      // Try by order_number
      const { data: orderByNum, error: fetchError2 } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          order_items (*),
          payments (*)
        `)
        .eq('order_number', orderId)
        .single();

      if (fetchError2 || !orderByNum) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Use the order found by order_number
      return await processCancellation(orderByNum, user, request);
    }

    return await processCancellation(order, user, request);
  } catch (err) {
    console.error('Order cancellation error:', err);
    return NextResponse.json({ error: err.message || 'Failed to cancel order' }, { status: 500 });
  }
}

async function processCancellation(order, user, request) {
  // 3. Authorization check — only the order owner can cancel
  if (order.user_id && user && order.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized — you can only cancel your own orders' }, { status: 403 });
  }

  // 4. Check if order is in a cancellable state
  const currentStatus = (order.status || '').toLowerCase();
  if (!CANCELLABLE_STATUSES.includes(currentStatus)) {
    const statusLabel = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1).replace(/_/g, ' ');
    return NextResponse.json(
      {
        error: `This order cannot be cancelled. Current status: "${statusLabel}". Orders can only be cancelled before they are packed or shipped.`,
      },
      { status: 400 }
    );
  }

  // 5. Optionally parse cancellation reason from request body
  let reason = 'Customer requested cancellation';
  try {
    const body = await request.json();
    if (body?.reason) reason = body.reason;
  } catch (_) {}

  // 6. Update order status to cancelled
  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    })
    .eq('id', order.id);

  if (updateError) {
    console.error('Failed to update order status:', updateError);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }

  // 7. Process refund if online payment was captured
  let refundResult = null;
  const payment = (order.payments || []).find(
    (p) => p.status === 'captured' && p.razorpay_payment_id
  );

  if (payment) {
    try {
      // Initiate Razorpay refund
      const refundAmount = Number(order.total) || Number(payment.amount);
      refundResult = await createRefund(payment.razorpay_payment_id, refundAmount, {
        order_id: order.order_number,
        reason,
      });

      // Update payment record
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'refunded',
          refund_id: refundResult?.id || null,
          refunded_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      // Update order payment_status
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'refunded' })
        .eq('id', order.id);
    } catch (refundErr) {
      console.error('Razorpay refund error:', refundErr);
      // Mark as refund_failed but still keep order cancelled
      await supabaseAdmin
        .from('payments')
        .update({ status: 'refund_failed', error_description: refundErr.message })
        .eq('id', payment.id);
    }
  }

  // 8. Restore product stock
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
        console.warn('Stock restore warning for product', item.product_id, stockErr);
      }
    }
  }

  // 9. Send cancellation email
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
        cancelDate: new Date().toISOString(),
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

  // 10. Return success
  return NextResponse.json({
    success: true,
    message: 'Order cancelled successfully',
    orderId: order.id,
    orderNumber: order.order_number,
    refundInitiated: !!refundResult,
    refundId: refundResult?.id || null,
  });
}
