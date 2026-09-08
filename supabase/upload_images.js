/**
 * UPLOAD IMAGES TO SUPABASE STORAGE:
 * 1. Creates a public bucket 'products' if it does not exist
 * 2. Uploads all 164 images from /public/products/
 * 3. Updates product records in the Supabase PostgreSQL database to use the CDN URLs
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const mime = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const BUCKET_NAME = 'products';

async function main() {
  console.log('🚀 Starting Supabase Storage Image Upload...\n');

  // 1. Ensure bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('❌ Error listing buckets:', listError.message);
    return;
  }

  const existingBucket = buckets?.find((b) => b.name === BUCKET_NAME);
  if (!existingBucket) {
    console.log(`📦 Creating public bucket "${BUCKET_NAME}"...`);
    const { data: newBucket, error: createError } = await supabase.storage.createBucket(
      BUCKET_NAME,
      {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }
    );
    if (createError) {
      console.error(`❌ Failed to create bucket:`, createError.message);
      return;
    }
    console.log(`✅ Bucket "${BUCKET_NAME}" created successfully!\n`);
  } else {
    console.log(`✅ Bucket "${BUCKET_NAME}" already exists.\n`);
  }

  // 2. Read local product images
  const productsDir = path.join(__dirname, '..', 'public', 'products');
  if (!fs.existsSync(productsDir)) {
    console.error('❌ Directory public/products does not exist');
    return;
  }

  const files = fs.readdirSync(productsDir).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  });

  console.log(`📁 Found ${files.length} images to upload...\n`);

  let uploadedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(productsDir, file);
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(file).toLowerCase();
    const contentType = mime[ext] || 'image/jpeg';

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(file, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`  ❌ [${i + 1}/${files.length}] Failed to upload ${file}:`, uploadError.message);
      errorCount++;
    } else {
      uploadedCount++;
      if ((i + 1) % 20 === 0 || i === files.length - 1) {
        console.log(`  ✅ [${i + 1}/${files.length}] Uploaded: ${file}`);
      }
    }
  }

  console.log(`\n🎉 Upload Summary: ${uploadedCount} succeeded, ${errorCount} failed\n`);

  // 3. Update products in PostgreSQL database to reference Supabase Storage CDN URLs
  console.log('🔄 Updating product records in Supabase PostgreSQL with CDN URLs...');
  const { data: products, error: prodError } = await supabase.from('products').select('id, images');

  if (prodError) {
    console.error('❌ Failed to fetch products:', prodError.message);
    return;
  }

  let updatedProducts = 0;
  const baseUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/`;

  for (const product of products) {
    if (Array.isArray(product.images) && product.images.length > 0) {
      const newImages = product.images.map((img) => {
        if (typeof img === 'string') {
          // If already a full URL, keep it
          if (img.startsWith('http')) return img;
          // Extract filename
          const filename = path.basename(img);
          return `${baseUrl}${filename}`;
        }
        return img;
      });

      const { error: updateError } = await supabase
        .from('products')
        .update({ images: newImages })
        .eq('id', product.id);

      if (!updateError) {
        updatedProducts++;
      }
    }
  }

  console.log(`✅ Successfully updated ${updatedProducts} products with Supabase CDN URLs!`);
}

main().catch(console.error);
