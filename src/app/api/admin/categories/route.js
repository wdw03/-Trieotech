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
      productCount: counts[c.name] || 0,
      subcategories: [],
      sort_order: c.sort_order || 0,
      is_active: c.is_active ?? true,
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
    if (!body.name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const slug = body.slug
      ? body.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const { data: newCat, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name: body.name,
        slug,
        description: body.description || '',
        image: body.image || '/products/pearl-zardosi-patch-1.jpg',
        sort_order: body.sort_order || 99,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, category: newCat }, { status: 201 });
  } catch (err) {
    console.error('Create category error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
