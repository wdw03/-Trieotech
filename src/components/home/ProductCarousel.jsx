'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../common/ProductCard';
import { ProductCarouselSkeleton } from '../common/LoadingSkeleton';

export const ProductCarousel = ({
  title,
  subtitle,
  badge = null,
  products = [],
  viewAllLink = "/shop",
  limit = 8,
  onQuickView = null,
  bgClass = "bg-transparent",
  isLoading = false,
  layout = "carousel"
}) => {
  if (isLoading) {
    return (
      <section className={`py-8 sm:py-12 ${bgClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductCarouselSkeleton count={4} />
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) return null;

  const displayProducts = products.slice(0, limit);
  const totalOriginal = displayProducts.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [visibleCount, setVisibleCount] = useState(4);
  const [isInView, setIsInView] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);

  const sectionRef = useRef(null);
  const resetTimeoutRef = useRef(null);

  // Drag & Touch tracking refs
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const touchPauseTimeoutRef = useRef(null);

  // Clean up timeouts on unmount
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

  // Responsive visible count
  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setVisibleCount(2);
      } else if (width < 1024) {
        setVisibleCount(3);
      } else {
        setVisibleCount(4);
      }
    };
    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  // Build cloned array for smooth infinite wrap-around sliding
  const bufferMultiplier = totalOriginal > 0 ? Math.max(3, Math.ceil((visibleCount * 3) / totalOriginal)) : 3;
  const displayItems = [];
  for (let i = 0; i < bufferMultiplier; i++) {
    displayItems.push(...displayProducts);
  }

  // Initialize index in the middle block
  useEffect(() => {
    if (totalOriginal > 0) {
      setIsTransitioning(false);
      setCurrentIndex(totalOriginal);
    }
  }, [totalOriginal]);

  // Slide navigation with strict index normalization & timeout fallback
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

  // Reset at loop boundaries seamlessly without transition (with bubbling filter)
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

  // Auto-scroll every 3.5 seconds - strictly frozen when hovering, dragging, or out of view
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
    // Maintain pause after touching so mobile users can view without jumping
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
      className={`py-10 sm:py-16 ${bgClass} relative overflow-hidden`}
      onMouseEnter={() => {
        setIsHovered(true);
        setIsPaused(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPaused(false);
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gold-500/20 pb-4">
          <div className="space-y-1 text-center sm:text-left">
            {badge && (
              <span className="text-xs font-bold uppercase tracking-wider text-gold-700 dark:text-gold-400 flex items-center justify-center sm:justify-start gap-1.5 font-inter">
                <Sparkles className="w-3.5 h-3.5 text-gold-600" /> {badge}
              </span>
            )}
            <h2 className="font-inter font-extrabold text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100 tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xl font-inter font-medium">
                {subtitle}
              </p>
            )}
          </div>

          {viewAllLink && (
            <div className="flex items-center justify-center sm:justify-end">
              <Link
                href={viewAllLink}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-maroon-700 dark:text-gold-400 hover:text-maroon-800 dark:hover:text-gold-300 uppercase tracking-wider group font-inter shrink-0"
              >
                <span>View All</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </div>

        {layout === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 pt-2">
            {displayProducts.map((product) => (
              <div
                key={product.id}
                className="transition-all duration-300 transform hover:scale-[1.02]"
              >
                <ProductCard
                  product={product}
                  onQuickView={onQuickView}
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Carousel Slider Track Container with Floating Controls & Drag/Swipe */}
            <div className="relative group/carousel">
              
              {/* Floating Left Button */}
              {totalOriginal > visibleCount && (
                <button
                  onClick={prevSlide}
                  onMouseEnter={() => {
                    setIsHovered(true);
                    setIsPaused(true);
                  }}
                  className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#1C120B]/90 text-gold-300 border border-gold-500/40 shadow-xl backdrop-blur-md flex items-center justify-center hover:bg-gold-500 hover:text-maroon-950 active:scale-90 transition-all opacity-80 group-hover/carousel:opacity-100 cursor-pointer"
                  aria-label="Previous products"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Floating Right Button */}
              {totalOriginal > visibleCount && (
                <button
                  onClick={nextSlide}
                  onMouseEnter={() => {
                    setIsHovered(true);
                    setIsPaused(true);
                  }}
                  className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#1C120B]/90 text-gold-300 border border-gold-500/40 shadow-xl backdrop-blur-md flex items-center justify-center hover:bg-gold-500 hover:text-maroon-950 active:scale-90 transition-all opacity-80 group-hover/carousel:opacity-100 cursor-pointer"
                  aria-label="Next products"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Swipeable Track with Real-Time Scaling */}
              <div
                className="relative overflow-hidden w-full select-none cursor-grab active:cursor-grabbing touch-pan-y py-2"
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
                  className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-out' : 'transition-none'}`}
                  style={{
                    transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
                  }}
                  onTransitionEnd={handleTransitionEnd}
                >
                  {displayItems.map((product, idx) => (
                    <div
                      key={`${product.id}-${idx}`}
                      className="shrink-0 px-1.5 sm:px-2.5 transition-all duration-300 transform hover:scale-[1.02]"
                      style={{ width: `${100 / visibleCount}%` }}
                      onMouseEnter={() => {
                        setIsHovered(true);
                        setIsPaused(true);
                      }}
                    >
                      <ProductCard
                        product={product}
                        onQuickView={onQuickView}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic Pagination Dots */}
            {totalOriginal > visibleCount && (
              <div className="flex items-center justify-center gap-2 pt-1">
                {displayProducts.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => goToSlide(dotIdx)}
                    className={`transition-all duration-300 rounded-full h-1.5 sm:h-2 ${
                      activeDotIndex === dotIdx
                        ? 'w-6 sm:w-8 bg-gradient-to-r from-maroon-700 via-gold-500 to-maroon-700 shadow-gold-sm'
                        : 'w-1.5 sm:w-2 bg-stone-300 dark:bg-stone-700 hover:bg-gold-500/50 cursor-pointer'
                    }`}
                    aria-label={`Go to product slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </section>
  );
};

export default ProductCarousel;
