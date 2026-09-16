'use client';
import React, { useState, useRef } from 'react';
import { useAdmin } from '../../../context/AdminContext.jsx';
import { usePageLoading } from '../../../hooks/usePageLoading.js';
import { CategoriesGridSkeleton } from '../ui/Skeleton.jsx';
import { ProductImage } from '../ui/ProductImage.jsx';
import { adminApi } from '../../../services/adminApi.js';
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Layers,
  ChevronRight,
  Save,
  X,
  Upload,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const Categories = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory, showToast } = useAdmin();
  const isPageLoading = usePageLoading(450);

  const [editingCategory, setEditingCategory] = useState(null);
  const [subcatInput, setSubcatInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const imageInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // Calculate actual product count per category dynamically from catalog
  const categoriesWithCounts = categories.map((c) => {
    const count = products.filter((p) => (p.category || '').toLowerCase() === (c.name || '').toLowerCase()).length;
    return {
      ...c,
      actualCount: count || c.productCount || c.product_count || 0
    };
  });

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

  // Upload Category Thumbnail Photo to Supabase
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

  // Upload Category Header Banner Photo to Supabase
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
        image: editingCategory.image?.trim() || '',
        banner: editingCategory.banner?.trim() || '',
        description: editingCategory.description?.trim() || ''
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

  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full min-w-0 flex flex-col lg:h-[calc(100vh-7.5rem)] lg:max-h-[calc(100vh-7.5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Categories &amp; Collections</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Supabase Storage
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Organize catalog taxonomies, subcategories, collection banners &amp; photos.
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
              <div key={cat.id} className="admin-card p-5 flex flex-col justify-between group admin-card-hover">
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold uppercase">
                            {cat.name.slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-base leading-tight">{cat.name}</h3>
                        <span className="text-[11px] text-indigo-400 font-mono">/{cat.slug}</span>
                      </div>
                    </div>

                    <span className="badge-indigo font-bold text-xs px-2.5 py-0.5 rounded-full">
                      {cat.actualCount} Products
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {cat.description || 'Collection of genuine handmade craft & fashion decor items.'}
                  </p>

                  {/* Subcategories Tags */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Subcategories ({cat.subcategories?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.subcategories?.map((sub) => (
                        <span
                          key={sub.slug}
                          className="bg-slate-900 border border-slate-800 text-slate-300 text-[11px] px-2.5 py-0.5 rounded-lg"
                        >
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active on Storefront
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingCategory({ ...cat })}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Category &amp; Photos"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
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

      {/* EDIT / CREATE CATEGORY MODAL WITH SUPABASE IMAGE UPLOAD */}
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
              <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
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
                  {editingCategory.image && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Photo Attached
                    </span>
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

              {/* CATEGORY HEADER BANNER PHOTO (OPTIONAL) */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <label className="font-semibold text-slate-300 block mb-1">
                  Category Page Header Banner (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-12 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                    {editingCategory.banner ? (
                      <img
                        src={editingCategory.banner}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px]">
                        No Banner
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
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg"
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
