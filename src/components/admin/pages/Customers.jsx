'use client';
import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../../context/AdminContext.jsx';
import { usePageLoading } from '../../../hooks/usePageLoading.js';
import { CustomersTableSkeleton, Skeleton } from '../ui/Skeleton.jsx';
import {
  Users,
  Search,
  ShoppingBag,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Tag,
  Star,
  X
} from 'lucide-react';

export const Customers = () => {
  const { customers, orders, usersList = [] } = useAdmin();
  const isPageLoading = usePageLoading(450);

  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'VIP' | 'New'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null); // profile drawer/modal
  // Role lookup map from usersList
  const userRoleMap = useMemo(() => {
    const map = new Map();
    (usersList || []).forEach((u) => {
      const email = (u.email || '').toLowerCase().trim();
      if (email) map.set(email, u.role || 'customer');
    });
    return map;
  }, [usersList]);

  const getCustomerRoleBadge = (email) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const isMaster = cleanEmail === 'trioenterprises10@gmail.com';
    const role = (userRoleMap.get(cleanEmail) || '').toLowerCase();

    if (role.includes('super') || isMaster) {
      return {
        label: 'Super Admin',
        badge: 'bg-amber-500/15 border-amber-500/30 text-amber-300'
      };
    }
    if (role.includes('seo') || role.includes('cms')) {
      return {
        label: 'SEO / CMS Manager',
        badge: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
      };
    }
    return {
      label: 'Customer',
      badge: 'bg-slate-800 text-slate-400 border-slate-700'
    };
  };


  const normalizedCustomers = useMemo(() => {
    return (customers || []).map((c) => {
      const name = c?.name || c?.full_name || 'Customer';
      const totalSpent = Number(c?.totalSpent || 0);
      const totalOrders = Number(c?.totalOrders ?? c?.ordersCount ?? 0);
      const tags = Array.isArray(c?.tags)
        ? c.tags
        : (totalSpent > 5000 || totalOrders >= 3 ? ['VIP', 'Artisan Patron'] : ['Artisan Patron']);

      return {
        ...c,
        id: c?.id || Math.random().toString(36).substr(2, 9),
        name,
        email: c?.email || '',
        phone: c?.phone || 'Not provided',
        city: c?.city || 'Jaipur',
        state: c?.state || 'Rajasthan',
        tags,
        totalOrders,
        totalSpent,
        avatar: c?.avatar || name.slice(0, 2).toUpperCase(),
        joinedDate: c?.joinedDate || 'Recent',
        addresses: Array.isArray(c?.addresses) ? c.addresses : [],
      };
    });
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return normalizedCustomers.filter((c) => {
      const tags = c.tags || [];
      if (activeTab === 'VIP' && !tags.includes('VIP') && !tags.includes('High Value')) return false;
      if (activeTab === 'New' && c.totalOrders > 3) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (c.name || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          String(c.phone || '').toLowerCase().includes(q) ||
          (c.city || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [normalizedCustomers, activeTab, searchTerm]);

  // Find order history for selected customer
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    const selEmail = (selectedCustomer.email || '').toLowerCase();
    const selName = (selectedCustomer.name || '').toLowerCase();
    return (orders || []).filter((o) => {
      const ordEmail = (o?.customer?.email || o?.customer_email || o?.shipping_address?.email || '').toLowerCase();
      const ordName = (o?.customer?.name || o?.customer_name || o?.shipping_address?.name || '').toLowerCase();
      return (selEmail && ordEmail === selEmail) || (selName && ordName === selName);
    });
  }, [selectedCustomer, orders]);

  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full min-w-0 flex flex-col lg:h-[calc(100vh-7.5rem)] lg:max-h-[calc(100vh-7.5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Artisan Customers & Boutiques</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Buyer directory, boutique profiles, total orders and lifetime purchase values.
          </p>
        </div>
      </div>

      {/* TABS & SEARCH */}
      <div className="admin-card p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['All', 'VIP', 'New'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-3 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1.5
                ${activeTab === tab ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'}
              `}
            >
              <span>{tab === 'VIP' ? 'VIP Artisans' : (tab === 'New' ? 'New Customers' : 'All Customers')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {isPageLoading ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500/50 animate-pulse inline-block" />
                ) : (
                  tab === 'All' ? normalizedCustomers.length : (tab === 'VIP' ? normalizedCustomers.filter(c => (c.tags || []).includes('VIP') || (c.tags || []).includes('High Value')).length : normalizedCustomers.filter(c => c.totalOrders <= 3).length)
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer name, city, email..."
            className="admin-input pl-9 py-1.5 text-xs w-full"
          />
        </div>
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="admin-card overflow-hidden w-full max-w-full min-w-0 border border-slate-800/80 rounded-2xl shadow-xl flex flex-col flex-1 min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-[320px] max-h-[62vh] lg:max-h-none w-full max-w-full min-w-0 touch-pan-x overscroll-contain relative border-b border-slate-800/60">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 shadow-md">
              <tr className="bg-[#0F172A] text-slate-300">
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Customer Name</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Contact Info</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Location</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] text-center border-b border-slate-800 shadow-sm">Total Orders</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] text-right border-b border-slate-800 shadow-sm">Lifetime Spend</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Customer Tags</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Joined Date</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] text-right border-b border-slate-800 shadow-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isPageLoading ? (
                <CustomersTableSkeleton rows={7} />
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500 text-sm">
                    No customers found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                <tr key={c.id} className="table-tr">
                  {/* Customer Avatar & Name */}
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
                        {c.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-slate-100 text-xs">{c.name}</p>
                          {(() => {
                            const r = getCustomerRoleBadge(c.email);
                            return (
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${r.badge}`}>
                                {r.label}
                              </span>
                            );
                          })()}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">{c.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Email & Phone */}
                  <td className="table-td">
                    <p className="text-xs text-slate-300 font-medium">{c.phone}</p>
                    <p className="text-[11px] text-slate-500">{c.email}</p>
                  </td>

                  {/* Location */}
                  <td className="table-td">
                    <span className="text-xs text-slate-200">{c.city}</span>
                    <span className="text-[10px] text-slate-500 block">{c.state}</span>
                  </td>

                  {/* Total Orders */}
                  <td className="table-td text-center font-bold text-slate-200 text-xs">
                    {c.totalOrders} Orders
                  </td>

                  {/* Total Spent */}
                  <td className="table-td text-right font-black text-sm text-emerald-400">
                    ₹{Number(c.totalSpent || 0).toLocaleString('en-IN')}
                  </td>

                  {/* Tags */}
                  <td className="table-td">
                    <div className="flex flex-wrap gap-1">
                      {(c.tags || []).map((t, idx) => (
                        <span key={idx} className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-medium border border-slate-700">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Joined Date */}
                  <td className="table-td text-xs text-slate-400 font-mono">
                    {c.joinedDate}
                  </td>

                  {/* Actions */}
                  <td className="table-td text-right">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="btn-secondary py-1 px-2.5 text-xs font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Profile
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
        <div className="p-3.5 border-t border-slate-800/80 text-xs text-slate-400 flex justify-between items-center shrink-0 bg-slate-900/90">
          <span>{isPageLoading ? <Skeleton className="h-3.5 w-36 inline-block align-middle" /> : `Showing ${filteredCustomers.length} of ${normalizedCustomers.length} registered customers`}</span>
          <span className="text-[11px] text-slate-500">Click View Profile to see complete order history</span>
        </div>
      </div>

      {/* CUSTOMER PROFILE MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto no-print">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-base font-bold shadow-lg">
                  {selectedCustomer.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg text-white">{selectedCustomer.name}</h3>
                    {(() => {
                      const r = getCustomerRoleBadge(selectedCustomer.email);
                      return (
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${r.badge}`}>
                          Role: {r.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-slate-400">{selectedCustomer.city}, {selectedCustomer.state} • Member since {selectedCustomer.joinedDate}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Total Lifetime Spend</span>
                <span className="text-base font-bold text-emerald-400">₹{Number(selectedCustomer.totalSpent || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Completed Orders</span>
                <span className="text-base font-bold text-indigo-400">{selectedCustomer.totalOrders} Orders</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Average Order Value</span>
                <span className="text-base font-bold text-white">₹{Math.round(Number(selectedCustomer.totalSpent || 0) / Math.max(1, Number(selectedCustomer.totalOrders || 1)))}</span>
              </div>
            </div>

            {/* Address & Notes */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <p className="font-bold text-slate-400 uppercase text-[10px]">Saved Addresses</p>
                {selectedCustomer.addresses?.map((a, i) => (
                  <p key={i} className="text-slate-200">
                    <strong className="text-indigo-400">[{a.type}]</strong> {a.text}
                  </p>
                ))}
              </div>

              {selectedCustomer.notes && (
                <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-indigo-300">
                  <strong className="text-indigo-400 block mb-0.5">Admin Profile Notes:</strong>
                  {selectedCustomer.notes}
                </div>
              )}
            </div>

            {/* Recent Orders placed by this customer */}
            <div>
              <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider mb-2">Order History ({customerOrders.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {customerOrders.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-3">No orders recorded yet.</p>
                ) : (
                  customerOrders.map((ord) => (
                    <div key={ord.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-indigo-400">{ord.id}</span>
                        <span className="text-slate-400 ml-2">{ord.items.length} items</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-200">₹{ord.items.reduce((a, b) => a + (b.price * b.quantity), 0)}</span>
                        <span className="badge-indigo text-[10px]">{ord.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
