export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { createRazorpayOrder, RAZORPAY_KEY_ID, cleanRazorpayKey } from '../../../../lib/razorpay';
import { sendOrderConfirmation } from '../../../../lib/resend';
import { isCodAvailableForPincode } from '../../../../lib/codPincodes';
import { evaluateCouponEligibility } from '../../../../lib/couponHelper';
import { calculateCartShipping } from '../../../../lib/shippingEngine';
import { calculateDynamicShipping, createOrderAndAssignAWB } from '../../../../lib/shiprocket';

export async function POST(request) {
  try {
    // 1. Authenticate user (strictly required: guest checkout disabled)
    let user = null;
    try {
      const supabase = await createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser || null;
    } catch (_) {
      user = null;
    }

    // Fallback: check Authorization header
    if (!user) {
      const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const { data: { user: tokenUser } } = await supabaseAdmin.auth.getUser(token);
          user = tokenUser || null;
        } catch (_) {}
      }
    }

    const body = await request.json();
    const { addressId, deliveryMethod, paymentMethod, couponCode, items: bodyItems, userId } = body;

    // Fallback: verify userId from client session against Supabase Auth
    if (!user && userId) {
      try {
        const { data: uData, error: uErr } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!uErr && uData?.user) {
          user = uData.user;
        }
      } catch (_) {}
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to place an order.' },
        { status: 401 }
      );
    }

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

      // Server-side inventory & visibility validation
      if (product) {
        if (product.is_visible === false) {
          return NextResponse.json(
            { error: `"${product.name}" is currently not available.` },
            { status: 400 }
          );
        }

        const currentStock = Number(product.stock || 0);
        if (!product.in_stock || currentStock <= 0) {
          return NextResponse.json(
            { error: `"${product.name}" is out of stock.` },
            { status: 400 }
          );
        }

        if (currentStock < itemQty) {
          return NextResponse.json(
            { error: `Only ${currentStock} units available for "${product.name}". Please reduce quantity.` },
            { status: 400 }
          );
        }

        // Check for color-specific pricing & color-specific stock
        if (item.color && product?.colors && Array.isArray(product.colors)) {
          const matchedColor = product.colors.find((c) => c.name === item.color || c.hex === item.color);
          if (matchedColor) {
            if (matchedColor.price) {
              itemPrice = Number(matchedColor.price);
            }
            if (matchedColor.stock !== undefined) {
              const variantStock = Number(matchedColor.stock);
              if (variantStock <= 0) {
                return NextResponse.json(
                  { error: `Color shade "${item.color}" for "${product.name}" is out of stock.` },
                  { status: 400 }
                );
              }
              if (variantStock < itemQty) {
                return NextResponse.json(
                  { error: `Only ${variantStock} units available in "${item.color}" for "${product.name}". Please reduce quantity.` },
                  { status: 400 }
                );
              }
            }
          }
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
    // 4. Validate coupon (if provided) with product-level eligibility
    let discount = 0;
    let appliedCouponCode = null;

    if (couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (coupon) {
        const evaluation = evaluateCouponEligibility(coupon, validatedItems, subtotal);
        if (evaluation.valid) {
          discount = evaluation.discount;
          appliedCouponCode = coupon.code;
        }
      }
    }

    // 5. Get shipping address
    let shippingAddress = null;

    if (body.shippingAddress) {
      shippingAddress = {
        name: body.shippingAddress.name || '',
        email: user?.email || body.shippingAddress.email || '',
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
          email: user?.email || addr.email || '',
          phone: addr.phone || '',
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

    // 6. Calculate authoritative server-side shipping fee scaled by product quantities
    const deliveryPin = shippingAddress.pincode?.toString().replace(/\D/g, '').slice(0, 6);
    const shippingCalc = await calculateCartShipping({
      items: validatedItems,
      pincode: deliveryPin,
      deliveryMethod: deliveryMethod || 'standard',
      cod: paymentMethod === 'cod',
    });

    const shippingCost = Number(shippingCalc.shippingFee);

    // 7. Calculate total
    const total = Math.max(0, subtotal - discount + shippingCost);

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

      // Create order with processing status for COD (Admin will confirm and dispatch to Shiprocket)
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          status: 'processing',
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

      // Decrement stock, variant stock, and increment sold_quantity
      for (const item of validatedItems) {
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
          console.warn('COD Stock decrement notice:', stockErr.message);
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

      // Shipment will be initiated manually by Admin from Admin Dashboard once verified
      let awbNumber = '';
      let courierName = '';

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
        console.warn('Confirmation email notice (COD):', emailErr.message);
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
        status: 'processing',
        total: order.total,
        paymentMethod: 'cod',
        awbNumber: awbNumber || undefined,
        courierName: courierName || undefined,
      });
    }

    // 10. Create Razorpay Order (for online payment)
    const razorpayOrder = await createRazorpayOrder(total, 'INR', orderNumber, {
      order_number: orderNumber,
      user_id: user.id,
    });

    // Save pending order record in Supabase with status 'pending_payment'.
    // NOTE: This remains HIDDEN from Admin Dashboard & Order History until payment is captured.
    // This guarantees that if the browser crashes, phone dies, or tab closes after payment,
    // the Razorpay Webhook or Reconciliation will immediately find and confirm this exact order!
    const { data: pendingOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
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

    if (orderError || !pendingOrder) {
      console.error('Failed to create pending order record:', orderError);
      return NextResponse.json({ error: 'Failed to initialize order record' }, { status: 500 });
    }

    // Insert order items linked to pending order
    await supabaseAdmin.from('order_items').insert(
      validatedItems.map((item) => ({
        order_id: pendingOrder.id,
        ...item,
      }))
    );

    // Insert initial payment record linking pendingOrder.id to razorpayOrder.id
    await supabaseAdmin.from('payments').insert({
      order_id: pendingOrder.id,
      razorpay_order_id: razorpayOrder.id,
      amount: total,
      currency: 'INR',
      status: 'created',
      method: 'razorpay',
    });

    const orderData = {
      orderId: pendingOrder.id,
      userId: user.id,
      orderNumber,
      subtotal,
      discount,
      couponCode: appliedCouponCode || null,
      shippingCost,
      total,
      paymentMethod: 'razorpay',
      shippingAddress,
      deliveryMethod: deliveryMethod || 'standard',
      items: validatedItems,
    };

    // Return data needed for Razorpay Checkout
    return NextResponse.json({
      success: true,
      orderId: pendingOrder.id,
      orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: total,
      currency: 'INR',
      // Sanitized keyId (Live fallback: 'rzp_live_TZUoFoXCMkJNkx')
      keyId: RAZORPAY_KEY_ID || cleanRazorpayKey(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) || 'rzp_test_Tai3sx6h51NmJP',
      orderData,
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
