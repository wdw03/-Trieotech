export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

const ALLOWED_STATUSES = new Set([
  'pending',
  'pickup_scheduled',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'rto_initiated',
  'rto_delivered',
  'cancelled',
  'lost',
  'shipped',
  'ndr',
  'failed_delivery',
  'reattempt_scheduled',
  'return_initiated',
  'return_received',
  'disposed',
]);

/**
 * POST / PATCH: Admin manual override for shipment status
 */
export async function POST(request) {
  try {
    const {
      shipmentId,
      orderId,
      status,
      note = 'Status updated by admin',
      location = 'Admin Action',
    } = await request.json();

    if (!status || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        {
          error: `Invalid status '${status}'. Allowed values are: ${Array.from(ALLOWED_STATUSES).join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (!shipmentId && !orderId) {
      return NextResponse.json({ error: 'shipmentId or orderId is required' }, { status: 400 });
    }

    let shipment;
    let targetOrderId = orderId;

    if (shipmentId) {
      const { data } = await supabaseAdmin.from('shipments').select('*').eq('id', shipmentId).maybeSingle();
      shipment = data;
      if (shipment) targetOrderId = shipment.order_id;
    } else {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      if (!isUuid) {
        const { data: ord } = await supabaseAdmin.from('orders').select('id').eq('order_number', orderId).maybeSingle();
        if (ord) targetOrderId = ord.id;
      }
      const { data } = await supabaseAdmin.from('shipments').select('*').eq('order_id', targetOrderId).maybeSingle();
      shipment = data;
    }

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const updatePayload = {
      status,
      updated_at: nowIso,
    };

    if (status === 'delivered') {
      updatePayload.delivered_at = nowIso;
    }

    const { data: updatedShipment, error: updateErr } = await supabaseAdmin
      .from('shipments')
      .update(updatePayload)
      .eq('id', shipment.id)
      .select()
      .single();

    if (updateErr) {
      throw new Error(`Failed to update shipment: ${updateErr.message}`);
    }

    // Sync order status
    let orderStatusMap = {
      in_transit: 'shipped',
      shipped: 'shipped',
      out_for_delivery: 'out_for_delivery',
      delivered: 'delivered',
      cancelled: 'cancelled',
      return_initiated: 'refunded',
    };

    const nextOrderStatus = orderStatusMap[status];
    if (nextOrderStatus && targetOrderId) {
      const orderUpdate = {
        status: nextOrderStatus,
        updated_at: nowIso,
      };
      if (status === 'delivered') {
        orderUpdate.delivered_at = nowIso;
        orderUpdate.payment_status = 'paid'; // COD collected or online confirmed
      }
      await supabaseAdmin.from('orders').update(orderUpdate).eq('id', targetOrderId);
    }

    // Log in shipment_events
    await supabaseAdmin.from('shipment_events').insert({
      shipment_id: shipment.id,
      status,
      status_code: status.toUpperCase(),
      activity: note,
      location,
      raw_data: { manualOverride: true, updatedBy: 'admin' },
    });

    return NextResponse.json({
      success: true,
      message: `Shipment status updated to '${status}'`,
      shipment: updatedShipment,
    });
  } catch (err) {
    console.error('Shipment status override error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
