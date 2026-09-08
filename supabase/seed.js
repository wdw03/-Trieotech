/**
 * SEED SCRIPT: Migrates static product/category/review data to Supabase
 * 
 * Run this ONCE after creating the database schema:
 *   node supabase/seed.js
 * 
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  console.log('🌱 Starting seed...\n');

  // ── 1. Load static data files ──
  // We need to eval the JS files since they use `export` / `const` syntax
  const productsFile = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'data', 'products.js'),
    'utf-8'
  );
  const categoriesFile = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'data', 'categories.js'),
    'utf-8'
  );
  const reviewsFile = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'data', 'reviews.js'),
    'utf-8'
  );

  // Extract products array
  const productsMatch = productsFile.match(/const products\s*=\s*(\[[\s\S]*?\]);?\s*(?:export|module)/);
  let products = [];
  if (productsMatch) {
    try {
      products = eval(productsMatch[1]);
    } catch (e) {
      // Fallback: try to parse the whole thing
      const cleaned = productsFile
        .replace(/^.*const products\s*=\s*/m, '')
        .replace(/;\s*(?:export|module)[\s\S]*$/, '');
      products = eval(cleaned);
    }
  }

  // Extract categories array
  const categoriesMatch = categoriesFile.match(/export const categories\s*=\s*(\[[\s\S]*?\]);/);
  let categories = [];
  if (categoriesMatch) {
    categories = eval(categoriesMatch[1]);
  }

  // Extract reviews array
  const reviewsMatch = reviewsFile.match(/export const reviews\s*=\s*(\[[\s\S]*?\]);/);
  let reviews = [];
  if (reviewsMatch) {
    reviews = eval(reviewsMatch[1]);
  }

  console.log(`📦 Found ${products.length} products, ${categories.length} categories, ${reviews.length} reviews\n`);

  // ── 2. Seed Categories ──
  console.log('📂 Seeding categories...');
  const categoryMap = {}; // slug -> db id

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const { data, error } = await supabase
      .from('categories')
      .upsert({
        name: cat.name,
        slug: cat.slug,
        image: cat.image || '',
        banner: cat.banner || '',
        description: cat.description || '',
        subcategories: cat.subcategories || [],
        product_count: cat.productCount || 0,
        sort_order: i,
      }, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      console.error(`  ❌ Category "${cat.name}":`, error.message);
    } else {
      categoryMap[cat.slug] = data.id;
      categoryMap[cat.name] = data.id;
      console.log(`  ✅ ${cat.name} (id: ${data.id})`);
    }
  }

  // ── 3. Seed Products ──
  console.log('\n🏷️  Seeding products...');

  for (const prod of products) {
    // Map category name to category_id
    const catSlug = prod.category ? prod.category.toLowerCase().replace(/\s+/g, '-') : '';
    const category_id = categoryMap[catSlug] || categoryMap[prod.category] || null;

    const { data, error } = await supabase
      .from('products')
      .upsert({
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        category_id,
        category: prod.category || '',
        subcategory: prod.subcategory || '',
        brand: prod.brand || 'Trio Ecart',
        price: prod.price,
        original_price: prod.originalPrice || prod.price,
        discount: prod.discount || 0,
        stock: 100, // Default stock
        rating: prod.rating || 5,
        review_count: prod.reviewCount || 0,
        images: prod.images || [],
        colors: prod.colors || [],
        sizes: prod.sizes || [],
        material: prod.material || '',
        color: prod.color || '',
        occasion: prod.occasion || '',
        package_quantity: prod.packageQuantity || '',
        country_of_origin: prod.countryOfOrigin || 'India',
        badge: prod.badge || '',
        specifications: prod.specifications || {},
        features: prod.features || [],
        short_description: prod.shortDescription || '',
        full_description: prod.fullDescription || '',
        description: prod.description || '',
        in_stock: prod.inStock !== false,
        is_new: !!prod.isNew,
        is_featured: !!prod.isFeatured,
        is_best_seller: !!prod.isBestSeller,
        is_trending: !!prod.isTrending,
        is_wedding_special: !!prod.isWeddingSpecial,
        is_festival_special: !!prod.isFestivalSpecial,
        is_handmade: !!prod.isHandmade,
      }, { onConflict: 'slug' })
      .select('id, name')
      .single();

    if (error) {
      console.error(`  ❌ Product "${prod.name.substring(0, 40)}...":`, error.message);
    } else {
      console.log(`  ✅ [${data.id}] ${data.name.substring(0, 50)}...`);
    }
  }

  // ── 4. Seed Reviews ──
  console.log('\n⭐ Seeding reviews...');

  for (const rev of reviews) {
    const { error } = await supabase
      .from('reviews')
      .upsert({
        id: rev.id,
        product_id: rev.productId,
        user_name: rev.user || 'Anonymous',
        user_avatar: rev.avatar || '',
        rating: rev.rating,
        title: rev.title || '',
        comment: rev.comment || '',
        helpful_count: rev.helpful || 0,
        is_verified: rev.verified || false,
        location: rev.location || '',
      }, { onConflict: 'id' })
      .select('id')
      .single();

    if (error) {
      console.error(`  ❌ Review ${rev.id}:`, error.message);
    } else {
      console.log(`  ✅ Review ${rev.id} for product ${rev.productId}`);
    }
  }

  console.log('\n🎉 Seed complete!');
}

seed().catch(console.error);
