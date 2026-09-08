export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { generateInvoiceHTML } from '../../../../../lib/invoice';

// GET: View or Download official invoice for an order
export async function GET(request, { params }) {
  try {
    let user = null;
    try {
      const supabase = await createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      user = u;
    } catch (_) {}

    const { orderId } = await params;
    const { searchParams } = new URL(request.url);
    const shouldDownload = searchParams.get('download') === 'true';

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

    let query = supabaseAdmin
      .from('orders')
      .select(`*, order_items (*)`);

    if (isUuid) {
      query = query.eq('id', orderId);
    } else {
      query = query.eq('order_number', orderId);
    }

    const { data: order, error } = await query.single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Authorization check: if authenticated user is present and order belongs to a user, check matching ID (unless admin)
    if (order.user_id && user) {
      const isAdmin = user.email === 'trioent19@gmail.com' || user.user_metadata?.role === 'admin';
      if (!isAdmin && order.user_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized to view this invoice' }, { status: 403 });
      }
    }

    // If order is payment_failed, do not issue an invoice
    if (order.status === 'payment_failed') {
      return NextResponse.json(
        { error: 'Invoice not available for unpaid / cancelled orders' },
        { status: 400 }
      );
    }

    const html = generateInvoiceHTML(order);

    const disposition = shouldDownload
      ? `attachment; filename="Invoice-${order.order_number}.html"`
      : `inline; filename="Invoice-${order.order_number}.html"`;

    return new NextResponse(html, {
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
