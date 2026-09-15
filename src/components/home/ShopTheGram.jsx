'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart, MessageCircle, Send, Bookmark, ShoppingBag, Search, X,
  ArrowLeft, ArrowRight, BadgeCheck, Camera, Play, Pause, Music2,
  Volume2, VolumeX, Sparkles, Check
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

/* =========================================================
   SHOP THE GRAM — Instagram-style influencer feed & video reels
   Self-contained fonts, keyframes, video hover-play & cart integration
   ========================================================= */

/* ---------- Scroll Reveal helper ---------- */
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

/* ---------- Post data with video reels ---------- */
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

/* ---------- Rotating header word ---------- */
const gramWords = ['Gram', 'Feed', 'Reels', 'Trend'];

/* ---------- Single Reel Card with Hover Video Play ---------- */
const ReelCard = ({ post, idx, onAddToCart }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Autoplay may be restricted
      });
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {});
      }
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleLike = (e) => {
    if (e) e.stopPropagation();
    if (!isLiked) {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
    } else {
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
    }
  };

  const toggleSave = (e) => {
    e.stopPropagation();
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    addToast(nextSaved ? 'Saved look to collection!' : 'Removed look from collection', 'info');
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
      addToast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Reveal delay={idx * 90} className="snap-start shrink-0 w-[280px] md:w-[320px]">
      <article
        className="group relative rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] transition-all duration-700 hover:border-[#ee2a7b]/40 hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(238,42,123,0.14)]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* --- IG top bar --- */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 shrink-0">
              <div className="gram-ig-ring absolute inset-0 rounded-full" />
              <div className="absolute inset-[2px] rounded-full overflow-hidden bg-[#12100d]">
                <img
                  src={post.img}
                  alt={post.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="leading-tight min-w-0">
              <span className="gram-body flex items-center gap-1 text-white text-[11px] font-bold truncate">
                {post.handle}
                {post.verified && <BadgeCheck size={11} className="text-[#4a9eff] shrink-0" />}
              </span>
              <span className="gram-body text-white/50 text-[9px] block truncate">{post.followers} followers</span>
            </div>
          </div>
          <span className="gram-body gram-float-badge inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/15">
            <Play size={8} className="fill-white" /> {post.views}
          </span>
        </div>

        {/* --- Image (Poster) & Video Reel --- */}
        <div
          className="relative aspect-[4/5] overflow-hidden bg-[#12100d] cursor-pointer select-none"
          onDoubleClick={toggleLike}
          onClick={togglePlay}
        >
          {/* Static poster image */}
          <img
            src={post.img}
            alt={`${post.name} wearing ${post.product}`}
            className={`w-full h-full object-cover transition-all duration-[1.6s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 ${
              isPlaying ? 'opacity-0' : 'opacity-90 group-hover:opacity-100'
            }`}
          />

          {/* Video reel */}
          {post.video && (
            <video
              ref={videoRef}
              src={post.video}
              poster={post.img}
              muted={isMuted}
              loop
              playsInline
              preload="metadata"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />
          )}

          {/* Gradient wash overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Tag chip */}
          <span className="gram-body absolute top-14 left-4 z-10 bg-[#d4af37] text-[#171310] text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full -translate-x-3 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 shadow-md">
            {post.tag}
          </span>

          {/* Sound Mute/Unmute quick button on top right of video */}
          {post.video && (
            <button
              type="button"
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              onClick={toggleMute}
              className="absolute top-14 right-4 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
            >
              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} className="text-[#d4af37]" />}
            </button>
          )}

          {/* Center Reel Play/Pause indicator */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className={`w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all duration-400 ${
                isPlaying ? 'opacity-0 scale-75' : 'opacity-90 scale-100'
              }`}
            >
              <Play size={18} className="fill-white ml-0.5" />
            </span>
          </div>

          {/* Right action rail (Like, Comment, Share, Bookmark) */}
          <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-3.5 translate-x-6 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 delay-100">
            <button
              type="button"
              aria-label={isLiked ? 'Unlike' : 'Like'}
              onClick={toggleLike}
              className="flex flex-col items-center gap-1 group/heart"
            >
              <Heart
                size={22}
                className={`transition-all duration-300 ${
                  isLiked ? 'gram-heart-pop fill-[#ee2a7b] text-[#ee2a7b]' : 'text-white hover:text-[#ee2a7b]'
                }`}
              />
              <span className="gram-body text-white text-[9px] font-bold">
                {likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount}
              </span>
            </button>

            <button type="button" aria-label="Comments" className="flex flex-col items-center gap-1">
              <MessageCircle size={21} className="text-white hover:text-[#4a9eff] transition-colors duration-300" />
              <span className="gram-body text-white text-[9px] font-bold">{post.comments}</span>
            </button>

            <button type="button" aria-label="Share" onClick={handleShare} className="flex flex-col items-center gap-1">
              {copied ? (
                <Check size={20} className="text-emerald-400" />
              ) : (
                <Send size={20} className="text-white hover:text-[#d4af37] transition-colors duration-300 hover:-rotate-12" />
              )}
              <span className="gram-body text-white text-[9px] font-bold">Share</span>
            </button>

            <button
              type="button"
              aria-label={isSaved ? 'Unsave' : 'Save'}
              onClick={toggleSave}
              className="hover:scale-110 transition-transform"
            >
              <Bookmark
                size={20}
                className={`transition-colors duration-300 ${
                  isSaved ? 'fill-[#d4af37] text-[#d4af37]' : 'text-white hover:text-[#d4af37]'
                }`}
              />
            </button>
          </div>

          {/* Caption + song equalizer — bottom overlay */}
          <div className="absolute bottom-0 inset-x-0 z-10 p-4 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-75">
            <p className="gram-body text-white/95 text-[11px] leading-relaxed line-clamp-2 mb-2 pr-12 drop-shadow-md">
              <b className="text-white">{post.handle}</b> {post.caption}
            </p>
            <div className="flex items-center gap-2">
              <Music2 size={11} className="text-white/70 shrink-0" />
              {/* Equalizer animation */}
              <span className="flex items-end gap-[2px] h-3 shrink-0">
                <span className={`gram-music-bar w-[2px] h-full bg-[#ee2a7b] rounded-full ${!isPlaying ? 'opacity-40' : ''}`} />
                <span className={`gram-music-bar w-[2px] h-full bg-[#ee2a7b] rounded-full [animation-delay:0.2s] ${!isPlaying ? 'opacity-40' : ''}`} />
                <span className={`gram-music-bar w-[2px] h-full bg-[#ee2a7b] rounded-full [animation-delay:0.4s] ${!isPlaying ? 'opacity-40' : ''}`} />
              </span>
              <span className="gram-body text-white/70 text-[9px] tracking-wide truncate">{post.song}</span>
            </div>
          </div>
        </div>

        {/* --- Product footer: Title + Price + Add to Cart --- */}
        <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-3.5 bg-[#12100d] border-t border-white/5">
          <div className="min-w-0">
            <p className="gram-body text-white text-[11px] font-semibold truncate">{post.product}</p>
            <p className="gram-body text-[11px]">
              <span className="text-[#d4af37] font-bold">{post.price}</span>{' '}
              <span className="text-white/30 line-through text-[9px]">{post.oldPrice}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => onAddToCart(post)}
            className="gram-body group/cart relative overflow-hidden shrink-0 inline-flex items-center gap-1.5 bg-[#d4af37] text-[#171310] text-[9px] font-black uppercase tracking-[0.15em] px-3.5 py-2.5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-md"
          >
            <ShoppingBag size={12} className="transition-transform duration-300 group-hover/cart:-rotate-12" />
            Add to Cart
          </button>
        </div>
      </article>
    </Reveal>
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
  const scrollerRef = useRef(null);
  const searchInputRef = useRef(null);
  const { addToCart } = useCart();
  const { addToast } = useToast();

  /* Rotating word animation */
  useEffect(() => {
    const t = setInterval(() => {
      setWordChanging(true);
      setTimeout(() => {
        setWordIdx((p) => (p + 1) % gramWords.length);
        setWordChanging(false);
      }, 450);
    }, 3000);
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

  const scrollBy = useCallback((dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.75), behavior: 'smooth' });
  }, []);

  /* Keyboard arrow navigation support */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') scrollBy(-1);
      if (e.key === 'ArrowRight') scrollBy(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scrollBy]);

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

  return (
    <section className="relative py-20 sm:py-24 bg-[#0d0b09] border-t border-white/5 overflow-hidden">
      {/* Self-contained Google Fonts & Keyframes */}
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
        .gram-heart-pop { animation: gram-pop 0.45s cubic-bezier(0.16,1,0.3,1); }
        @keyframes gram-pop {
          0% { transform: scale(0.6); }
          55% { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        .gram-marquee { animation: gram-marquee 26s linear infinite; }
        @keyframes gram-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .gram-scroller { scrollbar-width: none; -ms-overflow-style: none; }
        .gram-scroller::-webkit-scrollbar { display: none; }
        .gram-music-bar { animation: gram-eq 0.9s ease-in-out infinite alternate; transform-origin: bottom; }
        @keyframes gram-eq { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }
        .gram-float-badge { animation: gram-float 3.4s ease-in-out infinite; }
        @keyframes gram-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
      `}</style>

      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#ee2a7b]/[0.05] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#6228d7]/[0.06] blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* ===== Header: Instagram-profile style ===== */}
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-4">
            <div className="flex items-center gap-6">
              {/* Instagram story ring avatar */}
              <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0">
                <div className="gram-ig-ring absolute inset-0 rounded-full" />
                <div className="absolute inset-[3px] rounded-full bg-[#0d0b09] flex items-center justify-center">
                  <Camera size={30} className="text-white/90" />
                </div>
                <span className="gram-body absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#ee2a7b] text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm">
                  LIVE
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="gram-body text-white/40 text-[10px] font-bold uppercase tracking-[0.4em]">Community</span>
                  <BadgeCheck size={14} className="text-[#4a9eff]" />
                </div>
                <h2 className="gram-heading text-4xl md:text-6xl text-white font-semibold leading-none">
                  Shop The{' '}
                  <span className="relative inline-block h-[1.1em] overflow-hidden align-bottom">
                    <span
                      className={`block italic gram-gold-text transition-all duration-450 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        wordChanging ? 'translate-y-[-110%] opacity-0' : 'translate-y-0 opacity-100'
                      }`}
                    >
                      {gramWords[wordIdx]}
                    </span>
                  </span>
                </h2>
                {/* Profile-style stats row */}
                <div className="gram-body flex items-center gap-5 mt-3 text-white/50 text-xs tracking-wide flex-wrap">
                  <span><b className="text-white font-bold">1.4M</b> followers</span>
                  <span><b className="text-white font-bold">5</b> creators</span>
                  <span><b className="text-white font-bold">98%</b> tagged looks shoppable</span>
                </div>
              </div>
            </div>

            {/* Search + Carousel Arrows + View All */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Expanding Search bar */}
              <div
                className={`flex items-center border rounded-full transition-all duration-500 overflow-hidden ${
                  searchOpen ? 'border-[#ee2a7b]/50 bg-white/[0.05] w-64' : 'border-white/15 bg-white/[0.03] w-11'
                } h-11`}
              >
                <button
                  type="button"
                  aria-label={searchOpen ? 'Close search' : 'Open search'}
                  onClick={() => {
                    setSearchOpen((o) => !o);
                    setQuery('');
                  }}
                  className="w-11 h-11 shrink-0 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                  {searchOpen ? <X size={16} /> : <Search size={16} />}
                </button>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search creator, look, saree..."
                  className={`gram-body bg-transparent text-white text-xs placeholder:text-white/30 outline-none flex-1 pr-4 ${
                    searchOpen ? 'block' : 'hidden'
                  }`}
                />
              </div>

              {/* Arrow Left */}
              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => scrollBy(-1)}
                className="w-11 h-11 rounded-full border border-white/15 text-white/70 flex items-center justify-center hover:border-[#ee2a7b] hover:text-[#ee2a7b] hover:-translate-x-0.5 active:scale-90 transition-all duration-300"
              >
                <ArrowLeft size={16} />
              </button>

              {/* Arrow Right */}
              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => scrollBy(1)}
                className="w-11 h-11 rounded-full border border-white/15 text-white/70 flex items-center justify-center hover:border-[#ee2a7b] hover:text-[#ee2a7b] hover:translate-x-0.5 active:scale-90 transition-all duration-300"
              >
                <ArrowRight size={16} />
              </button>

              {/* View All Button */}
              <a
                href="/shop"
                className="gram-body group relative overflow-hidden border border-[#d4af37]/40 text-[#d4af37] text-[10px] font-black uppercase tracking-[0.25em] px-6 h-11 rounded-full inline-flex items-center justify-center transition-all duration-500 hover:text-[#171310]"
              >
                <span className="absolute inset-0 bg-[#d4af37] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                <span className="relative inline-flex items-center gap-2">
                  <Camera size={13} /> View All
                </span>
              </a>
            </div>
          </div>
        </Reveal>

        {/* Subtitle / Community Callout */}
        <Reveal delay={120}>
          <p className="gram-body text-white/45 text-sm max-w-3xl leading-relaxed tracking-wide mb-10 text-pretty">
            Real brides, real baraatis, real reels. Tag <span className="text-[#ee2a7b] font-semibold">#DrapedInKashi</span> and
            get featured on the feed — every look below is fully shoppable. Hover any post to play the video reel, like it, peek the
            creator&apos;s caption, hear what they styled it with, and add the exact saree straight to your cart.
          </p>
        </Reveal>

        {/* ===== Horizontal Scroller Feed ===== */}
        <div
          ref={scrollerRef}
          className="gram-scroller flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6"
        >
          {filtered.length === 0 && (
            <p className="gram-body text-white/40 text-sm py-16 mx-auto">
              No looks found for &ldquo;{query}&rdquo; — try another creator or look.
            </p>
          )}

          {filtered.map((post, idx) => (
            <ReelCard
              key={post.id}
              post={post}
              idx={idx}
              onAddToCart={handleAddToCart}
            />
          ))}

          {/* Spacer to prevent cut-off on right edge */}
          {filtered.length > 0 && <div className="shrink-0 w-2" aria-hidden="true" />}
        </div>

        {/* Keyboard / Swipe Hint */}
        <Reveal delay={200}>
          <p className="gram-body flex items-center justify-center gap-2 text-white/25 text-[9px] uppercase tracking-[0.3em] mt-6">
            <ArrowLeft size={10} /> Use arrow keys or swipe to explore the feed <ArrowRight size={10} />
          </p>
        </Reveal>
      </div>

      {/* ===== Infinite Bottom Marquee Strip ===== */}
      <div className="relative mt-14 border-t border-b border-white/5 py-4 overflow-hidden">
        <div className="gram-marquee flex whitespace-nowrap w-max">
          <div className="flex items-center" aria-hidden="false">
            <span className="gram-body inline-flex items-center gap-3 mx-6 text-white/35 text-[10px] font-bold uppercase tracking-[0.35em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> #DrapedInKashi
            </span>
            <span className="gram-body inline-flex items-center gap-3 mx-6 text-white/35 text-[10px] font-bold uppercase tracking-[0.35em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Tag Us To Get Featured
            </span>
            <span className="gram-body inline-flex items-center gap-3 mx-6 text-white/35 text-[10px] font-bold uppercase tracking-[0.35em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> 1.4M Strong Community
            </span>
            <span className="gram-body inline-flex items-center gap-3 mx-6 text-white/35 text-[10px] font-bold uppercase tracking-[0.35em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Every Look Shoppable
            </span>
            <span className="gram-body inline-flex items-center gap-3 mx-6 text-white/35 text-[10px] font-bold uppercase tracking-[0.35em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Real Brides Real Reels
            </span>
          </div>
          <div className="flex items-center" aria-hidden="true">
            <span className="gram-body inline-flex items-center gap-3 mx-6 text-white/35 text-[10px] font-bold uppercase tracking-[0.35em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> #DrapedInKashi
            </span>
            <span className="gram-body inline-flex items-center gap-3 mx-6 text-white/35 text-[10px] font-bold uppercase tracking-[0.35em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Tag Us To Get Featured
            </span>
            <span className="gram-body inline-flex items-center gap-3 mx-6 text-white/35 text-[10px] font-bold uppercase tracking-[0.35em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> 1.4M Strong Community
            </span>
            <span className="gram-body inline-flex items-center gap-3 mx-6 text-white/35 text-[10px] font-bold uppercase tracking-[0.35em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Every Look Shoppable
            </span>
            <span className="gram-body inline-flex items-center gap-3 mx-6 text-white/35 text-[10px] font-bold uppercase tracking-[0.35em]">
              <Sparkles size={10} className="text-[#ee2a7b]" /> Real Brides Real Reels
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
