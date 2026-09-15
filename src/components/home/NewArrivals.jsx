'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  X,
  Search,
  ShoppingBag,
  Heart,
  Star,
  Eye,
  Check,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

/* ================= Reveal (scroll animation) ================= */
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
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(36px)',
        transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

const subWords = [
  'Fresh Off The Loom',
  'Artisanal Masterpieces',
  "This Week's Handcrafts",
  'Newly Consecrated',
];

export default function NewArrivals({ products = [], onQuickView = null }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [carted, setCarted] = useState({});
  const [subIdx, setSubIdx] = useState(0);
  const [subChanging, setSubChanging] = useState(false);

  // Rotating subtitle
  useEffect(() => {
    const t = setInterval(() => {
      setSubChanging(true);
      setTimeout(() => {
        setSubIdx((p) => (p + 1) % subWords.length);
        setSubChanging(false);
      }, 450);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  // Filter tabs
  const filterTabs = ['All', 'Patches', 'Copper Bottle', 'Mandir & Aasan', 'Festive Accents'];

  // Match category helper
  const filterProduct = (prod) => {
    if (activeCategory === 'All') return true;
    const cat = (prod.category || prod.category_id || '').toLowerCase();
    const name = (prod.name || prod.title || '').toLowerCase();

    if (activeCategory === 'Patches') return cat.includes('patch') || name.includes('patch');
    if (activeCategory === 'Copper Bottle') return cat.includes('bottle') || cat.includes('copper') || name.includes('copper');
    if (activeCategory === 'Mandir & Aasan') return cat.includes('aasan') || cat.includes('thali') || name.includes('aasan') || name.includes('mandir');
    if (activeCategory === 'Festive Accents') return cat.includes('latkan') || cat.includes('decor') || name.includes('latkan') || name.includes('hanging');
    return true;
  };

  const filteredProducts = products
    .filter(filterProduct)
    .filter((prod) => {
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return (
        (prod.name || '').toLowerCase().includes(q) ||
        (prod.category || '').toLowerCase().includes(q) ||
        (prod.description || '').toLowerCase().includes(q)
      );
    })
    .slice(0, 8);

  const handleAddToCart = (e, prod) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(prod, 1);
    setCarted((prev) => ({ ...prev, [prod.id]: true }));
    setTimeout(() => {
      setCarted((prev) => ({ ...prev, [prod.id]: false }));
    }, 2000);
  };

  return (
    <section className="relative py-20 sm:py-24 px-4 sm:px-8 md:px-12 bg-[#0d0b09] overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-32 right-0 w-[480px] h-[480px] rounded-full bg-[#d4af37]/[0.05] blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 -left-32 w-[400px] h-[400px] rounded-full bg-[#8e2438]/[0.07] blur-[120px]" />

      <div className="relative max-w-[1400px] mx-auto">
        {/* Editorial magazine header */}
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-6">
            <div className="flex items-end gap-5">
              {/* Giant issue number outline */}
              <span
                className="font-serif hidden sm:block text-[6.5rem] lg:text-[8.5rem] leading-[0.8] font-light select-none text-transparent"
                style={{ WebkitTextStroke: '1px rgba(212,175,55,0.3)' }}
                aria-hidden="true"
              >
                24
              </span>
              <div className="pb-2">
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <span className="inline-flex items-center gap-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.4em] text-[#d4af37] border border-[#d4af37]/35 px-4 py-1.5 rounded-full bg-[#d4af37]/5">
                    <Sparkles size={11} className="text-[#d4af37] animate-pulse" />
                    <span>The Drop &middot; Vol. 24</span>
                  </span>
                </div>
                <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[0.95] font-light">
                  New <span className="italic craft-gold-text">Arrivals</span>
                </h2>
                {/* Rotating subtitle */}
                <div className="mt-3 h-6 overflow-hidden">
                  <p
                    className={`text-white/50 text-xs sm:text-sm uppercase tracking-[0.3em] font-semibold transition-all duration-450 ${
                      subChanging ? 'opacity-0 -translate-y-3 blur-sm' : 'opacity-100 translate-y-0 blur-0'
                    }`}
                    style={{ transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)' }}
                  >
                    {subWords[subIdx]}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: copy + View All */}
            <div className="flex flex-col items-start lg:items-end gap-4 lg:text-right max-w-md">
              <p className="text-white/55 text-xs sm:text-sm leading-relaxed tracking-wide font-light">
                Hand-embroidered zardosi, heavy-gauge Ayurvedic copper, and consecrated mandir
                adornments fresh from our master ateliers. Each piece is crafted with generational devotion.
              </p>
              <Link
                href="/shop"
                className="group relative inline-flex items-center gap-3 overflow-hidden bg-[#d4af37] text-[#0d0b09] px-7 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-500 hover:shadow-[0_10px_35px_rgba(212,175,55,0.4)] hover:-translate-y-0.5 active:scale-95"
              >
                <span className="absolute inset-0 bg-[#f5e6b8] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                <span className="relative z-10">View Full Collection</span>
                <ArrowUpRight
                  size={14}
                  className="relative z-10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
                />
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Filter bar: Chips + Search */}
        <Reveal delay={120}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-y border-white/10 py-4 mb-10 sm:mb-14">
            <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
              <span className="hidden lg:inline-flex items-center gap-2 text-white/30 text-[9px] font-black uppercase tracking-[0.3em] mr-2">
                <SlidersHorizontal size={12} /> Refine
              </span>
              {filterTabs.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`relative px-4 py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.22em] transition-all duration-400 active:scale-95 ${
                      isActive ? 'text-[#0d0b09]' : 'text-white/60 hover:text-[#d4af37]'
                    }`}
                  >
                    <span
                      className={`absolute inset-0 rounded-lg transition-all duration-400 ${
                        isActive
                          ? 'bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#f5e6b8] shadow-[0_6px_20px_rgba(212,175,55,0.35)] scale-100'
                          : 'bg-transparent scale-90 hover:scale-100 border border-transparent hover:border-[#d4af37]/30'
                      }`}
                    />
                    <span className="relative z-10">{cat}</span>
                  </button>
                );
              })}
              {activeCategory !== 'All' && (
                <button
                  type="button"
                  onClick={() => setActiveCategory('All')}
                  className="inline-flex items-center gap-1 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.15em] text-white/40 hover:text-[#ff8fa3] transition-colors"
                >
                  <X size={10} /> Reset
                </button>
              )}
            </div>

            {/* Search Pill */}
            <div
              className={`flex items-center gap-2 border rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                searchOpen
                  ? 'border-[#d4af37]/60 bg-white/[0.04] pl-4 pr-2 py-1.5 w-full md:w-72'
                  : 'border-white/15 p-2 w-10 hover:border-[#d4af37]/40 cursor-pointer'
              }`}
              onClick={() => {
                if (!searchOpen) setSearchOpen(true);
              }}
            >
              <Search size={14} className="text-[#d4af37] shrink-0" />
              {searchOpen ? (
                <>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search creations..."
                    autoFocus
                    className="w-full bg-transparent text-white text-xs placeholder:text-white/30 focus:outline-none"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuery('');
                      setSearchOpen(false);
                    }}
                    className="text-white/40 hover:text-white p-1"
                  >
                    <X size={13} />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </Reveal>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          {filteredProducts.map((prod, idx) => {
            const isWish = isInWishlist(prod.id);
            const isCarted = !!carted[prod.id];
            const isOutOfStock =
              prod.in_stock === false ||
              prod.inStock === false ||
              Number(prod.stock) <= 0;

            const primaryImg =
              prod.image ||
              prod.images?.[0] ||
              '/products/shreenathji-statement-patch-1.jpg';
            const secondaryImg =
              prod.images?.[1] ||
              prod.image ||
              '/products/shreenathji-statement-patch-1.jpg';

            const discount = prod.originalPrice && prod.originalPrice > prod.price
              ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)
              : prod.discount || 0;

            return (
              <Reveal key={prod.id || idx} delay={idx * 60}>
                <div className="group relative flex flex-col bg-[#12100d] rounded-2xl overflow-hidden border border-[#d4af37]/15 hover:border-[#d4af37]/50 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.12)]">
                  {/* Image Container */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-black/40">
                    <Link href={`/product/${prod.slug || prod.id}`}>
                      {/* Primary image */}
                      <img
                        src={primaryImg}
                        alt={prod.name}
                        className={`w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-110 ${
                          isOutOfStock ? 'grayscale opacity-60' : ''
                        }`}
                      />
                      {/* Secondary image crossfade if available */}
                      {secondaryImg && secondaryImg !== primaryImg && !isOutOfStock && (
                        <img
                          src={secondaryImg}
                          alt={prod.name}
                          className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out group-hover:scale-110"
                        />
                      )}
                    </Link>

                    {/* Gold Light Sweep effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12100d] via-transparent to-black/20 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                      {isOutOfStock ? (
                        <span className="bg-red-950/90 text-red-200 border border-red-500/50 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-md">
                          Sold Out
                        </span>
                      ) : discount > 0 ? (
                        <span className="bg-[#8e2438]/90 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-md border border-[#ff8fa3]/30">
                          {discount}% OFF
                        </span>
                      ) : (
                        <span className="bg-[#0d0b09]/85 text-[#d4af37] border border-[#d4af37]/40 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md backdrop-blur-md">
                          Artisan
                        </span>
                      )}
                    </div>

                    {/* Floating Action Rail (Right) */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
                      {/* Wishlist */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlist(prod);
                        }}
                        aria-label="Wishlist"
                        className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300 shadow-md ${
                          isWish
                            ? 'bg-[#8e2438] border-[#8e2438] text-white scale-110'
                            : 'bg-[#0d0b09]/75 border-white/15 text-white/70 hover:text-white hover:border-[#d4af37]/60'
                        }`}
                      >
                        <Heart
                          size={15}
                          className={isWish ? 'fill-white text-white' : ''}
                        />
                      </button>

                      {/* QuickView */}
                      {onQuickView && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            onQuickView(prod);
                          }}
                          aria-label="Quick View"
                          className="w-9 h-9 rounded-full flex items-center justify-center bg-[#0d0b09]/75 border border-white/15 text-white/70 hover:text-[#d4af37] hover:border-[#d4af37]/60 backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 shadow-md"
                        >
                          <Eye size={15} />
                        </button>
                      )}
                    </div>

                    {/* Bottom Story/Rating overlay sliding up on hover */}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-[#12100d] via-[#12100d]/95 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-10 flex flex-col gap-2 pointer-events-none">
                      <div className="flex items-center justify-between text-[10px] text-[#f5e6b8] font-semibold">
                        <span className="flex items-center gap-1">
                          <Star size={11} className="fill-[#d4af37] text-[#d4af37]" />
                          {prod.rating || '4.9'} ({prod.reviewsCount || prod.reviews_count || 48})
                        </span>
                        <span className="text-[#d4af37] uppercase tracking-wider text-[9px]">
                          Authentic Handcraft
                        </span>
                      </div>
                      <p className="text-[11px] text-white/70 line-clamp-2 leading-tight">
                        {prod.short_description ||
                          prod.description ||
                          'Exquisite hand-finished craftsmanship with generational Indian artistry.'}
                      </p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3 bg-[#12100d]">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.25em] text-[#d4af37]/80 font-bold mb-1">
                        {prod.category || 'Handcrafted Heritage'}
                      </p>
                      <Link href={`/product/${prod.slug || prod.id}`}>
                        <h3 className="font-serif text-base sm:text-lg text-white font-normal hover:text-[#d4af37] transition-colors line-clamp-1">
                          {prod.name}
                        </h3>
                      </Link>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base sm:text-lg font-bold text-[#f5e6b8]">
                          ₹{Number(prod.price || 0).toLocaleString('en-IN')}
                        </span>
                        {prod.originalPrice && prod.originalPrice > prod.price && (
                          <span className="text-xs text-white/35 line-through">
                            ₹{Number(prod.originalPrice).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      {/* Quick Add Button */}
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => handleAddToCart(e, prod)}
                        className={`relative inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                          isOutOfStock
                            ? 'bg-white/5 text-white/30 cursor-not-allowed'
                            : isCarted
                            ? 'bg-[#1f6f50] text-white'
                            : 'bg-[#0d0b09] text-[#d4af37] border border-[#d4af37]/40 hover:bg-[#d4af37] hover:text-[#0d0b09]'
                        }`}
                      >
                        {isOutOfStock ? (
                          <span>Out of Stock</span>
                        ) : isCarted ? (
                          <>
                            <Check size={12} />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={12} />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
