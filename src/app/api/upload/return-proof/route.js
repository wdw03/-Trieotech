export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// POST: Upload up to 3 return proof / damage photos
export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');

    // Also support single file field named 'file' or indexed 'file_0', etc.
    const allFiles = files.length > 0 ? files : [];
    if (allFiles.length === 0) {
      const single = formData.get('file');
      if (single && typeof single === 'object') {
        allFiles.push(single);
      }
    }

    // Check indexed keys
    for (let i = 0; i < 3; i++) {
      const indexed = formData.get(`file_${i}`);
      if (indexed && typeof indexed === 'object' && !allFiles.includes(indexed)) {
        allFiles.push(indexed);
      }
    }

    if (allFiles.length === 0) {
      return NextResponse.json({ error: 'No files provided for upload' }, { status: 400 });
    }

    if (allFiles.length > 3) {
      return NextResponse.json({ error: 'Maximum 3 proof photos are allowed per return claim' }, { status: 400 });
    }

    const uploadedUrls = [];

    for (let idx = 0; idx < allFiles.length; idx++) {
      const file = allFiles[idx];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Validate file size (max 5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File "${file.name || `Photo ${idx + 1}`}" exceeds the 5MB size limit.` },
          { status: 400 }
        );
      }

      // Clean file name
      const timestamp = Date.now();
      const randomSalt = Math.floor(Math.random() * 10000);
      const originalName = file.name || `damage_proof_${idx + 1}.jpg`;
      const cleanName = originalName
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      const fileName = `claim-${timestamp}-${randomSalt}-${cleanName}`;

      const contentType = file.type || 'image/jpeg';

      const { data, error } = await supabaseAdmin.storage
        .from('returns')
        .upload(fileName, buffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        console.error(`Upload error for photo ${idx + 1}:`, error);
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from('returns').getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length,
    });
  } catch (err) {
    console.error('Return proof upload error:', err);
    return NextResponse.json({ error: err.message || 'Failed to upload proof photos' }, { status: 500 });
  }
}
