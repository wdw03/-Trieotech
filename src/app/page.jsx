export const dynamic = 'force-dynamic';
export const revalidate = 0;
import HomeClient from '../components/home/HomeClient';
import { supabaseAdmin } from '../lib/supabase/admin';
import { normalizeProduct } from '../lib/api/store';

export const metadata = {
  title: 'Ethnic Craft E-Commerce | Handcrafted Indian Embroidery Patches & Devotional Decor',
  description: 'Shop authentic Indian handcrafted embroidery patches, pure copper hammered water bottles, pooja aasans, desi cotton gamchas, and bridal hair parandas directly from Jaipur & Surat master artisans.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Trio Enterprises | Handcrafted Indian Ethnic Elegance',
    description: 'Shop artisan-crafted zardosi patches, pure copper drinkware, and sacred pooja essentials handcrafted with love in India.',
    url: 'https://trioenterprises.in/',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Trio Enterprises',
  url: 'https://trioenterprises.in',
  logo: 'https://trioenterprises.in/logo.png',
  description: 'Handcrafted Indian Ethnic Elegance & Devotional Crafts',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Jaipur',
    addressRegion: 'Rajasthan',
    addressCountry: 'India',
  },
};

export default async function HomePage() {
  let initialSlides = [];
  let initialSections = null;
  let initialCategories = [];
  let initialProducts = [];
  let initialReels = [];

  try {
    const [slidesRes, sectionsRes, categoriesRes, productsRes, reelsRes] = await Promise.all([
      supabaseAdmin
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('home_sections')
        .select('*')
        .order('section_key', { ascending: true }),
      supabaseAdmin
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabaseAdmin
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('is_best_seller', { ascending: false })
        .limit(60),
      supabaseAdmin
        .from('reels')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false }),
    ]);

    if (slidesRes.data && slidesRes.data.length > 0) {
      initialSlides = slidesRes.data;
    }

    if (sectionsRes.data && sectionsRes.data.length > 0) {
      const sectionsObj = {};
      for (const row of sectionsRes.data) {
        sectionsObj[row.section_key] = {
          id: row.section_key,
          sectionKey: row.section_key,
          name: row.name,
          isEnabled: Boolean(row.is_enabled),
          is_enabled: Boolean(row.is_enabled),
          description: row.description,
          ...(row.config || {}),
        };
      }
      initialSections = sectionsObj;
    }

    if (categoriesRes.data && categoriesRes.data.length > 0) {
      initialCategories = categoriesRes.data.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        image: c.image || '/products/pearl-zardosi-patch-1.jpg',
        sort_order: c.sort_order || 0,
        is_active: c.is_active ?? true,
      }));
    }

    if (productsRes.data && productsRes.data.length > 0) {
      initialProducts = productsRes.data.map(normalizeProduct);
    }

    if (reelsRes.data && reelsRes.data.length > 0) {
      initialReels = reelsRes.data;
    }
  } catch (err) {
    console.warn('HomePage SSR data fetch fallback:', err.message);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient
        initialSlides={initialSlides}
        initialSections={initialSections}
        initialCategories={initialCategories}
        initialProducts={initialProducts}
        initialReels={initialReels}
      />
    </>
  );
}
