'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart, MessageCircle, Send, Bookmark, ShoppingBag, Search, X,
  ArrowLeft, ArrowRight, BadgeCheck, Camera, Play, Pause, Music2,
  Volume2, VolumeX, Sparkles, Check, Maximize2, ChevronUp, ChevronDown
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

/* =========================================================
   SHOP THE GRAM — Ultra-Responsive Instagram Reels & Influencer Feed
   Optimized for iPhone (iOS Safari), Android, Tablets & PC Screens
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
      className={`transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/* ---------- Influencer Reels Data ---------- */
const initialPosts = [
  {
    id: 'reel-1',
    img: '/assests/shopthelookinflcuernsgram10/Abida_Fatima.jpg',
    video: '/assests/watchandbuy4/tn_22511f6c-00ca-4a91-840f-0adce0910551.mp4',
    handle: '@abida.fatima_',
    name: 'Abida Fatima',
    verified: true,
    followers: '218K',
    likes: '24.3K',
    likesCount: 24310,
    comments: '1,204',
    caption: 'Draped in pure Kashi magic for my sister’s sangeet night ✨ The zari literally glows in golden hour!',
    song: 'Kesariya · Slowed + Reverb',
    product: 'Rani Pink Katan Silk',
    slug: 'rani-pink-katan-silk',
    price: '₹18,499',
    rawPrice: 18499,
    oldPrice: '₹24,999',
    rawOldPrice: 24999,
    tag: 'Sangeet Look',
    views: '412K'
  },
  {
    id: 'reel-2',
    img: '/assests/shopthelookinflcuernsgram10/Agrani_SINGH.jpg',
    video: '/assests/watchandbuy4/tn_5335df7b-7e0e-4cc3-900b-69e2f2296380.mp4',
    handle: '@agranisingh.official',
    name: 'Agrani Singh',
    verified: true,
    followers: '542K',
    likes: '58.7K',
    likesCount: 58720,
    comments: '3,891',
    caption: 'POV: You found THE wedding saree and it’s handwoven by 7th-gen Banaras artisans 🤍',
    song: 'Din Shagna Da · Wedding Mix',
    product: 'Bridal Red Kadhua Silk',
    slug: 'bridal-red-kadhua-silk',
    price: '₹32,999',
    rawPrice: 32999,
    oldPrice: '₹41,500',
    rawOldPrice: 41500,
    tag: 'Bridal Edit',
    views: '1.2M'
  },
  {
    id: 'reel-3',
    img: '/assests/shopthelookinflcuernsgram10/Dezy_Jariwala.jpg',
    video: '/assests/watchandbuy4/tn_69d79dfd-fccf-4e56-8387-e7c612fa1c55.mp4',
    handle: '@dezyjariwala',
    name: 'Dezy Jariwala',
    verified: false,
    followers: '96.4K',
    likes: '12.1K',
    likesCount: 12140,
    comments: '842',
    caption: 'Old money aesthetic but make it Banarasi 🪷 This teal is unreal in person, trust me.',
    song: 'Tum Se · Lofi Flip',
    product: 'Peacock Teal Georgette',
    slug: 'peacock-teal-georgette',
    price: '₹14,250',
    rawPrice: 14250,
    oldPrice: '₹18,000',
    rawOldPrice: 18000,
    tag: 'Festive Fit',
    views: '289K'
  },
  {
    id: 'reel-4',
    img: '/assests/shopthelookinflcuernsgram10/Natasha_Prajapati.jpg',
    video: '/assests/watchandbuy4/tn_e387e430-ffcc-4044-9e82-974f490f93d1.mp4',
    handle: '@natasha.prajapati',
    name: 'Natasha Prajapati',
    verified: true,
    followers: '310K',
    likes: '31.9K',
    likesCount: 31950,
    comments: '2,156',
    caption: 'Haldi ceremony fit check 💛 Wore my nani’s jhumkas with this genda-phool yellow drape!',
    song: 'Sadi Gali · House Edit',
    product: 'Genda Yellow Tissue Silk',
    slug: 'genda-yellow-tissue-silk',
    price: '₹16,750',
    rawPrice: 16750,
    oldPrice: '₹21,999',
    rawOldPrice: 21999,
    tag: 'Haldi Look',
    views: '506K'
  },
  {
    id: 'reel-5',
    img: '/assests/shopthelookinflcuernsgram10/Samiksha_2211.jpg',
    video: '/assests/watchandbuy4/tn_22511f6c-00ca-4a91-840f-0adce0910551.mp4',
    handle: '@samiksha_2211',
    name: 'Samiksha Rao',
    verified: false,
    followers: '154K',
    likes: '19.6K',
    likesCount: 19630,
    comments: '1,533',
    caption: 'Everyone asked where this saree is from at the reception 😭💌 Linking it now, don’t fight in the comments!',
    song: 'Raanjhan · Acoustic',
    product: 'Ivory Gold Shikargah',
    slug: 'ivory-gold-shikargah',
    price: '₹27,499',
    rawPrice: 27499,
    oldPrice: '₹34,999',
    rawOldPrice: 34999,
    tag: 'Reception Fit',
    views: '673K'
  }
];

const gramWords = ['Gram', 'Feed', 'Reels', 'Trend'];

/* =========================================================
   SINGLE REEL CARD COMPONENT
   Auto-plays on scroll into view on iOS / Android + hover on PC
   ========================================================= */
const ReelCard = ({ post, idx, onAddToCart, onOpenModal, isGlobalMuted, toggleGlobalMute }) => {
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [copied, setCopied] = useState(false);
  const [tapRipple, setTapRipple] = useState(false);
  const { addToast } = useToast();

  /* --- iOS & Mobile Intersection Observer: Autoplay when card is in view --- */
  useEffect(() => {
    const cardEl = cardRef.current;
    if (!cardEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            // Play video on mobile when scrolled into view
            if (videoRef.current) {
              videoRef.current.defaultMuted = true;
              videoRef.current.muted = isGlobalMuted;
              const playPromise = videoRef.current.play();
              if (playPromise !== undefined) {
                playPromise.then(() => setIsPlaying(true)).catch(() => {});
              }
            }
          } else if (entry.intersectionRatio < 0.3) {
            // Pause video when scrolled out
            if (videoRef.current) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: [0.3, 0.6, 0.9] }
    );

    observer.observe(cardEl);
    return () => observer.disconnect();
  }, [isGlobalMuted]);

  /* --- Sync global mute with local video --- */
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isGlobalMuted;
    }
  }, [isGlobalMuted]);

  /* --- Desktop Mouse Enter/Leave --- */
  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.muted = isGlobalMuted;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  /* --- Tap / Click Play/Pause toggle --- */
  const handleVideoTap = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.muted = isGlobalMuted;
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {});
      }
      setTapRipple(true);
      setTimeout(() => setTapRipple(false), 500);
    }
  };

  /* --- Double tap to like (Instagram style) --- */
  const handleDoubleTap = (e) => {
    e.stopPropagation();
    if (!isLiked) {
      setIsLiked(true);
      setLikesCount((p) => p + 1);
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
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/shop?look=${post.slug}` : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.name} Look - Trio Ecart`,
          text: post.caption,
          url: shareUrl,
        });
        return;
      } catch (_) {}
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      addToast('Reel link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      ref={cardRef}
      className="snap-start shrink-0 w-[78vw] sm:w-[300px] md:w-[330px] lg:w-[350px] max-w-[360px] select-none"
    >
      <article
        className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-[#12100d] shadow-lg transition-all duration-500 hover:border-[#ee2a7b]/40 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(238,42,123,0.18)]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* ===== Top Creator Info Bar ===== */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-auto">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 shrink-0">
              <div className="gram-ig-ring absolute inset-0 rounded-full" />
              <div className="absolute inset-[2px] rounded-full overflow-hidden bg-[#12100d]">
                <img
                  src={post.img}
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
            <span className="gram-body gram-float-badge inline-flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-white/15">
              <Play size={8} className="fill-white" /> {post.views}
            </span>
          </div>
        </div>

        {/* ===== Video / Image Visual Container ===== */}
        <div
          className="relative aspect-[9/13.5] sm:aspect-[4/5] overflow-hidden bg-[#12100d] cursor-pointer"
          onClick={handleVideoTap}
          onDoubleClick={handleDoubleTap}
        >
          {/* Static poster image */}
          <img
            src={post.img}
            alt={`${post.name} wearing ${post.product}`}
            className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
              isPlaying ? 'opacity-0' : 'opacity-95'
            }`}
            loading="lazy"
          />

          {/* Video Reel with iOS Safari inline playback */}
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
              preload="metadata"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />
          )}

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent pointer-events-none opacity-80 group-hover:opacity-90 transition-opacity" />

          {/* Tag chip */}
          <span className="gram-body absolute top-12 sm:top-14 left-3 sm:left-4 z-10 bg-[#d4af37] text-[#171310] text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md pointer-events-none">
            {post.tag}
          </span>

          {/* Sound Mute / Unmute Button (Always thumb-accessible) */}
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
          >
            <Maximize2 size={13} className="text-white/90" />
          </button>

          {/* Center Play / Pause Indicator Ripple */}
          <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300 ${
              tapRipple || !isPlaying ? 'opacity-90 scale-100' : 'opacity-0 scale-75'
            }`}
          >
            <span className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-xl">
              {isPlaying ? <Pause size={18} className="fill-white" /> : <Play size={18} className="fill-white ml-0.5" />}
            </span>
          </div>

          {/* Floating Double-Tap Heart Animation */}
          {showHeartPop && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <Heart size={72} className="gram-heart-pop fill-[#ee2a7b] text-[#ee2a7b] drop-shadow-[0_0_20px_rgba(238,42,123,0.8)]" />
            </div>
          )}

          {/* Right Action Rail (Touch-Friendly Glass Container on Mobile & Desktop) */}
          <div className="absolute right-2.5 sm:right-3 bottom-24 sm:bottom-28 z-20 flex flex-col items-center gap-2.5 sm:gap-3 bg-black/45 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border border-white/10 sm:border-transparent rounded-full px-1.5 py-2 sm:p-0">
            {/* Like */}
            <button
              type="button"
              aria-label={isLiked ? 'Unlike' : 'Like'}
              onClick={toggleLike}
              className="flex flex-col items-center gap-0.5 group/heart transition-transform active:scale-75"
            >
              <Heart
                size={20}
                className={`transition-colors ${
                  isLiked ? 'fill-[#ee2a7b] text-[#ee2a7b]' : 'text-white hover:text-[#ee2a7b]'
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
              <MessageCircle size={19} className="text-white hover:text-[#4a9eff] transition-colors" />
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

            {/* Bookmark */}
            <button
              type="button"
              aria-label={isSaved ? 'Unsave' : 'Save'}
              onClick={toggleSave}
              className="transition-transform active:scale-75"
            >
              <Bookmark
                size={18}
                className={`transition-colors ${
                  isSaved ? 'fill-[#d4af37] text-[#d4af37]' : 'text-white hover:text-[#d4af37]'
                }`}
              />
            </button>
          </div>

          {/* Bottom Caption & Music Bar Overlay */}
          <div className="absolute bottom-0 inset-x-0 z-10 p-3 sm:p-4 pointer-events-none">
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
        </div>

        {/* ===== Shoppable Product Footer ===== */}
        <div className="relative z-10 flex items-center justify-between gap-2.5 px-3 sm:px-4 py-3 bg-[#12100d] border-t border-white/5">
          <div className="min-w-0 flex-1">
            <p className="gram-body text-white text-[11px] sm:text-xs font-semibold truncate">{post.product}</p>
            <p className="gram-body text-[11px] sm:text-xs leading-none mt-0.5">
              <span className="text-[#d4af37] font-bold">{post.price}</span>{' '}
              <span className="text-white/35 line-through text-[9px] sm:text-[10px]">{post.oldPrice}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(post);
            }}
            className="gram-body group/cart shrink-0 inline-flex items-center gap-1.5 bg-[#d4af37] text-[#171310] text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-md"
          >
            <ShoppingBag size={12} className="transition-transform group-hover/cart:-rotate-12" />
            <span>Add to Cart</span>
          </button>
        </div>
      </article>
    </div>
  );
};

/* =========================================================
   FULLSCREEN REEL VIEWER MODAL (INSTAGRAM REELS EXPERIENCE)
   ========================================================= */
const ReelModal = ({ post, isOpen, onClose, onAddToCart, onBuyNow, onNext, onPrev }) => {
  const modalVideoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post?.likesCount || 0);
  const [copied, setCopied] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!isOpen || !post) return;
    setIsLiked(false);
    setLikesCount(post.likesCount || 0);
    setIsPlaying(true);
    if (modalVideoRef.current) {
      modalVideoRef.current.currentTime = 0;
      modalVideoRef.current.muted = isMuted;
      modalVideoRef.current.play().catch(() => {});
    }
  }, [isOpen, post]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowUp') onPrev();
      if (e.key === 'ArrowDown') onNext();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNext, onPrev, onClose]);

  if (!isOpen || !post) return null;

  const togglePlay = () => {
    if (modalVideoRef.current) {
      if (isPlaying) {
        modalVideoRef.current.pause();
        setIsPlaying(false);
      } else {
        modalVideoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
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
      setTimeout(() => setShowHeartPop(false), 800);
    } else {
      setIsLiked(false);
      setLikesCount((p) => p - 1);
    }
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/shop?look=${post.slug}` : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.name} Look - Trio Ecart`,
          text: post.caption,
          url: shareUrl,
        });
        return;
      } catch (_) {}
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      addToast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-0 sm:p-4">
      {/* Close Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Close button (top-right) */}
      <button
        type="button"
        aria-label="Close Reel Modal"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all"
      >
        <X size={20} />
      </button>

      {/* Up / Down Reel Nav (Desktop) */}
      <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-3 z-50">
        <button
          type="button"
          aria-label="Previous Reel"
          onClick={onPrev}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-[#d4af37] hover:text-black transition-all"
        >
          <ChevronUp size={24} />
        </button>
        <button
          type="button"
          aria-label="Next Reel"
          onClick={onNext}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-[#d4af37] hover:text-black transition-all"
        >
          <ChevronDown size={24} />
        </button>
      </div>

      {/* Main Reel Viewport: Vertical 9:16 aspect ratio */}
      <div className="relative w-full h-full sm:h-[90vh] sm:max-w-[420px] sm:rounded-3xl overflow-hidden bg-black shadow-2xl flex flex-col justify-between z-10 border border-white/10">
        {/* Top Header Bar */}
        <div className="relative z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#ee2a7b]">
              <img src={post.img} alt={post.name} className="w-full h-full object-cover" />
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
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-[#d4af37]" />}
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div
          className="relative flex-1 bg-black flex items-center justify-center cursor-pointer"
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
            className="w-full h-full object-cover"
          />

          {/* Heart pop */}
          {showHeartPop && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <Heart size={90} className="gram-heart-pop fill-[#ee2a7b] text-[#ee2a7b] drop-shadow-[0_0_30px_rgba(238,42,123,0.9)]" />
            </div>
          )}

          {/* Play/pause icon indicator */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/25 flex items-center justify-center text-white">
                <Play size={26} className="fill-white ml-1" />
              </span>
            </div>
          )}

          {/* Right Action Rail */}
          <div className="absolute right-3.5 bottom-28 z-30 flex flex-col items-center gap-4">
            <button type="button" onClick={toggleLike} className="flex flex-col items-center gap-1">
              <Heart
                size={26}
                className={`transition-all ${isLiked ? 'fill-[#ee2a7b] text-[#ee2a7b]' : 'text-white'}`}
              />
              <span className="gram-body text-white text-[10px] font-bold">
                {likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount}
              </span>
            </button>

            <button type="button" onClick={handleShare} className="flex flex-col items-center gap-1">
              {copied ? <Check size={24} className="text-emerald-400" /> : <Send size={24} className="text-white" />}
              <span className="gram-body text-white text-[10px] font-bold">Share</span>
            </button>

            <button type="button" onClick={toggleMute} className="flex flex-col items-center gap-1">
              {isMuted ? <VolumeX size={24} className="text-white/80" /> : <Volume2 size={24} className="text-[#d4af37]" />}
              <span className="gram-body text-white text-[10px] font-bold">{isMuted ? 'Muted' : 'Sound'}</span>
            </button>
          </div>

          {/* Bottom Overlay Caption & Song */}
          <div className="absolute bottom-20 inset-x-0 z-20 p-4 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none">
            <p className="gram-body text-white/95 text-xs leading-relaxed line-clamp-3 pr-14 mb-2">
              <b className="text-white">{post.handle}</b> {post.caption}
            </p>
            <div className="flex items-center gap-2">
              <Music2 size={12} className="text-white/70" />
              <span className="gram-body text-white/70 text-[10px] truncate">{post.song}</span>
            </div>
          </div>
        </div>

        {/* Bottom Shoppable Drawer */}
        <div className="relative z-30 p-3 bg-[#171412] border-t border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <img src={post.img} alt={post.product} className="w-11 h-11 rounded-lg object-cover border border-white/10 shrink-0" />
            <div className="min-w-0">
              <p className="gram-body text-white text-xs font-bold truncate">{post.product}</p>
              <p className="gram-body text-xs text-[#d4af37] font-semibold">{post.price}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onAddToCart(post)}
              className="gram-body bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 rounded-full transition-all active:scale-95"
            >
              Add to Cart
            </button>
            <button
              type="button"
              onClick={() => onBuyNow(post)}
              className="gram-body bg-[#d4af37] text-black text-[10px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-full transition-all active:scale-95 shadow-md"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   MAIN SHOP THE GRAM COMPONENT
   ========================================================= */
export default function ShopTheGram() {
  const [wordIdx, setWordIdx] = useState(0);
  const [wordChanging, setWordChanging] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isGlobalMuted, setIsGlobalMuted] = useState(true);
  const [activeModalPost, setActiveModalPost] = useState(null);
  const [activePostIdx, setActivePostIdx] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

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

  const filtered = initialPosts.filter(
    (p) =>
      p.handle.toLowerCase().includes(query.toLowerCase()) ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.product.toLowerCase().includes(query.toLowerCase()) ||
      p.tag.toLowerCase().includes(query.toLowerCase())
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

  const scrollBy = useCallback((dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const itemWidth = el.querySelector('article')?.parentElement?.clientWidth || 320;
    el.scrollBy({ left: dir * (itemWidth + 20), behavior: 'smooth' });
  }, []);

  /* Keyboard arrow navigation support */
  useEffect(() => {
    const onKey = (e) => {
      if (activeModalPost) return;
      if (e.key === 'ArrowLeft') scrollBy(-1);
      if (e.key === 'ArrowRight') scrollBy(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scrollBy, activeModalPost]);

  const toggleGlobalMute = () => {
    const nextMute = !isGlobalMuted;
    setIsGlobalMuted(nextMute);
    addToast(nextMute ? 'Reels audio muted' : 'Reels audio unmuted 🔊', 'info');
  };

  const handleAddToCart = (post) => {
    const productItem = {
      id: post.id,
      name: post.product,
      slug: post.slug,
      price: post.rawPrice,
      originalPrice: post.rawOldPrice,
      category: 'Sarees',
      images: [post.img],
      in_stock: true,
      stock: 25,
    };
    addToCart(productItem, 1);
  };

  const handleBuyNow = (post) => {
    handleAddToCart(post);
    if (activeModalPost) setActiveModalPost(null);
    openCart();
  };

  const openModalForPost = (post) => {
    const idx = initialPosts.findIndex((p) => p.id === post.id);
    setActivePostIdx(idx >= 0 ? idx : 0);
    setActiveModalPost(post);
  };

  const nextModalPost = () => {
    const nextIdx = (activePostIdx + 1) % initialPosts.length;
    setActivePostIdx(nextIdx);
    setActiveModalPost(initialPosts[nextIdx]);
  };

  const prevModalPost = () => {
    const prevIdx = (activePostIdx - 1 + initialPosts.length) % initialPosts.length;
    setActivePostIdx(prevIdx);
    setActiveModalPost(initialPosts[prevIdx]);
  };

  return (
    <section className="relative py-16 sm:py-20 lg:py-24 bg-[#0d0b09] border-t border-white/5 overflow-hidden">
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
        @keyframes gram-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .gram-scroller {
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        .gram-scroller::-webkit-scrollbar { display: none; }
        .gram-music-bar { animation: gram-eq 0.9s ease-in-out infinite alternate; transform-origin: bottom; }
        @keyframes gram-eq { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }
        .gram-float-badge { animation: gram-float 3.4s ease-in-out infinite; }
        @keyframes gram-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      `}</style>

      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-[#ee2a7b]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-[#6228d7]/[0.07] blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ===== Header: Responsive Profile Layout ===== */}
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Creator Profile Branding */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Instagram Story Ring Avatar */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0">
                <div className="gram-ig-ring absolute inset-0 rounded-full" />
                <div className="absolute inset-[2.5px] sm:inset-[3px] rounded-full bg-[#0d0b09] flex items-center justify-center">
                  <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
                </div>
                <span className="gram-body absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#ee2a7b] text-white text-[7px] sm:text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-md">
                  LIVE
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="gram-body text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.35em]">Community</span>
                  <BadgeCheck size={14} className="text-[#4a9eff]" />
                </div>
                <h2 className="gram-heading text-3xl sm:text-5xl md:text-6xl text-white font-semibold leading-tight">
                  Shop The{' '}
                  <span className="relative inline-block h-[1.15em] overflow-hidden align-bottom">
                    <span
                      className={`block italic gram-gold-text transition-all duration-450 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        wordChanging ? 'translate-y-[-110%] opacity-0' : 'translate-y-0 opacity-100'
                      }`}
                    >
                      {gramWords[wordIdx]}
                    </span>
                  </span>
                </h2>

                {/* Profile Stats Row */}
                <div className="gram-body flex items-center gap-3 sm:gap-5 mt-2 sm:mt-3 text-white/50 text-[11px] sm:text-xs tracking-wide flex-wrap">
                  <span><b className="text-white font-bold">1.4M</b> followers</span>
                  <span><b className="text-white font-bold">5</b> creators</span>
                  <span className="hidden sm:inline"><b className="text-white font-bold">98%</b> shoppable</span>
                </div>
              </div>
            </div>

            {/* Controls Row: Search + Arrows + Sound + View All */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between sm:justify-end">
              {/* Expanding Search Input */}
              <div
                className={`flex items-center border rounded-full transition-all duration-300 overflow-hidden ${
                  searchOpen
                    ? 'border-[#ee2a7b]/60 bg-white/[0.08] w-48 sm:w-60'
                    : 'border-white/15 bg-white/[0.03] w-10 sm:w-11'
                } h-10 sm:h-11`}
              >
                <button
                  type="button"
                  aria-label={searchOpen ? 'Close search' : 'Search reels'}
                  onClick={() => {
                    setSearchOpen((o) => !o);
                    setQuery('');
                  }}
                  className="w-10 sm:w-11 h-10 sm:h-11 shrink-0 flex items-center justify-center text-white/70 hover:text-white"
                >
                  {searchOpen ? <X size={15} /> : <Search size={15} />}
                </button>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search creator, look..."
                  className={`gram-body bg-transparent text-white text-xs placeholder:text-white/35 outline-none flex-1 pr-3 ${
                    searchOpen ? 'block' : 'hidden'
                  }`}
                />
              </div>

              {/* Global Audio Toggle Button */}
              <button
                type="button"
                aria-label={isGlobalMuted ? 'Unmute reels audio' : 'Mute reels audio'}
                onClick={toggleGlobalMute}
                className="w-10 sm:w-11 h-10 sm:h-11 rounded-full border border-white/15 text-white/80 flex items-center justify-center hover:border-[#d4af37] hover:text-[#d4af37] active:scale-90 transition-all"
                title={isGlobalMuted ? 'Turn Sound On' : 'Turn Sound Off'}
              >
                {isGlobalMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-[#d4af37]" />}
              </button>

              {/* Nav Arrows (Desktop & Tablet) */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous reel"
                  onClick={() => scrollBy(-1)}
                  className="w-10 sm:w-11 h-10 sm:h-11 rounded-full border border-white/15 text-white/70 flex items-center justify-center hover:border-[#ee2a7b] hover:text-[#ee2a7b] active:scale-90 transition-all"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Next reel"
                  onClick={() => scrollBy(1)}
                  className="w-10 sm:w-11 h-10 sm:h-11 rounded-full border border-white/15 text-white/70 flex items-center justify-center hover:border-[#ee2a7b] hover:text-[#ee2a7b] active:scale-90 transition-all"
                >
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* View All Shop Link */}
              <a
                href="/shop"
                className="gram-body group relative overflow-hidden border border-[#d4af37]/40 text-[#d4af37] text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-4 sm:px-5 h-10 sm:h-11 rounded-full inline-flex items-center justify-center transition-all duration-300 hover:text-[#171310] hover:border-[#d4af37]"
              >
                <span className="absolute inset-0 bg-[#d4af37] -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                <span className="relative inline-flex items-center gap-1.5">
                  <Camera size={13} /> View All
                </span>
              </a>
            </div>
          </div>
        </Reveal>

        {/* Subtitle Description */}
        <Reveal delay={100}>
          <p className="gram-body text-white/50 text-xs sm:text-sm max-w-2xl leading-relaxed tracking-wide mb-6 sm:mb-8 text-pretty">
            Real brides, viral fits, pure Banarasi handlooms. Tag <span className="text-[#ee2a7b] font-semibold">#DrapedInKashi</span> on Instagram
            to get featured. Tap any card on your phone to watch with sound, double-tap to like, or add the exact saree directly to your cart!
          </p>
        </Reveal>

        {/* ===== Horizontal Scroller Feed ===== */}
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="gram-scroller flex gap-3.5 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 touch-pan-x"
        >
          {filtered.length === 0 && (
            <p className="gram-body text-white/40 text-sm py-16 mx-auto text-center">
              No reels found matching &ldquo;{query}&rdquo;.
            </p>
          )}

          {filtered.map((post, idx) => (
            <ReelCard
              key={post.id}
              post={post}
              idx={idx}
              onAddToCart={handleAddToCart}
              onOpenModal={openModalForPost}
              isGlobalMuted={isGlobalMuted}
              toggleGlobalMute={toggleGlobalMute}
            />
          ))}

          {/* Spacer so last card has proper padding */}
          {filtered.length > 0 && <div className="shrink-0 w-2 sm:w-4" aria-hidden="true" />}
        </div>

        {/* ===== Mobile Swipe Progress Indicator ===== */}
        <div className="mt-4 sm:mt-6 flex flex-col items-center gap-2">
          {/* Progress bar track */}
          <div className="w-36 sm:w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#ee2a7b] to-[#d4af37] rounded-full transition-all duration-150"
              style={{ width: `${Math.max(15, scrollProgress)}%` }}
            />
          </div>

          <p className="gram-body flex items-center justify-center gap-2 text-white/30 text-[9px] uppercase tracking-[0.25em]">
            <ArrowLeft size={9} /> Swipe or use arrow keys to explore reels <ArrowRight size={9} />
          </p>
        </div>
      </div>

      {/* ===== Infinite Bottom Marquee Strip ===== */}
      <div className="relative mt-12 sm:mt-16 border-t border-b border-white/5 py-3.5 sm:py-4 overflow-hidden">
        <div className="gram-marquee flex whitespace-nowrap w-max">
          <div className="flex items-center" aria-hidden="false">
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> #DrapedInKashi
            </span>
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Tag Us To Get Featured
            </span>
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> 1.4M Strong Community
            </span>
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Every Look Shoppable
            </span>
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Real Brides Real Reels
            </span>
          </div>
          <div className="flex items-center" aria-hidden="true">
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> #DrapedInKashi
            </span>
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Tag Us To Get Featured
            </span>
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> 1.4M Strong Community
            </span>
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Every Look Shoppable
            </span>
            <span className="gram-body inline-flex items-center gap-2.5 mx-4 sm:mx-6 text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Real Brides Real Reels
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
