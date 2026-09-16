import {
  initialHeroSlides,
  initialHomeSections,
  initialCmsBlogs,
  initialCmsPages
} from '../data/admin/initialCmsData.js';
import { adminApi } from './adminApi.js';

const STORAGE_KEYS = {
  HERO_SLIDES: 'trio_cms_hero_slides_v1',
  HOME_SECTIONS: 'trio_cms_home_sections_v1',
  BLOGS: 'trio_cms_blogs_v1',
  PAGES: 'trio_cms_pages_v1'
};

// Helper to read from localStorage with fallback
const getStorageData = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
    return fallback;
  }
};

// Helper to write to localStorage
const setStorageData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
};

// Helper to normalize slide properties between DB (snake_case) and UI (camelCase)
export const normalizeSlide = (s) => ({
  id: s.id,
  title: s.title || '',
  mobileTitle: s.mobile_title || s.mobileTitle || s.title || '',
  mobile_title: s.mobile_title || s.mobileTitle || s.title || '',
  subtitle: s.subtitle || '',
  mobileSubtitle: s.mobile_subtitle || s.mobileSubtitle || s.subtitle || '',
  mobile_subtitle: s.mobile_subtitle || s.mobileSubtitle || s.subtitle || '',
  badge: s.badge || 'Festive Special',
  tag: s.tag || 'Authentic Craft',
  ctaText: s.cta_text || s.ctaText || 'Shop Now',
  cta_text: s.cta_text || s.ctaText || 'Shop Now',
  desktopCtaText: s.desktop_cta_text || s.desktopCtaText || s.cta_text || s.ctaText || 'Explore Collection',
  desktop_cta_text: s.desktop_cta_text || s.desktopCtaText || s.cta_text || s.ctaText || 'Explore Collection',
  mobileCtaText: s.mobile_cta_text || s.mobileCtaText || s.cta_text || s.ctaText || 'Shop Now',
  mobile_cta_text: s.mobile_cta_text || s.mobileCtaText || s.cta_text || s.ctaText || 'Shop Now',
  ctaLink: s.cta_link || s.ctaLink || '/shop',
  cta_link: s.cta_link || s.ctaLink || '/shop',
  secondaryCtaText: s.secondary_cta_text || s.secondaryCtaText || 'Learn More',
  secondary_cta_text: s.secondary_cta_text || s.secondaryCtaText || 'Learn More',
  secondaryCtaLink: s.secondary_cta_link || s.secondaryCtaLink || '/blog',
  secondary_cta_link: s.secondary_cta_link || s.secondaryCtaLink || '/blog',
  image: s.desktop_image || s.image || s.desktopImage || '/products/shreenathji-statement-patch-1.jpg',
  desktopImage: s.desktop_image || s.image || s.desktopImage || '/products/shreenathji-statement-patch-1.jpg',
  desktop_image: s.desktop_image || s.image || s.desktopImage || '/products/shreenathji-statement-patch-1.jpg',
  mobileImage: s.mobile_image || s.mobileImage || s.desktop_image || s.image || '',
  mobile_image: s.mobile_image || s.mobileImage || s.desktop_image || s.image || '',
  secondaryImage: s.secondary_image || s.secondaryImage || '',
  secondary_image: s.secondary_image || s.secondaryImage || '',
  order: Number(s.display_order ?? s.order ?? 0),
  display_order: Number(s.display_order ?? s.order ?? 0),
  isActive: s.is_active !== undefined ? Boolean(s.is_active) : (s.isActive !== undefined ? Boolean(s.isActive) : true),
  is_active: s.is_active !== undefined ? Boolean(s.is_active) : (s.isActive !== undefined ? Boolean(s.isActive) : true),
  created_at: s.created_at,
  updated_at: s.updated_at
});

export const cmsService = {
  // ═══════════════════════════════════════════════════════════════
  // HERO SLIDES CRUD (Synced with Supabase hero_slides table)
  // ═══════════════════════════════════════════════════════════════
  getHeroSlides: async () => {
    try {
      const slides = await adminApi.getHeroSlides();
      if (Array.isArray(slides) && slides.length > 0) {
        const normalized = slides.map(normalizeSlide);
        setStorageData(STORAGE_KEYS.HERO_SLIDES, normalized);
        return normalized;
      }
    } catch (err) {
      console.warn('API getHeroSlides fallback to local storage:', err.message);
    }
    const cached = getStorageData(STORAGE_KEYS.HERO_SLIDES, initialHeroSlides);
    return cached.map(normalizeSlide);
  },

  saveHeroSlide: async (slideData) => {
    const payload = {
      title: (slideData.title || '').trim(),
      mobile_title: (slideData.mobileTitle || slideData.mobile_title || slideData.title || '').trim(),
      subtitle: (slideData.subtitle || '').trim(),
      mobile_subtitle: (slideData.mobileSubtitle || slideData.mobile_subtitle || slideData.subtitle || '').trim(),
      badge: (slideData.badge || 'Festive Special').trim(),
      tag: (slideData.tag || 'Authentic Craft').trim(),
      cta_text: (slideData.mobileCtaText || slideData.ctaText || slideData.cta_text || 'Shop Now').trim(),
      desktop_cta_text: (slideData.desktopCtaText || slideData.desktop_cta_text || slideData.ctaText || 'Explore Collection').trim(),
      mobile_cta_text: (slideData.mobileCtaText || slideData.mobile_cta_text || slideData.ctaText || 'Shop Now').trim(),
      cta_link: (slideData.ctaLink || slideData.cta_link || '/shop').trim(),
      secondary_cta_text: (slideData.secondaryCtaText || slideData.secondary_cta_text || 'Learn More').trim(),
      secondary_cta_link: (slideData.secondaryCtaLink || slideData.secondary_cta_link || '/blog').trim(),
      desktop_image: (slideData.desktopImage || slideData.desktop_image || slideData.image || '').trim(),
      mobile_image: (slideData.mobileImage || slideData.mobile_image || slideData.desktopImage || slideData.image || '').trim(),
      secondary_image: (slideData.secondaryImage || slideData.secondary_image || '').trim(),
      display_order: Number(slideData.display_order ?? slideData.order ?? 0),
      is_active: slideData.isActive !== undefined ? Boolean(slideData.isActive) : (slideData.is_active !== undefined ? Boolean(slideData.is_active) : true),
    };

    try {
      if (slideData.id) {
        await adminApi.updateHeroSlide(slideData.id, payload);
      } else {
        await adminApi.createHeroSlide(payload);
      }
      return await cmsService.getHeroSlides();
    } catch (err) {
      console.warn('API saveHeroSlide failed, updating local storage:', err.message);
      const slides = getStorageData(STORAGE_KEYS.HERO_SLIDES, initialHeroSlides);
      let updated;
      if (slideData.id) {
        updated = slides.map((s) => (s.id === slideData.id ? normalizeSlide({ ...s, ...slideData, ...payload }) : s));
      } else {
        const newSlide = normalizeSlide({
          ...slideData,
          ...payload,
          id: `SLIDE-${Date.now()}`,
          order: slides.length + 1
        });
        updated = [...slides, newSlide];
      }
      setStorageData(STORAGE_KEYS.HERO_SLIDES, updated);
      return updated;
    }
  },

  deleteHeroSlide: async (id) => {
    try {
      if (id) {
        await adminApi.deleteHeroSlide(id);
      }
    } catch (err) {
      console.warn('API deleteHeroSlide failed:', err.message);
    }
    const slides = getStorageData(STORAGE_KEYS.HERO_SLIDES, initialHeroSlides);
    const updated = slides.filter((s) => s.id !== id);
    setStorageData(STORAGE_KEYS.HERO_SLIDES, updated);
    return updated;
  },

  toggleHeroSlideStatus: async (id) => {
    const slides = await cmsService.getHeroSlides();
    const target = slides.find((s) => s.id === id);
    const newActive = target ? !(target.isActive ?? target.is_active) : true;

    try {
      if (id) {
        await adminApi.updateHeroSlide(id, { is_active: newActive });
      }
    } catch (err) {
      console.warn('API toggleHeroSlideStatus failed:', err.message);
    }

    const updated = slides.map((s) => (s.id === id ? { ...s, isActive: newActive, is_active: newActive } : s));
    setStorageData(STORAGE_KEYS.HERO_SLIDES, updated);
    return updated;
  },

  reorderHeroSlides: async (reorderedIds) => {
    const slides = await cmsService.getHeroSlides();
    const updated = reorderedIds.map((id, index) => {
      const found = slides.find((s) => s.id === id);
      return { ...found, order: index + 1, display_order: index + 1 };
    });

    // Fire non-blocking updates to DB
    reorderedIds.forEach((id, index) => {
      if (id) {
        adminApi.updateHeroSlide(id, { display_order: index + 1 }).catch(() => {});
      }
    });

    setStorageData(STORAGE_KEYS.HERO_SLIDES, updated);
    return updated;
  },

    // -------------------------------------------------------------
  // HOME SECTIONS CONFIG (Live Supabase Sync + LocalStorage Cache)
  // -------------------------------------------------------------
  getHomeSections: async () => {
    try {
      if (adminApi.getHomeSections) {
        const live = await adminApi.getHomeSections();
        if (live && Object.keys(live).length > 0) {
          const merged = { ...initialHomeSections, ...live };
          setStorageData(STORAGE_KEYS.HOME_SECTIONS, merged);
          return merged;
        }
      }
    } catch (err) {
      console.warn('API getHomeSections fallback:', err.message);
    }
    return getStorageData(STORAGE_KEYS.HOME_SECTIONS, initialHomeSections);
  },

  updateHomeSection: async (sectionKey, newSectionData) => {
    try {
      if (adminApi.updateHomeSection) {
        await adminApi.updateHomeSection(sectionKey, newSectionData);
      }
    } catch (err) {
      console.warn('API updateHomeSection error:', err.message);
    }
    const sections = getStorageData(STORAGE_KEYS.HOME_SECTIONS, initialHomeSections);
    const updated = {
      ...sections,
      [sectionKey]: { ...sections[sectionKey], ...newSectionData }
    };
    setStorageData(STORAGE_KEYS.HOME_SECTIONS, updated);
    return updated;
  },

  toggleSectionVisibility: async (sectionKey) => {
    const sections = getStorageData(STORAGE_KEYS.HOME_SECTIONS, initialHomeSections);
    const isCurrentlyEnabled = sections[sectionKey]?.isEnabled ?? true;
    const nextState = !isCurrentlyEnabled;

    try {
      if (adminApi.toggleSectionVisibility) {
        await adminApi.toggleSectionVisibility(sectionKey, nextState);
      }
    } catch (err) {
      console.warn('API toggleSectionVisibility error:', err.message);
    }

    const updated = {
      ...sections,
      [sectionKey]: { ...sections[sectionKey], isEnabled: nextState }
    };
    setStorageData(STORAGE_KEYS.HOME_SECTIONS, updated);
    return updated;
  },

  // BLOG ARTICLES CRUD (Synced with Live API & blogs.json)
  // ═══════════════════════════════════════════════════════════════
  getBlogs: async () => {
    try {
      const res = await adminApi.getBlogs();
      if (res && res.blogs && res.blogs.length) {
        setStorageData(STORAGE_KEYS.BLOGS, res.blogs);
        return res.blogs;
      }
    } catch (err) {
      console.warn('API getBlogs fallback to local storage:', err.message);
    }
    return getStorageData(STORAGE_KEYS.BLOGS, initialCmsBlogs);
  },

  saveBlog: async (blogData) => {
    const slug = blogData.slug?.trim() || blogData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let apiBlog = null;

    try {
      if (blogData.id && !String(blogData.id).startsWith('BLOG-')) {
        const res = await adminApi.updateBlog(slug, { ...blogData, slug });
        apiBlog = res.blog;
      } else {
        const res = await adminApi.createBlog({ ...blogData, slug });
        apiBlog = res.blog;
      }
    } catch (err) {
      console.warn('Live API saveBlog failed, falling back to local storage:', err.message);
    }

    const blogs = getStorageData(STORAGE_KEYS.BLOGS, initialCmsBlogs);
    let updated;
    if (blogData.id) {
      updated = blogs.map((b) => (b.id === blogData.id || b.slug === slug ? { ...b, ...blogData, slug, ...(apiBlog || {}) } : b));
    } else {
      const newBlog = apiBlog || {
        ...blogData,
        id: `BLOG-${Date.now()}`,
        slug,
        date: blogData.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        status: blogData.status || 'Published'
      };
      updated = [newBlog, ...blogs];
    }

    setStorageData(STORAGE_KEYS.BLOGS, updated);
    return updated;
  },

  deleteBlog: async (idOrSlug) => {
    try {
      await adminApi.deleteBlog(idOrSlug);
    } catch (err) {
      console.warn('Live API deleteBlog failed:', err.message);
    }

    const blogs = getStorageData(STORAGE_KEYS.BLOGS, initialCmsBlogs);
    const updated = blogs.filter((b) => b.id !== idOrSlug && b.slug !== idOrSlug);
    setStorageData(STORAGE_KEYS.BLOGS, updated);
    return updated;
  },

  toggleBlogPublish: async (idOrSlug) => {
    const blogs = getStorageData(STORAGE_KEYS.BLOGS, initialCmsBlogs);
    const target = blogs.find((b) => b.id === idOrSlug || b.slug === idOrSlug);
    const newStatus = target?.status === 'Published' ? 'Draft' : 'Published';

    if (target?.slug) {
      try {
        await adminApi.updateBlog(target.slug, { status: newStatus });
      } catch (err) {
        console.warn('Live API toggleBlogPublish failed:', err.message);
      }
    }

    const updated = blogs.map((b) => {
      if (b.id === idOrSlug || b.slug === idOrSlug) {
        return { ...b, status: newStatus };
      }
      return b;
    });
    setStorageData(STORAGE_KEYS.BLOGS, updated);
    return updated;
  },

  // ═══════════════════════════════════════════════════════════════
  // STATIC PAGES CRUD
  // ═══════════════════════════════════════════════════════════════
  getPages: async () => {
    return getStorageData(STORAGE_KEYS.PAGES, initialCmsPages);
  },

  updatePage: async (pageKey, pageData) => {
    const pages = getStorageData(STORAGE_KEYS.PAGES, initialCmsPages);
    const updated = {
      ...pages,
      [pageKey]: { ...pages[pageKey], ...pageData }
    };
    setStorageData(STORAGE_KEYS.PAGES, updated);
    return updated;
  },

  // ═══════════════════════════════════════════════════════════════
  // BACKUP & RESET
  // ═══════════════════════════════════════════════════════════════
  resetToDefaults: () => {
    setStorageData(STORAGE_KEYS.HERO_SLIDES, initialHeroSlides);
    setStorageData(STORAGE_KEYS.HOME_SECTIONS, initialHomeSections);
    setStorageData(STORAGE_KEYS.BLOGS, initialCmsBlogs);
    setStorageData(STORAGE_KEYS.PAGES, initialCmsPages);
    return {
      heroSlides: initialHeroSlides,
      homeSections: initialHomeSections,
      blogs: initialCmsBlogs,
      pages: initialCmsPages
    };
  }
};
