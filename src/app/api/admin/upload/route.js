import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// POST: Upload image to Supabase Storage bucket 'products'
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Clean file name
    const timestamp = Date.now();
    const cleanName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const fileName = `${timestamp}-${cleanName}`;

    const contentType = file.type || 'image/jpeg';

    const { data, error } = await supabaseAdmin.storage
      .from('products')
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('products').getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
    });
  } catch (err) {
    console.error('Image upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
