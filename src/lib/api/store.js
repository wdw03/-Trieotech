import { products as fallbackProducts } from '../../data/products';
import { categories as fallbackCategories } from '../../data/categories';
import { blogs as fallbackBlogs } from '../../data/blogs';

/**
 * Returns the active API base URL.
 * In browser, always uses same-origin '/api' for zero CORS and seamless Next.js API routing.
 */
export function getApiBase() {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || '/api';
  }
  return process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api`
    : (process.env.NEXT_PUBLIC_API_URL || '/api');
}

/**
 * Normalizes product data from Supabase / Backend API to match frontend component needs.
 * Ensures both camelCase and snake_case properties are populated, images are valid arrays, etc.
 */
export function normalizeProduct(p) {
  if (!p) return null;

  // Normalize images array
  let images = [];
  if (Array.isArray(p.images)) {
    images = p.images.filter(Boolean);
  } else if (typeof p.images === 'string') {
    const trimmed = p.images.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        images = JSON.parse(trimmed);
      } catch {
        images = trimmed.split(/\s+/).filter(Boolean);
      }
    } else {
      images = trimmed.split(/\s+/).filter(Boolean);
    }
  }

  if (!images.length) {
    images = ['/products/shreenathji-statement-patch-1.jpg'];
  }

  // Normalize colors
  let colors = [];
  if (Array.isArray(p.colors)) {
    colors = p.colors;
  } else if (typeof p.colors === 'string' && p.colors.trim()) {
    try {
      colors = JSON.parse(p.colors);
    } catch {
      colors = p.colors.split(',').map((c) => ({ name: c.trim() })).filter((c) => c.name);
    }
  }

  // Normalize sizes
  let sizes = [];
  if (Array.isArray(p.sizes)) {
    sizes = p.sizes;
  } else if (typeof p.sizes === 'string' && p.sizes.trim()) {
    try {
      sizes = JSON.parse(p.sizes);
    } catch {
      sizes = p.sizes.split(/\s*,\s*|\s*\|\s*/).filter(Boolean);
    }
  }

  const price = Number(p.price) || 0;
  const originalPrice = Number(p.original_price ?? p.originalPrice) || price;
  const inStock = p.in_stock !== undefined ? Boolean(p.in_stock) : Boolean(p.inStock ?? true);

  const isBestSeller = Boolean(p.is_best_seller ?? p.isBestSeller);
  const isFestivalSpecial = Boolean(p.is_festival_special ?? p.isFestivalSpecial);
  const isWeddingSpecial = Boolean(p.is_wedding_special ?? p.isWeddingSpecial);
  const isTrending = Boolean(p.is_trending ?? p.isTrending);
  const isNew = Boolean(p.is_new ?? p.isNew);
  const isHandmade = Boolean(p.is_handmade ?? p.isHandmade);

  let badge = p.badge;
  if (!badge) {
    if (isBestSeller) badge = 'Best Seller';
    else if (isFestivalSpecial) badge = 'Festival Special';
    else if (isWeddingSpecial) badge = 'Wedding Special';
    else if (isTrending) badge = 'Trending';
    else if (isNew) badge = 'New Arrival';
    else if (isHandmade) badge = 'Handmade';
  }

  return {
    ...p,
    id: p.id,
    name: p.name || 'Untitled Craft',
    slug: p.slug || String(p.id),
    category: p.category || '',
    subcategory: p.subcategory || '',
    brand: p.brand || 'Trio Ecart',
    price,
    originalPrice,
    original_price: originalPrice,
    discount: Number(p.discount) || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0),
    rating: Number(p.rating) || 5,
    reviewsCount: Number(p.review_count ?? p.reviewsCount ?? p.rating_count) || 0,
    review_count: Number(p.review_count ?? p.reviewsCount ?? p.rating_count) || 0,
    stock: Number(p.stock) || 0,
    inStock,
    in_stock: inStock,
    isBestSeller,
    is_best_seller: isBestSeller,
    isFestivalSpecial,
    is_festival_special: isFestivalSpecial,
    isWeddingSpecial,
    is_wedding_special: isWeddingSpecial,
    isTrending,
    is_trending: isTrending,
    isNew,
    is_new: isNew,
    isHandmade,
    is_handmade: isHandmade,
    badge,
    images,
    colors,
    sizes,
    description: p.description || p.short_description || '',
    shortDescription: p.short_description || p.shortDescription || p.description || '',
    fullDescription: p.full_description || p.fullDescription || p.description || '',
    material: p.material || '',
    occasion: p.occasion || '',
    features: Array.isArray(p.features)
      ? p.features
      : typeof p.features === 'string'
      ? p.features.split(/\.\s+/).filter(Boolean)
      : [],
    specifications: typeof p.specifications === 'object' && p.specifications !== null ? p.specifications : {},
  };
}

/**
 * Fetch products from live backend API.
 */
export async function fetchLiveProducts(filters = {}) {
  const apiBase = getApiBase();
  const queryParams = new URLSearchParams();

  if (filters.category) queryParams.set('category', filters.category);
  if (filters.subcategory) queryParams.set('subcategory', filters.subcategory);
  if (filters.search) queryParams.set('search', filters.search);
  if (filters.sort) queryParams.set('sort', filters.sort);
  if (filters.order) queryParams.set('order', filters.order);
  if (filters.limit) queryParams.set('limit', String(filters.limit));
  if (filters.offset) queryParams.set('offset', String(filters.offset));
  if (filters.featured) queryParams.set('featured', 'true');
  if (filters.bestSeller) queryParams.set('bestSeller', 'true');
  if (filters.trending) queryParams.set('trending', 'true');
  if (filters.weddingSpecial) queryParams.set('weddingSpecial', 'true');
  if (filters.festivalSpecial) queryParams.set('festivalSpecial', 'true');
  if (filters.handmade) queryParams.set('handmade', 'true');
  if (filters.minPrice) queryParams.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice) queryParams.set('maxPrice', String(filters.maxPrice));

  try {
    const res = await fetch(`${apiBase}/products?${queryParams.toString()}`, {
      next: { revalidate: 30 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products)) {
        return {
          products: data.products.map(normalizeProduct),
          total: data.total !== undefined ? data.total : data.products.length,
        };
      }
    }
  } catch (err) {
    console.warn('API fetch failed, trying local fallback:', err);
  }

  // Fallback to internal route if external failed
  if (apiBase.startsWith('http')) {
    try {
      const res = await fetch(`/api/products?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products)) {
          return {
            products: data.products.map(normalizeProduct),
            total: data.total !== undefined ? data.total : data.products.length,
          };
        }
      }
    } catch (_) {}
  }

  // Final fallback to static data
  let filtered = [...fallbackProducts];
  if (filters.category) {
    filtered = filtered.filter(p => p.category?.toLowerCase() === filters.category?.toLowerCase());
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(p => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
  }
  return {
    products: filtered.map(normalizeProduct),
    total: filtered.length,
  };
}

/**
 * Fetch categories from live backend API.
 */
export async function fetchLiveCategories() {
  const apiBase = getApiBase();
  try {
    const res = await fetch(`${apiBase}/admin/categories`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        return data.categories;
      }
    }
  } catch (err) {
    console.warn('Categories API fetch failed, trying local fallback:', err);
  }

  try {
    const res = await fetch('/api/admin/categories');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        return data.categories;
      }
    }
  } catch (_) {}

  return fallbackCategories;
}

/**
 * Fetch a single product by slug or id from API.
 */
export async function fetchLiveProductBySlug(slug) {
  if (!slug) return null;
  const apiBase = getApiBase();

  try {
    const res = await fetch(`${apiBase}/products?search=${encodeURIComponent(slug)}&limit=10`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products)) {
        const found = data.products.find(
          (p) => p.slug === slug || String(p.id) === String(slug)
        );
        if (found) return normalizeProduct(found);
      }
    }
  } catch (err) {
    console.warn('Product by slug API fetch failed:', err);
  }

  // Fallback
  const fallback = fallbackProducts.find(
    (p) => p.slug === slug || String(p.id) === String(slug)
  );
  return fallback ? normalizeProduct(fallback) : null;
}

/**
 * Track an order by ID or AWB from live API.
 */
export async function trackOrderLive(query) {
  if (!query) return null;
  const clean = query.trim();
  const apiBase = getApiBase();

  // Try shipping tracking API first
  try {
    const trackRes = await fetch(`${apiBase}/shipping/track?awb=${encodeURIComponent(clean)}&orderNumber=${encodeURIComponent(clean)}`);
    if (trackRes.ok) {
      const data = await trackRes.json();
      if (data.tracking && data.tracking.status !== 'pending') {
        return {
          id: clean,
          status: data.tracking.status,
          currentLocation: data.tracking.current_location || 'In Transit Hub',
          courier: data.tracking.courier_name || 'Shiprocket Express',
          trackingNumber: data.tracking.awb_code || clean,
          activities: data.tracking.scans || [],
          shipment: data.shipment,
        };
      }
    }
  } catch (_) {}

  // Try order API
  try {
    const orderRes = await fetch(`${apiBase}/orders/${encodeURIComponent(clean)}`);
    if (orderRes.ok) {
      const data = await orderRes.json();
      if (data.order) {
        return {
          id: data.order.order_number || data.order.id,
          orderNumber: data.order.order_number,
          status: data.order.status || 'processing',
          totalAmount: data.order.total_amount,
          createdAt: data.order.created_at,
          shippingAddress: data.order.shipping_address,
          items: data.order.order_items || [],
          shipments: data.order.shipments || [],
        };
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Normalizes blog object so camelCase and snake_case properties are both available.
 */
export function normalizeBlog(b) {
  if (!b) return null;

  let tagsArray = [];
  if (Array.isArray(b.tags)) {
    tagsArray = b.tags;
  } else if (typeof b.tags === 'string') {
    try {
      tagsArray = JSON.parse(b.tags);
    } catch {
      tagsArray = b.tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }

  const role = b.author_role || b.authorRole || 'Artisan Specialist';
  const authorImg = b.author_image || b.authorImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80';
  const read = b.read_time || b.readTime || '5 min read';
  const seoT = b.seo_title || b.seoTitle || b.title || '';
  const seoD = b.seo_description || b.seoDescription || b.excerpt || '';

  return {
    ...b,
    id: b.id,
    title: b.title || '',
    slug: b.slug || '',
    author: b.author || 'Trio Enterprises Editorial',
    authorRole: role,
    author_role: role,
    authorImage: authorImg,
    author_image: authorImg,
    date: b.date || (b.created_at ? new Date(b.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''),
    category: b.category || 'Artisan Heritage',
    image: b.image || '/products/peacock-real-feathers-pair-1.jpg',
    excerpt: b.excerpt || '',
    tags: tagsArray.length > 0 ? tagsArray : ['Handcrafted'],
    readTime: read,
    read_time: read,
    content: b.content || '',
    status: b.status || 'Published',
    seoTitle: seoT,
    seo_title: seoT,
    seoDescription: seoD,
    seo_description: seoD,
    created_at: b.created_at,
    updated_at: b.updated_at,
  };
}

/**
 * Fetches all live published blogs from API.
 */
export async function fetchLiveBlogs() {
  const apiBase = getApiBase();
  try {
    const res = await fetch(`${apiBase}/blogs`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.blogs) && data.blogs.length > 0) {
        return data.blogs.map(normalizeBlog);
      }
    }
  } catch (err) {
    console.warn('Error fetching live blogs:', err.message);
  }
  return fallbackBlogs.map(normalizeBlog);
}

/**
 * Fetches single live blog by slug or ID from API.
 */
export async function fetchLiveBlogBySlug(slug) {
  if (!slug) return null;
  const apiBase = getApiBase();
  try {
    const res = await fetch(`${apiBase}/blogs/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.blog) {
        return normalizeBlog(data.blog);
      }
    }
  } catch (err) {
    console.warn('Error fetching live blog by slug:', err.message);
  }
  const fallback = fallbackBlogs.find((b) => b.slug === slug || String(b.id) === String(slug));
  return fallback ? normalizeBlog(fallback) : null;
}
