'use client';
import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../context/AdminContext.jsx';
import { ProductImage } from '../ui/ProductImage.jsx';
import { adminApi } from '../../../services/adminApi.js';
import { calculateOrderTotal } from '../../../data/admin/orders.js';
import { usePageLoading } from '../../../hooks/usePageLoading.js';
import {
  Skeleton,
  SkeletonCircle,
  MetricCardSkeleton,
  ChartCardSkeleton
} from '../ui/Skeleton.jsx';
import gsap from 'gsap';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Package,
  Calendar,
  ChevronRight,
  Eye,
  FileText,
  MessageSquare,
  Mail
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Chart datasets
const revenueData = [
  { month: 'Oct', revenue: 42500, orders: 110 },
  { month: 'Nov', revenue: 68900, orders: 185 }, // Diwali spike
  { month: 'Dec', revenue: 54200, orders: 140 }, // Wedding season
  { month: 'Jan', revenue: 48600, orders: 125 },
  { month: 'Feb', revenue: 59300, orders: 155 },
  { month: 'Mar', revenue: 43100, orders: 118 },
  { month: 'Apr', revenue: 51200, orders: 135 },
  { month: 'May', revenue: 47800, orders: 122 },
  { month: 'Jun', revenue: 56400, orders: 148 },
  { month: 'Jul', revenue: 62100, orders: 165 },
  { month: 'Aug', revenue: 84300, orders: 220 }, // Janmashtami & Rakhi rush
  { month: 'Sep', revenue: 98400, orders: 260 }
];

const categorySalesData = [
  { name: 'Patches', value: 42, color: '#6366F1' },
  { name: 'Flower Bunch', value: 20, color: '#EC4899' },
  { name: 'Bottle', value: 14, color: '#F59E0B' },
  { name: 'Cup Chain', value: 12, color: '#8B5CF6' },
  { name: 'Pooja Items', value: 12, color: '#10B981' }
];

export const Dashboard = () => {
  const { stats, orders, products, customers, setPrintDocument } = useAdmin();
  const isPageLoading = usePageLoading(450);
  const router = useRouter();
  const navigate = (path) => router.push(path.startsWith('/admin') ? path : `/admin${path === '/' ? '' : path}`);
  const containerRef = useRef(null);

  // Live Contact Inquiries State
  const [recentInquiries, setRecentInquiries] = React.useState([]);
  const [inquiriesLoading, setInquiriesLoading] = React.useState(true);

  React.useEffect(() => {
    adminApi.getContactMessages({ limit: 4 })
      .then((res) => {
        if (res && Array.isArray(res.messages)) {
          setRecentInquiries(res.messages.slice(0, 4));
        }
      })
      .catch((err) => console.warn('Dashboard inquiries load notice:', err))
      .finally(() => setInquiriesLoading(false));
  }, []);

  useEffect(() => {
    if (isPageLoading) return;

    // GSAP entrance animation
    const ctx = gsap.context(() => {
      gsap.from('.dash-metric-card', {
        y: 20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.04,
        ease: 'power2.out'
      });
      gsap.from('.dash-section', {
        y: 25,
        opacity: 0,
        duration: 0.5,
        delay: 0.1,
        stagger: 0.1,
        ease: 'power2.out'
      });
    }, containerRef);

    return () => ctx.revert();
  }, [isPageLoading]);

  // Top 5 selling craft products from catalog
  const topProducts = [
    { ...products[0], unitsSold: 342, totalSales: 68058 }, // Pearl zardosi
    { ...products[1], unitsSold: 289, totalSales: 71961 }, // Beaded Lotus
    { ...products[15], unitsSold: 412, totalSales: 81988 }, // Pollen Flowers
    { ...products[23], unitsSold: 164, totalSales: 213036 }, // Pure Copper Bottle
    { ...products[27], unitsSold: 220, totalSales: 65780 } // Gold Clear Cup Chain
  ];

  // Low stock products from catalog
  const lowStockItems = products.filter((p) => p.stock !== undefined && p.stock <= 15).slice(0, 4);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Dashboard Overview</h1>
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live Store Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Handcrafted patches, artificial flowers, copper bottles & festival decor analytics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-medium">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Today: Sep 03, 2026</span>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="btn-primary py-1.5 px-3.5 text-xs"
          >
            Manage Orders ({stats.statusCounts.total})
          </button>
        </div>
      </div>

      {/* CORE METRICS GRID (Revenue, Orders, Customers, Inventory) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {isPageLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))
        ) : (
          <>
            {/* Total Revenue */}
            <div className="dash-metric-card admin-card p-4 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Revenue</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-white mt-2">₹{stats.totalRevenue.toLocaleString()}</p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium mt-1">
                <TrendingUp className="w-3 h-3" /> +18.4% this month
              </div>
              <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
            </div>

            {/* Today's Revenue */}
            <div className="dash-metric-card admin-card p-4 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Today's Revenue</span>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-white mt-2">₹{stats.todayRevenue.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400 mt-1">From 2 new orders today</p>
              <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors" />
            </div>

            {/* Total Orders */}
            <div className="dash-metric-card admin-card p-4 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Orders</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-white mt-2">{stats.statusCounts.total}</p>
              <p className="text-[11px] text-indigo-400 font-medium mt-1">{stats.statusCounts.new} awaiting dispatch</p>
            </div>

            {/* Total Customers */}
            <div className="dash-metric-card admin-card p-4 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Customers</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-white mt-2">{stats.totalCustomers}</p>
              <p className="text-[11px] text-purple-400 font-medium mt-1">68% repeat artisans</p>
            </div>

            {/* Low / Out of Stock Alert */}
            <div className="dash-metric-card admin-card p-4 relative overflow-hidden group border-rose-500/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Stock Alerts</span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-rose-400 mt-2">{stats.lowStockCount} Low</p>
              <p className="text-[11px] text-rose-300/80 font-medium mt-1">{stats.outOfStockCount} Out of stock</p>
            </div>
          </>
        )}
      </div>

      {/* DETAILED ORDER PIPELINE STATUS STRIP (All 10 required order statuses) */}
      <div className="dash-section admin-card p-4 sm:p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center justify-between">
          <span>Order Pipeline Status Overview</span>
          <span className="text-[11px] text-indigo-400 font-normal hover:underline cursor-pointer" onClick={() => navigate('/orders')}>
            View Complete Board →
          </span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2.5">
          {isPageLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 text-center space-y-1.5">
                <Skeleton className="h-2.5 w-12 mx-auto" />
                <Skeleton className="h-5 w-8 mx-auto" />
              </div>
            ))
          ) : (
            <>
              <div onClick={() => navigate('/orders')} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center hover:border-indigo-500/50 cursor-pointer transition-all">
                <span className="text-[10px] text-slate-400 block font-medium">New</span>
                <span className="text-lg font-bold text-indigo-400">{stats.statusCounts.new}</span>
              </div>
              <div onClick={() => navigate('/orders')} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center hover:border-indigo-500/50 cursor-pointer transition-all">
                <span className="text-[10px] text-slate-400 block font-medium">Confirmed</span>
                <span className="text-lg font-bold text-blue-400">{stats.statusCounts.confirmed}</span>
              </div>
              <div onClick={() => navigate('/orders')} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center hover:border-indigo-500/50 cursor-pointer transition-all">
                <span className="text-[10px] text-slate-400 block font-medium">Processing</span>
                <span className="text-lg font-bold text-amber-400">{stats.statusCounts.processing}</span>
              </div>
              <div onClick={() => navigate('/orders')} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center hover:border-indigo-500/50 cursor-pointer transition-all">
                <span className="text-[10px] text-slate-400 block font-medium">Packed</span>
                <span className="text-lg font-bold text-yellow-400">{stats.statusCounts.packed}</span>
              </div>
              <div onClick={() => navigate('/orders')} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center hover:border-indigo-500/50 cursor-pointer transition-all">
                <span className="text-[10px] text-slate-400 block font-medium">Shipped</span>
                <span className="text-lg font-bold text-cyan-400">{stats.statusCounts.shipped}</span>
              </div>
              <div onClick={() => navigate('/orders')} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center hover:border-indigo-500/50 cursor-pointer transition-all">
                <span className="text-[10px] text-slate-400 block font-medium">Out for Delivery</span>
                <span className="text-lg font-bold text-teal-400">{stats.statusCounts.outForDelivery}</span>
              </div>
              <div onClick={() => navigate('/orders')} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center hover:border-indigo-500/50 cursor-pointer transition-all">
                <span className="text-[10px] text-slate-400 block font-medium">Delivered</span>
                <span className="text-lg font-bold text-emerald-400">{stats.statusCounts.delivered}</span>
              </div>
              <div onClick={() => navigate('/orders')} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center hover:border-indigo-500/50 cursor-pointer transition-all">
                <span className="text-[10px] text-slate-400 block font-medium">Cancelled</span>
                <span className="text-lg font-bold text-rose-400">{stats.statusCounts.cancelled}</span>
              </div>
              <div onClick={() => navigate('/orders')} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center hover:border-indigo-500/50 cursor-pointer transition-all">
                <span className="text-[10px] text-slate-400 block font-medium">Returned</span>
                <span className="text-lg font-bold text-purple-400">{stats.statusCounts.returned}</span>
              </div>
              <div onClick={() => navigate('/orders')} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center hover:border-indigo-500/50 cursor-pointer transition-all">
                <span className="text-[10px] text-slate-400 block font-medium">Refunded</span>
                <span className="text-lg font-bold text-fuchsia-400">{stats.statusCounts.refunded}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CHARTS SECTION: Revenue Analytics + Category Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 dash-section">
        {isPageLoading ? (
          <>
            <div className="lg:col-span-2">
              <ChartCardSkeleton height="h-72" />
            </div>
            <div className="lg:col-span-1">
              <ChartCardSkeleton height="h-72" />
            </div>
          </>
        ) : (
          <>
            {/* Revenue & Orders Chart */}
            <div className="lg:col-span-2 admin-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
              <h3 className="font-bold text-white text-base">Revenue & Sales Trends</h3>
              <p className="text-xs text-slate-400">Monthly sales trajectory across wedding & festive craft peaks</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Revenue (₹)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Orders Count
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(value, name) => [name === 'revenue' ? `₹${value.toLocaleString()}` : value, name === 'revenue' ? 'Revenue' : 'Orders']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut */}
        <div className="admin-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Category Distribution</h3>
            <p className="text-xs text-slate-400">Sales volume by handcrafted product vertical</p>
          </div>

          <div className="h-52 w-full my-auto flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySalesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categorySalesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(v) => [`${v}%`, 'Share']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
            {categorySalesData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 truncate">{item.name}</span>
                <span className="text-slate-500 ml-auto font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
        </>
        )}
      </div>

      {/* TWO COLUMN CONTENT: Recent Orders + Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 dash-section">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 admin-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Recent Orders</h3>
              <p className="text-xs text-slate-400">Latest transactions from customer boutiques & artisans</p>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              View All Orders <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="table-th">Order ID</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Items Preview</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isPageLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/40">
                      <td className="table-td"><Skeleton className="h-3.5 w-20" /></td>
                      <td className="table-td"><Skeleton className="h-3.5 w-24 mb-1" /><Skeleton className="h-2.5 w-16 opacity-60" /></td>
                      <td className="table-td"><div className="flex items-center gap-2"><Skeleton className="w-7 h-7 rounded-lg shrink-0" /><Skeleton className="h-3.5 w-28" /></div></td>
                      <td className="table-td"><Skeleton className="h-3.5 w-14" /></td>
                      <td className="table-td"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="table-td text-right"><div className="flex justify-end gap-1"><SkeletonCircle size="w-7 h-7" /><SkeletonCircle size="w-7 h-7" /></div></td>
                    </tr>
                  ))
                ) : (
                  orders.slice(0, 6).map((order) => {
                  const { total } = calculateOrderTotal(order);
                  return (
                    <tr key={order.id} className="table-tr">
                      <td className="table-td font-mono font-bold text-indigo-400">
                        {order.id}
                      </td>
                      <td className="table-td">
                        <div className="font-medium text-slate-100">{order.customer.name}</div>
                        <div className="text-[11px] text-slate-500">{order.customer.city}</div>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-1.5">
                          <ProductImage
                            src={order.items[0]?.image}
                            category={order.items[0]?.category}
                            alt={order.items[0]?.name}
                            className="w-7 h-7 rounded-lg"
                          />
                          <span className="text-xs text-slate-300 truncate max-w-[140px]">
                            {order.items[0]?.name}
                          </span>
                          {order.items.length > 1 && (
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold">
                              +{order.items.length - 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="table-td font-semibold text-slate-100">
                        ₹{total}
                      </td>
                      <td className="table-td">
                        <span className={`
                          badge
                          ${order.status === 'New' ? 'badge-indigo' : ''}
                          ${order.status === 'Confirmed' ? 'badge-cyan' : ''}
                          ${order.status === 'Processing' ? 'badge-amber' : ''}
                          ${order.status === 'Packed' ? 'badge-amber' : ''}
                          ${order.status === 'Shipped' ? 'badge-purple' : ''}
                          ${order.status === 'Delivered' ? 'badge-emerald' : ''}
                          ${order.status === 'Cancelled' ? 'badge-rose' : ''}
                          ${order.status === 'Return Requested' ? 'badge-purple' : ''}
                          ${order.status === 'Returned' ? 'badge-slate' : ''}
                          ${order.status === 'Refunded' ? 'badge-rose' : ''}
                        `}>
                          {order.status}
                        </span>
                      </td>
                      <td className="table-td text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPrintDocument({ type: 'invoice', data: order })}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Print Invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate('/orders')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="View Order"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products List */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Top Selling Products</h3>
              <p className="text-xs text-slate-400">Highest grossing catalog items</p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              All Products
            </button>
          </div>

          <div className="space-y-3.5">
            {isPageLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/40 border border-slate-800/40">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-2.5 w-20 opacity-60" />
                  </div>
                  <div className="text-right space-y-1 shrink-0">
                    <Skeleton className="h-3.5 w-14 ml-auto" />
                    <Skeleton className="h-3 w-10 ml-auto rounded" />
                  </div>
                </div>
              ))
            ) : (
              topProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors">
                  <ProductImage
                    src={p.images?.[0]}
                    category={p.category}
                    alt={p.name}
                    className="w-10 h-10 rounded-xl"
                  />
                  <div className="flex-1 truncate">
                    <p className="text-xs font-semibold text-slate-100 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-400">
                      ₹{p.price} • <span className="text-emerald-400 font-medium">{p.unitsSold} sold</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-200 block">₹{p.totalSales.toLocaleString()}</span>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-semibold">
                      {p.badge || 'Popular'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Low Stock Products + Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 dash-section">
        {/* Low Stock Alerts */}
        <div className="admin-card p-5 border-rose-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Low Stock Warnings</h3>
                <p className="text-xs text-slate-400">Urgent restocking required for festival surge</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/inventory')}
              className="btn-secondary py-1 px-3 text-xs"
            >
              Manage Inventory
            </button>
          </div>

          <div className="space-y-3">
            {isPageLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-36" />
                      <Skeleton className="h-2.5 w-20 opacity-60" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))
            ) : (
              products.slice(28, 32).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <ProductImage src={p.images?.[0]} category={p.category} alt={p.name} className="w-9 h-9 rounded-lg" />
                    <div>
                      <p className="text-xs font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-xs">{p.name}</p>
                      <p className="text-[11px] text-slate-500">{p.category} • ₹{p.price}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="badge-rose text-xs font-bold px-2 py-0.5 rounded-full">
                      {p.stock || 8} units left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Customers */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Recent Customers</h3>
              <p className="text-xs text-slate-400">Latest active buyers across India</p>
            </div>
            <button
              onClick={() => navigate('/customers')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              View All ({customers.length})
            </button>
          </div>

          <div className="space-y-3">
            {isPageLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/40">
                  <div className="flex items-center gap-3">
                    <SkeletonCircle size="w-9 h-9" />
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-2.5 w-20 opacity-60" />
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-3.5 w-14 ml-auto" />
                    <Skeleton className="h-2.5 w-12 ml-auto opacity-60" />
                  </div>
                </div>
              ))
            ) : (
              customers.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {c.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-100">{c.name}</p>
                      <p className="text-[11px] text-slate-400">{c.city}, {c.state}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-200">₹{c.totalSpent.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500">{c.totalOrders} Orders</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* RECENT CUSTOMER INQUIRIES & CONTACT DESK */}
      <div className="admin-card p-5 dash-section space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Recent Customer Inquiries
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {recentInquiries.length} New
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Inquiries and custom bridal patch requests submitted from the storefront
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/inquiries')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Manage All Inquiries</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {inquiriesLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))
          ) : recentInquiries.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-500 text-xs">
              No recent customer inquiries logged yet.
            </div>
          ) : (
            recentInquiries.map((inq) => (
              <div
                key={inq.id}
                onClick={() => navigate('/inquiries')}
                className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/30 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(inq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        inq.status === 'unread'
                          ? 'bg-amber-500/20 text-amber-300'
                          : inq.status === 'replied'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {inq.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors truncate">
                    {inq.name}
                  </h4>
                  <p className="text-[11px] text-indigo-400/90 font-medium truncate">
                    {inq.subject || 'General Inquiry'}
                  </p>
                  <p className="text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                    {inq.message}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[120px]">{inq.email}</span>
                  <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
