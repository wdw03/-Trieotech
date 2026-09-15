export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

// POST: Upload video or image asset to Supabase Storage bucket 'reels'
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
    const originalName = file.name || 'reel-video.mp4';
    const cleanName = originalName
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const fileName = `${timestamp}-${cleanName}`;

    const contentType = file.type || (cleanName.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream');

    const { data, error } = await supabaseAdmin.storage
      .from('reels')
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('reels').getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      contentType,
      size: buffer.length,
    });
  } catch (err) {
    console.error('Reel media upload error:', err);
    return NextResponse.json({ error: err.message || 'Failed to upload video' }, { status: 500 });
  }
}
