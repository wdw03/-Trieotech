export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getShippingRates } from '../../../../lib/shiprocket';

// POST: Calculate shipping rates for a pincode
export async function POST(request) {
  try {
    const { deliveryPincode, weight, cod } = await request.json();

    if (!deliveryPincode) {
      return NextResponse.json({ error: 'Delivery pincode required' }, { status: 400 });
    }

    const rates = await getShippingRates({
      deliveryPincode,
      weight: weight || 0.5,
      cod: cod || false,
    });

    return NextResponse.json({ rates });
  } catch (err) {
    console.error('Shipping rates error:', err);
    // Fallback rates if Shiprocket is unavailable
    return NextResponse.json({
      rates: {
        available: true,
        estimated_delivery_days: 5,
        fallback: true,
      },
    });
  }
}
