const { Client } = require('pg');

async function setStoragePolicies() {
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
    console.log('Connected to PG');

    const sql = `
      DO $$
      BEGIN
        DROP POLICY IF EXISTS "Public can view reels bucket" ON storage.objects;
        DROP POLICY IF EXISTS "Public can upload to reels bucket" ON storage.objects;
        DROP POLICY IF EXISTS "Public can update reels bucket" ON storage.objects;
        DROP POLICY IF EXISTS "Public can delete from reels bucket" ON storage.objects;

        CREATE POLICY "Public can view reels bucket"
          ON storage.objects FOR SELECT
          USING (bucket_id = 'reels');

        CREATE POLICY "Public can upload to reels bucket"
          ON storage.objects FOR INSERT
          WITH CHECK (bucket_id = 'reels');

        CREATE POLICY "Public can update reels bucket"
          ON storage.objects FOR UPDATE
          USING (bucket_id = 'reels');

        CREATE POLICY "Public can delete from reels bucket"
          ON storage.objects FOR DELETE
          USING (bucket_id = 'reels');
      END
      $$;
    `;

    await client.query(sql);
    console.log('✅ Storage policies for reels bucket created successfully!');
  } catch (err) {
    console.error('Failed to set storage policies:', err);
  } finally {
    await client.end();
  }
}

setStoragePolicies();
