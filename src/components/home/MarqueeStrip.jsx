'use client';

import React from 'react';
import { Sparkles, Crown, Gem, Flame } from 'lucide-react';

const marqueeItems = [
  { text: 'Handcrafted Heritage', icon: Crown },
  { text: '100% Pure Tamra Jal Copper', icon: Flame },
  { text: 'Royal Zardosi & Dabka Embroidery', icon: Sparkles },
  { text: 'Sacred Mandir Aasans & Sanctum Decor', icon: Gem },
  { text: 'Certified Master Karigars', icon: Crown },
  { text: 'Free Express Shipping Across India', icon: Sparkles },
  { text: 'Heirloom Quality Handloom', icon: Gem },
  { text: 'Direct From Artisan Ateliers', icon: Flame },
];

export default function MarqueeStrip() {
  return (
    <section className="relative w-full overflow-hidden bg-[#0a0807] border-y border-[#d4af37]/25 py-4 sm:py-5 select-none">
      {/* Subtle gold ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/5 via-transparent to-[#d4af37]/5 pointer-events-none" />

      {/* Infinite Scrolling Track */}
      <div className="flex w-max animate-[marquee_32s_linear_infinite] hover:[animation-play-state:paused]">
        {[...marqueeItems, ...marqueeItems].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center gap-6 sm:gap-8 mx-6 sm:mx-8">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] text-[#f5e6b8] hover:text-[#d4af37] transition-colors whitespace-nowrap flex items-center gap-4">
                <Icon size={13} className="text-[#d4af37] animate-pulse shrink-0" />
                {item.text}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]/50 shrink-0" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
