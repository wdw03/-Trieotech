import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { mockOrders, getOrderByTrackingOrId } from '../../data/orders';
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
  ArrowRight
} from 'lucide-react';

export const OrderTrackingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const idFromUrl = searchParams.get('id') || searchParams.get('tracking') || '';

  const { userOrders } = useAuth();
  const [searchInput, setSearchInput] = useState(idFromUrl || 'TRIO-98421');
  const [foundOrder, setFoundOrder] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const query = idFromUrl || searchInput;
    if (query) {
      // Check user orders first, then fallback to mock data
      const order = userOrders.find(
        o => o.id?.toUpperCase() === query.toUpperCase() || o.trackingNumber?.toUpperCase() === query.toUpperCase()
      ) || getOrderByTrackingOrId(query);

      setFoundOrder(order || null);
      setHasSearched(true);
    }
  }, [idFromUrl, userOrders]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ id: searchInput.trim() });
      const order = userOrders.find(
        o => o.id?.toUpperCase() === searchInput.trim().toUpperCase() ||
             o.trackingNumber?.toUpperCase() === searchInput.trim().toUpperCase()
      ) || getOrderByTrackingOrId(searchInput.trim());

      setFoundOrder(order || null);
      setHasSearched(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <SEO
        title="Track Your Artisan Handcraft Order"
        description="Track live status and shipment updates of your Trio Ecart handicraft parcel with real-time courier checkpoints."
      />

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
            Enter your Order ID (e.g. <strong>TRIO-98421</strong>) or BlueDart / Delhivery Tracking Number.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              required
              placeholder="e.g. TRIO-98421 or ECOM-IND-78492019"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-ivory-100 dark:bg-stone-900 border-2 border-gold-500/40 text-xs sm:text-sm text-stone-900 dark:text-ivory-100 uppercase font-mono outline-none focus:border-maroon-700"
            />
            <Search className="w-4 h-4 text-gold-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            className="btn-primary px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md"
          >
            Track
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center justify-center gap-2 text-xs flex-wrap text-stone-500">
          <span className="text-[11px]">Try sample:</span>
          <button
            type="button"
            onClick={() => {
              setSearchInput('TRIO-98421');
              setSearchParams({ id: 'TRIO-98421' });
            }}
            className="px-2.5 py-1 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-gold-800 dark:text-gold-300 font-mono font-bold text-[11px]"
          >
            TRIO-98421 (Delivered)
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchInput('TRIO-98542');
              setSearchParams({ id: 'TRIO-98542' });
            }}
            className="px-2.5 py-1 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-gold-800 dark:text-gold-300 font-mono font-bold text-[11px]"
          >
            TRIO-98542 (Shipped)
          </button>
        </div>
      </div>

      {/* Tracking Results */}
      {foundOrder ? (
        <div className="space-y-6 animate-fade-in">
          
          {/* Status Header Pill */}
          <div className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gold-500/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-serif font-black text-xl text-stone-900 dark:text-ivory-100">
                    Order {foundOrder.id}
                  </span>
                  <span
                    className={`badge-ribbon ${
                      foundOrder.status === 'Delivered'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {foundOrder.status}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Carrier: <strong>{foundOrder.carrier || 'BlueDart Express'}</strong> • Tracking ID: <strong className="font-mono text-maroon-800 dark:text-gold-400">{foundOrder.trackingNumber}</strong>
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/20 text-right">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  {foundOrder.status === 'Delivered' ? 'Delivered On' : 'Estimated Delivery'}
                </span>
                <span className="font-serif font-bold text-sm text-maroon-800 dark:text-gold-400">
                  {foundOrder.deliveredDate || foundOrder.estimatedDelivery}
                </span>
              </div>
            </div>

            {/* Visual Timeline Stepper */}
            <div className="pt-4 space-y-8">
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gold-500/30">
                {foundOrder.timeline?.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    {/* Step Circle Indicator */}
                    <div
                      className={`absolute -left-6 sm:-left-8 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                        step.completed
                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                          : 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-400'
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      ) : (
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      )}
                    </div>

                    {/* Step Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4
                          className={`font-serif font-bold text-xs sm:text-sm ${
                            step.completed
                              ? 'text-stone-900 dark:text-ivory-100'
                              : 'text-stone-400'
                          }`}
                        >
                          {step.status}
                        </h4>
                        <span className="text-[11px] text-stone-400 font-medium">
                          {step.date}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {step.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Shipment Items Breakdown */}
          <div className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-4">
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-ivory-100 pb-2 border-b border-gold-500/20">
              Parcel Contents ({foundOrder.items?.length})
            </h3>
            <div className="divide-y divide-gold-500/10">
              {foundOrder.items?.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-gold-500/20" />
                    <div>
                      <h4 className="font-serif font-bold text-stone-900 dark:text-ivory-100">{item.name}</h4>
                      <p className="text-[11px] text-stone-500">Qty: {item.quantity} {item.color ? `• Shade: ${item.color}` : ''}</p>
                    </div>
                  </div>
                  <span className="font-serif font-bold text-maroon-800 dark:text-gold-400">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : hasSearched ? (
        <div className="ethnic-card p-8 rounded-3xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-maroon-600 mx-auto" />
          <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-ivory-100">
            No Order Found for "{searchInput}"
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Please check your tracking number or contact our artisan support on WhatsApp: +91 98765 43210.
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default OrderTrackingPage;
