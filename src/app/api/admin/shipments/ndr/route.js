export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { getShiprocketNDR, ndrReattempt } from '../../../../../lib/shiprocket';

/**
 * GET: Retrieve NDR details for an AWB or all active NDR shipments
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const awb = searchParams.get('awb');
    const orderId = searchParams.get('orderId');

    let targetAwb = awb;

    if (!targetAwb && orderId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      let query = supabaseAdmin.from('shipments').select('awb_number, ndr_reason, ndr_action, status').maybeSingle();
      if (isUuid) {
        query = query.eq('order_id', orderId);
      } else {
        const { data: ord } = await supabaseAdmin.from('orders').select('id').eq('order_number', orderId).maybeSingle();
        if (ord) query = query.eq('order_id', ord.id);
      }
      const { data: ship } = await query;
      if (ship?.awb_number) targetAwb = ship.awb_number;
    }

    let shiprocketNdr = null;
    try {
      shiprocketNdr = await getShiprocketNDR(targetAwb);
    } catch (apiErr) {
      console.warn('Shiprocket NDR query notice:', apiErr.message);
    }

    // Also get local NDR records
    let localShipments = [];
    if (targetAwb) {
      const { data } = await supabaseAdmin.from('shipments').select('*').eq('awb_number', targetAwb);
      localShipments = data || [];
    } else {
      const { data } = await supabaseAdmin
        .from('shipments')
        .select('*, orders(order_number, total, shipping_address)')
        .in('status', ['ndr', 'failed_delivery', 'reattempt_scheduled']);
      localShipments = data || [];
    }

    return NextResponse.json({
      success: true,
      awb: targetAwb || null,
      shiprocketData: shiprocketNdr,
      localShipments,
    });
  } catch (err) {
    console.error('NDR GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST: Take NDR action (reattempt, RTO, or cancel)
 */
export async function POST(request) {
  try {
    const {
      awb,
      orderId,
      action = 'reattempt', // 'reattempt' | 'rto' | 'cancel'
      comments = 'Requested reattempt by seller',
      deferredDate = '',
    } = await request.json();

    let targetAwb = awb;
    let targetShipment = null;

    if (orderId && !targetAwb) {
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
        targetShipment = ship;
        targetAwb = ship.awb_number;
      }
    } else if (targetAwb) {
      const { data: ship } = await supabaseAdmin
        .from('shipments')
        .select('*')
        .eq('awb_number', targetAwb)
        .maybeSingle();
      targetShipment = ship;
    }

    if (!targetAwb) {
      return NextResponse.json({ error: 'AWB number or valid orderId is required' }, { status: 400 });
    }

    // 1. Submit action to Shiprocket
    let shiprocketResult = null;
    try {
      shiprocketResult = await ndrReattempt({
        awb: targetAwb,
        action,
        comments,
        deferredDate,
      });
    } catch (err) {
      console.warn('Shiprocket ndrReattempt call notice:', err.message);
    }

    // 2. Map new status
    let nextStatus = 'reattempt_scheduled';
    if (action === 'rto') nextStatus = 'rto_initiated';
    if (action === 'cancel') nextStatus = 'cancelled';

    // 3. Update shipment record
    if (targetShipment) {
      await supabaseAdmin
        .from('shipments')
        .update({
          status: nextStatus,
          ndr_action: `${action}: ${comments}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetShipment.id);

      // Log event
      await supabaseAdmin.from('shipment_events').insert({
        shipment_id: targetShipment.id,
        status: nextStatus,
        status_code: 'NDR_ACTION',
        activity: `NDR Action applied: ${action.toUpperCase()} (${comments})`,
        location: 'Admin Panel',
        raw_data: { action, comments, deferredDate, shiprocketResult },
      });
    }

    return NextResponse.json({
      success: true,
      action,
      nextStatus,
      message: `NDR action '${action}' processed successfully`,
      shiprocketResult,
    });
  } catch (err) {
    console.error('NDR action error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit NDR action' }, { status: 500 });
  }
}
