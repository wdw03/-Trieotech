'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Crown, Gem, Flame } from 'lucide-react';

const collections = [
  {
    id: 'c1',
    title: 'Imperial Zardosi Patches',
    tagline: 'Bridal Couture & Deity Adornments',
    pieces: '45+ Hand-finished Patches',
    starting: '₹249',
    region: 'Varanasi Ateliers',
    image: '/products/beaded-lotus-patch.jpg',
    link: '/category/patches',
    icon: Crown,
    accent: '#8e2438',
  },
  {
    id: 'c2',
    title: 'Pure Ayurvedic Copper',
    tagline: 'Hand-hammered Tamra Jal Vessels',
    pieces: '100% Certified Copper',
    starting: '₹499',
    region: 'Moradabad Metalsmiths',
    image: '/products/copper-bottle-bag-set-1.jpg',
    link: '/category/bottle',
    icon: Flame,
    accent: '#b8860b',
  },
  {
    id: 'c3',
    title: 'Velvet Mandir Aasans',
    tagline: 'Sacred Sanctum & Chowki Cloths',
    pieces: 'Heirloom Devotional Aasans',
    starting: '₹349',
    region: 'Mathura & Surat',
    image: '/products/lotus-kamal-aasan-1.jpg',
    link: '/category/aasan',
    icon: Gem,
    accent: '#1f6f50',
  },
  {
    id: 'c4',
    title: 'Brass Pooja Essentials',
    tagline: 'Auspicious Thalis & Consecrated Diyas',
    pieces: '30+ Ritualistic Creations',
    starting: '₹599',
    region: 'Aligarh Brass Artisans',
    image: '/products/brass-pooja-thali-set-1.jpg',
    link: '/category/aasan',
    icon: Sparkles,
    accent: '#3b0e1e',
  },
];

const rotatingWords = ['Collection', 'Heritage', 'Elegance', 'Sanctum', 'Tradition'];

export default function ShopByCollection() {
  const [index, setIndex] = useState(0);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsChanging(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % rotatingWords.length);
        setIsChanging(false);
      }, 450);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-20 sm:py-24 px-4 sm:px-8 md:px-12 bg-[#0a0807] overflow-hidden border-t border-[#d4af37]/15">
      {/* Subtle background ambient */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#d4af37]/[0.03] blur-[150px]" />

      <div className="relative max-w-[1400px] mx-auto">
        {/* Header with animated rotating headline */}
        <div className="text-center mb-14 sm:mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="w-10 sm:w-14 h-px bg-gradient-to-r from-transparent to-[#d4af37]" />
            <span className="text-[10px] font-bold text-[#d4af37] tracking-[0.45em] uppercase inline-flex items-center gap-2">
              <Sparkles size={11} className="text-[#d4af37] animate-pulse" />
              <span>Curated For The Connoisseur</span>
              <Sparkles size={11} className="text-[#d4af37] animate-pulse" />
            </span>
            <span className="w-10 sm:w-14 h-px bg-gradient-to-l from-transparent to-[#d4af37]" />
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl text-white uppercase tracking-wider font-light">
            Shop by{' '}
            <span className="relative inline-block h-[1.15em] overflow-hidden align-bottom">
              <span
                className={`block italic craft-gold-text transition-all duration-450 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isChanging ? 'translate-y-[-110%] opacity-0 blur-sm' : 'translate-y-0 opacity-100 blur-0'
                }`}
              >
                {rotatingWords[index]}
              </span>
            </span>
          </h2>

          <p className="text-white/55 text-xs sm:text-sm md:text-base max-w-2xl mx-auto mt-4 leading-relaxed font-light px-4">
            Four signature edits, dozens of handcrafted heirlooms. Every creation carries the
            soul of Indian artisan craft — pure dabka, solid copper, and sacred silk.
          </p>

          <div className="flex gap-1.5 mt-6 justify-center items-center">
            <div className="h-[2px] w-16 bg-[#d4af37] rounded-full" />
            <div className="h-1 w-1 bg-[#d4af37]/60 rounded-full animate-pulse" />
            <div className="h-1 w-1 bg-[#d4af37]/30 rounded-full animate-pulse delay-100" />
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.map((col, idx) => {
            const Icon = col.icon;
            return (
              <Link
                key={col.id}
                href={col.link}
                className="group relative h-[460px] rounded-[1.8rem] overflow-hidden border border-[#d4af37]/20 hover:border-[#d4af37]/60 transition-all duration-700 hover:shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(212,175,55,0.15)] flex flex-col justify-end p-6 select-none bg-[#12100d]"
              >
                {/* Background Image */}
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={col.image}
                    alt={col.title}
                    className="w-full h-full object-cover object-center opacity-65 transition-transform duration-1000 ease-out group-hover:scale-115"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b09] via-[#0d0b09]/60 to-black/30" />
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0d0b09]/50 via-transparent to-[#0d0b09]/90" />
                </div>

                {/* Top Badge Rail */}
                <div className="absolute top-5 inset-x-5 flex items-center justify-between z-10">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-[#f5e6b8] bg-[#0d0b09]/80 border border-[#d4af37]/30 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <Icon size={11} className="text-[#d4af37]" />
                    {col.region}
                  </span>
                  <span className="text-[10px] font-bold text-[#d4af37] bg-[#0d0b09]/80 border border-[#d4af37]/30 px-2.5 py-1 rounded-full backdrop-blur-md">
                    From {col.starting}
                  </span>
                </div>

                {/* Content at Bottom */}
                <div className="relative z-10 flex flex-col gap-2">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-[#d4af37] font-bold">
                    {col.pieces}
                  </p>
                  <h3 className="font-serif text-2xl text-white font-normal group-hover:text-[#f5e6b8] transition-colors leading-tight">
                    {col.title}
                  </h3>
                  <p className="text-white/60 text-xs line-clamp-2 leading-relaxed font-light">
                    {col.tagline}
                  </p>

                  <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between text-[#d4af37] text-[10px] font-bold uppercase tracking-[0.25em] group-hover:text-white transition-colors">
                    <span>Explore Edit</span>
                    <div className="w-8 h-8 rounded-full border border-[#d4af37]/40 flex items-center justify-center group-hover:bg-[#d4af37] group-hover:text-[#0d0b09] transition-all duration-400 group-hover:translate-x-1">
                      <ArrowRight size={13} />
                    </div>
                  </div>
                </div>

                {/* Card Top Arch Accent */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
