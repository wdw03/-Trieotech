export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { trackShipment, trackByOrderId } from '../../../../../lib/shiprocket';

/**
 * GET or POST: Comprehensive tracking for admin panel
 * Combines live Shiprocket carrier scans with local shipment_events audit trail
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const awb = searchParams.get('awb');
    const orderId = searchParams.get('orderId') || searchParams.get('orderNumber');

    return await handleTrack({ awb, orderId });
  } catch (err) {
    console.error('Admin track GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { awb, orderId } = body;
    return await handleTrack({ awb, orderId });
  } catch (err) {
    console.error('Admin track POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handleTrack({ awb, orderId }) {
  let targetAwb = awb;
  let shipment = null;
  let order = null;

  if (orderId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let orderQuery = supabaseAdmin.from('orders').select('*').maybeSingle();
    if (isUuid) {
      orderQuery = orderQuery.eq('id', orderId);
    } else {
      orderQuery = orderQuery.eq('order_number', orderId);
    }

    const { data: ord } = await orderQuery;
    order = ord;

    if (order) {
      const { data: ship } = await supabaseAdmin
        .from('shipments')
        .select('*')
        .eq('order_id', order.id)
        .maybeSingle();
      shipment = ship;
      if (shipment?.awb_number) targetAwb = shipment.awb_number;
    }
  } else if (targetAwb) {
    const { data: ship } = await supabaseAdmin
      .from('shipments')
      .select('*, orders(*)')
      .eq('awb_number', targetAwb)
      .maybeSingle();
    shipment = ship;
    order = shipment?.orders;
  }

  if (!targetAwb && !shipment?.shiprocket_order_id) {
    return NextResponse.json({
      success: false,
      error: 'AWB number or valid order with shipment is required for tracking',
    }, { status: 400 });
  }

  // 1. Fetch live Shiprocket scans
  let liveTracking = null;
  if (targetAwb && !targetAwb.startsWith('SR-')) {
    try {
      liveTracking = await trackShipment(targetAwb);
    } catch (err) {
      console.warn('trackShipment notice:', err.message);
    }
  }

  if (!liveTracking && shipment?.shiprocket_order_id) {
    try {
      liveTracking = await trackByOrderId(shipment.shiprocket_order_id);
    } catch (err) {
      console.warn('trackByOrderId notice:', err.message);
    }
  }

  // 2. Fetch local audit timeline from shipment_events
  let localEvents = [];
  if (shipment?.id) {
    const { data: events } = await supabaseAdmin
      .from('shipment_events')
      .select('*')
      .eq('shipment_id', shipment.id)
      .order('event_time', { ascending: false });
    localEvents = events || [];
  }

  // Extract scans from live response if present
  const liveScans =
    liveTracking?.tracking_data?.shipment_track_activities ||
    liveTracking?.tracking_data?.shipment_track ||
    [];

  return NextResponse.json({
    success: true,
    awb: targetAwb || shipment?.awb_number,
    courierName: shipment?.courier_name || 'Shiprocket Express',
    status: shipment?.status || 'pending',
    routingCode: shipment?.routing_code || '',
    orderNumber: order?.order_number,
    estimatedDelivery: shipment?.estimated_delivery,
    liveScans: Array.isArray(liveScans) ? liveScans : [],
    auditEvents: localEvents,
    rawLiveTracking: liveTracking,
  });
}
