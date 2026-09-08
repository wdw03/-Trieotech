export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { generateInvoiceHTML } from '../../../../../lib/invoice';

// GET: Download invoice for an order
export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId } = await params;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`*, order_items (*)`)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only generate invoice for confirmed/delivered orders
    if (order.status === 'pending_payment' || order.status === 'payment_failed') {
      return NextResponse.json({ error: 'Invoice not available for this order' }, { status: 400 });
    }

    const html = generateInvoiceHTML(order);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="invoice-${order.order_number}.html"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
