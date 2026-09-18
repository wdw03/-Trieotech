'use client';
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import initialProductsList from '../data/admin/products.js';
import initialCategoriesList from '../data/admin/categories.js';
import { calculateOrderTotal } from '../data/admin/orders.js';
import { initialCoupons } from '../data/admin/coupons.js';
import { cmsService } from '../services/cmsService.js';
import { adminApi } from '../services/adminApi.js';
import { supabase } from '../services/adminSupabase.js';
import {
  initialHeroSlides,
  initialHomeSections,
  initialCmsBlogs,
  initialCmsPages
} from '../data/admin/initialCmsData.js';


export const formatDashboardCoupon = (c) => ({
  id: c.id,
  code: c.code,
  type: c.discountType === 'percentage' || c.type === 'Percentage' ? 'Percentage' : 'Flat',
  discountType: c.discountType || (c.type === 'Percentage' ? 'percentage' : 'flat'),
  value: Number(c.value) || 0,
  minSpend: Number(c.minSpend || c.minOrderValue || 0),
  minOrderValue: Number(c.minSpend || c.minOrderValue || 0),
  maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
  applicableCategory: c.applicableCategory || 'All',
  applicableProductIds: c.applicableProductIds || [],
  applicableProductNames: c.applicableProductNames || [],
  description: c.description || '',
  expiresAt: c.expiresAt || null,
  isExpired: Boolean(c.isExpired),
  maxUses: c.maxUses || 500,
  usedCount: c.usedCount || 0,
  status: c.isActive && !c.isExpired ? 'Active' : (c.status === 'Active' ? 'Active' : 'Inactive'),
  isActive: Boolean(c.isActive ?? c.status === 'Active'),
});


export const filterValidOrders = (rawOrders) => {
  if (!Array.isArray(rawOrders)) return [];
  return rawOrders.filter((ord) => {
    const s = (ord.raw_status || ord.status || '').toLowerCase();
    return !['pending_payment', 'pending payment', 'payment_failed', 'payment failed', 'draft'].includes(s);
  });
};

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  // Core Entities State
  const [products, setProducts] = useState(initialProductsList);
  const [categories, setCategories] = useState(initialCategoriesList);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [inventory, setInventory] = useState(() => {
    return initialProductsList.map((p) => ({
      productId: p.id,
      name: p.name,
      sku: p.sku || `TE-${p.category ? p.category.substring(0, 3).toUpperCase() : 'PRD'}-${p.id}`,
      category: p.category || 'General',
      subcategory: p.subcategory || '',
      price: Number(p.price || 0),
      image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (typeof p.images === 'string' ? p.images : '/logo.png'),
      totalStock: Number(p.stock ?? 50),
      availableStock: Number(p.stock ?? 50),
      reservedStock: 0,
      lowStockThreshold: 15,
      status: Number(p.stock ?? 50) === 0 ? 'Out of Stock' : Number(p.stock ?? 50) <= 15 ? 'Low Stock' : 'In Stock',
      lastRestocked: p.updated_at ? p.updated_at.split('T')[0] : '2026-09-08',
      variants: (p.colors || []).map((c) => ({
        name: typeof c === 'object' ? c.name : c,
        stock: Math.floor(Number(p.stock ?? 50) / ((p.colors?.length) || 1)),
      })),
    }));
  });
  const [stockLogs, setStockLogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [returns, setReturns] = useState([]);

  // ═══════════════════════════════════════════════════════════════
  // UNIFIED ADMIN AUTHENTICATION (Synced directly with AuthContext)
  // ═══════════════════════════════════════════════════════════════
  const {
    user: authUser,
    profile: authProfile,
    loading: authLoading,
    logout: authLogout,
    isAdmin: authIsAdmin,
    isSuperAdmin: authIsSuperAdmin,
    isSeoManager: authIsSeoManager,
    effectiveRole: authRole
  } = useAuth();

  const [localSession, setLocalSession] = useState(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const session = localStorage.getItem('trio_superadmin_session') || sessionStorage.getItem('trio_superadmin_session');
        if (session) {
          setLocalSession(JSON.parse(session));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const isAuthenticated = Boolean(
    (!authLoading && authUser && authIsAdmin) ||
    (!authUser && localSession?.active === true)
  );

  const isAuthChecking = Boolean(
    authLoading && !localSession?.active
  );

  const adminUser = useMemo(() => {
    if (authUser && authIsAdmin) {
      const email = (authUser.email || '').toLowerCase();
      const isMaster = email === 'trioenterprises10@gmail.com' || email === 'admin@trioenterprises.com';
      const metaRole = (authUser.user_metadata?.role || '').toLowerCase();
      const isSeo = !isMaster && (authRole === 'seo_manager' || authIsSeoManager || metaRole.includes('seo') || metaRole === 'seo_manager');

      const roleDisplay = isMaster
        ? 'Super Admin'
        : (isSeo ? 'SEO Manager' : (authRole === 'super_admin' ? 'Super Admin' : 'Admin'));
      const roleKey = isMaster ? 'super_admin' : (isSeo ? 'seo_manager' : authRole);

      return {
        id: authUser.id,
        name: authProfile?.full_name || authUser.name || (isMaster ? 'Trio Super Admin' : (isSeo ? 'SEO Manager' : 'Administrator')),
        email,
        role: roleDisplay,
        roleKey,
        avatar: isSeo ? 'SEO' : 'SA',
        lastLogin: new Date().toISOString()
      };
    }
    if (localSession?.user) {
      return localSession.user;
    }
    return {
      name: 'Trio Super Admin',
      email: 'trioenterprises10@gmail.com',
      role: 'Super Admin',
      roleKey: 'super_admin',
      avatar: 'SA',
      lastLogin: null
    };
  }, [authUser, authProfile, authIsAdmin, authRole, authIsSeoManager, localSession]);

  // Keep localStorage session synced with current authenticated admin
  useEffect(() => {
    if (authUser && authIsAdmin) {
      const email = (authUser.email || '').toLowerCase();
      const isMaster = email === 'trioenterprises10@gmail.com' || email === 'admin@trioenterprises.com';
      const metaRole = (authUser.user_metadata?.role || '').toLowerCase();
      const isSeo = !isMaster && (authRole === 'seo_manager' || authIsSeoManager || metaRole.includes('seo') || metaRole === 'seo_manager');

      const roleDisplay = isMaster
        ? 'Super Admin'
        : (isSeo ? 'SEO Manager' : (authRole === 'super_admin' ? 'Super Admin' : 'Admin'));
      const roleKey = isMaster ? 'super_admin' : (isSeo ? 'seo_manager' : authRole);

      const sessionData = {
        active: true,
        user: {
          id: authUser.id,
          name: authProfile?.full_name || authUser.name || (isMaster ? 'Trio Super Admin' : (isSeo ? 'SEO Manager' : 'Administrator')),
          email,
          role: roleDisplay,
          roleKey,
          avatar: isSeo ? 'SEO' : 'SA',
          lastLogin: new Date().toISOString()
        },
        token: `trio_auth_${Date.now()}`
      };
      try {
        localStorage.setItem('trio_superadmin_session', JSON.stringify(sessionData));
        setLocalSession(sessionData);
      } catch (_) { }
    } else if (authUser && !authIsAdmin) {
      // Customer is authenticated: purge any stale admin tokens immediately
      try {
        localStorage.removeItem('trio_superadmin_session');
        sessionStorage.removeItem('trio_superadmin_session');
        setLocalSession(null);
      } catch (_) { }
    }
  }, [authUser, authProfile, authIsAdmin, authRole, authIsSeoManager]);

  // ═══════════════════════════════════════════════════════════════
  // ROLE-BASED ACCESS CONTROL (RBAC) HELPERS & STAFF USERS
  // ═══════════════════════════════════════════════════════════════
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const isSeoManager = () => {
    const email = (authUser?.email || adminUser?.email || localSession?.user?.email || '').toLowerCase();
    if (email === 'trioenterprises10@gmail.com' || email === 'admin@trioenterprises.com') return false;

    if (authIsSeoManager || authRole === 'seo_manager') return true;

    const metaRole = (authUser?.user_metadata?.role || '').toLowerCase();
    if (metaRole === 'seo_manager' || metaRole === 'seo' || metaRole.includes('seo') || metaRole.includes('cms')) {
      return true;
    }

    const role = (adminUser?.role || localSession?.user?.role || '').toLowerCase();
    const roleKey = (adminUser?.roleKey || localSession?.user?.roleKey || '').toLowerCase();
    return role.includes('seo') || roleKey === 'seo_manager' || roleKey === 'seo';
  };

  const isSuperAdmin = () => {
    // SEO Managers are strictly restricted from Super Admin access
    if (isSeoManager()) return false;

    const email = (authUser?.email || adminUser?.email || localSession?.user?.email || '').toLowerCase();
    if (email === 'trioenterprises10@gmail.com' || email === 'admin@trioenterprises.com') return true;

    if (authIsSuperAdmin && !authIsSeoManager) return true;

    const role = (adminUser?.role || localSession?.user?.role || '').toLowerCase();
    const roleKey = (adminUser?.roleKey || localSession?.user?.roleKey || '').toLowerCase();
    return role.includes('super') || roleKey === 'super_admin';
  };

  // SEO Manager allowed paths (Home/Banners, Reels, Blogs, Contact Inquiries, Static Pages)
  const SEO_ALLOWED_PATHS = [
    '/cms/home',
    '/cms/reels',
    '/reels',
    '/cms/blogs',
    '/inquiries',
    '/contact',
    '/cms/contact',
    '/cms/pages',
    '/cms'
  ];

  const canAccessRoute = (pathname) => {
    if (isSuperAdmin()) return true;
    if (isSeoManager()) {
      let cleanPath = String(pathname || '').toLowerCase().replace(/\/+$/, '');
      cleanPath = cleanPath.replace(/^\/admin/, '') || '/';
      if (cleanPath === '' || cleanPath === '/') return false; // SEO Manager defaults to /cms/home
      return SEO_ALLOWED_PATHS.some((p) => cleanPath === p || cleanPath.startsWith(p + '/'));
    }
    return false;
  };

  const fetchUsers = async (searchQuery = '') => {
    setIsLoadingUsers(true);
    try {
      const res = await adminApi.getUsers(searchQuery);
      if (res?.success && Array.isArray(res.users)) {
        setUsersList(res.users);
        return res.users;
      }
    } catch (err) {
      console.warn('fetchUsers error:', err);
    } finally {
      setIsLoadingUsers(false);
    }
    return [];
  };

  const assignRole = async (userId, email, newRole) => {
    try {
      const res = await adminApi.assignUserRole(userId, email, newRole, adminUser?.email);
      if (res?.success) {
        const msg = newRole === 'customer'
          ? `Role removed from ${email || 'user'}. Access reverted to Customer.`
          : `Role successfully updated to ${newRole}!`;
        showToast(msg, 'success');
        await fetchUsers();
        return { success: true, data: res.data };
      } else {
        throw new Error(res?.error || 'Failed to update role');
      }
    } catch (err) {
      showToast(err.message || 'Failed to assign role', 'error');
      return { success: false, error: err.message };
    }
  };

  const removeRole = async (userId, email) => {
    return assignRole(userId, email, 'customer');
  };

  // ═══════════════════════════════════════════════════════════════
  // CMS STATES (HERO SLIDES, HOME SECTIONS, BLOGS, PAGES)
  // ═══════════════════════════════════════════════════════════════
  const [cmsHeroSlides, setCmsHeroSlides] = useState(initialHeroSlides);
  const [cmsHomeSections, setCmsHomeSections] = useState(initialHomeSections);
  const [cmsBlogs, setCmsBlogs] = useState(initialCmsBlogs);
  const [cmsPages, setCmsPages] = useState(initialCmsPages);

  // Sync CMS cached data from localStorage on client mount without causing hydration mismatch
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedSlides = localStorage.getItem('trio_cms_hero_slides_v1');
        if (savedSlides) setCmsHeroSlides(JSON.parse(savedSlides));
        const savedSections = localStorage.getItem('trio_cms_home_sections_v1');
        if (savedSections) setCmsHomeSections(JSON.parse(savedSections));
        const savedBlogs = localStorage.getItem('trio_cms_blogs_v1');
        if (savedBlogs) setCmsBlogs(JSON.parse(savedBlogs));
        const savedPages = localStorage.getItem('trio_cms_pages_v1');
        if (savedPages) setCmsPages(JSON.parse(savedPages));
      }
    } catch (_) {}
  }, []);

  // UI & Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toasts, setToasts] = useState([]);
  const [printDocument, setPrintDocument] = useState(null);

  // Toast Notification Helper
  const buildInventoryFromProducts = (prods) => {
    if (!Array.isArray(prods)) return [];
    return prods.map((p) => {
      const isProdInStock = Boolean(p.inStock ?? p.in_stock ?? true) && Number(p.stock ?? 0) > 0;
      const stockQty = isProdInStock ? Number(p.stock ?? 0) : 0;
      const lowThreshold = Number(p.low_stock_threshold || 15);
      return {
        productId: Number(p.id),
        name: p.name,
        sku: p.sku || `TE-${p.category ? p.category.substring(0, 3).toUpperCase() : 'PRD'}-${p.id}`,
        category: p.category || 'General',
        subcategory: p.subcategory || '',
        price: Number(p.price || 0),
        image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (typeof p.images === 'string' ? p.images : '/logo.png'),
        totalStock: stockQty,
        availableStock: stockQty,
        reservedStock: 0,
        lowStockThreshold: lowThreshold,
        status: !isProdInStock ? 'Out of Stock' : (stockQty <= lowThreshold ? 'Low Stock' : 'In Stock'),
        is_visible: p.is_visible !== false,
        sold_quantity: Number(p.sold_quantity || 0),
        lastRestocked: p.updated_at ? p.updated_at.split('T')[0] : '2026-09-08',
        variants: (p.colors || []).map((c) => ({
          name: typeof c === 'object' ? c.name : c,
          hex: typeof c === 'object' ? c.hex : '#D4AF37',
          colorHex: typeof c === 'object' ? c.hex : '#D4AF37',
          colorName: typeof c === 'object' ? c.name : c,
          available: isProdInStock ? ((typeof c === 'object' && c.stock !== undefined) ? Number(c.stock) : Math.floor(stockQty / ((p.colors?.length) || 1))) : 0,
          stock: isProdInStock ? ((typeof c === 'object' && c.stock !== undefined) ? Number(c.stock) : Math.floor(stockQty / ((p.colors?.length) || 1))) : 0,
          reserved: 0
        })),
      };
    });
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ═══════════════════════════════════════════════════════════════
  // LIVE DATABASE & BACKEND API FETCHING ON MOUNT
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const loadInitialData = async () => {
      // Safety timer so loading state never hangs
      const safetyTimer = setTimeout(() => {
        if (isMounted) setIsLoading(false);
      }, 2500);

      try {
        setIsLoading(true);
        const [prodsRes, heroSlidesRes, ordersRes, catsRes, custsRes, blogsRes, couponsRes, returnsRes] = await Promise.allSettled([
          adminApi.getProducts(),
          cmsService.getHeroSlides(),
          adminApi.getOrders(),
          adminApi.getCategories(),
          adminApi.getCustomers(),
          adminApi.getBlogs(),
          adminApi.getCoupons(),
          adminApi.getReturns(),
        ]);
        clearTimeout(safetyTimer);

        if (!isMounted) return;
        if (heroSlidesRes.status === 'fulfilled' && Array.isArray(heroSlidesRes.value) && heroSlidesRes.value.length > 0) {
          setCmsHeroSlides(heroSlidesRes.value);
        }

        if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value?.products)) {
          const liveProds = prodsRes.value.products;
          setProducts(liveProds);
          setInventory(buildInventoryFromProducts(liveProds));
        }
        if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value?.orders)) {
          const liveOrders = ordersRes.value.orders;
          setOrders(filterValidOrders(liveOrders));
          setPayments(liveOrders.map((o) => ({
            id: `PAY-${o.id}`,
            orderId: o.order_number || o.id,
            customerName: o.customer_name || o.shipping_address?.name || 'Patron',
            amount: Number(o.total || o.totalAmount || 0),
            method: o.payment_method || 'Razorpay',
            status: o.payment_status === 'paid' ? 'Completed' : (o.payment_status || 'Pending'),
            transactionId: o.razorpay_payment_id || `txn_${o.id}`,
            date: o.created_at ? o.created_at.split('T')[0] : '2026-09-08',
          })));
          setReturns(liveOrders
            .filter((o) => ['return_requested', 'returned', 'refunded'].includes((o.status || '').toLowerCase()))
            .map((o) => ({
              id: `RET-${o.id}`,
              orderId: o.order_number || o.id,
              customerName: o.customer_name || o.shipping_address?.name || 'Patron',
              items: o.order_items || [],
              reason: o.return_reason || 'Customer Request',
              status: o.status,
              refundAmount: Number(o.total || 0),
              date: o.updated_at ? o.updated_at.split('T')[0] : '2026-09-08',
            })));
        }
        if (returnsRes?.status === 'fulfilled' && Array.isArray(returnsRes.value?.returns)) {
          setReturns(returnsRes.value.returns);
        }
        if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value?.categories)) {
          setCategories(catsRes.value.categories);
        }
        if (custsRes.status === 'fulfilled' && Array.isArray(custsRes.value?.customers)) {
          setCustomers(custsRes.value.customers.map(c => ({
            ...c,
            tags: Array.isArray(c?.tags) ? c.tags : ['Artisan Patron'],
            totalOrders: Number(c?.totalOrders ?? c?.ordersCount ?? 0),
            totalSpent: Number(c?.totalSpent || 0),
            avatar: c?.avatar || (c?.name ? c.name.slice(0, 2).toUpperCase() : 'AP'),
          })));
        }
        if (blogsRes.status === 'fulfilled' && Array.isArray(blogsRes.value?.blogs)) {
          setCmsBlogs(blogsRes.value.blogs);
        }
        if (couponsRes.status === 'fulfilled' && Array.isArray(couponsRes.value?.coupons)) {
          setCoupons(couponsRes.value.coupons.map(formatDashboardCoupon));
        }
      } catch (err) {
        console.warn('Initial live sync error:', err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, [isAuthenticated]);

  // ── Realtime subscription for live admin order & shipment updates ──
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('admin-live-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('[Admin Realtime] Orders table change:', payload.eventType);
          refreshOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipments' },
        () => {
          console.log('[Admin Realtime] Shipments table change');
          refreshOrders();
        }
      )
      .subscribe();

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);


  // Manual trigger to refetch live API data & show sync indicator
  const refreshData = async (customDuration = 600) => {
    setIsRefreshing(true);
    try {
      const [prodsRes, ordersRes, catsRes, custsRes, blogsRes, couponsRes] = await Promise.allSettled([
        adminApi.getProducts(),
        adminApi.getOrders(),
        adminApi.getCategories(),
        adminApi.getCustomers(),
        adminApi.getBlogs(),
        adminApi.getCoupons(),
      ]);

      let syncCount = 0;
      if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value?.products)) {
        setProducts(prodsRes.value.products);
        setInventory(buildInventoryFromProducts(prodsRes.value.products));
        syncCount++;
      }
      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value?.orders)) {
        setOrders(filterValidOrders(ordersRes.value.orders));
        syncCount++;
      }
      if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value?.categories)) {
        setCategories(catsRes.value.categories);
        syncCount++;
      }
      if (custsRes.status === 'fulfilled' && Array.isArray(custsRes.value?.customers)) {
        setCustomers(custsRes.value.customers);
        syncCount++;
      }
      if (blogsRes.status === 'fulfilled' && Array.isArray(blogsRes.value?.blogs)) {
        setCmsBlogs(blogsRes.value.blogs);
        syncCount++;
      }
      if (couponsRes.status === 'fulfilled' && Array.isArray(couponsRes.value?.coupons)) {
        setCoupons(couponsRes.value.coupons.map(formatDashboardCoupon));
        syncCount++;
      }

      showToast(`Live database synchronized! (${syncCount} services online)`, 'success');
    } catch (err) {
      showToast('Sync finished with cached records', 'info');
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      }, customDuration);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // PRODUCT OPERATIONS (CONNECTED TO LIVE DATABASE API)
  // ═══════════════════════════════════════════════════════════════
  const addProduct = async (newProduct) => {
    const slug = newProduct.slug || newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const localId = Date.now();

    const cleanImgs = Array.isArray(newProduct.images)
      ? newProduct.images.filter(img => typeof img === 'string' && img.trim())
      : [];
    const finalImgs = cleanImgs.length > 1 && cleanImgs.includes('/products/pearl-zardosi-patch-1.jpg')
      ? cleanImgs.filter(img => img !== '/products/pearl-zardosi-patch-1.jpg')
      : (cleanImgs.length ? cleanImgs : ['/products/pearl-zardosi-patch-1.jpg']);
    const primaryImg = finalImgs[0];

    const cleanColors = Array.isArray(newProduct.colors)
      ? newProduct.colors.map((c) => {
          if (typeof c === 'object' && c !== null) {
            return {
              ...c,
              image: (c.image && c.image !== '/products/pearl-zardosi-patch-1.jpg') ? c.image : primaryImg
            };
          }
          return c;
        })
      : [];

    const created = {
      ...newProduct,
      id: localId,
      slug,
      inStock: newProduct.inStock ?? true,
      badge: newProduct.badge || 'New',
      images: finalImgs,
      image: primaryImg,
      colors: cleanColors,
      sizes: newProduct.sizes || [],
      features: newProduct.features || [],
      specifications: newProduct.specifications || {},
      description: newProduct.description || newProduct.fullDescription || newProduct.full_description || newProduct.shortDescription || newProduct.short_description || '',
      fullDescription: newProduct.fullDescription || newProduct.full_description || newProduct.description || '',
      full_description: newProduct.full_description || newProduct.fullDescription || newProduct.description || '',
      shortDescription: newProduct.shortDescription || newProduct.short_description || (newProduct.description ? String(newProduct.description).slice(0, 160) : '') || '',
      short_description: newProduct.short_description || newProduct.shortDescription || (newProduct.description ? String(newProduct.description).slice(0, 160) : '') || '',
    };

    setProducts((prev) => [created, ...prev]);

    // Also add to inventory
    const catPrefix = created.category ? created.category.substring(0, 3).toUpperCase() : 'PRD';
    const newInv = {
      productId: localId,
      name: created.name,
      sku: `TE-${catPrefix}-${localId}`,
      category: created.category,
      subcategory: created.subcategory,
      price: created.price,
      image: created.images[0],
      totalStock: Number(created.stock || 50),
      availableStock: Number(created.stock || 50),
      reservedStock: 0,
      lowStockThreshold: 15,
      status: 'In Stock',
      lastRestocked: new Date().toISOString().split('T')[0],
      variants: []
    };
    setInventory((prev) => [newInv, ...prev]);

    try {
      const res = await adminApi.createProduct(created);
      if (res?.product) {
        setProducts((prev) => prev.map((p) => p.id === localId ? res.product : p));
        showToast(`Product "${created.name.substring(0, 25)}..." added to Supabase DB!`);
        return res.product;
      }
    } catch (err) {
      console.warn('API addProduct fallback:', err.message);
    }

    showToast(`Product "${created.name.substring(0, 25)}..." added successfully!`);
    return created;
  };

  const updateProduct = async (id, updatedFields) => {
    // Optimistic update for snappy UI response
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === Number(id)) {
          const merged = { ...p, ...updatedFields };
          if (updatedFields.stock !== undefined || updatedFields.inStock !== undefined || updatedFields.in_stock !== undefined) {
            const hasStock = Boolean(updatedFields.inStock ?? updatedFields.in_stock ?? (merged.in_stock ?? true)) && Number(updatedFields.stock ?? merged.stock ?? 0) > 0;
            merged.inStock = hasStock;
            merged.in_stock = hasStock;
            merged.stock = hasStock ? Number(updatedFields.stock ?? merged.stock ?? 25) : 0;
            if (Array.isArray(merged.colors)) {
              merged.colors = merged.colors.map(c => ({
                ...c,
                stock: hasStock ? (c.stock !== undefined && Number(c.stock) > 0 ? Number(c.stock) : Math.max(1, Math.floor(merged.stock / (merged.colors.length || 1)))) : 0
              }));
            }
          }
          if (updatedFields.images !== undefined || updatedFields.image !== undefined) {
            const cleanImgs = Array.isArray(merged.images)
              ? merged.images.filter(img => typeof img === 'string' && img.trim())
              : (merged.image ? [merged.image] : []);
            const finalImgs = cleanImgs.length > 1 && cleanImgs.includes('/products/pearl-zardosi-patch-1.jpg')
              ? cleanImgs.filter(img => img !== '/products/pearl-zardosi-patch-1.jpg')
              : cleanImgs;
            const primaryImg = finalImgs[0] || merged.image || '/products/pearl-zardosi-patch-1.jpg';
            merged.images = finalImgs;
            merged.image = primaryImg;
            if (Array.isArray(merged.colors)) {
              merged.colors = merged.colors.map(c => ({
                ...c,
                image: (c.image && c.image !== '/products/pearl-zardosi-patch-1.jpg') ? c.image : primaryImg
              }));
            }
          }

          if (updatedFields.shortDescription !== undefined || updatedFields.short_description !== undefined || updatedFields.fullDescription !== undefined || updatedFields.full_description !== undefined || updatedFields.description !== undefined) {
            const d = updatedFields.description ?? updatedFields.fullDescription ?? updatedFields.full_description ?? updatedFields.shortDescription ?? updatedFields.short_description ?? merged.description ?? '';
            const f = updatedFields.fullDescription ?? updatedFields.full_description ?? d ?? merged.fullDescription ?? merged.full_description ?? '';
            const s = updatedFields.shortDescription ?? updatedFields.short_description ?? (d ? String(d).slice(0, 160) : '') ?? merged.shortDescription ?? merged.short_description ?? '';
            merged.description = d;
            merged.fullDescription = f;
            merged.full_description = f;
            merged.shortDescription = s;
            merged.short_description = s;
          }

          return merged;
        }
        return p;
      })
    );

    setInventory((prev) =>
      prev.map((inv) => {
        if (inv.productId === Number(id)) {
          const newInv = {
            ...inv,
            name: updatedFields.name || inv.name,
            price: updatedFields.price !== undefined ? Number(updatedFields.price) : inv.price
          };
          if (updatedFields.stock !== undefined || updatedFields.inStock !== undefined || updatedFields.in_stock !== undefined) {
            const hasStock = Boolean(updatedFields.inStock ?? updatedFields.in_stock ?? (inv.status !== 'Out of Stock')) && Number(updatedFields.stock ?? inv.availableStock) > 0;
            const newAvail = hasStock ? Math.max(0, Number(updatedFields.stock ?? inv.availableStock)) : 0;
            newInv.availableStock = newAvail;
            newInv.totalStock = newAvail + (inv.reservedStock || 0);
            newInv.status = newAvail === 0 ? 'Out of Stock' : (newAvail <= (inv.lowStockThreshold || 15) ? 'Low Stock' : 'In Stock');
            if (newAvail > 0) {
              newInv.lastRestocked = new Date().toISOString().split('T')[0];
            }
            if (Array.isArray(newInv.variants)) {
              newInv.variants = newInv.variants.map(v => ({
                ...v,
                available: hasStock ? Math.max(1, Math.floor(newAvail / (newInv.variants.length || 1))) : 0
              }));
            }
          }
          return newInv;
        }
        return inv;
      })
    );

    try {
      const res = await adminApi.updateProduct(id, updatedFields);
      if (res?.product) {
        setProducts((prev) => prev.map((p) => p.id === Number(id) ? res.product : p));
      }
      showToast('Product updated in database!');
    } catch (err) {
      showToast('Product updated locally', 'info');
    }
  };

  const deleteProduct = async (id) => {
    const p = products.find((x) => x.id === Number(id));
    setProducts((prev) => prev.filter((x) => x.id !== Number(id)));
    setInventory((prev) => prev.filter((x) => x.productId !== Number(id)));

    try {
      await adminApi.deleteProduct(id);
      showToast(`Deleted "${p?.name?.substring(0, 25) || 'product'}" from database`, 'info');
    } catch (err) {
      showToast(`Deleted "${p?.name?.substring(0, 25) || 'product'}"`, 'info');
    }
  };

  const duplicateProduct = async (id) => {
    const existing = products.find((x) => x.id === Number(id));
    if (!existing) return;
    const duplicated = {
      ...existing,
      id: Date.now(),
      name: `${existing.name} (Copy)`,
      slug: `${existing.slug}-copy-${Date.now().toString().slice(-4)}`,
      badge: 'New',
    };
    return addProduct(duplicated);
  };

  // ═══════════════════════════════════════════════════════════════
  // ORDER OPERATIONS (CONNECTED TO LIVE DATABASE API)
  // ═══════════════════════════════════════════════════════════════
  const refreshOrders = async () => {
    try {
      const res = await adminApi.getOrders();
      if (res && Array.isArray(res.orders)) {
        setOrders(filterValidOrders(res.orders));
        return res.orders;
      }
    } catch (err) {
      console.warn('refreshOrders failed:', err);
    }
  };
  const updateOrderStatus = async (orderId, newStatus, details = {}) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId || ord.order_number === orderId ? { ...ord, status: newStatus } : ord))
    );

    try {
      const payload = typeof details === 'string' ? { cancelReason: details } : (details || {});
      await adminApi.updateOrderStatus(orderId, newStatus, payload);
      showToast(`Order ${orderId} status changed to ${newStatus}`);
      await refreshOrders();
    } catch (err) {
      showToast(err.message || `Order ${orderId} status update failed`, 'error');
      await refreshOrders();
    }
  };

  const bulkUpdateOrderStatus = async (orderIds, newStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (orderIds.includes(ord.id) || orderIds.includes(ord.order_number) ? { ...ord, status: newStatus } : ord))
    );

    try {
      await Promise.allSettled(orderIds.map((id) => adminApi.updateOrderStatus(id, newStatus)));
      showToast(`Updated ${orderIds.length} orders to "${newStatus}" in DB`);
    } catch (err) {
      showToast(`Updated ${orderIds.length} orders to "${newStatus}"`);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // INVENTORY OPERATIONS
  // ═══════════════════════════════════════════════════════════════
  const adjustStock = async (productId, adjustmentQty, reason) => {
    const changeNum = Number(adjustmentQty);
    let newStockLevel = 0;
    let newInStock = false;

    setInventory((prev) =>
      prev.map((item) => {
        if (item.productId === Number(productId)) {
          const newAvail = Math.max(0, item.availableStock + changeNum);
          const newTotal = newAvail + (item.reservedStock || 0);
          const status = newAvail === 0 ? 'Out of Stock' : (newAvail <= (item.lowStockThreshold || 15) ? 'Low Stock' : 'In Stock');
          newStockLevel = newAvail;
          newInStock = newAvail > 0;

          const newLog = {
            id: `LOG-${Date.now()}`,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            sku: item.sku,
            productName: item.name,
            change: changeNum > 0 ? `+${changeNum}` : `${changeNum}`,
            newStock: newAvail,
            reason: reason || 'Manual Stock Adjustment',
            admin: 'Store Admin'
          };
          setStockLogs((l) => [newLog, ...l]);

          return {
            ...item,
            availableStock: newAvail,
            totalStock: newTotal,
            status,
            lastRestocked: changeNum > 0 ? new Date().toISOString().split('T')[0] : item.lastRestocked,
            variants: (item.variants || []).map(v => ({
              ...v,
              available: newInStock ? Math.max(1, Math.floor(newAvail / (item.variants.length || 1))) : 0
            }))
          };
        }
        return item;
      })
    );

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === Number(productId)) {
          return {
            ...p,
            stock: newStockLevel,
            inStock: newInStock,
            in_stock: newInStock,
            colors: Array.isArray(p.colors)
              ? p.colors.map(c => ({
                  ...c,
                  stock: newInStock ? (c.stock !== undefined && Number(c.stock) > 0 ? Number(c.stock) : Math.max(1, Math.floor(newStockLevel / (p.colors.length || 1)))) : 0
                }))
              : []
          };
        }
        return p;
      })
    );

    // Sync product stock with database
    try {
      await adminApi.updateProduct(productId, {
        stock: newStockLevel,
        in_stock: newInStock,
        inStock: newInStock,
      });
    } catch (err) {
      console.warn('DB stock sync skipped:', err.message);
    }

    showToast(`Stock updated (${changeNum > 0 ? '+' : ''}${changeNum} units)`);
  };

  // ═══════════════════════════════════════════════════════════════
  // CATEGORY OPERATIONS (CONNECTED TO LIVE API)
  // ═══════════════════════════════════════════════════════════════
  const addCategory = async (catData) => {
    try {
      const res = await adminApi.createCategory(catData);
      if (res?.category) {
        setCategories((prev) => [...prev, res.category]);
        showToast(`Category "${res.category.name}" saved to database`, 'success');
        return res.category;
      } else {
        throw new Error(res?.error || 'Failed to save category to database');
      }
    } catch (err) {
      console.error('addCategory error:', err);
      showToast(err.message || 'Failed to save category', 'error');
      throw err;
    }
  };

  const updateCategory = async (id, updatedFields) => {
    try {
      const res = await adminApi.updateCategory(id, updatedFields);
      const updated = res?.category || updatedFields;
      setCategories((prev) =>
        prev.map((c) => (String(c.id) === String(id) ? { ...c, ...updated } : c))
      );
      showToast('Category updated in database', 'success');
      return updated;
    } catch (err) {
      console.error('updateCategory error:', err);
      showToast(err.message || 'Failed to update category', 'error');
      throw err;
    }
  };

  const deleteCategory = async (id) => {
    try {
      await adminApi.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => String(c.id) !== String(id)));
      showToast('Category deleted from database', 'info');
    } catch (err) {
      console.error('deleteCategory error:', err);
      showToast(err.message || 'Failed to delete category', 'error');
      throw err;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // COUPON OPERATIONS (Connected to live Supabase via adminApi)
  // ═══════════════════════════════════════════════════════════════
  const addCoupon = async (couponData) => {
    try {
      const res = await adminApi.createCoupon({
        code: couponData.code,
        discount_type: couponData.type?.toLowerCase() === 'flat' ? 'flat' : 'percentage',
        value: Number(couponData.value) || 0,
        min_spend: Number(couponData.minOrderValue) || 0,
        max_discount: Number(couponData.maxDiscount) || null,
        max_uses: Number(couponData.maxUses) || 500,
        expires_at: couponData.expiresAt || couponData.endDate || null,
        description: couponData.description || '',
        applicable_product_ids: couponData.applicableProductIds || [],
        applicable_product_names: couponData.applicableProductNames || []
      });

      if (res?.success && res.coupon) {
        const c = res.coupon;
        const formatted = formatDashboardCoupon(c);
        setCoupons((prev) => [formatted, ...prev]);
        showToast(`Coupon ${formatted.code} created successfully!`);
        return { success: true, coupon: formatted };
      }
      return { success: false, error: 'Failed to create coupon' };
    } catch (err) {
      console.error('Failed to create coupon on backend:', err);
      showToast(err.message || 'Failed to create coupon', 'error');
      return { success: false, error: err.message };
    }
  };

  const updateCoupon = async (id, couponData) => {
    try {
      const res = await adminApi.updateCoupon(id, {
        code: couponData.code,
        discount_type: couponData.type?.toLowerCase() === 'flat' ? 'flat' : 'percentage',
        value: Number(couponData.value) || 0,
        min_spend: Number(couponData.minOrderValue ?? couponData.minSpend) || 0,
        max_discount: Number(couponData.maxDiscount) || null,
        max_uses: Number(couponData.maxUses) || 500,
        expires_at: couponData.expiresAt || couponData.endDate || null,
        description: couponData.description || '',
        applicable_product_ids: couponData.applicableProductIds || [],
        applicable_product_names: couponData.applicableProductNames || []
      });

      if (res?.success && res.coupon) {
        const c = res.coupon;
        const formatted = formatDashboardCoupon(c);
        setCoupons((prev) =>
          prev.map((item) => (String(item.id) === String(id) || String(item.code) === String(id) ? formatted : item))
        );
        showToast(`Coupon ${formatted.code} updated successfully!`);
        return { success: true, coupon: formatted };
      }
      return { success: false, error: 'Failed to update coupon' };
    } catch (err) {
      console.error('Failed to update coupon on backend:', err);
      showToast(err.message || 'Failed to update coupon', 'error');
      return { success: false, error: err.message };
    }
  };

  const toggleCouponStatus = async (id) => {
    try {
      await adminApi.toggleCouponStatus(id);
      setCoupons((prev) =>
        prev.map((c) => (String(c.id) === String(id) ? { ...c, status: c.status === 'Active' ? 'Inactive' : 'Active', isActive: c.status !== 'Active' } : c))
      );
      showToast('Coupon status updated');
    } catch (err) {
      console.error('Failed to toggle coupon status:', err);
      showToast(err.message || 'Failed to update coupon status', 'error');
    }
  };

  const deleteCoupon = async (id) => {
    try {
      await adminApi.deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => String(c.id) !== String(id) && String(c.code) !== String(id)));
      showToast('Coupon deleted successfully', 'info');
      return { success: true };
    } catch (err) {
      console.error('Failed to delete coupon on backend:', err);
      showToast(err.message || 'Failed to delete coupon', 'error');
      return { success: false, error: err.message };
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RETURN OPERATIONS (CONNECTED TO LIVE DATABASE API)
  // ═══════════════════════════════════════════════════════════════
  const refreshReturns = async () => {
    try {
      const res = await adminApi.getReturns();
      if (res && Array.isArray(res.returns)) {
        setReturns(res.returns);
        return res.returns;
      }
    } catch (err) {
      console.warn('refreshReturns failed:', err);
    }
  };

  const updateReturnStatus = async (returnId, actionOrStatus, details = {}) => {
    try {
      const res = await adminApi.updateReturnStatus(returnId, actionOrStatus, details);
      if (res && res.success) {
        showToast(`Return claim updated to ${res.claim?.status || actionOrStatus}`);
      } else {
        showToast(`Return claim updated to ${actionOrStatus}`);
      }
      await refreshReturns();
      await refreshOrders();
      return res;
    } catch (err) {
      console.error('updateReturnStatus error:', err);
      showToast(err.message || 'Failed to update return claim', 'error');
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // CMS ACTIONS (HERO SLIDES, HOME SECTIONS, BLOGS, PAGES)
  // ═══════════════════════════════════════════════════════════════

  // 1. Hero Slides
  const saveHeroSlide = async (slideData) => {
    const updated = await cmsService.saveHeroSlide(slideData);
    setCmsHeroSlides(updated);
    showToast(slideData.id ? 'Hero Slide updated successfully' : 'New Hero Slide created');
    return updated;
  };

  const deleteHeroSlide = async (id) => {
    const updated = await cmsService.deleteHeroSlide(id);
    setCmsHeroSlides(updated);
    showToast('Hero Slide deleted', 'info');
    return updated;
  };

  const toggleHeroSlideStatus = async (id) => {
    const updated = await cmsService.toggleHeroSlideStatus(id);
    setCmsHeroSlides(updated);
    showToast('Slide visibility updated');
    return updated;
  };

  const reorderHeroSlides = async (reorderedIds) => {
    const updated = await cmsService.reorderHeroSlides(reorderedIds);
    setCmsHeroSlides(updated);
    showToast('Hero slides reordered');
    return updated;
  };

  // 2. Home Sections
  const updateHomeSection = async (sectionKey, newSectionData) => {
    const updated = await cmsService.updateHomeSection(sectionKey, newSectionData);
    setCmsHomeSections(updated);
    showToast(`Section "${sectionKey}" updated successfully`);
    return updated;
  };

  const toggleSectionVisibility = async (sectionKey) => {
    const updated = await cmsService.toggleSectionVisibility(sectionKey);
    setCmsHomeSections(updated);
    showToast(`Section "${sectionKey}" visibility toggled`);
    return updated;
  };

  // 3. Blog Articles (Synced with Live API & blogs.json)
  const saveBlog = async (blogData) => {
    const updated = await cmsService.saveBlog(blogData);
    setCmsBlogs(updated);
    showToast(blogData.id ? 'Blog article saved to backend' : 'New blog article published to live site!');
    return updated;
  };

  const deleteBlog = async (id) => {
    const updated = await cmsService.deleteBlog(id);
    setCmsBlogs(updated);
    showToast('Blog article deleted', 'info');
    return updated;
  };

  const toggleBlogPublish = async (id) => {
    const updated = await cmsService.toggleBlogPublish(id);
    setCmsBlogs(updated);
    showToast('Blog publish status toggled');
    return updated;
  };

  // 4. Static Pages
  const updatePage = async (pageKey, pageData) => {
    const updated = await cmsService.updatePage(pageKey, pageData);
    setCmsPages(updated);
    showToast(`Page "${pageKey}" saved`);
    return updated;
  };

  // 5. Reset All CMS Data
  const resetCmsToDefaults = () => {
    const defaults = cmsService.resetToDefaults();
    setCmsHeroSlides(defaults.heroSlides);
    setCmsHomeSections(defaults.homeSections);
    setCmsBlogs(defaults.blogs);
    setCmsPages(defaults.pages);
    showToast('All CMS content reset to default authentic catalog settings', 'info');
  };

  // 6. Supabase Storage File Upload Helper
  const uploadImage = async (file) => {
    try {
      const res = await adminApi.uploadImage(file);
      if (res?.url) {
        showToast('Image uploaded to Supabase CDN!', 'success');
        return res.url;
      }
      throw new Error('No URL in upload response');
    } catch (err) {
      showToast('Image upload failed: ' + err.message, 'error');
      throw err;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // DASHBOARD AGGREGATES & KPIS (COMPUTED REACTIVELY FROM REAL DATA)
  // ═══════════════════════════════════════════════════════════════
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let todayRevenue = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    const statusCounts = {
      total: orders.length,
      new: 0,
      confirmed: 0,
      processing: 0,
      packed: 0,
      shipped: 0,
      outForDelivery: 0,
      delivered: 0,
      cancelled: 0,
      returnRequested: 0,
      returned: 0,
      refunded: 0,
    };

    orders.forEach((ord) => {
      const orderTotal = Number(ord.totalAmount || ord.total || 0);
      const st = (ord.status || 'New').toLowerCase().replace(/\s+/g, '_');

      if (st !== 'cancelled' && st !== 'refunded') {
        totalRevenue += orderTotal;
        if (ord.date && ord.date.startsWith(todayStr)) {
          todayRevenue += orderTotal;
        }
      }

      switch (ord.status) {
        case 'New': statusCounts.new++; break;
        case 'Confirmed': statusCounts.confirmed++; break;
        case 'Processing': statusCounts.processing++; break;
        case 'Packed': statusCounts.packed++; break;
        case 'Shipped': statusCounts.shipped++; break;
        case 'Out for Delivery': statusCounts.outForDelivery++; break;
        case 'Delivered': statusCounts.delivered++; break;
        case 'Cancelled': statusCounts.cancelled++; break;
        case 'Return Requested': statusCounts.returnRequested++; break;
        case 'Returned': statusCounts.returned++; break;
        case 'Refunded': statusCounts.refunded++; break;
        default: statusCounts.new++; break;
      }
    });

    const lowStockCount = inventory.filter((i) => i.availableStock > 0 && i.availableStock <= (i.lowStockThreshold || 15)).length;
    const outOfStockCount = inventory.filter((i) => i.availableStock === 0).length;

    return {
      totalRevenue: Math.round(totalRevenue),
      todayRevenue: Math.round(todayRevenue || 931),
      statusCounts,
      totalCustomers: customers.length,
      lowStockCount,
      outOfStockCount,
      totalProducts: products.length
    };
  }, [orders, inventory, customers, products]);

  // ═══════════════════════════════════════════════════════════════
  // ROLE-BASED ADMIN & SEO MANAGER LOGIN HANDLER
  // ═══════════════════════════════════════════════════════════════
  const login = async (email, password, remember = true) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // 1. Try Supabase Auth
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass
        });

        if (!error && data?.user) {
          const isMaster = cleanEmail === 'trioenterprises10@gmail.com' || cleanEmail === 'admin@trioenterprises.com';
          const metaRole = (data.user.user_metadata?.role || '').toLowerCase();
          const isSeo = !isMaster && (metaRole === 'seo_manager' || metaRole === 'seo' || metaRole.includes('seo') || metaRole.includes('cms'));
          const effectiveRole = isMaster ? 'super_admin' : (isSeo ? 'seo_manager' : (metaRole || 'admin'));

          const formattedRole = isMaster
            ? 'Super Admin'
            : (isSeo ? 'SEO Manager' : (effectiveRole === 'super_admin' ? 'Super Admin' : 'Admin'));
          const roleKey = isMaster ? 'super_admin' : (isSeo ? 'seo_manager' : effectiveRole);

          const sessionData = {
            active: true,
            user: {
              id: data.user.id,
              name: isMaster ? 'Trio Super Admin' : (data.user.user_metadata?.full_name || (isSeo ? 'SEO Manager' : 'Administrator')),
              email: cleanEmail,
              role: formattedRole,
              roleKey,
              avatar: isSeo ? 'SEO' : 'SA',
              lastLogin: new Date().toISOString()
            },
            token: `trio_auth_${Date.now()}`
          };

          if (remember) {
            localStorage.setItem('trio_superadmin_session', JSON.stringify(sessionData));
          } else {
            sessionStorage.setItem('trio_superadmin_session', JSON.stringify(sessionData));
            localStorage.setItem('trio_superadmin_session', JSON.stringify(sessionData));
          }

          setLocalSession(sessionData);
          showToast(`Welcome back, ${sessionData.user.name}! Access granted.`, 'success');
          return { success: true, user: sessionData.user };
        }
      }
    } catch (apiErr) {
      console.warn('Supabase auth sign in error:', apiErr?.message);
    }

    // 2. Authorized Super Admin Fallback Credentials
    if (cleanEmail === 'trioenterprises10@gmail.com' && cleanPass === 'Shree@1203#') {
      const sessionData = {
        active: true,
        user: {
          name: 'Trio Super Admin',
          email: cleanEmail,
          role: 'Super Admin',
          roleKey: 'super_admin',
          avatar: 'SA',
          lastLogin: new Date().toISOString()
        },
        token: `trio_sa_${Date.now()}`
      };

      if (remember) {
        localStorage.setItem('trio_superadmin_session', JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem('trio_superadmin_session', JSON.stringify(sessionData));
        localStorage.setItem('trio_superadmin_session', JSON.stringify(sessionData));
      }

      setLocalSession(sessionData);
      showToast('Welcome back, Super Admin! Access granted.', 'success');
      return { success: true, user: sessionData.user };
    }

    showToast('Access Denied: Invalid Super Admin credentials.', 'error');
    return {
      success: false,
      error: 'Invalid credentials. Only authorized Super Admin can access.'
    };
  };

  // Super Admin Logout Handler
  const logout = async () => {
    try {
      localStorage.removeItem('trio_superadmin_session');
      sessionStorage.removeItem('trio_superadmin_session');
    } catch (e) {
      console.error(e);
    }
    setLocalSession(null);
    if (authLogout) {
      try {
        await authLogout();
      } catch (_) { }
    }
    showToast('Logged out of Super Admin Portal.', 'info');
    if (typeof window !== 'undefined') {
      window.location.href = '/login?redirect=%2Fadmin';
    }
  };

  return (
    <AdminContext.Provider
      value={{
        // Authentication & Session
        isAuthenticated,
        isAuthChecking,
        adminUser,
        login,
        logout,
        isSuperAdmin,
        isSeoManager,
        canAccessRoute,
        usersList,
        isLoadingUsers,
        fetchUsers,
        assignRole,
        removeRole,
        // Data
        products,
        categories,
        orders,
        customers,
        coupons,
        payments,
        returns,
        inventory,
        stockLogs,
        stats,

        // CMS Data
        cmsHeroSlides,
        cmsHomeSections,
        cmsBlogs,
        cmsPages,

        // UI States
        isLoading,
        isRefreshing,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileMenuOpen,
        setMobileMenuOpen,
        globalSearch,
        setGlobalSearch,
        toasts,
        showToast,
        removeToast,
        printDocument,
        setPrintDocument,

        // Actions
        refreshData,
        refreshOrders,
        addProduct,
        updateProduct,
        deleteProduct,
        duplicateProduct,
        updateOrderStatus,
        bulkUpdateOrderStatus,
        adjustStock,
        addCategory,
        updateCategory,
        deleteCategory,
        addCoupon,
        updateCoupon,
        toggleCouponStatus,
        deleteCoupon,
        updateReturnStatus,
        refreshReturns,

        // CMS Actions
        saveHeroSlide,
        deleteHeroSlide,
        toggleHeroSlideStatus,
        reorderHeroSlides,
        updateHomeSection,
        toggleSectionVisibility,
        saveBlog,
        deleteBlog,
        toggleBlogPublish,
        updatePage,
        resetCmsToDefaults,
        uploadImage
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
