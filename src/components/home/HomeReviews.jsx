'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react';
import { SectionTitle, Reveal } from './SharedUI';

const reviews = [
  {
    id: 1,
    name: 'Radhika Singhania',
    city: 'Mumbai',
    badge: 'Verified Patron',
    rating: 5,
    title: 'The Zardosi Work Left Us Speechless',
    comment:
      'I ordered the handcrafted lotus applique patch for my bridal lehenga border. The depth of the dabka work and real seed pearl embroidery looks straight out of a royal museum. Immensely proud to wear authentic Indian handcraft.',
    product: 'Handcrafted Beaded Lotus Patch Set',
  },
  {
    id: 2,
    name: 'Dr. Anandvardhan Joshi',
    city: 'Pune',
    badge: 'Ayurvedic Practitioner',
    rating: 5,
    title: 'True Heavy-Gauge Elemental Copper',
    comment:
      'Finding genuine, non-toxic hammered copper without synthetic chemical varnishes inside is rare. Triotech copper bottles have a substantial weight and impart an unmistakably pure taste to water overnight. Highly recommended.',
    product: 'Pure Hand-hammered Tamra Jal Bottle',
  },
  {
    id: 3,
    name: 'Meenakshi Sundaram',
    city: 'Bengaluru',
    badge: 'Temple Sanctum Patron',
    rating: 5,
    title: 'Brought Divine Radiance to Our Mandir',
    comment:
      'The velvet chowki aasan with gold zari borders transformed our home sanctum for Diwali. The fabric is plush, the borders are stitched with utter devotion, and the packaging felt like receiving a royal gift.',
    product: 'Royal Red Velvet Mandir Aasan',
  },
  {
    id: 4,
    name: 'Kavita Chawla',
    city: 'New Delhi',
    badge: 'Verified Buyer',
    rating: 5,
    title: 'Unbelievable Detail on the Gajraj Patch',
    comment:
      'The elephant zari motif with rhinestone borders is spectacular. Every visitor to our festive pooja asked where we acquired such authentic artisan craft. Express delivery was seamless.',
    product: 'Elephant Gajraj Zari Patch',
  },
];

export default function HomeReviews() {
  const [activeIdx, setActiveIdx] = useState(0);

  const prevReview = () => {
    setActiveIdx((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };
  const nextReview = () => {
    setActiveIdx((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
  };

  // Autoplay reviews every 6s
  useEffect(() => {
    const timer = setInterval(nextReview, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative py-24 px-4 sm:px-8 md:px-12 bg-[#0a0807] overflow-hidden border-t border-[#d4af37]/15">
      <div className="relative max-w-[1400px] mx-auto">
        <SectionTitle
          subtitle="Patron Reflections"
          title="Voices of the Sanctum"
          description="Read heartfelt words from homes, temples, and connoisseurs who cherish our handcrafted creations."
        />

        {/* Reviews Carousel Card */}
        <Reveal delay={150}>
          <div className="relative max-w-4xl mx-auto bg-[#12100d] rounded-3xl p-8 sm:p-14 border border-[#d4af37]/25 shadow-[0_25px_80px_rgba(0,0,0,0.9)]">
            {/* Quote Icon */}
            <div className="absolute top-6 right-8 text-[#d4af37]/20 pointer-events-none">
              <Quote size={64} />
            </div>

            <div className="min-h-[220px] flex flex-col justify-between">
              <div>
                {/* 5 Stars */}
                <div className="flex items-center gap-1.5 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="fill-[#d4af37] text-[#d4af37]" />
                  ))}
                  <span className="ml-3 text-[10px] uppercase tracking-widest text-[#d4af37] font-bold">
                    {reviews[activeIdx].badge}
                  </span>
                </div>

                {/* Review Title */}
                <h4 className="font-serif text-2xl sm:text-3xl text-white font-normal mb-4">
                  &ldquo;{reviews[activeIdx].title}&rdquo;
                </h4>

                {/* Comment */}
                <p className="text-white/70 text-sm sm:text-base leading-relaxed font-light mb-8 italic">
                  {reviews[activeIdx].comment}
                </p>
              </div>

              {/* Author & Product Info */}
              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h5 className="text-white text-base font-medium">
                    {reviews[activeIdx].name}
                  </h5>
                  <p className="text-white/40 text-xs mt-0.5">
                    {reviews[activeIdx].city} &middot;{' '}
                    <span className="text-[#d4af37]">{reviews[activeIdx].product}</span>
                  </p>
                </div>

                {/* Arrows */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={prevReview}
                    aria-label="Previous Review"
                    className="w-10 h-10 rounded-full border border-[#d4af37]/40 bg-[#0d0b09] text-[#d4af37] flex items-center justify-center hover:bg-[#d4af37] hover:text-[#0d0b09] transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={nextReview}
                    aria-label="Next Review"
                    className="w-10 h-10 rounded-full border border-[#d4af37]/40 bg-[#0d0b09] text-[#d4af37] flex items-center justify-center hover:bg-[#d4af37] hover:text-[#0d0b09] transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {reviews.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  aria-label={`Go to review ${idx + 1}`}
                  className={`h-1.5 transition-all duration-400 rounded-full ${
                    idx === activeIdx ? 'w-8 bg-[#d4af37]' : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
