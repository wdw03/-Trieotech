'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Breadcrumb from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Calendar,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Ban,
  Loader2
} from 'lucide-react';

// Status badge color map
const STATUS_BADGE_CLASS = {
  delivered: 'bg-emerald-700 text-white',
  shipped: 'bg-sky-700 text-white',
  out_for_delivery: 'bg-orange-600 text-white',
  packed: 'bg-teal-600 text-white',
  confirmed: 'bg-amber-600 text-white',
  processing: 'bg-amber-600 text-white',
  pending: 'bg-stone-500 text-white',
  pending_payment: 'bg-stone-500 text-white',
  cancelled: 'bg-rose-700 text-white',
  refunded: 'bg-blue-700 text-white',
};

const STATUS_DISPLAY = {
  pending: 'Pending',
  pending_payment: 'Pending Payment',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export default function OrderTrackingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get('id') || searchParams.get('tracking') || '';

  const { userOrders } = useAuth();
  const [searchInput, setSearchInput] = useState(idFromUrl || '');
  const [foundOrder, setFoundOrder] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const buildTimeline = (order) => {
    const rawStatus = (order.status || 'pending').toLowerCase();
    const createdAt = order.created_at;
    const updatedAt = order.updated_at;
    const shipment = order.shipments?.[0] || {};

    const isCancelled = rawStatus === 'cancelled';
    const isConfirmed = ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(rawStatus);
    const isPacked = ['packed', 'shipped', 'out_for_delivery', 'delivered'].includes(rawStatus);
    const isShipped = ['shipped', 'out_for_delivery', 'delivered'].includes(rawStatus);
    const isOutForDelivery = ['out_for_delivery', 'delivered'].includes(rawStatus);
    const isDelivered = rawStatus === 'delivered';

    const fmtDate = (d) => {
      if (!d) return '';
      return new Date(d).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      });
    };

    const timeline = [
      {
        status: 'Order Placed & Confirmed',
        description: 'Order received and verified by artisan workshop',
        time: fmtDate(createdAt),
        location: 'Trio Workshop, Jaipur',
        completed: true,
      },
      {
        status: 'Quality Checked & Packed',
        description: 'Inspected for embroidery quality and packed securely',
        time: isPacked ? fmtDate(updatedAt) : '',
        location: 'Artisan Hub, Jaipur',
        completed: isPacked,
      },
      {
        status: 'Handed to Courier',
        description: shipment.awb_number
          ? `Dispatched via ${shipment.courier_name || 'Express Courier'} — AWB: ${shipment.awb_number}`
          : `Dispatched via ${shipment.courier_name || 'Express Courier'}`,
        time: isShipped ? fmtDate(shipment.created_at || updatedAt) : '',
        location: 'Sorting Facility',
        completed: isShipped,
      },
      {
        status: 'Out for Delivery',
        description: 'Package is with the delivery executive in your area',
        time: isOutForDelivery ? fmtDate(updatedAt) : '',
        location: order.shipping_address?.city || 'Your City',
        completed: isOutForDelivery,
      },
      {
        status: 'Delivered to Patron',
        description: 'Safely delivered to shipping address',
        time: isDelivered ? fmtDate(updatedAt) : '',
        location: order.shipping_address?.city || 'Destination',
        completed: isDelivered,
      },
    ];

    // If cancelled, replace remaining steps with cancellation step
    if (isCancelled) {
      return [
        timeline[0], // Order placed — always completed
        {
          status: '❌ Order Cancelled',
          description: order.cancellation_reason || 'This order was cancelled.',
          time: fmtDate(order.cancelled_at || updatedAt),
          location: '',
          completed: true,
          isCancelled: true,
        },
      ];
    }

    return timeline;
  };

  const performTracking = async (query) => {
    if (!query || !query.trim()) return;
    const clean = query.trim();
    setIsLoading(true);
    setHasSearched(true);
    setFoundOrder(null);

    // 1. Check in-memory userOrders from AuthContext
    const localMatch = (userOrders || []).find(
      (o) =>
        o.id?.toUpperCase() === clean.toUpperCase() ||
        o.order_number?.toUpperCase() === clean.toUpperCase() ||
        o.trackingNumber?.toUpperCase() === clean.toUpperCase()
    );

    if (localMatch && localMatch.dbId) {
      // Fetch full details from API for this order
      try {
        const res = await fetch(`/api/orders/${localMatch.dbId}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.order) {
            const ord = data.order;
            setFoundOrder(formatOrderForDisplay(ord, clean));
            setIsLoading(false);
            return;
          }
        }
      } catch (_) {}

      // If API fails, use local data
      setFoundOrder({
        ...localMatch,
        timeline: buildTimeline(localMatch),
      });
      setIsLoading(false);
      return;
    }

    // 2. Query backend API directly (same-origin)
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.order) {
          setFoundOrder(formatOrderForDisplay(data.order, clean));
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Order tracking API error:', err);
    }

    // 3. Try tracking by AWB via shipping API
    try {
      const res = await fetch(`/api/shipping/track?awb=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.tracking) {
          setFoundOrder({
            id: clean,
            orderNumber: clean,
            status: data.tracking?.current_status || 'In Transit',
            carrier: data.tracking?.courier_name || 'Shiprocket',
            trackingNumber: clean,
            estimatedDelivery: data.tracking?.etd || '3 - 5 Business Days',
            items: [],
            shippingAddress: 'Check email for address details',
            total: 0,
            timeline: [
              {
                status: 'Shipment Tracked via AWB',
                description: data.tracking?.current_status || 'Package is in transit',
                time: new Date().toLocaleString('en-IN'),
                location: data.tracking?.current_city || '',
                completed: true,
              },
            ],
          });
          setIsLoading(false);
          return;
        }
      }
    } catch (_) {}

    // Not found
    setFoundOrder(null);
    setIsLoading(false);
  };

  const formatOrderForDisplay = (ord, searchQuery) => {
    const rawStatus = (ord.status || 'pending').toLowerCase();
    const shipment = ord.shipments?.[0] || {};
    const displayStatus = STATUS_DISPLAY[rawStatus] || ord.status || 'Processing';

    return {
      id: ord.order_number || ord.id,
      orderNumber: ord.order_number || ord.id,
      status: displayStatus,
      rawStatus,
      carrier: shipment.courier_name || 'Shiprocket / BlueDart',
      trackingNumber: shipment.awb_number || ord.order_number || searchQuery,
      estimatedDelivery: ord.estimated_delivery
        ? new Date(ord.estimated_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '3 - 5 Business Days',
      deliveredDate: rawStatus === 'delivered'
        ? new Date(ord.updated_at || ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : null,
      items: (ord.order_items || []).map((it) => ({
        id: it.id,
        name: it.product_name || it.name || 'Handcrafted Ethnic Item',
        quantity: it.quantity || 1,
        price: it.price || 0,
        image: it.product_image || it.image || '/products/pearl-zardosi-patch-1.jpg',
      })),
      shippingAddress: ord.shipping_address || {},
      total: Number(ord.total || ord.total_amount || 0),
      paymentMethod: ord.payment_method,
      timeline: buildTimeline(ord),
    };
  };

  useEffect(() => {
    const query = idFromUrl || searchInput;
    if (query && query.trim()) {
      performTracking(query);
    }
  }, [idFromUrl]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/track-order?id=${encodeURIComponent(searchInput.trim())}`);
      performTracking(searchInput.trim());
    }
  };

  const renderAddress = (addr) => {
    if (!addr) return 'Delivery address on file';
    if (typeof addr === 'string') return addr;
    const parts = [
      addr.name,
      addr.address || addr.address_line1,
      addr.city,
      addr.state,
      addr.zip || addr.pincode || addr.pinCode,
    ].filter(Boolean);
    return parts.join(', ') || 'Delivery address on file';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      
      <Breadcrumb items={[{ name: 'Track Order', url: '/track-order' }]} />

      {/* Header & Search Bar */}
      <div className="ethnic-card p-6 sm:p-10 rounded-3xl text-center space-y-6">
        <div className="space-y-2 max-w-lg mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" /> Real-Time Courier Journey
          </span>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100">
            Track Your Handcrafted Order
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Enter your Order ID (e.g. <strong>TRIO-12345</strong>) or AWB Tracking Number to check live courier milestones.
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Enter Order ID or AWB Tracking No..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-white dark:bg-stone-900 text-stone-900 dark:text-ivory-100 text-xs sm:text-sm rounded-2xl border border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all uppercase placeholder:normal-case font-mono"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary py-3 px-6 text-xs uppercase tracking-wider font-bold shrink-0 disabled:opacity-60 flex items-center gap-1.5"
          >
            {isLoading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching...</>
            ) : (
              'Track'
            )}
          </button>
        </form>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="ethnic-card p-12 rounded-3xl text-center space-y-3 animate-pulse">
          <Loader2 className="w-8 h-8 text-gold-600 animate-spin mx-auto" />
          <p className="text-xs text-stone-500 font-medium">Fetching tracking details from our systems...</p>
        </div>
      )}

      {/* Tracking Results */}
      {!isLoading && foundOrder ? (
        <div className="space-y-6 animate-fade-in">
          
          {/* Status Header */}
          <div className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gold-500/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-serif font-black text-xl text-stone-900 dark:text-ivory-100">
                    Order {foundOrder.id || foundOrder.orderNumber}
                  </span>
                  <span
                    className={`badge-ribbon ${
                      STATUS_BADGE_CLASS[foundOrder.rawStatus] || 'bg-amber-600 text-white'
                    }`}
                  >
                    {foundOrder.status}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Carrier: <strong>{foundOrder.carrier}</strong> • Tracking ID: <strong className="font-mono text-maroon-800 dark:text-gold-400">{foundOrder.trackingNumber}</strong>
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/20 text-right">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  {foundOrder.rawStatus === 'delivered' ? 'Delivered On' : foundOrder.rawStatus === 'cancelled' ? 'Status' : 'Estimated Delivery'}
                </span>
                <span className={`font-serif font-bold text-sm ${
                  foundOrder.rawStatus === 'cancelled' ? 'text-rose-700' : 'text-maroon-800 dark:text-gold-400'
                }`}>
                  {foundOrder.rawStatus === 'cancelled' ? 'Cancelled' : (foundOrder.deliveredDate || foundOrder.estimatedDelivery || '3 - 5 Days')}
                </span>
              </div>
            </div>

            {/* Cancelled Banner */}
            {foundOrder.rawStatus === 'cancelled' && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 flex items-center gap-2.5 text-xs">
                <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-rose-800 dark:text-rose-300 font-medium">
                  This order has been cancelled. Any applicable refund will be processed within 5-7 business days.
                </span>
              </div>
            )}

            {/* Visual Timeline Stepper */}
            <div className="pt-4 space-y-8">
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gold-500/30">
                {foundOrder.timeline?.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    {/* Step Circle */}
                    <div
                      className={`absolute -left-6 sm:-left-8 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                        step.isCancelled
                          ? 'bg-rose-600 border-rose-400 text-white shadow-md'
                          : step.completed
                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                          : 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-400'
                      }`}
                    >
                      {step.isCancelled ? (
                        <Ban className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      ) : step.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      ) : (
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      )}
                    </div>

                    {/* Step Details */}
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4
                          className={`font-serif font-bold text-sm ${
                            step.isCancelled
                              ? 'text-rose-700 dark:text-rose-400'
                              : step.completed
                              ? 'text-stone-900 dark:text-ivory-100'
                              : 'text-stone-400 dark:text-stone-600'
                          }`}
                        >
                          {step.status}
                        </h4>
                        {step.time && (
                          <span className="text-[11px] font-mono text-stone-400">
                            {step.time}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {step.description}
                      </p>
                      {step.location && (
                        <span className="text-[10px] font-bold text-gold-700 dark:text-gold-400 inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {step.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Package Items & Address Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Items in Consignment */}
            {foundOrder.items?.length > 0 && (
              <div className="ethnic-card p-6 rounded-3xl space-y-4">
                <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-ivory-100 flex items-center gap-2">
                  <Package className="w-4 h-4 text-gold-600" /> Items in this Consignment
                </h4>
                <div className="divide-y divide-gold-500/10 max-h-60 overflow-y-auto">
                  {foundOrder.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover border border-gold-500/20" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-stone-900 dark:text-ivory-100 truncate">{item.name}</p>
                        <p className="text-[11px] text-stone-400">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-xs font-bold font-mono text-maroon-800 dark:text-gold-400">
                        ₹{Number(item.price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Destination */}
            <div className="ethnic-card p-6 rounded-3xl space-y-4">
              <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-ivory-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold-600" /> Delivery Address
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {renderAddress(foundOrder.shippingAddress)}
              </p>
              <div className="pt-3 border-t border-gold-500/10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">Payment:</span>
                  <span className="font-bold text-stone-700 dark:text-stone-200 uppercase">
                    {foundOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : foundOrder.paymentMethod === 'razorpay' ? 'Razorpay Online' : (foundOrder.paymentMethod || 'Prepaid')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">Total Order Value:</span>
                  <span className={`font-serif font-bold text-base ${
                    foundOrder.rawStatus === 'cancelled' ? 'text-rose-700 line-through' : 'text-maroon-800 dark:text-gold-400'
                  }`}>
                    ₹{Number(foundOrder.total || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : hasSearched && !isLoading ? (
        <div className="ethnic-card p-12 rounded-3xl text-center space-y-4 max-w-lg mx-auto animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-ivory-100">
            No Tracking Record Found
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            We could not find an order matching "<strong>{searchInput}</strong>". Please double check your order number or tracking code received in your confirmation SMS/Email.
          </p>
          <div className="pt-2">
            <Link href="/profile/orders" className="btn-secondary py-2 px-5 text-xs inline-flex items-center gap-1.5">
              <span>View Your Order History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : null}

    </div>
  );
}
