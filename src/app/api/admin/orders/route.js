export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// Map status to dashboard friendly title case
const STATUS_MAP = {
  pending: 'New',
  new: 'New',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  return_requested: 'Return Requested',
  returned: 'Returned',
  refunded: 'Refunded',
};

// GET: Fetch all store orders for admin with dashboard normalization
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (*),
        payments (*),
        shipments (*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status && status !== 'all' && status !== 'All') {
      const lower = status.toLowerCase().replace(/\s+/g, '_');
      query = query.or(`status.ilike.%${status}%,status.ilike.%${lower}%`);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    // Fetch auth users to resolve real user emails, phones, and names
    const userEmailsMap = {};
    const userPhonesMap = {};
    const userNamesMap = {};

    try {
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      if (userList?.users) {
        userList.users.forEach((u) => {
          if (u.id) {
            userEmailsMap[u.id] = u.email || u.user_metadata?.email || '';
            userPhonesMap[u.id] = u.phone || u.user_metadata?.phone || '';
            userNamesMap[u.id] = u.user_metadata?.full_name || u.user_metadata?.name || '';
          }
        });
      }
    } catch (err) {
      console.warn('Failed to list auth users in admin orders route:', err.message);
    }

    try {
      const { data: profiles } = await supabaseAdmin.from('profiles').select('id, full_name, email, phone');
      if (profiles) {
        profiles.forEach((p) => {
          if (p.id) {
            if (p.email && !userEmailsMap[p.id]) userEmailsMap[p.id] = p.email;
            if (p.phone && !userPhonesMap[p.id]) userPhonesMap[p.id] = p.phone;
            if (p.full_name && !userNamesMap[p.id]) userNamesMap[p.id] = p.full_name;
          }
        });
      }
    } catch (_) {}

    const normalizedOrders = (orders || []).map((ord) => {
      const addr = ord.shipping_address || {};
      const shipment = ord.shipments?.[0] || {};
      const payment = ord.payments?.[0] || {};
      const uId = ord.user_id;

      const items = (ord.order_items || []).map((item) => ({
        id: item.id,
        productId: item.product_id,
        name: item.product_name || 'Handcrafted Item',
        slug: (item.product_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        image: item.product_image || '/products/pearl-zardosi-patch-1.jpg',
        category: 'Handcrafted',
        price: Number(item.price || 0),
        originalPrice: Math.round(Number(item.price || 0) * 1.2),
        discount: 15,
        quantity: Number(item.quantity || 1),
        selectedColor: 'Standard',
        selectedSize: 'Standard Pack',
      }));

      // Map raw status to dashboard standard
      const rawStatus = ord.status || 'pending';
      const displayStatus = STATUS_MAP[rawStatus.toLowerCase()] || 'New';

      const customerName = addr.firstName
        ? `${addr.firstName} ${addr.lastName || ''}`.trim()
        : (addr.name || (uId && userNamesMap[uId]) || 'Customer');

      const realEmail = addr.email || ord.customer_email || (uId && userEmailsMap[uId]) || '';
      const realPhone = addr.phone || ord.customer_phone || (uId && userPhonesMap[uId]) || '';

      return {
        // Dashboard expected keys
        id: ord.order_number || `ORD-${ord.id.substring(0, 6).toUpperCase()}`,
        db_id: ord.id,
        order_number: ord.order_number,
        date: ord.created_at,
        customer: {
          id: ord.user_id || 'GUEST',
          name: customerName,
          email: realEmail || (uId && userEmailsMap[uId]) || 'No email provided',
          phone: realPhone || '+91 9876543210',
          address: {
            street: addr.address_line || addr.address || addr.street || 'Address on file',
            city: addr.city || 'Faridabad',
            state: addr.state || 'Haryana',
            pincode: addr.pincode || addr.pinCode || addr.zip || '121004',
          },
        },
        status: displayStatus,
        raw_status: ord.status,
        paymentMethod: ord.payment_method === 'cod' ? 'COD' : (ord.payment_method === 'razorpay' ? 'Razorpay Online' : (ord.payment_method || 'Online')),
        paymentStatus: (() => {
          const ps = (ord.payment_status || 'pending').toLowerCase();
          if (['paid', 'captured'].includes(ps)) return 'Paid';
          if (ps === 'failed') return 'Failed';
          if (['refunded', 'refund_processed'].includes(ps)) return 'Refunded';
          if (ps === 'refund_failed') return 'Refund Failed';
          return 'Pending';
        })(),
        shippingPartner: shipment.courier_name || 'Shiprocket / BlueDart',
        trackingNumber: shipment.awb_number || shipment.tracking_number || '',
        estimatedDelivery: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
        shippingCharge: Number(ord.shipping_amount || 0),
        taxAmount: Number(ord.tax_amount || 0),
        discountAmount: Number(ord.discount_amount || 0),
        totalAmount: Number(ord.total || ord.total_amount || 0),
        items,
        // Raw DB fields for compatibility
        created_at: ord.created_at,
        shipping_address: ord.shipping_address,
        billing_address: ord.billing_address,
        notes: ord.notes,
      };
    });

    return NextResponse.json({ orders: normalizedOrders });
  } catch (err) {
    console.error('Admin orders fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
