export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

// PUT: Update category
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 1. Fetch current category data before applying updates
    const { data: existingCat } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', Number(id))
      .single();

    const updates = {};
    if (body.name !== undefined) updates.name = body.name ? String(body.name).trim() : '';
    if (body.slug !== undefined) updates.slug = body.slug ? String(body.slug).trim() : '';
    if (body.description !== undefined) updates.description = body.description ? String(body.description).trim() : '';
    if (body.image !== undefined) updates.image = body.image ? String(body.image).trim() : '';
    if (body.banner !== undefined) updates.banner = body.banner ? String(body.banner).trim() : '';
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);
    if (body.subcategories !== undefined && Array.isArray(body.subcategories)) {
      updates.subcategories = body.subcategories;
    }

    const { data: updated, error } = await supabaseAdmin
      .from('categories')
      .update(updates)
      .eq('id', Number(id))
      .select()
      .single();

    if (error) {
      console.error('Supabase category update error:', error);
      throw error;
    }

    // 2. If category name was renamed, cascade update to products table so products don't disconnect
    if (
      existingCat?.name &&
      updates.name &&
      existingCat.name.toLowerCase().trim() !== updates.name.toLowerCase().trim()
    ) {
      try {
        await supabaseAdmin
          .from('products')
          .update({ category: updates.name })
          .ilike('category', existingCat.name);
      } catch (cascadeErr) {
        console.warn('Failed to cascade category rename to products:', cascadeErr);
      }
    }

    // 3. Count matching products for formatted response
    const { count: productCount } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .ilike('category', updated.name);

    const formattedCategory = {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description || '',
      image: updated.image || '',
      banner: updated.banner || '',
      productCount: productCount ?? 0,
      subcategories: Array.isArray(updated.subcategories) ? updated.subcategories : [],
      sort_order: updated.sort_order || 0,
    };

    // 4. Revalidate frontend paths
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout');
      revalidatePath('/shop', 'page');
      revalidatePath(`/category/${updated.slug}`, 'page');
      if (existingCat?.slug && existingCat.slug !== updated.slug) {
        revalidatePath(`/category/${existingCat.slug}`, 'page');
      }
    } catch (_) {}

    return NextResponse.json({ success: true, category: formattedCategory });
  } catch (err) {
    console.error('Update category error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete category
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const { data: catToDelete } = await supabaseAdmin
      .from('categories')
      .select('slug')
      .eq('id', Number(id))
      .single();

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', Number(id));

    if (error) {
      console.error('Supabase category delete error:', error);
      throw error;
    }

    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout');
      revalidatePath('/shop', 'page');
      if (catToDelete?.slug) {
        revalidatePath(`/category/${catToDelete.slug}`, 'page');
      }
    } catch (_) {}

    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error('Delete category error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
