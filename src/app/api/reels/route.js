export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';

// Fallback reels in case database is unreachable
const FALLBACK_REELS = [
  {
    id: 'f6750212-5761-4c2c-bec8-0e649d455c94',
    influencer_name: 'Abida Fatima',
    influencer_username: '@abida.fatima_',
    influencer_avatar: 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/avatars/Abida_Fatima.jpg',
    video_url: 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/videos/pearl_zardosi_craft_reel.mp4',
    thumbnail_url: 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/avatars/Abida_Fatima.jpg',
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
    id: '6bf36e38-2e3f-4db5-86e8-75c1dd4a8e17',
    influencer_name: 'Agrani Singh',
    influencer_username: '@agranisingh.official',
    influencer_avatar: 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/avatars/Agrani_SINGH.jpg',
    video_url: 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/videos/pooja_thali_brass_diya_reel.mp4',
    thumbnail_url: 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/avatars/Agrani_SINGH.jpg',
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
    id: 'd5f985ae-05ea-40d8-8672-e34c3332f992',
    influencer_name: 'Dezy Jariwala',
    influencer_username: '@dezyjariwala',
    influencer_avatar: 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/avatars/Dezy_Jariwala.jpg',
    video_url: 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/videos/golden_gota_moti_chudi_reel.mp4',
    thumbnail_url: 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/avatars/Dezy_Jariwala.jpg',
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
    id: 'dec02b29-0fd5-4772-9d72-dbde74308598',
    influencer_name: 'Natasha Prajapati',
    influencer_username: '@natasha.prajapati',
    influencer_avatar: 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/avatars/Natasha_Prajapati.jpg',
    video_url: 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/videos/silk_peony_flower_buds_reel.mp4',
    thumbnail_url: 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/avatars/Natasha_Prajapati.jpg',
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
    id: '294230fb-c77a-4bc5-bc35-4cc97571cea5',
    influencer_name: 'Samiksha Rao',
    influencer_username: '@samiksha_2211',
    influencer_avatar: 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/avatars/Samiksha_2211.jpg',
    video_url: 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/videos/silk_red_rose_garland_reel.mp4',
    thumbnail_url: 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/avatars/Samiksha_2211.jpg',
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

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store'
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';

    let query = supabaseAdmin
      .from('reels')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!showAll) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      console.warn('Supabase /api/reels fallback used:', error?.message);
      return NextResponse.json(showAll ? [] : FALLBACK_REELS, { headers: NO_CACHE_HEADERS });
    }

    // Enrich with live product data from Supabase products table
    const productIds = data
      .map((r) => r.product_id)
      .filter((id) => id && String(id).trim() !== '');

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

        return NextResponse.json(enriched, { headers: NO_CACHE_HEADERS });
      }
    }

    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('API /api/reels GET error:', err);
    return NextResponse.json(FALLBACK_REELS, { headers: NO_CACHE_HEADERS });
  }
}

// POST: Create reel (Admin)
export async function POST(request) {
  try {
    const body = await request.json();
    const payload = {
      influencer_name: (body.influencer_name || body.name || 'Trio Influencer').trim(),
      influencer_username: (body.influencer_username || body.handle || '@trioenterprises').trim(),
      influencer_avatar: (body.influencer_avatar || body.img || '').trim(),
      video_url: (body.video_url || body.video || '').trim(),
      thumbnail_url: (body.thumbnail_url || body.influencer_avatar || body.img || '').trim(),
      caption: (body.caption || '').trim(),
      song_title: (body.song_title || body.song || 'Original Audio · Trio Trends').trim(),
      views_count: (body.views_count || body.views || '150K').trim(),
      likes_count: (body.likes_count || body.likes || '18.5K').trim(),
      comments_count: (body.comments_count || body.comments || '320').trim(),
      product_id: body.product_id ? String(body.product_id) : '',
      product_name: (body.product_name || body.product || '').trim(),
      product_slug: (body.product_slug || body.slug || '').trim(),
      product_price: Number(body.product_price) || 0,
      product_old_price: Number(body.product_old_price) || 0,
      product_image: (body.product_image || '').trim(),
      product_discount: (body.product_discount || '').trim(),
      display_order: Number(body.display_order) || 0,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
    };

    const { data, error } = await supabaseAdmin
      .from('reels')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: true, reel: data }, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
