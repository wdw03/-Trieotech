export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { generateLabel, createOrderAndAssignAWB, generateAWB } from '../../../../../lib/shiprocket';

/**
 * Helper: Ensure an order has a valid Shiprocket shipment & real AWB assigned
 */
async function ensureShipmentAndAwb(orderIdOrNumber) {
  if (!orderIdOrNumber) return null;

  // 1. Find order + order_items
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdOrNumber);
  let orderQuery = supabaseAdmin.from('orders').select('*, order_items(*)');
  if (isUuid) {
    orderQuery = orderQuery.eq('id', orderIdOrNumber);
  } else {
    orderQuery = orderQuery.eq('order_number', orderIdOrNumber);
  }
  const { data: order } = await orderQuery.maybeSingle();
  if (!order) return null;

  // 2. Check existing shipment in DB
  let { data: shipment } = await supabaseAdmin
    .from('shipments')
    .select('*')
    .eq('order_id', order.id)
    .maybeSingle();

  // 3. If no shipment or missing shiprocket_shipment_id, create it live in Shiprocket
  if (!shipment || !shipment.shiprocket_shipment_id || shipment.shiprocket_shipment_id === '') {
    try {
      const isCod = order.payment_method === 'cod';
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

      const shipmentData = {
        order_id: order.id,
        shiprocket_order_id: String(shiprocketResult.order_id || ''),
        shiprocket_shipment_id: String(shiprocketResult.shipment_id || ''),
        awb_number: shiprocketResult.awb_code || '',
        courier_name: shiprocketResult.courier_name || '',
        courier_id: shiprocketResult.courier_company_id || null,
        routing_code: shiprocketResult.routing_code || '',
        cod_collectable: isCod ? Number(order.total || 0) : 0,
        status: 'pending',
        updated_at: new Date().toISOString(),
      };

      if (shipment) {
        const { data: updated } = await supabaseAdmin
          .from('shipments')
          .update(shipmentData)
          .eq('id', shipment.id)
          .select()
          .single();
        shipment = updated;
      } else {
        const { data: inserted } = await supabaseAdmin
          .from('shipments')
          .insert(shipmentData)
          .select()
          .single();
        shipment = inserted;
      }
    } catch (createErr) {
      console.warn(`Shiprocket order auto-creation notice for ${order.order_number}:`, createErr.message);
    }
  }

  // 4. If shipment has no AWB or placeholder, assign real courier AWB in Shiprocket
  const currentAwb = shipment?.awb_number || '';
  if (shipment?.shiprocket_shipment_id && (!currentAwb || currentAwb.startsWith('SR-') || currentAwb.length < 5)) {
    try {
      const awbRes = await generateAWB(shipment.shiprocket_shipment_id);
      const resData = awbRes?.response?.data || awbRes;
      if (resData?.awb_code) {
        const { data: updated } = await supabaseAdmin
          .from('shipments')
          .update({
            awb_number: resData.awb_code,
            courier_name: resData.courier_name || shipment.courier_name,
            routing_code: resData.routing_code || shipment.routing_code,
            updated_at: new Date().toISOString(),
          })
          .eq('id', shipment.id)
          .select()
          .single();
        shipment = updated || shipment;
      }
    } catch (awbErr) {
      console.warn(`Shiprocket AWB auto-assignment notice for ${order.order_number}:`, awbErr.message);
    }
  }

  return shipment;
}

/**
 * GET: Print or retrieve official Shiprocket shipping label
 * When navigated to directly by browser, 302 redirects straight to official Shiprocket AWS S3 PDF!
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId') || searchParams.get('orderNumber');
    const orderIdsParam = searchParams.get('orderIds');
    const directShipmentId = searchParams.get('shipmentId');
    const wantJson = searchParams.get('json') === 'true';

    let orderIds = [];
    if (orderIdsParam) {
      orderIds = orderIdsParam.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (orderId) {
      orderIds = [orderId.trim()];
    }

    let resolvedShipments = [];

    if (directShipmentId) {
      const { data: sh } = await supabaseAdmin
        .from('shipments')
        .select('*')
        .eq('id', directShipmentId)
        .maybeSingle();
      if (sh) resolvedShipments.push(sh);
    }

    for (const ordId of orderIds) {
      const sh = await ensureShipmentAndAwb(ordId);
      if (sh) resolvedShipments.push(sh);
    }

    if (!resolvedShipments.length) {
      return NextResponse.json({ error: 'No valid shipment found to generate label' }, { status: 404 });
    }

    const validShiprocketShipmentIds = resolvedShipments
      .map((s) => s.shiprocket_shipment_id)
      .filter((id) => id && id !== 'undefined' && id !== 'null' && Number(id) > 0);

    if (!validShiprocketShipmentIds.length) {
      return NextResponse.json(
        { error: 'Shiprocket shipment ID is missing. Ensure pickup address is configured in your Shiprocket account.' },
        { status: 400 }
      );
    }

    // Check if single shipment already has a cached label_url
    let labelUrl = '';
    if (resolvedShipments.length === 1 && resolvedShipments[0].label_url && resolvedShipments[0].label_url.startsWith('http')) {
      labelUrl = resolvedShipments[0].label_url;
    } else {
      const labelResult = await generateLabel(validShiprocketShipmentIds);
      labelUrl = labelResult?.label_url || labelResult?.response?.label_url || '';
      if (labelUrl) {
        const dbShipmentIds = resolvedShipments.map((s) => s.id);
        await supabaseAdmin
          .from('shipments')
          .update({ label_url: labelUrl, updated_at: new Date().toISOString() })
          .in('id', dbShipmentIds);
      }
    }

    if (!labelUrl) {
      return NextResponse.json({ error: 'Shiprocket did not return an official PDF label URL' }, { status: 502 });
    }

    // If browser requested standard print view, redirect directly to official PDF
    if (!wantJson) {
      return NextResponse.redirect(new URL(labelUrl));
    }

    return NextResponse.json({
      success: true,
      labelUrl,
      awbs: resolvedShipments.map((s) => s.awb_number).filter(Boolean),
      count: resolvedShipments.length,
    });
  } catch (err) {
    console.error('Label GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST: Generate official Shiprocket shipping label PDF for Single or Bulk Orders ("Print All")
 * Returns real official Shiprocket AWS S3 PDF label_url with real carrier AWBs.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const orderId = body.orderId || body.orderNumber;
    let orderIds = body.orderIds || (orderId ? [orderId] : []);
    const directShipmentId = body.shipmentId;
    let shipmentIds = body.shipmentIds || (directShipmentId ? [directShipmentId] : []);

    // If bulk "all" requested
    if (body.all) {
      const { data: activeOrders } = await supabaseAdmin
        .from('orders')
        .select('id, order_number')
        .in('status', ['confirmed', 'processing', 'packed', 'pickup_scheduled', 'picked_up', 'in_transit', 'shipped'])
        .order('created_at', { ascending: false })
        .limit(100);
      if (activeOrders?.length) {
        orderIds = activeOrders.map((o) => o.order_number || o.id);
      }
    }

    if (!orderIds.length && !shipmentIds.length) {
      return NextResponse.json({ error: 'orderId, orderIds, or shipmentId is required' }, { status: 400 });
    }

    const resolvedShipments = [];

    for (const shId of shipmentIds) {
      const { data: sh } = await supabaseAdmin
        .from('shipments')
        .select('*')
        .eq('id', shId)
        .maybeSingle();
      if (sh) resolvedShipments.push(sh);
    }

    for (const ordId of orderIds) {
      const sh = await ensureShipmentAndAwb(ordId);
      if (sh) resolvedShipments.push(sh);
    }

    if (!resolvedShipments.length) {
      return NextResponse.json({ error: 'No valid shipments found to generate label' }, { status: 404 });
    }

    // Collect valid numeric Shiprocket shipment IDs
    const validShiprocketShipmentIds = resolvedShipments
      .map((s) => s.shiprocket_shipment_id)
      .filter((id) => id && id !== 'undefined' && id !== 'null' && Number(id) > 0);

    if (!validShiprocketShipmentIds.length) {
      return NextResponse.json(
        {
          error:
            'Shiprocket shipment ID is missing. Please ensure your pickup address is registered in Shiprocket so live shipments can be generated.',
        },
        { status: 400 }
      );
    }

    // If single shipment and label is already cached in DB, reuse it for instant speed
    if (
      resolvedShipments.length === 1 &&
      resolvedShipments[0].label_url &&
      resolvedShipments[0].label_url.startsWith('http')
    ) {
      return NextResponse.json({
        success: true,
        cached: true,
        labelUrl: resolvedShipments[0].label_url,
        awb: resolvedShipments[0].awb_number,
        courier: resolvedShipments[0].courier_name,
        count: 1,
      });
    }

    // Call Shiprocket official API to generate real PDF label
    const labelResult = await generateLabel(validShiprocketShipmentIds);
    const labelUrl = labelResult?.label_url || labelResult?.response?.label_url || '';

    if (!labelUrl) {
      const errorMsg = labelResult?.message || labelResult?.response || 'Shiprocket did not return a label URL';
      return NextResponse.json(
        {
          error: `Shiprocket Error: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`,
          raw: labelResult,
        },
        { status: 502 }
      );
    }

    // Cache the real official label_url in Supabase for all included shipments
    const dbShipmentIds = resolvedShipments.map((s) => s.id);
    await supabaseAdmin
      .from('shipments')
      .update({
        label_url: labelUrl,
        updated_at: new Date().toISOString(),
      })
      .in('id', dbShipmentIds);

    // Audit event in shipment_events
    for (const sh of resolvedShipments) {
      await supabaseAdmin.from('shipment_events').insert({
        shipment_id: sh.id,
        status: sh.status || 'pending',
        status_code: 'LABEL_GENERATED',
        activity: `Official Shiprocket shipping label generated with AWB ${sh.awb_number || 'N/A'}`,
        location: 'Faridabad Hub',
        raw_data: { labelUrl },
      });
    }

    return NextResponse.json({
      success: true,
      labelUrl,
      awbNumbers: resolvedShipments.map((s) => s.awb_number).filter(Boolean),
      courierNames: resolvedShipments.map((s) => s.courier_name).filter(Boolean),
      count: resolvedShipments.length,
    });
  } catch (err) {
    console.error('Generate real label error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate official label' }, { status: 500 });
  }
}
