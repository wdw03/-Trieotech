'use client';
import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../../context/AdminContext.jsx';
import { usePageLoading } from '../../../hooks/usePageLoading.js';
import { CouponsGridSkeleton, Skeleton } from '../ui/Skeleton.jsx';
import {
  TicketPercent,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart2,
  Save,
  X,
  Search,
  Check,
  AlertCircle,
  Calendar,
  Tag,
  Copy,
  Package,
  Layers,
  AlertTriangle,
  Edit3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const Coupons = () => {
  const { coupons, addCoupon, updateCoupon, toggleCouponStatus, deleteCoupon, products, showToast } = useAdmin();
  const isPageLoading = usePageLoading(450);

  const [editingCoupon, setEditingCoupon] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Helper to format preset datetime
  const getPresetDate = (daysFromNow) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(23, 59, 0, 0);
    // Format to YYYY-MM-DDTHH:mm
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getEndOfMonth = () => {
    const d = new Date();
    // last day of current month
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T23:59`;
  };

  const handleOpenNewCoupon = () => {
    setEditingCoupon({
      code: 'OFFER' + Math.floor(10 + Math.random() * 90),
      type: 'Percentage',
      value: 15,
      minOrderValue: 499,
      maxDiscount: 500,
      productScope: 'all', // 'all' | 'specific'
      applicableProductIds: [],
      applicableProductNames: [],
      description: 'Special discount on exquisite handcrafted collection',
      expiresAt: getPresetDate(30),
      maxUses: 500
    });
    setProductSearch('');
  };

  const handleEditCoupon = (c) => {
    let formattedExpires = '';
    if (c.expiresAt) {
      const d = new Date(c.expiresAt);
      if (!isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2, '0');
        formattedExpires = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    }

    setEditingCoupon({
      id: c.id,
      code: c.code,
      type: c.type || (c.discountType === 'percentage' ? 'Percentage' : 'Flat'),
      value: c.value,
      minOrderValue: c.minOrderValue ?? c.minSpend ?? 0,
      maxDiscount: c.maxDiscount || '',
      productScope: (c.applicableProductIds && c.applicableProductIds.length > 0) ? 'specific' : 'all',
      applicableProductIds: c.applicableProductIds || [],
      applicableProductNames: c.applicableProductNames || [],
      description: c.description || '',
      expiresAt: formattedExpires,
      maxUses: c.maxUses || 500
    });
    setProductSearch('');
  };

  // Filter products for the multi-select picker
  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter((p) =>
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const toggleProductSelection = (product) => {
    if (!editingCoupon) return;
    const pid = String(product.id);
    const currentIds = editingCoupon.applicableProductIds.map(String);
    const currentNames = editingCoupon.applicableProductNames || [];

    if (currentIds.includes(pid)) {
      // Remove
      setEditingCoupon({
        ...editingCoupon,
        applicableProductIds: currentIds.filter((id) => id !== pid),
        applicableProductNames: currentNames.filter((name) => name !== product.name)
      });
    } else {
      // Add
      setEditingCoupon({
        ...editingCoupon,
        applicableProductIds: [...currentIds, pid],
        applicableProductNames: [...currentNames, product.name]
      });
    }
  };

  const selectAllFilteredProducts = () => {
    if (!editingCoupon) return;
    const currentIds = new Set(editingCoupon.applicableProductIds.map(String));
    const currentNames = new Set(editingCoupon.applicableProductNames || []);

    filteredProducts.forEach((p) => {
      currentIds.add(String(p.id));
      currentNames.add(p.name);
    });

    setEditingCoupon({
      ...editingCoupon,
      applicableProductIds: Array.from(currentIds),
      applicableProductNames: Array.from(currentNames)
    });
  };

  const clearProductSelection = () => {
    if (!editingCoupon) return;
    setEditingCoupon({
      ...editingCoupon,
      applicableProductIds: [],
      applicableProductNames: []
    });
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!editingCoupon.code.trim()) {
      showToast('Coupon code is required', 'error');
      return;
    }

    if (editingCoupon.productScope === 'specific' && editingCoupon.applicableProductIds.length === 0) {
      showToast('Please select at least 1 product for specific product coupon', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...editingCoupon,
        applicableProductIds: editingCoupon.productScope === 'specific' ? editingCoupon.applicableProductIds : [],
        applicableProductNames: editingCoupon.productScope === 'specific' ? editingCoupon.applicableProductNames : []
      };

      const res = editingCoupon.id
        ? await updateCoupon(editingCoupon.id, payload)
        : await addCoupon(payload);

      if (res?.success) {
        setEditingCoupon(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!couponToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCoupon(couponToDelete.id);
      setCouponToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    showToast(`Code "${code}" copied to clipboard!`, 'info');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Usage analytics chart data
  const couponChartData = coupons.map((c) => ({
    name: c.code,
    uses: c.usedCount || 0,
    scope: c.applicableProductIds?.length > 0 ? `${c.applicableProductIds.length} Products` : 'All Store'
  }));

  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full min-w-0 flex flex-col lg:h-[calc(100vh-7.5rem)] lg:max-h-[calc(100vh-7.5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <TicketPercent className="w-6 h-6 text-indigo-400" /> Coupons & Festival Discounts
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create promotional coupon codes with product-specific targeting, expiry date/time limits, and track redemption analytics.
          </p>
        </div>

        <button onClick={handleOpenNewCoupon} className="btn-primary py-2.5 px-4 text-xs font-bold shrink-0 shadow-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Discount Coupon
        </button>
      </div>

      {/* USAGE ANALYTICS CHART */}
      {isPageLoading ? (
        <div className="admin-card p-4 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="h-40 w-full bg-slate-900/60 rounded-xl border border-slate-800/60 p-4 flex items-end justify-between gap-3">
            {[45, 60, 35, 80, 65, 90, 50, 75].map((h, i) => (
              <Skeleton key={i} className="flex-1 rounded-t-lg opacity-60" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      ) : (
        <div className="admin-card p-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-white text-sm">Coupon Redemption Analytics</h3>
              <p className="text-xs text-slate-400">Total times each promotional code has been redeemed in store checkout</p>
            </div>
            <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
              <BarChart2 className="w-4 h-4" /> Real-time tracking
            </span>
          </div>

          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={couponChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(v, name, item) => [`${v} redemptions (${item.payload.scope})`, 'Usage']}
                />
                <Bar dataKey="uses" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* COUPONS CARDS GRID */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {isPageLoading ? (
          <CouponsGridSkeleton count={6} />
        ) : coupons.length === 0 ? (
          <div className="admin-card p-12 text-center space-y-3">
            <TicketPercent className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-white font-bold text-base">No Coupons Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create your first promotional discount coupon with specific product eligibility and expiry date.
            </p>
            <button onClick={handleOpenNewCoupon} className="btn-primary py-2 px-4 text-xs font-bold mx-auto">
              <Plus className="w-4 h-4" /> Create First Coupon
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {coupons.map((c) => {
              const now = new Date();
              const isExpired = c.expiresAt ? new Date(c.expiresAt) < now : false;
              const hasSpecificProducts = c.applicableProductIds && c.applicableProductIds.length > 0;

              return (
                <div
                  key={c.id}
                  className={`admin-card p-5 flex flex-col justify-between group admin-card-hover border transition-all ${
                    isExpired ? 'border-rose-900/50 bg-rose-950/10' : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Header with Code & Status */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl border ${
                          isExpired
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        }`}>
                          <TicketPercent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black font-mono text-base text-white tracking-wider">
                              {c.code}
                            </span>
                            <button
                              onClick={() => handleCopyCode(c.code)}
                              className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
                              title="Copy code"
                            >
                              {copiedCode === c.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {c.type === 'Percentage' ? `${c.value}% Discount` : `₹${c.value} Flat Off`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isExpired ? (
                          <span className="badge badge-rose text-[10px] font-bold">
                            EXPIRED
                          </span>
                        ) : (
                          <span className={`badge ${c.status === 'Active' ? 'badge-emerald' : 'badge-slate'} text-[10px] font-bold`}>
                            {c.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Benefit & Min Spend Row */}
                    <div className="my-3 p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Benefit</span>
                        <span className="text-lg font-black text-white">
                          {c.type === 'Percentage' ? `${c.value}% OFF` : `₹${c.value} FLAT`}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Min Order</span>
                        <span className="text-xs font-bold text-slate-300">
                          {c.minOrderValue ? `₹${c.minOrderValue}` : 'No Min'}
                        </span>
                      </div>
                    </div>

                    {/* Target Product Scope Badge */}
                    <div className="mb-3 p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-0.5">
                        <Package className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Product Scope:</span>
                        <span className={`text-[11px] px-1.5 py-0.2 rounded font-bold ${
                          hasSpecificProducts
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        }`}>
                          {hasSpecificProducts ? `${c.applicableProductIds.length} Specific Products` : 'All Store Products'}
                        </span>
                      </div>

                      {hasSpecificProducts && c.applicableProductNames && c.applicableProductNames.length > 0 && (
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 pl-5">
                          {c.applicableProductNames.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    {c.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {c.description}
                      </p>
                    )}

                    {/* Expiry Timestamp Display */}
                    <div className="mb-3 text-[11px] flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        {c.expiresAt ? (
                          <>
                            Expires:{' '}
                            <strong className={isExpired ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                              {new Date(c.expiresAt).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </strong>
                          </>
                        ) : (
                          <span className="text-slate-500">No Expiry Date (Lifetime)</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Meta & Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      Redeemed: <strong className="text-slate-200">{c.usedCount || 0}</strong> / {c.maxUses || 500}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditCoupon(c)}
                        className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 rounded-lg transition-colors"
                        title="Edit coupon"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleCouponStatus(c.id)}
                        className={`text-[11px] font-semibold transition-colors px-1.5 py-0.5 rounded ${
                          c.status === 'Active'
                            ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/30'
                            : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30'
                        }`}
                      >
                        {c.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        onClick={() => setCouponToDelete(c)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Delete coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT COUPON MODAL */}
      {editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto no-print">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl p-6 space-y-4 animate-scaleIn flex flex-col my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <TicketPercent className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">
                  {editingCoupon.id ? `Edit Coupon: ${editingCoupon.code}` : 'Create Discount Coupon'}
                </h3>
              </div>
              <button
                onClick={() => setEditingCoupon(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* Code and Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    value={editingCoupon.code}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. FESTIVE30"
                    className="admin-input w-full text-xs font-mono font-bold tracking-wider"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Discount Type</label>
                  <select
                    value={editingCoupon.type}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, type: e.target.value })}
                    className="admin-select w-full text-xs"
                  >
                    <option value="Percentage">Percentage (%) Discount</option>
                    <option value="Flat">Flat Cash Off (₹)</option>
                  </select>
                </div>
              </div>

              {/* Value, Min Order, Max Cap */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    {editingCoupon.type === 'Percentage' ? 'Discount Value (%) *' : 'Discount Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={editingCoupon.type === 'Percentage' ? '100' : '50000'}
                    value={editingCoupon.value}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, value: Number(e.target.value) })}
                    className="admin-input w-full text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingCoupon.minOrderValue}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, minOrderValue: Number(e.target.value) })}
                    className="admin-input w-full text-xs"
                    placeholder="0 = No Min"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingCoupon.maxDiscount || ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, maxDiscount: e.target.value ? Number(e.target.value) : null })}
                    className="admin-input w-full text-xs"
                    placeholder="No Limit"
                  />
                </div>
              </div>

              {/* PRODUCT SCOPE SELECTION (USER REQUIREMENT) */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div>
                  <label className="font-bold text-white text-xs block mb-1 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-indigo-400" />
                    Product Eligibility (Target Products) *
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Choose whether this coupon applies to all store items or strictly to selected product(s).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      editingCoupon.productScope === 'all'
                        ? 'bg-indigo-600/10 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="productScope"
                      checked={editingCoupon.productScope === 'all'}
                      onChange={() => setEditingCoupon({ ...editingCoupon, productScope: 'all' })}
                      className="accent-indigo-500"
                    />
                    <div>
                      <span className="font-bold text-xs block">All Store Products</span>
                      <span className="text-[10px] text-slate-400">Applies to any product added to cart</span>
                    </div>
                  </label>

                  <label
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      editingCoupon.productScope === 'specific'
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="productScope"
                      checked={editingCoupon.productScope === 'specific'}
                      onChange={() => setEditingCoupon({ ...editingCoupon, productScope: 'specific' })}
                      className="accent-amber-500"
                    />
                    <div>
                      <span className="font-bold text-xs block">Specific Products Only</span>
                      <span className="text-[10px] text-slate-400">Applies ONLY to products you select</span>
                    </div>
                  </label>
                </div>

                {/* If Specific Products: Search & Multi-select Product Picker */}
                {editingCoupon.productScope === 'specific' && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80 animate-fadeIn">
                    <div className="flex items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search product by title or category..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="admin-input w-full pl-8 py-1.5 text-xs bg-slate-900"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                        <button
                          type="button"
                          onClick={selectAllFilteredProducts}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={clearProductSelection}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 font-semibold"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-amber-400 font-medium px-1">
                      <span>
                        Selected: <strong>{editingCoupon.applicableProductIds.length}</strong> product(s)
                      </span>
                      {editingCoupon.applicableProductIds.length === 0 && (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Select at least 1 product
                        </span>
                      )}
                    </div>

                    {/* Product List Scrollable */}
                    <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                      {filteredProducts.length === 0 ? (
                        <p className="text-center text-slate-500 py-4 text-xs">No products match your search.</p>
                      ) : (
                        filteredProducts.map((p) => {
                          const isSelected = editingCoupon.applicableProductIds.map(String).includes(String(p.id));
                          const pImg = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (typeof p.images === 'string' ? p.images : p.image);

                          return (
                            <div
                              key={p.id}
                              onClick={() => toggleProductSelection(p)}
                              className={`p-2 rounded-lg flex items-center justify-between gap-2.5 cursor-pointer transition-colors border ${
                                isSelected
                                  ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                                  : 'bg-slate-950/40 border-slate-800/60 text-slate-300 hover:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // handled by parent onClick
                                  className="accent-indigo-500 rounded shrink-0"
                                />
                                {pImg && (
                                  <img
                                    src={pImg}
                                    alt={p.name}
                                    className="w-8 h-8 rounded-md object-cover bg-slate-800 shrink-0 border border-slate-700/50"
                                  />
                                )}
                                <div className="min-w-0">
                                  <span className="font-semibold text-xs truncate block">{p.name}</span>
                                  <span className="text-[10px] text-slate-400">{p.category} • ₹{p.price}</span>
                                </div>
                              </div>

                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {isSelected ? 'Selected' : 'Pick'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* EXPIRY DATE & TIME SETTER (USER REQUIREMENT) */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div>
                  <label className="font-bold text-white text-xs block mb-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    Coupon Expiry Date & Exact Time *
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Set the exact date and time when this coupon automatically expires and becomes invalid.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <input
                      type="datetime-local"
                      value={editingCoupon.expiresAt || ''}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, expiresAt: e.target.value })}
                      className="admin-input w-full text-xs font-mono text-white bg-slate-900"
                    />
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingCoupon({ ...editingCoupon, expiresAt: getPresetDate(7) })}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                    >
                      +7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCoupon({ ...editingCoupon, expiresAt: getPresetDate(15) })}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                    >
                      +15 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCoupon({ ...editingCoupon, expiresAt: getPresetDate(30) })}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                    >
                      +30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCoupon({ ...editingCoupon, expiresAt: getEndOfMonth() })}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px] font-semibold"
                    >
                      End of Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCoupon({ ...editingCoupon, expiresAt: null })}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px]"
                    >
                      No Expiry
                    </button>
                  </div>
                </div>

                {editingCoupon.expiresAt && (
                  <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Coupon will expire on:{' '}
                    <strong>
                      {new Date(editingCoupon.expiresAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </strong>
                  </p>
                )}
              </div>

              {/* Description & Max Uses */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-300 block mb-1">Customer Offer Description</label>
                  <input
                    type="text"
                    value={editingCoupon.description}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, description: e.target.value })}
                    placeholder="e.g. 20% off on all Beaded Lotus Appliques"
                    className="admin-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    min="1"
                    value={editingCoupon.maxUses}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, maxUses: Number(e.target.value) })}
                    className="admin-input w-full text-xs"
                    placeholder="500"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="border-t border-slate-800 pt-4 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  className="btn-secondary py-2 px-4 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving Coupon...' : editingCoupon.id ? 'Save Changes' : 'Publish Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {couponToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm no-print">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-scaleIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-white text-base">Delete Coupon Code?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to permanently delete coupon{' '}
                <strong className="text-white font-mono">{couponToDelete.code}</strong>?
                This action cannot be undone and customers will no longer be able to use it.
              </p>
            </div>

            <div className="border-t border-slate-800 pt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCouponToDelete(null)}
                className="btn-secondary py-2 px-4 text-xs font-semibold flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex-1 flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Delete Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
