export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { isCodAvailableForPincode, getCodSettings } from '../../../../lib/codPincodes';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const pincode = url.searchParams.get('pincode');

    if (!pincode) {
      return NextResponse.json({
        available: false,
        error: 'Pincode parameter required',
      }, { status: 400 });
    }

    const available = await isCodAvailableForPincode(pincode);
    const settings = await getCodSettings();

    // Check if there is specific info about this pincode
    const matchedEntry = settings.pincodes.find((item) => {
      const pin = typeof item === 'string' ? item : item?.pincode;
      return String(pin).trim() === String(pincode).trim();
    });

    return NextResponse.json({
      available,
      pincode: String(pincode).trim(),
      city: matchedEntry?.city || '',
      state: matchedEntry?.state || '',
      message: available
        ? `Cash on Delivery (COD) is available for PIN ${pincode}`
        : `Cash on Delivery (COD) is unavailable for PIN ${pincode}. Please choose online payment (UPI/Card).`,
    });
  } catch (err) {
    console.error('Error checking COD status:', err);
    return NextResponse.json({ available: false, error: 'Failed to verify COD' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const pincode = body?.pincode;

    if (!pincode) {
      return NextResponse.json({
        available: false,
        error: 'Pincode is required',
      }, { status: 400 });
    }

    const available = await isCodAvailableForPincode(pincode);
    return NextResponse.json({
      available,
      pincode: String(pincode).trim(),
      message: available
        ? `Cash on Delivery (COD) is available for PIN ${pincode}`
        : `Cash on Delivery (COD) is unavailable for PIN ${pincode}. Please choose online payment (UPI/Card).`,
    });
  } catch (err) {
    console.error('Error checking COD status:', err);
    return NextResponse.json({ available: false, error: 'Failed to verify COD' }, { status: 500 });
  }
}
