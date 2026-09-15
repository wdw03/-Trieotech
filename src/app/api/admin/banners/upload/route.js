export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

// POST: Upload banner photo to Supabase 'banners' storage bucket
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const timestamp = Date.now();
    const cleanFileName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const storagePath = `banners/${timestamp}-${cleanFileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    let targetBucket = 'banners';
    let { error: uploadError } = await supabaseAdmin.storage
      .from(targetBucket)
      .upload(storagePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    // Fallback to 'products' bucket if 'banners' fails
    if (uploadError) {
      console.warn('Storage upload error in banners bucket, trying products bucket:', uploadError.message);
      targetBucket = 'products';
      const fallbackResult = await supabaseAdmin.storage
        .from(targetBucket)
        .upload(storagePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });
      uploadError = fallbackResult.error;
    }

    if (uploadError) {
      console.error('Storage upload error in fallback bucket:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(targetBucket).getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: storagePath,
      bucket: targetBucket,
    });
  } catch (err) {
    console.error('Banners upload API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
