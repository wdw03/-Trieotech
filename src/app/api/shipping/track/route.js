export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { trackShipment, trackByOrderId } from '../../../../lib/shiprocket';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// GET: Track a shipment
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const awb = searchParams.get('awb');
    const orderNumber = searchParams.get('orderNumber');

    if (awb) {
      try {
        const tracking = await trackShipment(awb);
        return NextResponse.json({ tracking });
      } catch (shipErr) {
        // AWB was not found or Shiprocket unavailable
        return NextResponse.json({
          tracking: null,
          message: 'No shipment details found for this AWB number'
        });
      }
    }

    if (orderNumber) {
      // Get shiprocket order ID from our DB
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('order_number', orderNumber)
        .single();

      if (!order) {
        return NextResponse.json({ tracking: null, error: 'Order not found' }, { status: 404 });
      }

      const { data: shipment } = await supabaseAdmin
        .from('shipments')
        .select('*')
        .eq('order_id', order.id)
        .single();

      if (!shipment || !shipment.shiprocket_order_id) {
        return NextResponse.json({
          tracking: { status: 'pending', message: 'Shipment not yet created' },
        });
      }

      try {
        let tracking = null;
        if (shipment.awb_number) {
          tracking = await trackShipment(shipment.awb_number).catch(() => null);
        }
        if (!tracking && shipment.shiprocket_order_id) {
          tracking = await trackByOrderId(shipment.shiprocket_order_id).catch(() => null);
        }

        const { data: events } = await supabaseAdmin
          .from('shipment_events')
          .select('status, activity, location, event_time')
          .eq('shipment_id', shipment.id)
          .order('event_time', { ascending: false });

        return NextResponse.json({
          tracking: tracking || { status: shipment.status, message: 'Shipment in progress' },
          shipment,
          events: events || [],
        });
      } catch (shipErr) {
        return NextResponse.json({
          tracking: { status: shipment.status || 'processing', message: 'Shipment is being prepared by workshop' },
          shipment,
        });
      }
    }

    return NextResponse.json({ tracking: null, error: 'Provide awb or orderNumber' }, { status: 400 });
  } catch (err) {
    console.warn('Tracking query error:', err);
    return NextResponse.json({ tracking: null, message: 'Tracking service currently unavailable' });
  }
}
