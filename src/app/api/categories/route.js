export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';

// GET: List all active categories
export async function GET() {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Get count of products for each category
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('category');

    const counts = {};
    (products || []).forEach((p) => {
      const cat = p.category;
      if (cat) {
        const lower = String(cat).toLowerCase().trim();
        counts[lower] = (counts[lower] || 0) + 1;
      }
    });

    const formatted = (categories || []).map((c) => {
      const lower = String(c.name || '').toLowerCase().trim();
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        image: c.image || '',
        banner: c.banner || '',
        productCount: counts[lower] ?? c.product_count ?? 0,
        subcategories: Array.isArray(c.subcategories) ? c.subcategories : [],
        sort_order: c.sort_order || 0,
      };
    });

    return NextResponse.json(
      { categories: formatted },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('Fetch categories error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
