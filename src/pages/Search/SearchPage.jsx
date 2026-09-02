import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';
import FilterSidebar from '../../components/product/FilterSidebar';
import ProductCard from '../../components/common/ProductCard';
import QuickViewModal from '../../components/common/QuickViewModal';
import EmptyState from '../../components/common/EmptyState';
import { products, searchProducts } from '../../data/products';
import { Search as SearchIcon, Filter, Sparkles, X, Clock, Flame } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';

const TRENDING_SEARCHES = [
  "Peacock Patches",
  "Copper Bottle",
  "Pooja Thali",
  "Lotus Aasan",
  "Cotton Gamcha",
  "Zardosi Butti",
  "Cup Chain",
  "Paranda Latkan"
];

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get('q') || '';

  const [inputQuery, setInputQuery] = useState(queryFromUrl);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');

  const debouncedQuery = useDebounce(inputQuery, 300);

  // Recent searches in localStorage
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('trio_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync with URL params
  useEffect(() => {
    setInputQuery(queryFromUrl);
  }, [queryFromUrl]);

  // Update URL on debounced query change
  useEffect(() => {
    if (debouncedQuery.trim()) {
      setSearchParams({ q: debouncedQuery.trim() }, { replace: true });
      // Add to recent searches
      setRecentSearches(prev => {
        const filtered = prev.filter(s => s.toLowerCase() !== debouncedQuery.trim().toLowerCase());
        const updated = [debouncedQuery.trim(), ...filtered].slice(0, 6);
        try {
          localStorage.setItem('trio_recent_searches', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  }, [debouncedQuery, setSearchParams]);

  const [filters, setFilters] = useState({
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

  // Search Results
  const rawResults = useMemo(() => {
    if (!queryFromUrl.trim()) return products;
    return searchProducts(queryFromUrl);
  }, [queryFromUrl]);

  // Filter and Sort Pipeline
  const filteredResults = useMemo(() => {
    let result = [...rawResults];

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
      default:
        break;
    }

    return result;
  }, [rawResults, filters, sortBy]);

  const handleSelectSearchTerm = (term) => {
    setInputQuery(term);
    setSearchParams({ q: term });
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('trio_recent_searches');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <SEO
        title={queryFromUrl ? `Search results for "${queryFromUrl}"` : "Search Handcrafted Ethnic Collection"}
        description="Search through handcrafted embroidery patches, copper drinkware, pooja aasans, and festive items at Trio Ecart."
      />

      <Breadcrumb items={[{ name: 'Search', url: '/search' }]} />

      {/* Main Search Header Bar */}
      <div className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-4">
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Type craft name, material, color, deity..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 bg-ivory-100 dark:bg-stone-900 text-stone-900 dark:text-ivory-100 rounded-2xl border-2 border-gold-500/40 text-sm focus:border-maroon-700 dark:focus:border-gold-500 outline-none shadow-xs"
            autoFocus
          />
          <SearchIcon className="w-5 h-5 text-gold-600 absolute left-4 top-1/2 -translate-y-1/2" />
          {inputQuery && (
            <button
              onClick={() => {
                setInputQuery('');
                setSearchParams({});
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Trending & Recent Search Chips */}
        <div className="space-y-3 pt-2">
          {/* Trending */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-gold-700 dark:text-gold-400 font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> Trending:
            </span>
            {TRENDING_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => handleSelectSearchTerm(term)}
                className="px-3 py-1 rounded-full bg-ivory-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-gold-500/20 hover:text-maroon-800 transition-colors border border-gold-500/20 text-[11px] font-medium"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Recent */}
          {recentSearches.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
              <span className="text-stone-400 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Recent:
              </span>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleSelectSearchTerm(term)}
                  className="px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-900 transition-colors border border-stone-200 dark:border-stone-800 text-[11px]"
                >
                  {term}
                </button>
              ))}
              <button
                onClick={handleClearRecentSearches}
                className="text-[10px] text-stone-400 hover:underline ml-1"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Layout */}
      <div className="flex gap-8 items-start">
        
        {/* Desktop Filter Sidebar */}
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          resetFilters={resetFilters}
        />

        {/* Results Column */}
        <div className="flex-1 space-y-6 min-w-0">
          
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl ethnic-card">
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden btn-outline-maroon py-2 px-3.5 text-xs font-bold flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>

              <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
                {queryFromUrl ? (
                  <>Found <strong className="text-stone-900 dark:text-ivory-100">{filteredResults.length}</strong> matching crafts for "<span className="text-maroon-700 dark:text-gold-400 font-bold">{queryFromUrl}</span>"</>
                ) : (
                  <>Showing all <strong className="text-stone-900 dark:text-ivory-100">{filteredResults.length}</strong> crafts</>
                )}
              </span>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-500 hidden sm:inline">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-stone-900 dark:text-ivory-100 text-xs font-semibold outline-none"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">New Arrivals</option>
              </select>
            </div>

          </div>

          {/* Results Grid */}
          {filteredResults.length === 0 ? (
            <EmptyState
              title={`No crafts found for "${queryFromUrl}"`}
              description="Check your spelling, try generic terms like 'patches' or 'bottle', or explore our full collection."
              actionText="Browse All Crafts"
              actionUrl="/shop"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {filteredResults.map((product) => (
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

export default SearchPage;
