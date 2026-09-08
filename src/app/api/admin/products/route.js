import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// Helper to normalize product for both dashboard and storefront
export function normalizeProduct(p) {
  const images = Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []);
  const mainImage = images[0] || '/products/pearl-zardosi-patch-1.jpg';
  const price = Number(p.price || 0);
  const origPrice = Math.round(Number(p.original_price || p.originalPrice || price * 1.25));
  const discount = origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 15;

  let badge = p.badge || 'Handmade';
  if (p.is_best_seller) badge = 'Best Seller';
  else if (p.is_wedding_special) badge = 'Wedding Special';
  else if (p.is_festival_special) badge = 'Festival Special';
  else if (p.is_trending) badge = 'Trending';
  else if (p.is_new) badge = 'New';

  const inStock = p.in_stock !== undefined ? Boolean(p.in_stock) : Number(p.stock || 0) > 0;

  return {
    ...p,
    id: Number(p.id),
    name: p.name,
    slug: p.slug,
    category: p.category,
    subcategory: p.subcategory || 'Artisanal Collection',
    price,
    originalPrice: origPrice,
    original_price: origPrice,
    discount,
    stock: Number(p.stock || 0),
    inStock,
    in_stock: inStock,
    badge,
    image: mainImage,
    images: images.length > 0 ? images : [mainImage],
    rating: Number(p.rating || 4.8),
    ratingCount: Number(p.reviews_count || 24),
    reviews: Number(p.reviews_count || 24),
    features: Array.isArray(p.features) && p.features.length ? p.features : [
      'Handcrafted by generational master artisans',
      'Authentic pure materials & detailing',
      'Quality checked & securely packaged'
    ],
    specifications: typeof p.specifications === 'object' && p.specifications ? p.specifications : {
      Material: p.material || 'Velvet & Zari',
      Care: 'Keep in dry muslin cloth',
      Origin: 'India'
    }
  };
}

// GET: List all products for admin
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('products')
      .select('*')
      .order('id', { ascending: false });

    if (category && category !== 'All') {
      query = query.ilike('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: products, error } = await query;
    if (error) throw error;

    const normalized = (products || []).map(normalizeProduct);

    return NextResponse.json({ products: normalized });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Add new product
export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.name || !body.price) {
      return NextResponse.json({ error: 'Product name and price are required' }, { status: 400 });
    }

    const slug = body.slug
      ? body.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Get max ID
    const { data: lastProd } = await supabaseAdmin
      .from('products')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    const newId = (Number(lastProd?.id) || 143) + 1;

    // Normalize images
    let images = Array.isArray(body.images) ? body.images : [];
    if (images.length === 0 && body.image) {
      images = [body.image];
    }
    if (images.length === 0) {
      images = ['https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/products/peacock-patch-1.jpg'];
    }

    const stock = Number(body.stock || body.availableStock || 25);
    const inStock = body.inStock !== undefined ? Boolean(body.inStock) : stock > 0;

    const insertData = {
      id: newId,
      name: body.name,
      slug,
      category: body.category || 'Patches',
      subcategory: body.subcategory || 'Traditional',
      price: Number(body.price),
      original_price: Number(body.originalPrice || body.original_price || body.price * 1.25),
      stock,
      in_stock: inStock,
      images,
      description: body.description || body.short_description || '',
      short_description: body.short_description || body.description?.slice(0, 150) || '',
      material: body.material || 'Silk & Velvet',
      occasion: body.occasion || 'Festive / Wedding',
      is_featured: !!(body.is_featured || body.featured),
      is_best_seller: !!(body.is_best_seller || body.badge === 'Best Seller'),
      is_wedding_special: !!(body.badge === 'Wedding Special'),
      is_festival_special: !!(body.badge === 'Festival Special'),
      is_new: true,
    };

    const { data: newProduct, error } = await supabaseAdmin
      .from('products')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, product: normalizeProduct(newProduct) }, { status: 201 });
  } catch (err) {
    console.error('Add product error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
