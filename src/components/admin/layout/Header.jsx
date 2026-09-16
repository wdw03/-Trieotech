'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdmin } from '../../../context/AdminContext.jsx';
import {
  Search,
  Bell,
  Menu,
  Plus,
  Sparkles,
  ShoppingBag,
  AlertTriangle,
  User,
  ChevronDown,
  ExternalLink,
  Package,
  RefreshCw,
  X,
  LogOut,
  ShieldCheck
} from 'lucide-react';

export const Header = () => {
  const {
    sidebarCollapsed,
    setMobileMenuOpen,
    globalSearch,
    setGlobalSearch,
    products,
    orders,
    customers,
    stats,
    isLoading,
    isRefreshing,
    refreshData,
    adminUser,
    isSuperAdmin,
    isSeoManager,
    logout,
    showToast
  } = useAdmin();

  const router = useRouter();
  const navigate = (path) => router.push(path.startsWith('/admin') ? path : `/admin${path === '/' ? '' : path}`);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items based on global search
  const searchResults = React.useMemo(() => {
    if (!globalSearch.trim() || globalSearch.length < 2) return null;
    const q = globalSearch.toLowerCase().trim();

    const matchedOrders = orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.phone.includes(q)
    ).slice(0, 3);

    const matchedProducts = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedCustomers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    ).slice(0, 3);

    return {
      orders: matchedOrders,
      products: matchedProducts,
      customers: matchedCustomers,
      total: matchedOrders.length + matchedProducts.length + matchedCustomers.length
    };
  }, [globalSearch, orders, products, customers]);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between px-3 sm:px-6 lg:px-8 transition-all duration-300 w-full max-w-full min-w-0">
      {/* Left: Mobile Toggle & Global Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-xl">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar Container */}
        <div ref={searchRef} className="relative w-full min-w-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search orders, products, customers..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-8 sm:pl-10 pr-8 sm:pr-9 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Instant Dropdown Search Results */}
          {searchFocused && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-3 max-h-96 overflow-y-auto z-50 animate-scaleIn">
              {searchResults.total === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No matching orders, products, or customers found.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Matching Products */}
                  {searchResults.products.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-1">Products ({searchResults.products.length})</p>
                      {searchResults.products.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            navigate('/products');
                            setSearchFocused(false);
                          }}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="truncate flex-1">
                            <p className="text-xs font-semibold text-slate-200 truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-400">{p.category} • ₹{p.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Matching Orders */}
                  {searchResults.orders.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-1">Orders ({searchResults.orders.length})</p>
                      {searchResults.orders.map((o) => (
                        <div
                          key={o.id}
                          onClick={() => {
                            navigate('/orders');
                            setSearchFocused(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
                        >
                          <div>
                            <span className="font-mono text-xs font-bold text-indigo-400">{o.id}</span>
                            <p className="text-[11px] text-slate-300">{o.customer.name}</p>
                          </div>
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-medium">
                            {o.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Matching Customers */}
                  {searchResults.customers.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-1">Customers ({searchResults.customers.length})</p>
                      {searchResults.customers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            navigate('/customers');
                            setSearchFocused(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-200">{c.name}</p>
                            <p className="text-[10px] text-slate-400">{c.city} • {c.phone}</p>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-medium">₹{c.totalSpent}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Quick Actions, Notifications, User Profile */}
      <div className="flex items-center gap-2.5">
        {/* Quick Add Product Button */}
        <button
          onClick={() => navigate('/products/new')}
          className="btn-primary py-1.5 px-3 text-xs hidden sm:inline-flex"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Product
        </button>

        {/* Refresh Live Data Button */}
        <button
          onClick={() => refreshData()}
          disabled={isRefreshing || isLoading}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          title="Refresh dashboard data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing || isLoading ? 'animate-spin text-indigo-400' : ''}`} />
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#0B0F19]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-3 z-50 animate-scaleIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2 px-1">
                <span className="font-semibold text-xs text-white">Notifications</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                  {stats.statusCounts.new + stats.lowStockCount} New
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div
                  onClick={() => { navigate('/orders'); setShowNotifications(false); }}
                  className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 cursor-pointer flex gap-2.5 items-start"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-200">New Orders Placed</p>
                    <p className="text-[11px] text-slate-400">{stats.statusCounts.new} customer orders awaiting confirmation.</p>
                  </div>
                </div>

                {stats.lowStockCount > 0 && (
                  <div
                    onClick={() => { navigate('/inventory'); setShowNotifications(false); }}
                    className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 cursor-pointer flex gap-2.5 items-start"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-200">Low Stock Alert</p>
                      <p className="text-[11px] text-slate-400">{stats.lowStockCount} craft products running below 15 units.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 pl-2 hover:bg-slate-800/80 rounded-xl transition-colors border border-transparent hover:border-slate-800"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md ${
              isSeoManager() ? 'bg-gradient-to-tr from-indigo-600 to-purple-600' : 'bg-gradient-to-tr from-amber-500 to-indigo-600'
            }`}>
              {adminUser?.avatar || (isSeoManager() ? 'SEO' : 'SA')}
            </div>
            <div className="hidden md:block text-left text-xs">
              <span className="font-semibold text-slate-200 block leading-tight truncate max-w-[120px]">{adminUser?.name || (isSeoManager() ? 'SEO Manager' : 'Trio Super Admin')}</span>
              <span className={`text-[10px] font-semibold block leading-tight ${
                isSeoManager() ? 'text-indigo-400' : 'text-amber-400'
              }`}>
                {isSeoManager() ? 'SEO & CMS Manager' : 'Super Admin'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden md:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 text-xs animate-scaleIn">
              <div className="p-2.5 border-b border-slate-800 mb-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-100">{adminUser?.name || 'Trio Super Admin'}</p>
                  <span className={`border text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                    isSeoManager()
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {isSeoManager() ? 'SEO & CMS Manager' : 'Super Admin'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{adminUser?.email || 'admin@trioenterprises.com'}</p>
              </div>
              <button
                onClick={() => { router.push('/admin/settings'); setShowProfileMenu(false); }}
                className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                Store Settings
              </button>
              <button
                onClick={() => {
                  showToast('Storefront preview opened in new window');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-between"
              >
                View Live Store <ExternalLink className="w-3 h-3 text-slate-500" />
              </button>
              <div className="pt-1 mt-1 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center justify-between font-semibold"
                >
                  <span>Log Out ({isSeoManager() ? 'SEO Manager' : 'Super Admin'})</span>
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
