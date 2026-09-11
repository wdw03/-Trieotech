export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { calculateCartShipping } from '../../../../lib/shippingEngine';

/**
 * POST /api/shipping/calculate
 * Calculates live production shipping rates scaled by item quantities.
 *
 * Payload:
 * {
 *   items: [{ productId, quantity, price, name }],
 *   pincode: '302003',
 *   deliveryMethod: 'standard' | 'express',
 *   cod: false
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { items = [], pincode = '', deliveryMethod = 'standard', cod = false } = body;

    const calculation = await calculateCartShipping({
      items,
      pincode,
      deliveryMethod,
      cod,
    });

    return NextResponse.json(calculation, { status: 200 });
  } catch (err) {
    console.error('Shipping calculation error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate shipping charges',
        shippingFee: 70,
        standardRate: 70,
        expressRate: 110,
        itemCount: 1,
        itemsBreakdown: [],
      },
      { status: 500 }
    );
  }
}
