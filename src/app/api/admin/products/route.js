export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// Helper to normalize product for both dashboard and storefront
export function normalizeProduct(p) {
  if (!p) return null;
  const images = Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []);
  const mainImage = images[0] || '/products/pearl-zardosi-patch-1.jpg';
  const price = Number(p.price || 0);
  const origPrice = Math.round(Number(p.original_price ?? p.originalPrice ?? (price > 0 ? price * 1.25 : 0)));
  const discount = p.discount !== undefined && p.discount !== null
    ? Number(p.discount)
    : (origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0);

  let badge = p.badge || '';
  if (!badge) {
    if (p.is_best_seller) badge = 'Best Seller';
    else if (p.is_wedding_special) badge = 'Wedding Special';
    else if (p.is_festival_special) badge = 'Festival Special';
    else if (p.is_trending) badge = 'Trending';
    else if (p.is_new) badge = 'New';
    else if (p.is_handmade) badge = 'Handmade';
  }

  const inStock = p.in_stock !== undefined ? Boolean(p.in_stock) : Number(p.stock || 0) > 0;

  return {
    ...p,
    id: Number(p.id),
    name: p.name || 'Untitled Product',
    slug: p.slug || String(p.id),
    category: p.category || '',
    subcategory: p.subcategory || 'Artisanal Collection',
    brand: p.brand || 'Trio Ecart',
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
    colors: Array.isArray(p.colors) ? p.colors : [],
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    rating: Number(p.rating || 5),
    ratingCount: Number(p.review_count ?? p.reviews_count ?? 0),
    review_count: Number(p.review_count ?? p.reviews_count ?? 0),
    reviews: Number(p.review_count ?? p.reviews_count ?? 0),
    material: p.material || '',
    occasion: p.occasion || '',
    features: Array.isArray(p.features) && p.features.length ? p.features : [
      'Handcrafted by generational master artisans',
      'Authentic pure materials & detailing',
      'Quality checked & securely packaged'
    ],
    specifications: typeof p.specifications === 'object' && p.specifications ? p.specifications : {
      Material: p.material || 'Velvet & Zari',
      Care: 'Keep in dry muslin cloth',
      Origin: p.country_of_origin || 'India'
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

    if (!body.name || body.price === undefined || body.price === null) {
      return NextResponse.json({ error: 'Product name and price are required' }, { status: 400 });
    }

    // Unique Slug Generation
    let baseSlug = (body.slug || body.name || 'product')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    if (!baseSlug) baseSlug = `product-${Date.now()}`;

    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (!existing) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Get max numeric ID
    const { data: lastProd } = await supabaseAdmin
      .from('products')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    const newId = (Number(lastProd?.id) || 144) + 1;

    // Normalize images
    let images = Array.isArray(body.images) ? body.images.filter(Boolean) : [];
    if (images.length === 0 && body.image) {
      images = [body.image];
    }
    if (images.length === 0) {
      images = ['https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/products/peacock-patch-1.jpg'];
    }

    const price = Number(body.price);
    const origPrice = Math.round(Number(body.originalPrice || body.original_price || (price > 0 ? price * 1.25 : price)));
    const discount = body.discount !== undefined && body.discount !== null
      ? Number(body.discount)
      : (origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0);

    const stock = Number(body.stock || body.availableStock || 25);
    const inStock = body.inStock !== undefined
      ? Boolean(body.inStock)
      : (body.in_stock !== undefined ? Boolean(body.in_stock) : stock > 0);

    let badge = body.badge || '';
    if (!badge) {
      if (body.is_best_seller) badge = 'Best Seller';
      else if (body.is_wedding_special) badge = 'Wedding Special';
      else if (body.is_festival_special) badge = 'Festival Special';
      else if (body.is_trending) badge = 'Trending';
      else badge = 'New';
    }

    const insertData = {
      id: newId,
      name: String(body.name).trim(),
      slug,
      category: body.category || 'Patches',
      subcategory: body.subcategory || 'Traditional',
      brand: body.brand || 'Trio Ecart',
      price,
      original_price: origPrice,
      discount,
      stock,
      in_stock: inStock,
      badge,
      images,
      colors: Array.isArray(body.colors) ? body.colors : [],
      sizes: Array.isArray(body.sizes) ? body.sizes : [],
      material: body.material || 'Silk & Velvet',
      color: body.color || '',
      occasion: body.occasion || 'Festive / Wedding',
      package_quantity: body.package_quantity || body.packageQuantity || '',
      country_of_origin: body.country_of_origin || body.countryOfOrigin || 'India',
      description: body.description || body.short_description || body.full_description || '',
      short_description: body.short_description || body.shortDescription || (body.description ? String(body.description).slice(0, 150) : ''),
      full_description: body.full_description || body.fullDescription || body.description || '',
      specifications: typeof body.specifications === 'object' && body.specifications !== null ? body.specifications : {},
      features: Array.isArray(body.features) ? body.features : [],
      is_featured: Boolean(body.is_featured || body.featured),
      is_best_seller: Boolean(body.is_best_seller || badge === 'Best Seller'),
      is_wedding_special: Boolean(body.is_wedding_special || badge === 'Wedding Special'),
      is_festival_special: Boolean(body.is_festival_special || badge === 'Festival Special'),
      is_trending: Boolean(body.is_trending || badge === 'Trending'),
      is_handmade: body.is_handmade !== undefined ? Boolean(body.is_handmade) : true,
      is_new: body.is_new !== undefined ? Boolean(body.is_new) : true,
      rating: Number(body.rating || 5),
      review_count: Number(body.review_count || body.reviewsCount || 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
