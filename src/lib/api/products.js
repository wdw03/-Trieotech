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
  handmade,
  isNew,
  minPrice,
  maxPrice,
  includeHidden = false,
} = {}) {
  let query = supabaseAdmin
    .from('products')
    .select('*', { count: 'exact' });

  // Only show visible products on storefront unless includeHidden is true
  if (!includeHidden) {
    query = query.or('is_visible.is.null,is_visible.eq.true');
  }

  if (category) query = query.ilike('category', category);
  if (subcategory) query = query.ilike('subcategory', subcategory);
  if (featured) query = query.eq('is_featured', true);
  if (bestSeller) query = query.eq('is_best_seller', true);
  if (trending) query = query.eq('is_trending', true);
  if (weddingSpecial) query = query.eq('is_wedding_special', true);
  if (festivalSpecial) query = query.eq('is_festival_special', true);
  if (handmade) query = query.eq('is_handmade', true);
  if (isNew) query = query.eq('is_new', true);
  if (minPrice !== undefined && !isNaN(minPrice)) query = query.gte('price', minPrice);
  if (maxPrice !== undefined && !isNaN(maxPrice)) query = query.lte('price', maxPrice);

  if (search) {
    const cleanSearch = String(search).replace(/[,()]/g, ' ').trim();
    if (cleanSearch) {
      query = query.or(`name.ilike.%${cleanSearch}%,description.ilike.%${cleanSearch}%,category.ilike.%${cleanSearch}%`);
    }
  }

  // Sorting
  const validSorts = ['price', 'created_at', 'name', 'rating', 'discount'];
  const sortField = validSorts.includes(sort) ? sort : 'created_at';
  query = query.order(sortField, { ascending: order === 'asc' });

  // Pagination
  const numLimit = Math.max(1, parseInt(limit) || 50);
  const numOffset = Math.max(0, parseInt(offset) || 0);
  query = query.range(numOffset, numOffset + numLimit - 1);

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
  if (!categorySlug) return [];
  const clean = String(categorySlug).trim();

  // First get the category name from slug or name (case-insensitive)
  const { data: cat } = await supabaseAdmin
    .from('categories')
    .select('name')
    .or(`slug.ilike.${clean},name.ilike.${clean}`)
    .limit(1)
    .maybeSingle();

  const targetCategory = cat?.name || clean;

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .ilike('category', targetCategory)
    .or('is_visible.is.null,is_visible.eq.true')
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
    .or('is_visible.is.null,is_visible.eq.true')
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
 * Fetch single category by slug or name (case-insensitive)
 */
export async function getCategoryBySlug(slug) {
  if (!slug) return null;
  const clean = String(slug).trim();
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .or(`slug.ilike.${clean},name.ilike.${clean}`)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
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
 * Decrement product stock & variant stock and increment sold_quantity
 */
export async function decrementStock(productId, quantity = 1, colorName = '') {
  try {
    const product = await getProductById(productId);
    if (!product) return false;

    const newStock = Math.max(0, (Number(product.stock) || 0) - quantity);
    const newSold = (Number(product.sold_quantity) || 0) + quantity;

    let updatedColors = product.colors;
    if (colorName && Array.isArray(product.colors) && product.colors.length > 0) {
      updatedColors = product.colors.map((c) => {
        if (c.name === colorName || c.hex === colorName) {
          const currentVariantStock = c.stock !== undefined ? Number(c.stock) : (Number(product.stock) || 0);
          return {
            ...c,
            stock: Math.max(0, currentVariantStock - quantity),
          };
        }
        return c;
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        stock: newStock,
        in_stock: newStock > 0,
        sold_quantity: newSold,
        colors: updatedColors,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    return !updateError;
  } catch (err) {
    console.error('Error in decrementStock:', err);
    return false;
  }
}
