'use client';
import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../../context/AdminContext.jsx';
import { ProductImage } from '../ui/ProductImage.jsx';
import { usePageLoading } from '../../../hooks/usePageLoading.js';
import { MetricCardSkeleton, InventoryTableSkeleton, Skeleton } from '../ui/Skeleton.jsx';
import {
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Minus,
  Clock,
  ArrowUpDown,
  History,
  Edit3,
  Layers,
  ChevronDown,
  ChevronUp,
  Save,
  X
} from 'lucide-react';

export const Inventory = () => {
  const { inventory, stockLogs, adjustStock, showToast } = useAdmin();
  const isPageLoading = usePageLoading(450);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [adjustingItem, setAdjustingItem] = useState(null); // modal state for single adjustment
  const [adjustmentQty, setAdjustmentQty] = useState(10);
  const [adjustmentReason, setAdjustmentReason] = useState('New Artisan Batch Received');
  const [expandedVariants, setExpandedVariants] = useState([]); // array of productIds

  // Computed summary metrics
  const totals = useMemo(() => {
    let total = 0;
    let available = 0;
    let reserved = 0;
    let lowCount = 0;
    let outCount = 0;

    inventory.forEach((item) => {
      total += item.totalStock || 0;
      available += item.availableStock || 0;
      reserved += item.reservedStock || 0;
      if (item.status === 'Low Stock') lowCount++;
      if (item.status === 'Out of Stock') outCount++;
    });

    return { total, available, reserved, lowCount, outCount };
  }, [inventory]);

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inventory, statusFilter, searchTerm]);

  const toggleVariantExpand = (id) => {
    setExpandedVariants((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleApplyAdjustment = (e) => {
    e.preventDefault();
    if (!adjustingItem) return;
    adjustStock(adjustingItem.productId, adjustmentQty, adjustmentReason);
    setAdjustingItem(null);
  };

  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full min-w-0 flex flex-col lg:h-[calc(100vh-7.5rem)] lg:max-h-[calc(100vh-7.5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Inventory Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            SKU tracking, variant color stocks, low-stock thresholds and audit history logs.
          </p>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 shrink-0">
        {isPageLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))
        ) : (
          <>
            <div className="admin-card p-4">
              <span className="text-xs font-medium text-slate-400">Total Stock</span>
              <p className="text-xl font-extrabold text-white mt-1.5">{totals.total.toLocaleString()} units</p>
              <span className="text-[11px] text-slate-500 block mt-0.5">Across 43 catalog SKUs</span>
            </div>

            <div className="admin-card p-4">
              <span className="text-xs font-medium text-slate-400">Available Stock</span>
              <p className="text-xl font-extrabold text-emerald-400 mt-1.5">{totals.available.toLocaleString()} units</p>
              <span className="text-[11px] text-emerald-500/80 block mt-0.5">Ready for instant packing</span>
            </div>

            <div className="admin-card p-4">
              <span className="text-xs font-medium text-slate-400">Reserved in Orders</span>
              <p className="text-xl font-extrabold text-amber-400 mt-1.5">{totals.reserved.toLocaleString()} units</p>
              <span className="text-[11px] text-amber-500/80 block mt-0.5">Committed to pipeline</span>
            </div>

            <div className="admin-card p-4 border-rose-500/20">
              <span className="text-xs font-medium text-slate-400">Low Stock Alert</span>
              <p className="text-xl font-extrabold text-rose-400 mt-1.5">{totals.lowCount} items</p>
              <span className="text-[11px] text-rose-400/80 block mt-0.5">Below 15 units threshold</span>
            </div>

            <div className="admin-card p-4 col-span-2 sm:col-span-1">
              <span className="text-xs font-medium text-slate-400">Out of Stock</span>
              <p className="text-xl font-extrabold text-slate-400 mt-1.5">{totals.outCount} items</p>
              <span className="text-[11px] text-slate-500 block mt-0.5">Zero availability</span>
            </div>
          </>
        )}
      </div>

      {/* FILTER & SEARCH */}
      <div className="admin-card p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search SKU code, Product, Category..."
            className="admin-input pl-9 py-1.5 text-xs w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-select py-1.5 text-xs"
          >
            <option value="All">All Stock Levels</option>
            <option value="In Stock">In Stock (Good)</option>
            <option value="Low Stock">Low Stock Alert</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* INVENTORY TABLE WITH EXPANDABLE VARIANTS */}
      <div className="admin-card overflow-hidden w-full max-w-full min-w-0 border border-slate-800/80 rounded-2xl shadow-xl flex flex-col flex-1 min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-[280px] max-h-[58vh] lg:max-h-none w-full max-w-full min-w-0 touch-pan-x overscroll-contain relative border-b border-slate-800/60">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 shadow-md">
              <tr className="bg-[#0F172A] text-slate-300">
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Product & SKU</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Category</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] text-center border-b border-slate-800 shadow-sm">Available</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] text-center border-b border-slate-800 shadow-sm">Reserved</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] text-center border-b border-slate-800 shadow-sm">Total</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Threshold</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Status</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Last Restocked</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] text-right border-b border-slate-800 shadow-sm">Quick Adjust</th>
              </tr>
            </thead>
            <tbody>
              {isPageLoading ? (
                <InventoryTableSkeleton rows={7} />
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500 text-sm">
                    No inventory items match your search or filter.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                const isExpanded = expandedVariants.includes(item.productId);
                const hasVariants = item.variants && item.variants.length > 0;

                return (
                  <React.Fragment key={item.productId}>
                    <tr className="table-tr">
                      {/* Product Name, SKU, Thumbnail */}
                      <td className="table-td max-w-sm">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={item.image}
                            category={item.category}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl"
                          />
                          <div className="truncate">
                            <p className="font-bold text-slate-100 text-xs truncate">{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[11px] font-bold text-indigo-400">{item.sku}</span>
                              {hasVariants && (
                                <button
                                  onClick={() => toggleVariantExpand(item.productId)}
                                  className="text-[10px] text-slate-400 hover:text-indigo-400 flex items-center gap-0.5 font-medium"
                                >
                                  {item.variants.length} colors {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="table-td">
                        <span className="text-xs text-slate-300">{item.category}</span>
                      </td>

                      {/* Available */}
                      <td className="table-td text-center">
                        <span className={`font-black text-sm ${item.availableStock <= 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {item.availableStock}
                        </span>
                      </td>

                      {/* Reserved */}
                      <td className="table-td text-center font-bold text-amber-400 text-xs">
                        {item.reservedStock}
                      </td>

                      {/* Total */}
                      <td className="table-td text-center font-bold text-slate-200 text-xs">
                        {item.totalStock}
                      </td>

                      {/* Threshold */}
                      <td className="table-td text-xs text-slate-400 font-mono">
                        ≤ {item.lowStockThreshold}
                      </td>

                      {/* Status & Quick Out/In Stock Toggle */}
                      <td className="table-td">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.status === 'Out of Stock' || item.availableStock <= 0) {
                              adjustStock(item.productId, 25, 'Quick Restock via Inventory Status Badge');
                            } else {
                              adjustStock(item.productId, -item.availableStock, 'Marked Out of Stock via Inventory Status Badge');
                            }
                          }}
                          className={`
                            badge cursor-pointer transition-all hover:scale-105 inline-flex items-center gap-1
                            ${item.status === 'In Stock' ? 'badge-emerald hover:bg-emerald-500/25' : ''}
                            ${item.status === 'Low Stock' ? 'badge-rose hover:bg-rose-500/25' : ''}
                            ${item.status === 'Out of Stock' ? 'badge-slate hover:bg-slate-700' : ''}
                          `}
                          title={item.status === 'Out of Stock' || item.availableStock <= 0 ? "Click to Restock (+25 units)" : "Click to mark as Out of Stock (0 units)"}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'In Stock' ? 'bg-emerald-400' : (item.status === 'Low Stock' ? 'bg-amber-400' : 'bg-rose-400')}`} />
                          <span>{item.status}</span>
                        </button>
                      </td>

                      {/* Last Restocked */}
                      <td className="table-td text-xs text-slate-400 font-mono">
                        {item.lastRestocked}
                      </td>

                      {/* Actions & Quick Restock */}
                      <td className="table-td text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => adjustStock(item.productId, 10, 'Quick +10 Restock')}
                            className="px-1.5 py-1 text-[10px] font-bold bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700/60 rounded cursor-pointer transition-colors"
                            title="Quick add +10 units"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustStock(item.productId, 25, 'Quick +25 Restock')}
                            className="px-1.5 py-1 text-[10px] font-bold bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700/60 rounded cursor-pointer transition-colors"
                            title="Quick add +25 units"
                          >
                            +25
                          </button>
                          <button
                            onClick={() => {
                              setAdjustingItem(item);
                              setAdjustmentQty(25);
                            }}
                            className="btn-secondary py-1 px-2.5 text-xs font-medium cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Adjust
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Sub-Row: Variant breakdown */}
                    {isExpanded && hasVariants && (
                      <tr className="bg-slate-950/60 border-b border-slate-800">
                        <td colSpan="9" className="p-4 pl-16">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Color Variant Inventory Breakdown:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {item.variants.map((v, idx) => (
                              <div key={idx} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-sm" style={{ backgroundColor: v.colorHex || '#D4AF37' }} />
                                  <span className="font-semibold text-slate-200">{v.colorName}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-emerald-400">{v.available} Avail</span>
                                  <span className="text-[10px] text-slate-500 block">({v.reserved} res)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* STOCK ADJUSTMENT AUDIT HISTORY LOG */}
      <div className="admin-card p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Recent Stock Adjustment Logs</h3>
          </div>
          <span className="text-xs text-slate-500">Auto-recorded on every manual or order adjustment</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3 text-center">Change</th>
                <th className="py-2.5 px-3 text-center">New Total</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3">Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isPageLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="hover:bg-slate-800/20">
                    <td className="py-2.5 px-3"><Skeleton className="h-3 w-20" /></td>
                    <td className="py-2.5 px-3"><Skeleton className="h-3 w-16" /></td>
                    <td className="py-2.5 px-3"><Skeleton className="h-3 w-36" /></td>
                    <td className="py-2.5 px-3 text-center"><Skeleton className="h-3 w-10 mx-auto" /></td>
                    <td className="py-2.5 px-3 text-center"><Skeleton className="h-3 w-10 mx-auto" /></td>
                    <td className="py-2.5 px-3"><Skeleton className="h-3 w-28" /></td>
                    <td className="py-2.5 px-3"><Skeleton className="h-3 w-16" /></td>
                  </tr>
                ))
              ) : (
                stockLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/20">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{log.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-400">{log.sku}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-200">{log.productName}</td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      <span className={log.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}>
                        {log.change}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-200">{log.newStock}</td>
                    <td className="py-2.5 px-3 text-slate-400">{log.reason}</td>
                    <td className="py-2.5 px-3 text-slate-500">{log.admin}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STOCK ADJUSTMENT MODAL */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto no-print">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Adjust Stock Level</h3>
                <p className="text-xs text-indigo-400 font-mono">{adjustingItem.sku}</p>
              </div>
              <button onClick={() => setAdjustingItem(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Product</label>
                <p className="font-bold text-slate-200 text-sm">{adjustingItem.name}</p>
                <p className="text-slate-500 mt-0.5">Current Available: <strong className="text-white">{adjustingItem.availableStock}</strong> units</p>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Adjustment Quantity (+ to Add, - to Deduct)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentQty((q) => q - 10)}
                    className="btn-secondary py-1.5 px-3 text-xs"
                  >
                    -10
                  </button>
                  <input
                    type="number"
                    value={adjustmentQty}
                    onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                    className="admin-input text-center font-bold text-sm w-28"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustmentQty((q) => q + 10)}
                    className="btn-secondary py-1.5 px-3 text-xs"
                  >
                    +10
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  New available stock will be: <strong className="text-emerald-400 font-bold">{Math.max(0, adjustingItem.availableStock + Number(adjustmentQty))}</strong>
                </p>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Adjustment Reason / Audit Note</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="admin-select w-full text-xs mb-2"
                >
                  <option value="New Artisan Batch Received">New Artisan Batch Received</option>
                  <option value="Physical Audit Count Rectification">Physical Audit Count Rectification</option>
                  <option value="Damaged in Storage / Quality Rejection">Damaged in Storage / Quality Rejection</option>
                  <option value="Offline Exhibition / Trunk Show Sale">Offline Exhibition / Trunk Show Sale</option>
                  <option value="Returned to Vendor Artisan">Returned to Vendor Artisan</option>
                </select>
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setAdjustingItem(null)} className="btn-secondary py-1.5 px-3 text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-1.5 px-4 text-xs font-bold">
                  <Save className="w-3.5 h-3.5" /> Commit Stock Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
