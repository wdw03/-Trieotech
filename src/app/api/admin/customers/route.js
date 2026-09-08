export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// GET: List all customers with stats
export async function GET() {
  try {
    // 1. Get profiles
    const { data: profiles, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileErr) throw profileErr;

    // 2. Get orders to aggregate total spent and order counts
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, total, status, created_at, shipping_address');

    // Build customer map
    const customerMap = {};

    (profiles || []).forEach((p) => {
      customerMap[p.id] = {
        id: p.id,
        name: p.full_name || p.email?.split('@')[0] || 'Customer',
        email: p.email || '',
        phone: p.phone || '',
        ordersCount: 0,
        totalSpent: 0,
        status: 'Active',
        city: '',
        state: '',
        joinedDate: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent',
      };
    });

    // Aggregate from orders
    (orders || []).forEach((ord) => {
      const uId = ord.user_id;
      const addr = ord.shipping_address || {};
      const orderTotal = Number(ord.total || 0);

      if (uId && customerMap[uId]) {
        customerMap[uId].ordersCount += 1;
        if (ord.status !== 'cancelled' && ord.status !== 'payment_failed') {
          customerMap[uId].totalSpent += orderTotal;
        }
        if (addr.city && !customerMap[uId].city) customerMap[uId].city = addr.city;
        if (addr.state && !customerMap[uId].state) customerMap[uId].state = addr.state;
        if (addr.phone && !customerMap[uId].phone) customerMap[uId].phone = addr.phone;
      } else if (!uId && addr.email) {
        // Guest customer from order
        const guestKey = `guest-${addr.email}`;
        if (!customerMap[guestKey]) {
          customerMap[guestKey] = {
            id: guestKey,
            name: `${addr.firstName || ''} ${addr.lastName || ''}`.trim() || 'Guest Customer',
            email: addr.email,
            phone: addr.phone || '',
            ordersCount: 1,
            totalSpent: orderTotal,
            status: 'Active',
            city: addr.city || '',
            state: addr.state || '',
            joinedDate: new Date(ord.created_at).toLocaleDateString(),
          };
        } else {
          customerMap[guestKey].ordersCount += 1;
          customerMap[guestKey].totalSpent += orderTotal;
        }
      }
    });

    const customers = Object.values(customerMap);

    return NextResponse.json({ customers, total: customers.length });
  } catch (err) {
    console.error('Fetch customers error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
