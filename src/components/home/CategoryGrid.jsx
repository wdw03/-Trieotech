'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { categories as fallbackCategories } from '../../data/categories';
import { fetchLiveCategories } from '../../lib/api/store';
import { ArrowRight, Sparkles, ChevronRight } from 'lucide-react';

export const CategoryGrid = () => {
  const [categoriesList, setCategoriesList] = useState(fallbackCategories);

  useEffect(() => {
    let isMounted = true;
    fetchLiveCategories()
      .then((cats) => {
        if (isMounted && Array.isArray(cats) && cats.length > 0) {
          setCategoriesList(cats);
        }
      })
      .catch((err) => console.warn('Categories live fetch notice:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Split: first 2 categories are "featured" (large), rest are standard
  const featured = categoriesList.slice(0, 2);
  const standard = categoriesList.slice(2);

  return (
    <section className="py-14 sm:py-20 bg-ivory-100 dark:bg-ethnic-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold-700 dark:text-gold-400 flex items-center gap-2">
              <span className="w-8 h-px bg-gold-500" />
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              Handcrafted Heritage
              <span className="w-8 h-px bg-gold-500" />
            </span>
            <h2 className="font-serif font-black text-3xl sm:text-4xl text-stone-900 dark:text-ivory-100 leading-tight">
              Browse by Craft Category
            </h2>
            <p className="text-sm text-stone-500 dark:text-ethnic-muted max-w-md">
              Explore our curated collection of handmade Indian crafts, each category celebrating a unique art form.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-bold text-maroon-700 dark:text-gold-400 hover:text-maroon-800 dark:hover:text-gold-300 uppercase tracking-wider group shrink-0 bg-maroon-50 dark:bg-gold-500/10 px-4 py-2.5 rounded-full border border-maroon-200 dark:border-gold-500/30 hover:shadow-gold-sm transition-all"
          >
            <span>Explore All Collections</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Featured Categories (Top 2 — large hero-style) */}
        {featured.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {featured.map((category) => (
              <Link
                key={category.id || category.slug}
                href={`/category/${category.slug}`}
                className="group relative rounded-3xl overflow-hidden border border-gold-500/20 hover:border-gold-500/50 shadow-ethnic hover:shadow-ethnic-hover flex flex-col justify-end aspect-[4/3] sm:aspect-[16/10] transition-all duration-500 transform hover:-translate-y-1.5"
              >
                {/* Image */}
                <img
                  src={category.image || '/products/pearl-zardosi-patch-1.jpg'}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                  loading="lazy"
                />

                {/* Premium multi-layer gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/5 group-hover:from-black/98 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent opacity-60" />

                {/* Decorative corner shimmer */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* Content */}
                <div className="relative z-10 p-5 sm:p-7 flex flex-col justify-end">
                  {/* Top badge row */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gold-300 bg-black/50 backdrop-blur-xl px-3 py-1 rounded-full border border-gold-500/30">
                      {category.productCount || 0} Items
                    </span>
                    {category.subcategories && category.subcategories.length > 0 && (
                      <span className="text-[10px] font-semibold text-white/70 bg-white/10 backdrop-blur-xl px-2.5 py-1 rounded-full border border-white/10 hidden sm:inline-flex">
                        {category.subcategories.length} Subcategories
                      </span>
                    )}
                  </div>

                  {/* Name & Description */}
                  <h3 className="font-serif font-black text-xl sm:text-2xl text-white group-hover:text-gold-300 transition-colors duration-300 leading-tight mb-1.5">
                    {category.name}
                  </h3>

                  {category.description && (
                    <p className="text-xs sm:text-sm text-stone-300/90 line-clamp-2 leading-relaxed mb-3.5 max-w-md">
                      {category.description}
                    </p>
                  )}

                  {/* Explore CTA */}
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-300 group-hover:text-gold-200 uppercase tracking-wider transition-colors">
                      Explore Collection
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Standard Category Cards Grid */}
        {standard.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {standard.map((category, idx) => (
              <Link
                key={category.id || category.slug}
                href={`/category/${category.slug}`}
                className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-gold-500/15 hover:border-gold-500/50 shadow-ethnic hover:shadow-ethnic-hover flex flex-col justify-end aspect-[3/4] sm:aspect-[3/3.8] transition-all duration-500 transform hover:-translate-y-1.5"
                style={{
                  animationDelay: `${idx * 60}ms`
                }}
              >
                {/* Image */}
                <img
                  src={category.image || '/products/pearl-zardosi-patch-1.jpg'}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                  loading="lazy"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent group-hover:from-black/95 transition-all duration-500" />

                {/* Subtle gold accent line at top */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Content */}
                <div className="relative z-10 p-3.5 sm:p-4 flex flex-col justify-end">
                  {/* Item count badge */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gold-400 bg-black/50 backdrop-blur-xl px-2 sm:px-2.5 py-0.5 rounded-full border border-gold-500/25">
                      {category.productCount || 0} Items
                    </span>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gold-500/15 text-gold-300 flex items-center justify-center group-hover:bg-gold-500 group-hover:text-maroon-950 transition-all duration-300 group-hover:scale-110 border border-gold-500/20 group-hover:border-gold-400">
                      <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="font-serif font-bold text-sm sm:text-base text-white group-hover:text-gold-300 transition-colors duration-300 leading-snug">
                    {category.name}
                  </h3>

                  {/* Short description - only on sm+ */}
                  {category.description && (
                    <p className="text-[10px] sm:text-[11px] text-stone-400 line-clamp-1 mt-0.5 leading-snug hidden sm:block">
                      {category.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default CategoryGrid;
