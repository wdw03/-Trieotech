'use client';

import React from 'react';
import {
  ExternalLink,
  ShieldCheck,
  Truck,
  Sparkles,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

const AMAZON_STORE_URL =
  'https://www.amazon.in/stores/TRIOENTERPRISES/page/50E428EF-50D4-41BA-AA1A-C2C8FA9B4608';

export default function AmazonMarketplaceBanner() {
  return (
    <div className="w-full mb-8 sm:mb-12">
      <div className="relative overflow-hidden rounded-3xl border-2 border-gold-500/30 bg-gradient-to-br from-[#1C120B] via-[#140D08] to-[#1F0C12] text-stone-200 shadow-2xl p-6 sm:p-8 lg:p-10 transition-all duration-300 hover:border-gold-500/60 group">
        {/* Subtle Decorative Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          
          {/* Left / Center Info */}
          <div className="flex-1 text-center md:text-left space-y-3 sm:space-y-4">
            
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-300 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em]">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>AVAILABLE ACROSS INDIA</span>
            </div>

            {/* Main Heading */}
            <h3 className="font-serif font-black text-xl sm:text-2xl lg:text-3xl text-white tracking-tight leading-snug">
              Trusted Marketplaces Where You Can Buy{' '}
              <span className="text-gold-300">Trio Enterprises</span>
            </h3>

            {/* Subtitle / Description */}
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Experience the authentic art of Jaipur zardosi embroidery patches, sacred mandir essentials, and festive gifts with the trust and express delivery of Amazon India.
            </p>

            {/* Trust Highlights */}
            <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-3 text-[11px] text-stone-300 font-medium">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-gold-500/20 text-stone-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Genuine Crafts</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-gold-500/20 text-stone-200">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span>Fast Prime Delivery</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-gold-500/20 text-stone-200">
                <ShoppingBag className="w-3.5 h-3.5 text-gold-400" />
                <span>Official Brand Store</span>
              </span>
            </div>

            {/* Call to Action Button */}
            <div className="pt-2">
              <a
                href={AMAZON_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF9900] to-[#E68A00] hover:from-[#FFA724] hover:to-[#F29400] text-stone-950 font-extrabold text-xs sm:text-sm shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all duration-200 uppercase tracking-wider group/btn"
              >
                <span>Shop on Amazon India</span>
                <ExternalLink className="w-4 h-4 stroke-[2.5] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Right Image / Interactive Amazon Badge */}
          <div className="shrink-0 flex flex-col items-center">
            <a
              href={AMAZON_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit Trio Enterprises Official Amazon Store"
              className="relative group/badge block focus:outline-none focus:ring-4 focus:ring-gold-500/40 rounded-full"
            >
              {/* Outer Golden Glow Ring */}
              <div className="absolute -inset-2 bg-gradient-to-r from-gold-500/30 via-amber-500/40 to-gold-500/30 rounded-full blur-md opacity-70 group-hover/badge:opacity-100 group-hover/badge:scale-105 transition-all duration-300" />

              {/* Logo Card */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-full p-2 bg-[#120B07] border-2 border-gold-500/50 shadow-2xl flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover/badge:scale-105">
                <img
                  src="/amazon-store-banner.webp"
                  alt="Amazon - Trio Enterprises Official Store"
                  className="w-full h-full object-contain rounded-full drop-shadow-md"
                  width={430}
                  height={430}
                  loading="lazy"
                />
              </div>

              {/* Click to open badge indicator */}
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-black/90 border border-gold-500/40 text-[10px] font-bold text-gold-300 shadow-md flex items-center gap-1 group-hover/badge:bg-gold-500 group-hover/badge:text-black transition-colors">
                <span>Visit Store</span>
                <ArrowRight className="w-3 h-3 stroke-[2.5]" />
              </div>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
