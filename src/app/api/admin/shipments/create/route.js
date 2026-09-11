export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { createShiprocketOrder, createOrderAndAssignAWB } from '../../../../../lib/shiprocket';

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

    // 1. Fetch order + items from DB
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Idempotency check: if a valid shipment already exists, return it
    const { data: existingShipment } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (existingShipment?.shiprocket_order_id && existingShipment.shiprocket_order_id !== '') {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        shipment: existingShipment,
        message: 'Shipment already exists for this order',
      });
    }

    // 3. Create Shiprocket order + attempt AWB assignment
    const shiprocketResult = await createOrderAndAssignAWB({
      orderNumber: order.order_number,
      orderDate: new Date(order.created_at || Date.now()).toISOString().split('T')[0],
      billingAddress: order.shipping_address,
      shippingAddress: order.shipping_address,
      items: order.order_items,
      paymentMethod: order.payment_method === 'cod' ? 'cod' : 'prepaid',
      subtotal: order.subtotal,
      discount: order.discount,
      shippingCharges: order.shipping_cost,
    });

    // 4. Save/update shipment record in DB
    const shipmentData = {
      order_id: orderId,
      shiprocket_order_id: String(shiprocketResult.order_id || ''),
      shiprocket_shipment_id: String(shiprocketResult.shipment_id || ''),
      awb_number: shiprocketResult.awb_code || '',
      courier_name: shiprocketResult.courier_name || '',
      courier_id: shiprocketResult.courier_company_id || null,
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    };

    let savedShipment;
    if (existingShipment) {
      // Update existing (failed/empty) record
      const { data: updated } = await supabaseAdmin
        .from('shipments')
        .update(shipmentData)
        .eq('id', existingShipment.id)
        .select()
        .single();
      savedShipment = updated;
    } else {
      // Insert new
      const { data: inserted } = await supabaseAdmin
        .from('shipments')
        .insert(shipmentData)
        .select()
        .single();
      savedShipment = inserted;
    }

    return NextResponse.json({
      success: true,
      shipment: savedShipment,
      shiprocketOrderId: shiprocketResult.order_id,
      shipmentId: shiprocketResult.shipment_id,
      awbNumber: shiprocketResult.awb_code || '',
      courierName: shiprocketResult.courier_name || '',
    });
  } catch (err) {
    console.error('Create shipment error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create shipment' }, { status: 500 });
  }
}
