export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { generateManifest, printManifest } from '../../../../../lib/shiprocket';

/**
 * POST: Generate or print manifest for shipments
 */
export async function POST(request) {
  try {
    const { shipmentIds, orderIds, orderId } = await request.json();

    let targetShipmentIds = shipmentIds ? (Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds]) : [];
    let targetOrderIds = orderIds ? (Array.isArray(orderIds) ? orderIds : [orderIds]) : [];

    // If single orderId passed
    if (orderId && targetShipmentIds.length === 0) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      let query = supabaseAdmin.from('shipments').select('*').maybeSingle();
      if (isUuid) {
        query = query.eq('order_id', orderId);
      } else {
        const { data: ord } = await supabaseAdmin.from('orders').select('id').eq('order_number', orderId).maybeSingle();
        if (ord) query = query.eq('order_id', ord.id);
      }
      const { data: ship } = await query;
      if (ship) {
        if (ship.manifest_url && ship.manifest_url.startsWith('http')) {
          return NextResponse.json({
            success: true,
            cached: true,
            manifestUrl: ship.manifest_url,
          });
        }
        if (ship.shiprocket_shipment_id) targetShipmentIds.push(ship.shiprocket_shipment_id);
        if (ship.shiprocket_order_id) targetOrderIds.push(ship.shiprocket_order_id);
      }
    }

    if (targetShipmentIds.length === 0 && targetOrderIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid Shiprocket shipment ID or order ID provided for manifest generation.' },
        { status: 400 }
      );
    }

    let manifestResult = null;
    let manifestUrl = '';

    if (targetShipmentIds.length > 0) {
      try {
        manifestResult = await generateManifest(targetShipmentIds);
        manifestUrl = manifestResult?.manifest_url || manifestResult?.response?.manifest_url || '';
      } catch (err) {
        console.warn('generateManifest notice:', err.message);
      }
    }

    if (!manifestUrl && targetOrderIds.length > 0) {
      try {
        const printResult = await printManifest(targetOrderIds);
        manifestUrl = printResult?.manifest_url || printResult?.response?.manifest_url || '';
      } catch (err) {
        console.warn('printManifest notice:', err.message);
      }
    }

    if (!manifestUrl) {
      return NextResponse.json({
        success: false,
        error: 'Manifest not available yet. Ensure pickup has been requested or courier is assigned.',
        raw: manifestResult,
      }, { status: 422 });
    }

    // Cache manifest_url in shipments table
    if (orderId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      let targetId = orderId;
      if (!isUuid) {
        const { data: ord } = await supabaseAdmin.from('orders').select('id').eq('order_number', orderId).maybeSingle();
        if (ord) targetId = ord.id;
      }
      await supabaseAdmin
        .from('shipments')
        .update({ manifest_url: manifestUrl, updated_at: new Date().toISOString() })
        .eq('order_id', targetId);
    }

    return NextResponse.json({
      success: true,
      manifestUrl,
      raw: manifestResult,
    });
  } catch (err) {
    console.error('Manifest generation error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate manifest' }, { status: 500 });
  }
}
