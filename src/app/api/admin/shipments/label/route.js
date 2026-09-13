export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { generateLabel } from '../../../../../lib/shiprocket';

/**
 * Helper: Find existing Shiprocket shipment & verify real AWB assigned
 * Does NOT auto-create shipments or auto-assign AWBs to prevent unauthorized charges.
 */
async function getExistingShipmentAndAwb(orderIdOrNumber) {
  if (!orderIdOrNumber) return { error: 'Order ID is required' };

  // 1. Find order
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdOrNumber);
  let orderQuery = supabaseAdmin.from('orders').select('id, order_number, status');
  if (isUuid) {
    orderQuery = orderQuery.eq('id', orderIdOrNumber);
  } else {
    orderQuery = orderQuery.eq('order_number', orderIdOrNumber);
  }
  const { data: order } = await orderQuery.maybeSingle();
  if (!order) return { error: `Order ${orderIdOrNumber} not found` };

  if (order.status === 'cancelled') {
    return { error: `Order ${order.order_number || orderIdOrNumber} is cancelled. Cannot generate or print label for cancelled orders.` };
  }

  // 2. Check existing shipment in DB
  let { data: shipment } = await supabaseAdmin
    .from('shipments')
    .select('*')
    .eq('order_id', order.id)
    .maybeSingle();

  if (!shipment || !shipment.shiprocket_shipment_id || shipment.shiprocket_shipment_id === '') {
    return { error: `Shipment has not been created yet for order ${order.order_number || orderIdOrNumber}. Please click "Create Shipment" first.` };
  }

  const currentAwb = shipment.awb_number || '';
  if (!currentAwb || currentAwb.startsWith('SR-') || currentAwb.length < 5) {
    return { error: `AWB has not been assigned yet for order ${order.order_number || orderIdOrNumber}. Please click "Assign AWB" first before printing label.` };
  }

  return { shipment };
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
      const res = await getExistingShipmentAndAwb(ordId);
      if (res.error) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      if (res.shipment) resolvedShipments.push(res.shipment);
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
      const res = await getExistingShipmentAndAwb(ordId);
      if (res.error) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      if (res.shipment) resolvedShipments.push(res.shipment);
    }

    if (!resolvedShipments.length) {
      return NextResponse.json({ error: 'No valid shipments found with assigned AWB to generate label' }, { status: 404 });
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
