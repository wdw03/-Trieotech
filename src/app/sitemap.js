import { products as fallbackProducts } from '../data/products';
import { categories as fallbackCategories } from '../data/categories';
import { blogs as fallbackBlogs } from '../data/blogs';
import { supabaseAdmin } from '../lib/supabase/admin';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://trioenterprises.in';

export default async function sitemap() {
  const currentDate = new Date().toISOString();

  // Static routes
  const staticRoutes = [
    {
      url: BASE_URL,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/shipping`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/returns`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // Fetch live products, categories, and blogs with fallback
  let liveProducts = fallbackProducts;
  let liveCategories = fallbackCategories;
  let liveBlogs = fallbackBlogs;

  try {
    const { data: dbProducts } = await supabaseAdmin
      .from('products')
      .select('slug, updated_at')
      .eq('is_visible', true);
    if (dbProducts && dbProducts.length > 0) {
      liveProducts = dbProducts;
    }
  } catch (_) {}

  try {
    const { data: dbCategories } = await supabaseAdmin
      .from('categories')
      .select('slug, updated_at');
    if (dbCategories && dbCategories.length > 0) {
      liveCategories = dbCategories;
    }
  } catch (_) {}

  try {
    const { data: dbBlogs } = await supabaseAdmin
      .from('blogs')
      .select('slug, updated_at')
      .eq('status', 'published');
    if (dbBlogs && dbBlogs.length > 0) {
      liveBlogs = dbBlogs;
    }
  } catch (_) {}

  // Dynamic Product routes
  const productRoutes = liveProducts.filter((p) => p?.slug).map((product) => ({
    url: `${BASE_URL}/product/${product.slug}`,
    lastModified: product.updated_at || currentDate,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  // Dynamic Category routes
  const categoryRoutes = liveCategories.filter((c) => c?.slug).map((category) => ({
    url: `${BASE_URL}/category/${category.slug}`,
    lastModified: category.updated_at || currentDate,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Dynamic Blog routes
  const blogRoutes = liveBlogs.filter((b) => b?.slug).map((blog) => ({
    url: `${BASE_URL}/blog/${blog.slug}`,
    lastModified: blog.updated_at || currentDate,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...blogRoutes,
  ];
}
