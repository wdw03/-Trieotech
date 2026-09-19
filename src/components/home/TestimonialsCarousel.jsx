'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { reviews as fallbackReviews } from '../../data/reviews';
import { Sparkles, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import RatingStars from '../common/RatingStars';
import { getApiBase } from '../../lib/api/store';
import AmazonMarketplaceBanner from './AmazonMarketplaceBanner';

export const TestimonialsCarousel = () => {
  const [reviewsList, setReviewsList] = useState(fallbackReviews);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);
  const [isInView, setIsInView] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);

  const sectionRef = useRef(null);
  const resetTimeoutRef = useRef(null);
  
  // Drag & Touch tracking refs
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const touchPauseTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (touchPauseTimeoutRef.current) clearTimeout(touchPauseTimeoutRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  // IntersectionObserver to only auto-scroll when section is in viewport
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Page visibility listener: pause when browser tab is inactive/minimized
  useEffect(() => {
    const handleVisibility = () => {
      setIsDocumentVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

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
  const bufferMultiplier = totalOriginal > 0 ? Math.max(3, Math.ceil((visibleCount * 3) / totalOriginal)) : 3;
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

  // Next slide handler with strict index normalization & timeout fallback
  const nextSlide = useCallback(() => {
    if (totalOriginal <= visibleCount) return;
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    setIsTransitioning(true);

    setCurrentIndex((prev) => {
      let base = prev;
      if (base >= 2 * totalOriginal) {
        base = totalOriginal + ((base - 2 * totalOriginal) % totalOriginal);
      }
      const next = base + 1;

      if (next >= 2 * totalOriginal) {
        resetTimeoutRef.current = setTimeout(() => {
          setIsTransitioning(false);
          setCurrentIndex((idx) => (idx >= 2 * totalOriginal ? totalOriginal + ((idx - 2 * totalOriginal) % totalOriginal) : idx));
        }, 520);
      }

      return next;
    });
  }, [totalOriginal, visibleCount]);

  // Prev slide handler with strict index normalization & timeout fallback
  const prevSlide = useCallback(() => {
    if (totalOriginal <= visibleCount) return;
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    setIsTransitioning(true);

    setCurrentIndex((prev) => {
      let base = prev;
      if (base < totalOriginal) {
        base = totalOriginal + (base % totalOriginal);
      }
      const next = base - 1;

      if (next < totalOriginal) {
        resetTimeoutRef.current = setTimeout(() => {
          setIsTransitioning(false);
          setCurrentIndex((idx) => (idx < totalOriginal ? totalOriginal + (idx % totalOriginal) : idx));
        }, 520);
      }

      return next;
    });
  }, [totalOriginal, visibleCount]);

  // Seamlessly re-arm transitions after instant snap
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  // Infinite loop boundary reset on transition end (with bubbling filter)
  const handleTransitionEnd = (e) => {
    if (e && e.target !== e.currentTarget) return;
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);

    if (totalOriginal <= 0) return;
    if (currentIndex >= 2 * totalOriginal) {
      setIsTransitioning(false);
      setCurrentIndex((prev) => (prev >= 2 * totalOriginal ? totalOriginal + ((prev - 2 * totalOriginal) % totalOriginal) : prev));
    } else if (currentIndex < totalOriginal) {
      setIsTransitioning(false);
      setCurrentIndex((prev) => (prev < totalOriginal ? totalOriginal + (prev % totalOriginal) : prev));
    }
  };

  // Auto-scroll every 3.5s - runs ONLY when visible on screen and not backgrounded
  useEffect(() => {
    if (isHovered || isPaused || !isInView || !isDocumentVisible || totalOriginal <= visibleCount) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 3500);
    return () => clearInterval(interval);
  }, [isHovered, isPaused, isInView, isDocumentVisible, nextSlide, totalOriginal, visibleCount]);

  // Touch handlers (Mobile swipe)
  const handleTouchStart = (e) => {
    if (touchPauseTimeoutRef.current) clearTimeout(touchPauseTimeoutRef.current);
    setIsPaused(true);
    isDraggingRef.current = true;
    dragStartXRef.current = e.touches[0].clientX;
    dragDistanceRef.current = 0;
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    dragDistanceRef.current = e.touches[0].clientX - dragStartXRef.current;
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (dragDistanceRef.current < -35) {
      nextSlide();
    } else if (dragDistanceRef.current > 35) {
      prevSlide();
    }
    if (touchPauseTimeoutRef.current) clearTimeout(touchPauseTimeoutRef.current);
    touchPauseTimeoutRef.current = setTimeout(() => {
      if (!isHovered) {
        setIsPaused(false);
      }
    }, 4500);
  };

  // Mouse drag handlers (Desktop click-and-drag swipe)
  const handleMouseDown = (e) => {
    setIsPaused(true);
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    dragDistanceRef.current = e.clientX - dragStartXRef.current;
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (!isHovered) {
      setIsPaused(false);
    }
    if (dragDistanceRef.current < -35) {
      nextSlide();
    } else if (dragDistanceRef.current > 35) {
      prevSlide();
    }
  };

  const handleMouseLeave = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      if (dragDistanceRef.current < -35) {
        nextSlide();
      } else if (dragDistanceRef.current > 35) {
        prevSlide();
      }
    }
  };

  // Active original item index for dots pagination
  const activeDotIndex = totalOriginal > 0 ? ((currentIndex % totalOriginal) + totalOriginal) % totalOriginal : 0;

  const goToSlide = (dotIdx) => {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    setIsTransitioning(true);
    setCurrentIndex(totalOriginal + dotIdx);
  };

  return (
    <section
      ref={sectionRef}
      className="py-12 sm:py-16 bg-ivory-100 dark:bg-ethnic-dark relative overflow-hidden"
      onMouseEnter={() => {
        setIsHovered(true);
        setIsPaused(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPaused(false);
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-10">
        
        {/* Official Amazon Store Banner */}
        <AmazonMarketplaceBanner />

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 border-b border-gold-500/20 pb-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-400 flex items-center justify-center gap-1.5 font-inter">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" /> Verified Patron Feedback
          </span>
          <h2 className="font-inter font-extrabold text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100 tracking-tight">
            Loved by Couturiers, Decorators &amp; Devotees
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-inter font-medium">
            Real experiences from authentic patrons celebrating weddings, daily pooja rituals, and bespoke bridal fashion. Swipe left or right to explore.
          </p>
        </div>

        {/* Carousel Slider Track Container with Floating Controls & Drag/Swipe */}
        <div className="relative group/carousel">
          
          {/* Floating Left Button (Visible on hover / mobile if multiple slides) */}
          {totalOriginal > visibleCount && (
            <button
              onClick={prevSlide}
              onMouseEnter={() => {
                setIsHovered(true);
                setIsPaused(true);
              }}
              className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#1C120B]/90 text-gold-300 border border-gold-500/40 shadow-xl backdrop-blur-md flex items-center justify-center hover:bg-gold-500 hover:text-maroon-950 active:scale-90 transition-all opacity-80 group-hover/carousel:opacity-100 cursor-pointer"
              aria-label="Swipe left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Floating Right Button (Visible on hover / mobile if multiple slides) */}
          {totalOriginal > visibleCount && (
            <button
              onClick={nextSlide}
              onMouseEnter={() => {
                setIsHovered(true);
                setIsPaused(true);
              }}
              className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#1C120B]/90 text-gold-300 border border-gold-500/40 shadow-xl backdrop-blur-md flex items-center justify-center hover:bg-gold-500 hover:text-maroon-950 active:scale-90 transition-all opacity-80 group-hover/carousel:opacity-100 cursor-pointer"
              aria-label="Swipe right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Swipeable Track */}
          <div
            className="relative overflow-hidden w-full select-none cursor-grab active:cursor-grabbing touch-pan-y"
            onMouseEnter={() => {
              setIsHovered(true);
              setIsPaused(true);
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
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
                  onMouseEnter={() => {
                    setIsHovered(true);
                    setIsPaused(true);
                  }}
                >
                  <div className="ethnic-card p-6 rounded-3xl border border-gold-500/30 flex flex-col justify-between space-y-4 hover:border-gold-500/60 shadow-lg relative group h-full bg-white dark:bg-[#1A1009] transition-all duration-300">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <RatingStars rating={rev.rating} size="sm" />
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-inter">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified Buyer
                        </span>
                      </div>

                      <h3 className="font-inter font-bold text-sm text-stone-900 dark:text-ivory-100 leading-snug">
                        "{rev.title}"
                      </h3>

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
                        <p className="font-bold text-xs text-stone-900 dark:text-ivory-100 truncate">
                          {rev.user}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{rev.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                    : 'w-2 bg-stone-300 dark:bg-stone-700 hover:bg-gold-500/50 cursor-pointer'
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
