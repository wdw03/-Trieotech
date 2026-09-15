export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';

// Fallback slides in case of DB connection issue
const FALLBACK_SLIDES = [
  {
    id: '1',
    badge: 'Festive & Wedding 2026',
    title: 'Handcrafted Zardosi & Sacred Deity Patches',
    mobile_title: 'Handcrafted Zardosi & Deity Patches',
    subtitle: 'Ornate gold zari, zarkan stone cutwork, and royal peacock motifs hand-stitched by generational master karigars for bridal lehengas and festive couture.',
    mobile_subtitle: 'Royal zari, zarkan stone cutwork & peacock motifs by master karigars.',
    cta_text: 'Explore Patches',
    desktop_cta_text: 'Explore Embroidery Patches',
    cta_link: '/category/patches',
    secondary_cta_text: 'View Best Sellers',
    secondary_cta_link: '/shop',
    desktop_image: '/products/shreenathji-statement-patch-1.jpg',
    mobile_image: '/products/shreenathji-statement-patch-1.jpg',
    secondary_image: '/products/peacock-real-feathers-pair-1.jpg',
    tag: 'Authentic Imperial Zari',
    display_order: 1,
    is_active: true
  },
  {
    id: '2',
    badge: '100% Pure Tamra Jal Wellness',
    title: 'Ayurvedic Hammered Pure Copper Bottles',
    mobile_title: 'Pure Ayurvedic Copper Bottles',
    subtitle: 'Infuse your daily water with natural antimicrobial goodness and holistic vitality. Hand-hammered with heavy-gauge pure copper by traditional thatheras.',
    mobile_subtitle: 'Hand-hammered heavy-gauge pure copper for holistic daily vitality.',
    cta_text: 'Shop Copper Bottles',
    desktop_cta_text: 'Shop Copper Bottles',
    cta_link: '/category/bottle',
    secondary_cta_text: 'Ayurveda Guide',
    secondary_cta_link: '/blog/ayurvedic-benefits-pure-copper-water-bottle',
    desktop_image: '/products/hammered-copper-bottle-1.jpg',
    mobile_image: '/products/hammered-copper-bottle-1.jpg',
    secondary_image: '/products/jute-bottle-bag-1.jpg',
    tag: '100% Pure Copper',
    display_order: 2,
    is_active: true
  },
  {
    id: '3',
    badge: 'Devotion & Sacred Rituals',
    title: 'Royal Velvet Pooja Aasans & Brass Thalis',
    mobile_title: 'Velvet Pooja Aasans & Brass Thalis',
    subtitle: 'Elevate your daily aarti and festive mandir ceremonies with pure red velvet aasans, embellished brass diyas, and authentic desi cotton gamchas.',
    mobile_subtitle: 'Pure velvet aasans, embellished brass diyas & sacred essentials.',
    cta_text: 'Discover Pooja Items',
    desktop_cta_text: 'Discover Pooja Essentials',
    cta_link: '/category/aasan',
    secondary_cta_text: 'Festival Special',
    secondary_cta_link: '/category/towel-gamcha',
    desktop_image: '/products/pooja-thali-brass-diya-1.jpg',
    mobile_image: '/products/pooja-thali-brass-diya-1.jpg',
    secondary_image: '/products/lotus-kamal-aasan-1.jpg',
    tag: 'Auspicious Festivities',
    display_order: 3,
    is_active: true
  }
];

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store'
};

// GET: Public active hero banners feed (or all banners if ?all=true)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';

    let query = supabaseAdmin
      .from('hero_slides')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!showAll) {
      query = query.eq('is_active', true);
    }

    const { data: slides, error } = await query;

    if (error) {
      console.warn('Error fetching hero_slides, using fallback:', error.message);
      return NextResponse.json({ slides: FALLBACK_SLIDES }, { headers: NO_CACHE_HEADERS });
    }

    if (!slides || slides.length === 0) {
      return NextResponse.json({ slides: showAll ? [] : FALLBACK_SLIDES }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ slides }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('Banners API error:', err);
    return NextResponse.json({ slides: FALLBACK_SLIDES }, { headers: NO_CACHE_HEADERS });
  }
}

// POST: Create a new hero slide (Admin)
export async function POST(request) {
  try {
    const body = await request.json();
    const payload = {
      title: (body.title || '').trim(),
      mobile_title: (body.mobile_title || body.mobileTitle || body.title || '').trim(),
      subtitle: (body.subtitle || '').trim(),
      mobile_subtitle: (body.mobile_subtitle || body.mobileSubtitle || body.subtitle || '').trim(),
      badge: (body.badge || 'Festive Special').trim(),
      tag: (body.tag || 'Authentic Craft').trim(),
      cta_text: (body.cta_text || body.ctaText || body.mobile_cta_text || 'Shop Now').trim(),
      desktop_cta_text: (body.desktop_cta_text || body.desktopCtaText || body.cta_text || 'Explore Collection').trim(),
      mobile_cta_text: (body.mobile_cta_text || body.mobileCtaText || body.cta_text || 'Shop Now').trim(),
      cta_link: (body.cta_link || body.ctaLink || '/shop').trim(),
      secondary_cta_text: (body.secondary_cta_text || body.secondaryCtaText || 'Learn More').trim(),
      secondary_cta_link: (body.secondary_cta_link || body.secondaryCtaLink || '/blog').trim(),
      desktop_image: (body.desktop_image || body.desktopImage || body.image || '').trim(),
      mobile_image: (body.mobile_image || body.mobileImage || body.desktop_image || body.image || '').trim(),
      secondary_image: (body.secondary_image || body.secondaryImage || '').trim(),
      display_order: Number(body.display_order ?? body.order ?? 0),
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : (body.isActive !== undefined ? Boolean(body.isActive) : true),
    };

    const { data, error } = await supabaseAdmin
      .from('hero_slides')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: true, slide: data }, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('Error creating hero slide:', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
