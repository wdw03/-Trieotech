export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

// POST: Upload blog image to Supabase Storage bucket 'blog-images'
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const altText = formData.get('alt') || '';

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
      .replace(/(^-|-$)+/g, '') || 'blog-image';
    const fileName = `blog/${timestamp}-${cleanName}`;

    const contentType = file.type || 'image/jpeg';

    // Try blog-images bucket first, fallback to products bucket
    let bucketName = 'blog-images';
    let uploadResult = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, buffer, { contentType, upsert: true });

    // If blog-images bucket doesn't exist, use products bucket
    if (uploadResult.error && uploadResult.error.message?.includes('not found')) {
      bucketName = 'products';
      uploadResult = await supabaseAdmin.storage
        .from(bucketName)
        .upload(fileName, buffer, { contentType, upsert: true });
    }

    if (uploadResult.error) throw uploadResult.error;

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(bucketName).getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      alt: altText,
      bucket: bucketName,
    });
  } catch (err) {
    console.error('Blog image upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
