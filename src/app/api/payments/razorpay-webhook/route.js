import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { verifyWebhookSignature } from '../../../../lib/razorpay';

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
        const payment = event.payload.payment.entity;
        const razorpayOrderId = payment.order_id;

        // Update payment status
        await supabaseAdmin
          .from('payments')
          .update({
            razorpay_payment_id: payment.id,
            status: 'captured',
            method: payment.method || '',
          })
          .eq('razorpay_order_id', razorpayOrderId);

        // Find and update order
        const { data: paymentRecord } = await supabaseAdmin
          .from('payments')
          .select('order_id')
          .eq('razorpay_order_id', razorpayOrderId)
          .single();

        if (paymentRecord) {
          await supabaseAdmin
            .from('orders')
            .update({ status: 'confirmed' })
            .eq('id', paymentRecord.order_id)
            .eq('status', 'pending_payment');
        }
        break;
      }

      case 'payment.failed': {
        const payment = event.payload.payment.entity;
        const razorpayOrderId = payment.order_id;

        await supabaseAdmin
          .from('payments')
          .update({
            status: 'failed',
            error_code: payment.error_code || '',
            error_description: payment.error_description || '',
          })
          .eq('razorpay_order_id', razorpayOrderId);

        const { data: paymentRecord } = await supabaseAdmin
          .from('payments')
          .select('order_id')
          .eq('razorpay_order_id', razorpayOrderId)
          .single();

        if (paymentRecord) {
          await supabaseAdmin
            .from('orders')
            .update({ status: 'payment_failed' })
            .eq('id', paymentRecord.order_id);
        }
        break;
      }

      case 'refund.processed': {
        const refund = event.payload.refund.entity;
        const paymentId = refund.payment_id;

        await supabaseAdmin
          .from('payments')
          .update({ status: 'refunded' })
          .eq('razorpay_payment_id', paymentId);

        const { data: paymentRecord } = await supabaseAdmin
          .from('payments')
          .select('order_id')
          .eq('razorpay_payment_id', paymentId)
          .single();

        if (paymentRecord) {
          await supabaseAdmin
            .from('orders')
            .update({ status: 'refunded' })
            .eq('id', paymentRecord.order_id);
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
