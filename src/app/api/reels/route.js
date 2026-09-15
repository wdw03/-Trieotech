export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';

// Fallback reels in case database is unreachable
const FALLBACK_REELS = [
  {
    id: 'reel-1',
    influencer_name: 'Abida Fatima',
    influencer_username: '@abida.fatima_',
    influencer_avatar: '/assests/shopthelookinflcuernsgram10/Abida_Fatima.jpg',
    video_url: '/assests/watchandbuy4/tn_22511f6c-00ca-4a91-840f-0adce0910551.mp4',
    thumbnail_url: '/assests/shopthelookinflcuernsgram10/Abida_Fatima.jpg',
    caption: 'Added these handcrafted pearl zardosi patches to my festive lehenga border ✨ The zari detailing shines so brightly under royal lighting! Tag someone who loves ethnic DIYs.',
    song_title: 'Kesariya · Slowed & Reverb',
    views_count: '412K',
    likes_count: '24.3K',
    comments_count: '1,204',
    product_id: '106',
    product_name: 'Pearl Zardosi Moti Beaded Applique Patches (Set of 20)',
    product_slug: 'trio-ecart-pearl-zardosi-moti-beaded-round-applique-patches-set-20',
    product_price: 199,
    product_old_price: 499,
    product_image: '/products/peacock-real-feathers-pair-1.jpg',
    product_discount: '60% OFF',
    display_order: 1,
    is_active: true
  },
  {
    id: 'reel-2',
    influencer_name: 'Agrani Singh',
    influencer_username: '@agranisingh.official',
    influencer_avatar: '/assests/shopthelookinflcuernsgram10/Agrani_SINGH.jpg',
    video_url: '/assests/watchandbuy4/tn_5335df7b-7e0e-4cc3-900b-69e2f2296380.mp4',
    thumbnail_url: '/assests/shopthelookinflcuernsgram10/Agrani_SINGH.jpg',
    caption: 'POV: You found THE royal velvet pooja thali for wedding ceremonies 🪔 Embellished with pure brass diyas and pearl borders. Pure spiritual elegance!',
    song_title: 'Din Shagna Da · Wedding Sitar Mix',
    views_count: '820K',
    likes_count: '58.7K',
    comments_count: '3,891',
    product_id: '109',
    product_name: 'Decorative Red Velvet Pooja Thali with Brass Diyas',
    product_slug: 'trio-ecart-red-velvet-decorative-pooja-thali-brass-diyas',
    product_price: 549,
    product_old_price: 999,
    product_image: '/products/pooja-thali-brass-diya-1.jpg',
    product_discount: '45% OFF',
    display_order: 2,
    is_active: true
  },
  {
    id: 'reel-3',
    influencer_name: 'Alfiya Khan',
    influencer_username: '@alfiyakhan_couture',
    influencer_avatar: '/assests/shopthelookinflcuernsgram10/Alfiya_Khan.jpg',
    video_url: '/assests/watchandbuy4/tn_63065b21-4f10-44be-bbce-19602a5c9da8.mp4',
    thumbnail_url: '/assests/shopthelookinflcuernsgram10/Alfiya_Khan.jpg',
    caption: 'Crafting bridal potlis with these golden floral zardosi patches 👑 The craftsmanship is so fine, looks completely high-end designer grade!',
    song_title: 'Chhaap Tilak · Sufi Fusion',
    views_count: '289K',
    likes_count: '14.2K',
    comments_count: '840',
    product_id: '107',
    product_name: 'Golden Floral Zardosi Border Lace Trim (9 Meters)',
    product_slug: 'trio-ecart-golden-floral-zardosi-embroidered-lace-trim-9m',
    product_price: 289,
    product_old_price: 599,
    product_image: '/products/golden-floral-zardosi-border-lace-1.jpg',
    product_discount: '52% OFF',
    display_order: 3,
    is_active: true
  },
  {
    id: 'reel-4',
    influencer_name: 'Natasha Prajapati',
    influencer_username: '@natasha.prajapati',
    influencer_avatar: '/assests/shopthelookinflcuernsgram10/Natasha_Prajapati.jpg',
    video_url: '/assests/watchandbuy4/tn_e387e430-ffcc-4044-9e82-974f490f93d1.mp4',
    thumbnail_url: '/assests/shopthelookinflcuernsgram10/Natasha_Prajapati.jpg',
    caption: 'Haldi & mehendi ceremony floral backdrop check 🌸 These pink silk peony buds look 100% real and won’t dry out before the guests arrive!',
    song_title: 'Sadi Gali · Acoustic Lounge',
    views_count: '506K',
    likes_count: '31.9K',
    comments_count: '2,156',
    product_id: '101',
    product_name: 'Silk Peony Flower Buds Craft Set (Pack of 24, Pink)',
    product_slug: 'trio-ecart-artificial-peony-flower-buds-pink-pack-24',
    product_price: 321,
    product_old_price: 649,
    product_image: '/products/silk-peony-flower-buds-pink-1.jpg',
    product_discount: '51% OFF',
    display_order: 4,
    is_active: true
  },
  {
    id: 'reel-5',
    influencer_name: 'Samiksha Rao',
    influencer_username: '@samiksha_2211',
    influencer_avatar: '/assests/shopthelookinflcuernsgram10/Samiksha_2211.jpg',
    video_url: '/assests/watchandbuy4/tn_22511f6c-00ca-4a91-840f-0adce0910551.mp4',
    thumbnail_url: '/assests/shopthelookinflcuernsgram10/Samiksha_2211.jpg',
    caption: 'Decorating my entrance arch with deep red silk roses 🌹 Everyone asked if they were fresh from the florist! Linking the exact pack below.',
    song_title: 'Raanjhan · Ambient Flute',
    views_count: '380K',
    likes_count: '19.6K',
    comments_count: '1,533',
    product_id: '105',
    product_name: 'Silk Red Rose Flower Heads (Pack of 12)',
    product_slug: 'trio-ecart-artificial-red-rose-flower-heads-pack-12',
    product_price: 365,
    product_old_price: 699,
    product_image: '/products/silk-red-rose-flower-heads-1.jpg',
    product_discount: '48% OFF',
    display_order: 5,
    is_active: true
  }
];

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('reels')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn('Supabase /api/reels fallback used:', error?.message);
      return NextResponse.json(FALLBACK_REELS);
    }

    // Enrich with live product data from Supabase products table
    const productIds = data
      .map((r) => r.product_id)
      .filter((id) => id && id.trim && id.trim() !== '');

    if (productIds.length > 0) {
      const { data: liveProducts } = await supabaseAdmin
        .from('products')
        .select('id, name, slug, price, original_price, images, stock, in_stock')
        .in('id', productIds);

      if (liveProducts && liveProducts.length > 0) {
        const prodMap = new Map(liveProducts.map((p) => [String(p.id), p]));

        const enriched = data.map((reel) => {
          const live = reel.product_id ? prodMap.get(String(reel.product_id)) : null;
          if (!live) return reel;

          const price = Number(live.price) || Number(reel.product_price) || 0;
          const oldPrice = Number(live.original_price) || Number(reel.product_old_price) || 0;
          const discount =
            oldPrice > price
              ? `${Math.round(((oldPrice - price) / oldPrice) * 100)}% OFF`
              : reel.product_discount || '';
          const img =
            Array.isArray(live.images) && live.images[0]
              ? live.images[0]
              : reel.product_image;

          return {
            ...reel,
            product_name: live.name || reel.product_name,
            product_slug: live.slug || reel.product_slug,
            product_price: price,
            product_old_price: oldPrice,
            product_image: img,
            product_discount: discount,
            product_stock: live.stock !== undefined ? live.stock : 50,
            product_in_stock: live.in_stock !== undefined ? live.in_stock : true,
          };
        });

        return NextResponse.json(enriched);
      }
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('API /api/reels GET error:', err);
    return NextResponse.json(FALLBACK_REELS);
  }
}

