'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { blogs as fallbackBlogs } from '../../data/blogs';
import { fetchLiveBlogs } from '../../lib/api/store';
import { Sparkles, ArrowRight, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export const BlogPreview = () => {
  const [blogsList, setBlogsList] = useState(fallbackBlogs);
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

  // Fetch live blogs from CMS / Supabase
  useEffect(() => {
    let isMounted = true;
    fetchLiveBlogs()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setBlogsList(data);
        }
      })
      .catch((err) => console.warn('Blogs live fetch notice:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  const totalOriginal = blogsList.length;

  // Build cloned array for true infinite wrap-around sliding
  const bufferMultiplier = totalOriginal > 0 ? Math.max(3, Math.ceil(9 / totalOriginal)) : 3;
  const displayItems = [];
  for (let i = 0; i < bufferMultiplier; i++) {
    displayItems.push(...blogsList);
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
      className="py-12 sm:py-16 bg-ivory-200/50 dark:bg-[#160E08]/50 border-t border-gold-500/20 relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Header with Title & Navigation Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gold-500/20 pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-400 flex items-center gap-1.5 font-inter">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" /> Artisan Dispatch
            </span>
            <h2 className="font-inter font-extrabold text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100 tracking-tight">
              Craft Journal &amp; DIY Guides
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-inter font-medium">
              Deep dives into ancient textile histories, Ayurvedic rituals, and festive styling ideas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Left / Right Carousel Arrow Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevSlide}
                className="w-9 h-9 rounded-full bg-white dark:bg-[#1F130B] border border-gold-500/30 text-stone-800 dark:text-gold-300 hover:bg-gold-500 hover:text-maroon-950 dark:hover:bg-gold-500 dark:hover:text-maroon-950 flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
                aria-label="Previous article slide"
                title="Previous articles"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                className="w-9 h-9 rounded-full bg-white dark:bg-[#1F130B] border border-gold-500/30 text-stone-800 dark:text-gold-300 hover:bg-gold-500 hover:text-maroon-950 dark:hover:bg-gold-500 dark:hover:text-maroon-950 flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
                aria-label="Next article slide"
                title="Next articles"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="h-4 w-px bg-gold-500/30 hidden sm:block" />

            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-maroon-700 dark:text-gold-400 hover:text-maroon-800 dark:hover:text-gold-300 uppercase tracking-wider group font-inter"
            >
              <span>Read All</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
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
            {displayItems.map((blog, idx) => (
              <div
                key={`${blog.id || blog.slug}-${idx}`}
                className="shrink-0 px-2.5 sm:px-3"
                style={{ width: `${100 / visibleCount}%` }}
              >
                <Link
                  href={`/blog/${blog.slug}`}
                  className="ethnic-card rounded-3xl overflow-hidden group flex flex-col justify-between hover:border-gold-500/60 transition-all duration-300 transform hover:-translate-y-1.5 h-full bg-white dark:bg-[#1A1009] border border-gold-500/25 shadow-md"
                >
                  {/* Blog Image */}
                  <div className="aspect-[16/10] w-full overflow-hidden bg-stone-100 dark:bg-stone-900 relative">
                    <img
                      src={blog.image || '/products/peacock-real-feathers-pair-1.jpg'}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-3 left-3 bg-maroon-900/90 text-gold-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-gold-500/30 backdrop-blur-sm">
                      {blog.category}
                    </div>
                  </div>

                  {/* Blog Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3 font-inter">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gold-500" /> {blog.readTime || blog.read_time || '5 min read'}
                        </span>
                        <span>•</span>
                        <span>{blog.date}</span>
                      </div>

                      <h3 className="font-inter font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-maroon-700 dark:group-hover:text-gold-400 transition-colors leading-snug line-clamp-2">
                        {blog.title}
                      </h3>

                      <p className="font-inter font-medium text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {blog.excerpt}
                      </p>
                    </div>

                    {/* Author Info */}
                    <div className="pt-3 border-t border-gold-500/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={blog.authorImage || blog.author_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                          alt={blog.author || 'Trio Author'}
                          className="w-6 h-6 rounded-full object-cover border border-gold-500/30"
                        />
                        <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
                          {blog.author || 'Trio Editorial'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-maroon-700 dark:text-gold-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 shrink-0">
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Pagination Dots (Auto 3s Indicator) */}
        {totalOriginal > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            {blogsList.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => goToSlide(dotIdx)}
                className={`transition-all duration-300 rounded-full h-2 ${
                  activeDotIndex === dotIdx
                    ? 'w-7 bg-gradient-to-r from-maroon-700 via-gold-500 to-maroon-700 shadow-gold-sm'
                    : 'w-2 bg-stone-300 dark:bg-stone-700 hover:bg-gold-500/50'
                }`}
                aria-label={`Go to slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default BlogPreview;
