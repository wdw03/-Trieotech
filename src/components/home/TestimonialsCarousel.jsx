import React from 'react';
import { reviews } from '../../data/reviews';
import { Sparkles, Quote, CheckCircle2 } from 'lucide-react';
import RatingStars from '../common/RatingStars';

export const TestimonialsCarousel = () => {
  return (
    <section className="py-12 sm:py-16 bg-ivory-100 dark:bg-ethnic-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" /> Verified Patron Feedback
          </span>
          <h2 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100">
            Loved by Couturiers, Decorators &amp; Devotees
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            Real experiences from authentic patrons celebrating weddings, daily pooja rituals, and bespoke bridal fashion.
          </p>
        </div>

        {/* Testimonial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.slice(0, 3).map((rev) => (
            <div
              key={rev.id}
              className="ethnic-card p-6 rounded-3xl border border-gold-500/30 flex flex-col justify-between space-y-4 hover:border-gold-500/60 shadow-lg relative group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <RatingStars rating={rev.rating} size="sm" />
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified Buyer
                  </span>
                </div>

                <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-ivory-100 leading-snug">
                  "{rev.title}"
                </h4>

                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-3 border-t border-gold-500/20">
                <img
                  src={rev.avatar}
                  alt={rev.user}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gold-500/40 shrink-0"
                />
                <div className="min-w-0">
                  <h5 className="font-serif font-bold text-xs text-stone-900 dark:text-ivory-100 truncate">
                    {rev.user}
                  </h5>
                  <p className="text-[10px] text-stone-400">{rev.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default TestimonialsCarousel;
