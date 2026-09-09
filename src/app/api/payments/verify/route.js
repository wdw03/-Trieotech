export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { verifyPaymentSignature } from '../../../../lib/razorpay';
import { finalizePaidOrder } from '../../../../lib/orderFinalizer';

export async function POST(request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      orderData,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // 1. Verify HMAC SHA256 signature
    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      if (orderId) {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'payment_failed' })
          .eq('id', orderId);

        await supabaseAdmin
          .from('payments')
          .update({
            status: 'failed',
            error_description: 'Signature verification failed',
          })
          .eq('razorpay_order_id', razorpay_order_id);
      }

      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // 2. Signature is valid! Idempotently finalize the order (marks confirmed, generates live AWB, decrements stock, sends email)
    const result = await finalizePaidOrder({
      orderId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentMethod: 'razorpay',
      orderData,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to finalize order' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderId: result.order.id,
      orderNumber: result.order.order_number,
      awbNumber: result.awbNumber || undefined,
      courierName: result.courierName || undefined,
    });
  } catch (err) {
    const errorMsg =
      err?.error?.description ||
      err?.description ||
      err?.message ||
      'Internal server error';
    console.error('Payment verification error:', err);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
