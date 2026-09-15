export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

// POST: Upload category image / banner to Supabase 'products' storage bucket
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
    const storagePath = `categories/${timestamp}-${cleanFileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from('products')
      .upload(storagePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error in products bucket:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('products').getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: storagePath,
    });
  } catch (err) {
    console.error('Category upload API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
