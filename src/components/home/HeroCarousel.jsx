import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight, Award, ShieldCheck, Heart } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    badge: "Festive & Wedding Collection 2026",
    title: "Handcrafted Zardosi & Sacred Deity Patches",
    subtitle: "Ornate gold zari, zarkan stone cutwork, and royal peacock motifs hand-stitched by generational master karigars for bridal lehengas and festive couture.",
    ctaText: "Explore Embroidery Patches",
    ctaLink: "/category/patches",
    secondaryCtaText: "View Best Sellers",
    secondaryCtaLink: "/shop",
    image: "/products/shreenathji-statement-patch-1.jpg",
    secondaryImage: "/products/peacock-real-feathers-pair-1.jpg",
    tag: "Authentic Imperial Zari"
  },
  {
    id: 2,
    badge: "100% Pure Tamra Jal Wellness",
    title: "Ayurvedic Hammered Pure Copper Bottles",
    subtitle: "Infuse your daily water with natural antimicrobial goodness and holistic vitality. Hand-hammered with heavy-gauge pure copper by traditional thatheras.",
    ctaText: "Shop Copper Bottles",
    ctaLink: "/category/bottle",
    secondaryCtaText: "Ayurveda Guide",
    secondaryCtaLink: "/blog/ayurvedic-benefits-pure-copper-water-bottle",
    image: "/products/hammered-copper-bottle-1.jpg",
    secondaryImage: "/products/jute-bottle-bag-1.jpg",
    tag: "100% Pure Copper"
  },
  {
    id: 3,
    badge: "Devotion & Sacred Rituals",
    title: "Royal Velvet Pooja Aasans & Brass Thalis",
    subtitle: "Elevate your daily aarti and festive mandir ceremonies with pure red velvet aasans, embellished brass diyas, and authentic desi cotton gamchas.",
    ctaText: "Discover Pooja Essentials",
    ctaLink: "/category/aasan",
    secondaryCtaText: "Festival Special",
    secondaryCtaLink: "/category/towel-gamcha",
    image: "/products/pooja-thali-brass-diya-1.jpg",
    secondaryImage: "/products/lotus-kamal-aasan-1.jpg",
    tag: "Auspicious Festivities"
  }
];

export const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const slide = SLIDES[currentSlide];

  return (
    <div
      className="relative overflow-hidden bg-gradient-to-b from-[#2A0E0E] via-[#1E0909] to-[#120505] text-white py-12 md:py-20 border-b border-gold-500/30"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Decorative Motif */}
      <div className="absolute inset-0 opacity-10 pointer-events-none mandala-bg" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-maroon-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gold-600/15 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
            
            {/* Top Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-300 text-xs font-bold uppercase tracking-wider shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>{slide.badge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-ivory-100 leading-tight tracking-tight">
              {slide.title}
            </h1>

            {/* Subtitle */}
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              {slide.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                to={slide.ctaLink}
                className="w-full sm:w-auto btn-gold py-3.5 px-8 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-gold-md"
              >
                <span>{slide.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={slide.secondaryCtaLink}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border-2 border-gold-500/40 text-gold-200 hover:bg-gold-500/10 hover:text-white transition-all text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center"
              >
                {slide.secondaryCtaText}
              </Link>
            </div>

            {/* Trust Highlights Strip */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-[11px] sm:text-xs text-stone-400">
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

          {/* Right Visual Collage */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md">
              
              {/* Main Visual Card */}
              <div className="relative aspect-[4/4.5] rounded-3xl overflow-hidden border-2 border-gold-500/40 shadow-2xl bg-[#1C0F0F] group">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Floating Tag */}
                <div className="absolute top-4 left-4 bg-maroon-900/90 backdrop-blur-md border border-gold-500/40 text-gold-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                  {slide.tag}
                </div>

                {/* Bottom Overlay Gradient */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-4">
                  <span className="text-xs font-serif font-bold text-gold-200">
                    Artisan Collective Jaipur &amp; Surat
                  </span>
                </div>
              </div>

              {/* Floating Secondary Mini Card */}
              <div className="absolute -bottom-6 -left-6 hidden sm:block w-32 h-32 rounded-2xl overflow-hidden border-2 border-gold-500/60 shadow-xl bg-black">
                <img
                  src={slide.secondaryImage}
                  alt="Secondary preview"
                  className="w-full h-full object-cover"
                />
              </div>

            </div>
          </div>

        </div>

        {/* Carousel Navigation Arrows & Dots */}
        <div className="flex items-center justify-between pt-8 mt-6 border-t border-gold-500/20">
          <div className="flex items-center gap-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx
                    ? 'w-8 bg-gold-400'
                    : 'w-2 bg-stone-600 hover:bg-stone-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
              className="p-2 rounded-full bg-maroon-900/80 border border-gold-500/30 text-gold-300 hover:bg-gold-500 hover:text-maroon-950 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
              className="p-2 rounded-full bg-maroon-900/80 border border-gold-500/30 text-gold-300 hover:bg-gold-500 hover:text-maroon-950 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HeroCarousel;
