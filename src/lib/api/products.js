import { supabaseAdmin } from '../supabase/admin';

/**
 * Fetch all products with optional filters
 */
export async function getProducts({
  category,
  subcategory,
  search,
  sort = 'created_at',
  order = 'desc',
  limit = 50,
  offset = 0,
  featured,
  bestSeller,
  trending,
  weddingSpecial,
  festivalSpecial,
  minPrice,
  maxPrice,
} = {}) {
  let query = supabaseAdmin
    .from('products')
    .select('*', { count: 'exact' })
    .eq('in_stock', true);

  if (category) query = query.ilike('category', category);
  if (subcategory) query = query.ilike('subcategory', subcategory);
  if (featured) query = query.eq('is_featured', true);
  if (bestSeller) query = query.eq('is_best_seller', true);
  if (trending) query = query.eq('is_trending', true);
  if (weddingSpecial) query = query.eq('is_wedding_special', true);
  if (festivalSpecial) query = query.eq('is_festival_special', true);
  if (minPrice) query = query.gte('price', minPrice);
  if (maxPrice) query = query.lte('price', maxPrice);

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
  }

  // Sorting
  const validSorts = ['price', 'created_at', 'name', 'rating', 'discount'];
  const sortField = validSorts.includes(sort) ? sort : 'created_at';
  query = query.order(sortField, { ascending: order === 'asc' });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return { products: [], total: 0 };
  }

  return { products: data || [], total: count || 0 };
}

/**
 * Fetch a single product by slug
 */
export async function getProductBySlug(slug) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return data;
}

/**
 * Fetch product by ID
 */
export async function getProductById(id) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

/**
 * Fetch all product slugs (for generateStaticParams)
 */
export async function getAllProductSlugs() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('slug');

  if (error) return [];
  return data.map((p) => p.slug);
}

/**
 * Fetch products by category
 */
export async function getProductsByCategory(categorySlug) {
  // First get the category name from slug
  const { data: cat } = await supabaseAdmin
    .from('categories')
    .select('name')
    .eq('slug', categorySlug)
    .single();

  if (!cat) return [];

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .ilike('category', cat.name)
    .eq('in_stock', true)
    .order('is_featured', { ascending: false });

  if (error) return [];
  return data || [];
}

/**
 * Fetch related products (same category, exclude current)
 */
export async function getRelatedProducts(productId, category, limit = 8) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .ilike('category', category)
    .neq('id', productId)
    .eq('in_stock', true)
    .limit(limit);

  if (error) return [];
  return data || [];
}

/**
 * Fetch all categories
 */
export async function getCategories() {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return [];
  return data || [];
}

/**
 * Fetch single category by slug
 */
export async function getCategoryBySlug(slug) {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data;
}

/**
 * Fetch reviews for a product
 */
export async function getReviewsByProductId(productId) {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

/**
 * Decrement product stock (atomic operation)
 */
export async function decrementStock(productId, quantity) {
  const { data, error } = await supabaseAdmin.rpc('decrement_stock', {
    p_product_id: productId,
    p_quantity: quantity,
  });

  // Fallback if RPC doesn't exist yet
  if (error && error.message.includes('function')) {
    const product = await getProductById(productId);
    if (!product) return false;

    const newStock = Math.max(0, product.stock - quantity);
    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        stock: newStock,
        in_stock: newStock > 0,
      })
      .eq('id', productId);

    return !updateError;
  }

  return !error;
}
