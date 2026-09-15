'use client';

import React, { useState, useEffect } from 'react';
import { HomeStyles } from './SharedUI';
import HeroBanner from './HeroBanner';
import MarqueeStrip from './MarqueeStrip';
import NewArrivals from './NewArrivals';
import ShopByCollection from './ShopByCollection';
import TheRoyalHeritage from './TheRoyalHeritage';
import Craftsmanship from './Craftsmanship';
import TheMaking from './TheMaking';
import HomeReviews from './HomeReviews';
import Newsletter from './Newsletter';
import QuickViewModal from '../common/QuickViewModal';
import { products as fallbackProducts } from '../../data/products';
import { fetchLiveProducts, normalizeProduct } from '../../lib/api/store';

export default function HomeClient() {
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [allProducts, setAllProducts] = useState(() =>
    fallbackProducts.map(normalizeProduct)
  );

  useEffect(() => {
    let isMounted = true;
    fetchLiveProducts({ limit: 100 })
      .then((data) => {
        if (isMounted && data?.products?.length > 0) {
          setAllProducts(data.products);
        }
      })
      .catch((err) => console.warn('Live products fetch notice:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="w-full bg-[#0d0b09] overflow-hidden text-white/80 selection:bg-[#d4af37] selection:text-[#0d0b09]">
      {/* Self-contained homepage styling & keyframes */}
      <HomeStyles />

      {/* 1. Cinematic Hero Slider with Kinetic Rotating Typography */}
      <HeroBanner />

      {/* 2. Infinite Royal Gold Marquee Ticker */}
      <MarqueeStrip />

      {/* 3. New Arrivals (The Drop Vol. 24) with Category Tabs, Search & Live Products */}
      <NewArrivals
        products={allProducts}
        onQuickView={(prod) => setQuickViewProduct(prod)}
      />

      {/* 4. Signature Edits: Arched Collection Cards */}
      <ShopByCollection />

      {/* 5. Masterpiece Spotlight: The Royal Heritage */}
      <TheRoyalHeritage />

      {/* 6. The Master Atelier: 4 Interactive Craftsmanship Pillars */}
      <Craftsmanship />

      {/* 7. The Making of an Heirloom: Visual Atelier Timeline & Trust Stats */}
      <TheMaking />

      {/* 8. Patron Reflections: Testimonials Carousel */}
      <HomeReviews />

      {/* 9. Join The Royal Circle: VIP Club Newsletter */}
      <Newsletter />

      {/* Quick View Modal for live product previews */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
