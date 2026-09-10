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

    // Idempotency: If already confirmed, return existing details
    if (['confirmed', 'processing', 'packed', 'shipped', 'delivered'].includes((order.status || '').toLowerCase())) {
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

    // 1. Update order status to confirmed + mark payment as paid
    let updatePayload = {
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    };

    // Try to also set payment_status (gracefully handle if column doesn't exist)
    try {
      const { data: testUpdate, error: testErr } = await supabaseAdmin
        .from('orders')
        .update({ ...updatePayload, payment_status: 'paid' })
        .eq('id', order.id)
        .select('*, order_items(*)')
        .single();

      if (!testErr) {
        order = testUpdate;
      } else if (testErr.code === '42703') {
        // payment_status column doesn't exist, update without it
        const { data: fallbackUpdate, error: fallbackErr } = await supabaseAdmin
          .from('orders')
          .update(updatePayload)
          .eq('id', order.id)
          .select('*, order_items(*)')
          .single();
        if (fallbackErr) {
          console.error('Error confirming order:', fallbackErr);
          return { success: false, error: fallbackErr.message };
        }
        order = fallbackUpdate;
      } else {
        console.error('Error confirming order:', testErr);
        return { success: false, error: testErr.message };
      }
    } catch (updateErr) {
      // Fallback: update without payment_status
      const { data: updatedOrder, error: updateOrderErr } = await supabaseAdmin
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id)
        .select('*, order_items(*)')
        .single();
      if (updateOrderErr) {
        console.error('Error confirming order:', updateOrderErr);
        return { success: false, error: updateOrderErr.message };
      }
      order = updatedOrder;
    }

    // 2. Update payment record to captured
    if (razorpayOrderId) {
      await supabaseAdmin
        .from('payments')
        .update({
          razorpay_payment_id: razorpayPaymentId || undefined,
          razorpay_signature: razorpaySignature || undefined,
          status: 'captured',
          method: paymentMethod || 'razorpay',
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', razorpayOrderId);
    }

    // 3. Decrement stock for purchased items
    if (Array.isArray(order.order_items)) {
      for (const item of order.order_items) {
        if (!item.product_id) continue;
        try {
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
        } catch (stockErr) {
          console.warn('Stock decrement notice:', stockErr.message);
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

    // 6. Create Shiprocket order and generate live AWB
    let awbNumber = '';
    let courierName = '';
    try {
      const shiprocketResult = await createOrderAndAssignAWB({
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

      if (shiprocketResult) {
        awbNumber = shiprocketResult.awb_code || '';
        courierName = shiprocketResult.courier_name || '';

        await supabaseAdmin.from('shipments').insert({
          order_id: order.id,
          shiprocket_order_id: String(shiprocketResult.order_id || ''),
          shiprocket_shipment_id: String(shiprocketResult.shipment_id || ''),
          awb_number: awbNumber,
          courier_name: courierName,
          courier_id: shiprocketResult.courier_company_id || null,
          status: 'confirmed',
        });
      }
    } catch (shipError) {
      console.warn('Shiprocket order/AWB notice:', shipError.message);
    }

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
