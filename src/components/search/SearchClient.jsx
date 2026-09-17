'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Breadcrumb from '../../components/common/Breadcrumb';
import FilterSidebar from '../../components/product/FilterSidebar';
import ProductCard from '../../components/common/ProductCard';
import QuickViewModal from '../../components/common/QuickViewModal';
import EmptyState from '../../components/common/EmptyState';
import { products as fallbackProducts, searchProducts } from '../../data/products';
import { fetchLiveProducts, normalizeProduct, normalizeCategorySlug } from '../../lib/api/store';
import { Search as SearchIcon, Filter, Sparkles, X, Clock, Flame, ArrowRight, Package, LayoutGrid, List } from 'lucide-react';
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

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get('q') || '';

  const [inputQuery, setInputQuery] = useState(queryFromUrl);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('grid');
  const [allProducts, setAllProducts] = useState(() => fallbackProducts.map(normalizeProduct));
  const [liveSearchResults, setLiveSearchResults] = useState(null);

  const debouncedQuery = useDebounce(inputQuery, 300);

  // Fetch live products when query changes
  useEffect(() => {
    let isMounted = true;
    const q = queryFromUrl.trim();
    if (q) {
      fetchLiveProducts({ search: q, limit: 100 })
        .then((data) => {
          if (isMounted && data?.products) {
            setLiveSearchResults(data.products);
          }
        })
        .catch(() => {});
    } else {
      setLiveSearchResults(null);
      fetchLiveProducts({ limit: 100 })
        .then((data) => {
          if (isMounted && data?.products) {
            setAllProducts(data.products);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [queryFromUrl]);

  // Recent searches in localStorage (hydrated in effect to prevent SSR mismatch)
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('trio_recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Sync with URL params
  useEffect(() => {
    setInputQuery(queryFromUrl);
  }, [queryFromUrl]);

  // Update URL on debounced query change
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    const currentParam = searchParams.get('q') || '';
    if (trimmed !== currentParam) {
      router.replace(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search', { scroll: false });
    }
    if (trimmed) {
      setRecentSearches(prev => {
        const filtered = prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
        const updated = [trimmed, ...filtered].slice(0, 6);
        try {
          localStorage.setItem('trio_recent_searches', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  }, [debouncedQuery]);

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
    const visibleOnly = allProducts.filter(p => p.is_visible !== false && p.isVisible !== false);
    if (!queryFromUrl.trim()) return visibleOnly;
    if (liveSearchResults !== null) return liveSearchResults.filter(p => p.is_visible !== false && p.isVisible !== false);
    return visibleOnly.filter(p =>
      p.name?.toLowerCase().includes(queryFromUrl.toLowerCase()) ||
      p.category?.toLowerCase().includes(queryFromUrl.toLowerCase()) ||
      p.subcategory?.toLowerCase().includes(queryFromUrl.toLowerCase())
    );
  }, [queryFromUrl, allProducts, liveSearchResults]);

  // Filter and Sort Pipeline
  const filteredResults = useMemo(() => {
    let result = [...rawResults];

    // Category Filter
    if (filters.categories && filters.categories.length > 0) {
      const filterSlugs = filters.categories.map(normalizeCategorySlug);
      result = result.filter(p => {
        const pCatSlug = normalizeCategorySlug(p.category);
        const pSubSlug = normalizeCategorySlug(p.subcategory);
        return filterSlugs.includes(pCatSlug) || (pSubSlug && filterSlugs.includes(pSubSlug));
      });
    }

    // Max Price
    if (filters.maxPrice) {
      result = result.filter(p => Number(p.price) <= filters.maxPrice);
    }

    // In Stock Only
    if (filters.inStockOnly) {
      result = result.filter(p => Boolean(p.inStock ?? p.in_stock ?? true) && Number(p.stock ?? 1) > 0);
    }

    // Min Rating
    if (filters.minRating > 0) {
      result = result.filter(p => Number(p.rating || 5) >= filters.minRating);
    }

    // Badges
    if (filters.isBestSeller) result = result.filter(p => Boolean(p.isBestSeller ?? p.is_best_seller ?? (p.badge === 'Best Seller')));
    if (filters.isFestivalSpecial) result = result.filter(p => Boolean(p.isFestivalSpecial ?? p.is_festival_special ?? (p.badge === 'Festival Special')));
    if (filters.isWeddingSpecial) result = result.filter(p => Boolean(p.isWeddingSpecial ?? p.is_wedding_special ?? (p.badge === 'Wedding Special')));
    if (filters.isHandmade) result = result.filter(p => Boolean(p.isHandmade ?? p.is_handmade ?? (p.badge === 'Handmade')));
    if (filters.isNew) result = result.filter(p => Boolean(p.isNew ?? p.is_new ?? (p.badge === 'New')));
    if (filters.isTrending) result = result.filter(p => Boolean(p.isTrending ?? p.is_trending ?? (p.badge === 'Trending')));

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

  // Similar & Related Products Pipeline
  const similarProducts = useMemo(() => {
    const matchedIds = new Set(filteredResults.map(p => p.id));
    const matchedCategories = [...new Set(rawResults.map(p => p.category))];

    // First preference: crafts in the same categories but not in current result list
    let pool = (allProducts || []).filter(p => !matchedIds.has(p.id) && matchedCategories.includes(p.category));

    // Fallback/supplement: trending or best seller crafts
    if (pool.length < 4) {
      const extra = (allProducts || []).filter(
        p => !matchedIds.has(p.id) && !pool.some(c => c.id === p.id) && (p.isTrending || p.isBestSeller)
      );
      pool = [...pool, ...extra];
    }

    return pool.slice(0, 4);
  }, [rawResults, filteredResults, allProducts]);

  // Dismiss on-screen mobile keyboard safely
  const dismissMobileKeyboard = () => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        document.activeElement.blur();
      }
    }
  };

  // Gently blur the search input when tapping outside the form on mobile, without interrupting scroll gestures
  useEffect(() => {
    const handleTouchStart = (e) => {
      const searchForm = document.getElementById('search_page_form');
      if (searchForm && !searchForm.contains(e.target)) {
        if (document.activeElement?.id === 'search_page_input') {
          document.activeElement.blur();
        }
      }
    };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  const handleSelectSearchTerm = (term) => {
    setInputQuery(term);
    dismissMobileKeyboard();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('trio_recent_searches');
  };

  const handleSearchFormSubmit = (e) => {
    e.preventDefault();
    dismissMobileKeyboard();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6 pb-28 sm:pb-20 lg:pb-16 space-y-4 sm:space-y-6 relative z-10 min-w-0 overflow-x-clip">
      
      {/* Desktop Breadcrumb (hidden on mobile to save vertical viewport) */}
      <div className="hidden sm:block">
        <Breadcrumb items={[{ name: 'Search', url: '/search' }]} />
      </div>

      {/* Main Search Header Bar */}
      <div className="ethnic-card p-3.5 sm:p-8 rounded-2xl sm:rounded-3xl space-y-2.5 sm:space-y-4 shadow-sm relative z-10 w-full min-w-0 overflow-hidden">
        <form id="search_page_form" onSubmit={handleSearchFormSubmit} className="relative max-w-2xl mx-auto w-full min-w-0">
          <input
            id="search_page_input"
            name="search_query"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            placeholder="Type craft name, material, color, deity..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-10 py-2.5 sm:py-3.5 bg-ivory-100 dark:bg-stone-900 text-stone-900 dark:text-ivory-100 rounded-xl sm:rounded-2xl border-2 border-gold-500/40 text-xs sm:text-sm focus:border-maroon-700 dark:focus:border-gold-500 outline-none shadow-xs transition-colors"
          />
          <SearchIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gold-600 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          {inputQuery && (
            <button
              type="button"
              onClick={() => {
                setInputQuery('');
                router.push('/search');
              }}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Trending & Recent Search Chips (Horizontal scroll on mobile, wrap on desktop) */}
        <div className="space-y-2 sm:space-y-3 pt-0.5 sm:pt-2 w-full min-w-0 overflow-hidden">
          {/* Trending */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar sm:flex-wrap text-xs py-0.5 sm:py-0 w-full min-w-0">
            <span className="text-gold-700 dark:text-gold-400 font-bold flex items-center gap-1 shrink-0 text-[11px] sm:text-xs">
              <Flame className="w-3.5 h-3.5 shrink-0" /> Trending:
            </span>
            {TRENDING_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleSelectSearchTerm(term)}
                className="px-2.5 sm:px-3 py-1 rounded-full bg-ivory-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-gold-500/20 hover:text-maroon-800 transition-colors border border-gold-500/20 text-[11px] font-medium shrink-0 whitespace-nowrap active:scale-95 cursor-pointer"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Recent */}
          {recentSearches.length > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar sm:flex-wrap text-xs pt-0.5 sm:pt-1 w-full min-w-0">
              <span className="text-stone-400 font-bold flex items-center gap-1 shrink-0 text-[11px] sm:text-xs">
                <Clock className="w-3.5 h-3.5 shrink-0" /> Recent:
              </span>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleSelectSearchTerm(term)}
                  className="px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-900 transition-colors border border-stone-200 dark:border-stone-800 text-[11px] shrink-0 whitespace-nowrap active:scale-95 cursor-pointer"
                >
                  {term}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearRecentSearches}
                className="text-[10px] text-stone-400 hover:underline ml-1 shrink-0 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Layout */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start relative z-10 lg:min-h-[850px] w-full max-w-full min-w-0">
        
        {/* Desktop Filter Sidebar */}
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          resetFilters={resetFilters}
          products={allProducts}
        />

        {/* Results Column */}
        <div className="flex-1 space-y-4 sm:space-y-6 min-w-0 w-full max-w-full lg:min-h-[750px]">
          
          {/* Top Bar (Results count, mobile filter trigger, sorting) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 p-3 sm:p-4 rounded-2xl ethnic-card shadow-xs w-full max-w-full min-w-0 overflow-hidden">
            
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 w-full sm:w-auto">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden btn-outline-maroon py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Filter className="w-3.5 h-3.5 shrink-0" />
                <span>Filters</span>
              </button>

              <span className="text-xs font-medium text-stone-600 dark:text-stone-400 min-w-0 truncate flex-1">
                {queryFromUrl ? (
                  <span className="truncate block">
                    Found <strong className="text-stone-900 dark:text-ivory-100">{filteredResults.length}</strong> crafts for &ldquo;<span className="text-maroon-700 dark:text-gold-400 font-bold truncate">{queryFromUrl}</span>&rdquo;
                  </span>
                ) : (
                  <span className="truncate block">Showing all <strong className="text-stone-900 dark:text-ivory-100">{filteredResults.length}</strong> crafts</span>
                )}
              </span>
            </div>

            {/* Sort Controls & View Toggle */}
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 text-xs shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t border-gold-500/10 sm:border-t-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-stone-500 text-[11px] sm:text-xs shrink-0">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-stone-900 dark:text-ivory-100 text-xs font-semibold outline-none focus:ring-1 focus:ring-gold-500 cursor-pointer"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">New Arrivals</option>
                </select>
              </div>

              {/* Grid / List toggle (hidden on mobile, visible sm+) */}
              <div className="hidden sm:flex items-center border border-gold-500/20 rounded-xl overflow-hidden bg-ivory-100 dark:bg-stone-900">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-maroon-700 text-white' : 'text-stone-500 hover:text-stone-900'}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-maroon-700 text-white' : 'text-stone-500 hover:text-stone-900'}`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Results Grid / List Container with responsive min-height */}
          <div className="min-h-[300px] sm:min-h-[550px] w-full max-w-full min-w-0">
            {filteredResults.length === 0 ? (
              <div className="space-y-6 sm:space-y-8">
                <EmptyState
                  title={`No crafts found for "${queryFromUrl}"`}
                  description="Check your spelling, try generic terms like 'patches' or 'bottle', or explore our recommended collection below."
                  actionText="Browse All Crafts"
                  actionUrl="/shop"
                />

                {/* Curated Recommendations when search has no direct match */}
                {similarProducts.length > 0 && (
                  <div className="pt-4 border-t border-gold-500/20 space-y-4">
                    <div>
                      <span className="text-[11px] font-bold text-gold-700 dark:text-gold-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Handcrafted For You
                      </span>
                      <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-ivory-100 mt-0.5">
                        Popular Artisan Recommendations
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-6 w-full max-w-full min-w-0">
                      {similarProducts.map((product) => (
                        <ProductCard
                          key={`fallback-${product.id}`}
                          product={product}
                          onQuickView={setQuickViewProduct}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8 sm:space-y-10">
                {/* Main Product Cards Grid / List */}
                {viewMode === 'list' ? (
                  <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-full min-w-0">
                    {filteredResults.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        viewMode="list"
                        onQuickView={setQuickViewProduct}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-6 w-full max-w-full min-w-0">
                    {filteredResults.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        viewMode="grid"
                        onQuickView={setQuickViewProduct}
                      />
                    ))}
                  </div>
                )}

                {/* Similar & Related Products Section */}
                {similarProducts.length > 0 && (
                  <div className="pt-8 sm:pt-10 border-t border-gold-500/20 space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-gold-700 dark:text-gold-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Artisan Guild Suggestions
                        </span>
                        <h3 className="font-serif font-bold text-lg sm:text-2xl text-stone-900 dark:text-ivory-100 mt-1 truncate">
                          Similar &amp; Related Handcrafted Pieces
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Authentic handcrafted creations complementary to your search.
                        </p>
                      </div>

                      <Link
                        href="/shop"
                        className="btn-outline-maroon py-2 px-4 text-xs font-bold self-start sm:self-auto flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <span>Explore All Crafts</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-6 w-full max-w-full min-w-0">
                      {similarProducts.map((product) => (
                        <ProductCard
                          key={`similar-${product.id}`}
                          product={product}
                          onQuickView={setQuickViewProduct}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
        products={allProducts}
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


