const { Client } = require('pg');

async function createReelsTable() {
  const client = new Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.gkskeljvgphslkzctjfp',
    password: 'Shree@1203#',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database!');

    const ddl = `
      CREATE TABLE IF NOT EXISTS public.reels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        influencer_name TEXT NOT NULL DEFAULT 'Trio Influencer',
        influencer_username TEXT NOT NULL DEFAULT '@trioenterprises',
        influencer_avatar TEXT DEFAULT '',
        video_url TEXT NOT NULL,
        thumbnail_url TEXT DEFAULT '',
        caption TEXT DEFAULT '',
        tags JSONB DEFAULT '["Trending", "Handcrafted"]'::jsonb,
        song_title TEXT DEFAULT 'Original Audio · Trio Trends',
        views_count TEXT DEFAULT '100K',
        likes_count TEXT DEFAULT '10K',
        comments_count TEXT DEFAULT '250',
        product_id TEXT,
        product_name TEXT DEFAULT '',
        product_slug TEXT DEFAULT '',
        product_price NUMERIC DEFAULT 0,
        product_old_price NUMERIC DEFAULT 0,
        product_image TEXT DEFAULT '',
        product_discount TEXT DEFAULT '',
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_reels_active_order ON public.reels(is_active, display_order);

      ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Public can view active reels" ON public.reels;
      CREATE POLICY "Public can view active reels" ON public.reels
        FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Service role full access on reels" ON public.reels;
      CREATE POLICY "Service role full access on reels" ON public.reels
        FOR ALL USING (true) WITH CHECK (true);
    `;

    await client.query(ddl);
    console.log('✅ Table public.reels created and RLS policies configured successfully!');

    // Check count
    const countRes = await client.query('SELECT COUNT(*) FROM public.reels');
    const count = parseInt(countRes.rows[0].count, 10);
    console.log(`Current reels count in database: ${count}`);

    if (count === 0) {
      console.log('Seeding initial reels data...');
      const seedReels = [
        {
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

      for (const item of seedReels) {
        await client.query(
          `INSERT INTO public.reels (
            influencer_name, influencer_username, influencer_avatar, video_url, thumbnail_url,
            caption, song_title, views_count, likes_count, comments_count,
            product_id, product_name, product_slug, product_price, product_old_price, product_image, product_discount,
            display_order, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
          [
            item.influencer_name, item.influencer_username, item.influencer_avatar, item.video_url, item.thumbnail_url,
            item.caption, item.song_title, item.views_count, item.likes_count, item.comments_count,
            item.product_id, item.product_name, item.product_slug, item.product_price, item.product_old_price, item.product_image, item.product_discount,
            item.display_order, item.is_active
          ]
        );
      }
      console.log('✅ Seeded 5 initial reels into public.reels!');
    }

    const verifyRes = await client.query('SELECT id, influencer_name, influencer_username, video_url, product_name, views_count, likes_count FROM public.reels ORDER BY display_order ASC');
    console.log('Verified database reels:');
    console.table(verifyRes.rows);

  } catch (err) {
    console.error('❌ Error creating/seeding reels table:', err);
  } finally {
    await client.end();
  }
}

createReelsTable();
