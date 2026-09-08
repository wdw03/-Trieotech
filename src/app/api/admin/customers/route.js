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

    // 2. Get auth users to map emails
    let authUsersMap = {};
    try {
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      if (userList?.users) {
        userList.users.forEach((u) => {
          if (u.id && u.email) {
            authUsersMap[u.id] = u.email;
          }
        });
      }
    } catch (_) {}

    // 3. Get orders to aggregate total spent and order counts
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, total, status, created_at, shipping_address');

    // Build customer map
    const customerMap = {};

    (profiles || []).forEach((p) => {
      const email = p.email || authUsersMap[p.id] || '';
      const name = p.full_name || email.split('@')[0] || 'Artisan Patron';
      customerMap[p.id] = {
        id: p.id,
        name,
        email,
        phone: p.phone || '',
        totalOrders: 0,
        ordersCount: 0,
        totalSpent: 0,
        status: 'Active',
        city: 'Jaipur',
        state: 'Rajasthan',
        tags: ['Artisan Patron'],
        avatar: name.slice(0, 2).toUpperCase(),
        addresses: [],
        notes: '',
        joinedDate: p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : 'Recent',
      };
    });

    // Aggregate from orders
    (orders || []).forEach((ord) => {
      const uId = ord.user_id;
      const addr = ord.shipping_address || {};
      const orderTotal = Number(ord.total || 0);

      if (uId && customerMap[uId]) {
        customerMap[uId].totalOrders += 1;
        customerMap[uId].ordersCount += 1;
        if (ord.status !== 'cancelled' && ord.status !== 'payment_failed') {
          customerMap[uId].totalSpent += orderTotal;
        }
        if (addr.city) customerMap[uId].city = addr.city;
        if (addr.state) customerMap[uId].state = addr.state;
        if (addr.phone && !customerMap[uId].phone) customerMap[uId].phone = addr.phone;
        if (addr.address_line || addr.address) {
          customerMap[uId].addresses.push({
            type: 'Delivery',
            text: `${addr.address_line || addr.address}, ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || addr.zip || ''}`
          });
        }
      } else if (!uId && addr.email) {
        // Guest customer from order
        const guestKey = `guest-${addr.email.toLowerCase()}`;
        if (!customerMap[guestKey]) {
          const guestName = `${addr.firstName || addr.name || ''} ${addr.lastName || ''}`.trim() || 'Guest Patron';
          customerMap[guestKey] = {
            id: guestKey,
            name: guestName,
            email: addr.email,
            phone: addr.phone || '',
            totalOrders: 1,
            ordersCount: 1,
            totalSpent: orderTotal,
            status: 'Active',
            city: addr.city || 'India',
            state: addr.state || '',
            tags: ['Guest Patron'],
            avatar: guestName.slice(0, 2).toUpperCase(),
            addresses: addr.address ? [{ type: 'Order Address', text: `${addr.address}, ${addr.city || ''}` }] : [],
            notes: 'Placed order as guest',
            joinedDate: new Date(ord.created_at).toLocaleDateString('en-IN'),
          };
        } else {
          customerMap[guestKey].totalOrders += 1;
          customerMap[guestKey].ordersCount += 1;
          customerMap[guestKey].totalSpent += orderTotal;
        }
      }
    });

    // Compute tags based on spend and orders
    Object.values(customerMap).forEach((c) => {
      const tags = ['Artisan Patron'];
      if (c.totalSpent > 5000 || c.totalOrders >= 3) {
        tags.push('VIP');
        tags.push('High Value');
      } else if (c.totalOrders === 1) {
        tags.push('New Buyer');
      }
      c.tags = tags;
    });

    const customers = Object.values(customerMap);

    return NextResponse.json({ customers, total: customers.length });
  } catch (err) {
    console.error('Fetch customers error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
