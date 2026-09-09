export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { verifyPaymentSignature } from '../../../../lib/razorpay';
import { createShiprocketOrder } from '../../../../lib/shiprocket';
import { sendOrderConfirmation } from '../../../../lib/resend';

export async function POST(request) {
  try {
    // 1. Authenticate user (optional - guest orders supported)
    let user = null;
    try {
      const supabase = await createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser || null;
    } catch (_) {}

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // 2. Verify HMAC SHA256 signature (CRITICAL)
    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      // Update order as payment_failed
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

    // 3. Payment is valid! Update records

    // Update payment record
    await supabaseAdmin
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'captured',
      })
      .eq('razorpay_order_id', razorpay_order_id);

    // Update order status
    await supabaseAdmin
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', orderId);

    // 4. Fetch full order details
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 5. Decrement stock for each item
    for (const item of order.order_items) {
      const { data: prod } = await supabaseAdmin
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();

      if (prod) {
        const newStock = Math.max(0, prod.stock - item.quantity);
        await supabaseAdmin
          .from('products')
          .update({
            stock: newStock,
            in_stock: newStock > 0,
          })
          .eq('id', item.product_id);
      }
    }

    // 6. Update coupon usage count
    if (order.coupon_code) {
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('used_count')
        .eq('code', order.coupon_code)
        .single();

      if (coupon) {
        await supabaseAdmin
          .from('coupons')
          .update({ used_count: coupon.used_count + 1 })
          .eq('code', order.coupon_code);
      }
    }

    // 7. Clear user's cart (if authenticated)
    if (user?.id) {
      await supabaseAdmin.from('cart_items').delete().eq('user_id', user.id);
    }

    // 8. Create Shiprocket order (async, don't block response)
    try {
      const shiprocketResult = await createShiprocketOrder({
        orderNumber: order.order_number,
        orderDate: new Date(order.created_at).toISOString().split('T')[0],
        billingAddress: order.shipping_address,
        shippingAddress: order.shipping_address,
        items: order.order_items,
        paymentMethod: 'prepaid',
        subtotal: order.subtotal,
        discount: order.discount,
        shippingCharges: order.shipping_cost,
      });

      // Save shipment record
      if (shiprocketResult) {
        await supabaseAdmin.from('shipments').insert({
          order_id: order.id,
          shiprocket_order_id: String(shiprocketResult.order_id || ''),
          shiprocket_shipment_id: String(shiprocketResult.shipment_id || ''),
          awb_number: shiprocketResult.awb_code || '',
          courier_name: shiprocketResult.courier_name || '',
          courier_id: shiprocketResult.courier_company_id || null,
          status: 'pending',
        });

        // Update order status to processing
        await supabaseAdmin
          .from('orders')
          .update({ status: 'processing' })
          .eq('id', orderId);
      }
    } catch (shipError) {
      console.error('Shiprocket order creation failed:', shipError);
      // Don't fail the payment verification — order is confirmed
      // Shiprocket order can be created manually later
    }

    // 9. Send confirmation email & invoice (async, don't block response)
    try {
      let recipientEmail = user?.email || order.shipping_address?.email;
      if (!recipientEmail && order.user_id) {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
        recipientEmail = u?.user?.email;
      }

      if (recipientEmail) {
        await sendOrderConfirmation({
          to: recipientEmail,
          orderNumber: order.order_number,
          orderId: order.id,
          orderDate: order.created_at,
          paymentMethod: 'razorpay',
          items: order.order_items,
          subtotal: order.subtotal,
          discount: order.discount,
          couponCode: order.coupon_code,
          shippingCost: order.shipping_cost,
          total: order.total,
          shippingAddress: order.shipping_address,
        });
      }
    } catch (emailError) {
      console.error('Email send failed:', emailError);
      // Don't fail — email is non-critical
    }

    // 10. Return success
    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
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
