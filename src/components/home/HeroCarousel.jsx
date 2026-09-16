'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight, Award, ShieldCheck } from 'lucide-react';

const FALLBACK_SLIDES = [
  {
    id: '1',
    badge: "Festive & Wedding 2026",
    title: "Handcrafted Zardosi & Sacred Deity Patches",
    mobile_title: "Handcrafted Zardosi & Deity Patches",
    subtitle: "Ornate gold zari, zarkan stone cutwork, and royal peacock motifs hand-stitched by generational master karigars for bridal lehengas and festive couture.",
    mobile_subtitle: "Royal zari, zarkan stone cutwork & peacock motifs by master karigars.",
    cta_text: "Explore Patches",
    desktop_cta_text: "Explore Embroidery Patches",
    cta_link: "/category/patches",
    secondary_cta_text: "View Best Sellers",
    secondary_cta_link: "/shop",
    desktop_image: "/products/shreenathji-statement-patch-1.jpg",
    mobile_image: "/products/shreenathji-statement-patch-1.jpg",
    secondary_image: "/products/peacock-real-feathers-pair-1.jpg",
    tag: "Authentic Imperial Zari"
  },
  {
    id: '2',
    badge: "100% Pure Tamra Jal Wellness",
    title: "Ayurvedic Hammered Pure Copper Bottles",
    mobile_title: "Pure Ayurvedic Copper Bottles",
    subtitle: "Infuse your daily water with natural antimicrobial goodness and holistic vitality. Hand-hammered with heavy-gauge pure copper by traditional thatheras.",
    mobile_subtitle: "Hand-hammered heavy-gauge pure copper for holistic daily vitality.",
    cta_text: "Shop Copper Bottles",
    desktop_cta_text: "Shop Copper Bottles",
    cta_link: "/category/bottle",
    secondary_cta_text: "Ayurveda Guide",
    secondary_cta_link: "/blog/ayurvedic-benefits-pure-copper-water-bottle",
    desktop_image: "/products/hammered-copper-bottle-1.jpg",
    mobile_image: "/products/hammered-copper-bottle-1.jpg",
    secondary_image: "/products/jute-bottle-bag-1.jpg",
    tag: "100% Pure Copper"
  },
  {
    id: '3',
    badge: "Devotion & Sacred Rituals",
    title: "Royal Velvet Pooja Aasans & Brass Thalis",
    mobile_title: "Velvet Pooja Aasans & Brass Thalis",
    subtitle: "Elevate your daily aarti and festive mandir ceremonies with pure red velvet aasans, embellished brass diyas, and authentic desi cotton gamchas.",
    mobile_subtitle: "Pure velvet aasans, embellished brass diyas & sacred essentials.",
    cta_text: "Discover Pooja Items",
    desktop_cta_text: "Discover Pooja Essentials",
    cta_link: "/category/aasan",
    secondary_cta_text: "Festival Special",
    secondary_cta_link: "/category/towel-gamcha",
    desktop_image: "/products/pooja-thali-brass-diya-1.jpg",
    mobile_image: "/products/pooja-thali-brass-diya-1.jpg",
    secondary_image: "/products/lotus-kamal-aasan-1.jpg",
    tag: "Auspicious Festivities"
  }
];

export const HeroCarousel = ({ initialSlides = [] }) => {
  const [slides, setSlides] = useState(() => (
    initialSlides && initialSlides.length > 0 ? initialSlides : FALLBACK_SLIDES
  ));
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Drag & Touch tracking refs
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragDistanceRef = useRef(0);

  // Dynamically load slides from Supabase API with window focus auto-sync & cache-busting
  useEffect(() => {
    let isMounted = true;

    const fetchSlides = async () => {
      try {
        const res = await fetch(`/api/banners?t=${Date.now()}`, {
          cache: 'force-cache' ? 'no-store' : 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data && Array.isArray(data.slides)) {
          const activeSlides = data.slides.filter((s) => s.is_active !== false);
          if (activeSlides.length > 0) {
            setSlides(activeSlides);
          }
        }
      } catch (_) {}
    };

    fetchSlides();
    window.addEventListener('focus', fetchSlides);
    return () => {
      isMounted = false;
      window.removeEventListener('focus', fetchSlides);
    };
  }, []);

  useEffect(() => {
    if (isPaused || slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const activeIndex = currentSlide >= slides.length ? 0 : currentSlide;
  const slide = slides[activeIndex] || FALLBACK_SLIDES[0];

  // Touch handlers
  const handleTouchStart = (e) => {
    setIsPaused(true);
    isDraggingRef.current = true;
    dragStartXRef.current = e.touches[0].clientX;
    dragDistanceRef.current = 0;
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    dragDistanceRef.current = e.touches[0].clientX - dragStartXRef.current;
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current || slides.length === 0) return;
    isDraggingRef.current = false;
    setIsPaused(false);
    if (dragDistanceRef.current < -40) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    } else if (dragDistanceRef.current > 40) {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  // Mouse handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsPaused(true);
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    dragDistanceRef.current = e.clientX - dragStartXRef.current;
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current || slides.length === 0) return;
    isDraggingRef.current = false;
    setIsPaused(false);
    if (dragDistanceRef.current < -40) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    } else if (dragDistanceRef.current > 40) {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  const handleMouseLeave = () => {
    if (isDraggingRef.current && slides.length > 0) {
      isDraggingRef.current = false;
      if (dragDistanceRef.current < -40) {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      } else if (dragDistanceRef.current > 40) {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
    setIsPaused(false);
  };

  return (
    <div
      className="relative overflow-hidden w-full max-w-full bg-gradient-to-b from-[#2A0E0E] via-[#1E0909] to-[#120505] text-white py-4 sm:py-8 lg:py-20 border-b border-gold-500/30 select-none cursor-grab active:cursor-grabbing touch-pan-y"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Background Decorative Motif */}
      <div className="absolute inset-0 opacity-10 pointer-events-none mandala-bg" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-maroon-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gold-600/15 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 relative z-10">
        {/* Full-Bleed Hero Banner Mode (For Custom Uploaded Banners) */}
        {Boolean(
          (slide.desktop_image && (slide.desktop_image.includes('supabase.co') || slide.desktop_image.includes('/banners/'))) ||
          (slide.mobile_image && (slide.mobile_image.includes('supabase.co') || slide.mobile_image.includes('/banners/'))) ||
          (slide.mobile_image && slide.desktop_image && slide.mobile_image !== slide.desktop_image)
        ) ? (
          <div className="relative w-full">
            <Link
              href={slide.cta_link || slide.ctaLink || '/shop'}
              className="block group relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-gold-500/30 bg-[#120505]"
            >
              {/* Responsive Picture: Dynamically serves portrait mobile banner on phones and wide banner on desktop */}
              <picture className="w-full block">
                {(slide.mobile_image || slide.mobileImage) && (
                  <source
                    media="(max-width: 768px)"
                    srcSet={slide.mobile_image || slide.mobileImage}
                  />
                )}
                <img
                  src={slide.desktop_image || slide.image || slide.desktopImage || '/products/shreenathji-statement-patch-1.jpg'}
                  alt={slide.title || 'Hero Banner'}
                  className="w-full h-auto object-contain block mx-auto md:max-h-[600px] group-hover:scale-[1.01] transition-transform duration-700"
                  loading="eager"
                  fetchPriority="high"
                />
              </picture>

              {/* Subtle Gold Inset Ring */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none ring-1 ring-inset ring-gold-500/30" />
            </Link>
          </div>
        ) : (
          /* Standard 2-Column Mode (For Typography + Product Shot) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6 lg:gap-12 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-2 sm:space-y-4 lg:space-y-6 text-center lg:text-left">
              
              {/* Top Tag */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3.5 sm:py-1.5 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-inner">
                <Sparkles className="w-3 h-3 text-gold-400 shrink-0" />
                <span className="truncate">{slide.badge || 'Festive Special'}</span>
              </div>

              {/* Main Headline - Compact on Mobile, Full on Desktop */}
              <h1 className="font-serif font-extrabold text-xl sm:text-3xl md:text-5xl lg:text-6xl text-ivory-100 leading-snug sm:leading-tight tracking-tight">
                <span className="block sm:hidden">{slide.mobile_title || slide.mobileTitle || slide.title}</span>
                <span className="hidden sm:block">{slide.title}</span>
              </h1>

              {/* Subtitle - Concise on Mobile, Detailed on Desktop */}
              <p className="text-stone-300 text-xs sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
                <span className="block sm:hidden text-stone-300/90">{slide.mobile_subtitle || slide.mobileSubtitle || slide.subtitle}</span>
                <span className="hidden sm:block">{slide.subtitle}</span>
              </p>

              {/* CTAs */}
              <div className="flex items-center justify-center lg:justify-start gap-2.5 pt-1 sm:pt-2">
                <Link
                  href={slide.cta_link || slide.ctaLink || '/shop'}
                  className="btn-gold py-2 px-5 sm:py-3.5 sm:px-8 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-gold-sm sm:shadow-gold-md shrink-0"
                >
                  <span className="block sm:hidden">{slide.mobile_cta_text || slide.cta_text || slide.ctaText || 'Shop Now'}</span>
                  <span className="hidden sm:block">{slide.desktop_cta_text || slide.desktopCtaText || slide.cta_text || slide.ctaText || 'Explore Collection'}</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
                
                <Link
                  href={slide.secondary_cta_link || slide.secondaryCtaLink || '/blog'}
                  className="hidden sm:inline-flex px-6 py-3.5 rounded-xl border-2 border-gold-500/40 text-gold-200 hover:bg-gold-500/10 hover:text-white transition-all text-xs sm:text-sm font-bold uppercase tracking-wider items-center justify-center"
                >
                  {slide.secondary_cta_text || slide.secondaryCtaText || 'Learn More'}
                </Link>
              </div>

              {/* Trust Highlights Strip */}
              <div className="hidden sm:flex pt-3 items-center justify-center lg:justify-start gap-6 text-[11px] sm:text-xs text-stone-400">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-gold-400" />
                  <span>100% Genuine Handcrafted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-gold-400" />
                  <span>Ayurvedic &amp; Sacred Purity</span>
                </div>
              </div>

            </div>

            {/* Right Visual Product Card */}
            <div className="lg:col-span-5 relative mt-2 sm:mt-0">
              <div className="relative mx-auto max-w-[320px] sm:max-w-md">
                
                {/* Main Visual Card with Ambient Presentation */}
                <div className="relative aspect-square sm:aspect-[4/4.5] rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-gold-500/40 shadow-xl sm:shadow-2xl bg-[#1C0F0F] group flex items-center justify-center p-4 sm:p-6">
                  {/* Ambient dynamic background reflection */}
                  <div
                    className="absolute inset-0 bg-cover bg-center filter blur-2xl scale-125 opacity-35 pointer-events-none transition-all duration-700"
                    style={{ backgroundImage: `url("${slide.desktop_image || slide.image || slide.desktopImage || '/products/shreenathji-statement-patch-1.jpg'}")` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/55 pointer-events-none" />

                  <img
                    src={slide.desktop_image || slide.image || slide.desktopImage || '/products/shreenathji-statement-patch-1.jpg'}
                    alt={slide.title}
                    className="relative z-10 w-full h-full object-contain object-center transform group-hover:scale-105 transition-transform duration-700 filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.6)]"
                    loading="eager"
                  />
                  
                  {/* Floating Tag */}
                  <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-20 bg-maroon-900/90 backdrop-blur-md border border-gold-500/40 text-gold-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-lg">
                    {slide.tag || 'Authentic Craft'}
                  </div>

                </div>

                {/* Floating Secondary Mini Card */}
                {(slide.secondary_image || slide.secondaryImage) && (
                  <div className="absolute -bottom-6 -left-6 hidden sm:flex w-32 h-32 rounded-2xl overflow-hidden border-2 border-gold-500/60 shadow-xl bg-black items-center justify-center p-2.5 z-20">
                    <div
                      className="absolute inset-0 bg-cover bg-center filter blur-lg scale-125 opacity-40 pointer-events-none"
                      style={{ backgroundImage: `url("${slide.secondary_image || slide.secondaryImage}")` }}
                    />
                    <img
                      src={slide.secondary_image || slide.secondaryImage}
                      alt="Secondary preview"
                      className="relative z-10 w-full h-full object-contain object-center filter drop-shadow-md"
                      loading="lazy"
                    />
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

        {/* Carousel Navigation Arrows & Dots */}
        <div className="flex items-center justify-between pt-3 mt-2.5 sm:pt-6 sm:mt-6 border-t border-gold-500/20">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  activeIndex === idx
                    ? 'w-6 sm:w-8 bg-gold-400'
                    : 'w-1.5 sm:w-2 bg-stone-600 hover:bg-stone-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              className="p-1.5 sm:p-2 rounded-full bg-maroon-900/80 border border-gold-500/30 text-gold-300 hover:bg-gold-500 hover:text-maroon-950 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="p-1.5 sm:p-2 rounded-full bg-maroon-900/80 border border-gold-500/30 text-gold-300 hover:bg-gold-500 hover:text-maroon-950 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HeroCarousel;
