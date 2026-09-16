'use client';
import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../../context/AdminContext.jsx';
import { usePageLoading } from '../../../hooks/usePageLoading.js';
import { ReturnsTableSkeleton, Skeleton } from '../ui/Skeleton.jsx';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Eye,
  DollarSign,
  AlertCircle,
  X,
  Camera,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  FileText,
  MessageSquare,
  Copy,
  Check,
  Edit3,
  Package
} from 'lucide-react';

const RETURN_STAGES = [
  'All',
  'Return Requested',
  'Approved',
  'Pickup Scheduled',
  'Returned',
  'Refund Pending',
  'Refunded',
  'Rejected'
];

const REFUND_REASONS = [
  'Courier Transit Damage (Verified via Photos)',
  'Defective Zari Embroidery / Crafting Flaw',
  'Wrong Item / Variant Delivered',
  'Missing Item / Accessories from Shipment',
  'Customer Satisfaction / Return Guarantee',
  'Other'
];

const cleanPhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

export const Returns = () => {
  const { returns, updateReturnStatus, refreshReturns, showToast } = useAdmin();
  const isPageLoading = usePageLoading(450);

  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);

  // Rejection modal
  const [rejectModal, setRejectModal] = useState({ open: false, claim: null });
  const [rejectReason, setRejectReason] = useState('');

  // Refund modal
  const [refundModal, setRefundModal] = useState({
    open: false,
    claim: null,
    amount: 0,
    reason: REFUND_REASONS[0],
    customReason: '',
    adminNotes: 'Full refund approved by admin after photo verification.',
    reverseAwb: '',
    courier: 'Delhivery Surface / BlueDart Reverse'
  });

  // Reverse AWB Edit modal
  const [awbModal, setAwbModal] = useState({
    open: false,
    claim: null,
    reverseAwb: '',
    courier: 'Delhivery Surface / BlueDart Reverse'
  });

  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      if (activeTab !== 'All') {
        const tabLower = activeTab.toLowerCase();
        const statusLower = (r.status || '').toLowerCase();
        if (tabLower === 'return requested' && !statusLower.includes('requested') && !statusLower.includes('pending')) return false;
        if (tabLower === 'approved' && !statusLower.includes('approved')) return false;
        if (tabLower === 'rejected' && !statusLower.includes('rejected')) return false;
        if (tabLower === 'refunded' && !statusLower.includes('refunded')) return false;
        if (tabLower === 'pickup scheduled' && !statusLower.includes('pickup')) return false;
        if (tabLower === 'returned' && statusLower !== 'returned') return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          r.id?.toLowerCase().includes(q) ||
          r.orderId?.toLowerCase().includes(q) ||
          r.customer?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.productName?.toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q) ||
          r.reverseAwb?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [returns, activeTab, searchTerm]);

  const handleApprove = async (claim) => {
    setIsProcessing(true);
    try {
      const generatedAwb = claim.reverseAwb && !claim.reverseAwb.startsWith('Pending')
        ? claim.reverseAwb
        : `RET-AWB-${claim.orderId}`;
      await updateReturnStatus(claim.id, 'approve', {
        adminNotes: 'Return claim verified & approved by admin. Reverse pickup authorized.',
        reverseAwb: generatedAwb,
        pickupCourier: claim.pickupCourier || 'Delhivery Surface / BlueDart Reverse'
      });
      setSelectedReturn(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenReject = (claim) => {
    setRejectModal({ open: true, claim });
    setRejectReason('Defect not visible or does not meet replacement criteria.');
  };

  const handleConfirmReject = async () => {
    if (!rejectModal.claim) return;
    setIsProcessing(true);
    try {
      await updateReturnStatus(rejectModal.claim.id, 'reject', {
        adminNotes: rejectReason || 'Claim rejected upon admin review.',
      });
      setRejectModal({ open: false, claim: null });
      setSelectedReturn(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenRefund = (claim) => {
    setRefundModal({
      open: true,
      claim,
      amount: claim.amount || 0,
      reason: REFUND_REASONS[0],
      customReason: '',
      adminNotes: 'Full refund approved by admin after photo verification.',
      reverseAwb: claim.reverseAwb && !claim.reverseAwb.startsWith('Pending') ? claim.reverseAwb : `RET-AWB-${claim.orderId}`,
      courier: claim.pickupCourier || 'Delhivery Surface / BlueDart Reverse'
    });
  };

  const handleConfirmRefund = async () => {
    if (!refundModal.claim) return;
    setIsProcessing(true);
    try {
      const finalReason = refundModal.reason === 'Other' ? (refundModal.customReason || 'Other') : refundModal.reason;
      await updateReturnStatus(refundModal.claim.id, 'refund', {
        refundAmount: Number(refundModal.amount),
        refundReason: finalReason,
        adminNotes: refundModal.adminNotes,
        reverseAwb: refundModal.reverseAwb,
        pickupCourier: refundModal.courier,
      });
      setRefundModal({ open: false, claim: null, amount: 0, reason: '', customReason: '', adminNotes: '', reverseAwb: '', courier: '' });
      setSelectedReturn(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenAwbModal = (claim) => {
    setAwbModal({
      open: true,
      claim,
      reverseAwb: claim.reverseAwb && !claim.reverseAwb.startsWith('Pending') ? claim.reverseAwb : `RET-AWB-${claim.orderId}`,
      courier: claim.pickupCourier || 'Delhivery Surface / BlueDart Reverse'
    });
  };

  const handleSaveAwb = async () => {
    if (!awbModal.claim) return;
    setIsProcessing(true);
    try {
      await updateReturnStatus(awbModal.claim.id, 'update_awb', {
        reverseAwb: awbModal.reverseAwb,
        pickupCourier: awbModal.courier,
        adminNotes: `Reverse AWB updated to ${awbModal.reverseAwb}`
      });
      setAwbModal({ open: false, claim: null, reverseAwb: '', courier: '' });
      if (selectedReturn && selectedReturn.id === awbModal.claim.id) {
        setSelectedReturn(prev => ({
          ...prev,
          reverseAwb: awbModal.reverseAwb,
          pickupCourier: awbModal.courier
        }));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedAwb(true);
    showToast('Reverse AWB copied to clipboard');
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full min-w-0 flex flex-col lg:h-[calc(100vh-7.5rem)] lg:max-h-[calc(100vh-7.5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Returns &amp; Refund Claims</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspect customer damage photos, verify claims, chat directly on WhatsApp, and manage Reverse Return AWBs &amp; refunds.
          </p>
        </div>
        <button
          onClick={async () => {
            if (refreshReturns) {
              showToast('Syncing return claims...');
              await refreshReturns();
            }
          }}
          className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-sync Claims
        </button>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-slate-800 text-xs no-scrollbar shrink-0">
        {RETURN_STAGES.map((tab) => {
          const count = tab === 'All'
            ? returns.length
            : returns.filter((r) => {
                const s = (r.status || '').toLowerCase();
                const t = tab.toLowerCase();
                if (t === 'return requested') return s.includes('requested') || s.includes('pending');
                return s.includes(t);
              }).length;

          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-2 shrink-0 transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{tab}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* SEARCH BAR */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ticket ID, order ID, customer name, phone, return AWB..."
            className="admin-input pl-9 text-xs w-full"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 min-h-0 bg-[#0B0F19] border border-slate-800 rounded-2xl overflow-y-auto relative shadow-inner">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="sticky top-0 z-20 shadow-md">
            <tr className="bg-[#0F172A] text-slate-300 text-xs">
              <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm py-2.5 px-3">Claim / Ticket ID</th>
              <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm py-2.5 px-3">Order ID</th>
              <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm py-2.5 px-3">Customer &amp; WhatsApp</th>
              <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm py-2.5 px-3">Product, Reason &amp; Return AWB</th>
              <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm py-2.5 px-3">Proof Photos</th>
              <th className="table-th sticky top-0 z-20 bg-[#0F172A] text-right border-b border-slate-800 shadow-sm py-2.5 px-3">Refund Due</th>
              <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm py-2.5 px-3">Status</th>
              <th className="table-th sticky top-0 z-20 bg-[#0F172A] text-right border-b border-slate-800 shadow-sm py-2.5 px-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {isPageLoading ? (
              <ReturnsTableSkeleton rows={7} />
            ) : filteredReturns.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-12 text-slate-500 text-sm">
                  No return claims match your current filters.
                </td>
              </tr>
            ) : (
              filteredReturns.map((r) => (
                <tr key={r.id} className="table-tr hover:bg-slate-800/40">
                  <td className="table-td font-mono font-bold text-indigo-400 py-2.5 px-3">
                    {r.ticketId || r.id}
                  </td>
                  <td className="table-td font-mono text-slate-200 py-2.5 px-3">
                    {r.orderId}
                  </td>
                  <td className="table-td py-2.5 px-3">
                    <p className="font-semibold text-slate-100">{r.customer}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-400">{r.phone || r.email}</span>
                      {r.phone && (
                        <a
                          href={`https://wa.me/${cleanPhone(r.phone)}?text=${encodeURIComponent(
                            `Hello ${r.customer}, this is Trio Enterprises support regarding your Return/Refund Ticket ${r.ticketId} for Order #${r.orderId}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded transition-colors"
                          title="Chat with customer on WhatsApp"
                        >
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="table-td max-w-xs py-2.5 px-3">
                    <p className="font-semibold text-slate-200 truncate">{r.productName}</p>
                    <p className="text-[11px] text-amber-400 font-medium truncate">Reason: {r.reason}</p>
                    {r.reverseAwb && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Reverse AWB: <span className="text-indigo-300 font-semibold">{r.reverseAwb}</span>
                      </p>
                    )}
                  </td>
                  <td className="table-td py-2.5 px-3">
                    {r.images && r.images.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        {r.images.slice(0, 3).map((imgUrl, i) => (
                          <img
                            key={i}
                            src={imgUrl}
                            alt="Proof thumb"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxPhoto(imgUrl);
                            }}
                            className="w-7 h-7 rounded-lg object-cover border border-indigo-500/40 cursor-zoom-in hover:scale-110 transition-transform"
                            title="Click to zoom proof photo"
                          />
                        ))}
                        <span className="text-[10px] font-bold text-indigo-400 ml-1">
                          {r.images.length} photo{r.images.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px]">No photos</span>
                    )}
                  </td>
                  <td className="table-td text-right font-mono font-bold text-slate-100 py-2.5 px-3">
                    ₹{r.amount?.toLocaleString('en-IN')}
                  </td>
                  <td className="table-td py-2.5 px-3">
                    <span className={`badge text-[10px] ${
                      r.status === 'Approved' ? 'badge-indigo' :
                      r.status === 'Refunded' ? 'badge-emerald' :
                      r.status === 'Rejected' ? 'badge-rose' : 'badge-amber'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="table-td text-right py-2.5 px-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedReturn(r)}
                        className="btn-secondary py-1 px-2 text-xs flex items-center gap-1"
                        title="Inspect full claim, proof photos & details"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>

                      {r.phone && (
                        <a
                          href={`https://wa.me/${cleanPhone(r.phone)}?text=${encodeURIComponent(
                            `Hello ${r.customer}, regarding your Return / Refund request ${r.ticketId} for Order #${r.orderId}... `
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                          title="Chat with customer on WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {r.rawStatus === 'pending_review' && (
                        <>
                          <button
                            onClick={() => handleApprove(r)}
                            disabled={isProcessing}
                            className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Approve return claim & reverse pickup"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenReject(r)}
                            disabled={isProcessing}
                            className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Reject return claim"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {r.rawStatus !== 'refunded' && (
                        <button
                          onClick={() => handleOpenRefund(r)}
                          disabled={isProcessing}
                          className="p-1 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Process refund with reason"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FULL INSPECTION MODAL WITH ORDER DETAILS & REVERSE AWB */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto no-print">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl p-5 sm:p-6 space-y-4 animate-scaleIn my-auto overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded">
                    {selectedReturn.ticketId || selectedReturn.id}
                  </span>
                  <span className={`badge ${
                    selectedReturn.status === 'Approved' ? 'badge-indigo' :
                    selectedReturn.status === 'Refunded' ? 'badge-emerald' :
                    selectedReturn.status === 'Rejected' ? 'badge-rose' : 'badge-amber'
                  }`}>
                    {selectedReturn.status}
                  </span>
                </div>
                <h3 className="font-bold text-white text-base mt-1">
                  Return Claim for Order {selectedReturn.orderId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {/* Customer Contact & WhatsApp Box */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400">Customer: <strong className="text-slate-100 font-bold">{selectedReturn.customer}</strong></span>
                    <span className="text-slate-400 block text-[11px] mt-0.5">Phone: <strong className="text-slate-200">{selectedReturn.phone || 'N/A'}</strong> • Email: {selectedReturn.email || 'N/A'}</span>
                  </div>

                  {selectedReturn.phone && (
                    <a
                      href={`https://wa.me/${cleanPhone(selectedReturn.phone)}?text=${encodeURIComponent(
                        `Hello ${selectedReturn.customer}, this is Trio Enterprises support regarding your Return / Refund Ticket ${selectedReturn.ticketId} for Order #${selectedReturn.orderId}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-colors shrink-0 self-start sm:self-auto"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat on WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Reverse Return Logistics & AWB Card */}
              <div className="p-3.5 bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-300 font-bold flex items-center gap-1.5 uppercase text-[11px]">
                    <Truck className="w-3.5 h-3.5" /> Reverse Pickup &amp; Return AWB
                  </span>
                  <button
                    onClick={() => handleOpenAwbModal(selectedReturn)}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20"
                  >
                    <Edit3 className="w-3 h-3" /> Assign / Edit AWB
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Reverse Pickup AWB</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-bold text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded border border-indigo-700/50">
                        {selectedReturn.reverseAwb || `RET-AWB-${selectedReturn.orderId}`}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedReturn.reverseAwb || `RET-AWB-${selectedReturn.orderId}`)}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                        title="Copy Return AWB"
                      >
                        {copiedAwb ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Reverse Courier Partner</span>
                    <span className="text-slate-200 font-semibold mt-0.5 block">
                      {selectedReturn.pickupCourier || 'Delhivery Surface / BlueDart Reverse'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Claim Reason & Details Box */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <p className="text-slate-400">
                  Customer Claim Reason: <strong className="text-amber-400">{selectedReturn.reason}</strong>
                </p>
                <p className="text-slate-300 italic pt-1 border-t border-slate-800/80">
                  "{selectedReturn.reasonDetails}"
                </p>

                {selectedReturn.refundReason && (
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/50 text-[11px] text-emerald-300 mt-2">
                    <strong>Reason for Refund / Acceptance:</strong> {selectedReturn.refundReason}
                  </div>
                )}

                {selectedReturn.adminNotes && (
                  <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-900/50 text-[11px] text-indigo-300 mt-1">
                    <strong>Admin Remarks:</strong> {selectedReturn.adminNotes}
                  </div>
                )}
              </div>

              {/* Order Items List */}
              {selectedReturn.items && selectedReturn.items.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" /> Order Items Being Returned ({selectedReturn.items.length})
                  </h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedReturn.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={it.image || '/products/pearl-zardosi-patch-1.jpg'}
                            alt={it.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-200 truncate">{it.name || it.product_name || 'Artisan Craft'}</p>
                            <p className="text-[10px] text-slate-400">Qty: {it.quantity} {it.color ? `• Shade: ${it.color}` : ''}</p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-200 shrink-0 ml-2">
                          ₹{(it.price * it.quantity)?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Proof Photos Gallery */}
              {selectedReturn.images && selectedReturn.images.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-indigo-400" />
                      Customer Proof Photos ({selectedReturn.images.length} / 3)
                    </h4>
                    <span className="text-[10px] text-indigo-400">Click photo to zoom</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {selectedReturn.images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setLightboxPhoto(imgUrl)}
                        className="aspect-square rounded-xl overflow-hidden border border-indigo-900/60 relative cursor-pointer group bg-slate-950 hover:border-indigo-500 transition-all shadow-md"
                      >
                        <img
                          src={imgUrl}
                          alt={`Damage proof ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Eye className="w-5 h-5 text-indigo-300" />
                        </div>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[9px] font-bold bg-black/80 text-white rounded">
                          Photo {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
                  No proof photos uploaded for this claim.
                </div>
              )}

              {/* Reverse Logistics Timeline */}
              <div className="space-y-2 pt-1 border-t border-slate-800 text-xs">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                  Reverse Logistics Timeline
                </h4>
                <div className="space-y-2">
                  {(selectedReturn.timeline || []).map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                        step.done ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {step.done ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1 flex justify-between">
                        <span className={`${step.done ? 'text-slate-200 font-medium' : 'text-slate-500'}`}>
                          {step.step}
                        </span>
                        <span className="text-[10px] text-slate-500">{step.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Admin Action Bar in Modal */}
            <div className="border-t border-slate-800 pt-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <span className="text-xs font-bold text-emerald-400">
                Refund Due: ₹{selectedReturn.amount?.toLocaleString('en-IN')}
              </span>

              <div className="flex items-center gap-2">
                {selectedReturn.rawStatus === 'pending_review' && (
                  <>
                    <button
                      onClick={() => handleOpenReject(selectedReturn)}
                      disabled={isProcessing}
                      className="btn-secondary py-1.5 px-3 text-xs text-rose-400 hover:text-rose-300"
                    >
                      Reject Claim
                    </button>
                    <button
                      onClick={() => handleApprove(selectedReturn)}
                      disabled={isProcessing}
                      className="btn-primary py-1.5 px-3 text-xs bg-indigo-600 hover:bg-indigo-500"
                    >
                      Approve &amp; Pickup
                    </button>
                  </>
                )}

                {selectedReturn.rawStatus !== 'refunded' && (
                  <button
                    onClick={() => handleOpenRefund(selectedReturn)}
                    disabled={isProcessing}
                    className="btn-primary py-1.5 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 border-emerald-500 flex items-center gap-1.5"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Process Refund
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* REFUND REASON & DETAILS MODAL */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {refundModal.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <h3 className="font-bold text-white text-sm">Issue Refund for Order {refundModal.claim?.orderId}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Customer: {refundModal.claim?.customer}</p>
              </div>
              <button
                onClick={() => setRefundModal({ open: false, claim: null, amount: 0, reason: '', customReason: '', adminNotes: '', reverseAwb: '', courier: '' })}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Refund Reason Selection */}
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  1. Reason for Refund <span className="text-rose-500">*</span>
                </label>
                <select
                  value={refundModal.reason}
                  onChange={(e) => setRefundModal(prev => ({ ...prev, reason: e.target.value }))}
                  className="admin-select w-full p-2 text-xs"
                >
                  {REFUND_REASONS.map((rsn) => (
                    <option key={rsn} value={rsn}>{rsn}</option>
                  ))}
                </select>
                {refundModal.reason === 'Other' && (
                  <input
                    type="text"
                    value={refundModal.customReason}
                    onChange={(e) => setRefundModal(prev => ({ ...prev, customReason: e.target.value }))}
                    placeholder="Enter custom refund reason..."
                    className="admin-input w-full p-2 text-xs mt-1"
                  />
                )}
              </div>

              {/* Refund Amount */}
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  2. Refund Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={refundModal.amount}
                  onChange={(e) => setRefundModal(prev => ({ ...prev, amount: e.target.value }))}
                  className="admin-input w-full p-2 text-xs font-mono font-bold"
                />
              </div>

              {/* Reverse Return AWB */}
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  3. Reverse Return AWB Number (Displayed to Customer)
                </label>
                <input
                  type="text"
                  value={refundModal.reverseAwb}
                  onChange={(e) => setRefundModal(prev => ({ ...prev, reverseAwb: e.target.value }))}
                  placeholder="E.g. RET-AWB-9004052 or courier AWB..."
                  className="admin-input w-full p-2 text-xs font-mono"
                />
              </div>

              {/* Admin Remarks to Customer */}
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  4. Admin Remarks (Visible on Customer Order Portal)
                </label>
                <textarea
                  rows={2}
                  value={refundModal.adminNotes}
                  onChange={(e) => setRefundModal(prev => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder="Notes sent to customer..."
                  className="admin-input w-full p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setRefundModal({ open: false, claim: null, amount: 0, reason: '', customReason: '', adminNotes: '', reverseAwb: '', courier: '' })}
                disabled={isProcessing}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRefund}
                disabled={isProcessing}
                className="btn-primary py-1.5 px-4 text-xs bg-emerald-600 hover:bg-emerald-500 border-emerald-500 flex items-center gap-1.5 font-bold"
              >
                <DollarSign className="w-3.5 h-3.5" />
                {isProcessing ? 'Processing...' : 'Confirm & Issue Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* REVERSE AWB ASSIGN / EDIT MODAL */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {awbModal.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-bold text-white text-sm">Assign Reverse Return AWB</h3>
              <button
                onClick={() => setAwbModal({ open: false, claim: null, reverseAwb: '', courier: '' })}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Reverse Pickup AWB Number</label>
                <input
                  type="text"
                  value={awbModal.reverseAwb}
                  onChange={(e) => setAwbModal(prev => ({ ...prev, reverseAwb: e.target.value }))}
                  placeholder="E.g. RET-BLUEDART-123456"
                  className="admin-input w-full p-2 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Reverse Courier Partner</label>
                <input
                  type="text"
                  value={awbModal.courier}
                  onChange={(e) => setAwbModal(prev => ({ ...prev, courier: e.target.value }))}
                  placeholder="E.g. Delhivery Surface / BlueDart Reverse"
                  className="admin-input w-full p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setAwbModal({ open: false, claim: null, reverseAwb: '', courier: '' })}
                disabled={isProcessing}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAwb}
                disabled={isProcessing}
                className="btn-primary py-1.5 px-3 text-xs bg-indigo-600 hover:bg-indigo-500"
              >
                {isProcessing ? 'Saving...' : 'Save Return AWB'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* REJECT MODAL */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-bold text-white text-sm">Reject Return Claim</h3>
              <button
                onClick={() => setRejectModal({ open: false, claim: null })}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Please enter the reason for rejection. This will be shown to the customer on their order portal:
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="E.g. Damage not visible in uploaded photos, product used/washed, or policy expired..."
              className="admin-input text-xs w-full p-2.5"
            />

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setRejectModal({ open: false, claim: null })}
                disabled={isProcessing}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isProcessing}
                className="btn-primary py-1.5 px-3 text-xs bg-rose-600 hover:bg-rose-700 border-rose-600"
              >
                {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PHOTO LIGHTBOX ZOOM MODAL */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-indigo-500/40 shadow-2xl">
            <img
              src={lightboxPhoto}
              alt="High resolution defect proof"
              className="max-w-full max-h-[85vh] object-contain"
            />
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
