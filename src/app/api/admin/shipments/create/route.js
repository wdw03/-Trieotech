export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { createShiprocketOrder } from '../../../../../lib/shiprocket';

/**
 * POST: Create a Shiprocket shipment for an existing order
 * Admin action — idempotent (won't create duplicate if shipment already exists)
 * Creates Shiprocket order without assigning AWB yet (saves courier freight balance).
 */
export async function POST(request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // 1. Fetch order + items from DB (support both UUID and order_number)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let orderQuery = supabaseAdmin.from('orders').select('*, order_items(*)');
    if (isUuid) {
      orderQuery = orderQuery.eq('id', orderId);
    } else {
      orderQuery = orderQuery.eq('order_number', orderId);
    }
    const { data: order, error: orderErr } = await orderQuery.maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Guard: Never create a shipment for a cancelled order
    if ((order.status || '').toLowerCase() === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot create shipment for an order that has been cancelled.' },
        { status: 400 }
      );
    }

    // 2. Idempotency check: if a valid shipment already exists, return it
    const { data: existingShipment } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .eq('order_id', order.id)
      .maybeSingle();

    if (existingShipment?.shiprocket_order_id && existingShipment.shiprocket_order_id !== '') {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        shipment: existingShipment,
        shiprocketOrderId: existingShipment.shiprocket_order_id,
        shipmentId: existingShipment.shiprocket_shipment_id,
        awbNumber: existingShipment.awb_number || '',
        courierName: existingShipment.courier_name || 'Awaiting AWB Assignment',
        message: 'Shipment already exists for this order',
      });
    }

    const isCod = order.payment_method === 'cod';
    const codCollectable = isCod ? Number(order.total || 0) : 0;

    // Fetch product specs (weight, dimensions) for each ordered item
    const productIds = (order.order_items || []).map((i) => i.product_id).filter(Boolean);
    let productsMap = {};
    if (productIds.length > 0) {
      const { data: prods } = await supabaseAdmin
        .from('products')
        .select('id, weight, length, breadth, height, dimensions')
        .in('id', productIds);
      (prods || []).forEach((p) => {
        productsMap[p.id] = p;
      });
    }

    let calculatedWeight = 0;
    let maxItemLength = 15;
    let maxItemBreadth = 10;
    let totalItemHeight = 0;

    const enrichedItems = (order.order_items || []).map((item) => {
      const prod = productsMap[item.product_id] || {};
      const qty = Number(item.quantity) || 1;
      const w = Number(prod.weight !== undefined && prod.weight !== null ? prod.weight : (item.weight || 0.5));
      const l = Number(prod.length || prod.dimensions?.length || item.length || 15);
      const b = Number(prod.breadth || prod.dimensions?.breadth || item.breadth || 10);
      const h = Number(prod.height || prod.dimensions?.height || item.height || 5);

      calculatedWeight += w * qty;
      if (l > maxItemLength) maxItemLength = l;
      if (b > maxItemBreadth) maxItemBreadth = b;
      totalItemHeight += h * qty;

      return {
        ...item,
        weight: w,
        length: l,
        breadth: b,
        height: h,
      };
    });

    const packageWeight = Math.max(0.1, Number(calculatedWeight ? calculatedWeight.toFixed(3) : 0.5));
    const packageLength = Math.max(10, Math.round(maxItemLength || 15));
    const packageBreadth = Math.max(10, Math.round(maxItemBreadth || 10));
    const packageHeight = Math.max(5, Math.min(100, Math.round(totalItemHeight || 5)));

    // 3. Create Shiprocket order WITHOUT assigning AWB yet (no courier wallet charge)
    const shiprocketResult = await createShiprocketOrder({
      orderNumber: order.order_number,
      orderDate: new Date(order.created_at || Date.now()).toISOString().split('T')[0],
      billingAddress: order.shipping_address,
      shippingAddress: order.shipping_address,
      items: enrichedItems,
      paymentMethod: isCod ? 'cod' : 'prepaid',
      subtotal: order.subtotal,
      discount: order.discount,
      shippingCharges: order.shipping_cost,
      weight: packageWeight,
      length: packageLength,
      breadth: packageBreadth,
      height: packageHeight,
    });

    // 4. Save/update shipment record in DB with financial & routing fields (AWB unassigned)
    const shipmentData = {
      order_id: order.id,
      shiprocket_order_id: String(shiprocketResult.order_id || ''),
      shiprocket_shipment_id: String(shiprocketResult.shipment_id || ''),
      awb_number: '',
      courier_name: 'Awaiting AWB Assignment',
      courier_id: null,
      routing_code: '',
      cod_collectable: codCollectable,
      weight: packageWeight,
      dimensions: {
        length: packageLength,
        breadth: packageBreadth,
        height: packageHeight,
      },
      status: 'pending',
      updated_at: new Date().toISOString(),
    };

    let savedShipment;
    if (existingShipment) {
      const { data: updated } = await supabaseAdmin
        .from('shipments')
        .update(shipmentData)
        .eq('id', existingShipment.id)
        .select()
        .single();
      savedShipment = updated;
    } else {
      const { data: inserted } = await supabaseAdmin
        .from('shipments')
        .insert(shipmentData)
        .select()
        .single();
      savedShipment = inserted;
    }

    // 5. Audit event in shipment_events
    if (savedShipment?.id) {
      await supabaseAdmin.from('shipment_events').insert({
        shipment_id: savedShipment.id,
        status: 'packed',
        status_code: 'ORDER_PACKED',
        activity: `Shiprocket order created & packed (Shipment ID: ${savedShipment.shiprocket_shipment_id}). AWB assignment pending.`,
        location: 'Faridabad Workshop Hub',
        raw_data: { shiprocketResult },
      });
    }

    // 6. Advance order status to packed
    const currentStatus = (order.status || '').toLowerCase();
    if (['pending', 'processing', 'confirmed'].includes(currentStatus)) {
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'packed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      try {
        await supabaseAdmin.from('order_status_history').insert({
          order_id: order.id,
          from_status: order.status,
          to_status: 'packed',
          source: 'admin',
          changed_by: 'admin',
          reason: `Shipment created in Shiprocket (Shipment ID: ${shiprocketResult.shipment_id}). Ready for AWB assignment.`,
        });
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      shipment: savedShipment,
      shiprocketOrderId: shiprocketResult.order_id,
      shipmentId: shiprocketResult.shipment_id,
      awbNumber: '',
      courierName: 'Awaiting AWB Assignment',
      message: 'Shipment created successfully in Shiprocket without AWB. Click Assign AWB to assign courier.',
    });
  } catch (err) {
    console.error('Create shipment error:', err);
    let errorMsg = err.message || 'Failed to create shipment';
    if (errorMsg.toLowerCase().includes('billing/shipping address first') || errorMsg.toLowerCase().includes('pickup')) {
      errorMsg = 'Shiprocket Notice: Please add a Pickup Address in your Shiprocket account (app.shiprocket.in -> Settings -> Manage Pickup Addresses) to generate live shipments.';
    }
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
