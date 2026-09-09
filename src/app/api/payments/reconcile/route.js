export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { fetchOrderPayments } from '../../../../lib/razorpay';
import { finalizePaidOrder } from '../../../../lib/orderFinalizer';

/**
 * POST /api/payments/reconcile
 * Checks payment status with Razorpay in case the user's browser crashed, tab closed,
 * or phone disconnected after completing payment.
 */
export async function POST(request) {
  try {
    const { orderId, razorpayOrderId } = await request.json();

    if (!orderId && !razorpayOrderId) {
      return NextResponse.json(
        { error: 'orderId or razorpayOrderId required' },
        { status: 400 }
      );
    }

    // 1. Fetch current order from Supabase
    let order = null;
    if (orderId) {
      const { data: ord } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*), payments(*), shipments(*)')
        .eq('id', orderId)
        .maybeSingle();
      order = ord;
    }

    if (!order && razorpayOrderId) {
      const { data: payRec } = await supabaseAdmin
        .from('payments')
        .select('order_id')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle();

      if (payRec?.order_id) {
        const { data: ord } = await supabaseAdmin
          .from('orders')
          .select('*, order_items(*), payments(*), shipments(*)')
          .eq('id', payRec.order_id)
          .maybeSingle();
        order = ord;
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const currentStatus = (order.status || '').toLowerCase();

    // 2. If already confirmed/processed (e.g. by Webhook), return immediately
    if (['confirmed', 'processing', 'packed', 'shipped', 'delivered'].includes(currentStatus)) {
      const shipment = order.shipments?.[0];
      return NextResponse.json({
        success: true,
        status: 'confirmed',
        orderId: order.id,
        orderNumber: order.order_number,
        awbNumber: shipment?.awb_number || undefined,
        courierName: shipment?.courier_name || undefined,
      });
    }

    if (['payment_failed', 'cancelled'].includes(currentStatus)) {
      return NextResponse.json({
        success: false,
        status: currentStatus,
        message: 'Order payment failed or was cancelled',
      });
    }

    // 3. Status is still 'pending_payment'. Check Razorpay API directly for payments
    const rzpOrderId = razorpayOrderId || order.payments?.[0]?.razorpay_order_id;
    if (!rzpOrderId) {
      return NextResponse.json({
        success: false,
        status: 'pending_payment',
        message: 'No Razorpay order ID found to reconcile',
      });
    }

    try {
      const paymentsResponse = await fetchOrderPayments(rzpOrderId);
      const paymentItems = paymentsResponse?.items || [];

      // Find any successful/captured payment
      const successfulPayment = paymentItems.find(
        (p) => p.status === 'captured' || p.status === 'authorized'
      );

      if (successfulPayment) {
        // Payment was captured on Razorpay! Finalize the order immediately.
        const finalizeResult = await finalizePaidOrder({
          orderId: order.id,
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: successfulPayment.id,
          paymentMethod: successfulPayment.method || 'razorpay',
        });

        if (finalizeResult.success) {
          return NextResponse.json({
            success: true,
            status: 'confirmed',
            orderId: finalizeResult.order?.id || order.id,
            orderNumber: finalizeResult.order?.order_number || order.order_number,
            awbNumber: finalizeResult.awbNumber || undefined,
            courierName: finalizeResult.courierName || undefined,
          });
        }
      }

      // Check if all attempts failed
      const hasFailedAttempts = paymentItems.length > 0 && paymentItems.every((p) => p.status === 'failed');
      if (hasFailedAttempts) {
        return NextResponse.json({
          success: false,
          status: 'payment_failed',
          message: 'Payment attempt failed on gateway',
        });
      }

      // Still pending / no payment yet
      return NextResponse.json({
        success: false,
        status: 'pending_payment',
        message: 'Payment not completed yet',
      });
    } catch (rzpErr) {
      console.warn('Error querying Razorpay API for reconciliation:', rzpErr.message);
      return NextResponse.json({
        success: false,
        status: 'pending_payment',
        message: 'Could not contact payment gateway for status',
      });
    }
  } catch (err) {
    console.error('Reconciliation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
