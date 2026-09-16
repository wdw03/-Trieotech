'use client';
import React, { useState } from 'react';
import { useAdmin } from '../../../../context/AdminContext.jsx';
import { usePageLoading } from '../../../../hooks/usePageLoading.js';
import { HeroSlidesSkeleton, Skeleton } from '../../ui/Skeleton.jsx';
import { SlideEditorModal } from '../../cms/SlideEditorModal.jsx';
import { DeleteConfirmModal } from '../../ui/DeleteConfirmModal.jsx';
import {
  Layout,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Monitor,
  Smartphone,
  CheckCircle2,
  Save,
  RotateCcw,
  Sliders,
  Layers,
  Crown,
  BookOpen,
  Store,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const HomePageCms = () => {
  const {
    cmsHeroSlides,
    cmsHomeSections,
    saveHeroSlide,
    deleteHeroSlide,
    toggleHeroSlideStatus,
    reorderHeroSlides,
    updateHomeSection,
    toggleSectionVisibility,
    resetCmsToDefaults,
    showToast
  } = useAdmin();
  const isPageLoading = usePageLoading(450);

  // Active view mode for preview
  const [devicePreview, setDevicePreview] = useState('desktop'); // 'desktop' | 'mobile'

  // Modal states
  const [editingSlide, setEditingSlide] = useState(null);
  const [slideEditorOpen, setSlideEditorOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState(null);

  // Accordion open states for home sections
  const [expandedSection, setExpandedSection] = useState('promotionalBanners');

  // Slide Reordering Helpers
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const reordered = [...cmsHeroSlides];
    const temp = reordered[index];
    reordered[index] = reordered[index - 1];
    reordered[index - 1] = temp;
    reorderHeroSlides(reordered.map((s) => s.id));
  };

  const handleMoveDown = (index) => {
    if (index === cmsHeroSlides.length - 1) return;
    const reordered = [...cmsHeroSlides];
    const temp = reordered[index];
    reordered[index] = reordered[index + 1];
    reordered[index + 1] = temp;
    reorderHeroSlides(reordered.map((s) => s.id));
  };

  return (
    <div className="space-y-8">
      {/* CMS Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Home Page Content &amp; Banners CMS</h1>
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sliders className="w-3 h-3" /> Live Storefront Sync
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage hero slides, responsive mobile banners, dual wedding/festival promotions &amp; section visibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={resetCmsToDefaults}
            className="btn-secondary py-1.5 px-3 text-xs"
            title="Reset to default authentic catalog settings"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingSlide(null);
              setSlideEditorOpen(true);
            }}
            className="btn-primary py-2 px-4 text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> Add New Hero Slide
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: HERO CAROUSEL SLIDES MANAGER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="admin-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Layers className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white">Hero Banner Carousel Slides ({cmsHeroSlides.length})</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Drag, reorder, toggle live visibility, or click edit to configure desktop &amp; mobile copy separately.
            </p>
          </div>

          {/* Desktop vs Mobile Preview Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setDevicePreview('desktop')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${devicePreview === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop View
            </button>
            <button
              type="button"
              onClick={() => setDevicePreview('mobile')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${devicePreview === 'mobile' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile View
            </button>
          </div>
        </div>

        {/* Slides Grid / Cards */}
        {isPageLoading ? (
          <HeroSlidesSkeleton count={3} />
        ) : (
          <div className="space-y-3.5">
            {cmsHeroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`
                  p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
                  ${slide.isActive
                    ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/40 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800/40 opacity-70'
                  }
                `}
              >
                {/* Left Details */}
                <div className="flex items-center gap-4 flex-1">
                  {/* Order Index & Reorder Arrows */}
                  <div className="flex flex-col items-center gap-1 text-slate-400 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 hover:text-white disabled:opacity-20 hover:bg-slate-800 rounded transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs font-bold text-slate-300">#{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === cmsHeroSlides.length - 1}
                      className="p-1 hover:text-white disabled:opacity-20 hover:bg-slate-800 rounded transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Slide Preview Image */}
                  <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0 relative group">
                    <img
                      src={devicePreview === 'mobile' ? (slide.mobileImage || slide.mobile_image || slide.desktopImage || slide.desktop_image || slide.image) : (slide.desktopImage || slide.desktop_image || slide.image)}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                      {devicePreview === 'mobile' ? 'Mobile' : 'Desktop'}
                    </div>
                  </div>

                  {/* Text Details depending on Preview Mode */}
                  <div className="truncate flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        {slide.badge}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-400 font-bold">
                        {slide.tag}
                      </span>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${slide.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                        {slide.isActive ? 'Live' : 'Disabled'}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm truncate">
                      {devicePreview === 'mobile' ? (slide.mobileTitle || slide.title) : slide.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-1 max-w-xl">
                      {devicePreview === 'mobile' ? (slide.mobileSubtitle || slide.subtitle) : slide.subtitle}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                      <span>CTA: <strong className="text-slate-300">{devicePreview === 'mobile' ? slide.mobileCtaText : slide.desktopCtaText}</strong></span>
                      <span>•</span>
                      <span className="font-mono text-indigo-400">{slide.ctaLink}</span>
                    </div>
                  </div>
                </div>

                {/* Right Slide Action Controls */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => toggleHeroSlideStatus(slide.id)}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${slide.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                    title={slide.isActive ? "Hide from website" : "Make slide live"}
                  >
                    {slide.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{slide.isActive ? 'Active' : 'Hidden'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingSlide(slide);
                      setSlideEditorOpen(true);
                    }}
                    className="btn-secondary py-1.5 px-3 text-xs"
                    title="Edit Slide Content"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => setSlideToDelete(slide)}
                    className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition-colors"
                    title="Delete Slide"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: HOME PAGE SECTIONS CUSTOMIZER & TOGGLES */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white">Home Page Layout &amp; Content Sections</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Dynamically adjust headlines, promotional banners, product showcase limits, and visibility.
          </p>
        </div>

        {/* 1. DUAL PROMOTIONAL BANNERS (Wedding Special & Festive Mandir) */}
        <div className="admin-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Crown className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-white text-sm">Festive &amp; Wedding Dual Promotional Banners</h3>
                <p className="text-[11px] text-slate-400">High-converting showcase cards for Bridal Couture and Sacred Mandir collections</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={cmsHomeSections.promotionalBanners?.isEnabled ?? true}
                  onChange={() => toggleSectionVisibility('promotionalBanners')}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 w-4 h-4"
                />
                <span className={`font-semibold ${cmsHomeSections.promotionalBanners?.isEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {cmsHomeSections.promotionalBanners?.isEnabled ? 'Section Live' : 'Section Hidden'}
                </span>
              </label>
            </div>
          </div>

          {/* Banner 1 (Wedding) & Banner 2 (Festive) Editors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1 text-xs">
            {/* Wedding Banner Card */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 uppercase text-[10px] tracking-wider">Banner 1: Royal Bridal Couture</span>
                <span className="text-[10px] text-slate-500">Left Column</span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Headline</label>
                <input
                  type="text"
                  value={cmsHomeSections.promotionalBanners?.weddingBanner?.title || ''}
                  onChange={(e) => {
                    const current = cmsHomeSections.promotionalBanners;
                    updateHomeSection('promotionalBanners', {
                      ...current,
                      weddingBanner: { ...current.weddingBanner, title: e.target.value }
                    });
                  }}
                  className="admin-input w-full text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description Copy</label>
                <textarea
                  rows={2}
                  value={cmsHomeSections.promotionalBanners?.weddingBanner?.description || ''}
                  onChange={(e) => {
                    const current = cmsHomeSections.promotionalBanners;
                    updateHomeSection('promotionalBanners', {
                      ...current,
                      weddingBanner: { ...current.weddingBanner, description: e.target.value }
                    });
                  }}
                  className="admin-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Button Text</label>
                  <input
                    type="text"
                    value={cmsHomeSections.promotionalBanners?.weddingBanner?.buttonText || ''}
                    onChange={(e) => {
                      const current = cmsHomeSections.promotionalBanners;
                      updateHomeSection('promotionalBanners', {
                        ...current,
                        weddingBanner: { ...current.weddingBanner, buttonText: e.target.value }
                      });
                    }}
                    className="admin-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Button Link</label>
                  <input
                    type="text"
                    value={cmsHomeSections.promotionalBanners?.weddingBanner?.buttonLink || ''}
                    onChange={(e) => {
                      const current = cmsHomeSections.promotionalBanners;
                      updateHomeSection('promotionalBanners', {
                        ...current,
                        weddingBanner: { ...current.weddingBanner, buttonLink: e.target.value }
                      });
                    }}
                    className="admin-input w-full text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Festival Banner Card */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 uppercase text-[10px] tracking-wider">Banner 2: Auspicious Festivities</span>
                <span className="text-[10px] text-slate-500">Right Column</span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Headline</label>
                <input
                  type="text"
                  value={cmsHomeSections.promotionalBanners?.festivalBanner?.title || ''}
                  onChange={(e) => {
                    const current = cmsHomeSections.promotionalBanners;
                    updateHomeSection('promotionalBanners', {
                      ...current,
                      festivalBanner: { ...current.festivalBanner, title: e.target.value }
                    });
                  }}
                  className="admin-input w-full text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description Copy</label>
                <textarea
                  rows={2}
                  value={cmsHomeSections.promotionalBanners?.festivalBanner?.description || ''}
                  onChange={(e) => {
                    const current = cmsHomeSections.promotionalBanners;
                    updateHomeSection('promotionalBanners', {
                      ...current,
                      festivalBanner: { ...current.festivalBanner, description: e.target.value }
                    });
                  }}
                  className="admin-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Button Text</label>
                  <input
                    type="text"
                    value={cmsHomeSections.promotionalBanners?.festivalBanner?.buttonText || ''}
                    onChange={(e) => {
                      const current = cmsHomeSections.promotionalBanners;
                      updateHomeSection('promotionalBanners', {
                        ...current,
                        festivalBanner: { ...current.festivalBanner, buttonText: e.target.value }
                      });
                    }}
                    className="admin-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Button Link</label>
                  <input
                    type="text"
                    value={cmsHomeSections.promotionalBanners?.festivalBanner?.buttonLink || ''}
                    onChange={(e) => {
                      const current = cmsHomeSections.promotionalBanners;
                      updateHomeSection('promotionalBanners', {
                        ...current,
                        festivalBanner: { ...current.festivalBanner, buttonLink: e.target.value }
                      });
                    }}
                    className="admin-input w-full text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. ARTISAN BEST SELLERS CAROUSEL SETTINGS */}
        <div className="admin-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-white text-sm">Artisan Best Sellers Carousel</h3>
                <p className="text-[11px] text-slate-400">Custom headline &amp; product limit</p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={cmsHomeSections.bestSellers?.isEnabled ?? true}
                onChange={() => toggleSectionVisibility('bestSellers')}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 w-4 h-4"
              />
              <span className={`font-semibold ${cmsHomeSections.bestSellers?.isEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                {cmsHomeSections.bestSellers?.isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Section Title</label>
              <input
                type="text"
                value={cmsHomeSections.bestSellers?.title || ''}
                onChange={(e) => updateHomeSection('bestSellers', { title: e.target.value })}
                className="admin-input w-full text-xs"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Section Badge Pill</label>
              <input
                type="text"
                value={cmsHomeSections.bestSellers?.badge || ''}
                onChange={(e) => updateHomeSection('bestSellers', { badge: e.target.value })}
                className="admin-input w-full text-xs"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Max Products Displayed</label>
              <input
                type="number"
                value={cmsHomeSections.bestSellers?.productLimit || 4}
                onChange={(e) => updateHomeSection('bestSellers', { productLimit: Number(e.target.value) })}
                className="admin-input w-full text-xs"
              />
            </div>
          </div>
        </div>

        {/* 3. BRAND HERITAGE STORY STRIP */}
        <div className="admin-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Store className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-white text-sm">Brand Heritage Story Strip</h3>
                <p className="text-[11px] text-slate-400">Craft mission statement, verified stats, and artisan cluster highlights</p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={cmsHomeSections.brandStory?.isEnabled ?? true}
                onChange={() => toggleSectionVisibility('brandStory')}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 w-4 h-4"
              />
              <span className={`font-semibold ${cmsHomeSections.brandStory?.isEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                {cmsHomeSections.brandStory?.isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Story Headline</label>
              <input
                type="text"
                value={cmsHomeSections.brandStory?.title || ''}
                onChange={(e) => updateHomeSection('brandStory', { title: e.target.value })}
                className="admin-input w-full text-xs"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Mission Description</label>
              <textarea
                rows={2}
                value={cmsHomeSections.brandStory?.description || ''}
                onChange={(e) => updateHomeSection('brandStory', { description: e.target.value })}
                className="admin-input w-full text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <label className="text-[10px] text-slate-500 block mb-0.5">Stat 1</label>
                <input
                  type="text"
                  value={cmsHomeSections.brandStory?.stat1Number || ''}
                  onChange={(e) => updateHomeSection('brandStory', { stat1Number: e.target.value })}
                  className="admin-input w-full text-xs font-bold mb-1"
                />
                <input
                  type="text"
                  value={cmsHomeSections.brandStory?.stat1Label || ''}
                  onChange={(e) => updateHomeSection('brandStory', { stat1Label: e.target.value })}
                  className="admin-input w-full text-[11px]"
                />
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <label className="text-[10px] text-slate-500 block mb-0.5">Stat 2</label>
                <input
                  type="text"
                  value={cmsHomeSections.brandStory?.stat2Number || ''}
                  onChange={(e) => updateHomeSection('brandStory', { stat2Number: e.target.value })}
                  className="admin-input w-full text-xs font-bold mb-1"
                />
                <input
                  type="text"
                  value={cmsHomeSections.brandStory?.stat2Label || ''}
                  onChange={(e) => updateHomeSection('brandStory', { stat2Label: e.target.value })}
                  className="admin-input w-full text-[11px]"
                />
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <label className="text-[10px] text-slate-500 block mb-0.5">Stat 3</label>
                <input
                  type="text"
                  value={cmsHomeSections.brandStory?.stat3Number || ''}
                  onChange={(e) => updateHomeSection('brandStory', { stat3Number: e.target.value })}
                  className="admin-input w-full text-xs font-bold mb-1"
                />
                <input
                  type="text"
                  value={cmsHomeSections.brandStory?.stat3Label || ''}
                  onChange={(e) => updateHomeSection('brandStory', { stat3Label: e.target.value })}
                  className="admin-input w-full text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. GLOBAL FOOTER CONTENT */}
        <div className="admin-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Store className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-white text-sm">Global Store Footer Content</h3>
                <p className="text-[11px] text-slate-400">Warehouse location, support details, and official copyright</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Footer Tagline</label>
              <input
                type="text"
                value={cmsHomeSections.footer?.tagline || ''}
                onChange={(e) => updateHomeSection('footer', { tagline: e.target.value })}
                className="admin-input w-full text-xs"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Copyright Notice</label>
              <input
                type="text"
                value={cmsHomeSections.footer?.copyrightText || ''}
                onChange={(e) => updateHomeSection('footer', { copyrightText: e.target.value })}
                className="admin-input w-full text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {slideEditorOpen && (
        <SlideEditorModal
          slide={editingSlide}
          isOpen={slideEditorOpen}
          onSave={saveHeroSlide}
          onClose={() => setSlideEditorOpen(false)}
        />
      )}

      {slideToDelete && (
        <DeleteConfirmModal
          isOpen={!!slideToDelete}
          title="Delete Hero Slide"
          itemName={slideToDelete.title}
          message="Are you sure you want to remove this hero slide from the home page carousel?"
          onConfirm={() => deleteHeroSlide(slideToDelete.id)}
          onClose={() => setSlideToDelete(null)}
        />
      )}
    </div>
  );
};
