import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  let dbStatus = 'healthy';
  try {
    const { error } = await supabaseAdmin.from('products').select('id', { count: 'exact', head: true });
    if (error) dbStatus = 'degraded: ' + error.message;
  } catch (err) {
    dbStatus = 'error: ' + err.message;
  }

  return NextResponse.json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    service: 'trioenterprises-fullstack',
    environment: process.env.NODE_ENV || 'production',
  });
}
