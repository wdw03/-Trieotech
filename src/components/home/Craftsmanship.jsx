'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Clock, Award, Hammer, Gem } from 'lucide-react';
import { SectionTitle, Reveal } from './SharedUI';

const craftPillars = [
  {
    id: 'zardosi',
    name: 'Zardosi & Dabka',
    subtitle: 'Varanasi Master Karigars',
    duration: '40 - 160 Hours Per Piece',
    materials: 'Pure Gold Zari, Metallic Dabka, Seed Pearls',
    image: '/products/beaded-lotus-patch.jpg',
    description:
      'Zardozi, derived from Persian "Zar" (gold) and "Dozi" (embroidery), requires sitting at wooden karchob frames for days. Master artisans guide tiny needles with coiled metallic wires to form intricate lotus florets, peacocks, and deity insignias.',
    highlights: ['Micro-twisted French wire', 'Hand-sewn lustrous faux pearls', 'Velvet & silk organza base', 'Generational handloom techniques'],
  },
  {
    id: 'copper',
    name: 'Ayurvedic Copper',
    subtitle: 'Moradabad Thathear Smiths',
    duration: '18 - 24 Hours Per Vessel',
    materials: '99.7% Pure Elemental Copper',
    image: '/products/copper-bottle-bag-set-1.jpg',
    description:
      'Our copper vessels are individually hand-hammered by ancestral metalsmiths. Hand-beaten dimples increase surface contact with water, maximizing the natural release of copper ions (Tamra Jal) according to ancient Charaka Samhita scriptures.',
    highlights: ['100% Solid heavy-gauge copper', 'Zero chemical lacquer inside', 'Leak-proof precision threads', 'Ayurvedic ionisation certified'],
  },
  {
    id: 'aasan',
    name: 'Sanctum Aasans',
    subtitle: 'Mathura Devotional Tailors',
    duration: '12 - 30 Hours Per Aasan',
    materials: 'Heavy Royal Velvet, Pure Zari Borders',
    image: '/products/lotus-kamal-aasan-1.jpg',
    description:
      'Crafted strictly for sacred mandirs, meditation sanctums, and pooja chowkis. Each aasan features rich ceremonial red or golden yellow velvet framed by intricate floral gota-patti and cutwork borders designed to hold divine grace.',
    highlights: ['Plush high-density royal velvet', 'Non-slip reinforced backing', 'Embroidered lotus motifs', 'Vastu-compliant dimensions'],
  },
  {
    id: 'brass',
    name: 'Brass Pooja Thalis',
    subtitle: 'Aligarh Brass Guilds',
    duration: '15 - 28 Hours Per Ensemble',
    materials: 'Virgin Bell-Metal & Solid Brass',
    image: '/products/brass-pooja-thali-set-1.jpg',
    description:
      'Hand-engraved ceremonial pooja sets featuring deep-carved Gayatri mantras, Peacock diya branches, and Panchamrit lotas. Cast using traditional sand-moulding methods for lifelong heirloom resonance.',
    highlights: ['Traditional sand-cast brass', 'Hand-etched sacred geometry', 'Tarnish-resistant mirror polish', 'Complete ritualistic set'],
  },
];

export default function Craftsmanship() {
  const [activePillar, setActivePillar] = useState(craftPillars[0]);

  return (
    <section className="relative py-24 px-4 sm:px-8 md:px-12 bg-[#0a0807] overflow-hidden border-t border-[#d4af37]/15">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/3 right-10 w-[600px] h-[600px] rounded-full bg-[#d4af37]/[0.03] blur-[160px]" />

      <div className="relative max-w-[1400px] mx-auto">
        <SectionTitle
          subtitle="Pillars of Perfection"
          title="The Master Atelier"
          description="A rare convergence of centuries-old Indian arts — every stitch, hammer strike, and thread woven with reverence."
        />

        {/* Tab Navigation Buttons */}
        <Reveal delay={100}>
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-12 sm:mb-16">
            {craftPillars.map((p) => {
              const isActive = activePillar.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePillar(p)}
                  className={`relative px-5 py-3 rounded-xl text-xs sm:text-sm uppercase tracking-[0.2em] font-bold transition-all duration-500 active:scale-95 ${
                    isActive
                      ? 'text-[#0d0b09] shadow-[0_10px_30px_rgba(212,175,55,0.4)]'
                      : 'text-white/60 hover:text-[#d4af37] bg-[#12100d] border border-white/10 hover:border-[#d4af37]/40'
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#f5e6b8]" />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles size={13} className={isActive ? 'text-[#0d0b09]' : 'text-[#d4af37]'} />
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Active Pillar Card */}
        <Reveal delay={200}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-[#12100d] rounded-3xl p-6 sm:p-10 lg:p-12 border border-[#d4af37]/25 shadow-[0_30px_80px_rgba(0,0,0,0.85)] items-center">
            {/* Left: Image with golden frame */}
            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#d4af37]/40 shadow-2xl group">
                <img
                  src={activePillar.image}
                  alt={activePillar.name}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b09] via-transparent to-transparent opacity-60" />

                {/* Subtitle pill */}
                <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-[#0d0b09]/85 backdrop-blur-md border border-[#d4af37]/30 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.25em] text-[#d4af37] font-bold block">
                      Ancestral Provenance
                    </span>
                    <span className="font-serif text-white text-sm">{activePillar.subtitle}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#f5e6b8] text-xs font-semibold">
                    <Clock size={13} className="text-[#d4af37]" />
                    <span>{activePillar.duration}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Technical detail & description */}
            <div className="lg:col-span-6 flex flex-col justify-center gap-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#d4af37] block mb-1">
                  Technique & Materials
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl text-white font-light">
                  {activePillar.name}
                </h3>
                <p className="text-white/40 text-xs mt-1 font-mono tracking-wider">
                  {activePillar.materials}
                </p>
              </div>

              <p className="text-white/70 text-sm leading-relaxed font-light">
                {activePillar.description}
              </p>

              {/* 4 Highlight Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {activePillar.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0d0b09] border border-white/5 text-xs text-white/80"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.25em] font-bold text-[#d4af37] hover:text-white transition-colors group"
                >
                  <span>Explore All {activePillar.name} Pieces</span>
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1.5 transition-transform duration-300"
                  />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
