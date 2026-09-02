import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';
import FilterSidebar from '../../components/product/FilterSidebar';
import ProductCard from '../../components/common/ProductCard';
import QuickViewModal from '../../components/common/QuickViewModal';
import EmptyState from '../../components/common/EmptyState';
import { categories, getCategoryBySlug } from '../../data/categories';
import { products } from '../../data/products';
import { Filter, LayoutGrid, List, Sparkles, X, ChevronRight } from 'lucide-react';

export const CategoryPage = () => {
  const { slug } = useParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [sortBy, setSortBy] = useState('featured');

  // Find category details
  const currentCategory = useMemo(() => {
    const found = getCategoryBySlug(slug);
    if (found) return found;

    // Fallback: match by product category name
    const matchingProduct = products.find(
      p => p.category.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-') === slug?.toLowerCase()
    );
    if (matchingProduct) {
      return {
        id: 99,
        name: matchingProduct.category,
        slug: slug,
        image: matchingProduct.images?.[0] || '/products/shreenathji-statement-patch-1.jpg',
        description: `Explore our collection of authentic ${matchingProduct.category} handcrafted by Indian artisans.`,
        productCount: products.filter(p => p.category === matchingProduct.category).length,
        subcategories: []
      };
    }

    return null;
  }, [slug]);

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
    setSelectedSubcategory(null);
  };

  // Products belonging to this category
  const categoryProducts = useMemo(() => {
    if (!currentCategory) return [];
    return products.filter(p => {
      const matchCat = p.category.toLowerCase() === currentCategory.name.toLowerCase() ||
        p.category.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-') === currentCategory.slug.toLowerCase();
      return matchCat;
    });
  }, [currentCategory]);

  // Subcategories present in actual products
  const availableSubcategories = useMemo(() => {
    const subs = categoryProducts.map(p => p.subcategory).filter(Boolean);
    return [...new Set(subs)];
  }, [categoryProducts]);

  // Filter and Sort Pipeline
  const filteredProducts = useMemo(() => {
    let result = [...categoryProducts];

    // Subcategory tab filter
    if (selectedSubcategory) {
      result = result.filter(p => p.subcategory === selectedSubcategory);
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
        break;
    }

    return result;
  }, [categoryProducts, selectedSubcategory, filters, sortBy]);

  if (!currentCategory) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          title="Category Not Found"
          description="The craft category you are searching for might have moved or been renamed."
          actionText="Browse All Categories"
          actionUrl="/shop"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <SEO
        title={`${currentCategory.name} Collection`}
        description={currentCategory.description}
        image={currentCategory.image}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: currentCategory.name, url: `/category/${currentCategory.slug}` }
        ]}
      />

      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { name: 'Categories', url: '/shop' },
          { name: currentCategory.name, url: `/category/${currentCategory.slug}` }
        ]}
      />

      {/* Category Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden min-h-[220px] sm:min-h-[260px] flex items-center p-6 sm:p-10 border border-gold-500/30 shadow-xl bg-gradient-to-r from-maroon-950 via-maroon-900 to-[#1F0C0C] text-white">
        {/* Background Image Overlay */}
        <div className="absolute right-0 inset-y-0 w-full md:w-1/2 opacity-25 md:opacity-35 pointer-events-none">
          <img
            src={currentCategory.banner || currentCategory.image}
            alt={currentCategory.name}
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="relative z-10 max-w-xl space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" /> Artisan Craft Guild
          </span>
          <h1 className="font-serif font-black text-2xl sm:text-4xl text-ivory-100">
            {currentCategory.name}
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-normal">
            {currentCategory.description}
          </p>
          <div className="pt-1 text-xs font-bold text-gold-300">
            {categoryProducts.length} Handcrafted Products Available
          </div>
        </div>
      </div>

      {/* Subcategory Filter Tabs (if available) */}
      {availableSubcategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar">
          <button
            onClick={() => setSelectedSubcategory(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedSubcategory === null
                ? 'bg-maroon-700 text-white shadow-maroon-sm'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-gold-500/20 hover:border-gold-500'
            }`}
          >
            All {currentCategory.name}
          </button>
          {availableSubcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubcategory(sub)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedSubcategory === sub
                  ? 'bg-maroon-700 text-white shadow-maroon-sm'
                  : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-gold-500/20 hover:border-gold-500'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

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
                Showing <strong className="text-stone-900 dark:text-ivory-100">{filteredProducts.length}</strong> crafts
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
                <option value="featured">Featured</option>
                <option value="bestseller">Best Sellers</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <EmptyState
              title="No crafts match your filter selection"
              description="Try resetting your filters or switching subcategories."
              actionText="Reset Filters"
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

export default CategoryPage;
