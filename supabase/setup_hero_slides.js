const { Client } = require('pg');

async function setupHeroSlides() {
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
    console.log('Connected to Supabase PostgreSQL!');

    // 1. Create public.hero_slides table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.hero_slides (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        subtitle TEXT DEFAULT '',
        badge TEXT DEFAULT 'Festive Special',
        tag TEXT DEFAULT 'Authentic Craft',
        cta_text TEXT DEFAULT 'Shop Now',
        desktop_cta_text TEXT DEFAULT 'Explore Collection',
        cta_link TEXT DEFAULT '/shop',
        secondary_cta_text TEXT DEFAULT 'Learn More',
        secondary_cta_link TEXT DEFAULT '/blog',
        mobile_title TEXT DEFAULT '',
        mobile_subtitle TEXT DEFAULT '',
        mobile_cta_text TEXT DEFAULT 'Shop Now',
        desktop_image TEXT NOT NULL,
        mobile_image TEXT DEFAULT '',
        secondary_image TEXT DEFAULT '',
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await client.query(createTableQuery);
    console.log('Table public.hero_slides created or verified.');

    // 2. Enable RLS and add public access policies
    await client.query(`
      ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
      
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hero_slides' AND policyname = 'Allow public read access') THEN
          CREATE POLICY "Allow public read access" ON public.hero_slides FOR SELECT USING (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hero_slides' AND policyname = 'Allow anon insert') THEN
          CREATE POLICY "Allow anon insert" ON public.hero_slides FOR INSERT WITH CHECK (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hero_slides' AND policyname = 'Allow anon update') THEN
          CREATE POLICY "Allow anon update" ON public.hero_slides FOR UPDATE USING (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hero_slides' AND policyname = 'Allow anon delete') THEN
          CREATE POLICY "Allow anon delete" ON public.hero_slides FOR DELETE USING (true);
        END IF;
      END $$;
    `);
    console.log('RLS policies configured for hero_slides.');

    // 3. Ensure storage bucket 'banners' exists
    await client.query(`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('banners', 'banners', true, 26214400, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);

    // Storage RLS for banners bucket
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public banners select') THEN
          CREATE POLICY "Allow public banners select" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow anon banners insert') THEN
          CREATE POLICY "Allow anon banners insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow anon banners update') THEN
          CREATE POLICY "Allow anon banners update" ON storage.objects FOR UPDATE USING (bucket_id = 'banners');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow anon banners delete') THEN
          CREATE POLICY "Allow anon banners delete" ON storage.objects FOR DELETE USING (bucket_id = 'banners');
        END IF;
      END $$;
    `);
    console.log('Banners storage bucket and storage RLS configured.');

    // 4. Seed initial authentic hero slides if table is empty
    const checkCount = await client.query(`SELECT count(*) FROM public.hero_slides;`);
    if (parseInt(checkCount.rows[0].count, 10) === 0) {
      console.log('Seeding initial authentic hero slides...');
      const seedSlides = [
        {
          title: "Handcrafted Zardosi & Sacred Deity Patches",
          mobile_title: "Handcrafted Zardosi & Deity Patches",
          subtitle: "Ornate gold zari, zarkan stone cutwork, and royal peacock motifs hand-stitched by generational master karigars for bridal lehengas and festive couture.",
          mobile_subtitle: "Royal zari, zarkan stone cutwork & peacock motifs by master karigars.",
          badge: "Festive & Wedding 2026",
          tag: "Authentic Imperial Zari",
          cta_text: "Explore Patches",
          desktop_cta_text: "Explore Embroidery Patches",
          cta_link: "/category/patches",
          secondary_cta_text: "View Best Sellers",
          secondary_cta_link: "/shop",
          desktop_image: "/products/shreenathji-statement-patch-1.jpg",
          mobile_image: "/products/shreenathji-statement-patch-1.jpg",
          secondary_image: "/products/peacock-real-feathers-pair-1.jpg",
          display_order: 1,
          is_active: true
        },
        {
          title: "Ayurvedic Hammered Pure Copper Bottles",
          mobile_title: "Pure Ayurvedic Copper Bottles",
          subtitle: "Infuse your daily water with natural antimicrobial goodness and holistic vitality. Hand-hammered with heavy-gauge pure copper by traditional thatheras.",
          mobile_subtitle: "Hand-hammered heavy-gauge pure copper for holistic daily vitality.",
          badge: "100% Pure Tamra Jal Wellness",
          tag: "100% Pure Copper",
          cta_text: "Shop Copper Bottles",
          desktop_cta_text: "Shop Copper Bottles",
          cta_link: "/category/bottle",
          secondary_cta_text: "Ayurveda Guide",
          secondary_cta_link: "/blog/ayurvedic-benefits-pure-copper-water-bottle",
          desktop_image: "/products/hammered-copper-bottle-1.jpg",
          mobile_image: "/products/hammered-copper-bottle-1.jpg",
          secondary_image: "/products/jute-bottle-bag-1.jpg",
          display_order: 2,
          is_active: true
        },
        {
          title: "Royal Velvet Pooja Aasans & Brass Thalis",
          mobile_title: "Velvet Pooja Aasans & Brass Thalis",
          subtitle: "Elevate your daily aarti and festive mandir ceremonies with pure red velvet aasans, embellished brass diyas, and authentic desi cotton gamchas.",
          mobile_subtitle: "Pure velvet aasans, embellished brass diyas & sacred essentials.",
          badge: "Devotion & Sacred Rituals",
          tag: "Auspicious Festivities",
          cta_text: "Discover Pooja Items",
          desktop_cta_text: "Discover Pooja Essentials",
          cta_link: "/category/aasan",
          secondary_cta_text: "Festival Special",
          secondary_cta_link: "/category/towel-gamcha",
          desktop_image: "/products/pooja-thali-brass-diya-1.jpg",
          mobile_image: "/products/pooja-thali-brass-diya-1.jpg",
          secondary_image: "/products/lotus-kamal-aasan-1.jpg",
          display_order: 3,
          is_active: true
        }
      ];

      for (const s of seedSlides) {
        await client.query(`
          INSERT INTO public.hero_slides (
            title, mobile_title, subtitle, mobile_subtitle,
            badge, tag, cta_text, desktop_cta_text, cta_link,
            secondary_cta_text, secondary_cta_link,
            desktop_image, mobile_image, secondary_image,
            display_order, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
          s.title, s.mobile_title, s.subtitle, s.mobile_subtitle,
          s.badge, s.tag, s.cta_text, s.desktop_cta_text, s.cta_link,
          s.secondary_cta_text, s.secondary_cta_link,
          s.desktop_image, s.mobile_image, s.secondary_image,
          s.display_order, s.is_active
        ]);
      }
      console.log('Seeded 3 initial hero slides into public.hero_slides.');
    } else {
      console.log(`Table already has ${checkCount.rows[0].count} hero slides.`);
    }

  } catch (err) {
    console.error('Error setting up hero slides:', err);
  } finally {
    await client.end();
  }
}

setupHeroSlides();
