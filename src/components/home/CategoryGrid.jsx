import React from 'react';
import { Link } from 'react-router-dom';
import { categories } from '../../data/categories';
import { ArrowRight, Sparkles } from 'lucide-react';

export const CategoryGrid = () => {
  return (
    <section className="py-12 sm:py-16 bg-ivory-100 dark:bg-ethnic-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gold-500/20 pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" /> Handcrafted Heritage
            </span>
            <h2 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100">
              Browse by Craft Category
            </h2>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-maroon-700 dark:text-gold-400 hover:text-maroon-800 dark:hover:text-gold-300 uppercase tracking-wider group"
          >
            <span>Explore All 43+ Crafts</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className="group relative rounded-3xl overflow-hidden ethnic-card border border-gold-500/20 hover:border-gold-500/50 shadow-ethnic hover:shadow-ethnic-hover flex flex-col justify-end aspect-[4/3.8] transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Image Background */}
              <img
                src={category.image}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />

              {/* Dark Gradient Overlay for Legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95 transition-all duration-300" />

              {/* Content Box */}
              <div className="relative z-10 p-4 sm:p-5 flex flex-col justify-end">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gold-400 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-gold-500/30">
                    {category.productCount} Items
                  </span>
                  <div className="w-7 h-7 rounded-full bg-gold-500/20 text-gold-300 flex items-center justify-center group-hover:bg-gold-500 group-hover:text-maroon-950 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <h3 className="font-serif font-bold text-base sm:text-lg text-white group-hover:text-gold-300 transition-colors leading-snug">
                  {category.name}
                </h3>
                
                <p className="text-[11px] text-stone-300 line-clamp-1 mt-0.5 font-normal">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};

export default CategoryGrid;
