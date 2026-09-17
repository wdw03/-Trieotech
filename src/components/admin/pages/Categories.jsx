'use client';
import React, { useState, useRef } from 'react';
import { useAdmin } from '../../../context/AdminContext.jsx';
import { usePageLoading } from '../../../hooks/usePageLoading.js';
import { CategoriesGridSkeleton } from '../ui/Skeleton.jsx';
import { adminApi } from '../../../services/adminApi.js';
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Layers,
  Save,
  X,
  Upload,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  Camera,
  ExternalLink,
  Eye,
  RefreshCw
} from 'lucide-react';

export const Categories = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory, showToast } = useAdmin();
  const isPageLoading = usePageLoading(450);

  // Full category editing modal state
  const [editingCategory, setEditingCategory] = useState(null);
  const [subcatInput, setSubcatInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Dedicated Media Manager Modal state
  const [mediaModalCategory, setMediaModalCategory] = useState(null);
  const [mediaModalSaving, setMediaModalSaving] = useState(false);
  const [mediaImageUploading, setMediaImageUploading] = useState(false);
  const [mediaBannerUploading, setMediaBannerUploading] = useState(false);

  // Quick Action state for category cards
  const [quickTargetCatId, setQuickTargetCatId] = useState(null);
  const [quickUploadingId, setQuickUploadingId] = useState(null);
  const [quickUploadingType, setQuickUploadingType] = useState(null); // 'image' | 'banner'

  // Input refs
  const imageInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const quickImageInputRef = useRef(null);
  const quickBannerInputRef = useRef(null);
  const mediaImageInputRef = useRef(null);
  const mediaBannerInputRef = useRef(null);

  // Calculate actual product count per category dynamically from catalog
  const categoriesWithCounts = categories.map((c) => {
    const count = products.filter((p) => (p.category || '').toLowerCase() === (c.name || '').toLowerCase()).length;
    return {
      ...c,
      actualCount: count || c.productCount || c.product_count || 0
    };
  });

  // ─────────────────────────────────────────────────────────────
  // FULL CATEGORY MODAL HANDLERS
  // ─────────────────────────────────────────────────────────────
  const handleOpenNewCategory = () => {
    setEditingCategory({
      name: '',
      slug: '',
      image: '',
      banner: '',
      description: '',
      subcategories: []
    });
    setSubcatInput('');
  };

  const handleAddSubcat = () => {
    if (!subcatInput.trim()) return;
    const slug = subcatInput.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setEditingCategory({
      ...editingCategory,
      subcategories: [...(editingCategory.subcategories || []), { name: subcatInput.trim(), slug }]
    });
    setSubcatInput('');
  };

  const handleRemoveSubcat = (slug) => {
    setEditingCategory({
      ...editingCategory,
      subcategories: (editingCategory.subcategories || []).filter((s) => s.slug !== slug)
    });
  };

  const handleCategoryImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await adminApi.uploadCategoryImage(file);
      if (res && res.url) {
        setEditingCategory((prev) => ({
          ...prev,
          image: res.url
        }));
        if (showToast) showToast('Category image uploaded to Supabase successfully!', 'success');
      } else {
        throw new Error(res?.error || 'No URL returned');
      }
    } catch (err) {
      console.error('Category image upload error:', err);
      if (showToast) showToast(`Failed to upload category image: ${err.message}`, 'error');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleCategoryBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      const res = await adminApi.uploadCategoryImage(file);
      if (res && res.url) {
        setEditingCategory((prev) => ({
          ...prev,
          banner: res.url
        }));
        if (showToast) showToast('Category banner uploaded to Supabase successfully!', 'success');
      } else {
        throw new Error(res?.error || 'No URL returned');
      }
    } catch (err) {
      console.error('Category banner upload error:', err);
      if (showToast) showToast(`Failed to upload category banner: ${err.message}`, 'error');
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingCategory.name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const slug = editingCategory.slug?.trim() || editingCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const payload = {
        ...editingCategory,
        name: editingCategory.name.trim(),
        slug,
        image: editingCategory.image ? String(editingCategory.image).trim() : '',
        banner: editingCategory.banner ? String(editingCategory.banner).trim() : '',
        description: editingCategory.description ? String(editingCategory.description).trim() : ''
      };

      if (editingCategory.id) {
        await updateCategory(editingCategory.id, payload);
      } else {
        await addCategory(payload);
      }
      setEditingCategory(null);
    } catch (err) {
      console.error('Error saving category:', err);
      if (showToast) showToast(`Error saving category: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // QUICK CARD IMAGE & BANNER ACTIONS (1-CLICK UPLOAD / DELETE)
  // ─────────────────────────────────────────────────────────────
  const handleQuickImageClick = (catId) => {
    setQuickTargetCatId(catId);
    if (quickImageInputRef.current) {
      quickImageInputRef.current.value = '';
      quickImageInputRef.current.click();
    }
  };

  const handleQuickBannerClick = (catId) => {
    setQuickTargetCatId(catId);
    if (quickBannerInputRef.current) {
      quickBannerInputRef.current.value = '';
      quickBannerInputRef.current.click();
    }
  };

  const handleQuickImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    const catId = quickTargetCatId;
    if (!file || !catId) return;

    setQuickUploadingId(catId);
    setQuickUploadingType('image');
    try {
      const res = await adminApi.uploadCategoryImage(file);
      if (res && res.url) {
        await updateCategory(catId, { image: res.url });
        showToast('Category image updated successfully!', 'success');
      } else {
        throw new Error(res?.error || 'No URL returned');
      }
    } catch (err) {
      console.error('Quick image upload error:', err);
      showToast(`Failed to upload image: ${err.message}`, 'error');
    } finally {
      setQuickUploadingId(null);
      setQuickUploadingType(null);
      setQuickTargetCatId(null);
      if (quickImageInputRef.current) quickImageInputRef.current.value = '';
    }
  };

  const handleQuickBannerFileChange = async (e) => {
    const file = e.target.files?.[0];
    const catId = quickTargetCatId;
    if (!file || !catId) return;

    setQuickUploadingId(catId);
    setQuickUploadingType('banner');
    try {
      const res = await adminApi.uploadCategoryImage(file);
      if (res && res.url) {
        await updateCategory(catId, { banner: res.url });
        showToast('Category banner updated successfully!', 'success');
      } else {
        throw new Error(res?.error || 'No URL returned');
      }
    } catch (err) {
      console.error('Quick banner upload error:', err);
      showToast(`Failed to upload banner: ${err.message}`, 'error');
    } finally {
      setQuickUploadingId(null);
      setQuickUploadingType(null);
      setQuickTargetCatId(null);
      if (quickBannerInputRef.current) quickBannerInputRef.current.value = '';
    }
  };

  const handleQuickDeleteImage = async (cat) => {
    if (!window.confirm(`Are you sure you want to remove the photo from category "${cat.name}"?`)) {
      return;
    }
    try {
      await updateCategory(cat.id, { image: '' });
      showToast(`Photo removed from category "${cat.name}"!`, 'info');
    } catch (err) {
      console.error('Delete image error:', err);
      showToast(`Failed to delete image: ${err.message}`, 'error');
    }
  };

  const handleQuickDeleteBanner = async (cat) => {
    if (!window.confirm(`Are you sure you want to remove the banner from category "${cat.name}"?`)) {
      return;
    }
    try {
      await updateCategory(cat.id, { banner: '' });
      showToast(`Banner removed from category "${cat.name}"!`, 'info');
    } catch (err) {
      console.error('Delete banner error:', err);
      showToast(`Failed to delete banner: ${err.message}`, 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // DEDICATED MEDIA MODAL HANDLERS
  // ─────────────────────────────────────────────────────────────
  const handleOpenMediaModal = (cat) => {
    setMediaModalCategory({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      image: cat.image || '',
      banner: cat.banner || ''
    });
  };

  const handleMediaModalImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaImageUploading(true);
    try {
      const res = await adminApi.uploadCategoryImage(file);
      if (res && res.url) {
        setMediaModalCategory((prev) => ({
          ...prev,
          image: res.url
        }));
        showToast('Photo uploaded to Supabase!', 'success');
      } else {
        throw new Error(res?.error || 'No URL returned');
      }
    } catch (err) {
      console.error('Media image upload error:', err);
      showToast(`Failed to upload photo: ${err.message}`, 'error');
    } finally {
      setMediaImageUploading(false);
      if (mediaImageInputRef.current) mediaImageInputRef.current.value = '';
    }
  };

  const handleMediaModalBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaBannerUploading(true);
    try {
      const res = await adminApi.uploadCategoryImage(file);
      if (res && res.url) {
        setMediaModalCategory((prev) => ({
          ...prev,
          banner: res.url
        }));
        showToast('Banner uploaded to Supabase!', 'success');
      } else {
        throw new Error(res?.error || 'No URL returned');
      }
    } catch (err) {
      console.error('Media banner upload error:', err);
      showToast(`Failed to upload banner: ${err.message}`, 'error');
    } finally {
      setMediaBannerUploading(false);
      if (mediaBannerInputRef.current) mediaBannerInputRef.current.value = '';
    }
  };

  const handleSaveMediaModal = async () => {
    if (!mediaModalCategory?.id) return;
    setMediaModalSaving(true);
    try {
      await updateCategory(mediaModalCategory.id, {
        image: mediaModalCategory.image ? String(mediaModalCategory.image).trim() : '',
        banner: mediaModalCategory.banner ? String(mediaModalCategory.banner).trim() : ''
      });
      showToast(`Media updated for "${mediaModalCategory.name}"!`, 'success');
      setMediaModalCategory(null);
    } catch (err) {
      console.error('Save media modal error:', err);
      showToast(`Failed to save media: ${err.message}`, 'error');
    } finally {
      setMediaModalSaving(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full min-w-0 flex flex-col lg:h-[calc(100vh-7.5rem)] lg:max-h-[calc(100vh-7.5rem)]">
      {/* Hidden global file pickers for quick card updates */}
      <input
        ref={quickImageInputRef}
        type="file"
        accept="image/*"
        onChange={handleQuickImageFileChange}
        className="hidden"
      />
      <input
        ref={quickBannerInputRef}
        type="file"
        accept="image/*"
        onChange={handleQuickBannerFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Categories &amp; Collections</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Live Supabase Media
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Upload, change, or delete category images, header banners &amp; catalog taxonomies.
          </p>
        </div>

        <button onClick={handleOpenNewCategory} className="btn-primary py-2 px-4 text-xs font-bold shrink-0">
          <Plus className="w-4 h-4" /> Add New Category
        </button>
      </div>

      {/* CATEGORIES GRID */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {isPageLoading ? (
          <CategoriesGridSkeleton count={6} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-2">
            {categoriesWithCounts.map((cat) => (
              <div
                key={cat.id}
                className="admin-card p-5 flex flex-col justify-between group admin-card-hover relative overflow-hidden"
              >
                <div>
                  {/* Category Banner Preview Strip */}
                  {cat.banner ? (
                    <div className="relative h-20 -mx-5 -mt-5 mb-3.5 overflow-hidden bg-slate-900 border-b border-slate-800 group/banner">
                      <img
                        src={cat.banner}
                        alt={`${cat.name} banner`}
                        className="w-full h-full object-cover group-hover/banner:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-lg border border-slate-700 opacity-90 group-hover/banner:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleQuickBannerClick(cat.id)}
                          className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition-colors"
                          title="Replace Banner"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickDeleteBanner(cat)}
                          className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-500/20 transition-colors"
                          title="Delete Banner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-1.5 left-3 text-[9px] font-mono text-slate-400 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-700/50">
                        Header Banner
                      </span>
                    </div>
                  ) : (
                    <div className="relative -mx-5 -mt-5 mb-3 px-5 py-1.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-slate-600" /> No Header Banner
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickBannerClick(cat.id)}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline flex items-center gap-1 text-[10px]"
                      >
                        <Plus className="w-3 h-3" /> Add Banner
                      </button>
                    </div>
                  )}

                  {/* Card Header: Thumbnail + Title */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Interactive Thumbnail Photo */}
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 group/img shadow-sm">
                        {quickUploadingId === cat.id && quickUploadingType === 'image' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/90 text-indigo-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-[8px] mt-0.5 font-bold">Uploading...</span>
                          </div>
                        ) : cat.image ? (
                          <>
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                            />
                            {/* Hover overlay with Quick Edit & Delete */}
                            <div className="absolute inset-0 bg-black/75 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleQuickImageClick(cat.id)}
                                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-colors"
                                title="Change / Replace Photo"
                              >
                                <Camera className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickDeleteImage(cat)}
                                className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow transition-colors"
                                title="Delete Photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuickImageClick(cat.id)}
                            className="w-full h-full flex flex-col items-center justify-center text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors p-1 text-center"
                            title="Upload Category Photo"
                          >
                            <Camera className="w-4 h-4 mb-0.5 text-indigo-400" />
                            <span className="text-[8px] font-bold leading-tight text-indigo-300">+ Photo</span>
                          </button>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-100 text-base leading-tight truncate">{cat.name}</h3>
                        <span className="text-[11px] text-indigo-400 font-mono block truncate">/{cat.slug}</span>
                      </div>
                    </div>

                    <span className="badge-indigo font-bold text-xs px-2.5 py-0.5 rounded-full shrink-0">
                      {cat.actualCount} Products
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3.5 leading-relaxed">
                    {cat.description || 'Collection of genuine handmade craft & fashion decor items.'}
                  </p>

                  {/* Subcategories Tags */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Subcategories ({cat.subcategories?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                      {cat.subcategories && cat.subcategories.length > 0 ? (
                        cat.subcategories.map((sub) => (
                          <span
                            key={sub.slug}
                            className="bg-slate-900 border border-slate-800 text-slate-300 text-[11px] px-2.5 py-0.5 rounded-lg"
                          >
                            {sub.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">No subcategories defined</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs gap-2">
                  <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Dedicated Media Manager button */}
                    <button
                      type="button"
                      onClick={() => handleOpenMediaModal(cat)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Manage Category Photos & Banners"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Photos</span>
                    </button>

                    {/* Edit All Details */}
                    <button
                      type="button"
                      onClick={() => setEditingCategory({ ...cat })}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Category Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Category */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete category "${cat.name}"?`)) {
                          deleteCategory(cat.id);
                        }
                      }}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* DEDICATED MEDIA MANAGER MODAL (QUICK PHOTO & BANNER EDIT/DELETE) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mediaModalCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto no-print">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl p-5 sm:p-6 space-y-4 animate-scaleIn my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <ImageIcon className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Manage Images: {mediaModalCategory.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Upload, replace, or delete thumbnail &amp; header banner photos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMediaModalCategory(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-5 text-xs pr-1">
              {/* 1. THUMBNAIL PHOTO SECTION */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                    <Camera className="w-3.5 h-3.5 text-indigo-400" />
                    Category Thumbnail Image
                  </label>
                  {mediaModalCategory.image ? (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Image Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No image attached</span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Thumbnail Preview */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0 relative group">
                    {mediaModalCategory.image ? (
                      <>
                        <img
                          src={mediaModalCategory.image}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => mediaImageInputRef.current?.click()}
                            className="p-1 rounded bg-indigo-600 text-white"
                            title="Replace Image"
                          >
                            <Upload className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setMediaModalCategory((p) => ({ ...p, image: '' }))}
                            className="p-1 rounded bg-rose-600 text-white"
                            title="Delete Image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div
                        onClick={() => mediaImageInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                      >
                        <Camera className="w-5 h-5 mb-1 text-indigo-400" />
                        <span className="text-[9px] font-bold">UPLOAD</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & URL Input */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => mediaImageInputRef.current?.click()}
                        disabled={mediaImageUploading}
                        className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {mediaImageUploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{mediaModalCategory.image ? 'Replace Photo' : 'Upload Photo'}</span>
                          </>
                        )}
                      </button>

                      {mediaModalCategory.image && (
                        <button
                          type="button"
                          onClick={() => setMediaModalCategory((p) => ({ ...p, image: '' }))}
                          className="px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 text-xs flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Photo
                        </button>
                      )}
                    </div>

                    <input
                      ref={mediaImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleMediaModalImageUpload}
                      className="hidden"
                    />

                    <input
                      type="text"
                      value={mediaModalCategory.image || ''}
                      onChange={(e) => setMediaModalCategory({ ...mediaModalCategory, image: e.target.value })}
                      placeholder="Or enter direct CDN image link..."
                      className="admin-input w-full text-[11px] font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 2. HEADER BANNER SECTION */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    Category Page Header Banner
                  </label>
                  {mediaModalCategory.banner ? (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Banner Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No banner attached</span>
                  )}
                </div>

                {/* Banner Preview */}
                <div className="relative h-28 w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group">
                  {mediaModalCategory.banner ? (
                    <>
                      <img
                        src={mediaModalCategory.banner}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => mediaBannerInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 text-xs shadow"
                        >
                          <Upload className="w-3.5 h-3.5" /> Replace Banner
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaModalCategory((p) => ({ ...p, banner: '' }))}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1.5 text-xs shadow"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Banner
                        </button>
                      </div>
                    </>
                  ) : (
                    <div
                      onClick={() => mediaBannerInputRef.current?.click()}
                      className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                    >
                      <ImageIcon className="w-6 h-6 mb-1 text-indigo-400" />
                      <span className="text-[11px] font-bold">Click to Upload Header Banner (1200x400)</span>
                    </div>
                  )}
                </div>

                {/* Banner Actions & URL */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => mediaBannerInputRef.current?.click()}
                    disabled={mediaBannerUploading}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    {mediaBannerUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{mediaModalCategory.banner ? 'Upload New' : 'Upload Banner'}</span>
                      </>
                    )}
                  </button>

                  <input
                    ref={mediaBannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleMediaModalBannerUpload}
                    className="hidden"
                  />

                  <input
                    type="text"
                    value={mediaModalCategory.banner || ''}
                    onChange={(e) => setMediaModalCategory({ ...mediaModalCategory, banner: e.target.value })}
                    placeholder="Or enter banner image URL..."
                    className="admin-input flex-1 text-[11px] font-mono"
                  />

                  {mediaModalCategory.banner && (
                    <button
                      type="button"
                      onClick={() => setMediaModalCategory((p) => ({ ...p, banner: '' }))}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg shrink-0 transition-colors"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-slate-500">
                Photos save permanently to Supabase Storage &amp; Database.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMediaModalCategory(null)}
                  className="btn-secondary py-1.5 px-3 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMediaModal}
                  disabled={mediaModalSaving}
                  className="btn-primary py-1.5 px-4 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {mediaModalSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{mediaModalSaving ? 'Saving...' : 'Save Photos'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* EDIT / CREATE FULL CATEGORY MODAL */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto no-print">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl p-5 sm:p-6 space-y-4 animate-scaleIn my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Tags className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-white text-base">
                  {editingCategory.id ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Category Title *</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="e.g. Traditional Torans & Hangings"
                  className="admin-input w-full text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Slug / URL Path</label>
                <input
                  type="text"
                  value={editingCategory.slug || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  placeholder="auto-generated from name if blank"
                  className="admin-input w-full text-xs font-mono"
                />
              </div>

              {/* CATEGORY THUMBNAIL PHOTO UPLOAD BOX */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    Category Thumbnail Image (Supabase CDN)
                  </label>
                  {editingCategory.image ? (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Photo Attached
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No image</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Thumbnail Preview */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0 relative group">
                    {editingCategory.image ? (
                      <>
                        <img
                          src={editingCategory.image}
                          alt="Category preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="p-1 rounded bg-indigo-600 text-white"
                            title="Replace Photo"
                          >
                            <Upload className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategory((p) => ({ ...p, image: '' }))}
                            className="p-1 rounded bg-rose-600 text-white"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        <Upload className="w-4 h-4 mb-0.5" />
                        <span className="text-[8px] font-bold">UPLOAD</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Actions & URL input */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                            <span>Uploading to Supabase...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{editingCategory.image ? 'Replace Image' : 'Upload Image File'}</span>
                          </>
                        )}
                      </button>

                      {editingCategory.image && (
                        <button
                          type="button"
                          onClick={() => setEditingCategory((p) => ({ ...p, image: '' }))}
                          className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 text-xs flex items-center gap-1"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCategoryImageUpload}
                      className="hidden"
                    />

                    <input
                      type="text"
                      value={editingCategory.image || ''}
                      onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })}
                      placeholder="Or direct Image URL / CDN Link"
                      className="admin-input w-full text-[11px] font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* CATEGORY HEADER BANNER PHOTO */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300 block mb-1">
                    Category Page Header Banner (Optional)
                  </label>
                  {editingCategory.banner ? (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Banner Set
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No banner</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-24 h-12 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0 relative group">
                    {editingCategory.banner ? (
                      <>
                        <img
                          src={editingCategory.banner}
                          alt="Banner preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => bannerInputRef.current?.click()}
                            className="p-1 rounded bg-indigo-600 text-white"
                            title="Replace Banner"
                          >
                            <Upload className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategory((p) => ({ ...p, banner: '' }))}
                            className="p-1 rounded bg-rose-600 text-white"
                            title="Delete Banner"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div
                        onClick={() => bannerInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-slate-600 hover:text-slate-400 transition-colors text-[10px]"
                      >
                        <Upload className="w-3 h-3 mb-0.5" />
                        <span>Upload</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editingCategory.banner || ''}
                      onChange={(e) => setEditingCategory({ ...editingCategory, banner: e.target.value })}
                      placeholder="Banner image URL..."
                      className="admin-input flex-1 text-[11px] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={uploadingBanner}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs border border-slate-700 flex items-center gap-1 shrink-0"
                    >
                      {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>Upload</span>
                    </button>
                    {editingCategory.banner && (
                      <button
                        type="button"
                        onClick={() => setEditingCategory((p) => ({ ...p, banner: '' }))}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCategoryBannerUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Short description for collection banner..."
                  className="admin-input w-full text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Subcategories</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={subcatInput}
                    onChange={(e) => setSubcatInput(e.target.value)}
                    placeholder="Subcategory name (e.g. Velvet Door Torans)..."
                    className="admin-input flex-1 text-xs"
                  />
                  <button type="button" onClick={handleAddSubcat} className="btn-secondary py-1.5 px-3 text-xs">
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {editingCategory.subcategories?.map((s) => (
                    <span
                      key={s.slug}
                      className="bg-slate-800 text-slate-200 px-2 py-1 rounded-lg text-xs flex items-center gap-1.5"
                    >
                      {s.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveSubcat(s.slug)}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  Images stored directly on Supabase Storage bucket.
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setEditingCategory(null)} className="btn-secondary py-1.5 px-3 text-xs">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary py-1.5 px-4 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSaving ? 'Saving...' : 'Save Category'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
