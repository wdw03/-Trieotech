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
    if (existingAwb && !existingAwb.startsWith('SR-') && existingAwb.length > 5) {
      return NextResponse.json({
        success: true,
        alreadyAssigned: true,
        awbNumber: existingAwb,
        courierName: shipment.courier_name || '',
        message: 'AWB already assigned',
      });
    }

    // 3. Call Shiprocket to assign AWB
    const awbResult = await generateAWB(shipment.shiprocket_shipment_id, courierId || undefined);

    let awbCode = '';
    let courierName = shipment.courier_name || '';

    if (awbResult?.response?.data?.awb_code) {
      awbCode = awbResult.response.data.awb_code;
      courierName = awbResult.response.data.courier_name || courierName;
    } else if (awbResult?.awb_code) {
      awbCode = awbResult.awb_code;
      courierName = awbResult.courier_name || courierName;
    }

    if (!awbCode) {
      return NextResponse.json(
        { error: 'Shiprocket could not assign AWB. Courier may not be available.' },
        { status: 502 }
      );
    }

    // 4. Update shipment in DB
    await supabaseAdmin
      .from('shipments')
      .update({
        awb_number: awbCode,
        courier_name: courierName,
        courier_id: awbResult?.response?.data?.courier_company_id || shipment.courier_id || null,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipment.id);

    return NextResponse.json({
      success: true,
      awbNumber: awbCode,
      courierName,
    });
  } catch (err) {
    console.error('Assign AWB error:', err);
    return NextResponse.json({ error: err.message || 'Failed to assign AWB' }, { status: 500 });
  }
}
