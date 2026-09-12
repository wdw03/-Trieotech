export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { createOrderAndAssignAWB } from '../../../../../lib/shiprocket';

/**
 * POST: Create a Shiprocket shipment for an existing order
 * Admin action — idempotent (won't create duplicate if shipment already exists)
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
        customLabelUrl: `/api/admin/shipments/label/custom?orderId=${encodeURIComponent(order.order_number)}`,
        message: 'Shipment already exists for this order',
      });
    }

    const isCod = order.payment_method === 'cod';
    const codCollectable = isCod ? Number(order.total || 0) : 0;

    // 3. Create Shiprocket order + attempt live AWB assignment
    const shiprocketResult = await createOrderAndAssignAWB({
      orderNumber: order.order_number,
      orderDate: new Date(order.created_at || Date.now()).toISOString().split('T')[0],
      billingAddress: order.shipping_address,
      shippingAddress: order.shipping_address,
      items: order.order_items,
      paymentMethod: isCod ? 'cod' : 'prepaid',
      subtotal: order.subtotal,
      discount: order.discount,
      shippingCharges: order.shipping_cost,
    });

    // 4. Save/update shipment record in DB with financial & routing fields
    const shipmentData = {
      order_id: order.id,
      shiprocket_order_id: String(shiprocketResult.order_id || ''),
      shiprocket_shipment_id: String(shiprocketResult.shipment_id || ''),
      awb_number: shiprocketResult.awb_code || '',
      courier_name: shiprocketResult.courier_name || '',
      courier_id: shiprocketResult.courier_company_id || null,
      routing_code: shiprocketResult.routing_code || '',
      cod_collectable: codCollectable,
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
        status: 'pending',
        status_code: 'ORDER_CREATED',
        activity: `Shiprocket order created (${savedShipment.awb_number ? `AWB: ${savedShipment.awb_number}` : 'AWB assignment pending'})`,
        location: 'Faridabad Hub',
        raw_data: { shiprocketResult },
      });
    }

    return NextResponse.json({
      success: true,
      shipment: savedShipment,
      shiprocketOrderId: shiprocketResult.order_id,
      shipmentId: shiprocketResult.shipment_id,
      awbNumber: shiprocketResult.awb_code || '',
      courierName: shiprocketResult.courier_name || '',
      customLabelUrl: `/api/admin/shipments/label/custom?orderId=${encodeURIComponent(order.order_number)}`,
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
