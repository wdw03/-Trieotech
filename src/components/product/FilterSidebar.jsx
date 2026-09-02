import React from 'react';
import { Filter, X, RotateCcw, Star, Check } from 'lucide-react';
import { categories } from '../../data/categories';

export const FilterSidebar = ({
  filters,
  setFilters,
  resetFilters,
  isOpen = false,
  onClose = null,
  isMobile = false
}) => {
  const materials = [
    "Zardosi & Velvet",
    "100% Pure Copper",
    "Solid Brass",
    "Pure Desi Cotton",
    "Rhinestone & Zarkan",
    "Silk & Gota Patti",
    "Natural Jute"
  ];

  const badges = [
    { key: "isBestSeller", label: "Best Seller" },
    { key: "isFestivalSpecial", label: "Festival Special" },
    { key: "isWeddingSpecial", label: "Wedding Special" },
    { key: "isHandmade", label: "Handmade" },
    { key: "isNew", label: "New Arrival" },
    { key: "isTrending", label: "Trending Now" }
  ];

  const handleCategoryToggle = (catName) => {
    setFilters(prev => {
      const current = prev.categories || [];
      const updated = current.includes(catName)
        ? current.filter(c => c !== catName)
        : [...current, catName];
      return { ...prev, categories: updated };
    });
  };

  const handleMaterialToggle = (mat) => {
    setFilters(prev => {
      const current = prev.materials || [];
      const updated = current.includes(mat)
        ? current.filter(m => m !== mat)
        : [...current, mat];
      return { ...prev, materials: updated };
    });
  };

  const handleBadgeToggle = (badgeKey) => {
    setFilters(prev => ({
      ...prev,
      [badgeKey]: !prev[badgeKey]
    }));
  };

  const content = (
    <div className="space-y-6 text-xs text-stone-700 dark:text-stone-300">
      
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-4 border-b border-gold-500/20">
        <div className="flex items-center gap-2 font-serif font-bold text-sm text-stone-900 dark:text-ivory-100">
          <Filter className="w-4 h-4 text-gold-600" />
          <span>Filter Collection</span>
        </div>
        <button
          onClick={resetFilters}
          className="text-[11px] text-maroon-700 dark:text-gold-400 hover:underline flex items-center gap-1 font-bold"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Clear All</span>
        </button>
      </div>

      {/* In Stock Only Switch */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-ivory-200/60 dark:bg-stone-900/60 border border-gold-500/20">
        <span className="font-bold text-stone-800 dark:text-ivory-100">In Stock Only</span>
        <button
          type="button"
          onClick={() => setFilters(prev => ({ ...prev, inStockOnly: !prev.inStockOnly }))}
          className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
            filters.inStockOnly ? 'bg-maroon-700' : 'bg-stone-300 dark:bg-stone-700'
          }`}
          aria-label="Toggle in stock filter"
        >
          <div
            className={`w-5 h-5 rounded-full bg-white transition-transform ${
              filters.inStockOnly ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Price Range Slider */}
      <div className="space-y-2">
        <div className="flex justify-between font-bold text-stone-900 dark:text-ivory-100">
          <span>Max Price</span>
          <span className="font-serif text-maroon-800 dark:text-gold-400">
            ₹{filters.maxPrice ? filters.maxPrice.toLocaleString('en-IN') : '2,500'}
          </span>
        </div>
        <input
          type="range"
          min="100"
          max="3000"
          step="50"
          value={filters.maxPrice || 3000}
          onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
          className="w-full accent-maroon-700 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-stone-400">
          <span>₹100</span>
          <span>₹1,500</span>
          <span>₹3,000+</span>
        </div>
      </div>

      {/* Craft Categories Filter */}
      <div className="space-y-2.5 pt-2 border-t border-gold-500/20">
        <span className="font-serif font-bold text-sm text-stone-900 dark:text-ivory-100 block">
          Categories
        </span>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {categories.map((cat) => {
            const isChecked = filters.categories?.includes(cat.name);
            return (
              <label
                key={cat.id}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-gold-500/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-maroon-700 border-maroon-700 text-white'
                        : 'border-stone-300 dark:border-stone-600'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className={isChecked ? 'font-bold text-maroon-800 dark:text-gold-400' : ''}>
                    {cat.name}
                  </span>
                </div>
                <span className="text-[10px] text-stone-400">({cat.productCount})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Occasions & Badges Filter */}
      <div className="space-y-2.5 pt-2 border-t border-gold-500/20">
        <span className="font-serif font-bold text-sm text-stone-900 dark:text-ivory-100 block">
          Special Occasion
        </span>
        <div className="space-y-1.5">
          {badges.map((b) => {
            const isChecked = !!filters[b.key];
            return (
              <label
                key={b.key}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gold-500/10 cursor-pointer transition-colors"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isChecked
                      ? 'bg-maroon-700 border-maroon-700 text-white'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className={isChecked ? 'font-bold text-maroon-800 dark:text-gold-400' : ''}>
                  {b.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Minimum Rating Filter */}
      <div className="space-y-2.5 pt-2 border-t border-gold-500/20">
        <span className="font-serif font-bold text-sm text-stone-900 dark:text-ivory-100 block">
          Customer Rating
        </span>
        <div className="space-y-1.5">
          {[4, 3, 2].map((stars) => (
            <label
              key={stars}
              onClick={() => setFilters(prev => ({ ...prev, minRating: prev.minRating === stars ? 0 : stars }))}
              className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                filters.minRating === stars ? 'bg-gold-500/20 font-bold' : 'hover:bg-gold-500/10'
              }`}
            >
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < stars ? 'fill-amber-400' : 'text-stone-300 dark:text-stone-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-stone-700 dark:text-stone-300">&amp; above</span>
            </label>
          ))}
        </div>
      </div>

    </div>
  );

  if (isMobile) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
        <div className="w-4/5 max-w-sm bg-white dark:bg-[#1A110B] h-full overflow-y-auto p-5 shadow-2xl animate-slide-left flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gold-500/20 mb-4">
              <span className="font-serif font-bold text-base text-stone-900 dark:text-ivory-100">
                Filter Products
              </span>
              <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            {content}
          </div>

          <div className="pt-4 mt-6 border-t border-gold-500/20 flex gap-2">
            <button
              onClick={resetFilters}
              className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 font-bold text-xs"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 btn-primary py-2.5 rounded-xl font-bold text-xs"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside className="w-64 shrink-0 ethnic-card p-5 h-fit sticky top-28 hidden lg:block">
      {content}
    </aside>
  );
};

export default FilterSidebar;
