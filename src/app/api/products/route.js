export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getProducts } from '../../../lib/api/products';

// GET: Fetch products with filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const { products, total } = await getProducts({
      category: searchParams.get('category'),
      subcategory: searchParams.get('subcategory'),
      search: searchParams.get('search') || searchParams.get('q'),
      sort: searchParams.get('sort') || 'created_at',
      order: searchParams.get('order') || 'desc',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      featured: searchParams.get('featured') === 'true',
      bestSeller: searchParams.get('bestSeller') === 'true',
      trending: searchParams.get('trending') === 'true',
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')) : undefined,
    });

    return NextResponse.json({ products, total });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
