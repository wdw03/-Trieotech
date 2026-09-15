export const dynamic = 'force-dynamic';
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

// GET: Public active hero banners feed
export async function GET() {
  try {
    const { data: slides, error } = await supabaseAdmin
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching hero_slides, using fallback:', error.message);
      return NextResponse.json({ slides: FALLBACK_SLIDES });
    }

    if (!slides || slides.length === 0) {
      return NextResponse.json({ slides: FALLBACK_SLIDES });
    }

    return NextResponse.json({ slides });
  } catch (err) {
    console.error('Banners API error:', err);
    return NextResponse.json({ slides: FALLBACK_SLIDES });
  }
}
