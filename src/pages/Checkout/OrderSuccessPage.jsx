import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import SEO from '../../components/common/SEO';
import { useAuth } from '../../context/AuthContext';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Sparkles,
  ArrowRight,
  Printer,
  ShoppingBag,
  Clock
} from 'lucide-react';

export const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const { userOrders } = useAuth();

  // Find order in userOrders
  const order = userOrders.find(o => o.id === orderId) || userOrders[0];

  useEffect(() => {
    // Trigger festive celebratory confetti
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#C5A028', '#8B1A1A', '#065F46', '#F59E0B']
      });
    } catch (e) {}
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-fade-in">
      <SEO title="Order Confirmed | Trio Ecart" />

      {/* Celebration Card */}
      <div className="ethnic-card p-8 sm:p-12 rounded-3xl text-center space-y-6 border-2 border-gold-500/40 shadow-2xl relative overflow-hidden bg-gradient-to-b from-ivory-100 via-white to-ivory-100 dark:from-[#1A110B] dark:via-[#140D08] dark:to-[#1A110B]">
        
        {/* Success Icon */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-xl animate-bounce">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-400 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" /> Auspicious Blessing Confirmed
          </span>
          <h1 className="font-serif font-black text-2xl sm:text-4xl text-stone-900 dark:text-ivory-100">
            Thank You! Your Order is Placed
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            Our master karigars in Jaipur are preparing your handcrafted parcel with sacred care and eco-friendly packaging.
          </p>
        </div>

        {/* Order ID & Tracking Code Pill */}
        <div className="p-4 rounded-2xl bg-ivory-200/80 dark:bg-stone-900/80 border border-gold-500/30 max-w-md mx-auto grid grid-cols-2 gap-4 text-left text-xs">
          <div>
            <span className="text-stone-500 block text-[10px] uppercase font-bold">Order Number</span>
            <strong className="font-mono text-sm text-maroon-800 dark:text-gold-400">{order?.id || orderId}</strong>
          </div>
          <div>
            <span className="text-stone-500 block text-[10px] uppercase font-bold">Courier Tracking ID</span>
            <strong className="font-mono text-xs text-stone-800 dark:text-stone-200">{order?.trackingNumber || 'BLUEDART-EXP-9082'}</strong>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to={`/track-order?id=${order?.id || orderId}`}
            className="w-full sm:w-auto btn-primary py-3.5 px-8 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-maroon-md"
          >
            <Package className="w-4 h-4" />
            <span>Track Order Timeline</span>
          </Link>
          <Link
            to="/shop"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl border-2 border-gold-500/40 text-stone-700 dark:text-gold-300 hover:bg-gold-500/10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>

      </div>

      {/* Order Details Breakdown Card */}
      {order && (
        <div className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-6">
          <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-ivory-100 pb-3 border-b border-gold-500/20">
            Order Receipt &amp; Shipment Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            {/* Delivery Address */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Shipping Address
              </span>
              <p className="font-bold text-stone-900 dark:text-ivory-100">{order.shippingAddress?.name}</p>
              <p className="text-stone-600 dark:text-stone-300">
                {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zip}
              </p>
              <p className="text-stone-500 font-medium">Phone: {order.shippingAddress?.phone}</p>
            </div>

            {/* Delivery Estimate */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Estimated Delivery
              </span>
              <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                {order.estimatedDelivery}
              </p>
              <p className="text-stone-500">Carrier: {order.carrier || 'BlueDart Air Express'}</p>
            </div>

            {/* Payment Info */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Payment Method
              </span>
              <p className="font-bold text-stone-900 dark:text-ivory-100">{order.paymentMethod}</p>
              <p className="font-serif font-black text-base text-maroon-800 dark:text-gold-400 pt-1">
                Total Paid: ₹{order.total?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Ordered Items List */}
          <div className="space-y-3 pt-4 border-t border-gold-500/20">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
              Items in this shipment ({order.items?.length}):
            </span>
            <div className="divide-y divide-gold-500/10">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gold-500/20" />
                    <div>
                      <h4 className="font-serif font-bold text-stone-900 dark:text-ivory-100">{item.name}</h4>
                      <p className="text-[11px] text-stone-500">Quantity: {item.quantity} {item.color ? `• Shade: ${item.color}` : ''}</p>
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
      )}
    </div>
  );
};

export default OrderSuccessPage;
