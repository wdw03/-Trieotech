import { supabaseAdmin } from './supabase/admin';
import { createOrderAndAssignAWB } from './shiprocket';
import { sendOrderConfirmation } from './resend';

/**
 * Idempotently finalizes and confirms an order once payment is verified.
 * Safe to call from /api/payments/verify, webhook, or reconciliation.
 */
export async function finalizePaidOrder({
  orderId,
  razorpayOrderId,
  razorpayPaymentId = '',
  razorpaySignature = '',
  paymentMethod = 'razorpay',
  orderData = null,
}) {
  try {
    let order = null;

    if (orderId) {
      const { data: ord } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .maybeSingle();
      order = ord;
    }

    if (!order && razorpayOrderId) {
      const { data: paymentRecord } = await supabaseAdmin
        .from('payments')
        .select('order_id')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle();

      if (paymentRecord?.order_id) {
        const { data: ord } = await supabaseAdmin
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', paymentRecord.order_id)
          .maybeSingle();
        order = ord;
      }
    }

    // Fallback: If order wasn't found in DB, create it from orderData
    if (!order && orderData) {
      const { data: newOrd, error: newOrdErr } = await supabaseAdmin
        .from('orders')
        .insert({
          user_id: orderData.userId || null,
          order_number: orderData.orderNumber,
          status: 'pending_payment',
          subtotal: orderData.subtotal,
          discount: orderData.discount || 0,
          coupon_code: orderData.couponCode || null,
          shipping_cost: orderData.shippingCost || 0,
          total: orderData.total,
          payment_method: paymentMethod || 'razorpay',
          shipping_address: orderData.shippingAddress,
          delivery_method: orderData.deliveryMethod || 'standard',
          estimated_delivery: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        })
        .select('*, order_items(*)')
        .single();

      if (!newOrdErr && newOrd) {
        order = newOrd;
        if (Array.isArray(orderData.items) && orderData.items.length > 0) {
          const itemsToInsert = orderData.items.map((it) => ({
            order_id: order.id,
            product_id: it.product_id || it.productId,
            name: it.name,
            price: it.price,
            original_price: it.original_price || it.originalPrice || it.price,
            quantity: it.quantity || 1,
            size: it.size || '',
            color: it.color || '',
            image: it.image || '',
          }));
          await supabaseAdmin.from('order_items').insert(itemsToInsert);
          order.order_items = itemsToInsert;
        }

        if (razorpayOrderId) {
          await supabaseAdmin.from('payments').insert({
            order_id: order.id,
            razorpay_order_id: razorpayOrderId,
            amount: order.total,
            currency: 'INR',
            status: 'created',
            method: paymentMethod || 'razorpay',
          });
        }
      }
    }

    if (!order) {
      return { success: false, error: 'Order not found for finalization' };
    }

    // Idempotency: If already processing or beyond, return existing details
    if (['processing', 'confirmed', 'packed', 'shipped', 'delivered'].includes((order.status || '').toLowerCase())) {
      const { data: existingShipment } = await supabaseAdmin
        .from('shipments')
        .select('*')
        .eq('order_id', order.id)
        .maybeSingle();

      return {
        success: true,
        alreadyProcessed: true,
        order,
        awbNumber: existingShipment?.awb_number || '',
        courierName: existingShipment?.courier_name || '',
      };
    }

    // 1. Update order status to processing (Payment verified; ready for admin confirmation & dispatch)
    const { data: updatedOrder, error: updateOrderErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'processing',
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .select('*, order_items(*)')
      .single();

    if (updateOrderErr) {
      console.error('Error confirming order:', updateOrderErr);
      return { success: false, error: updateOrderErr.message };
    }
    order = updatedOrder;

    // 2. Update payment record to captured
    if (razorpayOrderId) {
      const { data: updatedPay } = await supabaseAdmin
        .from('payments')
        .update({
          razorpay_payment_id: razorpayPaymentId || undefined,
          razorpay_signature: razorpaySignature || undefined,
          status: 'captured',
          method: paymentMethod || 'razorpay',
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', razorpayOrderId)
        .select();

      if (!updatedPay || updatedPay.length === 0) {
        await supabaseAdmin
          .from('payments')
          .update({
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId || undefined,
            razorpay_signature: razorpaySignature || undefined,
            status: 'captured',
            method: paymentMethod || 'razorpay',
            updated_at: new Date().toISOString(),
          })
          .eq('order_id', order.id);
      }
    } else if (order.id) {
      await supabaseAdmin
        .from('payments')
        .update({
          razorpay_payment_id: razorpayPaymentId || undefined,
          razorpay_signature: razorpaySignature || undefined,
          status: 'captured',
          method: paymentMethod || 'razorpay',
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', order.id);
    }

    // 3. Decrement stock, variant stock, and increment sold_quantity for purchased items
    if (Array.isArray(order.order_items)) {
      for (const item of order.order_items) {
        if (!item.product_id) continue;
        try {
          const { data: prod } = await supabaseAdmin
            .from('products')
            .select('stock, sold_quantity, colors')
            .eq('id', item.product_id)
            .single();

          if (prod) {
            const newStock = Math.max(0, (Number(prod.stock) || 0) - item.quantity);
            const newSold = (Number(prod.sold_quantity) || 0) + item.quantity;
            let updatedColors = prod.colors;

            if (item.color && Array.isArray(prod.colors) && prod.colors.length > 0) {
              updatedColors = prod.colors.map((c) => {
                if (c.name === item.color || c.hex === item.color) {
                  const currentVariantStock = c.stock !== undefined ? Number(c.stock) : (Number(prod.stock) || 0);
                  return {
                    ...c,
                    stock: Math.max(0, currentVariantStock - item.quantity),
                  };
                }
                return c;
              });
            }

            await supabaseAdmin
              .from('products')
              .update({
                stock: newStock,
                in_stock: newStock > 0,
                sold_quantity: newSold,
                colors: updatedColors,
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.product_id);
          }
        } catch (stockErr) {
          console.warn('Paid Order stock decrement notice:', stockErr.message);
        }
      }
    }

    // 4. Update coupon usage count
    if (order.coupon_code) {
      try {
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
      } catch (couponErr) {
        console.warn('Coupon count notice:', couponErr.message);
      }
    }

    // 5. Clear cart for user
    if (order.user_id) {
      try {
        await supabaseAdmin.from('cart_items').delete().eq('user_id', order.user_id);
      } catch (_) {}
    }

    // 6. Shipment will be initiated manually by Admin from Admin Dashboard once verified
    let awbNumber = '';
    let courierName = '';

    // 7. Send confirmation email with invoice details
    try {
      let recipientEmail = order.shipping_address?.email;
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
      console.warn('Confirmation email notice:', emailError.message);
    }

    return {
      success: true,
      order,
      awbNumber,
      courierName,
    };
  } catch (err) {
    console.error('Finalize order error:', err);
    return { success: false, error: err.message };
  }
}
