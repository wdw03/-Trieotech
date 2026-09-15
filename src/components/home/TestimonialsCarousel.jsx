'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { reviews as fallbackReviews } from '../../data/reviews';
import { Sparkles, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import RatingStars from '../common/RatingStars';
import { getApiBase } from '../../lib/api/store';

export const TestimonialsCarousel = () => {
  const [reviewsList, setReviewsList] = useState(fallbackReviews);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  // Responsive visible card count detection
  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth < 768) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };
    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  // Fetch live reviews from API
  useEffect(() => {
    let isMounted = true;
    const apiBase = getApiBase();
    fetch(`${apiBase}/reviews`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && Array.isArray(data?.reviews) && data.reviews.length > 0) {
          const mapped = data.reviews.map((r) => ({
            id: r.id,
            user: r.user_name || r.user || 'Verified Patron',
            avatar: r.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
            location: r.location || 'India',
            rating: Number(r.rating) || 5,
            title: r.title || 'Exceptional Craftsmanship',
            comment: r.comment || '',
            date: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent',
          }));
          setReviewsList(mapped);
        }
      })
      .catch((err) => console.warn('Reviews live fetch notice:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  const totalOriginal = reviewsList.length;

  // Build cloned array for true infinite wrap-around sliding
  const bufferMultiplier = totalOriginal > 0 ? Math.max(3, Math.ceil(9 / totalOriginal)) : 3;
  const displayItems = [];
  for (let i = 0; i < bufferMultiplier; i++) {
    displayItems.push(...reviewsList);
  }

  // Initialize currentIndex to start at the first duplicate block
  useEffect(() => {
    if (totalOriginal > 0) {
      setIsTransitioning(false);
      setCurrentIndex(totalOriginal);
    }
  }, [totalOriginal]);

  // Next slide handler
  const nextSlide = useCallback(() => {
    if (totalOriginal <= 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, [totalOriginal]);

  // Prev slide handler
  const prevSlide = useCallback(() => {
    if (totalOriginal <= 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, [totalOriginal]);

  // Infinite loop boundary reset on transition end
  const handleTransitionEnd = () => {
    if (totalOriginal <= 0) return;
    if (currentIndex >= 2 * totalOriginal) {
      setIsTransitioning(false);
      setCurrentIndex((prev) => prev - totalOriginal);
    } else if (currentIndex < totalOriginal) {
      setIsTransitioning(false);
      setCurrentIndex((prev) => prev + totalOriginal);
    }
  };

  // Auto-scroll every 3 seconds (3000ms) with hover pause
  useEffect(() => {
    if (isPaused || totalOriginal <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, totalOriginal]);

  // Touch gesture swipe support
  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
  };

  // Active original item index for dots pagination
  const activeDotIndex = totalOriginal > 0 ? ((currentIndex % totalOriginal) + totalOriginal) % totalOriginal : 0;

  const goToSlide = (dotIdx) => {
    setIsTransitioning(true);
    const currentBase = Math.floor(currentIndex / totalOriginal) * totalOriginal;
    setCurrentIndex(currentBase + dotIdx);
  };

  return (
    <section
      className="py-12 sm:py-16 bg-ivory-100 dark:bg-ethnic-dark relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-10">
        
        {/* Header with Title & Navigation Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gold-500/20 pb-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-400 flex items-center justify-center sm:justify-start gap-1.5 font-inter">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" /> Verified Patron Feedback
            </span>
            <h2 className="font-inter font-extrabold text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100 tracking-tight">
              Loved by Couturiers, Decorators &amp; Devotees
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-inter font-medium">
              Real experiences from authentic patrons celebrating weddings, daily pooja rituals, and bespoke bridal fashion.
            </p>
          </div>

          {/* Left / Right Carousel Arrow Buttons */}
          <div className="flex items-center justify-center sm:justify-end gap-2">
            <button
              onClick={prevSlide}
              className="w-9 h-9 rounded-full bg-white dark:bg-[#1F130B] border border-gold-500/30 text-stone-800 dark:text-gold-300 hover:bg-gold-500 hover:text-maroon-950 dark:hover:bg-gold-500 dark:hover:text-maroon-950 flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
              aria-label="Previous review slide"
              title="Previous reviews"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              className="w-9 h-9 rounded-full bg-white dark:bg-[#1F130B] border border-gold-500/30 text-stone-800 dark:text-gold-300 hover:bg-gold-500 hover:text-maroon-950 dark:hover:bg-gold-500 dark:hover:text-maroon-950 flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
              aria-label="Next review slide"
              title="Next reviews"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Slider Track Container */}
        <div
          className="relative overflow-hidden w-full select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : 'transition-none'}`}
            style={{
              transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {displayItems.map((rev, idx) => (
              <div
                key={`${rev.id}-${idx}`}
                className="shrink-0 px-2.5 sm:px-3"
                style={{ width: `${100 / visibleCount}%` }}
              >
                <div className="ethnic-card p-6 rounded-3xl border border-gold-500/30 flex flex-col justify-between space-y-4 hover:border-gold-500/60 shadow-lg relative group h-full bg-white dark:bg-[#1A1009]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <RatingStars rating={rev.rating} size="sm" />
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-inter">
                        <CheckCircle2 className="w-3 h-3" /> Verified Buyer
                      </span>
                    </div>

                    <h4 className="font-inter font-bold text-sm text-stone-900 dark:text-ivory-100 leading-snug">
                      "{rev.title}"
                    </h4>

                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed italic font-inter font-medium line-clamp-4">
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
                    <div className="min-w-0 font-inter">
                      <h5 className="font-bold text-xs text-stone-900 dark:text-ivory-100 truncate">
                        {rev.user}
                      </h5>
                      <p className="text-[10px] text-stone-400">{rev.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Pagination Dots (Auto 3s Indicator) */}
        {totalOriginal > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            {reviewsList.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => goToSlide(dotIdx)}
                className={`transition-all duration-300 rounded-full h-2 ${
                  activeDotIndex === dotIdx
                    ? 'w-7 bg-gradient-to-r from-maroon-700 via-gold-500 to-maroon-700 shadow-gold-sm'
                    : 'w-2 bg-stone-300 dark:bg-stone-700 hover:bg-gold-500/50'
                }`}
                aria-label={`Go to review slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default TestimonialsCarousel;
