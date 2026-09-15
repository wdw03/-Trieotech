export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const cleanName = (file.name || 'video.mp4')
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const fileName = `reels/${timestamp}-${cleanName}`;

    // Upload to reels bucket or banners bucket as fallback
    let uploadRes = await supabaseAdmin.storage
      .from('reels')
      .upload(fileName, buffer, {
        contentType: file.type || 'video/mp4',
        upsert: true,
      });

    let bucketName = 'reels';
    if (uploadRes.error) {
      // Try banners bucket if reels bucket does not exist
      uploadRes = await supabaseAdmin.storage
        .from('banners')
        .upload(fileName, buffer, {
          contentType: file.type || 'video/mp4',
          upsert: true,
        });
      bucketName = 'banners';
    }

    if (uploadRes.error) {
      return NextResponse.json({ error: uploadRes.error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return NextResponse.json({ success: true, url: publicUrl, fileName });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
