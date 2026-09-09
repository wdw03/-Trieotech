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
        if (shipment.awb_number) {
          const tracking = await trackShipment(shipment.awb_number);
          return NextResponse.json({ tracking, shipment });
        }

        const tracking = await trackByOrderId(shipment.shiprocket_order_id);
        return NextResponse.json({ tracking, shipment });
      } catch (shipErr) {
        return NextResponse.json({
          tracking: { status: 'processing', message: 'Shipment is being prepared by workshop' },
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
