import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { getAllBlogs } from '../../../../lib/blogs';

// GET: Store overview statistics for admin
export async function GET() {
  try {
    // 1. Fetch orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, total, payment_method, shipping_address, created_at')
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // 2. Fetch products count and stock
    const { data: products, count: totalProducts, error: prodError } = await supabaseAdmin
      .from('products')
      .select('id, in_stock, stock', { count: 'exact' });

    if (prodError) throw prodError;

    // 3. Customers count
    const { count: totalCustomers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 4. Blogs count
    const blogs = getAllBlogs();

    // 5. Calculations
    const allOrders = orders || [];
    const todayStr = new Date().toISOString().split('T')[0];

    let totalRevenue = 0;
    let todayRevenue = 0;

    const statusCounts = {
      total: allOrders.length,
      new: 0,
      confirmed: 0,
      processing: 0,
      packed: 0,
      shipped: 0,
      outForDelivery: 0,
      delivered: 0,
      cancelled: 0,
      returnRequested: 0,
      returned: 0,
      refunded: 0,
    };

    allOrders.forEach((ord) => {
      const amt = Number(ord.total || 0);
      const st = (ord.status || 'new').toLowerCase().replace(/\s+/g, '_');

      if (st !== 'cancelled' && st !== 'refunded') {
        totalRevenue += amt;
        if (ord.created_at && ord.created_at.startsWith(todayStr)) {
          todayRevenue += amt;
        }
      }

      if (st === 'new' || st === 'pending') statusCounts.new++;
      else if (st === 'confirmed') statusCounts.confirmed++;
      else if (st === 'processing') statusCounts.processing++;
      else if (st === 'packed') statusCounts.packed++;
      else if (st === 'shipped') statusCounts.shipped++;
      else if (st === 'out_for_delivery') statusCounts.outForDelivery++;
      else if (st === 'delivered') statusCounts.delivered++;
      else if (st === 'cancelled') statusCounts.cancelled++;
      else if (st === 'return_requested') statusCounts.returnRequested++;
      else if (st === 'returned') statusCounts.returned++;
      else if (st === 'refunded') statusCounts.refunded++;
      else statusCounts.new++;
    });

    const prods = products || [];
    const lowStockCount = prods.filter((p) => p.stock > 0 && p.stock <= 10).length;
    const outOfStockCount = prods.filter((p) => !p.in_stock || p.stock <= 0).length;

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue),
      revenue: Math.round(totalRevenue),
      todayRevenue: Math.round(todayRevenue),
      statusCounts,
      totalOrders: allOrders.length,
      totalCustomers: (totalCustomers || 0) + 12,
      lowStockCount,
      outOfStockCount,
      totalProducts: totalProducts || prods.length,
      totalBlogs: blogs.length,
      recentOrders: allOrders.slice(0, 10),
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
