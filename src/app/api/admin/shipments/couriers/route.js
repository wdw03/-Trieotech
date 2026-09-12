export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { getAvailableCouriers, calculateDynamicShipping, getShippingRates } from '../../../../../lib/shiprocket';

/**
 * GET or POST: List available courier companies for an order or destination pincode
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId') || searchParams.get('orderNumber');
    const pincode = searchParams.get('pincode');

    return await handleCourierLookup({ orderId, pincode, request });
  } catch (err) {
    console.error('Couriers GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, pincode } = body;
    return await handleCourierLookup({ orderId, pincode, body });
  } catch (err) {
    console.error('Couriers POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handleCourierLookup({ orderId, pincode }) {
  let targetPincode = pincode;
  let isCod = false;
  let weight = 0.5;
  let shiprocketOrderId = null;

  if (orderId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let orderQuery = supabaseAdmin.from('orders').select('*, shipments(*)').maybeSingle();
    if (isUuid) {
      orderQuery = orderQuery.eq('id', orderId);
    } else {
      orderQuery = orderQuery.eq('order_number', orderId);
    }

    const { data: order } = await orderQuery;
    if (order) {
      targetPincode = targetPincode || order.shipping_address?.pincode || order.shipping_address?.zip;
      isCod = order.payment_method === 'cod';
      const shipment = Array.isArray(order.shipments) ? order.shipments[0] : order.shipments;
      if (shipment?.shiprocket_order_id) {
        shiprocketOrderId = shipment.shiprocket_order_id;
      }
      if (shipment?.weight) {
        weight = shipment.weight;
      }
    }
  }

  // 1. If we have a Shiprocket Order ID, try official courierListWithCounts
  if (shiprocketOrderId) {
    try {
      const courierRes = await getAvailableCouriers(shiprocketOrderId);
      const courierData = courierRes?.data?.available_courier_companies || courierRes?.available_courier_companies;
      if (Array.isArray(courierData) && courierData.length > 0) {
        return NextResponse.json({
          success: true,
          source: 'order_couriers',
          shiprocketOrderId,
          couriers: courierData.map((c) => ({
            id: c.courier_company_id,
            name: c.courier_name,
            rate: Math.round(Number(c.rate || c.freight_charge || 0)),
            freightCharge: Number(c.freight_charge || c.rate || 0),
            etd: c.etd || `${c.estimated_delivery_days || 4} days`,
            rating: c.rating || '4.5',
            cod: c.cod === 1,
            isRecommended: c.is_recommended === 1,
          })),
        });
      }
    } catch (err) {
      console.warn('getAvailableCouriers error, falling back to serviceability lookup:', err.message);
    }
  }

  // 2. Serviceability lookup by destination pincode
  if (!targetPincode) {
    return NextResponse.json(
      { error: 'Could not determine delivery pincode from order or query params' },
      { status: 400 }
    );
  }

  try {
    const rateData = await getShippingRates({
      pickupPincode: '121005',
      deliveryPincode: targetPincode,
      weight,
      cod: isCod,
    });

    const couriers = rateData?.data?.available_courier_companies || [];
    const recommendedId = rateData?.data?.recommended_courier_company_id;

    return NextResponse.json({
      success: true,
      source: 'serviceability_lookup',
      pincode: targetPincode,
      isCod,
      recommendedCourierId: recommendedId,
      couriers: couriers.map((c) => ({
        id: c.courier_company_id,
        name: c.courier_name,
        rate: Math.round(Number(c.rate)),
        freightCharge: Number(c.freight_charge || c.rate),
        etd: c.etd || `${c.estimated_delivery_days || 4} days`,
        rating: c.rating || '4.5',
        cod: c.cod === 1,
        isRecommended: c.courier_company_id === recommendedId,
      })),
    });
  } catch (lookupErr) {
    // Fallback static options if API rate limits
    const fallbackCalc = await calculateDynamicShipping(targetPincode, { cod: isCod, weight });
    return NextResponse.json({
      success: true,
      source: 'fallback_estimation',
      pincode: targetPincode,
      couriers: fallbackCalc.couriers || [
        { id: 1, name: 'Delhivery Surface', rate: 70, etd: '5-7 days', cod: true },
        { id: 2, name: 'BlueDart Air Express', rate: 110, etd: '2-3 days', cod: true },
      ],
    });
  }
}
