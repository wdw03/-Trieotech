export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { verifyWebhookSignature } from '../../../../lib/razorpay';
import { finalizePaidOrder } from '../../../../lib/orderFinalizer';

// POST: Razorpay webhook handler
export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // Verify webhook signature
    if (signature) {
      const isValid = verifyWebhookSignature(body, signature);
      if (!isValid) {
        console.error('Razorpay webhook signature invalid');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    switch (eventType) {
      case 'payment.captured': {
        const payment = event.payload?.payment?.entity;
        const razorpayOrderId = payment?.order_id;
        const razorpayPaymentId = payment?.id;

        if (razorpayOrderId) {
          // Finalize order idempotently (confirmed, live AWB, stock decrement, email)
          await finalizePaidOrder({
            razorpayOrderId,
            razorpayPaymentId,
            paymentMethod: payment?.method || 'razorpay',
          });
        }
        break;
      }

      case 'order.paid': {
        const orderEntity = event.payload?.order?.entity;
        const paymentEntity = event.payload?.payment?.entity;
        const razorpayOrderId = orderEntity?.id;
        const razorpayPaymentId = paymentEntity?.id || '';

        if (razorpayOrderId) {
          await finalizePaidOrder({
            razorpayOrderId,
            razorpayPaymentId,
            paymentMethod: paymentEntity?.method || 'razorpay',
          });
        }
        break;
      }

      case 'payment.failed': {
        const payment = event.payload?.payment?.entity;
        const razorpayOrderId = payment?.order_id;

        if (razorpayOrderId) {
          await supabaseAdmin
            .from('payments')
            .update({
              status: 'failed',
              error_code: payment?.error_code || '',
              error_description: payment?.error_description || '',
            })
            .eq('razorpay_order_id', razorpayOrderId);

          const { data: paymentRecord } = await supabaseAdmin
            .from('payments')
            .select('order_id')
            .eq('razorpay_order_id', razorpayOrderId)
            .maybeSingle();

          if (paymentRecord?.order_id) {
            await supabaseAdmin
              .from('orders')
              .update({ status: 'payment_failed' })
              .eq('id', paymentRecord.order_id)
              .eq('status', 'pending_payment');
          }
        }
        break;
      }

      case 'refund.processed': {
        const refund = event.payload?.refund?.entity;
        const paymentId = refund?.payment_id;

        if (paymentId) {
          await supabaseAdmin
            .from('payments')
            .update({ status: 'refunded' })
            .eq('razorpay_payment_id', paymentId);

          const { data: paymentRecord } = await supabaseAdmin
            .from('payments')
            .select('order_id')
            .eq('razorpay_payment_id', paymentId)
            .maybeSingle();

          if (paymentRecord?.order_id) {
            await supabaseAdmin
              .from('orders')
              .update({ status: 'refunded' })
              .eq('id', paymentRecord.order_id);
          }
        }
        break;
      }

      default:
        console.log('Unhandled Razorpay webhook event:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
