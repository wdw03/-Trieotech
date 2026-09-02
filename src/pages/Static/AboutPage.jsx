import React from 'react';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';
import { brands } from '../../data/brands';
import { Award, Heart, Sparkles, ShieldCheck, MapPin, Users, Flame } from 'lucide-react';

export const AboutPage = () => {
  const brand = brands[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-12">
      <SEO
        title="About Trio Ecart | Handcrafted Indian Artisan Guild"
        description="Learn about Trio Ecart's mission to preserve traditional Indian Zardosi embroidery, Ayurvedic copper vessels, and pooja crafts directly from master karigars."
      />

      <Breadcrumb items={[{ name: 'About Our Guild', url: '/about' }]} />

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden p-8 sm:p-14 bg-gradient-to-r from-maroon-950 via-maroon-900 to-[#1F0C0C] text-white border border-gold-500/30 shadow-2xl text-center space-y-4">
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-300 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold-400" /> Sacred Roots &amp; Generational Mastery
        </span>
        <h1 className="font-serif font-black text-3xl sm:text-5xl text-ivory-100 max-w-2xl mx-auto leading-tight">
          Handcrafted with Purity, Rooted in Indian Tradition
        </h1>
        <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed">
          Bridging the historic craft clusters of Jaipur, Surat, and Varanasi with patrons seeking authentic ethnic elegance.
        </p>
      </div>

      {/* Narrative Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
          <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-ivory-100">
            Our Artisan Collective Story
          </h2>
          <p>
            At <strong>Trio Ecart</strong>, we believe that true luxury lies in the human touch. Modern industrial machines can mass-produce plastic motifs, but they cannot replicate the soul, devotion, and ancestral wisdom woven into hand-drawn metallic Zari wires or hand-hammered copper vessels.
          </p>
          <p>
            Our artisan guild works directly with over 150 generational craftsmen across India. By eliminating multiple middlemen, we ensure our karigars receive fair, dignified livelihoods while our patrons receive authentic, museum-grade handicrafts at honest prices.
          </p>
        </div>

        <div className="aspect-[4/3] rounded-3xl overflow-hidden border-2 border-gold-500/30 shadow-xl bg-stone-900">
          <img
            src="/products/shreenathji-statement-patch-1.jpg"
            alt="Handcrafted Zardosi Patches"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Core Values 3-Col Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="ethnic-card p-6 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gold-500/20 text-gold-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-ivory-100">
            100% Genuine Handcraft
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            Every stitch of zari, cut of zarkan stone, and hammer blow on copper is performed manually by seasoned Indian karigars.
          </p>
        </div>

        <div className="ethnic-card p-6 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-maroon-700/20 text-maroon-700 flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-ivory-100">
            Fair Artisan Empowerment
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            We honor our master craftspeople with equitable compensation, sustainable work environments, and healthcare support.
          </p>
        </div>

        <div className="ethnic-card p-6 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700/20 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-ivory-100">
            Sacred Ritual Purity
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            Our pooja aasans, gamchas, and brass thalis are manufactured with devotion, clean energy, and sacred Vedic guidelines.
          </p>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="ethnic-card p-8 rounded-3xl bg-gradient-to-r from-ivory-100 via-white to-ivory-100 dark:from-[#1A110B] dark:via-[#140D08] dark:to-[#1A110B] border border-gold-500/30">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <span className="font-serif font-black text-3xl sm:text-4xl text-maroon-800 dark:text-gold-400">150+</span>
            <p className="text-xs text-stone-500 font-semibold uppercase">Master Karigars</p>
          </div>
          <div className="space-y-1">
            <span className="font-serif font-black text-3xl sm:text-4xl text-maroon-800 dark:text-gold-400">10,000+</span>
            <p className="text-xs text-stone-500 font-semibold uppercase">Pieces Handcrafted</p>
          </div>
          <div className="space-y-1">
            <span className="font-serif font-black text-3xl sm:text-4xl text-maroon-800 dark:text-gold-400">25,000+</span>
            <p className="text-xs text-stone-500 font-semibold uppercase">Happy Patrons</p>
          </div>
          <div className="space-y-1">
            <span className="font-serif font-black text-3xl sm:text-4xl text-maroon-800 dark:text-gold-400">15+</span>
            <p className="text-xs text-stone-500 font-semibold uppercase">Global Destinations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
