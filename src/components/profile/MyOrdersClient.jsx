'use client';
import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import {
  Package, Truck, ArrowRight, CheckCircle2, Clock, RotateCcw, FileText, Download,
  XCircle, AlertTriangle, Loader2, Ban, RefreshCw, Camera, UploadCloud, Eye, Trash2,
  ShieldCheck, ShieldAlert, Check, Info, X, ExternalLink, Image as ImageIcon, MessageCircle,
  MapPin, Copy, CreditCard, Navigation, Activity, Lock
} from 'lucide-react';

// Statuses that allow customer cancellation — strictly before order is packed
const CANCELLABLE_STATUSES = ['pending', 'new', 'confirmed', 'processing'];

// Post-packed logistics statuses where cancellation is locked
const POST_PACKED_STATUSES = [
  'packed',
  'pickup_scheduled',
  'pickup scheduled',
  'picked_up',
  'picked up',
  'shipped',
  'in_transit',
  'in transit',
  'out_for_delivery',
  'out for delivery',
  'failed_delivery',
  'delivery failed',
  'rto_initiated',
  'rto_delivered',
];

// Status badge styling map
const STATUS_BADGE = {
  'Delivered': 'bg-emerald-700 text-white',
  'Return Requested': 'bg-amber-600 text-white',
  'Return Approved': 'bg-indigo-600 text-white',
  'Return Initiated': 'bg-indigo-700 text-white',
  'Returned': 'bg-purple-700 text-white',
  'Cancelled': 'bg-rose-700 text-white',
  'Refunded': 'bg-blue-700 text-white',
  'Payment Failed': 'bg-red-600 text-white',
  'Shipped': 'bg-sky-700 text-white',
  'In Transit': 'bg-blue-600 text-white',
  'Picked Up': 'bg-indigo-600 text-white',
  'Pickup Scheduled': 'bg-cyan-700 text-white',
  'Out for Delivery': 'bg-orange-600 text-white',
  'Delivery Failed': 'bg-amber-700 text-white',
  'RTO Initiated': 'bg-purple-800 text-white',
  'RTO Delivered': 'bg-purple-900 text-white',
  'Packed': 'bg-teal-600 text-white',
  'Processing': 'bg-amber-600 text-white',
  'Confirmed': 'bg-emerald-600 text-white',
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

  // Exclude unpaid / abandoned checkout attempts — only show placed orders
  const placedOrders = useMemo(() => {
    return (userOrders || []).filter((o) => {
      const s = (o.rawStatus || o.status || '').toLowerCase();
      return !['pending_payment', 'pending payment', 'payment_failed', 'payment failed', 'draft'].includes(s);
    });
  }, [userOrders]);

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

  // Full Order Details & Real-Time Tracking Modal State
  const [detailsModal, setDetailsModal] = useState({
    open: false,
    order: null,
    liveTracking: null,
    loadingTracking: false,
  });
  const [copiedAwb, setCopiedAwb] = useState(false);

  const openDetailsModal = async (order) => {
    setDetailsModal({
      open: true,
      order,
      liveTracking: null,
      loadingTracking: true,
    });
    try {
      const orderIdentifier = order.dbId || order.order_number || order.id;
      const res = await fetch(`/api/orders/${encodeURIComponent(orderIdentifier)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.tracking) {
          setDetailsModal((prev) => ({
            ...prev,
            liveTracking: json.tracking,
            loadingTracking: false,
          }));
          return;
        }
      }
      setDetailsModal((prev) => ({ ...prev, loadingTracking: false }));
    } catch (_) {
      setDetailsModal((prev) => ({ ...prev, loadingTracking: false }));
    }
  };

  const closeDetailsModal = () => {
    setDetailsModal({
      open: false,
      order: null,
      liveTracking: null,
      loadingTracking: false,
    });
    setCopiedAwb(false);
  };

  const handleCopyAwb = (awb) => {
    if (!awb) return;
    try {
      navigator.clipboard?.writeText(awb);
      setCopiedAwb(true);
      addToast(`Tracking AWB "${awb}" copied to clipboard!`, 'info');
      setTimeout(() => setCopiedAwb(false), 2500);
    } catch (_) {}
  };

  const formatAddress = (addr) => {
    if (!addr) return 'No delivery address recorded';
    if (typeof addr === 'string') {
      try {
        const parsed = JSON.parse(addr);
        return formatAddress(parsed);
      } catch (_) {
        return addr;
      }
    }
    const parts = [
      addr.name || addr.full_name,
      addr.phone ? `Phone: ${addr.phone}` : '',
      addr.address_line_1 || addr.address || addr.street,
      addr.address_line_2 || addr.landmark,
      addr.city,
      addr.state,
      addr.postal_code || addr.pincode || addr.zip,
    ].filter(Boolean);
    return parts.join(', ');
  };

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

  const isPostPacked = (order) => {
    const status = (order.rawStatus || order.status || '').toLowerCase();
    return POST_PACKED_STATUSES.includes(status);
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

  if (!placedOrders || placedOrders.length === 0) {
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
            My Past Orders ({placedOrders.length})
          </h1>
          <p className="text-xs text-stone-500">
            View orders, track parcels, download invoices, or raise return &amp; damage claims.
          </p>
        </div>
      </div>

      {/* Orders List Cards */}
      <div className="space-y-6">
        {placedOrders.map((order) => {
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
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openDetailsModal(order)}
                      className="font-serif font-black text-base text-stone-900 dark:text-ivory-100 hover:text-maroon-800 dark:hover:text-gold-400 hover:underline flex items-center gap-1.5 transition-colors text-left"
                      title="Click to view full order details"
                    >
                      <span>Order {order.id}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                    </button>
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
                  <div key={idx} className="flex items-center justify-between gap-4 text-xs group">
                    <div className="flex items-center gap-3 min-w-0">
                      <Link
                        href={`/product/${item.slug || item.productId || ''}`}
                        className="shrink-0 block"
                        title="View product details"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover border border-gold-500/20 group-hover:border-gold-500/60 transition-all hover:scale-105"
                        />
                      </Link>
                      <div className="min-w-0">
                        <Link
                          href={`/product/${item.slug || item.productId || ''}`}
                          className={`font-serif font-bold truncate block hover:text-maroon-800 dark:hover:text-gold-400 transition-colors ${
                            order.status === 'Cancelled'
                              ? 'text-stone-500 dark:text-stone-500 line-through'
                              : 'text-stone-900 dark:text-ivory-100'
                          }`}
                          title="View product page"
                        >
                          {item.name}
                        </Link>
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-stone-500 mt-0.5">
                          <span>Qty: {item.quantity}</span>
                          {item.color && <span>• Shade: {item.color}</span>}
                          {item.size && <span>• {item.size}</span>}
                          <button
                            type="button"
                            onClick={() => openDetailsModal(order)}
                            className="text-gold-600 dark:text-gold-400 hover:underline font-medium inline-flex items-center gap-0.5"
                          >
                            <span>(Order Details)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`font-serif font-bold block ${
                          order.status === 'Cancelled' ? 'text-stone-400 line-through' : 'text-stone-800 dark:text-stone-200'
                        }`}
                      >
                        ₹{(item.price * item.quantity)?.toLocaleString('en-IN')}
                      </span>
                      <Link
                        href={`/product/${item.slug || item.productId || ''}`}
                        className="text-[10px] text-gold-700 dark:text-gold-400 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                      >
                        <span>View Product</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>
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

              {/* Return & Refund Support Ticket Banner (if return claim active) */}
              {isReturned && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                            Return / Refund Ticket: {order.returnClaim?.ticketId || `Claim for ${order.id}`}
                          </p>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] capitalize ${
                            claimStatus === 'approved'
                              ? 'bg-indigo-600 text-white'
                              : claimStatus === 'refunded'
                              ? 'bg-blue-600 text-white'
                              : claimStatus === 'rejected'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-600 text-white'
                          }`}>
                            {claimStatus === 'pending_review'
                              ? 'Pending Admin Verification'
                              : claimStatus === 'approved'
                              ? 'Approved - Reverse Pickup'
                              : claimStatus === 'rejected'
                              ? 'Claim Rejected'
                              : claimStatus === 'refunded'
                              ? 'Refund Completed'
                              : claimStatus?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">
                          <strong>Stated Reason:</strong> {order.returnClaim?.reason || 'Damaged / Defect condition reported'}
                        </p>
                        {order.returnClaim?.description && (
                          <p className="text-[11px] text-stone-600 dark:text-stone-400 italic mt-0.5">
                            "{order.returnClaim.description}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                      {/* WhatsApp Support Button */}
                      <a
                        href={`https://wa.me/918789968980?text=${encodeURIComponent(
                          `Hi Trio Enterprises Support, I need help regarding my Return / Refund Ticket ${order.returnClaim?.ticketId || order.id} for Order #${order.id}. Stated Reason: ${order.returnClaim?.reason || ''}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors shadow-sm"
                        title="Chat with support on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat on WhatsApp</span>
                      </a>

                      {/* View Ticket & Photos Modal Button */}
                      <button
                        onClick={() => openTicketModal(order)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Ticket &amp; Photos</span>
                      </button>
                    </div>
                  </div>

                  {/* Return Logistics & Reverse AWB Section */}
                  <div className="pt-2.5 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-[11px] text-amber-900 dark:text-amber-200">
                    <div>
                      <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold">Reverse Pickup Courier</span>
                      <strong className="font-semibold text-stone-800 dark:text-stone-200">
                        {order.returnClaim?.pickupCourier || 'Delhivery Surface / BlueDart Reverse'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold">Reverse Return AWB</span>
                      <strong className="font-mono bg-amber-500/20 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded text-xs">
                        {order.returnClaim?.reverseAwb || (['approved', 'pickup_scheduled', 'returned', 'refunded'].includes(claimStatus) ? `RET-${order.order_number || order.id.slice(-8)}` : 'Generated once pickup is scheduled')}
                      </strong>
                    </div>

                    <div>
                      <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold">
                        {claimStatus === 'refunded' ? 'Refund Status' : 'Resolution Requested'}
                      </span>
                      <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                        {claimStatus === 'refunded'
                          ? `₹${order.returnClaim?.refundAmount || order.total} Refunded to Original Method`
                          : order.returnClaim?.resolution === 'replacement'
                          ? 'Free Handcrafted Replacement'
                          : `100% Refund (₹${order.total})`}
                      </strong>
                    </div>

                    {(order.returnClaim?.refundReason || order.returnClaim?.adminNotes) && (
                      <div className="sm:col-span-2 md:col-span-3 pt-1 text-[11px] bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                        {order.returnClaim?.refundReason && (
                          <p className="text-amber-900 dark:text-amber-200">
                            <strong>Reason for Refund / Acceptance:</strong> {order.returnClaim.refundReason}
                          </p>
                        )}
                        {order.returnClaim?.adminNotes && (
                          <p className="text-stone-700 dark:text-stone-300 mt-0.5">
                            <strong>Admin Remarks:</strong> {order.returnClaim.adminNotes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
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
                      title="Cancel this order (Instant refund if prepaid)"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Order</span>
                    </button>
                  )}

                  {/* Cancellation Closed Badge — when packed or in logistics */}
                  {isPostPacked(order) && (
                    <div
                      className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-[11px] font-medium flex items-center gap-1.5"
                      title="Order has been packed and handed over to logistics. Cancellation is closed."
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Cancellation Closed (Packed / In Transit)</span>
                    </div>
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

                  {/* Full Order & Products Details Button */}
                  <button
                    type="button"
                    onClick={() => openDetailsModal(order)}
                    className="px-3.5 py-2 rounded-xl bg-gold-500/15 border border-gold-500/40 text-maroon-900 dark:text-gold-300 hover:bg-gold-500/25 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    title="View complete order breakdown, products & real tracking"
                  >
                    <Eye className="w-3.5 h-3.5 text-gold-600" />
                    <span>Order Details</span>
                  </button>

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
            <div className="p-4 rounded-2xl bg-ivory-100 dark:bg-stone-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-stone-500 text-[11px] pb-1.5 border-b border-gold-500/10">
                <span>Order #{viewTicketModal.order?.id}</span>
                <span className="font-bold text-maroon-800 dark:text-gold-400">
                  Claim Value: ₹{viewTicketModal.claim?.refundAmount || viewTicketModal.order?.total}
                </span>
              </div>
              <p className="text-stone-700 dark:text-stone-300">
                <strong>Stated Reason:</strong> <span className="text-maroon-800 dark:text-gold-400 font-semibold">{viewTicketModal.claim?.reason}</span>
              </p>
              {viewTicketModal.claim?.description && (
                <p className="text-stone-600 dark:text-stone-400 italic">
                  "{viewTicketModal.claim?.description}"
                </p>
              )}

              {/* Reverse AWB & Logistics Details */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gold-500/10 text-[11px]">
                <div>
                  <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold">Reverse Return AWB</span>
                  <span className="font-mono font-bold text-maroon-800 dark:text-gold-400 bg-gold-500/15 px-1.5 py-0.5 rounded">
                    {viewTicketModal.claim?.reverseAwb || (['approved', 'pickup_scheduled', 'returned', 'refunded'].includes(viewTicketModal.claim?.status) ? `RET-${viewTicketModal.order?.id?.slice(-8)}` : 'Awaiting Reverse Dispatch')}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold">Pickup Partner</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {viewTicketModal.claim?.pickupCourier || 'Delhivery Surface / BlueDart Reverse'}
                  </span>
                </div>
              </div>

              {viewTicketModal.claim?.refundReason && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/40 text-[11px] text-emerald-900 dark:text-emerald-300">
                  <strong>Reason for Refund / Acceptance:</strong> {viewTicketModal.claim.refundReason}
                </div>
              )}

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

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <a
                href={`https://wa.me/918789968980?text=${encodeURIComponent(
                  `Hi Trio Enterprises Support, I am checking the status of my Return / Refund Ticket ${viewTicketModal.claim?.ticketId} for Order #${viewTicketModal.order?.id}. Reason: ${viewTicketModal.claim?.reason || ''}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 transition-colors text-xs shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with Support on WhatsApp</span>
              </a>
              <button
                onClick={closeTicketModal}
                className="py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold hover:bg-stone-200 transition-colors text-xs"
              >
                Close View
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

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FULL ORDER & PRODUCT DETAILS MODAL (WITH REAL TRACKING) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {detailsModal.open && detailsModal.order && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-gold-500/30 shadow-2xl my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gold-500/20 bg-stone-50/70 dark:bg-stone-950/60 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-serif font-black text-lg sm:text-xl text-stone-900 dark:text-ivory-100">
                    Order #{detailsModal.order.id}
                  </span>
                  <span className={`badge-ribbon ${STATUS_BADGE[detailsModal.order.status] || 'bg-amber-600 text-white'}`}>
                    {detailsModal.order.status}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    detailsModal.order.payment_status === 'captured' || detailsModal.order.payment_status === 'paid'
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                      : detailsModal.order.payment_status === 'refunded'
                      ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-500/30'
                      : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                  }`}>
                    Payment: {detailsModal.order.payment_status || 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Placed on {detailsModal.order.date} • {detailsModal.order.items?.length || 0} {detailsModal.order.items?.length === 1 ? 'item' : 'items'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetailsModal}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center text-stone-500 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
              {/* Real-time Tracking & Dispatch Status Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-gold-500/10 to-amber-500/5 border border-gold-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-maroon-800 dark:text-gold-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                        Delivery Logistics &amp; Courier
                      </div>
                      <div className="font-serif font-bold text-sm text-stone-900 dark:text-ivory-100">
                        {detailsModal.liveTracking?.carrier || detailsModal.order.carrier || 'Shiprocket Express'}
                      </div>
                      {(detailsModal.liveTracking?.awb || detailsModal.order.trackingNumber) ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-stone-500">AWB:</span>
                          <span className="font-mono text-xs font-bold bg-white dark:bg-stone-800 px-2 py-0.5 rounded border border-gold-500/30 text-maroon-900 dark:text-gold-300">
                            {detailsModal.liveTracking?.awb || detailsModal.order.trackingNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyAwb(detailsModal.liveTracking?.awb || detailsModal.order.trackingNumber)}
                            className="text-[11px] text-gold-700 hover:underline inline-flex items-center gap-1 font-semibold"
                            title="Copy AWB"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedAwb ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500 mt-0.5">
                          AWB generation in progress at dispatch warehouse.
                        </p>
                      )}
                    </div>
                  </div>

                  {detailsModal.order.status !== 'Cancelled' && (
                    <Link
                      href={`/track-order?id=${detailsModal.order.id}`}
                      className="btn-primary py-2 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-maroon-sm self-start sm:self-auto shrink-0"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Live Tracking</span>
                    </Link>
                  )}
                </div>

                {/* Live Current Location & Status */}
                <div className="pt-2.5 border-t border-gold-500/20 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      Current Location:
                    </span>
                    <span className="text-stone-700 dark:text-stone-300 font-medium">
                      {detailsModal.liveTracking?.currentLocation || detailsModal.order.shipment?.current_location || 'Warehouse Hub, Faridabad'}
                    </span>
                    {detailsModal.loadingTracking && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-gold-600 dark:text-gold-400 font-semibold ml-auto">
                        <Loader2 className="w-3 h-3 animate-spin" /> Fetching live scans...
                      </span>
                    )}
                  </div>
                  {(detailsModal.liveTracking?.currentActivity || detailsModal.order.status) && (
                    <p className="text-xs text-stone-600 dark:text-stone-400 italic pl-4">
                      Activity: {detailsModal.liveTracking?.currentActivity || (detailsModal.order.status === 'Delivered' ? 'Delivered safely to patron' : detailsModal.order.status === 'Shipped' ? 'In transit to local delivery hub' : 'Order verified and packed')}
                    </p>
                  )}
                </div>
              </div>

              {/* Products in this Order */}
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-ivory-100 flex items-center justify-between pb-2 border-b border-gold-500/20">
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gold-600" />
                    <span>Ordered Items ({detailsModal.order.items?.length || 0})</span>
                  </span>
                  <span className="text-xs text-stone-500 font-normal">Click any item to view details</span>
                </h4>

                <div className="space-y-3 divide-y divide-gold-500/10">
                  {detailsModal.order.items?.map((item, idx) => (
                    <div key={idx} className="pt-3 first:pt-0 flex items-start justify-between gap-4 text-xs group">
                      <div className="flex items-start gap-3 min-w-0">
                        <Link
                          href={`/product/${item.slug || item.productId || ''}`}
                          className="shrink-0 block"
                          title="Open product page"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 rounded-xl object-cover border border-gold-500/20 group-hover:border-gold-500/60 transition-all hover:scale-105"
                          />
                        </Link>
                        <div className="min-w-0 space-y-1">
                          <Link
                            href={`/product/${item.slug || item.productId || ''}`}
                            className="font-serif font-bold text-sm text-stone-900 dark:text-ivory-100 hover:text-maroon-800 dark:hover:text-gold-400 transition-colors line-clamp-2 block leading-snug"
                          >
                            {item.name}
                          </Link>
                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-stone-500">
                            {item.color && (
                              <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700">
                                Shade: <strong>{item.color}</strong>
                              </span>
                            )}
                            {item.size && (
                              <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700">
                                Size: <strong>{item.size}</strong>
                              </span>
                            )}
                            <span>Qty: <strong>{item.quantity}</strong></span>
                            <span>×</span>
                            <span>₹{Number(item.price || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <Link
                              href={`/product/${item.slug || item.productId || ''}`}
                              className="text-[11px] text-gold-700 dark:text-gold-400 hover:underline inline-flex items-center gap-1 font-semibold mt-1"
                            >
                              <span>View Product Details</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-serif font-bold text-sm text-maroon-800 dark:text-gold-400 block">
                          ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address & Contact */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-gold-500/20 space-y-2">
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gold-600" />
                  <span>Shipping Address &amp; Contact</span>
                </h4>
                <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed font-medium">
                  {formatAddress(detailsModal.order.shipping_address || detailsModal.order.shippingAddress)}
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-gold-500/20 space-y-2.5 text-xs">
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-gold-600" />
                  <span>Payment &amp; Cost Breakdown</span>
                </h4>

                <div className="flex justify-between items-center text-stone-600 dark:text-stone-400">
                  <span>Subtotal</span>
                  <span>₹{Number(detailsModal.order.subtotal || detailsModal.order.total || 0).toLocaleString('en-IN')}</span>
                </div>

                {Boolean(detailsModal.order.shipping_cost) && (
                  <div className="flex justify-between items-center text-stone-600 dark:text-stone-400">
                    <span>Shipping Charges</span>
                    <span>₹{Number(detailsModal.order.shipping_cost).toLocaleString('en-IN')}</span>
                  </div>
                )}

                {Boolean(detailsModal.order.discount) && (
                  <div className="flex justify-between items-center text-emerald-600 font-medium">
                    <span>Discount / Voucher</span>
                    <span>- ₹{Number(detailsModal.order.discount).toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-gold-500/20 flex justify-between items-center font-bold text-sm">
                  <span className="text-stone-900 dark:text-ivory-100">Total Order Amount</span>
                  <span className="text-maroon-800 dark:text-gold-400 font-serif font-black text-base">
                    ₹{Number(detailsModal.order.total || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-2 border-t border-gold-500/10 flex justify-between items-center text-[11px] text-stone-500">
                  <span>Payment Method:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200 uppercase">
                    {detailsModal.order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Prepaid Online'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-gold-500/20 bg-stone-50/70 dark:bg-stone-950/60 flex items-center justify-between gap-3 flex-wrap shrink-0">
              <button
                type="button"
                onClick={closeDetailsModal}
                className="py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-2.5 flex-wrap">
                {detailsModal.order.status !== 'Cancelled' && (
                  <a
                    href={`/api/orders/${detailsModal.order.dbId || detailsModal.order.id}/invoice?download=true`}
                    className="py-2.5 px-3.5 rounded-xl bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/40 text-maroon-900 dark:text-gold-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-gold-600" />
                    <span>Download Invoice</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleReorder(detailsModal.order);
                    closeDetailsModal();
                  }}
                  className="btn-outline-maroon py-2.5 px-4 text-xs font-bold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Buy Again</span>
                </button>

                {detailsModal.order.status !== 'Cancelled' && (
                  <Link
                    href={`/track-order?id=${detailsModal.order.id}`}
                    onClick={closeDetailsModal}
                    className="btn-primary py-2.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-maroon-sm"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Track Parcel</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
