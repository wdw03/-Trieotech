'use client';
import React, { useState } from 'react';
import { useAdmin } from '../../../context/AdminContext.jsx';
import { usePageLoading } from '../../../hooks/usePageLoading.js';
import { MetricCardSkeleton, ChartCardSkeleton, Skeleton } from '../ui/Skeleton.jsx';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Package,
  ShoppingBag,
  RotateCcw,
  Users,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const reportDataMonthly = [
  { period: 'May 2026', grossSales: 47800, netSales: 44200, orders: 122, returns: 3, profit: 24800 },
  { period: 'Jun 2026', grossSales: 56400, netSales: 52100, orders: 148, returns: 4, profit: 29500 },
  { period: 'Jul 2026', grossSales: 62100, netSales: 58900, orders: 165, returns: 3, profit: 34100 },
  { period: 'Aug 2026', grossSales: 84300, netSales: 79800, orders: 220, returns: 6, profit: 47200 },
  { period: 'Sep 2026 (MTD)', grossSales: 98400, netSales: 94600, orders: 260, returns: 5, profit: 56300 }
];

export const Reports = () => {
  const { stats, orders, products, showToast } = useAdmin();
  const isPageLoading = usePageLoading(450);

  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [reportType, setReportType] = useState('revenue');

  const handleExportCSV = (reportName) => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Period,Gross Sales (INR),Net Sales (INR),Orders,Returns,Estimated Profit (INR)\n" +
      reportDataMonthly.map(e => `${e.period},${e.grossSales},${e.netSales},${e.orders},${e.returns},${e.profit}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trio_ecart_${reportName.toLowerCase()}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${reportName} report to CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Financial & Sales Analytics Reports</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Reconciled P&L, inventory valuation, profit margins and audit spreadsheets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-0 focus:outline-none cursor-pointer font-medium"
            >
              <option value="Today">Today (Sep 03)</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Festival Season">Diwali & Festive Rush</option>
              <option value="Year to Date">Year to Date (2026)</option>
            </select>
          </div>

          <button
            onClick={() => handleExportCSV('Sales_Financial')}
            className="btn-primary py-1.5 px-3.5 text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5" /> Export All (CSV)
          </button>
        </div>
      </div>

      {/* SUMMARY REPORT CARDS */}
      {isPageLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="admin-card p-4">
            <span className="text-xs font-semibold text-slate-400">Gross Merchandise Value</span>
            <p className="text-xl font-black text-white mt-1.5">₹3,49,000</p>
            <span className="text-[11px] text-emerald-400 font-medium block mt-0.5">+24.6% vs previous cycle</span>
          </div>

          <div className="admin-card p-4">
            <span className="text-xs font-semibold text-slate-400">Net Profit (After GST & Courier)</span>
            <p className="text-xl font-black text-emerald-400 mt-1.5">₹1,91,900</p>
            <span className="text-[11px] text-emerald-500/80 font-medium block mt-0.5">55.0% Gross Margin</span>
          </div>

          <div className="admin-card p-4">
            <span className="text-xs font-semibold text-slate-400">Return / Refund Ratio</span>
            <p className="text-xl font-black text-slate-200 mt-1.5">2.1%</p>
            <span className="text-[11px] text-emerald-400 font-medium block mt-0.5">Below industry average (4%)</span>
          </div>

          <div className="admin-card p-4">
            <span className="text-xs font-semibold text-slate-400">Inventory Asset Valuation</span>
            <p className="text-xl font-black text-amber-400 mt-1.5">₹14,82,500</p>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">At catalog retail valuation</span>
          </div>
        </div>
      )}

      {/* REPORT TYPE SELECTOR STRIP */}
      <div className="admin-card p-3 flex flex-wrap items-center gap-2 text-xs">
        {[
          { id: 'revenue', label: 'Revenue & Sales' },
          { id: 'profit', label: 'Gross Profit & Margins' },
          { id: 'orders', label: 'Order Volume & Fulfillment' },
          { id: 'returns', label: 'Returns & Cancellations' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setReportType(t.id)}
            className={`
              px-3 py-1.5 rounded-xl font-semibold transition-all
              ${reportType === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}
            `}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* MAIN REPORT CHART */}
      {isPageLoading ? (
        <ChartCardSkeleton height="h-72" />
      ) : (
        <div className="admin-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base capitalize">{reportType.replace('_', ' ')} Performance Trend</h3>
              <p className="text-xs text-slate-400">Monthly breakdown for {dateRange}</p>
            </div>
            <button
              onClick={() => handleExportCSV(reportType)}
              className="btn-secondary py-1 px-2.5 text-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export Table
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {reportType === 'profit' ? (
                <BarChart data={reportDataMonthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="period" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    formatter={(v) => [`₹${v.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="profit" fill="#10B981" radius={[6, 6, 0, 0]} name="Net Profit" />
                  <Bar dataKey="grossSales" fill="#6366F1" radius={[6, 6, 0, 0]} name="Gross Sales" />
                </BarChart>
              ) : (
                <AreaChart data={reportDataMonthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="period" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    formatter={(v) => [`₹${v.toLocaleString()}`, 'Amount']}
                  />
                  <Area type="monotone" dataKey="grossSales" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" name="Gross Sales" />
                  <Area type="monotone" dataKey="netSales" stroke="#10B981" strokeWidth={2} fillOpacity={0} name="Net Sales" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* DETAILED DATA TABLE */}
      <div className="admin-card overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Monthly Audit Data Breakdown</h3>
          <span className="text-xs text-slate-500 font-mono">Trio Ecart Financial Ledger</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400">
                <th className="py-3 px-4">Reporting Period</th>
                <th className="py-3 px-4 text-right">Gross GMV (₹)</th>
                <th className="py-3 px-4 text-right">Net Sales (₹)</th>
                <th className="py-3 px-4 text-center">Orders Count</th>
                <th className="py-3 px-4 text-center">Returns Logged</th>
                <th className="py-3 px-4 text-right">Est Net Profit (₹)</th>
                <th className="py-3 px-4 text-center">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isPageLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/40">
                    <td className="py-3 px-4"><Skeleton className="h-3.5 w-24" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="h-3.5 w-20 ml-auto" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="h-3.5 w-20 ml-auto" /></td>
                    <td className="py-3 px-4 text-center"><Skeleton className="h-3.5 w-10 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><Skeleton className="h-3.5 w-8 mx-auto" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="h-3.5 w-20 ml-auto" /></td>
                    <td className="py-3 px-4 text-center"><Skeleton className="h-3.5 w-10 mx-auto" /></td>
                  </tr>
                ))
              ) : (
                reportDataMonthly.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-slate-200">{row.period}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-100">₹{row.grossSales.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-300">₹{row.netSales.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-400">{row.orders}</td>
                    <td className="py-3 px-4 text-center text-rose-400 font-bold">{row.returns}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-400">₹{row.profit.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-300">
                      {Math.round((row.profit / row.grossSales) * 100)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
