'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdmin } from '../../../context/AdminContext.jsx';
import {
  LayoutDashboard,
  Film,
  ShoppingBag,
  Truck,
  Sparkles,
  Warehouse,
  Tags,
  Users,
  CreditCard,
  RotateCcw,
  TicketPercent,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sliders,
  BookOpen,
  FileText,
  MessageSquare,
  PhoneCall,
  LogOut
} from 'lucide-react';

export const Sidebar = () => {
  const { sidebarCollapsed, setSidebarCollapsed, stats, mobileMenuOpen, setMobileMenuOpen, cmsHeroSlides, cmsBlogs, logout, isSuperAdmin, isSeoManager, adminUser } = useAdmin();
  const router = useRouter();
  const pathname = usePathname() || '';
  const navigate = (path) => router.push(path.startsWith('/admin') ? path : `/admin${path === '/' ? '' : path}`);

  const commerceNav = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    {
      name: 'Orders',
      path: '/admin/orders',
      icon: ShoppingBag,
      badge: stats.statusCounts.new > 0 ? stats.statusCounts.new : null,
      badgeColor: 'bg-indigo-500 text-white'
    },
    {
      name: 'Shipping',
      path: '/admin/shipping',
      icon: Truck,
      badge: (stats.statusCounts.processing + stats.statusCounts.packed) > 0 ? (stats.statusCounts.processing + stats.statusCounts.packed) : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold'
    },
    {
      name: 'Products',
      path: '/admin/products',
      icon: Sparkles,
      badge: stats.totalProducts,
      badgeColor: 'bg-slate-800 text-slate-300'
    },
    {
      name: 'Inventory',
      path: '/admin/inventory',
      icon: Warehouse,
      badge: stats.lowStockCount > 0 ? `${stats.lowStockCount} Low` : null,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold'
    },
    { name: 'Categories', path: '/admin/categories', icon: Tags },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    {
      name: 'Returns & Refunds',
      path: '/admin/returns',
      icon: RotateCcw,
      badge: stats.statusCounts.returnRequested > 0 ? stats.statusCounts.returnRequested : null,
      badgeColor: 'bg-purple-500 text-white'
    },
    { name: 'Coupons', path: '/admin/coupons', icon: TicketPercent },
    {
      name: 'Customer Inquiries',
      path: '/admin/inquiries',
      icon: MessageSquare,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
    },
  ];

  const cmsNav = [
    {
      name: 'Home & Banners CMS',
      path: '/admin/cms/home',
      icon: Sliders,
      badge: `${cmsHeroSlides?.length || 3} Slides`,
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold'
    },
    {
      name: 'Instagram Reels CMS',
      path: '/admin/cms/reels',
      icon: Film,
      badge: 'Live',
      badgeColor: 'bg-[#ee2a7b]/20 text-[#ee2a7b] border border-[#ee2a7b]/30 font-bold'
    },
    {
      name: 'Blog & Journal CMS',
      path: '/admin/cms/blogs',
      icon: BookOpen,
      badge: `${cmsBlogs?.length || 3} Posts`,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
    },
    {
      name: 'Contact & Inquiries',
      path: '/admin/inquiries',
      icon: MessageSquare
    },
    {
      name: 'Static Pages & FAQ',
      path: '/admin/cms/pages',
      icon: FileText
    }
  ];

  const systemNav = [
    {
      name: 'User Roles & Staff',
      path: '/admin/users',
      icon: Users,
      badge: 'Super Admin',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
    },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const renderNavGroup = (items, label) => (
    <div className="space-y-1 mb-4">
      {!sidebarCollapsed && label && (
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-3.5 block mb-1.5 animate-fadeIn">
          {label}
        </span>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.path === '/admin' ? pathname === '/admin' : pathname.startsWith(item.path);
        return (
          <Link
            key={item.name}
            href={item.path}
            onClick={() => setMobileMenuOpen(false)}
            className={`
              group flex items-center gap-3.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 relative
              ${isActive
                ? 'bg-amber-500/15 text-amber-400 font-semibold shadow-inner border border-amber-500/20'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
            title={sidebarCollapsed ? item.name : undefined}
          >
            <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
            {!sidebarCollapsed && (
              <span className="truncate flex-1 text-xs animate-fadeIn">{item.name}</span>
            )}
            {!sidebarCollapsed && item.badge && (
              <span className={`text-[10px] px-2 py-0.2 rounded-full shrink-0 font-medium ${item.badgeColor}`}>
                {item.badge}
              </span>
            )}
            {sidebarCollapsed && item.badge && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:static top-0 bottom-0 left-0 z-40 flex flex-col shrink-0 h-screen lg:h-full
          bg-[#0B0F19]/95 backdrop-blur-xl border-r border-slate-800/80
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Authentic Logo Emblem from triotech */}
            <div className="w-10 h-10 rounded-xl overflow-hidden p-0.5 bg-gradient-to-br from-amber-500/50 via-rose-700/40 to-amber-500/50 shadow-md shrink-0">
              <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center overflow-hidden border border-amber-500/40">
                <img
                  src="/logo.png"
                  alt="Trio Enterprises"
                  className="w-full h-full object-contain p-0.5 transform hover:scale-110 transition-transform"
                />
              </div>
            </div>

            {!sidebarCollapsed && (
              <div className="flex flex-col truncate animate-fadeIn">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm tracking-tight text-white">
                    TRIO <span className="text-amber-400 font-bold">ENTERPRISES</span>
                  </span>
                  <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1 py-0.2 rounded font-black uppercase">
                    CMS
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                  Ethnic Craft Guild
                </span>
              </div>
            )}
          </div>

          {/* Collapse toggle (Desktop only) */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items (Role-Filtered) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {isSeoManager() ? (
            // SEO Manager Exclusive Navigation
            <>
              {renderNavGroup(cmsNav, 'SEO & Storefront CMS')}
            </>
          ) : (
            // Super Admin Full Navigation
            <>
              {renderNavGroup(commerceNav, 'Store Operations')}
              {renderNavGroup(cmsNav, 'Storefront CMS')}
              {renderNavGroup(systemNav, 'System & Staff')}
            </>
          )}
        </div>

        {/* Footer info & Super Admin Logout */}
        <div className="p-3 border-t border-slate-800/80 shrink-0 space-y-2">
          {!sidebarCollapsed ? (
            <>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] font-semibold text-slate-200 truncate">{isSeoManager() ? 'SEO Manager Portal' : 'Super Admin Secure'}</p>
                    <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Session
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-rose-400 hover:text-rose-300 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-semibold transition-all"
                title="Log Out of Super Admin Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/20"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
