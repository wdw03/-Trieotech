export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getProductBySlug, getProductById } from '../../../../lib/api/products';
import { products as fallbackProducts } from '../../../../data/products';

// GET: Fetch single product by slug or id
export async function GET(request, { params }) {
  try {
    const rawParam = (await params)?.slug;
    if (!rawParam) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    const decoded = decodeURIComponent(rawParam).trim();
    let product = null;

    if (/^\d+$/.test(decoded)) {
      product = await getProductById(Number(decoded));
    }

    if (!product) {
      product = await getProductBySlug(decoded.toLowerCase());
    }

    if (!product && decoded !== decoded.toLowerCase()) {
      product = await getProductBySlug(decoded);
    }

    if (!product) {
      // Check fallback products
      product = fallbackProducts.find(
        (p) => p.slug?.toLowerCase() === decoded.toLowerCase() || String(p.id) === decoded
      );
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
