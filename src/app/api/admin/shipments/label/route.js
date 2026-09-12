export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { generateLabel } from '../../../../../lib/shiprocket';

/**
 * GET: Retrieve label URLs or redirect to label
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId') || searchParams.get('orderNumber');
    const type = searchParams.get('type') || 'both'; // 'custom' | 'shiprocket' | 'both'

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let targetOrderId = orderId;
    let orderNumber = orderId;

    if (!isUuid) {
      const { data: ord } = await supabaseAdmin
        .from('orders')
        .select('id, order_number')
        .eq('order_number', orderId)
        .maybeSingle();
      if (ord) {
        targetOrderId = ord.id;
        orderNumber = ord.order_number;
      }
    } else {
      const { data: ord } = await supabaseAdmin
        .from('orders')
        .select('id, order_number')
        .eq('id', orderId)
        .maybeSingle();
      if (ord) orderNumber = ord.order_number;
    }

    const { data: shipment } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .eq('order_id', targetOrderId)
      .maybeSingle();

    const customLabelUrl = `/api/admin/shipments/label/custom?orderId=${encodeURIComponent(orderNumber)}`;

    if (type === 'custom') {
      return NextResponse.redirect(new URL(customLabelUrl, request.url));
    }

    if (type === 'shiprocket' && shipment?.label_url) {
      return NextResponse.redirect(new URL(shipment.label_url, request.url));
    }

    return NextResponse.json({
      success: true,
      labelUrl: shipment?.label_url || null,
      customLabelUrl,
      awb: shipment?.awb_number || null,
      status: shipment?.status || 'pending',
    });
  } catch (err) {
    console.error('Label GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST: Generate/fetch Shiprocket official shipping label PDF for an order
 * Returns both official Shiprocket PDF labelUrl and custom HTML labelUrl
 */
export async function POST(request) {
  try {
    const { orderId, shipmentId: directShipmentId, type = 'both' } = await request.json();

    if (!orderId && !directShipmentId) {
      return NextResponse.json({ error: 'orderId or shipmentId is required' }, { status: 400 });
    }

    // 1. Fetch shipment record (support both UUID and order_number)
    let shipment;
    let orderNumber = '';

    if (orderId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      let targetOrderId = orderId;
      if (!isUuid) {
        const { data: ord } = await supabaseAdmin
          .from('orders')
          .select('id, order_number')
          .eq('order_number', orderId)
          .maybeSingle();
        if (ord) {
          targetOrderId = ord.id;
          orderNumber = ord.order_number;
        }
      } else {
        const { data: ord } = await supabaseAdmin
          .from('orders')
          .select('id, order_number')
          .eq('id', orderId)
          .maybeSingle();
        if (ord) orderNumber = ord.order_number;
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
        .select('*, orders(order_number)')
        .eq('id', directShipmentId)
        .maybeSingle();
      shipment = data;
      orderNumber = shipment?.orders?.order_number || '';
    }

    if (!shipment) {
      return NextResponse.json({ error: 'No shipment found' }, { status: 404 });
    }

    const customLabelUrl = `/api/admin/shipments/label/custom?orderId=${encodeURIComponent(orderNumber || shipment.order_id)}`;

    // 2. If label_url is already cached, return it with customLabelUrl
    if (shipment.label_url && shipment.label_url.startsWith('http')) {
      return NextResponse.json({
        success: true,
        cached: true,
        labelUrl: shipment.label_url,
        customLabelUrl,
      });
    }

    if (!shipment.shiprocket_shipment_id) {
      // If Shiprocket shipment hasn't been created yet, we can still provide custom label
      return NextResponse.json({
        success: true,
        cached: false,
        labelUrl: null,
        customLabelUrl,
        warning: 'Shiprocket shipment ID not yet assigned. Official Shiprocket PDF requires creating shipment first.',
      });
    }

    // 3. Call Shiprocket to generate label
    let labelUrl = '';
    try {
      const labelResult = await generateLabel(shipment.shiprocket_shipment_id);
      labelUrl = labelResult?.label_url || labelResult?.response?.label_url || '';
    } catch (err) {
      console.warn('Shiprocket generateLabel call error:', err.message);
    }

    // 4. Cache label_url in DB if obtained
    if (labelUrl) {
      await supabaseAdmin
        .from('shipments')
        .update({
          label_url: labelUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', shipment.id);
    }

    return NextResponse.json({
      success: true,
      labelUrl: labelUrl || null,
      customLabelUrl,
    });
  } catch (err) {
    console.error('Generate label error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate label' }, { status: 500 });
  }
}
