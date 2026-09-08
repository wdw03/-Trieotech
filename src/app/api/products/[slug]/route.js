export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getProductBySlug, getProductById } from '../../../../lib/api/products';
import { products as fallbackProducts } from '../../../../data/products';

// GET: Fetch single product by slug or id
export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    let product = null;
    const isNumeric = /^\d+$/.test(slug);

    if (isNumeric) {
      product = await getProductById(Number(slug));
    } else {
      product = await getProductBySlug(slug);
    }

    if (!product) {
      // Fallback
      product = fallbackProducts.find(
        (p) => p.slug === slug || String(p.id) === String(slug)
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
