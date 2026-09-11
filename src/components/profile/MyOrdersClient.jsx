'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import {
  Package, Truck, ArrowRight, CheckCircle2, Clock, RotateCcw, FileText, Download,
  XCircle, AlertTriangle, Loader2, Ban, RefreshCw, Camera, UploadCloud, Eye, Trash2,
  ShieldCheck, ShieldAlert, Check, Info, X, ExternalLink, Image as ImageIcon
} from 'lucide-react';

// Statuses that allow cancellation (only while pending — before confirmed)
const CANCELLABLE_STATUSES = ['pending', 'pending payment'];

// Status badge styling map
const STATUS_BADGE = {
  'Delivered': 'bg-emerald-700 text-white',
  'Return Requested': 'bg-amber-600 text-white',
  'Return Approved': 'bg-indigo-600 text-white',
  'Returned': 'bg-purple-700 text-white',
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

const RETURN_REASONS = [
  'Damaged during courier transit (Cracked/Dented)',
  'Defective zari embroidery / loose threads',
  'Wrong item / variant / color delivered',
  'Missing pieces or accessories from package',
  'Product quality not as pictured or described',
  'Parcel seal was tampered upon arrival',
];

export default function MyOrdersClient() {
  const { userOrders, cancelOrder, raiseReturnTicket } = useAuth();
  const { addToCart, openCart } = useCart();
  const { addToast } = useToast();

  // Cancel modal state
  const [cancelModal, setCancelModal] = useState({ open: false, order: null });
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Return Support Ticket Modal State
  const [returnModal, setReturnModal] = useState({ open: false, order: null });
  const [returnReason, setReturnReason] = useState('');
  const [returnDescription, setReturnDescription] = useState('');
  const [returnResolution, setReturnResolution] = useState('refund'); // 'refund' | 'replacement'
  const [selectedPhotos, setSelectedPhotos] = useState([]); // array of { file, previewUrl }
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const fileInputRef = useRef(null);

  // View Ticket Details Modal State
  const [viewTicketModal, setViewTicketModal] = useState({ open: false, order: null, claim: null });
  const [lightboxImage, setLightboxImage] = useState(null);

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

  // ── Open / Close Return Ticket Modal ──
  const openReturnModal = (order) => {
    setReturnModal({ open: true, order });
    setReturnReason(RETURN_REASONS[0]);
    setReturnDescription('');
    setReturnResolution('refund');
    setSelectedPhotos([]);
  };

  const closeReturnModal = () => {
    setReturnModal({ open: false, order: null });
    setSelectedPhotos([]);
    setReturnDescription('');
  };

  // Handle Photo Selection (Max 3)
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 3 - selectedPhotos.length;
    if (remainingSlots <= 0) {
      addToast('You can upload a maximum of 3 proof photos.', 'warning');
      return;
    }

    const validFiles = files.slice(0, remainingSlots).filter((file) => {
      if (!file.type.startsWith('image/')) {
        addToast(`"${file.name}" is not an image. Only JPG, PNG, WEBP allowed.`, 'error');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        addToast(`"${file.name}" is too large (max 5MB).`, 'error');
        return false;
      }
      return true;
    });

    const newEntries = validFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedPhotos((prev) => [...prev, ...newEntries]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index) => {
    setSelectedPhotos((prev) => {
      const copy = [...prev];
      if (copy[index]?.previewUrl) {
        URL.revokeObjectURL(copy[index].previewUrl);
      }
      copy.splice(index, 1);
      return copy;
    });
  };

  // Submit Return / Refund Support Ticket
  const handleSubmitReturnTicket = async (e) => {
    e.preventDefault();
    if (!returnModal.order) return;

    if (!returnReason) {
      addToast('Please select a reason for your return query.', 'error');
      return;
    }

    if (!returnDescription || returnDescription.trim().length < 5) {
      addToast('Please write a brief description of the defect or problem.', 'error');
      return;
    }

    if (selectedPhotos.length === 0) {
      addToast('Please upload at least 1 photo showing the delivered product defect/damage.', 'error');
      return;
    }

    setIsSubmittingTicket(true);
    try {
      // Step 1: Upload the photos to Supabase Storage
      const formData = new FormData();
      selectedPhotos.forEach((item, idx) => {
        formData.append(`file_${idx}`, item.file);
      });

      const uploadRes = await fetch('/api/upload/return-proof', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.urls || uploadData.urls.length === 0) {
        throw new Error(uploadData.error || 'Failed to upload proof photos');
      }

      // Step 2: Submit Return Claim with uploaded URLs
      const targetOrderId = returnModal.order.dbId || returnModal.order.id;
      const result = await raiseReturnTicket(targetOrderId, {
        reason: returnReason,
        description: returnDescription,
        images: uploadData.urls,
        resolution: returnResolution,
      });

      if (result.success) {
        addToast(
          `Support Ticket ${result.ticketId || ''} raised successfully! Admin will verify your photos.`,
          'success'
        );
        closeReturnModal();
      } else {
        addToast(result.error || 'Failed to submit return ticket', 'error');
      }
    } catch (err) {
      console.error('Ticket submit error:', err);
      addToast(err.message || 'Error submitting return ticket', 'error');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // ── Open View Ticket Modal ──
  const openTicketModal = async (order) => {
    let claim = order.returnClaim;

    // If claim not on local order, fetch live
    if (!claim) {
      try {
        const res = await fetch(`/api/orders/${order.dbId || order.id}/return`);
        const data = await res.json();
        if (data.success && data.claim) {
          claim = data.claim;
        }
      } catch (_) {}
    }

    setViewTicketModal({
      open: true,
      order,
      claim: claim || {
        ticketId: `TKT-${order.id}`,
        status: order.rawStatus || 'return_requested',
        reason: 'Customer Return Claim',
        description: 'Verification in progress with artisan support team.',
        images: [],
        resolution: 'refund',
        requestedAt: order.created_at,
        adminNotes: '',
      },
    });
  };

  const closeTicketModal = () => {
    setViewTicketModal({ open: false, order: null, claim: null });
  };

  const isCancellable = (order) => {
    const status = (order.rawStatus || order.status || '').toLowerCase();
    return CANCELLABLE_STATUSES.includes(status);
  };

  const isReturnEligible = (order) => {
    const status = (order.rawStatus || order.status || '').toLowerCase();
    return status === 'delivered';
  };

  const hasReturnClaim = (order) => {
    const status = (order.rawStatus || order.status || '').toLowerCase();
    return Boolean(
      order.returnClaim ||
      ['return_requested', 'return_approved', 'returned', 'refunded'].includes(status)
    );
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
            View orders, track parcels, download invoices, or raise return &amp; damage claims.
          </p>
        </div>
      </div>

      {/* Orders List Cards */}
      <div className="space-y-6">
        {userOrders.map((order) => {
          const isReturned = hasReturnClaim(order);
          const claimStatus = order.returnClaim?.status || order.rawStatus;

          return (
            <div
              key={order.dbId || order.id}
              className={`ethnic-card p-6 sm:p-8 rounded-3xl space-y-5 border transition-all ${
                order.status === 'Cancelled'
                  ? 'border-rose-300/40 dark:border-rose-800/40 opacity-80'
                  : isReturned
                  ? 'border-amber-500/40 dark:border-amber-700/50 bg-amber-50/20 dark:bg-amber-950/10'
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
                    <span className={`badge-ribbon ${STATUS_BADGE[order.status] || 'bg-amber-600 text-white'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-stone-500">
                    Placed on {order.date} • {order.items?.length} {order.items?.length === 1 ? 'item' : 'items'}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-stone-500 uppercase font-bold block">Total Amount</span>
                  <span
                    className={`font-serif font-black text-base ${
                      order.status === 'Cancelled'
                        ? 'text-rose-700 dark:text-rose-400 line-through'
                        : 'text-maroon-800 dark:text-gold-400'
                    }`}
                  >
                    ₹{order.total?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Items Row */}
              <div className="space-y-3">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gold-500/20"
                      />
                      <div className="min-w-0">
                        <h4
                          className={`font-serif font-bold truncate ${
                            order.status === 'Cancelled'
                              ? 'text-stone-500 dark:text-stone-500 line-through'
                              : 'text-stone-900 dark:text-ivory-100'
                          }`}
                        >
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-stone-500">
                          Qty: {item.quantity} {item.color ? `• Shade: ${item.color}` : ''} {item.size ? `• ${item.size}` : ''}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-serif font-bold shrink-0 ${
                        order.status === 'Cancelled' ? 'text-stone-400 line-through' : 'text-stone-800 dark:text-stone-200'
                      }`}
                    >
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

              {/* Return Support Ticket Banner (if return claim active) */}
              {isReturned && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900 dark:text-amber-200">
                        Support Ticket Active: {order.returnClaim?.ticketId || `Claim for ${order.id}`}
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                        Status:{' '}
                        <strong className="capitalize font-bold text-maroon-800 dark:text-gold-400">
                          {claimStatus === 'pending_review'
                            ? 'Pending Admin Verification'
                            : claimStatus === 'approved'
                            ? 'Approved - Pickup Scheduling'
                            : claimStatus === 'rejected'
                            ? 'Claim Rejected'
                            : claimStatus === 'refunded'
                            ? 'Refund Completed'
                            : claimStatus?.replace(/_/g, ' ')}
                        </strong>
                        {order.returnClaim?.adminNotes && ` • Remarks: ${order.returnClaim.adminNotes}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openTicketModal(order)}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-1 shrink-0 self-start sm:self-auto transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Ticket &amp; Photos
                  </button>
                </div>
              )}

              {/* Actions Bar */}
              <div className="pt-4 border-t border-gold-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-stone-500">
                  {order.status !== 'Cancelled' && (
                    <>
                      Courier: <strong className="text-stone-800 dark:text-stone-200">{order.carrier}</strong> • AWB:{' '}
                      <strong className="font-mono text-stone-800 dark:text-stone-200">{order.trackingNumber}</strong>
                    </>
                  )}
                </div>

                <div className="flex items-center flex-wrap gap-2.5">
                  {/* Cancel Button — pre-dispatch */}
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

                  {/* Return / Refund Ticket Button — for delivered orders */}
                  {isReturnEligible(order) && !isReturned && (
                    <button
                      onClick={() => openReturnModal(order)}
                      className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Raise damage or return claim with 3 photos"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Return / Refund Ticket</span>
                    </button>
                  )}

                  {/* View Ticket Button if already raised */}
                  {isReturned && (
                    <button
                      onClick={() => openTicketModal(order)}
                      className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="View Support Ticket Status"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Support Ticket</span>
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
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RAISE RETURN / REFUND SUPPORT TICKET MODAL */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {returnModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full p-5 sm:p-7 space-y-4 border border-gold-500/30 shadow-2xl my-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gold-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-base sm:text-lg text-stone-900 dark:text-ivory-100">
                    Raise Return &amp; Refund Ticket
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Order #{returnModal.order?.id} • Guaranteed 7-day doorstep replacement
                  </p>
                </div>
              </div>
              <button
                onClick={closeReturnModal}
                disabled={isSubmittingTicket}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturnTicket} className="space-y-4 text-xs">
              {/* Step 1: Select Reason */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  1. Select Issue Reason <span className="text-rose-500">*</span>
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2.5 bg-ivory-100 dark:bg-stone-800 text-stone-900 dark:text-ivory-100 rounded-xl border border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500 font-medium"
                >
                  {RETURN_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Desired Resolution */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-800 dark:text-stone-200">
                  2. Preferred Resolution <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                      returnResolution === 'refund'
                        ? 'border-maroon-800 dark:border-gold-500 bg-maroon-50 dark:bg-gold-950/20 font-bold'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resolution"
                      value="refund"
                      checked={returnResolution === 'refund'}
                      onChange={() => setReturnResolution('refund')}
                      className="text-maroon-800 focus:ring-maroon-800"
                    />
                    <div>
                      <span className="block text-stone-900 dark:text-ivory-100 font-bold">100% Full Refund</span>
                      <span className="text-[10px] text-stone-500 font-normal">Back to original payment method</span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                      returnResolution === 'replacement'
                        ? 'border-maroon-800 dark:border-gold-500 bg-maroon-50 dark:bg-gold-950/20 font-bold'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resolution"
                      value="replacement"
                      checked={returnResolution === 'replacement'}
                      onChange={() => setReturnResolution('replacement')}
                      className="text-maroon-800 focus:ring-maroon-800"
                    />
                    <div>
                      <span className="block text-stone-900 dark:text-ivory-100 font-bold">Free Replacement</span>
                      <span className="text-[10px] text-stone-500 font-normal">Fresh handcrafted piece delivered</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 3: Up to 3 Photo Uploads */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-maroon-700 dark:text-gold-400" />
                    3. Upload Defect / Damage Photos <span className="text-rose-500">* (Up to 3 Photos)</span>
                  </label>
                  <span className="text-[11px] font-bold text-stone-500">{selectedPhotos.length} / 3 selected</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Please upload clear pictures of the damaged area, defective embroidery, and shipping label.
                </p>

                {/* Photo Previews & Drop Area */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  {selectedPhotos.map((item, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gold-500/30 group bg-stone-900">
                      <img src={item.previewUrl} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[9px] font-bold bg-black/70 text-white rounded">
                        Photo {idx + 1}
                      </span>
                    </div>
                  ))}

                  {selectedPhotos.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-gold-500/40 hover:border-gold-500 bg-gold-500/5 hover:bg-gold-500/10 flex flex-col items-center justify-center gap-1 text-stone-600 dark:text-stone-400 transition-colors p-2 text-center"
                    >
                      <UploadCloud className="w-6 h-6 text-gold-600" />
                      <span className="font-bold text-[11px] text-maroon-800 dark:text-gold-400">+ Add Photo</span>
                      <span className="text-[9px] text-stone-500">JPG/PNG &lt; 5MB</span>
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              {/* Step 4: Detailed Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-800 dark:text-stone-200">
                  4. Explain the Problem <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  placeholder="E.g. The zari embroidery thread is coming off on the left border, or parcel arrived dented..."
                  className="w-full px-3 py-2.5 bg-ivory-100 dark:bg-stone-800 text-stone-900 dark:text-ivory-100 rounded-xl border border-gold-500/30 focus:outline-none focus:ring-2 focus:ring-gold-500 placeholder:text-stone-400"
                />
              </div>

              {/* Notice Banner */}
              <div className="p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 text-[11px] text-stone-700 dark:text-stone-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
                <span>
                  Admin will inspect your photos within <strong>12 to 24 hours</strong>. Upon verification, free reverse pickup will be scheduled and your refund / replacement will be processed.
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closeReturnModal}
                  disabled={isSubmittingTicket}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="flex-1 py-2.5 rounded-xl bg-maroon-800 hover:bg-maroon-900 text-white font-bold flex items-center justify-center gap-2 shadow-maroon-sm transition-colors disabled:opacity-60"
                >
                  {isSubmittingTicket ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading &amp; Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-gold-400" />
                      <span>Submit Return Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* VIEW TICKET DETAILS & PHOTO LIGHTBOX MODAL */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {viewTicketModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full p-5 sm:p-7 space-y-4 border border-gold-500/30 shadow-2xl my-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gold-500/20 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-gold-600 bg-gold-500/15 px-2 py-0.5 rounded-full">
                    {viewTicketModal.claim?.ticketId}
                  </span>
                  <span
                    className={`badge-ribbon ${
                      viewTicketModal.claim?.status === 'approved'
                        ? 'bg-emerald-600 text-white'
                        : viewTicketModal.claim?.status === 'rejected'
                        ? 'bg-rose-600 text-white'
                        : viewTicketModal.claim?.status === 'refunded'
                        ? 'bg-blue-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {viewTicketModal.claim?.status === 'pending_review'
                      ? 'Under Admin Verification'
                      : viewTicketModal.claim?.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="font-serif font-black text-base sm:text-lg text-stone-900 dark:text-ivory-100 mt-1">
                  Support Ticket Status &amp; Claims
                </h3>
              </div>
              <button
                onClick={closeTicketModal}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Claim Info Box */}
            <div className="p-3.5 rounded-2xl bg-ivory-100 dark:bg-stone-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-stone-500 text-[11px]">
                <span>Order #{viewTicketModal.order?.id}</span>
                <span>Claim Amount: ₹{viewTicketModal.claim?.refundAmount || viewTicketModal.order?.total}</span>
              </div>
              <p className="text-stone-700 dark:text-stone-300">
                Reason: <strong className="text-maroon-800 dark:text-gold-400">{viewTicketModal.claim?.reason}</strong>
              </p>
              <p className="text-stone-600 dark:text-stone-400 italic">
                "{viewTicketModal.claim?.description}"
              </p>
              {viewTicketModal.claim?.adminNotes && (
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-[11px] text-indigo-900 dark:text-indigo-200">
                  <strong>Admin Remarks:</strong> {viewTicketModal.claim.adminNotes}
                </div>
              )}
            </div>

            {/* Uploaded Photos Gallery */}
            {viewTicketModal.claim?.images && viewTicketModal.claim.images.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-stone-800 dark:text-stone-200 block">
                  Uploaded Proof Photos ({viewTicketModal.claim.images.length})
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {viewTicketModal.claim.images.map((imgUrl, i) => (
                    <div
                      key={i}
                      onClick={() => setLightboxImage(imgUrl)}
                      className="aspect-square rounded-xl overflow-hidden border border-gold-500/20 relative cursor-pointer group bg-stone-900"
                    >
                      <img src={imgUrl} alt={`Proof ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Eye className="w-5 h-5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Progress */}
            <div className="space-y-2 text-xs pt-1 border-t border-gold-500/10">
              <span className="font-bold text-stone-800 dark:text-stone-200 block">Claim Progress Timeline</span>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </div>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">Ticket Submitted by Customer</span>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      viewTicketModal.claim?.status !== 'pending_review'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 text-slate-950 animate-pulse'
                    }`}
                  >
                    {viewTicketModal.claim?.status !== 'pending_review' ? '✓' : '•'}
                  </div>
                  <span
                    className={
                      viewTicketModal.claim?.status !== 'pending_review'
                        ? 'font-semibold text-stone-800 dark:text-stone-200'
                        : 'font-bold text-amber-600 dark:text-amber-400'
                    }
                  >
                    Admin Review &amp; Photo Inspection
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      ['approved', 'pickup_scheduled', 'returned', 'refunded'].includes(viewTicketModal.claim?.status)
                        ? 'bg-emerald-500 text-white'
                        : viewTicketModal.claim?.status === 'rejected'
                        ? 'bg-rose-500 text-white'
                        : 'bg-stone-300 dark:bg-stone-700 text-stone-500'
                    }`}
                  >
                    {['approved', 'pickup_scheduled', 'returned', 'refunded'].includes(viewTicketModal.claim?.status)
                      ? '✓'
                      : viewTicketModal.claim?.status === 'rejected'
                      ? '✕'
                      : '3'}
                  </div>
                  <span className="text-stone-600 dark:text-stone-400">
                    {viewTicketModal.claim?.status === 'rejected'
                      ? 'Claim Rejected'
                      : 'Doorstep Pickup & Quality Check'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      viewTicketModal.claim?.status === 'refunded'
                        ? 'bg-blue-600 text-white'
                        : 'bg-stone-300 dark:bg-stone-700 text-stone-500'
                    }`}
                  >
                    {viewTicketModal.claim?.status === 'refunded' ? '✓' : '4'}
                  </div>
                  <span className="text-stone-600 dark:text-stone-400">
                    {viewTicketModal.claim?.resolution === 'replacement'
                      ? 'Replacement Parcel Dispatched'
                      : 'Refund Credited to Original Source'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={closeTicketModal}
                className="w-full py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold hover:bg-stone-200 transition-colors text-xs"
              >
                Close Ticket View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PHOTO LIGHTBOX ZOOM */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl">
            <img src={lightboxImage} alt="Enlarged proof" className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CANCEL MODAL */}
      {/* ═══════════════════════════════════════════════════════════════ */}
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
}
