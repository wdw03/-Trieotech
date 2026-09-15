'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Crown } from 'lucide-react';
import { Reveal } from './SharedUI';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <section className="relative py-24 px-4 sm:px-8 md:px-12 bg-[#0d0b09] overflow-hidden border-t border-[#d4af37]/15">
      {/* Background radial gold glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-[#d4af37]/[0.04] blur-[150px]" />

      <div className="relative max-w-4xl mx-auto text-center">
        <Reveal>
          <div className="rounded-[2.5rem] bg-gradient-to-b from-[#161310] to-[#0f0d0b] border border-[#d4af37]/30 p-8 sm:p-14 md:p-16 shadow-[0_30px_90px_rgba(0,0,0,0.9)] relative overflow-hidden">
            {/* Top Crown Icon */}
            <div className="w-14 h-14 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] mx-auto mb-6 shadow-lg">
              <Crown size={26} className="animate-pulse" />
            </div>

            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] text-[#d4af37] mb-3 flex items-center justify-center gap-3">
              <span className="w-8 h-px bg-[#d4af37]/50" />
              <span>Privileged Access</span>
              <span className="w-8 h-px bg-[#d4af37]/50" />
            </p>

            <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl text-white uppercase tracking-wider font-light mb-5">
              Join The <span className="italic craft-gold-text">Royal Circle</span>
            </h2>

            <p className="text-white/60 text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light mb-8">
              Be the first to receive invitations to private heirloom releases, seasonal festive
              discounts, and chronicles directly from our master artisan ateliers.
            </p>

            {subscribed ? (
              <div className="inline-flex items-center gap-3 bg-[#1f6f50]/20 border border-[#1f6f50]/60 text-[#a3e635] px-6 py-4 rounded-2xl">
                <CheckCircle2 size={20} />
                <span className="text-sm font-medium">
                  Welcome to the Royal Circle. Your private access code has been dispatched.
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 items-center"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  required
                  className="w-full px-5 py-4 rounded-full bg-[#0d0b09] border border-[#d4af37]/40 text-white placeholder:text-white/30 text-xs sm:text-sm focus:outline-none focus:border-[#d4af37] shadow-inner transition-colors"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#f5e6b8] text-[#0d0b09] text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-400 hover:shadow-[0_10px_30px_rgba(212,175,55,0.4)] active:scale-95"
                >
                  <span>Subscribe</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            )}

            <p className="text-white/30 text-[10px] uppercase tracking-widest mt-6">
              Zero spam &middot; Unsubscribe at any moment &middot; Strictly sacred & artisanal
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
