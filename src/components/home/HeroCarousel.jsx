import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight, Award, ShieldCheck } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    badge: "Festive & Wedding 2026",
    title: "Handcrafted Zardosi & Sacred Deity Patches",
    mobileTitle: "Handcrafted Zardosi & Deity Patches",
    subtitle: "Ornate gold zari, zarkan stone cutwork, and royal peacock motifs hand-stitched by generational master karigars for bridal lehengas and festive couture.",
    mobileSubtitle: "Royal zari, zarkan stone cutwork & peacock motifs by master karigars.",
    ctaText: "Explore Patches",
    desktopCtaText: "Explore Embroidery Patches",
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
    mobileTitle: "Pure Ayurvedic Copper Bottles",
    subtitle: "Infuse your daily water with natural antimicrobial goodness and holistic vitality. Hand-hammered with heavy-gauge pure copper by traditional thatheras.",
    mobileSubtitle: "Hand-hammered heavy-gauge pure copper for holistic daily vitality.",
    ctaText: "Shop Copper Bottles",
    desktopCtaText: "Shop Copper Bottles",
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
    mobileTitle: "Velvet Pooja Aasans & Brass Thalis",
    subtitle: "Elevate your daily aarti and festive mandir ceremonies with pure red velvet aasans, embellished brass diyas, and authentic desi cotton gamchas.",
    mobileSubtitle: "Pure velvet aasans, embellished brass diyas & sacred essentials.",
    ctaText: "Discover Pooja Items",
    desktopCtaText: "Discover Pooja Essentials",
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
      className="relative overflow-hidden w-full max-w-full bg-gradient-to-b from-[#2A0E0E] via-[#1E0909] to-[#120505] text-white py-4 sm:py-8 lg:py-20 border-b border-gold-500/30"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Decorative Motif */}
      <div className="absolute inset-0 opacity-10 pointer-events-none mandala-bg" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-maroon-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gold-600/15 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6 lg:gap-12 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-2 sm:space-y-4 lg:space-y-6 text-center lg:text-left">
            
            {/* Top Tag */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3.5 sm:py-1.5 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-inner">
              <Sparkles className="w-3 h-3 text-gold-400 shrink-0" />
              <span className="truncate">{slide.badge}</span>
            </div>

            {/* Main Headline - Compact on Mobile, Full on Desktop */}
            <h1 className="font-serif font-extrabold text-xl sm:text-3xl md:text-5xl lg:text-6xl text-ivory-100 leading-snug sm:leading-tight tracking-tight">
              <span className="block sm:hidden">{slide.mobileTitle}</span>
              <span className="hidden sm:block">{slide.title}</span>
            </h1>

            {/* Subtitle - Concise on Mobile, Detailed on Desktop */}
            <p className="text-stone-300 text-xs sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              <span className="block sm:hidden text-stone-300/90">{slide.mobileSubtitle}</span>
              <span className="hidden sm:block">{slide.subtitle}</span>
            </p>

            {/* CTAs */}
            <div className="flex items-center justify-center lg:justify-start gap-2.5 pt-1 sm:pt-2">
              <Link
                to={slide.ctaLink}
                className="btn-gold py-2 px-5 sm:py-3.5 sm:px-8 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-gold-sm sm:shadow-gold-md shrink-0"
              >
                <span className="block sm:hidden">{slide.ctaText}</span>
                <span className="hidden sm:block">{slide.desktopCtaText}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
              
              <Link
                to={slide.secondaryCtaLink}
                className="hidden sm:inline-flex px-6 py-3.5 rounded-xl border-2 border-gold-500/40 text-gold-200 hover:bg-gold-500/10 hover:text-white transition-all text-xs sm:text-sm font-bold uppercase tracking-wider items-center justify-center"
              >
                {slide.secondaryCtaText}
              </Link>
            </div>

            {/* Trust Highlights Strip (Desktop Only to preserve Mobile fold) */}
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
          <div className="lg:col-span-5 relative mt-0.5 sm:mt-0">
            <div className="relative mx-auto max-w-[280px] xs:max-w-[320px] sm:max-w-md">
              
              {/* Main Visual Card with Correct Aspect Ratio */}
              <div className="relative aspect-[4/3.4] sm:aspect-[4/4.5] rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-gold-500/40 shadow-xl sm:shadow-2xl bg-[#1C0F0F] group">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Floating Tag */}
                <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 bg-maroon-900/90 backdrop-blur-md border border-gold-500/40 text-gold-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-lg">
                  {slide.tag}
                </div>

                {/* Bottom Overlay Gradient */}
                <div className="absolute inset-x-0 bottom-0 h-16 sm:h-28 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-2.5 sm:p-4">
                  <span className="text-[10px] sm:text-xs font-serif font-bold text-gold-200 truncate">
                    Artisan Collective Jaipur &amp; Surat
                  </span>
                </div>
              </div>

              {/* Floating Secondary Mini Card (Desktop/Tablet Only) */}
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
        <div className="flex items-center justify-between pt-3 mt-2.5 sm:pt-6 sm:mt-6 border-t border-gold-500/20">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx
                    ? 'w-6 sm:w-8 bg-gold-400'
                    : 'w-1.5 sm:w-2 bg-stone-600 hover:bg-stone-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
              className="p-1.5 sm:p-2 rounded-full bg-maroon-900/80 border border-gold-500/30 text-gold-300 hover:bg-gold-500 hover:text-maroon-950 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
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
