export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../../lib/supabase/admin';
import { generateInvoiceHTML } from '../../../../../../lib/invoice';

// GET: View or Download official invoice for an order from admin panel
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const shouldDownload = searchParams.get('download') === 'true';

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabaseAdmin
      .from('orders')
      .select(`*, order_items (*)`);

    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('order_number', id);
    }

    const { data: order, error } = await query.single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const html = generateInvoiceHTML(order);

    const disposition = shouldDownload
      ? `attachment; filename="Invoice-${order.order_number}.html"`
      : `inline; filename="Invoice-${order.order_number}.html"`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': disposition,
      },
    });
  } catch (err) {
    console.error('Invoice generation error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate invoice' }, { status: 500 });
  }
}
