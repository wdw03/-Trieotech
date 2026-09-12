export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { generateAWB } from '../../../../../lib/shiprocket';

/**
 * POST: Assign AWB number to an existing Shiprocket shipment
 * Admin action — idempotent (won't re-assign if valid AWB exists)
 */
export async function POST(request) {
  try {
    const { orderId, courierId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // 1. Fetch shipment for this order (support both UUID and order_number)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let targetOrderId = orderId;
    if (!isUuid) {
      const { data: ord } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('order_number', orderId)
        .maybeSingle();
      if (ord) targetOrderId = ord.id;
    }

    const { data: shipment, error: shipErr } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .eq('order_id', targetOrderId)
      .maybeSingle();

    if (!shipment) {
      return NextResponse.json(
        { error: 'No shipment found for this order. Create a shipment first.' },
        { status: 404 }
      );
    }

    if (!shipment.shiprocket_shipment_id) {
      return NextResponse.json(
        { error: 'Shipment has no Shiprocket shipment ID. Create shipment first.' },
        { status: 400 }
      );
    }

    // 2. Idempotency: if a real AWB already exists (not a placeholder), return it
    const existingAwb = shipment.awb_number || '';
    if (existingAwb && !existingAwb.startsWith('SR-') && existingAwb.length > 5 && !courierId) {
      return NextResponse.json({
        success: true,
        alreadyAssigned: true,
        awbNumber: existingAwb,
        courierName: shipment.courier_name || '',
        routingCode: shipment.routing_code || '',
        message: 'AWB already assigned',
      });
    }

    // 3. Call Shiprocket to assign AWB
    const awbResult = await generateAWB(shipment.shiprocket_shipment_id, courierId || undefined);

    let awbCode = '';
    let courierName = shipment.courier_name || '';
    let routingCode = shipment.routing_code || '';
    let freightCost = shipment.courier_freight_cost || 0;

    const resData = awbResult?.response?.data || awbResult;

    if (resData?.awb_code) {
      awbCode = resData.awb_code;
      courierName = resData.courier_name || courierName;
      routingCode = resData.routing_code || routingCode;
      if (resData.freight_charge) {
        freightCost = Number(resData.freight_charge);
      }
    }

    if (!awbCode) {
      return NextResponse.json(
        { error: 'Shiprocket could not assign AWB. Courier may not be available or account balance insufficient.', raw: awbResult },
        { status: 502 }
      );
    }

    // 4. Update shipment in DB
    const updatePayload = {
      awb_number: awbCode,
      courier_name: courierName,
      courier_id: resData?.courier_company_id || shipment.courier_id || null,
      routing_code: routingCode,
      updated_at: new Date().toISOString(),
    };
    if (freightCost > 0) {
      updatePayload.courier_freight_cost = freightCost;
    }

    await supabaseAdmin
      .from('shipments')
      .update(updatePayload)
      .eq('id', shipment.id);

    // 5. Audit event in shipment_events
    await supabaseAdmin.from('shipment_events').insert({
      shipment_id: shipment.id,
      status: shipment.status || 'pending',
      status_code: 'AWB_ASSIGNED',
      activity: `AWB ${awbCode} assigned via ${courierName}`,
      location: 'Faridabad Hub',
      raw_data: { awbCode, courierName, routingCode, freightCost, awbResult },
    });

    return NextResponse.json({
      success: true,
      awbNumber: awbCode,
      courierName,
      routingCode,
      freightCost,
    });
  } catch (err) {
    console.error('Assign AWB error:', err);
    return NextResponse.json({ error: err.message || 'Failed to assign AWB' }, { status: 500 });
  }
}
