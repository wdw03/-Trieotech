export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import {
  getCodSettings,
  saveCodSettings,
  addCodPincodes,
  removeCodPincode,
} from '../../../../lib/codPincodes';

export async function GET() {
  try {
    const settings = await getCodSettings();
    return NextResponse.json({
      success: true,
      cod_enabled_globally: settings.cod_enabled_globally,
      pincodes: settings.pincodes,
      count: settings.pincodes.length,
      updated_at: settings.updated_at,
    });
  } catch (err) {
    console.error('Error fetching admin COD pincodes:', err);
    return NextResponse.json({ error: 'Failed to fetch COD pincodes' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    let entriesToAdd = [];

    // Support single pincode object or bulk array
    if (Array.isArray(body.pincodes)) {
      entriesToAdd = body.pincodes.map((item) => {
        if (typeof item === 'string') return { pincode: item };
        return item;
      });
    } else if (body.pincode) {
      entriesToAdd = [{
        pincode: body.pincode,
        city: body.city || '',
        state: body.state || '',
        notes: body.notes || '',
      }];
    } else {
      return NextResponse.json({ error: 'Please provide pincode or list of pincodes' }, { status: 400 });
    }

    const updated = await addCodPincodes(entriesToAdd);
    return NextResponse.json({
      success: true,
      message: `Successfully added ${entriesToAdd.length} COD pincode(s)`,
      pincodes: updated.pincodes,
      count: updated.pincodes.length,
    });
  } catch (err) {
    console.error('Error adding COD pincodes:', err);
    return NextResponse.json({ error: 'Failed to add COD pincodes' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    let pincodeToDelete = null;

    // Check query param first
    const url = new URL(request.url);
    pincodeToDelete = url.searchParams.get('pincode');

    // Or check request body
    if (!pincodeToDelete) {
      try {
        const body = await request.json();
        pincodeToDelete = body.pincode;
      } catch (_) {}
    }

    if (!pincodeToDelete) {
      return NextResponse.json({ error: 'Pincode is required to delete' }, { status: 400 });
    }

    const updated = await removeCodPincode(pincodeToDelete);
    return NextResponse.json({
      success: true,
      message: `Removed PIN ${pincodeToDelete} from COD allowed list`,
      pincodes: updated.pincodes,
      count: updated.pincodes.length,
    });
  } catch (err) {
    console.error('Error deleting COD pincode:', err);
    return NextResponse.json({ error: 'Failed to remove COD pincode' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const settings = await getCodSettings();

    if (typeof body.cod_enabled_globally === 'boolean') {
      settings.cod_enabled_globally = body.cod_enabled_globally;
    }

    const updated = await saveCodSettings(settings);
    return NextResponse.json({
      success: true,
      cod_enabled_globally: updated.cod_enabled_globally,
      message: updated.cod_enabled_globally
        ? 'COD is now enabled globally for all addresses'
        : 'COD is restricted only to allowed pincodes (disabled by default)',
    });
  } catch (err) {
    console.error('Error updating COD global status:', err);
    return NextResponse.json({ error: 'Failed to update COD configuration' }, { status: 500 });
  }
}
