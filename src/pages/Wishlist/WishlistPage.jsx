import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import ProductCard from '../../components/common/ProductCard';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { Heart, Trash2, ShoppingBag, Sparkles } from 'lucide-react';

export const WishlistPage = () => {
  const { wishlist, clearWishlist } = useWishlist();
  const { addToCart, openCart } = useCart();

  const handleMoveAllToCart = () => {
    wishlist.forEach(item => {
      addToCart(item, 1);
    });
    openCart();
  };

  if (wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <SEO title="My Saved Wishlist | Trio Ecart" />
        <Breadcrumb items={[{ name: 'Wishlist', url: '/wishlist' }]} />
        <EmptyState
          icon={Heart}
          title="Your Handcraft Wishlist is Empty"
          description="Save your favorite zardosi patches, hammered copper bottles, and pooja essentials to revisit anytime."
          actionText="Explore All Crafts"
          actionUrl="/shop"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <SEO
        title="My Wishlist"
        description="View your saved handcrafted Indian embroidery patches, copper water bottles, and pooja essentials at Trio Ecart."
      />

      <Breadcrumb items={[{ name: 'Wishlist', url: '/wishlist' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-500/20 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" /> Saved Heirloom Collection
          </span>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100">
            My Wishlist ({wishlist.length} Items)
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleMoveAllToCart}
            className="btn-gold py-2.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Move All to Cart</span>
          </button>
          <button
            onClick={clearWishlist}
            className="text-xs font-bold text-maroon-700 dark:text-gold-400 hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {wishlist.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;
