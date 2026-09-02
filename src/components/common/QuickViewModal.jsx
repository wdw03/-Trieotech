import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Heart, ShoppingBag, ArrowRight, Check, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import RatingStars from './RatingStars';
import Badge from './Badge';

export const QuickViewModal = ({ product, isOpen, onClose }) => {
  if (!isOpen || !product) return null;

  const { addToCart, openCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedColor, setSelectedColor] = useState(
    product.colors && product.colors.length > 0 ? product.colors[0] : null
  );
  const [selectedSize, setSelectedSize] = useState(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : null
  );
  const [selectedImage, setSelectedImage] = useState(product.images?.[0] || '/products/shreenathji-statement-patch-1.jpg');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : null);
      setSelectedSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : null);
      setSelectedImage(product.images?.[0] || '/products/shreenathji-statement-patch-1.jpg');
      setQuantity(1);
    }
  }, [product]);

  // Handle color change
  const handleColorSelect = (col) => {
    setSelectedColor(col);
    if (col.image) {
      setSelectedImage(col.image);
    }
  };

  const isWishlisted = isInWishlist(product.id);
  const activePrice = selectedColor?.price || product.price;
  const activeOriginalPrice = selectedColor?.originalPrice || product.originalPrice;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedColor?.name, selectedSize);
    onClose();
    openCart();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-[#1A110B] rounded-3xl border border-gold-500/30 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-maroon-700 hover:text-white transition-colors flex items-center justify-center shadow-md"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Section */}
        <div className="w-full md:w-1/2 p-6 bg-ivory-200 dark:bg-stone-900 flex flex-col items-center justify-between">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-gold-500/20 shadow-inner bg-white dark:bg-stone-950">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {product.badge && (
              <div className="absolute top-3 left-3">
                <Badge type={product.badge} />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-2 mt-4 overflow-x-auto w-full py-1">
              {product.images.slice(0, 5).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === img
                      ? 'border-maroon-700 ring-2 ring-gold-500/50 scale-105'
                      : 'border-stone-300 dark:border-stone-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[60vh] md:max-h-[80vh]">
          <div className="space-y-4">
            {/* Category & Rating */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gold-700 dark:text-gold-400">
                {product.category}
              </span>
              <RatingStars rating={product.rating || 4.8} reviewCount={product.reviewCount || 10} size="sm" showValue />
            </div>

            {/* Title */}
            <h2 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-ivory-100 leading-snug">
              {product.name}
            </h2>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-serif font-black text-2xl text-maroon-800 dark:text-gold-400">
                ₹{activePrice.toLocaleString('en-IN')}
              </span>
              {activeOriginalPrice && activeOriginalPrice > activePrice && (
                <span className="text-sm text-stone-400 line-through">
                  ₹{activeOriginalPrice.toLocaleString('en-IN')}
                </span>
              )}
              {product.discount > 0 && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  Save {product.discount}%
                </span>
              )}
            </div>

            {/* Short Description */}
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-3">
              {product.shortDescription || product.description}
            </p>

            {/* Color Variants */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Color: <span className="font-normal text-gold-700 dark:text-gold-400">{selectedColor?.name || 'Default'}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((col, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleColorSelect(col)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                        selectedColor?.name === col.name
                          ? 'border-maroon-700 bg-maroon-50 text-maroon-900 dark:bg-maroon-950/40 dark:border-gold-500 dark:text-gold-300 shadow-xs'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-gold-500'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: col.hex }} />
                      <span>{col.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Variants */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Pack / Size Option:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                        selectedSize === s
                          ? 'border-maroon-700 bg-maroon-700 text-white'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-maroon-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Stock */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center border border-stone-300 dark:border-stone-700 rounded-xl overflow-hidden bg-white dark:bg-stone-900">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3 py-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold"
                >
                  -
                </button>
                <span className="px-3 py-2 text-xs font-bold text-stone-900 dark:text-ivory-100 min-w-8 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-3 py-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold"
                >
                  +
                </button>
              </div>

              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Authentic Handcraft</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 space-y-3 border-t border-gold-500/20 mt-4">
            <div className="flex gap-2.5">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex-1 btn-primary py-3 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`p-3 rounded-xl border transition-all ${
                  isWishlisted
                    ? 'bg-maroon-700 text-white border-maroon-700'
                    : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-maroon-700 hover:text-maroon-700'
                }`}
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="text-center">
              <Link
                to={`/product/${product.slug}`}
                onClick={onClose}
                className="text-xs font-bold text-maroon-700 dark:text-gold-400 hover:underline inline-flex items-center gap-1"
              >
                <span>View Full Product Specifications &amp; Reviews</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
