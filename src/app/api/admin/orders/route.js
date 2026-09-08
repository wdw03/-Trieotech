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

    const normalizedOrders = (orders || []).map((ord) => {
      const addr = ord.shipping_address || {};
      const shipment = ord.shipments?.[0] || {};
      const payment = ord.payments?.[0] || {};

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
        : (addr.name || 'Customer');

      return {
        // Dashboard expected keys
        id: ord.order_number || `ORD-${ord.id.substring(0, 6).toUpperCase()}`,
        db_id: ord.id,
        order_number: ord.order_number,
        date: ord.created_at,
        customer: {
          id: ord.user_id || 'GUEST',
          name: customerName,
          email: addr.email || ord.customer_email || 'customer@example.com',
          phone: addr.phone || ord.customer_phone || '+91 9876543210',
          address: {
            street: addr.address || addr.street || 'Address on file',
            city: addr.city || 'Mumbai',
            state: addr.state || 'Maharashtra',
            pincode: addr.pinCode || addr.pincode || '400001',
          },
        },
        status: displayStatus,
        raw_status: ord.status,
        paymentMethod: ord.payment_method === 'cod' ? 'COD' : 'UPI',
        paymentStatus: ord.payment_status === 'paid' ? 'Paid' : (ord.payment_status === 'failed' ? 'Failed' : 'Pending'),
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
