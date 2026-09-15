'use client';

import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, Heart, Award, ArrowUpRight } from 'lucide-react';
import { SectionTitle, Reveal } from './SharedUI';

const steps = [
  {
    num: '01',
    title: 'Pure Elemental Sourcing',
    desc: 'Only virgin heavy-gauge copper and natural metallic dabka threads are selected. No recycled alloys or synthetic fillers.',
    badge: 'Raw Purity',
  },
  {
    num: '02',
    title: 'Sacred Stenciling',
    desc: 'Ancestral floral motifs, peacock plumes, and Vedic geometry are hand-traced directly onto heavy velvet or copper sheets.',
    badge: 'Karchob Art',
  },
  {
    num: '03',
    title: 'Artisan Metamorphosis',
    desc: 'Over 140 hours of patient micro-needlework and hand-hammering by third-generation master karigars.',
    badge: '140+ Hours',
  },
  {
    num: '04',
    title: 'Sanctum Consecration',
    desc: 'Each finished creation is inspected for flawless sanctity, polished with natural oils, and sealed in royal packaging.',
    badge: 'Pure Heritage',
  },
];

const stats = [
  { value: '100%', label: 'Handcrafted Heritage', sub: 'No machine replicas' },
  { value: '140+', label: 'Artisan Loom Hours', sub: 'Per signature piece' },
  { value: '4.9/5', label: 'Patron Satisfaction', sub: 'Over 10,000+ homes' },
  { value: 'Direct', label: 'Artisan Patronage', sub: 'Fair wages directly to karigars' },
];

export default function TheMaking() {
  return (
    <section className="relative py-24 px-4 sm:px-8 md:px-12 bg-[#0d0b09] overflow-hidden border-t border-[#d4af37]/15">
      <div className="relative max-w-[1400px] mx-auto">
        <SectionTitle
          subtitle="Generational Atelier"
          title="The Making of an Heirloom"
          description="A sacred journey from raw elemental purity to divine adornment in your sacred space."
        />

        {/* 4 Steps Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((s, idx) => (
            <Reveal key={s.num} delay={idx * 100}>
              <div className="relative h-full bg-[#12100d] rounded-2xl p-7 border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all duration-500 hover:shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col justify-between group">
                {/* Step Number Top */}
                <div className="flex items-center justify-between mb-6">
                  <span
                    className="font-serif text-4xl text-transparent font-bold"
                    style={{ WebkitTextStroke: '1px rgba(212,175,55,0.45)' }}
                  >
                    {s.num}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#d4af37] bg-[#d4af37]/10 border border-[#d4af37]/30 px-2.5 py-1 rounded-full">
                    {s.badge}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-2.5 flex-1">
                  <h4 className="font-serif text-xl text-white font-light group-hover:text-[#f5e6b8] transition-colors">
                    {s.title}
                  </h4>
                  <p className="text-white/60 text-xs leading-relaxed font-light">
                    {s.desc}
                  </p>
                </div>

                {/* Bottom line glow */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[#d4af37] text-[10px] uppercase tracking-wider font-semibold">
                  <span>Stage {idx + 1}</span>
                  <Sparkles size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Stats Strip */}
        <Reveal delay={200}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-8 sm:p-10 rounded-2xl bg-gradient-to-r from-[#12100d] via-[#161310] to-[#12100d] border border-[#d4af37]/25 shadow-2xl">
            {stats.map((st, i) => (
              <div key={i} className="text-center flex flex-col items-center">
                <span className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#f5e6b8] font-light block mb-1">
                  {st.value}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-white tracking-wide block">
                  {st.label}
                </span>
                <span className="text-[10px] text-white/40 tracking-wider font-light mt-0.5 block">
                  {st.sub}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
