'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Heart, MessageCircle, Send, Bookmark, ShoppingBag, Search, X,
  ArrowLeft, ArrowRight, BadgeCheck, Camera, Play, Pause, Music2,
  Volume2, VolumeX, Sparkles, Check, Maximize2, ChevronUp, ChevronDown,
  Grid, LayoutList, Share2, Star, ShieldCheck, Flame, ExternalLink, Zap,
  Video, Film, Instagram
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

/* =========================================================
   SHOP THE GRAM — Ultra-Responsive Instagram Reels & Influencer Feed
   Optimized for iPhone (iOS Safari safe-areas & touch swipe),
   Android, Tablets, and PC Screens (Split Cinema View + Grid/Carousel)
   ========================================================= */

/* ---------- Scroll Reveal Helper ---------- */
const Reveal = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/* ---------- Reel Skeleton Shimmer Component (100% Dynamic Loading) ---------- */
const ReelSkeleton = () => (
  <div className="shrink-0 w-[78vw] xs:w-[74vw] sm:w-[300px] md:w-[330px] lg:w-[345px] max-w-[360px]">
    <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-[#12100d] p-3 animate-pulse">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="h-3 w-24 bg-white/10 rounded" />
          <div className="h-2 w-16 bg-white/10 rounded" />
        </div>
      </div>
      <div className="aspect-[9/13.5] rounded-xl bg-white/5 flex items-center justify-center">
        <Video className="w-8 h-8 text-white/15" />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="h-3 w-28 bg-white/10 rounded" />
          <div className="h-2.5 w-16 bg-white/10 rounded" />
        </div>
        <div className="w-20 h-7 rounded-full bg-white/10 shrink-0" />
      </div>
    </div>
  </div>
);

const gramWords = ['Reels', 'Feed', 'Gram', 'Trend'];

/* ---------- Authentic Instagram Glyph SVG Component ---------- */
const InstagramGlyph = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

/* =========================================================
   SINGLE REEL CARD COMPONENT
   Auto-plays on scroll into view on iOS / Android + hover on PC
   ========================================================= */
const ReelCard = ({
  post,
  idx,
  onAddToCart,
  onOpenModal,
  isGlobalMuted,
  toggleGlobalMute,
  viewMode = 'carousel'
}) => {
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchMovedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [copied, setCopied] = useState(false);
  const [tapRipple, setTapRipple] = useState(false);
  const { addToast } = useToast();

  /* --- Mobile Touch Gesture Tracking: Distinguish between scrolling and a deliberate tap --- */
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchMovedRef.current = false;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      const dx = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
      // If the user drags more than 8px in either direction, it is a scroll, not a tap
      if (dx > 8 || dy > 8) {
        touchMovedRef.current = true;
      }
    }
  };

  /* --- Intersection Observer: Pause video when scrolled out of view (NO autoplay during scroll) --- */
  useEffect(() => {
    const cardEl = cardRef.current;
    if (!cardEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Never force autoplay when scrolling the page on mobile!
          // Only pause if this reel was actively playing and moved out of view.
          if (!entry.isIntersecting || entry.intersectionRatio < 0.2) {
            if (videoRef.current) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: [0.2] }
    );

    observer.observe(cardEl);
    return () => observer.disconnect();
  }, []);

  /* --- Track video playback progress bar with 0 re-render overhead --- */
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration && progressBarRef.current) {
      const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      progressBarRef.current.style.width = `${pct}%`;
    }
  };

  /* --- Sync global mute with local video --- */
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isGlobalMuted;
    }
  }, [isGlobalMuted]);

  /* --- Desktop Mouse Enter/Leave (Strictly for real desktop mouse, completely ignored on phones/touchscreens) --- */
  const handleMouseEnter = (e) => {
    if (
      typeof window !== 'undefined' &&
      (window.innerWidth < 1024 ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (window.matchMedia && !window.matchMedia('(hover: hover) and (pointer: fine)').matches))
    ) {
      return;
    }
    if (e && e.nativeEvent && (e.nativeEvent.pointerType === 'touch' || e.nativeEvent.sourceCapabilities?.firesTouchEvents)) {
      return;
    }
    if (videoRef.current) {
      videoRef.current.muted = isGlobalMuted;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => { });
    }
  };

  const handleMouseLeave = (e) => {
    if (
      typeof window !== 'undefined' &&
      (window.innerWidth < 1024 ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (window.matchMedia && !window.matchMedia('(hover: hover) and (pointer: fine)').matches))
    ) {
      return;
    }
    if (e && e.nativeEvent && (e.nativeEvent.pointerType === 'touch' || e.nativeEvent.sourceCapabilities?.firesTouchEvents)) {
      return;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    if (progressBarRef.current) {
      progressBarRef.current.style.width = '0%';
    }
    setIsPlaying(false);
  };

  /* --- Tap / Click Play/Pause toggle (Only on genuine tap, never while scrolling) --- */
  const handleVideoTap = (e) => {
    e.stopPropagation();
    if (touchMovedRef.current) return;

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.muted = isGlobalMuted;
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => { });
      }
      setTapRipple(true);
      setTimeout(() => setTapRipple(false), 500);
    }
  };

  /* --- Double tap to like (Instagram style with haptic feedback) --- */
  const handleDoubleTap = (e) => {
    e.stopPropagation();
    if (touchMovedRef.current) return;

    if (!isLiked) {
      setIsLiked(true);
      setLikesCount((p) => p + 1);
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(25); } catch (_) { }
    }
    setShowHeartPop(true);
    setTimeout(() => setShowHeartPop(false), 800);
  };

  const toggleLike = (e) => {
    e.stopPropagation();
    if (!isLiked) {
      setIsLiked(true);
      setLikesCount((p) => p + 1);
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 800);
    } else {
      setIsLiked(false);
      setLikesCount((p) => p - 1);
    }
  };

  const toggleSave = (e) => {
    e.stopPropagation();
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    addToast(nextSaved ? 'Saved look to your wishlist!' : 'Removed look from wishlist', 'info');
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/product/${post.slug}` : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.name} Look - Trio Ecart`,
          text: post.caption,
          url: shareUrl,
        });
        return;
      } catch (_) { }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      addToast('Reel product link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`${viewMode === 'grid'
        ? 'w-full'
        : 'shrink-0 w-[78vw] xs:w-[74vw] sm:w-[300px] md:w-[330px] lg:w-[345px] max-w-[360px]'
        }`}
    >
      <article
        className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-[#12100d] shadow-xl transition-all duration-500 md:hover:border-[#ee2a7b]/50 md:hover:-translate-y-1.5 md:hover:shadow-[0_20px_50px_rgba(238,42,123,0.22)]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* ===== Top Creator Info Bar ===== */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-auto">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 shrink-0">
              <div className="gram-ig-ring absolute inset-0 rounded-full" />
              <div className="absolute inset-[2px] rounded-full overflow-hidden bg-[#12100d]">
                <img
                  src={post.avatar || post.img}
                  alt={post.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="leading-tight min-w-0">
              <span className="gram-body flex items-center gap-1 text-white text-[11px] sm:text-xs font-bold truncate">
                {post.handle}
                {post.verified && <BadgeCheck size={12} className="text-[#4a9eff] shrink-0" />}
              </span>
              <span className="gram-body text-white/50 text-[9px] sm:text-[10px] block truncate">
                {post.followers} followers
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {post.instagramUrl ? (
              <a
                href={post.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="gram-body group/igpill inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-[0_2px_10px_rgba(220,39,67,0.45)] hover:shadow-[0_4px_16px_rgba(220,39,67,0.7)] hover:scale-105 active:scale-95 transition-all duration-200 border border-white/25 shrink-0 cursor-pointer"
                title="Watch original reel on Instagram"
              >
                <InstagramGlyph className="w-3.5 h-3.5 shrink-0 transition-transform group-hover/igpill:rotate-12" />
                <span className="hidden xs:inline sm:inline">View Reel</span>
                <span className="xs:hidden sm:hidden">Reel</span>
                <ExternalLink size={10} className="opacity-90 transition-transform group-hover/igpill:translate-x-0.5 group-hover/igpill:-translate-y-0.5" />
              </a>
            ) : null}
            <span className="gram-body gram-float-badge inline-flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-white/15 shadow-sm">
              <Play size={8} className="fill-white" /> {post.views}
            </span>
          </div>
        </div>

        {/* ===== Video / Image Visual Container ===== */}
        <div
          className="relative aspect-[9/14] sm:aspect-[9/13.5] overflow-hidden bg-[#12100d] cursor-pointer"
          onClick={handleVideoTap}
          onDoubleClick={handleDoubleTap}
        >
          {/* Static poster image */}
          <img
            src={post.img}
            alt={`${post.name} wearing ${post.product}`}
            className={`w-full h-full object-cover transition-all duration-700 ease-out md:group-hover:scale-105 ${isPlaying ? 'opacity-0' : 'opacity-95'
              }`}
            loading="lazy"
          />

          {/* Video Reel with iOS Safari inline playback & disable picture-in-picture */}
          {post.video && (
            <video
              ref={videoRef}
              src={post.video}
              poster={post.img}
              muted={isGlobalMuted}
              loop
              playsInline
              webkit-playsinline="true"
              x5-playsinline="true"
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
              preload="metadata"
              onTimeUpdate={handleTimeUpdate}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 pointer-events-none ${isPlaying ? 'opacity-100' : 'opacity-0'
                }`}
            />
          )}

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent pointer-events-none opacity-85 md:group-hover:opacity-95 transition-opacity" />

          {/* Tag Chip */}
          <span className="gram-body absolute top-12 sm:top-14 left-3 sm:left-4 z-10 bg-[#d4af37] text-[#171310] text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md pointer-events-none">
            {post.tag}
          </span>

          {/* Floating Sound Toggle Pill / Button */}
          <button
            type="button"
            aria-label={isGlobalMuted ? 'Unmute video' : 'Mute video'}
            onClick={(e) => {
              e.stopPropagation();
              toggleGlobalMute();
            }}
            className="absolute top-12 sm:top-14 right-3 sm:right-4 z-20 w-8 h-8 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-transform active:scale-90 hover:scale-110 shadow-lg"
          >
            {isGlobalMuted ? (
              <VolumeX size={14} className="text-white/80" />
            ) : (
              <Volume2 size={14} className="text-[#d4af37]" />
            )}
          </button>

          {/* Expand into Fullscreen Modal Button */}
          <button
            type="button"
            aria-label="Open Fullscreen Reel"
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal(post);
            }}
            className="absolute top-22 right-3 sm:right-4 z-20 w-8 h-8 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-transform active:scale-90 hover:scale-110 shadow-lg"
            title="Expand Fullscreen Reel"
          >
            <Maximize2 size={13} className="text-white/90" />
          </button>

          {/* Center Play / Pause Indicator Ripple */}
          <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300 ${tapRipple || !isPlaying ? 'opacity-90 scale-100' : 'opacity-0 scale-75'
              }`}
          >
            <span className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-xl">
              {isPlaying ? <Pause size={18} className="fill-white" /> : <Play size={18} className="fill-white ml-0.5" />}
            </span>
          </div>

          {/* Floating Double-Tap Heart Animation */}
          {showHeartPop && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <Heart size={76} className="gram-heart-pop fill-[#ee2a7b] text-[#ee2a7b] drop-shadow-[0_0_24px_rgba(238,42,123,0.9)]" />
            </div>
          )}

          {/* Right Action Rail (Touch-Friendly Glass Container on Mobile & Desktop) */}
          <div className="absolute right-2.5 sm:right-3 bottom-24 sm:bottom-28 z-20 flex flex-col items-center gap-2.5 sm:gap-3 bg-black/50 sm:bg-black/40 backdrop-blur-md border border-white/15 rounded-full px-1.5 py-2.5 shadow-lg">
            {/* Like */}
            <button
              type="button"
              aria-label={isLiked ? 'Unlike' : 'Like'}
              onClick={toggleLike}
              className="flex flex-col items-center gap-0.5 group/heart transition-transform active:scale-75"
            >
              <Heart
                size={19}
                className={`transition-colors ${isLiked ? 'fill-[#ee2a7b] text-[#ee2a7b]' : 'text-white hover:text-[#ee2a7b]'
                  }`}
              />
              <span className="gram-body text-white text-[9px] font-bold">
                {likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount}
              </span>
            </button>

            {/* Comments */}
            <button
              type="button"
              aria-label="Comments"
              onClick={(e) => {
                e.stopPropagation();
                onOpenModal(post);
              }}
              className="flex flex-col items-center gap-0.5 transition-transform active:scale-75"
            >
              <MessageCircle size={18} className="text-white hover:text-[#4a9eff] transition-colors" />
              <span className="gram-body text-white text-[9px] font-bold">{post.comments}</span>
            </button>

            {/* Share */}
            <button
              type="button"
              aria-label="Share"
              onClick={handleShare}
              className="flex flex-col items-center gap-0.5 transition-transform active:scale-75"
            >
              {copied ? (
                <Check size={18} className="text-emerald-400" />
              ) : (
                <Send size={18} className="text-white hover:text-[#d4af37] transition-colors" />
              )}
              <span className="gram-body text-white text-[9px] font-bold">Share</span>
            </button>

            {/* Direct Watch on Instagram Reel button */}
            {post.instagramUrl ? (
              <a
                href={post.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col items-center gap-0.5 group/igrail transition-transform active:scale-75 cursor-pointer"
                title="Watch original reel on Instagram"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-md border border-white/25 group-hover/igrail:scale-110 transition-transform">
                  <InstagramGlyph className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="gram-body text-white text-[8px] font-extrabold drop-shadow">Insta</span>
              </a>
            ) : null}
          </div>

          {/* Bottom Caption & Music Bar Overlay */}
          <div className="absolute bottom-1 inset-x-0 z-10 p-3 sm:p-4 pointer-events-none">
            <p className="gram-body text-white/95 text-[11px] sm:text-xs leading-snug line-clamp-2 mb-1.5 pr-12 drop-shadow-md">
              <b className="text-white font-semibold">{post.handle}</b> {post.caption}
            </p>
            <div className="flex items-center gap-2">
              <Music2 size={11} className="text-white/70 shrink-0" />
              <span className="flex items-end gap-[2px] h-2.5 shrink-0">
                <span className={`gram-music-bar w-[2px] h-full bg-[#ee2a7b] rounded-full ${!isPlaying ? 'opacity-40' : ''}`} />
                <span className={`gram-music-bar w-[2px] h-full bg-[#ee2a7b] rounded-full [animation-delay:0.2s] ${!isPlaying ? 'opacity-40' : ''}`} />
                <span className={`gram-music-bar w-[2px] h-full bg-[#ee2a7b] rounded-full [animation-delay:0.4s] ${!isPlaying ? 'opacity-40' : ''}`} />
              </span>
              <span className="gram-body text-white/70 text-[9px] sm:text-[10px] tracking-wide truncate">{post.song}</span>
            </div>
          </div>

          {/* Live Video Scrub Progress Line (Instagram Reel Bottom Line) */}
          <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-20 pointer-events-none">
            <div
              ref={progressBarRef}
              className="h-full bg-gradient-to-r from-[#ee2a7b] to-[#d4af37] transition-all duration-100 ease-linear pointer-events-none"
              style={{ width: '0%' }}
            />
          </div>
        </div>

        {/* ===== Shoppable Product Footer ===== */}
        <div className="relative z-10 flex items-center justify-between gap-2.5 px-3 sm:px-4 py-3 bg-[#12100d] border-t border-white/5">
          <div className="min-w-0 flex-1">
            <Link
              href={`/product/${post.slug}`}
              className="gram-body text-white text-[11px] sm:text-xs font-semibold truncate block hover:text-[#d4af37] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {post.product}
            </Link>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[#d4af37] font-bold text-xs sm:text-sm">{post.price}</span>
              <span className="text-white/35 line-through text-[9px] sm:text-[10px]">{post.oldPrice}</span>
              <span className="text-emerald-400 text-[9px] font-bold">{post.discount}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {post.instagramUrl ? (
              <a
                href={post.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="gram-body group/igfoot inline-flex items-center gap-1 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-md border border-white/20"
                title="Watch original reel on Instagram"
              >
                <InstagramGlyph className="w-3 h-3 transition-transform group-hover/igfoot:rotate-12" />
                <span className="hidden xs:inline">View Reel</span>
                <span className="xs:hidden">Reel</span>
                <ExternalLink size={9} className="opacity-80" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(post);
              }}
              className="gram-body group/cart shrink-0 inline-flex items-center gap-1.5 bg-[#d4af37] text-[#171310] text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
            >
              <ShoppingBag size={12} className="transition-transform group-hover/cart:-rotate-12" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};

/* =========================================================
   FULLSCREEN REEL VIEWER MODAL (INSTAGRAM REELS EXPERIENCE)
   Mobile: Immersive 100dvh Vertical Story Reel with Touch Swipe
   Desktop / PC: Split-Screen Cinema View with Product Showcase & Comments
   ========================================================= */
const ReelModal = ({ post, isOpen, onClose, onAddToCart, onBuyNow, onNext, onPrev }) => {
  const modalVideoRef = useRef(null);
  const touchStartY = useRef(null);
  const touchEndY = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post?.likesCount || 0);
  const [copied, setCopied] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('product'); // 'product' | 'comments'
  const { addToast } = useToast();

  useEffect(() => {
    if (!isOpen || !post) return;
    setIsLiked(false);
    setLikesCount(post.likesCount || 0);
    setIsPlaying(true);
    setProgress(0);

    if (modalVideoRef.current) {
      modalVideoRef.current.currentTime = 0;
      modalVideoRef.current.muted = isMuted;
      modalVideoRef.current.play().catch(() => { });
    }
  }, [isOpen, post]);

  /* Keyboard shortcuts for PC Screen experience */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowUp') { e.preventDefault(); onPrev(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); onNext(); }
      if (e.key === 'm' || e.key === 'M') { e.preventDefault(); toggleMute(); }
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNext, onPrev, onClose, isMuted, isPlaying]);

  /* Track video time progress */
  const handleTimeUpdate = () => {
    if (modalVideoRef.current && modalVideoRef.current.duration) {
      const pct = (modalVideoRef.current.currentTime / modalVideoRef.current.duration) * 100;
      setProgress(pct);
    }
  };

  /* Mobile Touch Swipe Up / Down Handlers */
  const handleTouchStart = (e) => {
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!touchStartY.current || !touchEndY.current) return;
    const diffY = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50;

    if (diffY > minSwipeDistance) {
      // Swiped Up -> Next Reel
      onNext();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(15); } catch (_) { }
      }
    } else if (diffY < -minSwipeDistance) {
      // Swiped Down -> Prev Reel
      onPrev();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(15); } catch (_) { }
      }
    }
    touchStartY.current = null;
    touchEndY.current = null;
  };

  if (!isOpen || !post) return null;

  const togglePlay = () => {
    if (modalVideoRef.current) {
      if (isPlaying) {
        modalVideoRef.current.pause();
        setIsPlaying(false);
      } else {
        modalVideoRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
      }
    }
  };

  const toggleMute = () => {
    if (modalVideoRef.current) {
      modalVideoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleLike = () => {
    if (!isLiked) {
      setIsLiked(true);
      setLikesCount((p) => p + 1);
      setShowHeartPop(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(25); } catch (_) { }
      }
      setTimeout(() => setShowHeartPop(false), 800);
    } else {
      setIsLiked(false);
      setLikesCount((p) => p - 1);
    }
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/product/${post.slug}` : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.name} Look - Trio Ecart`,
          text: post.caption,
          url: shareUrl,
        });
        return;
      } catch (_) { }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      addToast('Product link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-2xl p-0 sm:p-4 md:p-6 lg:p-8 overscroll-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Overlay Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Floating Close Button */}
      <button
        type="button"
        aria-label="Close Reel Modal"
        onClick={onClose}
        className="absolute top-3 sm:top-5 right-3 sm:right-6 z-50 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-2xl cursor-pointer"
      >
        <X size={19} />
      </button>

      {/* Vertical Navigation Pill on Desktop (Arrow Up/Down) */}
      <div className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 flex-col items-center gap-3 z-50">
        <button
          type="button"
          aria-label="Previous Reel"
          onClick={onPrev}
          className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-[#d4af37] hover:text-black transition-all shadow-xl active:scale-95 cursor-pointer"
          title="Previous Reel (Up Arrow)"
        >
          <ChevronUp size={22} />
        </button>
        <div className="text-[10px] font-mono text-white/50 tracking-widest uppercase writing-mode-vertical">
          SWIPE
        </div>
        <button
          type="button"
          aria-label="Next Reel"
          onClick={onNext}
          className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-[#d4af37] hover:text-black transition-all shadow-xl active:scale-95 cursor-pointer"
          title="Next Reel (Down Arrow)"
        >
          <ChevronDown size={22} />
        </button>
      </div>

      {/* ===== Main Reel Container =====
          Mobile: Full viewport height (100dvh) with iPhone safe-area padding
          PC: Split cinema layout (Left 9:16 Video + Right Shoppable Panel) */}
      <div className="relative w-full h-[100dvh] sm:h-[92vh] sm:max-h-[860px] lg:max-w-[880px] xl:max-w-[920px] sm:rounded-3xl overflow-hidden bg-[#0d0b09] shadow-2xl flex flex-col lg:flex-row z-10 border border-white/15">

        {/* ====================================================
            LEFT / MAIN: Vertical Cinema Video Player (9:16)
            ==================================================== */}
        <div className="relative flex-1 lg:max-w-[430px] h-full bg-black flex flex-col justify-between overflow-hidden">

          {/* Top Header Bar inside Video Container */}
          <div className="relative z-30 flex items-center justify-between p-3.5 sm:p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent pt-[env(safe-area-inset-top,12px)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-[#ee2a7b]">
                <img src={post.avatar || post.img} alt={post.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="gram-body flex items-center gap-1 text-white text-xs font-bold">
                  {post.handle}
                  {post.verified && <BadgeCheck size={13} className="text-[#4a9eff]" />}
                </span>
                <span className="gram-body text-white/50 text-[10px]">{post.followers} followers</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center cursor-pointer hover:border-[#d4af37]"
                title={isMuted ? 'Turn Sound On' : 'Turn Sound Off'}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} className="text-[#d4af37]" />}
              </button>
            </div>
          </div>

          {/* Video Player Center */}
          <div
            className="relative flex-1 bg-black flex items-center justify-center cursor-pointer overflow-hidden"
            onClick={togglePlay}
            onDoubleClick={toggleLike}
          >
            <video
              ref={modalVideoRef}
              src={post.video}
              poster={post.img}
              muted={isMuted}
              loop
              playsInline
              webkit-playsinline="true"
              x5-playsinline="true"
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
              onTimeUpdate={handleTimeUpdate}
              className="w-full h-full object-cover"
            />

            {/* Floating Double-Tap Heart Animation */}
            {showHeartPop && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <Heart size={96} className="gram-heart-pop fill-[#ee2a7b] text-[#ee2a7b] drop-shadow-[0_0_35px_rgba(238,42,123,0.95)]" />
              </div>
            )}

            {/* Play/Pause Center Indicator */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-2xl">
                  <Play size={24} className="fill-white ml-1" />
                </span>
              </div>
            )}

            {/* Action Rail on Mobile (Floating on the right) */}
            <div className="lg:hidden absolute right-3 bottom-24 z-30 flex flex-col items-center gap-3.5 bg-black/50 backdrop-blur-md border border-white/15 rounded-full p-2 shadow-xl">
              <button type="button" onClick={toggleLike} className="flex flex-col items-center gap-0.5">
                <Heart
                  size={24}
                  className={`transition-all ${isLiked ? 'fill-[#ee2a7b] text-[#ee2a7b]' : 'text-white'}`}
                />
                <span className="gram-body text-white text-[9px] font-bold">
                  {likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount}
                </span>
              </button>

              <button type="button" onClick={handleShare} className="flex flex-col items-center gap-0.5">
                {copied ? <Check size={22} className="text-emerald-400" /> : <Send size={22} className="text-white" />}
                <span className="gram-body text-white text-[9px] font-bold">Share</span>
              </button>

              <button type="button" onClick={toggleMute} className="flex flex-col items-center gap-0.5">
                {isMuted ? <VolumeX size={22} className="text-white/80" /> : <Volume2 size={22} className="text-[#d4af37]" />}
                <span className="gram-body text-white text-[9px] font-bold">{isMuted ? 'Mute' : 'Audio'}</span>
              </button>

              {post?.instagramUrl && (
                <a
                  href={post.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-0.5 group/morig transition-transform active:scale-75"
                  title="Watch original reel on Instagram"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-md border border-white/25 group-hover/morig:scale-110 transition-transform">
                    <InstagramGlyph className="w-4 h-4 text-white" />
                  </div>
                  <span className="gram-body text-white text-[8px] font-extrabold">Insta</span>
                </a>
              )}
            </div>

            {/* Caption & Music Bar on Mobile (Overlaid at bottom of video) */}
            <div className="lg:hidden absolute bottom-16 inset-x-0 z-20 p-3.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none">
              <p className="gram-body text-white/95 text-[11px] leading-snug line-clamp-2 pr-14 mb-1.5 drop-shadow-md">
                <b className="text-white">{post.handle}</b> {post.caption}
              </p>
              <div className="flex items-center gap-2">
                <Music2 size={11} className="text-white/70" />
                <span className="gram-body text-white/70 text-[9px] truncate">{post.song}</span>
              </div>
            </div>

            {/* Video Scrub Progress Line */}
            <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-20">
              <div
                className="h-full bg-gradient-to-r from-[#ee2a7b] to-[#d4af37] transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Shoppable Drawer on Mobile Screen (Fixed to bottom with iPhone safe-area) */}
          <div className="lg:hidden relative z-30 p-3 bg-[#14110f] border-t border-white/10 flex items-center justify-between gap-2.5 pb-[env(safe-area-inset-bottom,12px)]">
            <Link
              href={`/product/${post.slug}`}
              className="flex items-center gap-2 min-w-0 flex-1"
              onClick={onClose}
            >
              <img src={post.productImage || post.img} alt={post.product} className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0" />
              <div className="min-w-0">
                <p className="gram-body text-white text-xs font-bold truncate">{post.product}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="gram-body text-xs text-[#d4af37] font-bold">{post.price}</span>
                  <span className="gram-body text-[10px] text-white/40 line-through">{post.oldPrice}</span>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onAddToCart(post)}
                className="gram-body bg-white/10 hover:bg-white/20 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-2 rounded-full transition-all active:scale-95 cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => onBuyNow(post)}
                className="gram-body bg-[#d4af37] text-black text-[9px] font-black uppercase tracking-wider px-3 py-2 rounded-full transition-all active:scale-95 shadow-md flex items-center gap-1 cursor-pointer"
              >
                <Zap size={11} className="fill-black" />
                <span>Buy</span>
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================
            RIGHT PANEL: Desktop / PC Screen Shoppable Showcase
            (Visible on large screens, replaces mobile overlay)
            ==================================================== */}
        <div className="hidden lg:flex flex-col flex-1 w-full max-w-[490px] h-full bg-[#12100d] border-l border-white/10 overflow-y-auto">

          {/* Creator Profile Card */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-11 h-11 shrink-0">
                <div className="gram-ig-ring absolute inset-0 rounded-full" />
                <div className="absolute inset-[2.5px] rounded-full overflow-hidden bg-[#12100d]">
                  <img src={post.avatar || post.img} alt={post.name} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="gram-body text-white font-bold text-sm truncate">{post.name}</span>
                  {post.verified && <BadgeCheck size={14} className="text-[#4a9eff]" />}
                </div>
                <span className="gram-body text-white/50 text-xs">{post.handle} • {post.followers}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {post?.instagramUrl && (
                <a
                  href={post.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gram-body group/mighdr px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_3px_12px_rgba(220,39,67,0.45)] hover:scale-105 active:scale-95 border border-white/20"
                  title="Watch Original Reel on Instagram"
                >
                  <InstagramGlyph className="w-3.5 h-3.5 transition-transform group-hover/mighdr:rotate-12" />
                  <span>Watch Reel</span>
                  <ExternalLink size={12} className="opacity-90" />
                </a>
              )}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="gram-body px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
              >
                Follow
              </a>
            </div>
          </div>

          {/* Caption & Music Bar */}
          <div className="p-5 border-b border-white/10 space-y-3">
            <p className="gram-body text-white/90 text-xs sm:text-sm leading-relaxed">
              {post.caption}
            </p>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
              <Music2 size={13} className="text-[#ee2a7b]" />
              <span className="gram-body text-white/80 text-xs font-medium truncate">{post.song}</span>
              <span className="ml-auto flex items-end gap-[2px] h-3 shrink-0">
                <span className="gram-music-bar w-[2px] h-full bg-[#ee2a7b] rounded-full" />
                <span className="gram-music-bar w-[2px] h-full bg-[#ee2a7b] rounded-full [animation-delay:0.2s]" />
                <span className="gram-music-bar w-[2px] h-full bg-[#ee2a7b] rounded-full [animation-delay:0.4s]" />
              </span>
            </div>
          </div>

          {/* Navigation Tabs: Shoppable Product vs Comments */}
          <div className="flex border-b border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('product')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'product'
                ? 'text-[#d4af37] border-b-2 border-[#d4af37] bg-white/[0.02]'
                : 'text-white/50 hover:text-white'
                }`}
            >
              <ShoppingBag size={14} />
              <span>Tagged Product</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'comments'
                ? 'text-[#d4af37] border-b-2 border-[#d4af37] bg-white/[0.02]'
                : 'text-white/50 hover:text-white'
                }`}
            >
              <MessageCircle size={14} />
              <span>Community ({post.comments})</span>
            </button>
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 p-5 overflow-y-auto">
            {activeTab === 'product' ? (
              <div className="space-y-4">
                {/* Shoppable Product Card Box */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#d4af37]/40 transition-colors">
                  <div className="flex gap-3.5">
                    <img
                      src={post.productImage || post.img}
                      alt={post.product}
                      className="w-20 h-20 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                          <span>{post.tag}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">● In Stock</span>
                        </div>
                        <h4 className="gram-body text-white font-bold text-sm line-clamp-2 mt-0.5 leading-snug">
                          {post.product}
                        </h4>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-[#d4af37] font-black text-lg">{post.price}</span>
                        <span className="text-white/40 line-through text-xs">{post.oldPrice}</span>
                        <span className="text-emerald-400 text-xs font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          {post.discount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quality Assurance Badges */}
                  <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px] text-white/60">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-[#d4af37]" /> Authentic Artisan Piece
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Star size={13} className="text-amber-400 fill-amber-400" /> {post.rating} ({post.reviews} reviews)
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onAddToCart(post)}
                      className="gram-body flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <ShoppingBag size={14} /> Add to Cart
                    </button>
                    <button
                      type="button"
                      onClick={() => onBuyNow(post)}
                      className="gram-body flex-1 py-2.5 px-3 rounded-xl bg-[#d4af37] hover:bg-[#c5a028] text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-lg"
                    >
                      <Zap size={14} className="fill-black" /> Buy Now
                    </button>
                  </div>

                  {/* Link to Full Product Page */}
                  <Link
                    href={`/product/${post.slug}`}
                    className="gram-body mt-2.5 text-center block text-[11px] text-[#d4af37] hover:underline font-semibold"
                    onClick={onClose}
                  >
                    View Full Product Details &amp; Specifications →
                  </Link>

                  {/* Watch on Instagram Button (Desktop Modal) */}
                  {post?.instagramUrl && (
                    <a
                      href={post.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3.5 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] hover:opacity-95 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-[0_6px_20px_rgba(220,39,67,0.45)] hover:shadow-[0_8px_28px_rgba(220,39,67,0.7)] hover:scale-[1.02] active:scale-[0.98] border border-white/25 group/igcta"
                    >
                      <InstagramGlyph className="w-4 h-4 transition-transform group-hover/igcta:rotate-12" />
                      <span>Watch Original Reel on Instagram</span>
                      <ExternalLink size={14} className="opacity-90 transition-transform group-hover/igcta:translate-x-0.5 group-hover/igcta:-translate-y-0.5" />
                    </a>
                  )}
                </div>

                {/* Keyboard controls helper pill */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[10px] text-white/40 flex items-center justify-between font-mono">
                  <span>KEYBOARD:</span>
                  <span>↑ / ↓ : Navigate</span>
                  <span>Space : Play/Pause</span>
                  <span>Esc : Close</span>
                </div>
              </div>
            ) : (
              /* Simulated Community Comments Feed */
              <div className="space-y-3.5">
                {post.commentsList && post.commentsList.map((c, i) => (
                  <div key={i} className="flex gap-2.5 text-xs">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#ee2a7b] to-[#d4af37] flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                      {c.user[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-[11px]">{c.user}</span>
                        <span className="text-white/40 text-[9px]">{c.time}</span>
                      </div>
                      <p className="text-white/80 text-xs mt-0.5 leading-snug">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Footer Actions */}
          <div className="p-4 border-t border-white/10 bg-[#0e0c0a] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleLike}
                className="flex items-center gap-1.5 text-white hover:text-[#ee2a7b] transition-colors cursor-pointer"
              >
                <Heart size={20} className={isLiked ? 'fill-[#ee2a7b] text-[#ee2a7b]' : ''} />
                <span className="gram-body text-xs font-bold">{likesCount}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 text-white hover:text-[#d4af37] transition-colors cursor-pointer"
              >
                {copied ? <Check size={18} className="text-emerald-400" /> : <Send size={18} />}
                <span className="gram-body text-xs font-bold">Share</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPrev}
                className="p-1.5 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-[#d4af37] transition-colors cursor-pointer"
                title="Previous Reel"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                onClick={onNext}
                className="p-1.5 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-[#d4af37] transition-colors cursor-pointer"
                title="Next Reel"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function parseNumericCount(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const str = String(val).trim().toUpperCase();
  if (str.endsWith('M')) return Math.round(parseFloat(str) * 1000000);
  if (str.endsWith('K')) return Math.round(parseFloat(str) * 1000);
  const num = parseInt(str.replace(/,/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

/* =========================================================
   MAIN SHOP THE GRAM COMPONENT
   ========================================================= */
export default function ShopTheGram() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wordIdx, setWordIdx] = useState(0);
  const [wordChanging, setWordChanging] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isGlobalMuted, setIsGlobalMuted] = useState(true);
  const [activeModalPost, setActiveModalPost] = useState(null);
  const [activePostIdx, setActivePostIdx] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [viewMode, setViewMode] = useState('carousel'); // 'carousel' | 'grid'

  // Fetch live reels from Supabase API on mount
  useEffect(() => {
    let isMounted = true;
    async function loadReels() {
      try {
        const res = await fetch(`/api/reels?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) {
            const activeReels = data.filter((r) => r.is_active !== false);
            const mapped = activeReels.map((r, i) => ({
              id: r.id || `reel-${i}`,
              avatar: r.influencer_avatar || r.thumbnail_url || 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/avatars/Abida_Fatima.jpg',
              img: r.thumbnail_url || r.product_image || r.influencer_avatar || 'https://gkskeljvgphslkzctjfp.supabase.co/storage/v1/object/public/reels/avatars/Abida_Fatima.jpg',
              video: r.video_url,
              handle: r.influencer_username || '@trioenterprises',
              name: r.influencer_name || 'Trio Influencer',
              verified: true,
              followers: r.followers || '250K',
              likes: r.likes_count || '15K',
              likesCount: parseNumericCount(r.likes_count) || 15000,
              comments: r.comments_count || '250',
              caption: r.caption || '',
              song: r.song_title || 'Original Audio · Trio Trends',
              product: r.product_name || 'Handcrafted Artisan Decor',
              productId: r.product_id || '',
              slug: r.product_slug || '',
              price: `₹${r.product_price || 0}`,
              rawPrice: Number(r.product_price) || 0,
              oldPrice: r.product_old_price ? `₹${r.product_old_price}` : '',
              rawOldPrice: Number(r.product_old_price) || 0,
              discount: r.product_discount || '',
              productImage: r.product_image || r.thumbnail_url || '',
              tag: r.tags || 'Authentic Craft',
              rating: 4.9,
              reviews: 150,
              views: r.views_count || '100K',
              instagramUrl: (() => {
                const raw = (r.instagram_url || '').trim();
                if (raw) return raw.startsWith('http') ? raw : `https://${raw}`;
                const handle = (r.influencer_username || '').replace('@', '').trim();
                return handle ? `https://www.instagram.com/${handle}/` : 'https://www.instagram.com/trioenterprises/';
              })(),
              commentsList: [
                { user: 'craft_lover', text: 'Stunning quality! Ordered for our family celebration ✨', time: '2h ago' },
                { user: 'pooja_decor', text: 'Packaging was top notch, looks 100% royal 💯', time: '5h ago' }
              ]
            }));
            setPosts(mapped);
          }
        }
      } catch (err) {
        console.warn('Could not load reels from /api/reels:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadReels();

    // Auto-sync when switching back to storefront tab after making changes in admin panel
    const onFocus = () => loadReels();
    window.addEventListener('focus', onFocus);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const scrollerRef = useRef(null);
  const searchInputRef = useRef(null);
  const { addToCart, openCart } = useCart();
  const { addToast } = useToast();

  /* Rotating Word Animation */
  useEffect(() => {
    const t = setInterval(() => {
      setWordChanging(true);
      setTimeout(() => {
        setWordIdx((p) => (p + 1) % gramWords.length);
        setWordChanging(false);
      }, 450);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const filtered = posts.filter(
    (p) =>
      p.handle.toLowerCase().includes(query.toLowerCase()) ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.product.toLowerCase().includes(query.toLowerCase()) ||
      (p.tag && p.tag.toLowerCase().includes(query.toLowerCase()))
  );

  /* Track horizontal scroll progress */
  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max > 0) {
      const pct = Math.min(100, Math.max(0, (el.scrollLeft / max) * 100));
      setScrollProgress(pct);
    }
  };

  /* Desktop mouse drag to scroll */
  const [isMouseDown, setIsMouseDown] = useState(false);
  const dragInfoRef = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false });

  const handleMouseDown = (e) => {
    if (typeof window !== 'undefined' && window.matchMedia && !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (e.button !== 0 || !scrollerRef.current) return;
    dragInfoRef.current = {
      isDown: true,
      startX: e.pageX - scrollerRef.current.offsetLeft,
      scrollLeft: scrollerRef.current.scrollLeft,
      moved: false,
    };
    setIsMouseDown(true);
  };

  const handleMouseMove = (e) => {
    if (!dragInfoRef.current.isDown || !scrollerRef.current) return;
    const x = e.pageX - scrollerRef.current.offsetLeft;
    const walk = (x - dragInfoRef.current.startX) * 1.35;
    if (Math.abs(walk) > 4) {
      dragInfoRef.current.moved = true;
    }
    scrollerRef.current.scrollLeft = dragInfoRef.current.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    dragInfoRef.current.isDown = false;
    setIsMouseDown(false);
  };

  const scrollBy = useCallback((dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const itemWidth = el.querySelector('article')?.parentElement?.clientWidth || 320;
    el.scrollBy({ left: dir * (itemWidth + 20), behavior: 'smooth' });
  }, []);

  /* Keyboard arrow navigation support on main page */
  useEffect(() => {
    const onKey = (e) => {
      if (activeModalPost) return;
      if (e.key === 'ArrowLeft') scrollBy(-1);
      if (e.key === 'ArrowRight') scrollBy(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scrollBy, activeModalPost]);

  /* Unblock page vertical scrolling when mouse wheel is rolled over the reels scroller */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onWheel = (e) => {
      // If predominantly vertical scroll (mouse wheel up/down and not Shift+wheel)
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.shiftKey) {
        const canScrollDown = e.deltaY > 0 && (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 2);
        const canScrollUp = e.deltaY < 0 && window.scrollY > 2;
        if (canScrollDown || canScrollUp) {
          e.preventDefault();
          window.scrollBy({ top: e.deltaY, left: 0, behavior: 'auto' });
        }
      }
    };

    scroller.addEventListener('wheel', onWheel, { passive: false });
    return () => scroller.removeEventListener('wheel', onWheel);
  }, []);

  /* Unblock page vertical scrolling on touchscreens when swiping up/down over the reels scroller */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let touchStartY = 0;
    let touchStartX = 0;
    let isVerticalSwipe = false;
    let isHorizontalSwipe = false;

    const onTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        isVerticalSwipe = false;
        isHorizontalSwipe = false;
      }
    };

    const onTouchMove = (e) => {
      if (!e.touches || !e.touches[0]) return;
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = touchStartY - currentY;
      const deltaX = touchStartX - currentX;

      if (!isVerticalSwipe && !isHorizontalSwipe) {
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 5) {
          isVerticalSwipe = true;
        } else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
          isHorizontalSwipe = true;
        }
      }

      if (isVerticalSwipe) {
        window.scrollBy({ top: deltaY, left: 0, behavior: 'auto' });
        touchStartY = currentY;
      }
    };

    scroller.addEventListener('touchstart', onTouchStart, { passive: true });
    scroller.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      scroller.removeEventListener('touchstart', onTouchStart);
      scroller.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const toggleGlobalMute = () => {
    const nextMute = !isGlobalMuted;
    setIsGlobalMuted(nextMute);
    addToast(nextMute ? 'Reels audio muted' : 'Reels audio unmuted 🔊', 'info');
  };

  const handleAddToCart = (post) => {
    const productItem = {
      id: post.productId || post.id,
      name: post.product,
      slug: post.slug,
      price: post.rawPrice,
      originalPrice: post.rawOldPrice,
      category: 'Decor & Crafts',
      images: [post.productImage || post.img],
      in_stock: true,
      stock: 50,
    };
    addToCart(productItem, 1);
  };

  const handleBuyNow = (post) => {
    handleAddToCart(post);
    if (activeModalPost) setActiveModalPost(null);
    openCart();
  };

  const openModalForPost = (post) => {
    const idx = posts.findIndex((p) => p.id === post.id);
    setActivePostIdx(idx >= 0 ? idx : 0);
    setActiveModalPost(post);
  };

  const nextModalPost = () => {
    if (posts.length === 0) return;
    const nextIdx = (activePostIdx + 1) % posts.length;
    setActivePostIdx(nextIdx);
    setActiveModalPost(posts[nextIdx]);
  };

  const prevModalPost = () => {
    if (posts.length === 0) return;
    const prevIdx = (activePostIdx - 1 + posts.length) % posts.length;
    setActivePostIdx(prevIdx);
    setActiveModalPost(posts[prevIdx]);
  };

  if (!loading && posts.length === 0) {
    return null;
  }

  return (
    <section className="relative py-14 sm:py-20 lg:py-24 bg-[#0a0807] border-t border-white/5 overflow-x-clip">
      {/* Self-contained Styles & Keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600;700;800&display=swap');
        .gram-heading { font-family: 'Cormorant Garamond', serif; }
        .gram-body { font-family: 'Jost', sans-serif; }
        .gram-ig-ring {
          background: conic-gradient(from 210deg, #f9ce34, #ee2a7b, #6228d7, #f9ce34);
          animation: gram-spin 6s linear infinite;
        }
        @keyframes gram-spin { to { transform: rotate(360deg); } }
        .gram-gold-text {
          background: linear-gradient(110deg, #f9ce34 20%, #ee2a7b 45%, #6228d7 60%, #f9ce34 80%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gram-flow 4s linear infinite;
        }
        @keyframes gram-flow { to { background-position: 200% center; } }
        .gram-heart-pop { animation: gram-pop 0.5s cubic-bezier(0.16,1,0.3,1); }
        @keyframes gram-pop {
          0% { transform: scale(0.4); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 1; }
          100% { transform: scale(1); opacity: 0.95; }
        }
        .gram-marquee { animation: gram-marquee 28s linear infinite; }
        .gram-marquee:hover { animation-play-state: paused; }
        @keyframes gram-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .gram-scroller {
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
        }
        .gram-scroller::-webkit-scrollbar { display: none; }
        .gram-music-bar { animation: gram-eq 0.9s ease-in-out infinite alternate; transform-origin: bottom; }
        @keyframes gram-eq { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }
        .gram-float-badge { animation: gram-float 3.4s ease-in-out infinite; }
        @keyframes gram-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      `}</style>

      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-[#ee2a7b]/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-[#6228d7]/[0.08] blur-3xl" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* ===== Header: Responsive Profile Layout ===== */}
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Creator Profile Branding */}
            <div className="flex items-center gap-3.5 sm:gap-6">
              {/* Instagram Story Ring Avatar */}
              <div className="relative w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0">
                <div className="gram-ig-ring absolute inset-0 rounded-full" />
                <div className="absolute inset-[2.5px] sm:inset-[3px] rounded-full bg-[#0a0807] flex items-center justify-center">
                  <Camera className="w-5 h-5 sm:w-8 sm:h-8 text-white/90" />
                </div>
                <span className="gram-body absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#ee2a7b] text-white text-[7px] sm:text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-md">
                  LIVE
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="gram-body text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.35em]">Community Feed</span>
                  <BadgeCheck size={14} className="text-[#4a9eff]" />
                </div>
                <h2 className="gram-heading text-2xl xs:text-3xl sm:text-5xl md:text-6xl text-white font-semibold leading-tight">
                  Shop The{' '}
                  <span className="relative inline-block h-[1.15em] overflow-hidden align-bottom">
                    <span
                      className={`block italic gram-gold-text transition-all duration-450 ease-[cubic-bezier(0.16,1,0.3,1)] ${wordChanging ? 'translate-y-[-110%] opacity-0' : 'translate-y-0 opacity-100'
                        }`}
                    >
                      {gramWords[wordIdx]}
                    </span>
                  </span>
                </h2>

                {/* Profile Stats Row */}
                <div className="gram-body flex items-center gap-3 sm:gap-5 mt-1.5 sm:mt-3 text-white/50 text-[11px] sm:text-xs tracking-wide flex-wrap">
                  <span><b className="text-white font-bold">1.4M</b> followers</span>
                  <span><b className="text-white font-bold">{loading ? '...' : posts.length}</b> creators</span>
                  <span className="hidden sm:inline"><b className="text-white font-bold">100%</b> shoppable</span>
                </div>
              </div>
            </div>

            {/* Controls Row: Search + View Switcher + Sound + View All */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between sm:justify-end">
              {/* Expanding Search Input */}
              <div
                className={`flex items-center border rounded-full transition-all duration-300 overflow-hidden ${searchOpen
                  ? 'border-[#ee2a7b]/60 bg-white/[0.08] w-44 sm:w-60'
                  : 'border-white/15 bg-white/[0.03] w-9 sm:w-11'
                  } h-9 sm:h-11`}
              >
                <button
                  type="button"
                  aria-label={searchOpen ? 'Close search' : 'Search reels'}
                  onClick={() => {
                    setSearchOpen((o) => !o);
                    setQuery('');
                  }}
                  className="w-9 sm:w-11 h-9 sm:h-11 shrink-0 flex items-center justify-center text-white/70 hover:text-white"
                >
                  {searchOpen ? <X size={15} /> : <Search size={15} />}
                </button>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search creator, look..."
                  className={`gram-body bg-transparent text-white text-xs placeholder:text-white/35 outline-none flex-1 pr-3 ${searchOpen ? 'block' : 'hidden'
                    }`}
                />
              </div>

              {/* View Switcher: Carousel vs Grid (Desktop & Tablet) */}
              <div className="hidden sm:flex items-center p-0.5 rounded-full border border-white/15 bg-white/[0.03]">
                <button
                  type="button"
                  aria-label="Carousel view"
                  onClick={() => setViewMode('carousel')}
                  className={`p-2 rounded-full transition-all cursor-pointer ${viewMode === 'carousel'
                    ? 'bg-[#d4af37] text-black shadow-sm'
                    : 'text-white/60 hover:text-white'
                    }`}
                  title="Carousel Stream"
                >
                  <LayoutList size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Grid view"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-all cursor-pointer ${viewMode === 'grid'
                    ? 'bg-[#d4af37] text-black shadow-sm'
                    : 'text-white/60 hover:text-white'
                    }`}
                  title="Instagram Grid"
                >
                  <Grid size={14} />
                </button>
              </div>

              {/* Global Audio Toggle Button */}
              <button
                type="button"
                aria-label={isGlobalMuted ? 'Unmute reels audio' : 'Mute reels audio'}
                onClick={toggleGlobalMute}
                className="w-9 sm:w-11 h-9 sm:h-11 rounded-full border border-white/15 text-white/80 flex items-center justify-center hover:border-[#d4af37] hover:text-[#d4af37] active:scale-90 transition-all cursor-pointer"
                title={isGlobalMuted ? 'Turn Sound On' : 'Turn Sound Off'}
              >
                {isGlobalMuted ? <VolumeX size={15} /> : <Volume2 size={15} className="text-[#d4af37]" />}
              </button>

              {/* Nav Arrows (Carousel mode on Desktop) */}
              {viewMode === 'carousel' && (
                <div className="hidden sm:flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="Previous reel"
                    onClick={() => scrollBy(-1)}
                    className="w-9 sm:w-11 h-9 sm:h-11 rounded-full border border-white/15 text-white/70 flex items-center justify-center hover:border-[#ee2a7b] hover:text-[#ee2a7b] active:scale-90 transition-all cursor-pointer"
                  >
                    <ArrowLeft size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next reel"
                    onClick={() => scrollBy(1)}
                    className="w-9 sm:w-11 h-9 sm:h-11 rounded-full border border-white/15 text-white/70 flex items-center justify-center hover:border-[#ee2a7b] hover:text-[#ee2a7b] active:scale-90 transition-all cursor-pointer"
                  >
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {/* View All Shop Link */}
              <Link
                href="/shop"
                className="gram-body group relative overflow-hidden border border-[#d4af37]/40 text-[#d4af37] text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3.5 sm:px-5 h-9 sm:h-11 rounded-full inline-flex items-center justify-center transition-all duration-300 hover:text-[#171310] hover:border-[#d4af37]"
              >
                <span className="absolute inset-0 bg-[#d4af37] -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                <span className="relative inline-flex items-center gap-1.5">
                  <Camera size={12} /> View Catalog
                </span>
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Subtitle Description */}
        <Reveal delay={100}>
          <p className="gram-body text-white/50 text-xs sm:text-sm max-w-2xl leading-relaxed tracking-wide mb-6 sm:mb-8 text-pretty">
            Real creators, authentic festive styling, and pure handcrafted decor. Tag <span className="text-[#ee2a7b] font-semibold">#TrioEcart</span> on Instagram
            to get featured. Tap any card on your phone to watch with sound, double-tap to like, or add the exact handcrafted piece directly to your cart!
          </p>
        </Reveal>

        {/* ===== REELS DISPLAY (CAROUSEL OR GRID) ===== */}
        {viewMode === 'grid' ? (
          /* Grid View on Desktop */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {loading ? (
              [1, 2, 3, 4, 5].map((n) => <ReelSkeleton key={n} />)
            ) : filtered.length === 0 ? (
              <p className="gram-body text-white/40 text-sm py-16 col-span-full text-center">
                No reels found matching &ldquo;{query}&rdquo;.
              </p>
            ) : (
              filtered.map((post, idx) => (
                <ReelCard
                  key={post.id}
                  post={post}
                  idx={idx}
                  onAddToCart={handleAddToCart}
                  onOpenModal={openModalForPost}
                  isGlobalMuted={isGlobalMuted}
                  toggleGlobalMute={toggleGlobalMute}
                  viewMode="grid"
                />
              ))
            )}
          </div>
        ) : (
          /* Carousel Stream (Default on mobile & PC) */
          <div>
            <div
              ref={scrollerRef}
              onScroll={handleScroll}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`gram-scroller flex gap-3.5 sm:gap-5 overflow-x-auto pb-4 -mx-3 px-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 ${isMouseDown ? 'cursor-grabbing select-none' : 'cursor-grab'
                }`}
            >
              {loading ? (
                [1, 2, 3, 4, 5].map((n) => <ReelSkeleton key={n} />)
              ) : filtered.length === 0 ? (
                <p className="gram-body text-white/40 text-sm py-16 mx-auto text-center">
                  No reels found matching &ldquo;{query}&rdquo;.
                </p>
              ) : (
                filtered.map((post, idx) => (
                  <ReelCard
                    key={post.id}
                    post={post}
                    idx={idx}
                    onAddToCart={handleAddToCart}
                    onOpenModal={openModalForPost}
                    isGlobalMuted={isGlobalMuted}
                    toggleGlobalMute={toggleGlobalMute}
                    viewMode="carousel"
                  />
                ))
              )}

              {/* Spacer so last card has proper padding */}
              {!loading && filtered.length > 0 && <div className="shrink-0 w-2 sm:w-4" aria-hidden="true" />}
            </div>

            {/* Mobile / PC Scroll Progress Indicator */}
            <div className="mt-4 sm:mt-6 flex flex-col items-center gap-2">
              <div className="w-32 sm:w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#ee2a7b] to-[#d4af37] rounded-full transition-all duration-150"
                  style={{ width: `${Math.max(15, scrollProgress)}%` }}
                />
              </div>

              <p className="gram-body flex items-center justify-center gap-2 text-white/30 text-[9px] uppercase tracking-[0.25em]">
                <ArrowLeft size={9} /> Swipe or use arrows to explore reels <ArrowRight size={9} />
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ===== Infinite Bottom Marquee Strip ===== */}
      <div className="relative mt-12 sm:mt-16 border-t border-b border-white/5 py-3.5 sm:py-4 overflow-hidden">
        <div className="gram-marquee flex whitespace-nowrap w-max hover:[animation-play-state:paused] cursor-default">
          <div className="flex items-center" aria-hidden="false">
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> #TrioEcart
            </span>
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Tag Us To Get Featured
            </span>
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> 1.4M Strong Community
            </span>
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Handcrafted Artisan Decor
            </span>
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Every Look Shoppable
            </span>
          </div>
          <div className="flex items-center" aria-hidden="true">
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> #TrioEcart
            </span>
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Tag Us To Get Featured
            </span>
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> 1.4M Strong Community
            </span>
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Handcrafted Artisan Decor
            </span>
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Every Look Shoppable
            </span>
          </div>
        </div>
      </div>

      {/* ===== Fullscreen Reel Modal (Instagram Reel Viewer) ===== */}
      <ReelModal
        post={activeModalPost}
        isOpen={!!activeModalPost}
        onClose={() => setActiveModalPost(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        onNext={nextModalPost}
        onPrev={prevModalPost}
      />
    </section>
  );
}
