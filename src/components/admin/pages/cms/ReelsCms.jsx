'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '../../../../context/AdminContext.jsx';
import { adminApi } from '../../../../services/adminApi.js';
import { ReelEditorModal } from '../../cms/ReelEditorModal.jsx';
import { DeleteConfirmModal } from '../../ui/DeleteConfirmModal.jsx';
import {
  Film,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Heart,
  MessageCircle,
  Video,
  ShoppingBag,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowUpDown,
  Filter,
  RefreshCw,
  Loader2
} from 'lucide-react';

const InstagramGlyph = ({ className = 'w-3 h-3' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

export const ReelsCms = () => {
  const { showToast } = useAdmin();

  // State
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Modal states
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null);
  const [reelToDelete, setReelToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch reels from Backend API
  const fetchReels = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await adminApi.getReels();
      if (Array.isArray(data)) {
        setReels(data);
      }
    } catch (err) {
      console.error('Failed to fetch reels:', err);
      if (showToast) showToast('Failed to load reels: ' + err.message, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  // Filtered reels list
  const filteredReels = useMemo(() => {
    return reels.filter((r) => {
      // Status filter
      if (statusFilter === 'active' && !r.is_active) return false;
      if (statusFilter === 'inactive' && r.is_active) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.influencer_name?.toLowerCase().includes(q);
        const matchesHandle = r.influencer_username?.toLowerCase().includes(q);
        const matchesCaption = r.caption?.toLowerCase().includes(q);
        const matchesProduct = r.product_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesHandle && !matchesCaption && !matchesProduct) {
          return false;
        }
      }

      return true;
    });
  }, [reels, statusFilter, searchQuery]);

  // Calculated Stats
  const stats = useMemo(() => {
    const total = reels.length;
    const active = reels.filter((r) => r.is_active).length;
    const linkedCount = reels.filter((r) => r.product_id || r.product_name).length;
    return { total, active, linkedCount };
  }, [reels]);

  // Handle Save (Create or Update)
  const handleSaveReel = async (payload) => {
    try {
      if (payload.id) {
        // Update existing
        const res = await adminApi.updateReel(payload.id, payload);
        if (res && res.reel) {
          setReels((prev) => prev.map((item) => (item.id === payload.id ? res.reel : item)));
          if (showToast) showToast('Reel updated successfully!', 'success');
        } else {
          await fetchReels();
        }
      } else {
        // Create new
        const res = await adminApi.createReel(payload);
        if (res && res.reel) {
          setReels((prev) => [res.reel, ...prev]);
          if (showToast) showToast('New Reel created and published!', 'success');
        } else {
          await fetchReels();
        }
      }
    } catch (err) {
      console.error('Error saving reel:', err);
      throw err;
    }
  };

  // Quick Toggle Active/Inactive Status
  const handleToggleStatus = async (reel) => {
    try {
      const nextStatus = !reel.is_active;
      const res = await adminApi.updateReel(reel.id, { is_active: nextStatus });
      setReels((prev) =>
        prev.map((item) => (item.id === reel.id ? { ...item, is_active: nextStatus } : item))
      );
      if (showToast) {
        showToast(nextStatus ? 'Reel is now Live on store!' : 'Reel set to Inactive/Draft', 'info');
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      if (showToast) showToast('Failed to update status', 'error');
    }
  };

  // Handle Delete Reel
  const handleDeleteConfirm = async () => {
    if (!reelToDelete) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteReel(reelToDelete.id);
      setReels((prev) => prev.filter((item) => item.id !== reelToDelete.id));
      if (showToast) showToast('Reel deleted permanently', 'success');
      setReelToDelete(null);
    } catch (err) {
      console.error('Delete reel error:', err);
      if (showToast) showToast('Failed to delete reel: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ee2a7b] to-[#d4af37] flex items-center justify-center text-white shadow-lg shrink-0">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Instagram Reels & Video CMS
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#ee2a7b]/10 text-[#ee2a7b] border border-[#ee2a7b]/20 text-[10px] font-bold">
                Shop The Gram
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage storefront video reels, direct Supabase MP4 uploads, influencer usernames, views/likes, and linked add-to-cart products.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchReels(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh reels list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={() => {
              setSelectedReel(null);
              setEditorOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ee2a7b] to-[#d4af37] text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Reel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[#ee2a7b]/10 text-[#ee2a7b] border border-[#ee2a7b]/20">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Reels</p>
            <h3 className="text-lg font-black text-white">{stats.total}</h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Live on Store</p>
            <h3 className="text-lg font-black text-emerald-400">{stats.active}</h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tagged Products</p>
            <h3 className="text-lg font-black text-amber-300">{stats.linkedCount}</h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Storage Bucket</p>
            <h3 className="text-xs font-mono font-bold text-indigo-300">reels (Supabase)</h3>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            id="admin_reels_search"
            name="reels_search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by influencer, username, caption or product..."
            className="admin-input w-full text-xs pl-9"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {[
            { id: 'all', label: 'All Reels' },
            { id: 'active', label: 'Live' },
            { id: 'inactive', label: 'Inactive' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-800 text-white border border-slate-700 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reels Grid */}
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-slate-900/40 rounded-2xl border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin text-[#ee2a7b]" />
          <span className="text-xs font-semibold text-slate-400">Loading reels from Supabase...</span>
        </div>
      ) : filteredReels.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-slate-900/40 rounded-2xl border border-slate-800">
          <Film className="w-10 h-10 text-slate-600" />
          <h3 className="text-sm font-bold text-white">No Reels Found</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            {searchQuery
              ? 'No reels matched your search query. Try searching for a different keyword.'
              : 'You have not uploaded any Instagram reels yet. Click the button below to upload your first video!'}
          </p>
          <button
            onClick={() => {
              setSelectedReel(null);
              setEditorOpen(true);
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-[#ee2a7b] text-white text-xs font-bold hover:bg-[#ee2a7b]/90 transition-all cursor-pointer"
          >
            Upload First Reel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {filteredReels.map((reel, index) => (
            <div
              key={reel.id}
              className="group relative rounded-2xl bg-slate-900 border border-slate-800 hover:border-[#ee2a7b]/50 overflow-hidden shadow-xl transition-all hover:-translate-y-1 flex flex-col"
            >
              {/* Top Video Preview / Thumbnail Area (9:16 vertical) */}
              <div className="relative aspect-[9/16] w-full bg-black overflow-hidden flex items-center justify-center">
                {reel.video_url ? (
                  <video
                    src={reel.video_url}
                    muted
                    loop
                    playsInline
                    onMouseEnter={(e) => e.target.play().catch(() => {})}
                    onMouseLeave={(e) => {
                      e.target.pause();
                      e.target.currentTime = 0;
                    }}
                    className="w-full h-full object-cover"
                    poster={reel.thumbnail_url || reel.influencer_avatar}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Video className="w-8 h-8" />
                  </div>
                )}

                {/* Top Left: Order Badge */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10">
                    #{reel.display_order ?? index + 1}
                  </span>
                </div>

                {/* Top Right: Status Badge */}
                <div className="absolute top-2 right-2 z-10">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(reel)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md transition-all cursor-pointer border ${
                      reel.is_active
                        ? 'bg-emerald-500/80 text-white border-emerald-400'
                        : 'bg-slate-900/80 text-slate-400 border-slate-700'
                    }`}
                  >
                    {reel.is_active ? 'Live' : 'Draft'}
                  </button>
                </div>

                {/* Bottom Overlay: Social Metrics (Views & Likes) */}
                <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between text-white text-[10px] font-bold">
                  <span className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                    <Play className="w-2.5 h-2.5 fill-white text-white" />
                    {reel.views_count || '0'}
                  </span>
                  <span className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm text-[#ee2a7b]">
                    <Heart className="w-2.5 h-2.5 fill-[#ee2a7b]" />
                    {reel.likes_count || '0'}
                  </span>
                </div>
              </div>

              {/* Influencer Profile Bar */}
              <div className="p-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2.5">
                <img
                  src={reel.influencer_avatar || 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/avatars/Abida_Fatima.jpg'}
                  alt={reel.influencer_name}
                  className="w-7 h-7 rounded-full object-cover bg-slate-800 border border-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate leading-tight">
                    {reel.influencer_name}
                  </h4>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {reel.influencer_username}
                  </span>
                </div>
              </div>

              {/* Reel Caption */}
              <div className="p-3 flex-1">
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug">
                  {reel.caption || 'No caption entered.'}
                </p>
              </div>

              {/* Tagged Product Box (Add to Cart Trigger) */}
              <div className="p-2.5 mx-2.5 mb-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                {reel.product_name ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={reel.product_image || '/placeholder.png'}
                      alt={reel.product_name}
                      className="w-7 h-7 rounded-md object-cover bg-slate-900 border border-slate-800 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-amber-300 truncate">
                        {reel.product_name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[9px]">
                        <span className="text-amber-400 font-bold">₹{reel.product_price}</span>
                        {reel.product_discount && (
                          <span className="text-emerald-400 font-bold">{reel.product_discount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 block text-center">
                    No product linked
                  </span>
                )}
              </div>

              {/* Instagram Reel Link Indicator & Quick Tester */}
              <div className="px-2.5 pb-2">
                {reel.instagram_url ? (
                  <a
                    href={reel.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-[#f09433]/15 via-[#dc2743]/15 to-[#bc1888]/15 border border-[#ee2a7b]/40 hover:border-[#ee2a7b] text-[#ee2a7b] hover:text-white hover:bg-gradient-to-r hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] text-[10px] font-bold flex items-center justify-between transition-all group/instatest"
                    title="Open original Instagram reel link in new tab"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <InstagramGlyph className="w-3 h-3 shrink-0 text-[#ee2a7b] group-hover/instatest:text-white" />
                      <span className="truncate">Instagram Reel Linked</span>
                    </span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0 ml-1 opacity-80" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReel(reel);
                      setEditorOpen(true);
                    }}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>⚠️ Add Instagram Reel Link</span>
                  </button>
                )}
              </div>

              {/* Card Action Footer */}
              <div className="p-2.5 pt-0 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReel(reel);
                    setEditorOpen(true);
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3 h-3 text-indigo-400" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReelToDelete(reel)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                  title="Delete reel"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Reel Editor Modal */}
      <ReelEditorModal
        reel={selectedReel}
        isOpen={editorOpen}
        onSave={handleSaveReel}
        onClose={() => {
          setEditorOpen(false);
          setSelectedReel(null);
        }}
        showToast={showToast}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(reelToDelete)}
        title="Delete Instagram Reel"
        message={`Are you sure you want to delete the reel by ${reelToDelete?.influencer_name} (${reelToDelete?.influencer_username})? This will remove the video from your store.`}
        itemName={reelToDelete?.influencer_name}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Reel'}
        onConfirm={handleDeleteConfirm}
        onClose={() => setReelToDelete(null)}
      />

    </div>
  );
};
