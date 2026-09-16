'use client';
import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../../context/AdminContext.jsx';
import { usePageLoading } from '../../../hooks/usePageLoading.js';
import { MetricCardSkeleton, PaymentsTableSkeleton, Skeleton } from '../ui/Skeleton.jsx';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  DollarSign,
  ArrowUpRight,
  Filter,
  Download
} from 'lucide-react';

export const Payments = () => {
  const { payments, showToast } = useAdmin();
  const isPageLoading = usePageLoading(450);

  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (activeTab === 'Paid' && p.status !== 'Paid') return false;
      if (activeTab === 'Pending' && p.status !== 'Pending') return false;
      if (activeTab === 'Failed' && p.status !== 'Failed') return false;
      if (activeTab === 'Refunded' && p.status !== 'Refunded') return false;
      if (activeTab === 'COD' && !p.method.includes('COD')) return false;
      if (activeTab === 'Online' && p.method.includes('COD')) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          p.id.toLowerCase().includes(q) ||
          p.orderId.toLowerCase().includes(q) ||
          p.customer.toLowerCase().includes(q) ||
          p.rrn?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, activeTab, searchTerm]);

  // Aggregate totals
  const totalSettled = payments
    .filter((p) => p.status === 'Paid')
    .reduce((acc, p) => acc + p.amount, 0);

  const totalRefunded = payments
    .filter((p) => p.status === 'Refunded')
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full min-w-0 flex flex-col lg:h-[calc(100vh-7.5rem)] lg:max-h-[calc(100vh-7.5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Payments & Settlements</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Reconciliation of UPI, Cards, Net Banking, COD receipts and Razorpay refunds.
          </p>
        </div>

        <button
          onClick={() => showToast('Exported payment settlements report (CSV)')}
          className="btn-secondary py-1.5 px-3 text-xs shrink-0"
        >
          <Download className="w-3.5 h-3.5" /> Export Settlements (CSV)
        </button>
      </div>

      {/* METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 shrink-0">
        {isPageLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))
        ) : (
          <>
            <div className="admin-card p-4">
              <span className="text-xs text-slate-400 font-medium">Settled to Bank (Net)</span>
              <p className="text-xl font-black text-emerald-400 mt-1.5">₹{totalSettled.toLocaleString()}</p>
              <span className="text-[11px] text-slate-500 block mt-0.5">Auto-settled via Razorpay & UPI</span>
            </div>

            <div className="admin-card p-4">
              <span className="text-xs text-slate-400 font-medium">Pending Collections (COD)</span>
              <p className="text-xl font-black text-amber-400 mt-1.5">₹567</p>
              <span className="text-[11px] text-slate-500 block mt-0.5">With Delhivery & Xpressbees</span>
            </div>

            <div className="admin-card p-4">
              <span className="text-xs text-slate-400 font-medium">Refunds Disbursed</span>
              <p className="text-xl font-black text-rose-400 mt-1.5">₹{totalRefunded.toLocaleString()}</p>
              <span className="text-[11px] text-slate-500 block mt-0.5">1 return claim approved</span>
            </div>

            <div className="admin-card p-4">
              <span className="text-xs text-slate-400 font-medium">Success Rate</span>
              <p className="text-xl font-black text-white mt-1.5">97.8%</p>
              <span className="text-[11px] text-emerald-400 block mt-0.5">Zero payment gateway downtime</span>
            </div>
          </>
        )}
      </div>

      {/* TABS & SEARCH */}
      <div className="admin-card p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['All', 'Paid', 'Pending', 'COD', 'Online', 'Refunded', 'Failed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap
                ${activeTab === tab ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'}
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Txn ID, Order ID, RRN..."
            className="admin-input pl-9 py-1.5 text-xs w-full"
          />
        </div>
      </div>

      {/* PAYMENTS TABLE */}
      <div className="admin-card overflow-hidden w-full max-w-full min-w-0 border border-slate-800/80 rounded-2xl shadow-xl flex flex-col flex-1 min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-[300px] max-h-[60vh] lg:max-h-none w-full max-w-full min-w-0 touch-pan-x overscroll-contain relative border-b border-slate-800/60">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 shadow-md">
              <tr className="bg-[#0F172A] text-slate-300">
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Transaction ID</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Order ID</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Customer</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Method / Gateway</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Bank RRN / Ref</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] text-right border-b border-slate-800 shadow-sm">Amount</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Status</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {isPageLoading ? (
                <PaymentsTableSkeleton rows={7} />
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500 text-sm">
                    No transactions found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                <tr key={p.id} className="table-tr">
                  <td className="table-td font-mono font-bold text-indigo-400 text-xs">
                    {p.id}
                  </td>
                  <td className="table-td font-mono font-semibold text-slate-200 text-xs">
                    {p.orderId}
                  </td>
                  <td className="table-td font-medium text-slate-100 text-xs">
                    {p.customer}
                  </td>
                  <td className="table-td">
                    <p className="text-xs font-semibold text-slate-200">{p.method}</p>
                    <p className="text-[10px] text-slate-500">{p.gateway}</p>
                  </td>
                  <td className="table-td font-mono text-[11px] text-slate-400">
                    {p.rrn}
                  </td>
                  <td className="table-td text-right font-black text-sm text-slate-100">
                    ₹{p.amount}
                  </td>
                  <td className="table-td">
                    <span className={`
                      badge
                      ${p.status === 'Paid' ? 'badge-emerald' : ''}
                      ${p.status === 'Pending' ? 'badge-amber' : ''}
                      ${p.status === 'Refunded' ? 'badge-rose' : ''}
                      ${p.status === 'Failed' ? 'badge-slate' : ''}
                    `}>
                      {p.status}
                    </span>
                  </td>
                  <td className="table-td text-xs text-slate-400 font-mono">
                    {p.date}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
        <div className="p-3.5 border-t border-slate-800/80 text-xs text-slate-400 flex justify-between items-center shrink-0 bg-slate-900/90">
          <span>{isPageLoading ? <Skeleton className="h-3.5 w-36 inline-block align-middle" /> : `Showing ${filteredPayments.length} of ${payments.length} transactions`}</span>
          <span className="text-[11px] text-slate-500">100% encrypted bank reconciliation</span>
        </div>
      </div>
    </div>
  );
};
