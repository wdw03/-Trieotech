export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { cancelShipment, cancelShiprocketOrder } from '../../../../../lib/shiprocket';

/**
 * POST: Cancel shipment in Shiprocket & update local status to 'cancelled'
 * Preserves AWB numbers and audit history.
 */
export async function POST(request) {
  try {
    const { orderId, shipmentId: directShipmentId, reason = 'Cancelled by admin' } = await request.json();

    if (!orderId && !directShipmentId) {
      return NextResponse.json({ error: 'orderId or shipmentId is required' }, { status: 400 });
    }

    let shipment;
    let targetOrderId = orderId;

    if (orderId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      if (!isUuid) {
        const { data: ord } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('order_number', orderId)
          .maybeSingle();
        if (ord) targetOrderId = ord.id;
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
      if (shipment) targetOrderId = shipment.order_id;
    }

    if (!shipment) {
      // If no shipment record exists yet, just cancel the order directly
      if (targetOrderId) {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', targetOrderId);
      }
      return NextResponse.json({
        success: true,
        message: 'No shipment was found to cancel, order marked cancelled.',
      });
    }

    let shiprocketCancelResult = null;
    // 1. If AWB exists, cancel via AWB
    if (shipment.awb_number && !shipment.awb_number.startsWith('SR-')) {
      try {
        shiprocketCancelResult = await cancelShipment(shipment.awb_number);
      } catch (err) {
        console.warn('Shiprocket cancelShipment by AWB notice:', err.message);
      }
    }

    // 2. If Shiprocket order ID exists, attempt order cancellation
    if (shipment.shiprocket_order_id) {
      try {
        const orderCancel = await cancelShiprocketOrder(shipment.shiprocket_order_id);
        shiprocketCancelResult = shiprocketCancelResult || orderCancel;
      } catch (err) {
        console.warn('Shiprocket cancelOrder notice:', err.message);
      }
    }

    // 3. Update shipment record
    const { data: updatedShipment, error: updateErr } = await supabaseAdmin
      .from('shipments')
      .update({
        status: 'cancelled',
        cancel_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipment.id)
      .select()
      .single();

    if (updateErr) {
      throw new Error(`Failed to update shipment status: ${updateErr.message}`);
    }

    // 4. Update order status
    if (targetOrderId) {
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetOrderId);
    }

    // 5. Log in shipment_events
    await supabaseAdmin
      .from('shipment_events')
      .insert({
        shipment_id: shipment.id,
        status: 'cancelled',
        status_code: 'CANCELLED',
        activity: `Shipment cancelled: ${reason}`,
        location: 'Admin Panel',
        raw_data: { reason, shiprocketResult: shiprocketCancelResult },
      });

    return NextResponse.json({
      success: true,
      message: 'Shipment and order cancelled successfully',
      shipment: updatedShipment,
      shiprocketResult: shiprocketCancelResult,
    });
  } catch (err) {
    console.error('Shipment cancel error:', err);
    return NextResponse.json({ error: err.message || 'Failed to cancel shipment' }, { status: 500 });
  }
}
