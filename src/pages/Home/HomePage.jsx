import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import HeroCarousel from '../../components/home/HeroCarousel';
import CategoryGrid from '../../components/home/CategoryGrid';
import ProductCarousel from '../../components/home/ProductCarousel';
import BrandStoryStrip from '../../components/home/BrandStoryStrip';
import TestimonialsCarousel from '../../components/home/TestimonialsCarousel';
import BlogPreview from '../../components/home/BlogPreview';
import QuickViewModal from '../../components/common/QuickViewModal';
import {
  getBestSellers,
  getNewArrivals,
  getTrendingProducts,
  getWeddingProducts,
  getFestivalProducts,
  getHandmadeProducts
} from '../../data/products';
import { Sparkles, ArrowRight, Heart, Gift, Crown } from 'lucide-react';

export const HomePage = () => {
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const bestSellers = getBestSellers();
  const newArrivals = getNewArrivals();
  const trending = getTrendingProducts();
  const weddingSpecial = getWeddingProducts();
  const festivalSpecial = getFestivalProducts();
  const handmade = getHandmadeProducts();

  return (
    <div className="space-y-4">
      {/* Dynamic SEO Meta */}
      <SEO
        title="Ethnic Craft E-Commerce | Handcrafted Indian Embroidery Patches & Devotional Decor"
        description="Shop authentic Indian handcrafted embroidery patches, pure copper hammered water bottles, pooja aasans, desi cotton gamchas, and bridal hair parandas directly from Jaipur & Surat master artisans."
      />

      {/* 1. Hero Carousel */}
      <HeroCarousel />

      {/* 2. Category Grid */}
      <CategoryGrid />

      {/* 3. Best Sellers Section */}
      <ProductCarousel
        title="Artisan Best Sellers"
        subtitle="Our most cherished handcrafted patches, copper bottles, and pooja essentials loved by thousands of patrons."
        badge="Patron Favorites"
        products={bestSellers}
        viewAllLink="/shop?sort=bestseller"
        limit={4}
        onQuickView={setQuickViewProduct}
      />

      {/* 4. Festive & Wedding Dual Banner Section */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Wedding Banner */}
          <div className="relative rounded-3xl overflow-hidden border-2 border-gold-500/40 p-8 sm:p-10 flex flex-col justify-between min-h-[280px] bg-gradient-to-br from-[#3B0E1E] via-[#2A0815] to-[#16040A] text-white shadow-xl group">
            <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-30 group-hover:opacity-40 transition-opacity">
              <img src="/products/peacock-real-feathers-pair-1.jpg" alt="Wedding" className="w-full h-full object-cover" />
            </div>
            <div className="relative z-10 space-y-3 max-w-sm">
              <span className="badge-ribbon badge-wedding inline-flex items-center gap-1">
                <Crown className="w-3 h-3" /> Royal Bridal Couture
              </span>
              <h3 className="font-serif font-black text-2xl sm:text-3xl text-gold-200 leading-tight">
                Wedding Special Patches &amp; Latkans
              </h3>
              <p className="text-xs sm:text-sm text-stone-300">
                Elevate bridal lehengas and wedding ensembles with hand-stitched peacock appliques and pearl parandas.
              </p>
            </div>
            <div className="relative z-10 pt-4">
              <Link
                to="/category/patches"
                className="btn-gold py-2.5 px-6 text-xs uppercase tracking-wider font-bold inline-flex items-center gap-2"
              >
                <span>Shop Bridal Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Festival Banner */}
          <div className="relative rounded-3xl overflow-hidden border-2 border-gold-500/40 p-8 sm:p-10 flex flex-col justify-between min-h-[280px] bg-gradient-to-br from-[#2D1204] via-[#1E0C03] to-[#120601] text-white shadow-xl group">
            <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-30 group-hover:opacity-40 transition-opacity">
              <img src="/products/pooja-thali-brass-diya-1.jpg" alt="Festival" className="w-full h-full object-cover" />
            </div>
            <div className="relative z-10 space-y-3 max-w-sm">
              <span className="badge-ribbon badge-festival inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Auspicious Festivities
              </span>
              <h3 className="font-serif font-black text-2xl sm:text-3xl text-gold-200 leading-tight">
                Sacred Pooja Aasans &amp; Thalis
              </h3>
              <p className="text-xs sm:text-sm text-stone-300">
                Conceive divine blessings for Diwali, Navratri, and Griha Pravesh with red velvet thalis and brass diyas.
              </p>
            </div>
            <div className="relative z-10 pt-4">
              <Link
                to="/category/aasan"
                className="btn-primary py-2.5 px-6 text-xs uppercase tracking-wider font-bold inline-flex items-center gap-2"
              >
                <span>Explore Mandir Decor</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 5. New Arrivals Carousel */}
      <ProductCarousel
        title="Fresh from the Artisan Ateliers"
        subtitle="Newly woven cotton gamchas, pure copper sets, and floral decor recently completed by our craft collective."
        badge="Just Arrived"
        products={newArrivals}
        viewAllLink="/shop?sort=newest"
        limit={4}
        onQuickView={setQuickViewProduct}
      />

      {/* 6. Brand Story Strip */}
      <BrandStoryStrip />

      {/* 7. Trending Now Grid */}
      <ProductCarousel
        title="Trending Handicrafts"
        subtitle="Highly in-demand zardosi butti motifs, cup chains, and puja chowki cloths."
        badge="Popular This Week"
        products={trending}
        viewAllLink="/shop"
        limit={4}
        onQuickView={setQuickViewProduct}
      />

      {/* 8. Testimonials Section */}
      <TestimonialsCarousel />

      {/* 9. Blog Preview Section */}
      <BlogPreview />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};

export default HomePage;
