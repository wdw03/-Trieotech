'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Breadcrumb from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { createClient } from '../../lib/supabase/client';
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
  Loader2,
  ExternalLink,
  Download,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Activity,
  Navigation
} from 'lucide-react';

// Status badge color map
const STATUS_BADGE_CLASS = {
  delivered: 'bg-emerald-700 text-white',
  shipped: 'bg-sky-700 text-white',
  in_transit: 'bg-sky-700 text-white',
  out_for_delivery: 'bg-orange-600 text-white',
  picked_up: 'bg-teal-700 text-white',
  pickup_scheduled: 'bg-teal-600 text-white',
  packed: 'bg-teal-600 text-white',
  confirmed: 'bg-amber-600 text-white',
  processing: 'bg-amber-600 text-white',
  pending: 'bg-stone-500 text-white',
  pending_payment: 'bg-stone-500 text-white',
  ndr: 'bg-amber-700 text-white',
  failed_delivery: 'bg-amber-700 text-white',
  reattempt_scheduled: 'bg-amber-600 text-white',
  rto_initiated: 'bg-rose-700 text-white',
  rto_delivered: 'bg-rose-800 text-white',
  cancelled: 'bg-rose-700 text-white',
  refunded: 'bg-blue-700 text-white',
};

const STATUS_DISPLAY = {
  pending: 'Order Placed',
  pending_payment: 'Pending Payment',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed & Ready',
  pickup_scheduled: 'Pickup Scheduled',
  picked_up: 'Picked Up by Courier',
  shipped: 'Shipped & In Transit',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery Today',
  delivered: 'Delivered Successfully',
  ndr: 'Delivery Reattempt Required',
  failed_delivery: 'Delivery Attempt Failed',
  reattempt_scheduled: 'Reattempt Scheduled',
  rto_initiated: 'Returning to Workshop (RTO)',
  rto_delivered: 'Returned to Workshop',
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
  const [showAllScans, setShowAllScans] = useState(false);

  const fmtDate = (d) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (_) {
      return String(d);
    }
  };

  const buildMilestones = (rawStatus, orderDate, updatedAt, shipment = {}, liveTracking = {}) => {
    const s = (rawStatus || '').toLowerCase();
    const isCancelled = s === 'cancelled';
    const isPacked = ['packed', 'pickup_scheduled', 'picked_up', 'in_transit', 'shipped', 'out_for_delivery', 'delivered'].includes(s);
    const isShipped = ['picked_up', 'in_transit', 'shipped', 'out_for_delivery', 'delivered'].includes(s);
    const isOutForDelivery = ['out_for_delivery', 'delivered'].includes(s);
    const isDelivered = s === 'delivered';

    const courier = shipment.courier_name || liveTracking.carrier || 'Express Courier';
    const awb = shipment.awb_number || liveTracking.awb || '';
    const loc = liveTracking.currentLocation || shipment.routing_code || 'Faridabad Hub';

    const milestones = [
      {
        title: 'Order Confirmed',
        desc: 'Order received and verified at workshop',
        time: fmtDate(orderDate),
        location: 'Trio Workshop, Faridabad / Jaipur',
        completed: true,
      },
      {
        title: 'Packed & Quality Inspected',
        desc: 'Inspected for craftsmanship and packed securely with protective seal',
        time: isPacked ? fmtDate(updatedAt) : '',
        location: 'Faridabad Hub',
        completed: isPacked,
      },
      {
        title: 'Dispatched via Courier',
        desc: awb
          ? `Handed over to ${courier} (AWB: ${awb})`
          : `Assigned to ${courier}`,
        time: isShipped ? fmtDate(shipment.created_at || updatedAt) : '',
        location: 'Faridabad Logistics Center',
        completed: isShipped,
      },
      {
        title: 'In Transit / Hub Movement',
        desc: isShipped
          ? (liveTracking.currentActivity || `Package moving through ${loc}`)
          : 'Package will move to nearest sorting facility',
        time: isShipped ? (liveTracking.liveScans?.[0]?.date || fmtDate(updatedAt)) : '',
        location: loc,
        completed: isShipped,
      },
      {
        title: 'Out for Delivery',
        desc: isOutForDelivery
          ? 'Package is with delivery executive for final doorstep handover'
          : 'Package will reach your delivery station soon',
        time: isOutForDelivery ? fmtDate(updatedAt) : '',
        location: 'Local Delivery Hub',
        completed: isOutForDelivery,
      },
      {
        title: 'Delivered',
        desc: isDelivered ? 'Handed over safely to patron' : 'Expected doorstep delivery',
        time: isDelivered ? fmtDate(shipment.delivered_at || updatedAt) : '',
        location: 'Patron Destination',
        completed: isDelivered,
      },
    ];

    if (isCancelled) {
      return [
        milestones[0],
        {
          title: 'Order Cancelled',
          desc: 'This order was cancelled by request.',
          time: fmtDate(updatedAt),
          location: 'Customer Service Hub',
          completed: true,
          isCancelled: true,
        },
      ];
    }

    return milestones;
  };

  const performTracking = async (query) => {
    if (!query || !query.trim()) return;
    const clean = query.trim();
    setIsLoading(true);
    setHasSearched(true);
    setFoundOrder(null);

    try {
      // 1. First attempt /api/shipping/track (returns live Shiprocket scans + local audit events + items)
      const isAwb = /^[0-9]{8,18}$/i.test(clean);
      const trackParam = isAwb ? `awb=${encodeURIComponent(clean)}` : `orderNumber=${encodeURIComponent(clean)}`;
      const res = await fetch(`/api/shipping/track?${trackParam}`);

      if (res.ok) {
        const data = await res.json();
        if (data?.order || data?.tracking) {
          const ord = data.order || {};
          const trk = data.tracking || {};
          const ship = data.shipment || {};

          const rawStatus = (trk.status || ord.status || 'pending').toLowerCase();
          const displayStatus = STATUS_DISPLAY[rawStatus] || rawStatus.toUpperCase();

          const items = (ord.items || []).map((it) => ({
            id: it.id,
            productId: it.productId || it.product_id,
            name: it.name || 'Handcrafted Ethnic Item',
            slug: (it.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            quantity: it.quantity || 1,
            price: Number(it.price || 0),
            image: it.image || '/products/pearl-zardosi-patch-1.jpg',
            color: it.color,
            size: it.size,
          }));

          const milestones = buildMilestones(
            rawStatus,
            ord.createdAt || ord.created_at,
            ord.updated_at,
            ship,
            trk
          );

          setFoundOrder({
            id: ord.orderNumber || ord.id || clean,
            dbId: ord.id,
            orderNumber: ord.orderNumber || ord.id || clean,
            status: displayStatus,
            rawStatus,
            carrier: trk.carrier || ship.courier_name || 'Shiprocket Express',
            trackingNumber: trk.awb || ship.awb_number || clean,
            currentLocation: trk.currentLocation || 'Faridabad Central Hub',
            currentActivity: trk.currentActivity || 'Package processing in progress',
            estimatedDelivery: trk.etd
              ? new Date(trk.etd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : '3 - 5 Business Days',
            deliveredDate: rawStatus === 'delivered' ? fmtDate(ship.delivered_at || ord.updated_at) : null,
            items,
            shippingAddress: ord.shippingAddress || {},
            total: Number(ord.total || 0),
            paymentMethod: ord.paymentMethod || 'Online',
            liveScans: trk.liveScans || [],
            auditEvents: trk.auditEvents || [],
            milestones,
          });

          setIsLoading(false);
          return;
        }
      }

      // 2. Fallback: Query /api/orders/[id]
      const orderRes = await fetch(`/api/orders/${encodeURIComponent(clean)}`);
      if (orderRes.ok) {
        const data = await orderRes.json();
        if (data?.order) {
          const ord = data.order;
          const trk = data.tracking || {};
          const ship = ord.shipments?.[0] || {};
          const rawStatus = (trk.status || ord.status || 'pending').toLowerCase();
          const displayStatus = STATUS_DISPLAY[rawStatus] || rawStatus.toUpperCase();

          const items = (ord.order_items || []).map((it) => ({
            id: it.id,
            productId: it.product_id,
            name: it.name || it.product_name || 'Handcrafted Ethnic Item',
            slug: (it.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            quantity: it.quantity || 1,
            price: Number(it.price || 0),
            image: it.image || it.product_image || '/products/pearl-zardosi-patch-1.jpg',
            color: it.color,
            size: it.size,
          }));

          const milestones = buildMilestones(
            rawStatus,
            ord.created_at,
            ord.updated_at,
            ship,
            trk
          );

          setFoundOrder({
            id: ord.order_number || ord.id,
            dbId: ord.id,
            orderNumber: ord.order_number || ord.id,
            status: displayStatus,
            rawStatus,
            carrier: trk.carrier || ship.courier_name || 'Shiprocket Express',
            trackingNumber: trk.awb || ship.awb_number || ord.order_number || clean,
            currentLocation: trk.currentLocation || 'Faridabad Central Hub',
            currentActivity: trk.currentActivity || 'Package in transit',
            estimatedDelivery: ord.estimated_delivery
              ? new Date(ord.estimated_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : '3 - 5 Business Days',
            deliveredDate: rawStatus === 'delivered' ? fmtDate(ship.delivered_at || ord.updated_at) : null,
            items,
            shippingAddress: ord.shipping_address || {},
            total: Number(ord.total || 0),
            paymentMethod: ord.payment_method || 'Online',
            liveScans: trk.liveScans || [],
            auditEvents: trk.auditEvents || [],
            milestones,
          });

          setIsLoading(false);
          return;
        }
      }

      // 3. Fallback: Search in userOrders (AuthContext)
      const localMatch = (userOrders || []).find(
        (o) =>
          o.id?.toUpperCase() === clean.toUpperCase() ||
          o.order_number?.toUpperCase() === clean.toUpperCase() ||
          o.trackingNumber?.toUpperCase() === clean.toUpperCase()
      );

      if (localMatch) {
        const milestones = buildMilestones(
          localMatch.rawStatus,
          localMatch.created_at,
          localMatch.updated_at,
          localMatch.shipment || {},
          {}
        );

        setFoundOrder({
          id: localMatch.order_number || localMatch.id,
          dbId: localMatch.dbId,
          orderNumber: localMatch.order_number || localMatch.id,
          status: localMatch.status || 'Processing',
          rawStatus: localMatch.rawStatus || 'pending',
          carrier: localMatch.carrier || 'Shiprocket Express',
          trackingNumber: localMatch.trackingNumber || localMatch.id,
          currentLocation: 'Faridabad Workshop Hub',
          currentActivity: 'Order registered in logistics system',
          estimatedDelivery: '3 - 5 Business Days',
          deliveredDate: localMatch.rawStatus === 'delivered' ? fmtDate(localMatch.updated_at) : null,
          items: localMatch.items || [],
          shippingAddress: localMatch.shipping_address || {},
          total: localMatch.total || 0,
          paymentMethod: localMatch.payment_method || 'Online',
          liveScans: [],
          auditEvents: [],
          milestones,
        });

        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Tracking fetch error:', err);
    }

    setFoundOrder(null);
    setIsLoading(false);
  };

  useEffect(() => {
    const query = idFromUrl || searchInput;
    if (query && query.trim()) {
      performTracking(query);
    }
  }, [idFromUrl]);

  // ── Realtime live subscription for tracked parcel ──
  useEffect(() => {
    if (!foundOrder?.dbId) return;

    const supabase = createClient();
    const orderIdentifier = foundOrder.orderNumber || foundOrder.id;

    const channel = supabase
      .channel(`live-track-${foundOrder.dbId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${foundOrder.dbId}`,
        },
        () => {
          performTracking(orderIdentifier);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
          filter: `order_id=eq.${foundOrder.dbId}`,
        },
        () => {
          performTracking(orderIdentifier);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [foundOrder?.dbId]);

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
      addr.address_line || addr.address || addr.street,
      addr.city,
      addr.state,
      addr.pincode || addr.zip,
      addr.phone ? `Phone: ${addr.phone}` : null,
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
            <Sparkles className="w-3.5 h-3.5 text-gold-600" /> Live Shiprocket Logistics Journey
          </span>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100">
            Track Your Handcrafted Consignment
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Enter your Order ID (e.g. <strong>TRIO-12345</strong>) or AWB Tracking Number to check live courier location &amp; scans.
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
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Tracking...</>
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
          <p className="text-xs text-stone-500 font-medium">Fetching real-time scans from courier network...</p>
        </div>
      )}

      {/* Tracking Results */}
      {!isLoading && foundOrder ? (
        <div className="space-y-6 animate-fade-in">
          
          {/* Status Header */}
          <div className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-5 border border-gold-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gold-500/20">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-serif font-black text-xl sm:text-2xl text-stone-900 dark:text-ivory-100">
                    Order {foundOrder.orderNumber}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      STATUS_BADGE_CLASS[foundOrder.rawStatus] || 'bg-amber-600 text-white'
                    }`}
                  >
                    {foundOrder.status}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Carrier Partner: <strong className="text-stone-800 dark:text-stone-200">{foundOrder.carrier}</strong> • AWB Number:{' '}
                  <strong className="font-mono text-maroon-800 dark:text-gold-400 font-bold">{foundOrder.trackingNumber || 'Pending Assignment'}</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/20 text-left sm:text-right">
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

            {/* Live Location Alert Badge */}
            {foundOrder.rawStatus !== 'cancelled' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-gold-400 flex items-center justify-center shrink-0">
                    <Navigation className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Current Package Location</div>
                    <div className="font-serif font-bold text-sm text-stone-900 dark:text-ivory-100">
                      📍 {foundOrder.currentLocation}
                    </div>
                    <div className="text-xs text-amber-800 dark:text-amber-300 font-medium mt-0.5">
                      {foundOrder.currentActivity}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-700 text-white shadow-sm">
                    <Activity className="w-3 h-3 animate-spin" /> Live Synchronized
                  </span>
                </div>
              </div>
            )}

            {/* Cancelled Banner */}
            {foundOrder.rawStatus === 'cancelled' && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 flex items-center gap-3 text-xs">
                <Ban className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="text-rose-800 dark:text-rose-300 font-medium">
                  This order has been cancelled. Any payments made online will be refunded within 5-7 business days.
                </span>
              </div>
            )}

            {/* Visual Milestones Stepper */}
            <div className="pt-4 space-y-6">
              <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-ivory-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-gold-600" /> Package Journey Milestones
              </h3>

              <div className="relative pl-6 sm:pl-8 space-y-7 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gold-500/30">
                {foundOrder.milestones?.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
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
                          {step.title}
                        </h4>
                        {step.time && (
                          <span className="text-[11px] font-mono text-stone-400">
                            {step.time}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {step.desc}
                      </p>
                      {step.location && (
                        <span className="text-[10px] font-bold text-gold-700 dark:text-gold-400 inline-flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {step.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Carrier Scans / Hub Checkpoints History */}
            {foundOrder.liveScans?.length > 0 && (
              <div className="pt-4 border-t border-gold-500/20 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowAllScans(!showAllScans)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 text-xs font-bold transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Live Carrier Scan History ({foundOrder.liveScans.length} Checkpoints)</span>
                  </span>
                  {showAllScans ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAllScans && (
                  <div className="space-y-2 p-3 bg-white dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs animate-fade-in max-h-72 overflow-y-auto">
                    {foundOrder.liveScans.map((scan, sIdx) => (
                      <div key={sIdx} className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 flex justify-between items-start gap-3">
                        <div className="space-y-0.5">
                          <div className="font-bold text-stone-900 dark:text-ivory-100">
                            {scan.activity || scan['sr-status-label'] || 'Scan recorded'}
                          </div>
                          <div className="text-[11px] text-stone-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {scan.location || scan.city || 'Courier Hub'}
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-stone-400 shrink-0">
                          {scan.date || scan.time || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Package Items & Address Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Items in Consignment with Clickable Product Links */}
            {foundOrder.items?.length > 0 && (
              <div className="ethnic-card p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gold-500/20">
                  <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-ivory-100 flex items-center gap-2">
                    <Package className="w-4 h-4 text-gold-600" /> Items in this Consignment ({foundOrder.items.length})
                  </h4>
                  <span className="text-[10px] font-bold uppercase text-stone-400">Click to view item</span>
                </div>

                <div className="divide-y divide-gold-500/10 max-h-80 overflow-y-auto space-y-1">
                  {foundOrder.items.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover border border-gold-500/20 shrink-0 group-hover:scale-105 transition-transform"
                          />
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/product/${item.slug || item.productId}`}
                            className="text-xs font-bold text-stone-900 dark:text-ivory-100 hover:text-maroon-800 dark:hover:text-gold-400 transition-colors line-clamp-2 block leading-snug"
                          >
                            {item.name}
                          </Link>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            Qty: <strong className="text-stone-800 dark:text-stone-200">{item.quantity}</strong>
                            {item.color ? ` • Shade: ${item.color}` : ''}
                            {item.size ? ` • Size: ${item.size}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold font-mono text-maroon-800 dark:text-gold-400 block">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                        <Link
                          href={`/product/${item.slug || item.productId}`}
                          className="text-[10px] text-gold-700 dark:text-gold-400 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                        >
                          <span>View Product</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Destination & Invoice */}
            <div className="ethnic-card p-6 rounded-3xl space-y-4">
              <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-ivory-100 flex items-center gap-2 pb-2 border-b border-gold-500/20">
                <MapPin className="w-4 h-4 text-gold-600" /> Delivery &amp; Invoice Summary
              </h4>

              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Ship To:</span>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                  {renderAddress(foundOrder.shippingAddress)}
                </p>
              </div>

              <div className="pt-3 border-t border-gold-500/10 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Payment Mode:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200 uppercase">
                    {foundOrder.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Prepaid Online'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Total Order Amount:</span>
                  <span className={`font-serif font-black text-base ${
                    foundOrder.rawStatus === 'cancelled' ? 'text-rose-700 line-through' : 'text-maroon-800 dark:text-gold-400'
                  }`}>
                    ₹{Number(foundOrder.total || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Download Invoice Button */}
              {foundOrder.dbId && foundOrder.rawStatus !== 'cancelled' && (
                <div className="pt-3 border-t border-gold-500/10">
                  <a
                    href={`/api/orders/${foundOrder.dbId}/invoice?download=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/40 text-maroon-900 dark:text-gold-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-gold-600" />
                    <span>Download Official Tax Invoice</span>
                  </a>
                </div>
              )}
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
            We could not find a consignment matching "<strong>{searchInput}</strong>". Please verify your Order ID or AWB Tracking Number.
          </p>
          <div className="pt-2">
            <Link href="/profile/orders" className="btn-secondary py-2 px-5 text-xs inline-flex items-center gap-1.5">
              <span>View Your Past Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : null}

    </div>
  );
}
