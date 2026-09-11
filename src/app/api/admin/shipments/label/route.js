export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { generateLabel } from '../../../../../lib/shiprocket';

/**
 * POST: Generate/fetch Shiprocket official shipping label PDF for an order
 * Returns the label URL which can be opened in a new browser tab
 */
export async function POST(request) {
  try {
    const { orderId, shipmentId: directShipmentId } = await request.json();

    if (!orderId && !directShipmentId) {
      return NextResponse.json({ error: 'orderId or shipmentId is required' }, { status: 400 });
    }

    // 1. Fetch shipment record
    let shipment;
    if (orderId) {
      const { data } = await supabaseAdmin
        .from('shipments')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();
      shipment = data;
    } else {
      const { data } = await supabaseAdmin
        .from('shipments')
        .select('*')
        .eq('id', directShipmentId)
        .maybeSingle();
      shipment = data;
    }

    if (!shipment) {
      return NextResponse.json({ error: 'No shipment found' }, { status: 404 });
    }

    // 2. If label_url is already cached, return it
    if (shipment.label_url && shipment.label_url.startsWith('http')) {
      return NextResponse.json({
        success: true,
        cached: true,
        labelUrl: shipment.label_url,
      });
    }

    if (!shipment.shiprocket_shipment_id) {
      return NextResponse.json(
        { error: 'No Shiprocket shipment ID. Create shipment first.' },
        { status: 400 }
      );
    }

    // 3. Call Shiprocket to generate label
    const labelResult = await generateLabel(shipment.shiprocket_shipment_id);

    const labelUrl = labelResult?.label_url || labelResult?.response?.label_url || '';

    if (!labelUrl) {
      // Sometimes Shiprocket returns the label in a different format
      console.warn('Shiprocket label response:', JSON.stringify(labelResult));
      return NextResponse.json(
        { error: 'Label not available yet. AWB assignment may be pending.', rawResponse: labelResult },
        { status: 502 }
      );
    }

    // 4. Cache label_url in DB
    await supabaseAdmin
      .from('shipments')
      .update({
        label_url: labelUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipment.id);

    return NextResponse.json({
      success: true,
      labelUrl,
    });
  } catch (err) {
    console.error('Generate label error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate label' }, { status: 500 });
  }
}
