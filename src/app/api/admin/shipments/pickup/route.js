export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { requestPickup } from '../../../../../lib/shiprocket';

/**
 * POST: Schedule courier pickup for a packed shipment
 * Admin action — call after marking order as "Packed"
 */
export async function POST(request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // 1. Fetch shipment (support both UUID and order_number)
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

    const { data: shipment } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .eq('order_id', targetOrderId)
      .maybeSingle();

    if (!shipment) {
      return NextResponse.json({ error: 'No shipment found for this order' }, { status: 404 });
    }

    if (!shipment.shiprocket_shipment_id) {
      return NextResponse.json(
        { error: 'No Shiprocket shipment ID. Create shipment first.' },
        { status: 400 }
      );
    }

    // 2. Idempotency check
    if (shipment.pickup_status === 'scheduled' || shipment.pickup_status === 'picked_up') {
      return NextResponse.json({
        success: true,
        alreadyScheduled: true,
        pickupStatus: shipment.pickup_status,
        message: 'Pickup already scheduled or completed',
      });
    }

    // 3. Request pickup from Shiprocket
    const pickupResult = await requestPickup(shipment.shiprocket_shipment_id);

    const pickupToken = pickupResult?.pickup_token_number ||
      pickupResult?.response?.pickup_token_number || '';
    const pickupStatus = pickupResult?.pickup_status ||
      pickupResult?.response?.pickup_scheduled_date ? 'scheduled' : 'requested';

    // 4. Update shipment in DB
    await supabaseAdmin
      .from('shipments')
      .update({
        pickup_status: pickupStatus,
        pickup_token: String(pickupToken || ''),
        status: 'pickup_scheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipment.id);

    // 5. Update order status to reflect ready-to-ship
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'shipped',
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetOrderId);

    return NextResponse.json({
      success: true,
      pickupStatus,
      pickupToken,
    });
  } catch (err) {
    console.error('Request pickup error:', err);
    return NextResponse.json({ error: err.message || 'Failed to request pickup' }, { status: 500 });
  }
}
