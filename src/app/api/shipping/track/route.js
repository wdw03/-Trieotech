export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { trackShipment, trackByOrderId } from '../../../../lib/shiprocket';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// GET: Track a shipment with product items & real-time milestones
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const awb = searchParams.get('awb');
    const orderNumber = searchParams.get('orderNumber') || searchParams.get('orderId');

    let shipment = null;
    let order = null;
    let targetAwb = awb;

    // 1. If AWB passed, find local shipment + order
    if (targetAwb) {
      const { data: ship } = await supabaseAdmin
        .from('shipments')
        .select('*, orders(*, order_items(*))')
        .eq('awb_number', targetAwb)
        .maybeSingle();

      if (ship) {
        shipment = ship;
        order = ship.orders;
      }
    }

    // 2. If orderNumber passed, find order + shipment
    if (!order && orderNumber) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderNumber);
      let query = supabaseAdmin.from('orders').select('*, order_items(*), shipments(*)');
      if (isUuid) {
        query = query.eq('id', orderNumber);
      } else {
        query = query.eq('order_number', orderNumber);
      }
      const { data: ord } = await query.maybeSingle();
      if (ord) {
        const orderStatus = (ord.status || '').toLowerCase();
        if (['pending_payment', 'payment_failed', 'draft'].includes(orderStatus)) {
          return NextResponse.json({
            tracking: null,
            error: 'Order payment is incomplete or pending. Tracking is only available for confirmed orders.',
          }, { status: 400 });
        }
        order = ord;
        shipment = Array.isArray(ord.shipments) ? ord.shipments[0] : ord.shipments;
        if (shipment?.awb_number) targetAwb = shipment.awb_number;
      }
    }

    if (!order && !targetAwb) {
      return NextResponse.json({ tracking: null, error: 'Provide a valid awb or orderNumber' }, { status: 400 });
    }

    // 3. Fetch live scans from Shiprocket
    let liveTracking = null;
    if (targetAwb && !targetAwb.startsWith('SR-')) {
      try {
        liveTracking = await trackShipment(targetAwb);
      } catch (err) {
        console.warn('Live trackShipment notice:', err.message);
      }
    }

    if (!liveTracking && shipment?.shiprocket_order_id) {
      try {
        liveTracking = await trackByOrderId(shipment.shiprocket_order_id);
      } catch (_) {}
    }

    // 4. Fetch local audit events
    let events = [];
    if (shipment?.id) {
      const { data: evts } = await supabaseAdmin
        .from('shipment_events')
        .select('status, status_code, activity, location, event_time')
        .eq('shipment_id', shipment.id)
        .order('event_time', { ascending: false });
      events = evts || [];
    }

    const liveScans =
      liveTracking?.tracking_data?.shipment_track_activities ||
      liveTracking?.tracking_data?.shipment_track ||
      [];

    let currentLocation = 'Trio Enterprises Central Warehouse, Faridabad';
    let currentActivity = order?.status === 'delivered' ? 'Delivered safely' : 'Package in transit';

    if (liveScans.length > 0) {
      currentLocation = liveScans[0].location || liveScans[0].city || currentLocation;
      currentActivity = liveScans[0].activity || liveScans[0]['sr-status-label'] || currentActivity;
    } else if (events.length > 0) {
      currentLocation = events[0].location || currentLocation;
      currentActivity = events[0].activity || currentActivity;
    }

    const items = (order?.order_items || []).map((it) => ({
      id: it.id,
      productId: it.product_id,
      name: it.name || it.product_name || 'Handcrafted Ethnic Item',
      quantity: it.quantity || 1,
      price: Number(it.price || 0),
      image: it.image || it.product_image || '/products/pearl-zardosi-patch-1.jpg',
      color: it.color,
      size: it.size,
    }));

    return NextResponse.json({
      success: true,
      order: order ? {
        id: order.order_number || order.id,
        orderNumber: order.order_number,
        status: order.status,
        total: Number(order.total || 0),
        shippingAddress: order.shipping_address,
        paymentMethod: order.payment_method,
        createdAt: order.created_at,
        estimatedDelivery: shipment?.estimated_delivery || order.estimated_delivery,
        items,
      } : null,
      tracking: {
        awb: targetAwb || shipment?.awb_number || '',
        carrier: shipment?.courier_name || (liveTracking?.tracking_data?.shipment_track?.[0]?.courier_name) || 'Shiprocket Express',
        status: shipment?.status || order?.status || 'pending',
        currentLocation,
        currentActivity,
        etd: shipment?.estimated_delivery || order?.estimated_delivery || null,
        liveScans,
        auditEvents: events,
      },
    });
  } catch (err) {
    console.error('Tracking query error:', err);
    return NextResponse.json({ tracking: null, error: err.message }, { status: 500 });
  }
}
