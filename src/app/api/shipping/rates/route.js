export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { calculateCartShipping } from '../../../../lib/shippingEngine';
import { calculateDynamicShipping } from '../../../../lib/shiprocket';

// GET: Calculate dynamic shipping rates for a pincode via query params
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const deliveryPincode =
      searchParams.get('pincode') ||
      searchParams.get('deliveryPincode') ||
      searchParams.get('delivery_postcode');
    const quantity = parseInt(searchParams.get('quantity') || '1', 10);
    const cod = searchParams.get('cod') === '1' || searchParams.get('cod') === 'true';

    if (!deliveryPincode) {
      return NextResponse.json({ error: 'Delivery pincode required' }, { status: 400 });
    }

    const calculation = await calculateCartShipping({
      items: [{ quantity: Math.max(1, quantity) }],
      pincode: deliveryPincode,
      cod,
    });

    return NextResponse.json(calculation);
  } catch (err) {
    console.error('Shipping rates GET error:', err);
    return NextResponse.json(
      {
        available: true,
        fallback: true,
        shippingFee: 70,
        standardRate: 70,
        expressRate: 110,
        standardCourier: 'Standard Surface Shipping',
        expressCourier: 'BlueDart Air Express',
      },
      { status: 200 }
    );
  }
}

// POST: Calculate dynamic shipping rates for a pincode via JSON body
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const deliveryPincode =
      body.deliveryPincode || body.pincode || body.delivery_postcode || body.zip;
    const items = Array.isArray(body.items) && body.items.length > 0
      ? body.items
      : [{ quantity: Math.max(1, parseInt(body.quantity || '1', 10)) }];
    const cod = !!body.cod;
    const deliveryMethod = body.deliveryMethod || 'standard';

    if (!deliveryPincode && (!items || items.length === 0)) {
      return NextResponse.json({ error: 'Delivery pincode or items required' }, { status: 400 });
    }

    const calculation = await calculateCartShipping({
      items,
      pincode: deliveryPincode,
      deliveryMethod,
      cod,
    });

    return NextResponse.json(calculation);
  } catch (err) {
    console.error('Shipping rates POST error:', err);
    return NextResponse.json(
      {
        available: true,
        fallback: true,
        shippingFee: 70,
        standardRate: 70,
        expressRate: 110,
        standardCourier: 'Standard Surface Shipping',
        expressCourier: 'BlueDart Air Express',
      },
      { status: 200 }
    );
  }
}
