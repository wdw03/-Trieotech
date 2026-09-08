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
      const tracking = await trackShipment(awb);
      return NextResponse.json({ tracking });
    }

    if (orderNumber) {
      // Get shiprocket order ID from our DB
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('order_number', orderNumber)
        .single();

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
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

      if (shipment.awb_number) {
        const tracking = await trackShipment(shipment.awb_number);
        return NextResponse.json({ tracking, shipment });
      }

      const tracking = await trackByOrderId(shipment.shiprocket_order_id);
      return NextResponse.json({ tracking, shipment });
    }

    return NextResponse.json({ error: 'Provide awb or orderNumber' }, { status: 400 });
  } catch (err) {
    console.error('Tracking error:', err);
    return NextResponse.json({ error: 'Tracking unavailable' }, { status: 500 });
  }
}
