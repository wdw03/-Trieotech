export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { trackShipment, trackByOrderId } from '../../../../lib/shiprocket';

// GET: Fetch single order details with real tracking data
export async function GET(request, { params }) {
  try {
    let user = null;
    try {
      const supabase = await createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      user = u;
    } catch (_) {}

    const { orderId } = await params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (*),
        payments (*),
        shipments (*)
      `);

    if (isUuid) {
      query = query.eq('id', orderId);
    } else {
      query = query.eq('order_number', orderId);
    }

    const { data: order, error } = await query.maybeSingle();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If order has user_id, check that authenticated user matches (or allow if unauthenticated guest tracking with order number)
    if (order.user_id && user && order.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // If order is an incomplete / abandoned checkout (pending_payment or payment_failed), do not expose as a confirmed order
    const currentStatus = (order.status || 'pending').toLowerCase();
    if (['pending_payment', 'payment_failed', 'draft'].includes(currentStatus)) {
      return NextResponse.json({
        success: false,
        error: 'Order payment is incomplete or pending. This order is not yet confirmed.',
        isPendingPayment: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          total: order.total,
          payment_method: order.payment_method,
          payment_status: order.payment_status || 'pending',
          created_at: order.created_at,
        },
      }, { status: 402 });
    }

    const shipment = Array.isArray(order.shipments) ? order.shipments[0] : order.shipments;
    let liveScans = [];
    let auditEvents = [];
    let currentLocation = '';
    let currentActivity = '';

    if (shipment?.id) {
      // 1. Fetch DB audit events
      const { data: events } = await supabaseAdmin
        .from('shipment_events')
        .select('*')
        .eq('shipment_id', shipment.id)
        .order('event_time', { ascending: false });
      auditEvents = events || [];

      if (auditEvents.length > 0) {
        currentLocation = auditEvents[0].location || '';
        currentActivity = auditEvents[0].activity || '';
      }

      // 2. Fetch live carrier tracking if AWB exists
      const awb = shipment.awb_number;
      if (awb && !awb.startsWith('SR-')) {
        try {
          const liveRes = await trackShipment(awb);
          const tracks = liveRes?.tracking_data?.shipment_track_activities || liveRes?.tracking_data?.shipment_track;
          if (Array.isArray(tracks) && tracks.length > 0) {
            liveScans = tracks;
            currentLocation = tracks[0].location || tracks[0].city || currentLocation;
            currentActivity = tracks[0].activity || tracks[0]['sr-status-label'] || currentActivity;
          }
        } catch (shipErr) {
          console.warn('Live tracking lookup notice:', shipErr.message);
        }
      } else if (shipment.shiprocket_order_id) {
        try {
          const liveRes = await trackByOrderId(shipment.shiprocket_order_id);
          const tracks = liveRes?.tracking_data?.shipment_track_activities || liveRes?.tracking_data?.shipment_track;
          if (Array.isArray(tracks) && tracks.length > 0) {
            liveScans = tracks;
            currentLocation = tracks[0].location || tracks[0].city || currentLocation;
            currentActivity = tracks[0].activity || tracks[0]['sr-status-label'] || currentActivity;
          }
        } catch (_) {}
      }
    }

    const tracking = {
      carrier: shipment?.courier_name || 'Shiprocket Express',
      awb: shipment?.awb_number || '',
      routingCode: shipment?.routing_code || '',
      status: shipment?.status || order.status || 'pending',
      currentLocation: currentLocation || 'Warehouse Hub, Faridabad',
      currentActivity: currentActivity || (order.status === 'delivered' ? 'Delivered safely' : order.status === 'shipped' ? 'In transit to delivery hub' : 'Preparing order for pickup'),
      etd: shipment?.estimated_delivery || order.estimated_delivery || null,
      deliveredAt: shipment?.delivered_at || order.delivered_at || null,
      liveScans,
      auditEvents,
    };

    // 3. Fetch status history audit log
    const { data: statusHistory } = await supabaseAdmin
      .from('order_status_history')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false });

    const cancellable = ['pending', 'confirmed', 'processing'].includes(currentStatus);

    return NextResponse.json({
      success: true,
      order,
      tracking,
      statusHistory: statusHistory || [],
      cancellation: {
        cancellable,
        reason: cancellable
          ? 'Order can be cancelled before packing/logistics handover.'
          : 'Order has reached packing/logistics dispatch stage. Cancellation is locked.',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
