export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { cancelShiprocketComplete } from '../../../../../lib/shiprocket';

/**
 * POST: Cancel shipment in Shiprocket & update local shipment status to 'cancelled'.
 * Preserves audit history and leaves the order active so Admin can either cancel
 * the order in step 2 or re-ship it.
 */
export async function POST(request) {
  try {
    const { orderId, shipmentId: directShipmentId, reason = 'Cancelled by admin' } = await request.json();

    if (!orderId && !directShipmentId) {
      return NextResponse.json({ error: 'orderId or shipmentId is required' }, { status: 400 });
    }

    let shipment;
    let targetOrderId = orderId;
    let orderNumber = null;
    let orderCurrentStatus = null;

    if (orderId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      if (!isUuid) {
        const { data: ord } = await supabaseAdmin
          .from('orders')
          .select('id, order_number, status')
          .eq('order_number', orderId)
          .maybeSingle();
        if (ord) {
          targetOrderId = ord.id;
          orderNumber = ord.order_number;
          orderCurrentStatus = ord.status;
        }
      } else {
        const { data: ord } = await supabaseAdmin
          .from('orders')
          .select('id, order_number, status')
          .eq('id', orderId)
          .maybeSingle();
        if (ord) {
          orderNumber = ord.order_number;
          orderCurrentStatus = ord.status;
        }
      }

      const { data } = await supabaseAdmin
        .from('shipments')
        .select('*')
        .eq('order_id', targetOrderId)
        .maybeSingle();
      shipment = data;
    } else {
      const { data } = await supabaseAdmin
        .from('shipments')
        .select('*')
        .eq('id', directShipmentId)
        .maybeSingle();
      shipment = data;
      if (shipment) {
        targetOrderId = shipment.order_id;
        const { data: ord } = await supabaseAdmin
          .from('orders')
          .select('id, order_number, status')
          .eq('id', targetOrderId)
          .maybeSingle();
        if (ord) {
          orderNumber = ord.order_number;
          orderCurrentStatus = ord.status;
        }
      }
    }

    if (!shipment) {
      return NextResponse.json(
        { error: 'No shipment record found to cancel for this order.' },
        { status: 404 }
      );
    }

    // 1. Cancel Shiprocket complete (AWB and/or Order)
    let shiprocketCancelResult = null;
    try {
      shiprocketCancelResult = await cancelShiprocketComplete({
        orderNumber,
        shiprocketOrderId: shipment.shiprocket_order_id,
        awbNumber: shipment.awb_number,
      });
    } catch (err) {
      console.warn('Shiprocket cancelShiprocketComplete notice:', err.message);
      shiprocketCancelResult = { error: err.message };
    }

    // 2. Update shipment record to 'cancelled'
    const nowIso = new Date().toISOString();
    const { data: updatedShipment, error: updateErr } = await supabaseAdmin
      .from('shipments')
      .update({
        status: 'cancelled',
        cancel_reason: reason,
        updated_at: nowIso,
      })
      .eq('id', shipment.id)
      .select()
      .single();

    if (updateErr) {
      throw new Error(`Failed to update shipment status: ${updateErr.message}`);
    }

    // 3. If order was 'packed', revert back to 'processing' since shipment was cancelled
    if (targetOrderId && orderCurrentStatus === 'packed') {
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'processing',
          updated_at: nowIso,
        })
        .eq('id', targetOrderId);

      await supabaseAdmin.from('order_status_history').insert({
        order_id: targetOrderId,
        from_status: 'packed',
        to_status: 'processing',
        source: 'admin',
        changed_by: 'admin',
        reason: `Shipment cancelled: ${reason}. Order status reverted to processing.`,
      }).catch(() => {});
    }

    // 4. Log in shipment_events
    await supabaseAdmin
      .from('shipment_events')
      .insert({
        shipment_id: shipment.id,
        status: 'cancelled',
        status_code: 'CANCELLED_BY_ADMIN',
        activity: `Shipment cancelled by admin: ${reason}`,
        location: 'Admin Panel',
        raw_data: { reason, shiprocketResult: shiprocketCancelResult },
      }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Shipment cancelled in Shiprocket and database successfully. You can now cancel the order or create a new shipment.',
      shipment: updatedShipment,
      shiprocketResult: shiprocketCancelResult,
    });
  } catch (err) {
    console.error('Shipment cancel error:', err);
    return NextResponse.json({ error: err.message || 'Failed to cancel shipment' }, { status: 500 });
  }
}

