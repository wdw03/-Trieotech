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
  return_initiated: 'Return Initiated',
  returned: 'Returned',
  refunded: 'Refunded',
};

function computeAvailableActions(order, shipment) {
  const actions = [];
  const status = (shipment?.status || '').toLowerCase();
  const hasShipment = !!(shipment?.shiprocket_order_id);
  const hasAwb = !!(shipment?.awb_number && !shipment.awb_number.startsWith('SR-') && shipment.awb_number.length > 5);

  if (!hasShipment) {
    actions.push('create_shipment');
    return actions;
  }

  if (status === 'cancelled') {
    actions.push('view_history');
    return actions;
  }

  if (!hasAwb) {
    actions.push('assign_awb', 'cancel_shipment');
    return actions;
  }

  // Once AWB is available, labels can always be printed
  actions.push('print_label', 'print_custom_label');

  if (status === 'pending') {
    actions.push('request_pickup', 'view_couriers', 'cancel_shipment');
  } else if (status === 'pickup_scheduled') {
    actions.push('generate_manifest', 'track_shipment', 'cancel_shipment');
  } else if (['picked_up', 'in_transit', 'out_for_delivery', 'shipped'].includes(status)) {
    actions.push('track_shipment', 'generate_manifest', 'cancel_shipment');
  } else if (['ndr', 'failed_delivery', 'reattempt_scheduled'].includes(status)) {
    actions.push('ndr_action', 'track_shipment', 'cancel_shipment');
  } else if (['rto_initiated', 'rto_delivered'].includes(status)) {
    actions.push('track_shipment');
  } else if (status === 'delivered') {
    actions.push('print_invoice', 'create_return');
  }

  return actions;
}

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

    // Exclude abandoned checkouts and drafts
    query = query
      .neq('status', 'pending_payment')
      .neq('status', 'payment_failed')
      .neq('status', 'draft');

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
      const shipment = Array.isArray(ord.shipments) ? (ord.shipments[0] || {}) : (ord.shipments || {});
      const payment = Array.isArray(ord.payments) ? (ord.payments[0] || {}) : (ord.payments || {});
      const uId = ord.user_id;

      const items = (ord.order_items || []).map((item) => ({
        id: item.id,
        productId: item.product_id,
        name: item.name || item.product_name || 'Handcrafted Item',
        sku: item.sku || `TRIO-${item.product_id || 'GEN'}`,
        hsn: item.hsn || '6304',
        slug: (item.name || item.product_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        image: item.image || item.product_image || '/products/pearl-zardosi-patch-1.jpg',
        category: 'Handcrafted',
        price: Number(item.price || 0),
        originalPrice: Number(item.original_price || Math.round(Number(item.price || 0) * 1.2)),
        discount: Number(item.discount_amount || 0),
        quantity: Number(item.quantity || 1),
        selectedColor: item.color || 'Standard',
        selectedSize: item.size || 'Standard Pack',
      }));

      const rawStatus = ord.status || 'pending';
      const displayStatus = STATUS_MAP[rawStatus.toLowerCase()] || 'New';

      const customerName = addr.firstName
        ? `${addr.firstName} ${addr.lastName || ''}`.trim()
        : (addr.name || (uId && userNamesMap[uId]) || 'Customer');

      const realEmail = addr.email || ord.customer_email || (uId && userEmailsMap[uId]) || '';
      const realPhone = addr.phone || ord.customer_phone || (uId && userPhonesMap[uId]) || '';

      const isCod = ord.payment_method === 'cod';
      const codCollectable = isCod ? Number(shipment.cod_collectable || ord.total || 0) : 0;

      const financials = {
        itemSubtotal: Number(ord.subtotal || 0),
        discount: Number(ord.discount || 0),
        customerShippingCharge: Number(ord.shipping_cost || 0),
        platformFee: Number(ord.platform_fee || 0),
        tax: Number(ord.tax || 0),
        grandTotal: Number(ord.total || 0),
        paymentMethod: ord.payment_method,
        paymentStatus: ord.payment_status || (isCod ? 'cod_pending' : 'paid'),
        codCollectable,
        courierFreightCost: Number(shipment.courier_freight_cost || 0),
        rtoCost: Number(shipment.rto_cost || 0),
        refundAmount: Number(ord.refund_amount || 0),
      };

      const customLabelUrl = `/api/admin/shipments/label/custom?orderId=${encodeURIComponent(ord.order_number)}`;

      const shipmentDetail = {
        id: shipment.id || null,
        status: shipment.status || (shipment.shiprocket_order_id ? 'pending' : 'not_created'),
        awb: shipment.awb_number || '',
        courierName: shipment.courier_name || '',
        courierId: shipment.courier_id || null,
        routingCode: shipment.routing_code || '',
        weight: Number(shipment.weight || 0.5),
        dimensions: shipment.dimensions || { length: 20, breadth: 15, height: 10 },
        shiprocketOrderId: shipment.shiprocket_order_id || '',
        shiprocketShipmentId: shipment.shiprocket_shipment_id || '',
        labelUrl: shipment.label_url || '',
        customLabelUrl,
        manifestUrl: shipment.manifest_url || '',
        invoiceUrl: shipment.invoice_url || `/api/admin/orders/${ord.id}/invoice`,
        pickupStatus: shipment.pickup_status || '',
        pickupToken: shipment.pickup_token || '',
        ndrReason: shipment.ndr_reason || '',
        ndrAction: shipment.ndr_action || '',
        cancelReason: shipment.cancel_reason || '',
        courierFreightCost: Number(shipment.courier_freight_cost || 0),
        codCollectable,
        availableActions: computeAvailableActions(ord, shipment),
      };

      return {
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
        paymentMethod: isCod ? 'COD' : (ord.payment_method === 'razorpay' ? 'Razorpay Online' : (ord.payment_method || 'Online')),
        paymentStatus: (() => {
          const ps = (ord.payment_status || '').toLowerCase();
          if (['paid', 'captured'].includes(ps)) return 'Paid';
          if (ps === 'cod_pending') return 'COD - Pay on Delivery';
          if (ps === 'failed') return 'Failed';
          if (['refunded', 'refund_processed'].includes(ps)) return 'Refunded';
          if (ps === 'refund_failed') return 'Refund Failed';
          const orderStatus = (ord.status || '').toLowerCase();
          if (['confirmed', 'processing', 'packed', 'shipped', 'delivered'].includes(orderStatus)) {
            return isCod ? 'COD - Pay on Delivery' : 'Paid';
          }
          return 'Pending';
        })(),
        shippingPartner: shipment.courier_name || 'Awaiting Shipment',
        trackingNumber: shipment.awb_number || shipment.tracking_number || '',
        estimatedDelivery: shipment.estimated_delivery || ord.estimated_delivery || new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
        shippingCharge: Number(ord.shipping_cost || 0),
        taxAmount: Number(ord.tax || 0),
        discountAmount: Number(ord.discount || 0),
        totalAmount: Number(ord.total || 0),
        items,
        // Detailed shipment object with all lifecycle actions
        shipment: shipmentDetail,
        financials,
        // Legacy dashboard flat keys for backward compatibility
        shipmentStatus: shipment.status || (shipment.shiprocket_order_id ? 'confirmed' : 'none'),
        shiprocketOrderId: shipment.shiprocket_order_id || '',
        shiprocketShipmentId: shipment.shiprocket_shipment_id || '',
        labelUrl: shipment.label_url || '',
        customLabelUrl,
        pickupStatus: shipment.pickup_status || 'pending',
        hasShipment: !!(shipment.shiprocket_order_id),
        hasAwb: !!(shipment.awb_number && !shipment.awb_number.startsWith('SR-') && shipment.awb_number.length > 5),
        created_at: ord.created_at,
        shipping_address: ord.shipping_address,
        notes: ord.notes,
      };
    });

    return NextResponse.json({ orders: normalizedOrders });
  } catch (err) {
    console.error('Admin orders fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
