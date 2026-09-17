export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { normalizeProduct } from '../route';

// Core handler for updating a product (supports both PUT and PATCH)
async function handleUpdateProduct(request, { params }) {
  try {
    const { id } = await params;
    const numericId = isNaN(Number(id)) ? id : Number(id);
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
        .eq('id', numericId)
        .single();

      const effPrice = priceVal !== undefined ? priceVal : Number(current?.price || 0);
      const effOrig = origVal !== undefined ? origVal : Number(current?.original_price || effPrice);
      updates.discount = effOrig > effPrice ? Math.round(((effOrig - effPrice) / effOrig) * 100) : 0;
    }

    // Stock & Inventory
    const stockVal = body.stock !== undefined
      ? Number(body.stock)
      : (body.availableStock !== undefined ? Number(body.availableStock) : undefined);

    let inStockVal = body.in_stock !== undefined
      ? Boolean(body.in_stock)
      : (body.inStock !== undefined ? Boolean(body.inStock) : undefined);

    if (stockVal !== undefined) {
      updates.stock = Math.max(0, stockVal);
      if (stockVal === 0) inStockVal = false;
      else if (inStockVal === undefined) inStockVal = true;
    }

    if (inStockVal !== undefined) {
      updates.in_stock = inStockVal;
      if (!inStockVal && (updates.stock === undefined || updates.stock > 0)) {
        updates.stock = 0;
      } else if (inStockVal && (updates.stock === 0 || updates.stock === undefined)) {
        updates.stock = (body.stock !== undefined && Number(body.stock) > 0) ? Number(body.stock) : 25;
      }
    }

    // Storefront Visibility (Hide / Unhide)
    if (body.is_visible !== undefined) updates.is_visible = Boolean(body.is_visible);
    else if (body.isVisible !== undefined) updates.is_visible = Boolean(body.isVisible);

    // Sold Quantity & Thresholds
    if (body.sold_quantity !== undefined) updates.sold_quantity = Math.max(0, Number(body.sold_quantity));
    else if (body.soldQuantity !== undefined) updates.sold_quantity = Math.max(0, Number(body.soldQuantity));

    if (body.low_stock_threshold !== undefined) updates.low_stock_threshold = Number(body.low_stock_threshold);
    else if (body.lowStockThreshold !== undefined) updates.low_stock_threshold = Number(body.lowStockThreshold);

    // Media
    if (body.images !== undefined) {
      updates.images = Array.isArray(body.images) ? body.images : [body.images];
    } else if (body.image !== undefined) {
      updates.images = [body.image];
    }

    // Variants & Attributes (preserve per-color stock and synchronize variant prices & stock)
    if (body.colors !== undefined) {
      const isProductOut = updates.in_stock === false || updates.stock === 0;
      const fallbackStock = isProductOut ? 0 : (updates.stock !== undefined ? updates.stock : (stockVal !== undefined ? stockVal : 50));
      const effVariantPrice = updates.price !== undefined ? updates.price : priceVal;
      const effVariantOrig = updates.original_price !== undefined ? updates.original_price : origVal;
      updates.colors = Array.isArray(body.colors)
        ? body.colors.map(c => {
            if (typeof c === 'object' && c !== null) {
              return {
                ...c,
                price: c.price !== undefined ? Number(c.price) : (effVariantPrice !== undefined ? Number(effVariantPrice) : undefined),
                originalPrice: c.originalPrice !== undefined ? Number(c.originalPrice) : (effVariantOrig !== undefined ? Number(effVariantOrig) : undefined),
                stock: isProductOut ? 0 : (c.stock !== undefined ? Number(c.stock) : fallbackStock),
              };
            }
            return { name: String(c), hex: '#C5A028', price: effVariantPrice, stock: isProductOut ? 0 : fallbackStock };
          })
        : [];
    } else if (updates.price !== undefined || updates.stock !== undefined || updates.in_stock !== undefined) {
      // If price or stock changed but colors was omitted from payload, update existing variant prices and stocks in database
      try {
        const { data: curr } = await supabaseAdmin
          .from('products')
          .select('colors, price, original_price, stock, in_stock')
          .eq('id', numericId)
          .single();

        if (curr?.colors && Array.isArray(curr.colors)) {
          const syncPrice = updates.price !== undefined ? updates.price : curr.price;
          const syncOrig = updates.original_price !== undefined ? updates.original_price : (curr.original_price || syncPrice);
          const isOut = updates.in_stock === false || updates.stock === 0;
          const targetStock = isOut ? 0 : (updates.stock !== undefined ? updates.stock : (curr.stock || 25));

          updates.colors = curr.colors.map(c => {
            if (typeof c === 'object' && c !== null) {
              let varStock = c.stock !== undefined ? Number(c.stock) : targetStock;
              if (isOut) {
                varStock = 0;
              } else if (updates.stock !== undefined && updates.stock > 0 && varStock <= 0) {
                varStock = updates.stock;
              }
              return {
                ...c,
                price: syncPrice !== undefined ? Number(syncPrice) : c.price,
                originalPrice: syncOrig !== undefined ? Number(syncOrig) : c.originalPrice,
                stock: varStock,
              };
            }
            return c;
          });
        }
      } catch (_) {}
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

    // Shipping Weight & Dimensions
    if (body.weight !== undefined) {
      const w = Number(body.weight);
      if (isNaN(w) || w <= 0) {
        return NextResponse.json({ error: 'Product weight is mandatory and must be greater than 0 kg' }, { status: 400 });
      }
      updates.weight = w;
    }
    if (body.length !== undefined) {
      const l = Number(body.length);
      if (isNaN(l) || l <= 0) {
        return NextResponse.json({ error: 'Package length is mandatory and must be greater than 0 cm' }, { status: 400 });
      }
      updates.length = l;
    }
    if (body.breadth !== undefined) {
      const b = Number(body.breadth);
      if (isNaN(b) || b <= 0) {
        return NextResponse.json({ error: 'Package breadth is mandatory and must be greater than 0 cm' }, { status: 400 });
      }
      updates.breadth = b;
    }
    if (body.height !== undefined) {
      const h = Number(body.height);
      if (isNaN(h) || h <= 0) {
        return NextResponse.json({ error: 'Package height is mandatory and must be greater than 0 cm' }, { status: 400 });
      }
      updates.height = h;
    }
    if (body.dimensions !== undefined) {
      updates.dimensions = typeof body.dimensions === 'object' && body.dimensions !== null ? body.dimensions : updates.dimensions;
    }
    if (updates.length !== undefined || updates.breadth !== undefined || updates.height !== undefined) {
      updates.dimensions = {
        length: updates.length !== undefined ? updates.length : (body.dimensions?.length || 15.0),
        breadth: updates.breadth !== undefined ? updates.breadth : (body.dimensions?.breadth || 10.0),
        height: updates.height !== undefined ? updates.height : (body.dimensions?.height || 5.0),
      };
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
      .eq('id', numericId)
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

// GET: Get single product by id for admin
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const numericId = isNaN(Number(id)) ? id : Number(id);
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', numericId)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product: normalizeProduct(product),
    });
  } catch (err) {
    console.error('Get product error:', err);
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
    const numericId = isNaN(Number(id)) ? id : Number(id);

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', numericId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

