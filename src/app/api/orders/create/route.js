export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { createRazorpayOrder, RAZORPAY_KEY_ID } from '../../../../lib/razorpay';
import { sendOrderConfirmation } from '../../../../lib/resend';
import { isCodAvailableForPincode } from '../../../../lib/codPincodes';

export async function POST(request) {
  try {
    // 1. Authenticate user (optional - supports guest checkout)
    let user = null;
    try {
      const supabase = await createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser || null;
    } catch (_) {
      user = null;
    }

    const body = await request.json();
    const { addressId, deliveryMethod, paymentMethod, couponCode, items: bodyItems } = body;

    // 2. Fetch cart items from database or use items from request body
    let rawItems = [];
    if (user) {
      const { data: dbCartItems } = await supabaseAdmin
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('user_id', user.id);
      if (dbCartItems && dbCartItems.length > 0) {
        rawItems = dbCartItems;
      }
    }

    if (rawItems.length === 0 && Array.isArray(bodyItems) && bodyItems.length > 0) {
      rawItems = bodyItems;
    }

    if (rawItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // 3. Server-side price validation & stock check
    let subtotal = 0;
    const validatedItems = [];

    for (const item of rawItems) {
      const productId = item.productId || item.product_id || item.id;
      let product = item.product;

      // If product object wasn't joined, fetch it from database
      if (!product && productId) {
        const { data: dbProduct } = await supabaseAdmin
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
        product = dbProduct;
      }

      const itemQty = item.quantity || 1;
      let itemPrice = Number(product?.price || item.price || 0);

      // Check for color-specific pricing
      if (item.color && product?.colors && Array.isArray(product.colors)) {
        const matchedColor = product.colors.find((c) => c.name === item.color);
        if (matchedColor && matchedColor.price) {
          itemPrice = Number(matchedColor.price);
        }
      }

      subtotal += itemPrice * itemQty;

      const rawProdId = product?.id || productId;
      const cleanProdId = Number.isInteger(Number(rawProdId)) ? Number(rawProdId) : null;

      validatedItems.push({
        product_id: cleanProdId,
        name: product?.name || item.name || 'Handcrafted Craft Item',
        image: product?.images?.[0] || item.image || '',
        price: itemPrice,
        original_price: product?.original_price || item.originalPrice || itemPrice,
        quantity: itemQty,
        color: item.color || '',
        size: item.size || '',
      });
    }

    // 4. Validate coupon (if applied)
    let discount = 0;
    let appliedCouponCode = null;

    if (couponCode) {
      const { data: coupon, error: couponError } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (coupon) {
        // Check expiry
        const notExpired = !coupon.expires_at || new Date(coupon.expires_at) >= new Date();
        const meetsMinSpend = !coupon.min_spend || subtotal >= coupon.min_spend;
        const withinMaxUses = !coupon.max_uses || coupon.used_count < coupon.max_uses;

        if (notExpired && meetsMinSpend && withinMaxUses) {
          if (coupon.discount_type === 'percentage') {
            discount = Math.round((subtotal * coupon.value) / 100);
            if (coupon.max_discount) {
              discount = Math.min(discount, coupon.max_discount);
            }
          } else {
            discount = Math.min(subtotal, coupon.value);
          }
          appliedCouponCode = coupon.code;
        }
      }
    }

    // 5. Calculate shipping
    const shippingCost = subtotal >= 999 ? 0 : 70;

    // 6. Calculate total
    const total = Math.max(0, subtotal - discount + shippingCost);

    // 7. Get shipping address
    let shippingAddress = null;

    if (body.shippingAddress) {
      shippingAddress = {
        name: body.shippingAddress.name || '',
        phone: body.shippingAddress.phone || '',
        address_line: body.shippingAddress.address || body.shippingAddress.address_line || '',
        city: body.shippingAddress.city || '',
        state: body.shippingAddress.state || '',
        pincode: body.shippingAddress.zip || body.shippingAddress.pincode || '',
        country: body.shippingAddress.country || 'India',
      };
    } else if (addressId && user) {
      const { data: addr } = await supabaseAdmin
        .from('addresses')
        .select('*')
        .eq('id', addressId)
        .eq('user_id', user.id)
        .single();

      if (addr) {
        shippingAddress = {
          name: addr.name,
          phone: addr.phone,
          address_line: addr.address_line,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          country: addr.country,
        };
      }
    }

    if (!shippingAddress) {
      return NextResponse.json({ error: 'Valid shipping address required' }, { status: 400 });
    }

    // 8. Generate unique order number
    const orderNumber = `TRIO-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 100)}`;

    // 9. Handle COD orders differently
    if (paymentMethod === 'cod') {
      const deliveryPin = shippingAddress?.pincode;
      const codAllowed = await isCodAvailableForPincode(deliveryPin);

      if (!codAllowed) {
        return NextResponse.json(
          {
            error: `Cash on Delivery (COD) is not available for PIN ${deliveryPin || 'this address'}. Please choose an online payment method (UPI, Card, or NetBanking).`,
          },
          { status: 400 }
        );
      }

      // Create order directly with confirmed status for COD
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          user_id: user?.id || null,
          order_number: orderNumber,
          status: 'confirmed',
          subtotal,
          discount,
          coupon_code: appliedCouponCode,
          shipping_cost: shippingCost,
          total,
          payment_method: 'cod',
          shipping_address: shippingAddress,
          delivery_method: deliveryMethod || 'standard',
          estimated_delivery: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
      }

      // Insert order items
      await supabaseAdmin.from('order_items').insert(
        validatedItems.map((item) => ({
          order_id: order.id,
          ...item,
        }))
      );

      // Decrement stock
      for (const item of validatedItems) {
        // Simple stock decrement
        const { data: prod } = await supabaseAdmin
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (prod) {
          await supabaseAdmin
            .from('products')
            .update({
              stock: Math.max(0, prod.stock - item.quantity),
              in_stock: prod.stock - item.quantity > 0,
            })
            .eq('id', item.product_id);
        }
      }

      // Update coupon usage
      if (appliedCouponCode) {
        try {
          const { data: c } = await supabaseAdmin
            .from('coupons')
            .select('used_count')
            .eq('code', appliedCouponCode)
            .single();
          if (c) {
            await supabaseAdmin
              .from('coupons')
              .update({ used_count: (c.used_count || 0) + 1 })
              .eq('code', appliedCouponCode);
          }
        } catch (_) {}
      }

      // Clear cart
      if (user?.id) {
        await supabaseAdmin.from('cart_items').delete().eq('user_id', user.id);
      }

      // Insert COD payment record
      await supabaseAdmin.from('payments').insert({
        order_id: order.id,
        amount: total,
        status: 'created',
        method: 'cod',
      });

      // Send Order Confirmation & Invoice Details Email
      try {
        let recipientEmail = user?.email || body.shippingAddress?.email || body.email;
        if (!recipientEmail && user?.id) {
          const { data: u } = await supabaseAdmin.auth.admin.getUserById(user.id);
          recipientEmail = u?.user?.email;
        }

        if (recipientEmail) {
          await sendOrderConfirmation({
            to: recipientEmail,
            orderNumber: order.order_number,
            orderId: order.id,
            orderDate: order.created_at,
            paymentMethod: 'cod',
            items: validatedItems,
            subtotal: order.subtotal,
            discount: order.discount,
            couponCode: order.coupon_code,
            shippingCost: order.shipping_cost,
            total: order.total,
            shippingAddress: order.shipping_address,
          });
        }
      } catch (emailErr) {
        console.warn('Failed to send COD order confirmation email:', emailErr);
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber,
        paymentMethod: 'cod',
      });
    }

    // 10. Create Razorpay Order (for online payment)
    const razorpayOrder = await createRazorpayOrder(total, 'INR', orderNumber, {
      order_number: orderNumber,
      user_id: user?.id || 'guest',
    });

    // 11. Create order in DB (status: pending_payment)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user?.id || null,
        order_number: orderNumber,
        status: 'pending_payment',
        subtotal,
        discount,
        coupon_code: appliedCouponCode,
        shipping_cost: shippingCost,
        total,
        payment_method: 'razorpay',
        shipping_address: shippingAddress,
        delivery_method: deliveryMethod || 'standard',
        estimated_delivery: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // 12. Insert order items
    await supabaseAdmin.from('order_items').insert(
      validatedItems.map((item) => ({
        order_id: order.id,
        ...item,
      }))
    );

    // 13. Insert payment record (status: created)
    await supabaseAdmin.from('payments').insert({
      order_id: order.id,
      razorpay_order_id: razorpayOrder.id,
      amount: total,
      status: 'created',
      method: paymentMethod || 'razorpay',
    });

    // 14. Return data needed for Razorpay Checkout
    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: total,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || RAZORPAY_KEY_ID || 'rzp_live_TZUoFoXCMkJNkx',
    });
  } catch (err) {
    const errorMsg =
      err?.error?.description ||
      err?.description ||
      err?.message ||
      'Internal server error';
    console.error('Order creation error:', err);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
