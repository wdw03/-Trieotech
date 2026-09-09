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

    // 2. Verify HMAC SHA256 signature (CRITICAL)
    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      // If order already existed in DB, mark payment_failed
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

    // 3. Payment is valid! Check if order exists or create now
    let order = null;

    if (orderId) {
      const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .maybeSingle();
      order = existingOrder;
    }

    if (!order && razorpay_order_id) {
      const { data: paymentRecord } = await supabaseAdmin
        .from('payments')
        .select('order_id')
        .eq('razorpay_order_id', razorpay_order_id)
        .maybeSingle();

      if (paymentRecord?.order_id) {
        const { data: existingOrder } = await supabaseAdmin
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', paymentRecord.order_id)
          .maybeSingle();
        order = existingOrder;
      }
    }

    if (!order && orderData) {
      // Create confirmed order in DB only now after payment is verified
      const targetUserId = orderData.userId || user?.id || null;

      const { data: newOrder, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          user_id: targetUserId,
          order_number: orderData.orderNumber,
          status: 'confirmed',
          subtotal: orderData.subtotal,
          discount: orderData.discount || 0,
          coupon_code: orderData.couponCode || null,
          shipping_cost: orderData.shippingCost || 0,
          total: orderData.total,
          payment_method: 'razorpay',
          shipping_address: orderData.shippingAddress,
          delivery_method: orderData.deliveryMethod || 'standard',
          estimated_delivery: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        })
        .select()
        .single();

      if (orderError || !newOrder) {
        console.error('Order creation error upon payment verification:', orderError);
        return NextResponse.json({ error: 'Failed to record order' }, { status: 500 });
      }

      order = newOrder;

      // Insert order items
      const itemsToInsert = (orderData.items || []).map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        original_price: item.original_price || item.price,
        quantity: item.quantity,
        size: item.size || '',
        color: item.color || '',
        image: item.image || '',
      }));

      if (itemsToInsert.length > 0) {
        await supabaseAdmin.from('order_items').insert(itemsToInsert);
      }
      order.order_items = itemsToInsert;

      // Insert payment record as captured
      await supabaseAdmin.from('payments').insert({
        order_id: order.id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: order.total,
        currency: 'INR',
        status: 'captured',
        method: 'razorpay',
      });
    } else if (order) {
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
        .eq('id', order.id);

      if (!order.order_items || order.order_items.length === 0) {
        const { data: items } = await supabaseAdmin
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);
        order.order_items = items || [];
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order details missing to finalize order' }, { status: 400 });
    }

    // 4. Decrement stock for each item
    if (Array.isArray(order.order_items)) {
      for (const item of order.order_items) {
        if (!item.product_id) continue;
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
    }

    // 5. Update coupon usage count
    if (order.coupon_code) {
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('used_count')
        .eq('code', order.coupon_code)
        .single();

      if (coupon) {
        await supabaseAdmin
          .from('coupons')
          .update({ used_count: (coupon.used_count || 0) + 1 })
          .eq('code', order.coupon_code);
      }
    }

    // 6. Clear user's cart
    const targetUserId = user?.id || order.user_id;
    if (targetUserId) {
      await supabaseAdmin.from('cart_items').delete().eq('user_id', targetUserId);
    }

    // 7. Create Shiprocket order (async, don't block response)
    try {
      const shiprocketResult = await createShiprocketOrder({
        orderNumber: order.order_number,
        orderDate: new Date(order.created_at || Date.now()).toISOString().split('T')[0],
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
          .eq('id', order.id);
      }
    } catch (shipError) {
      console.error('Shiprocket order creation failed:', shipError);
    }

    // 8. Send confirmation email & invoice (async, don't block response)
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
          orderDate: order.created_at || new Date().toISOString(),
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
    }

    // 9. Return success
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
