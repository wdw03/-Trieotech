import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';
import FilterSidebar from '../../components/product/FilterSidebar';
import ProductCard from '../../components/common/ProductCard';
import QuickViewModal from '../../components/common/QuickViewModal';
import EmptyState from '../../components/common/EmptyState';
import { products } from '../../data/products';
import { Filter, SlidersHorizontal, LayoutGrid, List, Sparkles, X } from 'lucide-react';

export const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const [filters, setFilters] = useState({
    categories: searchParams.get('category') ? [searchParams.get('category')] : [],
    maxPrice: 3000,
    inStockOnly: false,
    minRating: 0,
    isBestSeller: searchParams.get('sort') === 'bestseller',
    isFestivalSpecial: false,
    isWeddingSpecial: false,
    isHandmade: false,
    isNew: searchParams.get('sort') === 'newest',
    isTrending: false,
  });

  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'featured');

  const resetFilters = () => {
    setFilters({
      categories: [],
      maxPrice: 3000,
      inStockOnly: false,
      minRating: 0,
      isBestSeller: false,
      isFestivalSpecial: false,
      isWeddingSpecial: false,
      isHandmade: false,
      isNew: false,
      isTrending: false,
    });
  };

  // Filter and Sort Pipeline
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category Filter
    if (filters.categories && filters.categories.length > 0) {
      result = result.filter(p => filters.categories.includes(p.category));
    }

    // Max Price
    if (filters.maxPrice) {
      result = result.filter(p => p.price <= filters.maxPrice);
    }

    // In Stock Only
    if (filters.inStockOnly) {
      result = result.filter(p => p.inStock);
    }

    // Min Rating
    if (filters.minRating > 0) {
      result = result.filter(p => (p.rating || 5) >= filters.minRating);
    }

    // Badges
    if (filters.isBestSeller) result = result.filter(p => p.isBestSeller);
    if (filters.isFestivalSpecial) result = result.filter(p => p.isFestivalSpecial);
    if (filters.isWeddingSpecial) result = result.filter(p => p.isWeddingSpecial);
    if (filters.isHandmade) result = result.filter(p => p.isHandmade);
    if (filters.isNew) result = result.filter(p => p.isNew);
    if (filters.isTrending) result = result.filter(p => p.isTrending);

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'bestseller':
        result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
        break;
      default:
        // featured
        break;
    }

    return result;
  }, [filters, sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categories.length > 0) count += filters.categories.length;
    if (filters.inStockOnly) count++;
    if (filters.minRating > 0) count++;
    if (filters.maxPrice < 3000) count++;
    if (filters.isBestSeller) count++;
    if (filters.isFestivalSpecial) count++;
    if (filters.isWeddingSpecial) count++;
    if (filters.isHandmade) count++;
    if (filters.isNew) count++;
    if (filters.isTrending) count++;
    return count;
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <SEO
        title="Shop All Indian Ethnic Crafts | Zardosi Patches, Copper Bottles & Pooja Decor"
        description="Browse the complete catalog of Trio Ecart handcrafted Indian products: zardosi appliques, pure copper bottles, pooja aasans, cotton gamchas, and parandas."
      />

      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[{ name: 'Shop All Crafts', url: '/shop' }]} />

      {/* Page Header Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-10 bg-gradient-to-r from-maroon-950 via-maroon-900 to-[#1C0E0E] text-white border border-gold-500/30 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" /> Complete Artisan Catalog
          </span>
          <h1 className="font-serif font-black text-2xl sm:text-4xl text-ivory-100">
            Handcrafted Indian Ethnic Collection
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 font-normal">
            Discover 43+ authentic handcrafted artifacts made with generational passion across Rajasthan, Gujarat, and Uttar Pradesh.
          </p>
        </div>
      </div>

      {/* Content Layout with Sidebar & Products Grid */}
      <div className="flex gap-8 items-start">
        
        {/* Desktop Filter Sidebar */}
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          resetFilters={resetFilters}
        />

        {/* Products Column */}
        <div className="flex-1 space-y-6 min-w-0">
          
          {/* Top Bar (Results count, mobile filter trigger, sort, view toggle) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl ethnic-card">
            
            <div className="flex items-center gap-3">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden btn-outline-maroon py-2 px-3.5 text-xs font-bold flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
              </button>

              <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
                Showing <strong className="text-stone-900 dark:text-ivory-100">{filteredProducts.length}</strong> of {products.length} crafts
              </span>
            </div>

            {/* Sort Controls & View Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-500 hidden sm:inline">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-stone-900 dark:text-ivory-100 text-xs font-semibold outline-none focus:ring-1 focus:ring-gold-500"
                >
                  <option value="featured">Featured Collection</option>
                  <option value="bestseller">Best Sellers First</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              {/* Grid / List toggle */}
              <div className="hidden sm:flex items-center border border-gold-500/20 rounded-xl overflow-hidden bg-ivory-100 dark:bg-stone-900">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-maroon-700 text-white' : 'text-stone-500 hover:text-stone-900'}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-maroon-700 text-white' : 'text-stone-500 hover:text-stone-900'}`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-stone-500 text-[11px] font-bold">Active Filters:</span>
              {filters.categories.map((cat) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 rounded-full bg-gold-500/20 text-gold-800 dark:text-gold-300 font-semibold border border-gold-500/40 flex items-center gap-1"
                >
                  {cat}
                  <button onClick={() => setFilters(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {filters.inStockOnly && (
                <span className="px-2.5 py-1 rounded-full bg-maroon-100 dark:bg-maroon-950 text-maroon-800 dark:text-maroon-300 font-semibold border border-maroon-300 flex items-center gap-1">
                  In Stock Only
                  <button onClick={() => setFilters(prev => ({ ...prev, inStockOnly: false }))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.minRating > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300 flex items-center gap-1">
                  {filters.minRating}★ &amp; above
                  <button onClick={() => setFilters(prev => ({ ...prev, minRating: 0 }))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-maroon-700 dark:text-gold-400 hover:underline ml-2"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <EmptyState
              title="No crafts match your filter criteria"
              description="Try adjusting or clearing your filters to see our full artisan catalog."
              actionText="Reset All Filters"
              onAction={resetFilters}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <FilterSidebar
        filters={filters}
        setFilters={setFilters}
        resetFilters={resetFilters}
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        isMobile={true}
      />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};

export default ShopPage;
