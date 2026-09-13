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

    const orderStatus = (order?.status || 'processing').toLowerCase();
    let currentLocation = 'Trio Enterprises Central Workshop, Faridabad';
    let currentActivity = 'Order verified and in processing';

    if (orderStatus === 'delivered') {
      currentLocation = order?.shipping_address?.city ? `${order.shipping_address.city} Destination` : 'Patron Destination';
      currentActivity = 'Delivered safely to patron';
    } else if (orderStatus === 'out_for_delivery') {
      currentLocation = order?.shipping_address?.city ? `${order.shipping_address.city} Delivery Hub` : 'Local Delivery Hub';
      currentActivity = 'Out for delivery today with courier partner';
    } else if (orderStatus === 'in_transit' || orderStatus === 'shipped') {
      currentLocation = 'In Transit - Logistics Network';
      currentActivity = 'Package moving through sorting facility';
    } else if (orderStatus === 'picked_up') {
      currentLocation = 'Faridabad Logistics Center';
      currentActivity = 'Handed over to courier partner';
    } else if (orderStatus === 'packed' || orderStatus === 'pickup_scheduled') {
      currentLocation = 'Trio Workshop & Warehouse, Faridabad';
      currentActivity = 'Order packed & quality inspected. Awaiting courier pickup.';
    } else if (orderStatus === 'confirmed') {
      currentLocation = 'Trio Workshop, Faridabad';
      currentActivity = 'Order confirmed. Scheduled for quality check and packaging.';
    } else if (orderStatus === 'processing') {
      currentLocation = 'Trio Workshop, Faridabad';
      currentActivity = 'Payment verified. Order is being processed by our team.';
    } else if (orderStatus === 'cancelled') {
      currentLocation = 'Customer Support Hub';
      currentActivity = 'Order has been cancelled.';
    }

    if (liveScans.length > 0) {
      currentLocation = liveScans[0].location || liveScans[0].city || currentLocation;
      currentActivity = liveScans[0].activity || liveScans[0]['sr-status-label'] || currentActivity;
    } else if (events.length > 0) {
      currentLocation = events[0].location || currentLocation;
      currentActivity = events[0].activity || currentActivity;
    }

    // Auto-sync status progression ONLY from real live Shiprocket scans into DB
    const rawSrStatus = String(
      liveTracking?.tracking_data?.shipment_track?.[0]?.current_status ||
      liveTracking?.tracking_data?.shipment_status ||
      (liveScans.length > 0 ? liveScans[0].activity || liveScans[0]['sr-status-label'] : '') ||
      ''
    ).toLowerCase().trim();

    if (rawSrStatus && order && (liveScans.length > 0 || liveTracking?.tracking_data)) {
      let mappedStatus = null;
      if (rawSrStatus.includes('cancel')) {
        mappedStatus = 'cancelled';
      } else if (rawSrStatus.includes('deliver') && !rawSrStatus.includes('undeliver') && !rawSrStatus.includes('out')) {
        mappedStatus = 'delivered';
      } else if (rawSrStatus.includes('out for delivery')) {
        mappedStatus = 'out_for_delivery';
      } else if (rawSrStatus.includes('transit') || rawSrStatus.includes('shipped')) {
        mappedStatus = 'in_transit';
      } else if (rawSrStatus.includes('pick')) {
        mappedStatus = 'picked_up';
      } else if (rawSrStatus.includes('rto')) {
        mappedStatus = 'rto_initiated';
      }

      if (mappedStatus) {
        const STATUS_WEIGHTS = {
          pending_payment: 5,
          pending: 10,
          confirmed: 20,
          processing: 30,
          packed: 35,
          pickup_scheduled: 40,
          picked_up: 45,
          shipped: 50,
          in_transit: 55,
          out_for_delivery: 60,
          failed_delivery: 65,
          delivered: 70,
          cancelled: 80,
        };
        const currentWeight = STATUS_WEIGHTS[(order.status || 'pending').toLowerCase()] || 0;
        const newWeight = STATUS_WEIGHTS[mappedStatus] || 0;

        if (newWeight > currentWeight || (mappedStatus === 'cancelled' && order.status !== 'cancelled')) {
          const nowIso = new Date().toISOString();
          const orderUpdates = {
            status: mappedStatus,
            updated_at: nowIso,
          };
          if (mappedStatus === 'delivered') {
            orderUpdates.delivered_at = nowIso;
            if (order.payment_method === 'cod') orderUpdates.payment_status = 'paid';
          }
          if (mappedStatus === 'cancelled') {
            orderUpdates.cancelled_at = nowIso;
            orderUpdates.cancellation_reason = 'Cancelled via Shiprocket scan';
            if (order.payment_method === 'cod') orderUpdates.payment_status = 'cancelled';
          }

          await supabaseAdmin.from('orders').update(orderUpdates).eq('id', order.id);

          if (shipment?.id) {
            const shipUpdates = {
              status: mappedStatus,
              updated_at: nowIso,
            };
            if (mappedStatus === 'delivered') shipUpdates.delivered_at = nowIso;
            if (mappedStatus === 'cancelled') shipUpdates.cancel_reason = 'Cancelled via Shiprocket scan';
            await supabaseAdmin.from('shipments').update(shipUpdates).eq('id', shipment.id);
          }

          await supabaseAdmin.from('order_status_history').insert({
            order_id: order.id,
            from_status: order.status || 'pending',
            to_status: mappedStatus,
            source: 'carrier_tracking_sync',
            changed_by: 'shiprocket',
            reason: `Live carrier sync: ${mappedStatus.replace(/_/g, ' ')} (${currentLocation})`,
            metadata: {
              rawSrStatus,
              awb: targetAwb,
              location: currentLocation,
            },
          }).catch(() => {});

          order.status = mappedStatus;
          if (shipment) shipment.status = mappedStatus;
        }
      }
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
