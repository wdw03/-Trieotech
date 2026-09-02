import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import ProductCard from '../common/ProductCard';

export const ProductCarousel = ({
  title,
  subtitle,
  badge = null,
  products = [],
  viewAllLink = "/shop",
  limit = 4,
  onQuickView = null,
  bgClass = "bg-transparent"
}) => {
  if (!products || products.length === 0) return null;

  const displayProducts = products.slice(0, limit);

  return (
    <section className={`py-12 sm:py-16 ${bgClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gold-500/20 pb-4">
          <div className="space-y-1">
            {badge && (
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-700 dark:text-gold-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold-600" /> {badge}
              </span>
            )}
            <h2 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xl">
                {subtitle}
              </p>
            )}
          </div>

          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-maroon-700 dark:text-gold-400 hover:text-maroon-800 dark:hover:text-gold-300 uppercase tracking-wider group"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={onQuickView}
            />
          ))}
        </div>

      </div>
    </section>
  );
};

export default ProductCarousel;
