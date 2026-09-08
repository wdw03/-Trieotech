const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function runSchema() {
  const hosts = [
    'db.gkskeljvgphslkzctjfp.supabase.co',
  ];

  for (const host of hosts) {
    for (const port of [5432, 6543]) {
      console.log(`Trying ${host}:${port}...`);
      const client = new Client({
        host,
        port,
        database: 'postgres',
        user: 'postgres',
        password: process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });

      try {
        await client.connect();
        console.log(`✅ Connected successfully to ${host}:${port}!`);
        
        console.log('Reading supabase/schema.sql...');
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
        console.log('Executing schema.sql...');
        await client.query(schemaSql);
        console.log('✅ schema.sql executed successfully!');
        
        await client.end();
        return true;
      } catch (err) {
        console.log(`❌ Failed on ${host}:${port}: ${err.message}`);
        try { await client.end(); } catch (_) {}
      }
    }
  }
  return false;
}

runSchema();
