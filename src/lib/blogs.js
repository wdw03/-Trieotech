import fs from 'fs';
import path from 'path';

const BLOGS_FILE = path.join(process.cwd(), 'src', 'data', 'blogs.json');

// Default fallback articles if JSON file cannot be read
const DEFAULT_BLOGS = [
  {
    id: 1,
    title: "The Sacred Art of Zardosi: From Mughal Ateliers to Modern Bridal Couture",
    slug: "sacred-art-of-zardosi-embroidery-history",
    author: "Meera Sen",
    authorRole: "Heritage Textile Curator",
    authorImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    date: "August 28, 2026",
    category: "Artisan Heritage",
    image: "https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/products/peacock-real-feathers-pair-1.jpg",
    excerpt: "Explore how metallic bullion threads, zarkan stones, and pearls are hand-stitched on rich velvet by Indian karigars preserving ancient craft traditions.",
    tags: ["Zardosi", "Embroidery", "Indian Craft", "Bridal Fashion", "Handmade"],
    readTime: "6 min read",
    content: "<h2>The Living Legacy of Zari & Zardosi</h2><p>Originating from the Persian words Zar (gold) and Dozi (embroidery), Zardosi is a centuries-old imperial craft that flourished under Mughal patronage.</p>"
  }
];

export function getAllBlogs() {
  try {
    if (fs.existsSync(BLOGS_FILE)) {
      const data = fs.readFileSync(BLOGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading blogs.json:', err);
  }
  return DEFAULT_BLOGS;
}

export function getBlogBySlug(slug) {
  if (!slug) return null;
  const blogs = getAllBlogs();
  return blogs.find((b) => b.slug === slug || String(b.id) === String(slug)) || null;
}

export function saveBlogs(blogs) {
  try {
    fs.writeFileSync(BLOGS_FILE, JSON.stringify(blogs, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving blogs.json:', err);
    return false;
  }
}

export function createBlog(data) {
  const blogs = getAllBlogs();

  const slug = data.slug
    ? data.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    : data.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const newId = blogs.length > 0 ? Math.max(...blogs.map((b) => Number(b.id) || 0)) + 1 : 1;

  const newBlog = {
    id: newId,
    title: data.title || 'Untitled Article',
    slug,
    author: data.author || 'Trio Enterprises Editorial',
    authorRole: data.authorRole || 'Artisan Specialist',
    authorImage: data.authorImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    date: data.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    category: data.category || 'Artisan Crafts',
    image: data.image || 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/products/peacock-real-feathers-pair-1.jpg',
    excerpt: data.excerpt || '',
    tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map((t) => t.trim()) : ['Handcrafted']),
    readTime: data.readTime || '5 min read',
    content: data.content || '',
  };

  blogs.unshift(newBlog);
  saveBlogs(blogs);
  return newBlog;
}

export function updateBlog(slugOrId, updatedData) {
  const blogs = getAllBlogs();
  const index = blogs.findIndex((b) => b.slug === slugOrId || String(b.id) === String(slugOrId));

  if (index === -1) return null;

  blogs[index] = {
    ...blogs[index],
    ...updatedData,
    tags: Array.isArray(updatedData.tags)
      ? updatedData.tags
      : (typeof updatedData.tags === 'string'
        ? updatedData.tags.split(',').map((t) => t.trim())
        : blogs[index].tags),
  };

  saveBlogs(blogs);
  return blogs[index];
}

export function deleteBlog(slugOrId) {
  const blogs = getAllBlogs();
  const filtered = blogs.filter((b) => b.slug !== slugOrId && String(b.id) !== String(slugOrId));

  if (filtered.length === blogs.length) return false;

  saveBlogs(filtered);
  return true;
}
