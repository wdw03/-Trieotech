'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Sparkles,
  ArrowRight,
  Printer,
  Download,
  ShoppingBag,
  Clock,
  Mail,
  FileText,
  Loader2,
  XCircle,
  AlertTriangle,
  Ban
} from 'lucide-react';

export default function OrderSuccessClient({ initialOrderId }) {
  const params = useParams();
  const orderId = initialOrderId || params?.orderId;
  const { userOrders, refreshOrders, cancelOrder } = useAuth();
  const { addToast } = useToast();

  const [dbOrder, setDbOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  // Fetch full order record from backend API
  useEffect(() => {
    let isMounted = true;

    async function fetchOrderDetails() {
      if (!orderId) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (isMounted && res.ok && data.order) {
          setDbOrder(data.order);
        }
      } catch (err) {
        console.warn('Failed to fetch direct order details:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchOrderDetails();
    if (refreshOrders) refreshOrders();

    // Trigger festive celebratory confetti
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#C5A028', '#8B1A1A', '#065F46', '#F59E0B'],
      });
    } catch (e) { }

    return () => {
      isMounted = false;
    };
  }, [orderId, refreshOrders]);

  // Fallback to order from auth context if direct fetch was unavailable
  const contextOrder = userOrders?.find((o) => o.id === orderId || o.dbId === orderId);

  const displayOrderNumber = dbOrder?.order_number || contextOrder?.id || orderId;
  const displayDbId = dbOrder?.id || contextOrder?.dbId || orderId;

  const rawDate = dbOrder?.created_at || contextOrder?.date;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    : 'Today';

  const formattedTime = rawDate
    ? new Date(rawDate).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    : '';

  const shippingAddr =
    dbOrder?.shipping_address ||
    contextOrder?.shippingAddress ||
    {};

  const items =
    dbOrder?.order_items ||
    contextOrder?.items ||
    [];

  const subtotal = dbOrder?.subtotal ?? contextOrder?.subtotal ?? 0;
  const discount = dbOrder?.discount ?? contextOrder?.discount ?? 0;
  const shippingCost = dbOrder?.shipping_cost ?? contextOrder?.shippingCost ?? 0;
  const total = dbOrder?.total ?? contextOrder?.total ?? 0;

  const paymentMethodLabel =
    dbOrder?.payment_method === 'razorpay' || contextOrder?.paymentMethod === 'razorpay'
      ? 'Online Payment (Razorpay / UPI)'
      : dbOrder?.payment_method === 'cod' || contextOrder?.paymentMethod === 'cod'
        ? 'Cash on Delivery (COD)'
        : (dbOrder?.payment_method || contextOrder?.paymentMethod || 'Prepaid');

  const invoiceDownloadUrl = `/api/orders/${displayDbId || displayOrderNumber}/invoice?download=true`;
  const invoiceViewUrl = `/api/orders/${displayDbId || displayOrderNumber}/invoice`;

  const shipment = dbOrder?.shipments?.[0];
  const awbNumber = shipment?.awb_number || dbOrder?.awb_number || contextOrder?.trackingNumber;
  const courierName = shipment?.courier_name || contextOrder?.carrier || 'Shiprocket Express';
  const trackingUrl = shipment?.tracking_url || (awbNumber ? `https://shiprocket.co/tracking/${awbNumber}` : null);

  // Check if order is cancellable
  const rawStatus = (dbOrder?.status || contextOrder?.rawStatus || 'confirmed').toLowerCase();
  const cancellable = !isCancelled && ['pending_payment', 'pending'].includes(rawStatus);

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    try {
      const result = await cancelOrder(displayDbId, cancelReason || 'Customer requested cancellation');
      if (result.success) {
        setIsCancelled(true);
        setShowCancelModal(false);
        addToast(
          result.refundInitiated
            ? `Order cancelled. Refund of ₹${Number(total)?.toLocaleString('en-IN')} initiated!`
            : 'Order cancelled successfully.',
          'success'
        );
      } else {
        addToast(result.error || 'Failed to cancel order', 'error');
      }
    } catch (err) {
      addToast('Something went wrong', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-fade-in">
      {/* Celebration Header Card */}
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

        {/* Order ID & Date Pill */}
        <div className="p-4 rounded-2xl bg-ivory-200/80 dark:bg-stone-900/80 border border-gold-500/30 max-w-lg mx-auto grid grid-cols-2 sm:grid-cols-3 gap-4 text-left text-xs">
          <div>
            <span className="text-stone-500 block text-[10px] uppercase font-bold">Order Number</span>
            <strong className="font-mono text-sm text-maroon-800 dark:text-gold-400">{displayOrderNumber}</strong>
          </div>
          <div>
            <span className="text-stone-500 block text-[10px] uppercase font-bold">Order Date &amp; Time</span>
            <strong className="text-xs text-stone-800 dark:text-stone-200 block truncate">
              {formattedDate} {formattedTime ? `• ${formattedTime}` : ''}
            </strong>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-stone-500 block text-[10px] uppercase font-bold">Courier Partner</span>
            <strong className="font-mono text-xs text-stone-800 dark:text-stone-200 block truncate">
              BlueDart Air Express
            </strong>
          </div>
        </div>

        {/* Email Notification Notice */}
        <div className="bg-gold-500/10 border border-gold-500/30 rounded-2xl p-3.5 max-w-lg mx-auto flex items-center gap-2.5 text-xs text-stone-700 dark:text-gold-200 text-left">
          <Mail className="w-4 h-4 text-gold-600 shrink-0" />
          <span>
            A confirmation receipt along with your complete official tax invoice has been dispatched to your email.
          </span>
        </div>

        {/* Primary Action Buttons: Invoice Download, View & Track */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href={invoiceDownloadUrl}
            className="btn-primary py-3 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-maroon-md"
            title="Download Tax Invoice as HTML file"
          >
            <Download className="w-4 h-4" />
            <span>Download Invoice</span>
          </a>

          <a
            href={invoiceViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-xl border-2 border-gold-500/50 text-stone-700 dark:text-gold-300 hover:bg-gold-500/10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            title="View invoice in browser with Print & PDF options"
          >
            <Printer className="w-4 h-4 text-gold-600" />
            <span>Print / Save PDF</span>
          </a>

          <Link
            href={`/track-order?id=${displayOrderNumber}`}
            className="px-5 py-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>Track Parcel</span>
          </Link>

          {/* Cancel Button — only for cancellable statuses */}
          {cancellable && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-5 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Shiprocket AWB Tracking Card */}
      {awbNumber && (
        <div className="ethnic-card p-5 sm:p-6 rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-50/70 via-ivory-100/50 to-emerald-50/70 dark:from-emerald-950/30 dark:via-stone-900/60 dark:to-emerald-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-emerald-950/10">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-ribbon bg-emerald-700 text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                <Truck className="w-3 h-3" /> Shiprocket Dispatched
              </span>
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Courier: <strong>{courierName}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-xs text-stone-500">AWB Tracking No:</span>
              <span className="font-mono font-black text-sm sm:text-base text-maroon-800 dark:text-gold-400 tracking-wider select-all">
                {awbNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              href={`/track-order?id=${displayOrderNumber}`}
              className="flex-1 sm:flex-initial btn-primary py-2.5 px-5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-maroon-sm"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Track Parcel</span>
            </Link>
            {trackingUrl && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-emerald-600/40 bg-white/60 dark:bg-stone-800/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/15 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Direct Shiprocket</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Order Details Breakdown Card */}
      <div className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-gold-500/20">
          <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-ivory-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold-600" />
            <span>Order Receipt &amp; Shipment Details</span>
          </h3>
          <span className="badge-ribbon bg-emerald-700 text-white font-bold text-[11px]">
            {dbOrder?.status === 'confirmed' ? 'Confirmed' : dbOrder?.status || 'Confirmed'}
          </span>
        </div>

        {/* 3-Column Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          {/* Delivery Address */}
          <div className="space-y-1 p-3.5 rounded-2xl bg-ivory-200/50 dark:bg-stone-900/50 border border-gold-500/20">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Shipping Address
            </span>
            <p className="font-bold text-stone-900 dark:text-ivory-100">{shippingAddr.name || 'Artisan Patron'}</p>
            <p className="text-stone-600 dark:text-stone-300">
              {shippingAddr.address_line || shippingAddr.address || ''}
              {shippingAddr.city ? `, ${shippingAddr.city}` : ''}
              {shippingAddr.state ? `, ${shippingAddr.state}` : ''}
              {shippingAddr.pincode || shippingAddr.zip ? ` - ${shippingAddr.pincode || shippingAddr.zip}` : ''}
            </p>
            <p className="text-stone-500 font-medium">📞 Phone: {shippingAddr.phone || 'N/A'}</p>
          </div>

          {/* Delivery Estimate */}
          <div className="space-y-1 p-3.5 rounded-2xl bg-ivory-200/50 dark:bg-stone-900/50 border border-gold-500/20">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Estimated Delivery
            </span>
            <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
              {dbOrder?.estimated_delivery
                ? new Date(dbOrder.estimated_delivery).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
                : '3 - 5 Business Days'}
            </p>
            <p className="text-stone-500">Carrier: BlueDart Air Express</p>
            <p className="text-[11px] text-stone-400">Packaging: Eco-friendly tamper-proof bag</p>
          </div>

          {/* Payment Info */}
          <div className="space-y-1 p-3.5 rounded-2xl bg-ivory-200/50 dark:bg-stone-900/50 border border-gold-500/20">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Payment Method
            </span>
            <p className="font-bold text-stone-900 dark:text-ivory-100">{paymentMethodLabel}</p>
            <p className="font-serif font-black text-base text-maroon-800 dark:text-gold-400 pt-1">
              Total: ₹{Number(total)?.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {paymentMethodLabel.includes('COD') ? 'Payable upon package delivery' : 'Payment Status: Captured (Paid)'}
            </p>
          </div>
        </div>

        {/* Ordered Items List */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block uppercase tracking-wider">
            Items in this order ({items.length}):
          </span>

          <div className="divide-y divide-gold-500/15 border border-gold-500/20 rounded-2xl overflow-hidden">
            {items.map((item, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between gap-4 text-xs bg-white/40 dark:bg-stone-900/40">
                <div className="flex items-center gap-3 min-w-0">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gold-500/20"
                    />
                  )}
                  <div className="min-w-0">
                    <h4 className="font-serif font-bold text-stone-900 dark:text-ivory-100 truncate">{item.name}</h4>
                    <p className="text-[11px] text-stone-500">
                      Quantity: {item.quantity} {item.color ? `• Shade: ${item.color}` : ''} {item.size ? `• Size: ${item.size}` : ''}
                    </p>
                    <p className="text-[10px] text-stone-400">Unit Price: ₹{Number(item.price)?.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <span className="font-serif font-bold text-maroon-800 dark:text-gold-400 shrink-0 text-sm">
                  ₹{(Number(item.price) * Number(item.quantity))?.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Price Breakdown Table */}
        <div className="pt-4 border-t border-gold-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-stone-500 space-y-1">
            <p>• Handcrafted authenticity certificate enclosed.</p>
            <p>• 7-day hassle-free return &amp; exchange guaranteed.</p>
          </div>

          <div className="w-full sm:w-72 space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-600 dark:text-stone-300">
              <span>Items Subtotal:</span>
              <span className="font-semibold">₹{Number(subtotal)?.toLocaleString('en-IN')}</span>
            </div>
            {Number(discount) > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Festive Discount:</span>
                <span>-₹{Number(discount)?.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-600 dark:text-stone-300">
              <span>Express Shipping:</span>
              <span className="font-semibold">
                {Number(shippingCost) > 0 ? `₹${Number(shippingCost)?.toLocaleString('en-IN')}` : 'FREE'}
              </span>
            </div>
            <div className="flex justify-between text-base font-serif font-black text-maroon-800 dark:text-gold-400 pt-2 border-t border-gold-500/20">
              <span>Grand Total:</span>
              <span>₹{Number(total)?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gold-500/10 text-xs">
          <a
            href={invoiceDownloadUrl}
            className="inline-flex items-center gap-1.5 font-bold text-maroon-700 dark:text-gold-400 hover:underline"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Official Tax Invoice (.html)</span>
          </a>

          <Link
            href="/shop"
            className="btn-outline-maroon py-2.5 px-6 font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>

      {/* Cancelled Banner (if order was just cancelled) */}
      {isCancelled && (
        <div className="ethnic-card p-6 rounded-3xl border border-rose-300/40 dark:border-rose-800/40">
          <div className="flex items-center gap-3 text-xs">
            <Ban className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold text-rose-800 dark:text-rose-300">This order has been cancelled.</p>
              <p className="text-stone-500 mt-1">If a refund was applicable, it will be credited to your original payment method within 5–7 business days.</p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-gold-500/30 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="font-serif font-black text-lg text-stone-900 dark:text-ivory-100">
                Cancel This Order?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Are you sure you want to cancel order <strong className="text-maroon-800 dark:text-gold-400">{displayOrderNumber}</strong>?
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">Reason (Optional)</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2.5 bg-ivory-100 dark:bg-stone-800 text-stone-900 dark:text-ivory-100 text-xs rounded-xl border border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                <option value="">Select a reason...</option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Found better price elsewhere">Found better price elsewhere</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Delivery too slow">Delivery taking too long</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="flex-1 py-3 px-4 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold transition-colors disabled:opacity-60"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-700 text-white hover:bg-rose-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {isCancelling ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cancelling...</>
                ) : (
                  <><XCircle className="w-3.5 h-3.5" /> Yes, Cancel</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
