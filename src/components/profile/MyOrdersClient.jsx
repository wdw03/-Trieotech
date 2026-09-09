'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import {
  Package, Truck, ArrowRight, CheckCircle2, Clock, RotateCcw, FileText, Download,
  XCircle, AlertTriangle, Loader2, Ban, RefreshCw
} from 'lucide-react';

// Statuses that allow cancellation (only while pending — before confirmed)
const CANCELLABLE_STATUSES = ['pending', 'pending payment'];

// Status badge styling map
const STATUS_BADGE = {
  'Delivered': 'bg-emerald-700 text-white',
  'Cancelled': 'bg-rose-700 text-white',
  'Refunded': 'bg-blue-700 text-white',
  'Payment Failed': 'bg-red-600 text-white',
  'Shipped': 'bg-sky-700 text-white',
  'Out for Delivery': 'bg-orange-600 text-white',
  'Packed': 'bg-teal-600 text-white',
  'Processing': 'bg-amber-600 text-white',
  'Confirmed': 'bg-amber-600 text-white',
  'Pending': 'bg-stone-500 text-white',
  'Pending Payment': 'bg-stone-500 text-white',
};

export default function MyOrdersClient() {
  const { userOrders, cancelOrder } = useAuth();
  const { addToCart, openCart } = useCart();
  const { addToast } = useToast();

  // Cancel modal state
  const [cancelModal, setCancelModal] = useState({ open: false, order: null });
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleReorder = (order) => {
    order.items.forEach(item => {
      addToCart({ id: item.productId, name: item.name, price: item.price, images: [item.image] }, item.quantity, item.color, item.size);
    });
    openCart();
  };

  const openCancelModal = (order) => {
    setCancelModal({ open: true, order });
    setCancelReason('');
  };

  const closeCancelModal = () => {
    setCancelModal({ open: false, order: null });
    setCancelReason('');
  };

  const handleCancelOrder = async () => {
    if (!cancelModal.order) return;
    setIsCancelling(true);
    try {
      const result = await cancelOrder(cancelModal.order.dbId, cancelReason || 'Customer requested cancellation');
      if (result.success) {
        addToast(
          result.refundInitiated
            ? `Order ${cancelModal.order.id} cancelled. Refund of ₹${cancelModal.order.total?.toLocaleString('en-IN')} initiated!`
            : `Order ${cancelModal.order.id} cancelled successfully.`,
          'success'
        );
        closeCancelModal();
      } else {
        addToast(result.error || 'Failed to cancel order', 'error');
      }
    } catch (err) {
      addToast('Something went wrong while cancelling', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const isCancellable = (order) => {
    const status = (order.status || '').toLowerCase();
    return CANCELLABLE_STATUSES.includes(status);
  };

  if (!userOrders || userOrders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
                <Breadcrumb items={[{ name: 'Account', url: '/profile' }, { name: 'My Orders', url: '/profile/orders' }]} />
        <EmptyState
          icon={Package}
          title="No Orders Placed Yet"
          description="You haven't placed any handcrafted orders yet. Discover our latest Zardosi and copper creations."
          actionText="Start Shopping"
          actionUrl="/shop"
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      
      <Breadcrumb items={[{ name: 'Account', url: '/profile' }, { name: 'My Orders', url: '/profile/orders' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-500/20 pb-4">
        <div>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100">
            My Past Orders ({userOrders.length})
          </h1>
          <p className="text-xs text-stone-500">
            View order details, download invoices, cancel orders, and track live shipments.
          </p>
        </div>
      </div>

      {/* Orders List Cards */}
      <div className="space-y-6">
        {userOrders.map((order) => (
          <div
            key={order.dbId || order.id}
            className={`ethnic-card p-6 sm:p-8 rounded-3xl space-y-5 border transition-all ${
              order.status === 'Cancelled'
                ? 'border-rose-300/40 dark:border-rose-800/40 opacity-80'
                : 'border-gold-500/20 hover:border-gold-500/40'
            }`}
          >
            {/* Top Bar Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gold-500/10 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-serif font-black text-base text-stone-900 dark:text-ivory-100">
                    Order {order.id}
                  </span>
                  <span
                    className={`badge-ribbon ${
                      STATUS_BADGE[order.status] || 'bg-amber-600 text-white'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-stone-500">
                  Placed on {order.date} • {order.items?.length} {order.items?.length === 1 ? 'item' : 'items'}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] text-stone-500 uppercase font-bold block">Total Amount</span>
                <span className={`font-serif font-black text-base ${
                  order.status === 'Cancelled' ? 'text-rose-700 dark:text-rose-400 line-through' : 'text-maroon-800 dark:text-gold-400'
                }`}>
                  ₹{order.total?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Items Row */}
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gold-500/20" />
                    <div className="min-w-0">
                      <h4 className={`font-serif font-bold truncate ${
                        order.status === 'Cancelled' ? 'text-stone-500 dark:text-stone-500 line-through' : 'text-stone-900 dark:text-ivory-100'
                      }`}>{item.name}</h4>
                      <p className="text-[11px] text-stone-500">
                        Qty: {item.quantity} {item.color ? `• Shade: ${item.color}` : ''} {item.size ? `• ${item.size}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`font-serif font-bold shrink-0 ${
                    order.status === 'Cancelled' ? 'text-stone-400 line-through' : 'text-stone-800 dark:text-stone-200'
                  }`}>
                    ₹{(item.price * item.quantity)?.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Cancellation Info Banner (if cancelled) */}
            {order.status === 'Cancelled' && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 flex items-center gap-2.5 text-xs">
                <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-rose-800 dark:text-rose-300 font-medium">
                  This order was cancelled.
                  {order.payment_status === 'refunded' && ' Refund has been initiated to your original payment method.'}
                </span>
              </div>
            )}

            {/* Actions Bar */}
            <div className="pt-4 border-t border-gold-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-stone-500">
                {order.status !== 'Cancelled' && (
                  <>Tracking ID: <strong className="font-mono text-stone-800 dark:text-stone-200">{order.trackingNumber}</strong></>
                )}
              </div>

              <div className="flex items-center flex-wrap gap-2.5">
                {/* Cancel Button — only for cancellable statuses */}
                {isCancellable(order) && (
                  <button
                    onClick={() => openCancelModal(order)}
                    className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    title="Cancel this order"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Order</span>
                  </button>
                )}

                {order.status !== 'Cancelled' && (
                  <>
                    <a
                      href={`/api/orders/${order.dbId || order.id}/invoice?download=true`}
                      className="px-3 py-2 rounded-xl bg-gold-500/15 border border-gold-500/40 text-maroon-900 dark:text-gold-300 hover:bg-gold-500/25 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Download Invoice as file"
                    >
                      <Download className="w-3.5 h-3.5 text-gold-600" />
                      <span>Download Invoice</span>
                    </a>
                    <a
                      href={`/api/orders/${order.dbId || order.id}/invoice`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      title="View and Print Invoice"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View</span>
                    </a>
                  </>
                )}

                <button
                  onClick={() => handleReorder(order)}
                  className="btn-outline-maroon py-2 px-4 text-xs font-bold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Buy Again</span>
                </button>

                {order.status !== 'Cancelled' && (
                  <Link
                    href={`/track-order?id=${order.id}`}
                    className="btn-primary py-2 px-5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-maroon-sm"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Track Parcel</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-gold-500/30 shadow-2xl">
            {/* Modal Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="font-serif font-black text-lg text-stone-900 dark:text-ivory-100">
                Cancel Order?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Are you sure you want to cancel order <strong className="text-maroon-800 dark:text-gold-400">{cancelModal.order?.id}</strong>?
                {cancelModal.order?.payment_method !== 'cod' && (
                  <> A full refund of <strong>₹{cancelModal.order?.total?.toLocaleString('en-IN')}</strong> will be initiated to your original payment method.</>
                )}
              </p>
            </div>

            {/* Reason Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                Reason for Cancellation (Optional)
              </label>
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
                <option value="Want to change address">Want to change shipping address</option>
                <option value="Want to change payment method">Want to change payment method</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={closeCancelModal}
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
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Yes, Cancel Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


