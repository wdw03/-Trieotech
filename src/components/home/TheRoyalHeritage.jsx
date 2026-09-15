'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Check, ArrowRight, Award, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Reveal } from './SharedUI';

export default function TheRoyalHeritage() {
  return (
    <section className="relative py-24 px-4 sm:px-8 md:px-12 bg-[#0d0b09] overflow-hidden border-t border-[#d4af37]/15">
      {/* Glow backgrounds */}
      <div className="pointer-events-none absolute -left-40 top-1/4 w-[500px] h-[500px] rounded-full bg-[#d4af37]/[0.04] blur-[150px]" />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 w-[500px] h-[500px] rounded-full bg-[#8e2438]/[0.06] blur-[150px]" />

      <div className="relative max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Framed Masterpiece Visual (5 cols) */}
          <div className="lg:col-span-6 relative">
            <Reveal>
              <div className="relative rounded-3xl overflow-hidden border-2 border-[#d4af37]/30 shadow-[0_30px_90px_rgba(0,0,0,0.95)] group/artisan select-none bg-[#12100d]">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src="/products/beaded-lotus-patch.jpg"
                    alt="Master Artisan Heritage Craft"
                    className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover/artisan:scale-108"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b09] via-transparent to-black/20" />
                </div>

                {/* Floating Artisan Authenticity Badge */}
                <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-[#0d0b09]/90 backdrop-blur-md border border-[#d4af37]/30 flex items-center justify-between shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
                      <Award size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] font-bold">
                        Master Atelier
                      </p>
                      <h4 className="font-serif text-white text-base">Over 140 Hours Per Motif</h4>
                    </div>
                  </div>
                  <span className="hidden sm:inline-block text-[9px] font-black uppercase tracking-widest text-[#f5e6b8] bg-[#d4af37]/20 border border-[#d4af37]/40 px-3 py-1 rounded-full">
                    100% Certified
                  </span>
                </div>

                {/* Top Corner Seal */}
                <div className="absolute top-5 right-5 w-16 h-16 rounded-full border border-[#d4af37]/50 flex items-center justify-center bg-[#0d0b09]/80 backdrop-blur-md text-[#d4af37] shadow-xl">
                  <Sparkles size={22} className="animate-pulse" />
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right Column: Editorial Narrative (7 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <Reveal delay={150}>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-px bg-[#d4af37]" />
                <span className="text-[10px] font-bold text-[#d4af37] tracking-[0.4em] uppercase flex items-center gap-2">
                  <Sparkles size={11} className="text-[#d4af37]" />
                  <span>Generational Legacy</span>
                </span>
              </div>

              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white uppercase tracking-wide font-light leading-[1.08] mb-6">
                The Sacred Soul of{' '}
                <span className="italic craft-gold-text">Indian Craftsmanship</span>
              </h2>

              <p className="text-white/70 text-sm sm:text-base leading-relaxed font-light mb-6">
                In an era of mass-produced replicas, Triotech stands as a sanctuary for authentic
                Indian artisans. From the historic dabka ateliers of Varanasi to the traditional
                thathera metalsmiths of Moradabad, every creation in our collection is an ode to
                sacred devotion and timeless perfection.
              </p>

              {/* 3 Pillars */}
              <div className="space-y-4 mb-8 pt-4 border-t border-white/10">
                <div className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0 mt-0.5">
                    <Check size={13} />
                  </div>
                  <div>
                    <h5 className="text-white text-sm font-semibold tracking-wide">
                      Pure Dabka, Zari & Natural Semiprecious Pearls
                    </h5>
                    <p className="text-white/50 text-xs mt-0.5 leading-normal font-light">
                      No synthetic substitutes. Hand-threaded needlework that retains its shimmer for generations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0 mt-0.5">
                    <Check size={13} />
                  </div>
                  <div>
                    <h5 className="text-white text-sm font-semibold tracking-wide">
                      100% Solid Certified Heavy-Gauge Copper
                    </h5>
                    <p className="text-white/50 text-xs mt-0.5 leading-normal font-light">
                      Seamless, lead-free, and tested for authentic Ayurvedic water ionisation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0 mt-0.5">
                    <Check size={13} />
                  </div>
                  <div>
                    <h5 className="text-white text-sm font-semibold tracking-wide">
                      Direct Patronage to Artisanal Families
                    </h5>
                    <p className="text-white/50 text-xs mt-0.5 leading-normal font-light">
                      Every purchase directly honors and empowers master weavers and craftsmen across India.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex flex-wrap items-center gap-5">
                <Link
                  href="/shop"
                  className="group relative inline-flex items-center gap-4 overflow-hidden bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#f5e6b8] text-[#0d0b09] px-9 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.28em] transition-all duration-500 hover:shadow-[0_10px_35px_rgba(212,175,55,0.45)] hover:-translate-y-0.5 active:scale-95"
                >
                  <span className="relative z-10">Explore The Sanctum</span>
                  <ArrowRight
                    size={15}
                    className="relative z-10 group-hover:translate-x-1.5 transition-transform duration-300"
                  />
                </Link>

                <Link
                  href="/category/patches"
                  className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d4af37] hover:text-white transition-colors flex items-center gap-2 py-2"
                >
                  <span>View Zardosi Edits</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
