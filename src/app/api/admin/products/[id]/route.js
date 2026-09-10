export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { normalizeProduct } from '../route';

// Core handler for updating a product (supports both PUT and PATCH)
async function handleUpdateProduct(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates = {
      updated_at: new Date().toISOString(),
    };

    // Basic text info
    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.slug !== undefined) {
      updates.slug = String(body.slug)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
    if (body.category !== undefined) updates.category = body.category;
    if (body.subcategory !== undefined) updates.subcategory = body.subcategory;
    if (body.brand !== undefined) updates.brand = body.brand;

    // Pricing & Discount
    const priceVal = body.price !== undefined ? Number(body.price) : undefined;
    const origVal = body.original_price !== undefined
      ? Number(body.original_price)
      : (body.originalPrice !== undefined ? Number(body.originalPrice) : undefined);

    if (priceVal !== undefined) updates.price = priceVal;
    if (origVal !== undefined) updates.original_price = origVal;

    if (body.discount !== undefined) {
      updates.discount = Number(body.discount);
    } else if (priceVal !== undefined || origVal !== undefined) {
      // Fetch current price info if one of them is missing to recalculate discount correctly
      const { data: current } = await supabaseAdmin
        .from('products')
        .select('price, original_price')
        .eq('id', id)
        .single();

      const effPrice = priceVal !== undefined ? priceVal : Number(current?.price || 0);
      const effOrig = origVal !== undefined ? origVal : Number(current?.original_price || effPrice);
      updates.discount = effOrig > effPrice ? Math.round(((effOrig - effPrice) / effOrig) * 100) : 0;
    }

    // Stock & Inventory
    const stockVal = body.stock !== undefined
      ? Number(body.stock)
      : (body.availableStock !== undefined ? Number(body.availableStock) : undefined);
    if (stockVal !== undefined) {
      updates.stock = stockVal;
      updates.in_stock = stockVal > 0;
    }
    if (body.in_stock !== undefined) updates.in_stock = Boolean(body.in_stock);
    if (body.inStock !== undefined) updates.in_stock = Boolean(body.inStock);

    // Media
    if (body.images !== undefined) {
      updates.images = Array.isArray(body.images) ? body.images : [body.images];
    } else if (body.image !== undefined) {
      updates.images = [body.image];
    }

    // Variants & Attributes
    if (body.colors !== undefined) {
      updates.colors = Array.isArray(body.colors) ? body.colors : [];
    }
    if (body.sizes !== undefined) {
      updates.sizes = Array.isArray(body.sizes) ? body.sizes : [];
    }
    if (body.material !== undefined) updates.material = body.material;
    if (body.color !== undefined) updates.color = body.color;
    if (body.occasion !== undefined) updates.occasion = body.occasion;
    if (body.package_quantity !== undefined) updates.package_quantity = body.package_quantity;
    if (body.packageQuantity !== undefined) updates.package_quantity = body.packageQuantity;
    if (body.country_of_origin !== undefined) updates.country_of_origin = body.country_of_origin;
    if (body.countryOfOrigin !== undefined) updates.country_of_origin = body.countryOfOrigin;

    // Descriptions & Specifications
    if (body.description !== undefined) updates.description = body.description;
    if (body.short_description !== undefined) updates.short_description = body.short_description;
    if (body.shortDescription !== undefined) updates.short_description = body.shortDescription;
    if (body.full_description !== undefined) updates.full_description = body.full_description;
    if (body.fullDescription !== undefined) updates.full_description = body.fullDescription;
    if (body.specifications !== undefined) {
      updates.specifications = typeof body.specifications === 'object' && body.specifications !== null ? body.specifications : {};
    }
    if (body.features !== undefined) {
      updates.features = Array.isArray(body.features) ? body.features : [];
    }

    // Badge & Feature Flags
    if (body.badge !== undefined) {
      updates.badge = body.badge;
      if (body.badge === 'Best Seller') updates.is_best_seller = true;
      if (body.badge === 'Wedding Special') updates.is_wedding_special = true;
      if (body.badge === 'Festival Special') updates.is_festival_special = true;
      if (body.badge === 'Trending') updates.is_trending = true;
      if (body.badge === 'New') updates.is_new = true;
    }
    if (body.is_featured !== undefined) updates.is_featured = Boolean(body.is_featured);
    if (body.featured !== undefined) updates.is_featured = Boolean(body.featured);
    if (body.is_best_seller !== undefined) updates.is_best_seller = Boolean(body.is_best_seller);
    if (body.bestSeller !== undefined) updates.is_best_seller = Boolean(body.bestSeller);
    if (body.is_wedding_special !== undefined) updates.is_wedding_special = Boolean(body.is_wedding_special);
    if (body.weddingSpecial !== undefined) updates.is_wedding_special = Boolean(body.weddingSpecial);
    if (body.is_festival_special !== undefined) updates.is_festival_special = Boolean(body.is_festival_special);
    if (body.festivalSpecial !== undefined) updates.is_festival_special = Boolean(body.festivalSpecial);
    if (body.is_trending !== undefined) updates.is_trending = Boolean(body.is_trending);
    if (body.trending !== undefined) updates.is_trending = Boolean(body.trending);
    if (body.is_handmade !== undefined) updates.is_handmade = Boolean(body.is_handmade);
    if (body.handmade !== undefined) updates.is_handmade = Boolean(body.handmade);
    if (body.is_new !== undefined) updates.is_new = Boolean(body.is_new);
    if (body.isNew !== undefined) updates.is_new = Boolean(body.isNew);

    // Rating & Reviews
    if (body.rating !== undefined) updates.rating = Number(body.rating);
    if (body.review_count !== undefined) updates.review_count = Number(body.review_count);
    if (body.reviewsCount !== undefined) updates.review_count = Number(body.reviewsCount);

    const { data: updated, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      product: normalizeProduct(updated),
    });
  } catch (err) {
    console.error('Update product error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Update product
export async function PUT(request, context) {
  return handleUpdateProduct(request, context);
}

// PATCH: Partial update product
export async function PATCH(request, context) {
  return handleUpdateProduct(request, context);
}

// DELETE: Delete product
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
