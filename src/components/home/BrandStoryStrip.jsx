import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Heart, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

export const BrandStoryStrip = () => {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-[#1C0E0E] via-[#2A1212] to-[#160A0A] text-white border-y border-gold-500/30 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none mandala-bg" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Visual Collage */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3.5 sm:gap-4">
            <div className="space-y-3.5 sm:space-y-4">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden border-2 border-gold-500/30 shadow-2xl bg-black">
                <img
                  src="/products/peacock-real-feathers-pair-1.jpg"
                  alt="Peacock Zardosi Craftsmanship"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square rounded-3xl overflow-hidden border-2 border-gold-500/30 shadow-2xl bg-black">
                <img
                  src="/products/lotus-kamal-aasan-1.jpg"
                  alt="Velvet Lotus Aasan"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-3.5 sm:space-y-4 pt-6">
              <div className="aspect-square rounded-3xl overflow-hidden border-2 border-gold-500/30 shadow-2xl bg-black">
                <img
                  src="/products/hammered-copper-bottle-1.jpg"
                  alt="Hand hammered copper bottle"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[4/5] rounded-3xl overflow-hidden border-2 border-gold-500/30 shadow-2xl bg-black">
                <img
                  src="/products/gold-clear-cup-chain-10m-1.jpg"
                  alt="Zarkan stone cup chain"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Right Text Story */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>The Trio Ecart Artisan Heritage</span>
            </div>

            <h2 className="font-serif font-black text-3xl sm:text-4xl text-ivory-100 leading-tight">
              Preserving Centuries of Indian Karigari, One Stitch at a Time
            </h2>

            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              Founded on the sacred belief that every Indian handicraft carries the spiritual soul of its maker, <strong>Trio Ecart</strong> bridges generational artisan guilds of Jaipur, Surat, and Varanasi with patrons worldwide.
            </p>

            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              Whether it is the hand-drawn gold bullion wire of a bridal peacock zardosi applique, the pure Ayurvedic resonance of a hand-beaten copper jug, or the consecrated purity of a velvet pooja aasan — we ensure 100% genuine craftsmanship, ethical fair wages, and uncompromised festive beauty.
            </p>

            {/* Numbers Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gold-500/20">
              <div className="space-y-1">
                <span className="font-serif font-black text-2xl sm:text-3xl text-gold-400">150+</span>
                <p className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">Master Artisans</p>
              </div>
              <div className="space-y-1">
                <span className="font-serif font-black text-2xl sm:text-3xl text-gold-400">43+</span>
                <p className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">Unique Handcrafts</p>
              </div>
              <div className="space-y-1">
                <span className="font-serif font-black text-2xl sm:text-3xl text-gold-400">25,000+</span>
                <p className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">Happy Devotees</p>
              </div>
              <div className="space-y-1">
                <span className="font-serif font-black text-2xl sm:text-3xl text-gold-400">100%</span>
                <p className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">Desi Handcrafted</p>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-2">
              <Link
                to="/about"
                className="btn-gold text-xs font-bold uppercase tracking-wider px-6 py-3 inline-flex items-center gap-2"
              >
                <span>Read Our Artisan Guild Story</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default BrandStoryStrip;
