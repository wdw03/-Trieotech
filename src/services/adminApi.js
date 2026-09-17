import { supabase } from './adminSupabase.js';
// Centralized API Client for Trio Ecart Admin Dashboard
// Direct live production backend fallback for Vercel deployments
const API_BASE = '/api';
const TRIOTECH_FALLBACK = 'https://trieotech.vercel.app/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // If body is FormData, don't set Content-Type header (browser sets boundary)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errMsg = `HTTP Error ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.error) errMsg = errJson.error;
      } catch {
        // use default
      }
      throw new Error(errMsg);
    }

    return await res.json();
  } catch (err) {
    console.warn(`[API] Request failed for ${endpoint}:`, err.message);
    // Fallback to trieotech.vercel.app if primary backend fails
    try {
      const fallbackUrl = `${TRIOTECH_FALLBACK}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      const fbRes = await fetch(fallbackUrl, { ...options, headers });
      if (fbRes.ok) return await fbRes.json();
    } catch (_) {}
    throw err;
  }
}

export const adminApi = {
  // Helper to normalize product records for admin dashboard
  normalizeProductRecord: (p) => {
    if (!p) return null;
    const stock = Number(p.stock ?? 0);
    const inStock = Boolean(p.in_stock ?? p.inStock ?? true) && stock > 0;
    const isVisible = p.is_visible !== undefined ? Boolean(p.is_visible) : (p.isVisible !== undefined ? Boolean(p.isVisible) : true);
    const origPrice = Number(p.original_price ?? p.originalPrice ?? p.price ?? 0);
    const price = Number(p.price ?? 0);
    const colors = Array.isArray(p.colors)
      ? p.colors.map(c => typeof c === 'object' && c !== null ? {
          ...c,
          stock: inStock ? (c.stock !== undefined ? Number(c.stock) : stock) : 0,
          price: c.price !== undefined ? Number(c.price) : price,
          originalPrice: c.originalPrice !== undefined ? Number(c.originalPrice) : origPrice,
        } : { name: String(c), hex: '#C5A028', stock: inStock ? stock : 0, price, originalPrice: origPrice })
      : [];

    const desc = p.description || p.full_description || p.fullDescription || p.short_description || p.shortDescription || '';
    const fullDesc = p.full_description || p.fullDescription || desc || '';
    const shortDesc = p.short_description || p.shortDescription || (desc ? String(desc).slice(0, 160) : '') || '';

    return {
      ...p,
      id: Number(p.id),
      stock: inStock ? stock : 0,
      inStock,
      in_stock: inStock,
      price,
      originalPrice: origPrice,
      original_price: origPrice,
      is_visible: isVisible,
      isVisible,
      colors,
      description: desc,
      shortDescription: shortDesc,
      short_description: shortDesc,
      fullDescription: fullDesc,
      full_description: fullDesc,
    };
  },

  // Statistics
  getStats: async () => {
    return request('/admin/stats');
  },

  // Products (Direct Supabase SDK query for complete catalog + API fallback)
  getProducts: async (params = {}) => {
    try {
      let q = supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (params.category && params.category !== 'All') {
        q = q.ilike('category', '%' + params.category + '%');
      }

      if (params.search) {
        q = q.or('name.ilike.%' + params.search + '%,slug.ilike.%' + params.search + '%,category.ilike.%' + params.search + '%');
      }

      const { data, error } = await q;
      if (!error && Array.isArray(data) && data.length > 0) {
        return { products: data.map(adminApi.normalizeProductRecord), total: data.length };
      }
    } catch (e) {
      console.warn('Supabase direct getProducts fallback:', e.message);
    }
    const query = new URLSearchParams(params).toString();
    const res = await request(`/admin/products${query ? `?${query}` : ''}`);
    if (res?.products && Array.isArray(res.products)) {
      return { ...res, products: res.products.map(adminApi.normalizeProductRecord) };
    }
    return res;
  },

  createProduct: async (productData) => {
    const res = await request('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    if (res?.product) {
      res.product = adminApi.normalizeProductRecord(res.product);
    }
    return res;
  },

  updateProduct: async (id, productData) => {
    const res = await request(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
    if (res?.product) {
      res.product = adminApi.normalizeProductRecord(res.product);
    }
    return res;
  },

  deleteProduct: async (id) => {
    return request(`/admin/products/${id}`, {
      method: 'DELETE',
    });
  },

  uploadProductImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/admin/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // Orders
  getOrder: async (orderId) => {
    return request(`/admin/orders/${orderId}`);
  },

  getOrders: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/orders${query ? `?${query}` : ''}`);
  },

  updateOrderStatus: async (orderId, status, details = {}) => {
    return request(`/admin/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...details }),
    });
  },

  // Categories (Dual Supabase Direct + Backend API Fallback)
  getCategories: async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        return { categories: data };
      }
    } catch (e) {
      console.warn('Supabase direct getCategories fallback:', e.message);
    }
    return request('/admin/categories');
  },

  createCategory: async (categoryData) => {
    return request('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  updateCategory: async (id, categoryData) => {
    return request(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  deleteCategory: async (id) => {
    return request(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },

  uploadCategoryImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await request('/admin/categories/upload', {
        method: 'POST',
        body: formData,
      });
      if (res && res.url) {
        return res;
      }
    } catch (apiErr) {
      console.warn('Server uploadCategoryImage fallback to client:', apiErr?.message);
    }

    // Direct Supabase storage fallback
    try {
      const timestamp = Date.now();
      const cleanName = (file.name || 'image.jpg')
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      const fileName = 'categories/' + timestamp + '-' + cleanName;
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, file, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

      if (!error && data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('products').getPublicUrl(fileName);
        return { success: true, url: publicUrl, fileName };
      }
    } catch (e) {
      console.warn('Supabase direct uploadCategoryImage fallback:', e.message);
    }
    throw new Error('Failed to upload category image to server');
  },

  // Customers
  getCustomers: async () => {
    return request('/admin/customers');
  },

  // Instagram Reels CMS Management (Dual Supabase Direct + Backend API Fallback)
  getReels: async (params = {}) => {
    try {
      let q = supabase
        .from('reels')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (params.status === 'active') q = q.eq('is_active', true);
      else if (params.status === 'inactive') q = q.eq('is_active', false);

      if (params.search) {
        q = q.or(`influencer_name.ilike.%${params.search}%,influencer_username.ilike.%${params.search}%,caption.ilike.%${params.search}%,product_name.ilike.%${params.search}%`);
      }

      const { data, error } = await q;
      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase direct getReels fallback:', e.message);
    }
    const query = new URLSearchParams(params).toString();
    return request(`/admin/reels${query ? `?${query}` : ''}`);
  },

  createReel: async (reelData) => {
    try {
      const payload = { ...reelData };
      delete payload.id;
      const { data, error } = await supabase.from('reels').insert([payload]).select().single();
      if (!error && data) return { success: true, reel: data };
    } catch (e) {
      console.warn('Supabase direct createReel fallback:', e.message);
    }
    return request('/admin/reels', {
      method: 'POST',
      body: JSON.stringify(reelData),
    });
  },

  updateReel: async (id, reelData) => {
    try {
      const payload = { ...reelData, updated_at: new Date().toISOString() };
      delete payload.id;
      const { data, error } = await supabase
        .from('reels')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return { success: true, reel: data };
    } catch (e) {
      console.warn('Supabase direct updateReel fallback:', e.message);
    }
    return request(`/admin/reels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reelData),
    });
  },

  deleteReel: async (id) => {
    try {
      const { error } = await supabase.from('reels').delete().eq('id', id);
      if (!error) return { success: true, message: 'Deleted' };
    } catch (e) {
      console.warn('Supabase direct deleteReel fallback:', e.message);
    }
    return request(`/admin/reels/${id}`, {
      method: 'DELETE',
    });
  },

  uploadReelVideo: async (file) => {
    try {
      const timestamp = Date.now();
      const cleanName = (file.name || 'video.mp4')
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      const fileName = `${timestamp}-${cleanName}`;
      const { data, error } = await supabase.storage
        .from('reels')
        .upload(fileName, file, {
          contentType: file.type || 'video/mp4',
          upsert: true,
        });

      if (!error && data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('reels').getPublicUrl(fileName);
        return { success: true, url: publicUrl, fileName };
      }
    } catch (e) {
      console.warn('Supabase direct upload fallback:', e.message);
    }
    const formData = new FormData();
    formData.append('file', file);
    return request('/admin/reels/upload', {
      method: 'POST',
      body: formData,
    });
  },


  // Hero Slides & Banners CMS (Dual Supabase Direct + Backend API Fallback)
  getHeroSlides: async () => {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase direct getHeroSlides fallback:', e.message);
    }
    return request('/admin/banners').then(res => res?.slides || []);
  },

  createHeroSlide: async (slideData) => {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .insert([slideData])
        .select()
        .single();
      if (!error && data) return { success: true, slide: data };
    } catch (e) {
      console.warn('Supabase direct createHeroSlide fallback:', e.message);
    }
    return request('/admin/banners', {
      method: 'POST',
      body: JSON.stringify(slideData),
    });
  },

  updateHeroSlide: async (id, slideData) => {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .update({ ...slideData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return { success: true, slide: data };
    } catch (e) {
      console.warn('Supabase direct updateHeroSlide fallback:', e.message);
    }
    return request(`/admin/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(slideData),
    });
  },

  deleteHeroSlide: async (id) => {
    try {
      const { error } = await supabase.from('hero_slides').delete().eq('id', id);
      if (!error) return { success: true, message: 'Slide deleted' };
    } catch (e) {
      console.warn('Supabase direct deleteHeroSlide fallback:', e.message);
    }
    return request(`/admin/banners/${id}`, {
      method: 'DELETE',
    });
  },

  uploadBannerImage: async (file) => {
    try {
      const timestamp = Date.now();
      const cleanName = (file.name || 'banner.jpg')
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      const fileName = 'banners/' + timestamp + '-' + cleanName;
      const { data, error } = await supabase.storage
        .from('banners')
        .upload(fileName, file, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

      if (!error && data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('banners').getPublicUrl(fileName);
        return { success: true, url: publicUrl, fileName };
      }
    } catch (e) {
      console.warn('Supabase direct uploadBannerImage fallback:', e.message);
    }
    const formData = new FormData();
    formData.append('file', file);
    return request('/admin/banners/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // Home Page Sections CMS (Dual Supabase Direct + Backend API Fallback)
  getHomeSections: async () => {
    try {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .order('section_key', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        const sectionsObj = {};
        for (const row of data) {
          sectionsObj[row.section_key] = {
            id: row.section_key,
            sectionKey: row.section_key,
            name: row.name,
            isEnabled: Boolean(row.is_enabled),
            is_enabled: Boolean(row.is_enabled),
            description: row.description,
            ...(row.config || {})
          };
        }
        return sectionsObj;
      }
    } catch (e) {
      console.warn('Supabase direct getHomeSections fallback:', e.message);
    }
    return request('/home-sections').then(res => res?.sections || {});
  },

  updateHomeSection: async (sectionKey, sectionData) => {
    try {
      const isEnabled = sectionData.isEnabled !== undefined ? Boolean(sectionData.isEnabled) : (sectionData.is_enabled !== undefined ? Boolean(sectionData.is_enabled) : true);
      const { data, error } = await supabase
        .from('home_sections')
        .upsert({
          section_key: sectionKey,
          name: sectionData.name || sectionKey,
          is_enabled: isEnabled,
          config: sectionData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (!error && data) return { success: true, section: data };
    } catch (e) {
      console.warn('Supabase direct updateHomeSection fallback:', e.message);
    }
    return request('/home-sections', {
      method: 'PUT',
      body: JSON.stringify({ sectionKey, ...sectionData }),
    });
  },

  toggleSectionVisibility: async (sectionKey, isEnabled) => {
    try {
      const { data, error } = await supabase
        .from('home_sections')
        .update({ is_enabled: Boolean(isEnabled), updated_at: new Date().toISOString() })
        .eq('section_key', sectionKey)
        .select()
        .single();
      if (!error && data) return { success: true, section: data };
    } catch (e) {
      console.warn('Supabase direct toggleSectionVisibility fallback:', e.message);
    }
    return request('/home-sections', {
      method: 'PUT',
      body: JSON.stringify({ sectionKey, isEnabled }),
    });
  },

  // Blogs CMS
  getBlogs: async () => {
    return request('/blogs');
  },

  createBlog: async (blogData) => {
    return request('/blogs', {
      method: 'POST',
      body: JSON.stringify(blogData),
    });
  },

  updateBlog: async (slug, blogData) => {
    return request(`/blogs/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(blogData),
    });
  },

  deleteBlog: async (slug) => {
    return request(`/blogs/${slug}`, {
      method: 'DELETE',
    });
  },

  // File Upload to Supabase Storage CDN
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/admin/upload', {
      method: 'POST',
      body: formData,
    });
  },

  uploadBlogImage: async (file, alt = '') => {
    const formData = new FormData();
    formData.append('file', file);
    if (alt) formData.append('alt', alt);
    return request('/admin/upload/blog', {
      method: 'POST',
      body: formData,
    });
  },

  // FAQ Management
  getFaqs: async (params = {}) => {
    const qs = params && params.all ? '?all=true' : '';
    return request('/faqs' + qs);
  },

  createFaq: async (faqData) => {
    return request('/faqs', {
      method: 'POST',
      body: JSON.stringify(faqData),
    });
  },

  updateFaq: async (id, faqData) => {
    return request('/faqs', {
      method: 'PUT',
      body: JSON.stringify({ id, ...faqData }),
    });
  },

  deleteFaq: async (id) => {
    return request('/faqs?id=' + id, {
      method: 'DELETE',
    });
  },

  // COD Serviceable Pincodes Management
  getCodPincodes: async () => {
    return request('/admin/cod-pincodes');
  },

  addCodPincodes: async (data) => {
    return request('/admin/cod-pincodes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteCodPincode: async (pincode) => {
    return request(`/admin/cod-pincodes?pincode=${encodeURIComponent(pincode)}`, {
      method: 'DELETE',
    });
  },

  toggleGlobalCod: async (enabled) => {
    return request('/admin/cod-pincodes', {
      method: 'PATCH',
      body: JSON.stringify({ cod_enabled_globally: enabled }),
    });
  },

  // Coupons Management
  getCoupons: async () => {
    return request('/admin/coupons');
  },

  createCoupon: async (couponData) => {
    return request('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(couponData),
    });
  },

  updateCoupon: async (id, couponData) => {
    return request('/admin/coupons/' + id, {
      method: 'PUT',
      body: JSON.stringify(couponData),
    });
  },

  deleteCoupon: async (id) => {
    return request('/admin/coupons/' + id, {
      method: 'DELETE',
    });
  },

  toggleCouponStatus: async (id) => {
    return request('/admin/coupons/' + id, {
      method: 'PATCH',
      body: JSON.stringify({ toggleStatus: true }),
    });
  },

  // Customer Contact Inquiries
  getContactMessages: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request('/admin/contact' + (query ? '?' + query : ''));
  },

  updateContactMessage: async (id, data) => {
    return request('/admin/contact/' + id, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteContactMessage: async (id) => {
    return request('/admin/contact/' + id, {
      method: 'DELETE',
    });
  },

  // Shiprocket Shipment Actions
  createShipment: async (orderId) => {
    return request('/admin/shipments/create', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  },

  assignAWB: async (orderId, courierId) => {
    return request('/admin/shipments/awb', {
      method: 'POST',
      body: JSON.stringify({ orderId, courierId }),
    });
  },

  getShiprocketLabel: async (params, directShipmentId) => {
    let payload = {};
    if (typeof params === 'string') {
      payload = { orderId: params, shipmentId: directShipmentId };
    } else if (Array.isArray(params)) {
      payload = { orderIds: params };
    } else if (typeof params === 'object' && params !== null) {
      payload = params;
    }
    return request('/admin/shipments/label', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  cancelShipment: async (orderId, reason = 'Cancelled by store administrator') => {
    return request('/admin/shipments/cancel', {
      method: 'POST',
      body: JSON.stringify({ orderId, reason }),
    });
  },

  requestPickup: async (orderId) => {
    return request('/admin/shipments/pickup', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  },

  // Return & Refund Claims
  getReturns: async () => {
    return request('/admin/returns');
  },

  // User & Staff Role Management (Super Admin Exclusive)
  getUsers: async (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/admin/users${query}`);
  },

  assignUserRole: async (userId, email, newRole, requesterEmail = '') => {
    return request('/admin/users/assign-role', {
      method: 'POST',
      body: JSON.stringify({ userId, email, newRole, requesterEmail }),
    });
  },

  sendAdminResetOtp: async (email) => {
    return request('/admin/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetAdminPassword: async ({ email, otp, verificationToken, expiresAt, newPassword }) => {
    return request('/admin/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, verificationToken, expiresAt, newPassword }),
    });
  },

  verifyAdminLogin: async (email, password = '') => {
    return request('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  updateReturnStatus: async (id, action, details = {}) => {
    return request(`/admin/returns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, ...details }),
    });
  },
};
