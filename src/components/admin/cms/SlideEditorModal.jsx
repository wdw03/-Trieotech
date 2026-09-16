'use client';
import React, { useState, useRef } from 'react';
import { adminApi } from '../../../services/adminApi.js';
import {
  Monitor,
  Smartphone,
  Image as ImageIcon,
  Sparkles,
  Link as LinkIcon,
  X,
  Save,
  Tag,
  CheckCircle2,
  Eye,
  EyeOff,
  Upload,
  Loader2,
  Trash2,
  Layers,
  AlertCircle
} from 'lucide-react';

const SUGGESTED_IMAGES = [
  { label: 'Shreenathji Mukharvind', url: '/products/shreenathji-statement-patch-1.jpg' },
  { label: 'Peacock Real Feathers', url: '/products/peacock-real-feathers-pair-1.jpg' },
  { label: 'Hammered Copper Bottle', url: '/products/hammered-copper-bottle-1.jpg' },
  { label: 'Brass Diya Pooja Thali', url: '/products/pooja-thali-brass-diya-1.jpg' },
  { label: 'Lotus Kamal Aasan', url: '/products/lotus-kamal-aasan-1.jpg' },
  { label: 'Pearl Zardosi Patches', url: '/products/pearl-zardosi-patch-1.jpg' }
];

export const SlideEditorModal = ({
  slide,
  isOpen,
  onSave,
  onClose,
  showToast
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('desktop'); // 'desktop' | 'mobile' | 'imagery'
  
  // File upload states
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [uploadingSecondary, setUploadingSecondary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const desktopFileInputRef = useRef(null);
  const mobileFileInputRef = useRef(null);
  const secondaryFileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: slide?.title || '',
    subtitle: slide?.subtitle || '',
    ctaText: slide?.ctaText || slide?.cta_text || 'Shop Now',
    desktopCtaText: slide?.desktopCtaText || slide?.desktop_cta_text || slide?.ctaText || slide?.cta_text || 'Explore Collection',
    ctaLink: slide?.ctaLink || slide?.cta_link || '/shop',
    secondaryCtaText: slide?.secondaryCtaText || slide?.secondary_cta_text || 'Learn More',
    secondaryCtaLink: slide?.secondaryCtaLink || slide?.secondary_cta_link || '/blog',
    mobileTitle: slide?.mobileTitle || slide?.mobile_title || '',
    mobileSubtitle: slide?.mobileSubtitle || slide?.mobile_subtitle || '',
    mobileCtaText: slide?.mobileCtaText || slide?.mobile_cta_text || slide?.ctaText || slide?.cta_text || 'Shop Now',
    desktopImage: slide?.desktopImage || slide?.desktop_image || slide?.image || '/products/shreenathji-statement-patch-1.jpg',
    mobileImage: slide?.mobileImage || slide?.mobile_image || slide?.desktopImage || slide?.desktop_image || slide?.image || '/products/shreenathji-statement-patch-1.jpg',
    secondaryImage: slide?.secondaryImage || slide?.secondary_image || '',
    badge: slide?.badge || 'Festive & Wedding Special',
    tag: slide?.tag || 'Authentic Craft',
    isActive: slide?.isActive !== undefined ? Boolean(slide.isActive) : (slide?.is_active !== undefined ? Boolean(slide.is_active) : true),
    displayOrder: slide?.display_order ?? slide?.order ?? 0
  });

  // Handle Desktop/PC Photo upload to Supabase
  const handleUploadDesktop = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDesktop(true);
    try {
      const res = await adminApi.uploadBannerImage(file);
      if (res && res.url) {
        setFormData((prev) => ({
          ...prev,
          desktopImage: res.url,
          // if mobile image is default, also set it
          mobileImage: (prev.mobileImage === '/products/shreenathji-statement-patch-1.jpg' || !prev.mobileImage) ? res.url : prev.mobileImage
        }));
        if (showToast) showToast('Desktop banner uploaded to Supabase successfully!', 'success');
      } else {
        throw new Error(res?.error || 'No URL returned');
      }
    } catch (err) {
      console.error('Desktop image upload failed:', err);
      if (showToast) showToast(`Failed to upload image: ${err.message}`, 'error');
    } finally {
      setUploadingDesktop(false);
      if (desktopFileInputRef.current) desktopFileInputRef.current.value = '';
    }
  };

  // Handle Mobile Photo upload to Supabase
  const handleUploadMobile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMobile(true);
    try {
      const res = await adminApi.uploadBannerImage(file);
      if (res && res.url) {
        setFormData((prev) => ({
          ...prev,
          mobileImage: res.url
        }));
        if (showToast) showToast('Mobile banner uploaded to Supabase successfully!', 'success');
      } else {
        throw new Error(res?.error || 'No URL returned');
      }
    } catch (err) {
      console.error('Mobile image upload failed:', err);
      if (showToast) showToast(`Failed to upload image: ${err.message}`, 'error');
    } finally {
      setUploadingMobile(false);
      if (mobileFileInputRef.current) mobileFileInputRef.current.value = '';
    }
  };

  // Handle Secondary Mini Image upload
  const handleUploadSecondary = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSecondary(true);
    try {
      const res = await adminApi.uploadBannerImage(file);
      if (res && res.url) {
        setFormData((prev) => ({
          ...prev,
          secondaryImage: res.url
        }));
        if (showToast) showToast('Secondary preview image uploaded successfully!', 'success');
      }
    } catch (err) {
      console.error('Secondary image upload failed:', err);
      if (showToast) showToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setUploadingSecondary(false);
      if (secondaryFileInputRef.current) secondaryFileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Slide title is required!');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...(slide || {}),
        ...formData,
        image: formData.desktopImage,
        desktop_image: formData.desktopImage,
        mobile_image: formData.mobileImage.trim() || formData.desktopImage,
        secondary_image: formData.secondaryImage,
        title: formData.title.trim(),
        mobile_title: formData.mobileTitle.trim() || formData.title.trim(),
        mobile_subtitle: formData.mobileSubtitle.trim() || formData.subtitle,
        is_active: formData.isActive,
        display_order: Number(formData.displayOrder) || 0
      });
      onClose();
    } catch (err) {
      console.error('Error saving slide:', err);
      if (showToast) showToast(`Error saving slide: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="admin-portal dark fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      style={{ colorScheme: 'dark' }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-md">
                <Layers className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-white text-base">
                {slide ? `Edit Slide: ${slide.title.substring(0, 30)}...` : 'Add New Hero Banner Slide'}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Supabase CDN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Separate high-res PC image and mobile-optimized phone image</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="btn-primary py-1.5 px-4 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Saving...' : 'Save Slide'}</span>
            </button>
          </div>
        </div>

        {/* Device Switcher Tabs */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('desktop')}
              className={`
                px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors
                ${activeTab === 'desktop' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}
              `}
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop / PC Version
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mobile')}
              className={`
                px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors
                ${activeTab === 'mobile' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}
              `}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile View (Phone)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('imagery')}
              className={`
                px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors
                ${activeTab === 'imagery' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}
              `}
            >
              <Sparkles className="w-3.5 h-3.5" /> Badges &amp; Tags
            </button>
          </div>

          {/* Quick Active / Hidden status toggle */}
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              formData.isActive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {formData.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{formData.isActive ? 'Live on Store' : 'Hidden (Draft)'}</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          
          {/* TAB 1: DESKTOP CONTENT & DESKTOP IMAGE UPLOAD */}
          {activeTab === 'desktop' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* DESKTOP PHOTO UPLOAD BOX */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-indigo-400" />
                    Desktop / PC Banner Photo *
                  </label>
                  {formData.desktopImage && (
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Image Ready
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Image Preview Box */}
                  <div className="sm:col-span-4 relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-700 bg-slate-950 group shadow-lg">
                    {formData.desktopImage ? (
                      <>
                        <img
                          src={formData.desktopImage}
                          alt="Desktop banner preview"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => desktopFileInputRef.current?.click()}
                            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs shadow"
                            title="Replace Image"
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData((p) => ({ ...p, desktopImage: '' }))}
                            className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs shadow"
                            title="Remove Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div
                        onClick={() => desktopFileInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-center hover:bg-slate-800/40 transition-colors"
                      >
                        <Upload className="w-6 h-6 text-slate-500 mb-2" />
                        <span className="text-slate-400 font-semibold">Click to upload PC image</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Actions & URL input */}
                  <div className="sm:col-span-8 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => desktopFileInputRef.current?.click()}
                      disabled={uploadingDesktop}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-xs font-bold text-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {uploadingDesktop ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                          <span>Uploading to Supabase CDN...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-indigo-400" />
                          <span>{formData.desktopImage ? 'Replace Desktop Photo (Upload File)' : 'Upload Desktop Photo to Supabase'}</span>
                        </>
                      )}
                    </button>

                    <input
                      ref={desktopFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleUploadDesktop}
                      className="hidden"
                    />

                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Or direct Image URL / CDN Link:</span>
                      <input
                        type="text"
                        value={formData.desktopImage}
                        onChange={(e) => setFormData({ ...formData, desktopImage: e.target.value })}
                        placeholder="https://...supabase.co/storage/v1/object/public/banners/image.jpg"
                        className="admin-input bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-950 focus:border-indigo-500 w-full text-xs font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Text Fields */}
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Desktop Main Headline *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      title: newTitle,
                      mobileTitle: (!prev.mobileTitle || prev.mobileTitle === prev.title || prev.mobileTitle === 'Velvet Pooja Aasans & Brass Thalis' || prev.mobileTitle === 'Pure Ayurvedic Copper Bottles' || prev.mobileTitle === 'Handcrafted Zardosi & Deity Patches') ? newTitle : prev.mobileTitle
                    }));
                  }}
                  placeholder="e.g. Handcrafted Zardosi & Sacred Deity Patches"
                  className="admin-input bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-950 focus:border-indigo-500 w-full text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Desktop Subtitle / Story Description</label>
                <textarea
                  rows={2}
                  value={formData.subtitle}
                  onChange={(e) => {
                    const newSub = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      subtitle: newSub,
                      mobileSubtitle: (!prev.mobileSubtitle || prev.mobileSubtitle === prev.subtitle) ? newSub : prev.mobileSubtitle
                    }));
                  }}
                  placeholder="Detailed artisanal craft story shown on desktop screens..."
                  className="admin-input bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-950 focus:border-indigo-500 w-full text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Primary CTA Button Text</label>
                  <input
                    type="text"
                    value={formData.desktopCtaText}
                    onChange={(e) => setFormData({ ...formData, desktopCtaText: e.target.value })}
                    placeholder="e.g. Explore Collection"
                    className="admin-input bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-950 focus:border-indigo-500 w-full text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Primary CTA Button Link</label>
                  <input
                    type="text"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                    placeholder="e.g. /category/patches"
                    className="admin-input bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-950 focus:border-indigo-500 w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Secondary Button Text (Desktop Only)</label>
                  <input
                    type="text"
                    value={formData.secondaryCtaText}
                    onChange={(e) => setFormData({ ...formData, secondaryCtaText: e.target.value })}
                    placeholder="e.g. View Best Sellers"
                    className="admin-input bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-950 focus:border-indigo-500 w-full text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Secondary Button Link</label>
                  <input
                    type="text"
                    value={formData.secondaryCtaLink}
                    onChange={(e) => setFormData({ ...formData, secondaryCtaLink: e.target.value })}
                    placeholder="e.g. /shop"
                    className="admin-input bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-950 focus:border-indigo-500 w-full text-xs font-mono"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MOBILE OPTIMIZED CONTENT & MOBILE IMAGE UPLOAD */}
          {activeTab === 'mobile' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* MOBILE PHOTO UPLOAD BOX */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    Mobile View Banner Photo (Phones &lt; 768px) *
                  </label>
                  {formData.mobileImage && (
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Mobile Image Ready
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  Upload a photo specifically framed or cropped for mobile portrait screens. If empty, the desktop photo will be used.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Mobile Preview Box (Portrait aspect) */}
                  <div className="sm:col-span-4 relative aspect-[4/3.4] rounded-xl overflow-hidden border border-amber-500/30 bg-slate-950 group shadow-lg">
                    {formData.mobileImage ? (
                      <>
                        <img
                          src={formData.mobileImage}
                          alt="Mobile banner preview"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => mobileFileInputRef.current?.click()}
                            className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs shadow"
                            title="Replace Mobile Image"
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData((p) => ({ ...p, mobileImage: '' }))}
                            className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs shadow"
                            title="Remove Mobile Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div
                        onClick={() => mobileFileInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-center hover:bg-slate-800/40 transition-colors"
                      >
                        <Upload className="w-6 h-6 text-amber-400 mb-2" />
                        <span className="text-amber-300 font-semibold">Upload mobile phone image</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Actions & URL input */}
                  <div className="sm:col-span-8 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => mobileFileInputRef.current?.click()}
                      disabled={uploadingMobile}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-xs font-bold text-amber-200 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {uploadingMobile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Uploading Mobile Image to Supabase...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-amber-400" />
                          <span>{formData.mobileImage ? 'Replace Mobile Photo (Upload File)' : 'Upload Mobile Photo to Supabase'}</span>
                        </>
                      )}
                    </button>

                    <input
                      ref={mobileFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleUploadMobile}
                      className="hidden"
                    />

                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Or direct Mobile Image URL:</span>
                      <input
                        type="text"
                        value={formData.mobileImage}
                        onChange={(e) => setFormData({ ...formData, mobileImage: e.target.value })}
                        placeholder="https://...supabase.co/storage/v1/object/public/banners/mobile.jpg"
                        className="admin-input bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-950 focus:border-indigo-500 w-full text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Text Fields */}
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Mobile Concise Headline</label>
                <input
                  type="text"
                  value={formData.mobileTitle}
                  onChange={(e) => setFormData({ ...formData, mobileTitle: e.target.value })}
                  placeholder="e.g. Handcrafted Zardosi & Deity Patches"
                  className="admin-input bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-950 focus:border-indigo-500 w-full text-xs font-semibold"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Defaults to Desktop Headline if left empty.</span>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Mobile Short Description</label>
                <textarea
                  rows={2}
                  value={formData.mobileSubtitle}
                  onChange={(e) => setFormData({ ...formData, mobileSubtitle: e.target.value })}
                  placeholder="Shorter 1-sentence description for phone screens..."
                  className="admin-input bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-950 focus:border-indigo-500 w-full text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Mobile Button Label</label>
                <input
                  type="text"
                  value={formData.mobileCtaText}
                  onChange={(e) => setFormData({ ...formData, mobileCtaText: e.target.value })}
                  placeholder="e.g. Explore Patches"
                  className="admin-input bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-950 focus:border-indigo-500 w-full text-xs"
                />
              </div>

            </div>
          )}

          {/* TAB 3: IMAGERY, BADGES, AND SECONDARY CARD */}
          {activeTab === 'imagery' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Secondary Visual Card */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                <label className="font-semibold text-slate-300 block mb-1">
                  Secondary Corner Mini Preview (Desktop Card)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                    {formData.secondaryImage ? (
                      <img src={formData.secondaryImage} alt="Secondary" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px]">None</div>
                    )}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={formData.secondaryImage}
                      onChange={(e) => setFormData({ ...formData, secondaryImage: e.target.value })}
                      placeholder="e.g. /products/peacock-real-feathers-pair-1.jpg"
                      className="admin-input bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-950 focus:border-indigo-500 flex-1 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => secondaryFileInputRef.current?.click()}
                      disabled={uploadingSecondary}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 shrink-0"
                    >
                      {uploadingSecondary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>Upload</span>
                    </button>
                    {formData.secondaryImage && (
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, secondaryImage: '' }))}
                        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg"
                        title="Remove secondary"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <input
                    ref={secondaryFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadSecondary}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Top Pill Badge Text</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Festive & Wedding 2026"
                    className="admin-input bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-950 focus:border-indigo-500 w-full text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Corner Ribbon Tag</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    placeholder="e.g. Authentic Imperial Zari"
                    className="admin-input bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-950 focus:border-indigo-500 w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="admin-input bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-950 focus:border-indigo-500 w-32 text-xs font-mono"
                />
              </div>

              {/* Quick Suggestion Chips from Catalog */}
              <div className="pt-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                  Quick Pick from Authentic Catalog Photos:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_IMAGES.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, desktopImage: item.url, mobileImage: item.url })}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${formData.desktopImage === item.url ? 'bg-indigo-600 text-white border-indigo-400 font-bold' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Preview Box */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-4 mt-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                  <img src={formData.desktopImage || '/products/shreenathji-statement-patch-1.jpg'} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="truncate flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-amber-400 font-bold uppercase">{formData.badge}</span>
                    <span className={`text-[9px] px-2 py-0.2 rounded-full font-bold ${formData.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                      {formData.isActive ? 'Live' : 'Hidden'}
                    </span>
                  </div>
                  <h5 className="font-bold text-white text-xs truncate mt-0.5">{formData.title || 'Slide Title'}</h5>
                  <p className="text-[11px] text-slate-400 truncate">{formData.subtitle || 'Slide description preview'}</p>
                  <span className="text-[10px] text-indigo-400 font-mono mt-0.5 block">{formData.ctaLink}</span>
                </div>
              </div>

            </div>
          )}

        </form>
      </div>
    </div>
  );
};
