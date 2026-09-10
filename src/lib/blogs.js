import { supabaseAdmin } from './supabase/admin.js';

// Default fallback articles if database is unreachable
const DEFAULT_BLOGS = [
  {
    id: 1,
    title: "The Sacred Art of Zardosi: From Mughal Ateliers to Modern Bridal Couture",
    slug: "sacred-art-of-zardosi-embroidery-history",
    author: "Meera Sen",
    author_role: "Heritage Textile Curator",
    author_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    date: "August 28, 2026",
    category: "Artisan Heritage",
    image: "/products/peacock-real-feathers-pair-1.jpg",
    excerpt: "Explore how metallic bullion threads, zarkan stones, and pearls are hand-stitched on rich velvet by Indian karigars preserving ancient craft traditions.",
    tags: ["Zardosi", "Embroidery", "Indian Craft", "Bridal Fashion", "Handmade"],
    read_time: "6 min read",
    content: "<h2>The Living Legacy of Zari & Zardosi</h2><p>Originating from the Persian words Zar (gold) and Dozi (embroidery), Zardosi is a centuries-old imperial craft that flourished under Mughal patronage.</p>",
    status: "Published",
  },
  {
    id: 2,
    title: "Ayurvedic Wisdom: The Scientific Benefits of Drinking from Pure Copper Bottles",
    slug: "ayurvedic-benefits-pure-copper-water-bottle",
    author: "Dr. Rajeshwar Bhatt",
    author_role: "Ayurvedic Health Consultant",
    author_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    date: "August 24, 2026",
    category: "Wellness & Tradition",
    image: "/products/hammered-copper-bottle-1.jpg",
    excerpt: "Learn how the ancient practice of Tamra Jal balances the three doshas (Vata, Pitta, Kapha) and infuses drinking water with natural antimicrobial properties.",
    tags: ["Copper Bottle", "Ayurveda", "Tamra Jal", "Holistic Health", "Wellness"],
    read_time: "5 min read",
    content: "<h2>The Ancient Practice of Tamra Jal</h2><p>In classical Ayurvedic texts like the Charaka Samhita, storing clean water overnight in pure copper vessels is prescribed as Tamra Jal.</p>",
    status: "Published",
  },
  {
    id: 3,
    title: "Sacred Festive Decor: Setting Up a Divine Home Mandir for Diwali & Navratri",
    slug: "setting-up-sacred-home-mandir-diwali-pooja",
    author: "Gayatri Devi",
    author_role: "Vedic Ritual Scholar",
    author_image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    date: "August 19, 2026",
    category: "Devotion & Rituals",
    image: "/products/pooja-thali-brass-diya-1.jpg",
    excerpt: "A complete step-by-step guide on choosing pooja aasans, brass diya arrangements, and sacred chowki decorations for auspicious festivals.",
    tags: ["Pooja Aasan", "Diwali Decor", "Mandir", "Brass Diya", "Devotion"],
    read_time: "7 min read",
    content: "<h2>The Significance of Asana in Daily Worship</h2><p>In Vedic spiritual practices, sitting directly on the bare floor during prayer causes energy dissipation.</p>",
    status: "Published",
  },
];

/**
 * Normalizes a blog record so that both camelCase and snake_case properties
 * (readTime vs read_time, authorRole vs author_role, etc.) are always populated.
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
    date: b.date || new Date(b.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
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
    created_at: b.created_at || new Date().toISOString(),
    updated_at: b.updated_at || new Date().toISOString(),
  };
}

/**
 * Fetch all blogs from Supabase.
 */
export async function getAllBlogs(options = {}) {
  try {
    let query = supabaseAdmin
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });

    if (options.status && options.status !== 'All' && options.status !== 'all') {
      query = query.eq('status', options.status);
    } else if (!options.all) {
      // By default for public storefront, return published only
      query = query.eq('status', 'Published');
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map(normalizeBlog);
    }
  } catch (err) {
    console.warn('Supabase getAllBlogs notice:', err.message);
  }

  // Fallback to static blogs
  return DEFAULT_BLOGS.map(normalizeBlog);
}

/**
 * Fetch single blog by slug or ID.
 */
export async function getBlogBySlug(slug) {
  if (!slug) return null;
  try {
    const isId = /^\d+$/.test(String(slug));
    let query = supabaseAdmin.from('blogs').select('*');

    if (isId) {
      query = query.or(`slug.eq.${slug},id.eq.${slug}`);
    } else {
      query = query.eq('slug', slug);
    }

    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      return normalizeBlog(data);
    }
  } catch (err) {
    console.warn('Supabase getBlogBySlug notice:', err.message);
  }

  const fallback = DEFAULT_BLOGS.find((b) => b.slug === slug || String(b.id) === String(slug));
  return fallback ? normalizeBlog(fallback) : null;
}

/**
 * Create a new blog in Supabase.
 */
export async function createBlog(data) {
  const title = (data.title || 'Untitled Article').trim();
  const rawSlug = data.slug?.trim() || title;
  const slug = rawSlug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || `blog-${Date.now()}`;

  let tagsArray = [];
  if (Array.isArray(data.tags)) {
    tagsArray = data.tags;
  } else if (typeof data.tags === 'string') {
    tagsArray = data.tags.split(',').map((t) => t.trim()).filter(Boolean);
  }
  if (!tagsArray.length) tagsArray = ['Handcrafted', 'Heritage'];

  const blogPayload = {
    title,
    slug,
    author: data.author || 'Trio Enterprises Editorial',
    author_role: data.authorRole || data.author_role || 'Artisan Specialist',
    author_image: data.authorImage || data.author_image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    date: data.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    category: data.category || 'Artisan Heritage',
    image: data.image || '/products/peacock-real-feathers-pair-1.jpg',
    excerpt: data.excerpt || '',
    tags: tagsArray,
    read_time: data.readTime || data.read_time || '5 min read',
    content: data.content || '',
    status: data.status || 'Published',
    seo_title: data.seoTitle || data.seo_title || title,
    seo_description: data.seoDescription || data.seo_description || data.excerpt || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: newBlog, error } = await supabaseAdmin
    .from('blogs')
    .insert(blogPayload)
    .select()
    .single();

  if (error) {
    console.error('Error creating blog in Supabase:', error);
    throw new Error(error.message);
  }

  return normalizeBlog(newBlog);
}

/**
 * Update existing blog in Supabase.
 */
export async function updateBlog(slugOrId, data) {
  const isId = /^\d+$/.test(String(slugOrId));

  let tagsArray;
  if (data.tags !== undefined) {
    if (Array.isArray(data.tags)) tagsArray = data.tags;
    else if (typeof data.tags === 'string') tagsArray = data.tags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  const updatePayload = {
    ...(data.title ? { title: data.title } : {}),
    ...(data.slug ? { slug: data.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') } : {}),
    ...(data.author ? { author: data.author } : {}),
    ...((data.authorRole || data.author_role) ? { author_role: data.authorRole || data.author_role } : {}),
    ...((data.authorImage || data.author_image) ? { author_image: data.authorImage || data.author_image } : {}),
    ...(data.date ? { date: data.date } : {}),
    ...(data.category ? { category: data.category } : {}),
    ...(data.image ? { image: data.image } : {}),
    ...(data.excerpt !== undefined ? { excerpt: data.excerpt } : {}),
    ...(data.content !== undefined ? { content: data.content } : {}),
    ...(tagsArray ? { tags: tagsArray } : {}),
    ...((data.readTime || data.read_time) ? { read_time: data.readTime || data.read_time } : {}),
    ...(data.status ? { status: data.status } : {}),
    ...((data.seoTitle || data.seo_title) ? { seo_title: data.seoTitle || data.seo_title } : {}),
    ...((data.seoDescription || data.seo_description) ? { seo_description: data.seoDescription || data.seo_description } : {}),
    updated_at: new Date().toISOString(),
  };

  let query = supabaseAdmin.from('blogs').update(updatePayload);
  if (isId) {
    query = query.or(`slug.eq.${slugOrId},id.eq.${slugOrId}`);
  } else {
    query = query.eq('slug', slugOrId);
  }

  const { data: updated, error } = await query.select().single();
  if (error) {
    console.error('Error updating blog in Supabase:', error);
    throw new Error(error.message);
  }

  return normalizeBlog(updated);
}

/**
 * Delete blog from Supabase.
 */
export async function deleteBlog(slugOrId) {
  const isId = /^\d+$/.test(String(slugOrId));
  let query = supabaseAdmin.from('blogs').delete();
  if (isId) {
    query = query.or(`slug.eq.${slugOrId},id.eq.${slugOrId}`);
  } else {
    query = query.eq('slug', slugOrId);
  }

  const { error } = await query;
  if (error) {
    console.error('Error deleting blog in Supabase:', error);
    throw new Error(error.message);
  }
  return true;
}
