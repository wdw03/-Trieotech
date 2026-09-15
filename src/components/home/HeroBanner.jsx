'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';

const heroSlides = [
  {
    image: '/products/beaded-lotus-patch.jpg',
    badge: 'Artisanal Zardosi Masterpiece',
    title: 'Imperial Heritage Patches',
    subtitle: 'Hand-embroidered with authentic dabka, zardosi, and lustrous seed pearls.',
    cta: 'Explore Patches',
    link: '/category/patches',
    word: 'Regal Craft',
  },
  {
    image: '/products/copper-bottle-bag-set-1.jpg',
    badge: '100% Pure Tamra Jal Wellness',
    title: 'Ayurvedic Copper Vessels',
    subtitle: 'Hand-hammered heavy-gauge copper for sacred wellness and balanced living.',
    cta: 'Discover Copper',
    link: '/category/bottle',
    word: 'Pure Healing',
  },
  {
    image: '/products/brass-pooja-thali-set-1.jpg',
    badge: 'Sacred Mandir Collection',
    title: 'Divine Pooja Essentials',
    subtitle: 'Handcrafted velvet aasans, auspicious brass thalis, and consecrated diyas.',
    cta: 'View Mandir Sanctum',
    link: '/category/aasan',
    word: 'Divine Grace',
  },
];

const rotatingWords = ['Imperial Luxury', 'Sacred Heritage', 'Artisanal Elegance', 'Divine Grace'];

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [wordChanging, setWordChanging] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const goToSlide = useCallback((idx) => {
    setCurrentSlide(((idx % heroSlides.length) + heroSlides.length) % heroSlides.length);
    setProgressKey((k) => k + 1);
  }, []);

  // Autoplay
  useEffect(() => {
    const timer = setInterval(() => {
      goToSlide(currentSlide + 1);
    }, 6500);
    return () => clearInterval(timer);
  }, [currentSlide, goToSlide]);

  // Kinetic typography word rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setWordChanging(true);
      setTimeout(() => {
        setWordIndex((p) => (p + 1) % rotatingWords.length);
        setWordChanging(false);
      }, 450);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  // Swipe & mouse drag
  const dragStartX = useRef(null);
  const onDragStart = (x) => {
    dragStartX.current = x;
  };
  const onDragEnd = (x) => {
    if (dragStartX.current === null) return;
    const diff = dragStartX.current - x;
    if (Math.abs(diff) > 45) {
      goToSlide(currentSlide + (diff > 0 ? 1 : -1));
    }
    dragStartX.current = null;
  };

  return (
    <section className="w-full min-h-[580px] h-[86vh] max-h-[840px] px-3 pt-3 pb-6 sm:px-6 sm:pt-4 md:px-10 lg:px-12 bg-[#0d0b09]">
      <div
        className="relative w-full h-full rounded-2xl sm:rounded-[2rem] overflow-hidden border border-[#d4af37]/20 shadow-[0_30px_80px_rgba(0,0,0,0.9)] cursor-grab active:cursor-grabbing group/hero select-none bg-[#12100d]"
        onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
        onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientX)}
        onMouseDown={(e) => onDragStart(e.clientX)}
        onMouseUp={(e) => onDragEnd(e.clientX)}
        onMouseLeave={() => (dragStartX.current = null)}
      >
        {/* Slides */}
        {heroSlides.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={idx}
              className={`absolute inset-0 transition-all duration-[1300ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105 pointer-events-none'
              }`}
            >
              {/* Image with Ken-Burns zoom on active slide */}
              <img
                src={slide.image}
                alt={slide.title}
                draggable={false}
                className={`w-full h-full object-cover object-center opacity-70 sm:opacity-80 transition-transform ${
                  isActive ? 'animate-[ken-burns_9s_ease-out_forwards]' : ''
                }`}
              />

              {/* Atmospheric Luxury Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b09] via-[#0d0b09]/60 to-black/25" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d0b09]/90 via-[#0d0b09]/50 to-transparent" />

              {/* Subtle Gold Dust Glow */}
              <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-[#d4af37]/10 blur-[120px] pointer-events-none" />

              {/* Slide Content */}
              <div className="absolute inset-0 flex items-center px-6 sm:px-12 md:px-16 lg:px-24">
                <div className="max-w-2xl text-white">
                  {isActive && (
                    <>
                      {/* Top Tracked Subtitle */}
                      <p className="font-bold text-[9px] sm:text-[11px] uppercase tracking-[0.4em] mb-4 sm:mb-6 text-[#d4af37] flex items-center gap-3 sm:gap-4 opacity-0 animate-[hero-up_0.8s_cubic-bezier(0.16,1,0.3,1)_0.15s_forwards]">
                        <span className="w-8 sm:w-12 h-[1px] bg-gradient-to-r from-transparent to-[#d4af37] inline-block" />
                        <Sparkles size={12} className="text-[#d4af37] animate-pulse shrink-0" />
                        <span>{slide.badge}</span>
                      </p>

                      {/* Main Grand Serif Title */}
                      <h1 className="font-serif font-light text-4xl sm:text-6xl md:text-7xl lg:text-8xl uppercase tracking-wider leading-[1.05] mb-3 sm:mb-4 drop-shadow-2xl italic opacity-0 animate-[hero-up_0.9s_cubic-bezier(0.16,1,0.3,1)_0.3s_forwards]">
                        {slide.title}
                      </h1>

                      {/* Kinetic Rotating Word Line */}
                      <div className="h-[2em] sm:h-[2.4em] flex items-center overflow-hidden mb-4 sm:mb-6 opacity-0 animate-[hero-up_0.9s_cubic-bezier(0.16,1,0.3,1)_0.45s_forwards]">
                        <span
                          className={`block font-serif text-xl sm:text-3xl md:text-4xl uppercase tracking-[0.25em] text-[#f5e6b8] italic transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                            wordChanging ? 'translate-y-[-120%] opacity-0 blur-sm' : 'translate-y-0 opacity-100 blur-0'
                          }`}
                        >
                          <span className="text-[#d4af37]">Pure</span> {rotatingWords[wordIndex]}
                        </span>
                      </div>

                      {/* Subtitle Description */}
                      <p className="text-white/70 text-xs sm:text-sm md:text-base font-light max-w-lg mb-8 leading-relaxed opacity-0 animate-[hero-up_0.9s_cubic-bezier(0.16,1,0.3,1)_0.6s_forwards]">
                        {slide.subtitle}
                      </p>

                      {/* CTA Button */}
                      <div className="opacity-0 animate-[hero-up_0.9s_cubic-bezier(0.16,1,0.3,1)_0.75s_forwards]">
                        <Link
                          href={slide.link}
                          className="group/btn relative inline-flex items-center gap-4 overflow-hidden border border-[#d4af37]/60 bg-[#12100d]/80 backdrop-blur-md text-[#d4af37] px-8 py-4 sm:px-10 sm:py-5 uppercase tracking-[0.3em] text-[10px] sm:text-xs font-bold transition-all duration-500 hover:text-[#0d0b09] hover:border-[#d4af37] hover:shadow-[0_10px_40px_rgba(212,175,55,0.4)] rounded-sm"
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#f5e6b8] -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                          <span className="relative z-10">{slide.cta}</span>
                          <ArrowRight
                            size={16}
                            className="relative z-10 group-hover/btn:translate-x-1.5 transition-transform duration-300"
                          />
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Prev / Next Arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToSlide(currentSlide - 1);
          }}
          aria-label="Previous slide"
          className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full border border-[#d4af37]/40 bg-[#0d0b09]/70 backdrop-blur-md text-[#d4af37] flex items-center justify-center opacity-0 group-hover/hero:opacity-100 -translate-x-2 group-hover/hero:translate-x-0 transition-all duration-400 hover:bg-[#d4af37] hover:text-[#0d0b09] active:scale-95 shadow-lg"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToSlide(currentSlide + 1);
          }}
          aria-label="Next slide"
          className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full border border-[#d4af37]/40 bg-[#0d0b09]/70 backdrop-blur-md text-[#d4af37] flex items-center justify-center opacity-0 group-hover/hero:opacity-100 translate-x-2 group-hover/hero:translate-x-0 transition-all duration-400 hover:bg-[#d4af37] hover:text-[#0d0b09] active:scale-95 shadow-lg"
        >
          <ChevronRight size={20} />
        </button>

        {/* Progress-bar indicators at bottom */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5 sm:gap-3 z-30">
          {heroSlides.map((_, idx) => {
            const isActive = idx === currentSlide;
            return (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(idx);
                }}
                className={`group/bar relative h-1 sm:h-1.5 transition-all duration-500 rounded-full overflow-hidden ${
                  isActive ? 'w-12 sm:w-16 bg-[#d4af37]/30' : 'w-4 sm:w-6 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Slide ${idx + 1}`}
              >
                {isActive && (
                  <span
                    key={progressKey}
                    className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#f5e6b8] rounded-full animate-[progress_6.5s_linear_forwards]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
