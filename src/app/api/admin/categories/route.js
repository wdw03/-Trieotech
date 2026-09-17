export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// GET: List all categories with product counts
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
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });

    const formatted = (categories || []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      image: c.image || '/products/pearl-zardosi-patch-1.jpg',
      banner: c.banner || c.image || '',
      productCount: counts[c.name] ?? c.product_count ?? 0,
      subcategories: Array.isArray(c.subcategories) ? c.subcategories : [],
      sort_order: c.sort_order || 0,
    }));

    return NextResponse.json({ categories: formatted });
  } catch (err) {
    console.error('Fetch categories error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Add category
export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const slug = body.slug
      ? body.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const insertData = {
      name: body.name.trim(),
      slug,
      description: body.description?.trim() || '',
      image: body.image?.trim() || '/products/pearl-zardosi-patch-1.jpg',
      banner: body.banner?.trim() || body.image?.trim() || '',
      sort_order: Number(body.sort_order ?? 99),
      subcategories: Array.isArray(body.subcategories) ? body.subcategories : [],
    };

    const { data: newCat, error } = await supabaseAdmin
      .from('categories')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase category insert error:', error);
      throw error;
    }

    const formatted = {
      id: newCat.id,
      name: newCat.name,
      slug: newCat.slug,
      description: newCat.description || '',
      image: newCat.image || '/products/pearl-zardosi-patch-1.jpg',
      banner: newCat.banner || '',
      productCount: 0,
      subcategories: Array.isArray(newCat.subcategories) ? newCat.subcategories : [],
      sort_order: newCat.sort_order || 0,
    };

    return NextResponse.json({ success: true, category: formatted }, { status: 201 });
  } catch (err) {
    console.error('Create category error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
