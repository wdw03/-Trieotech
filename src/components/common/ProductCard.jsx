'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import RatingStars from './RatingStars';
import Badge from './Badge';

export const ProductCard = ({ product, onQuickView = null, viewMode = 'grid' }) => {
  if (!product) return null;

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedColor, setSelectedColor] = useState(
    product.colors && product.colors.length > 0 ? product.colors[0] : null
  );
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isWishlisted = isInWishlist(product.id);

  // Extract clean list of valid product images
  const productImages = useMemo(() => {
    let list = [];
    if (Array.isArray(product.images)) {
      list = product.images;
    } else if (typeof product.images === 'string' && product.images.trim()) {
      try {
        const parsed = JSON.parse(product.images);
        list = Array.isArray(parsed) ? parsed : [product.images];
      } catch {
        list = product.images.split(/\s+/);
      }
    } else if (product.image) {
      list = [product.image];
    }
    return list
      .map((url) => (typeof url === 'string' ? url.trim() : ''))
      .filter((url) => url && url.length > 0);
  }, [product.images, product.image]);

  // Active price and image calculation based on selected color variant
  const hasMultipleColors = Array.isArray(product.colors) && product.colors.length > 1;
  const activePrice = (hasMultipleColors && selectedColor?.price !== undefined && selectedColor?.price !== null)
    ? Number(selectedColor.price)
    : (Number(product.price) || Number(selectedColor?.price) || 0);

  const activeOriginalPrice = (hasMultipleColors && selectedColor?.originalPrice !== undefined && selectedColor?.originalPrice !== null)
    ? Number(selectedColor.originalPrice)
    : (Number(product.originalPrice ?? product.original_price) || Number(selectedColor?.originalPrice) || activePrice);

  // Check if selectedColor has a genuine variant photo (not a stale default dummy placeholder)
  const isSelectedColorGenuine = Boolean(
    hasMultipleColors &&
    selectedColor?.image &&
    selectedColor.image !== '/products/pearl-zardosi-patch-1.jpg'
  );

  // Primary cover image:
  // 1. Color variant image if genuinely selected from multi-variants
  // 2. First image added by user (productImages[0])
  // 3. Fallback to product.image or default
  const primaryImage = isSelectedColorGenuine
    ? selectedColor.image
    : (productImages[0] || product.image || '/products/shreenathji-statement-patch-1.jpg');

  const activeImage = imgError
    ? '/products/shreenathji-statement-patch-1.jpg'
    : primaryImage;

  // Secondary image on hover:
  // Rule:
  // - If product has 2 or more images: show 2nd image (productImages[1]) on hover
  // - If product has only 1 image: DO NOT swap on hover (show only that 1 image)
  const hasMultipleImages = productImages.length >= 2 && Boolean(productImages[1]) && productImages[1] !== activeImage;
  const secondaryImage = hasMultipleImages ? productImages[1] : activeImage;

  // Out of stock and inventory metrics
  const isOutOfStock = product.inStock === false || product.in_stock === false || Number(product.stock) <= 0 || (selectedColor?.stock !== undefined && Number(selectedColor.stock) <= 0);
  const remainingStock = selectedColor?.stock !== undefined ? Number(selectedColor.stock) : Number(product.stock || 0);
  const totalSold = Number(product.sold_quantity ?? product.soldQuantity ?? 0);

  // Compute discount percentage
  const discountPercent = activeOriginalPrice && activeOriginalPrice > activePrice
    ? Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100)
    : product.discount || 0;

  // Determine top badge
  const getBadgeType = () => {
    if (product.isBestSeller || product.is_best_seller) return 'Best Seller';
    if (product.isFestivalSpecial || product.is_festival_special) return 'Festival Special';
    if (product.isWeddingSpecial || product.is_wedding_special) return 'Wedding Special';
    if (product.isTrending || product.is_trending) return 'Trending';
    if (product.isNew || product.is_new) return 'New Arrival';
    if (product.isHandmade || product.is_handmade) return 'Handmade';
    return null;
  };

  const badgeType = getBadgeType();

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ ...product, price: activePrice, originalPrice: activeOriginalPrice }, 1, selectedColor?.name, product.sizes?.[0]);
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickViewClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) onQuickView(product);
  };

  // Horizontal List View
  if (viewMode === 'list') {
    return (
      <div
        className="group relative ethnic-card flex flex-col sm:flex-row overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 rounded-2xl border border-gold-500/20"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Left Image */}
        <div className="relative w-full sm:w-56 md:w-64 aspect-square sm:aspect-auto shrink-0 bg-ivory-200 dark:bg-stone-900 overflow-hidden">
          <Link href={`/product/${product.slug}`} className="block w-full h-full min-h-[190px] relative">
            <img
              src={activeImage}
              alt={product.name}
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-105 ${
                hasMultipleImages ? 'opacity-100 group-hover:opacity-0' : 'opacity-100'
              } ${isOutOfStock ? 'filter grayscale contrast-125 opacity-70' : ''}`}
              loading="lazy"
            />
            {hasMultipleImages && (
              <img
                src={secondaryImage}
                alt={`${product.name} alternate view`}
                className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-105 opacity-0 group-hover:opacity-100 pointer-events-none ${
                  isOutOfStock ? 'filter grayscale contrast-125 opacity-70' : ''
                }`}
                loading="lazy"
              />
            )}
          </Link>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
              <div className="px-3 py-1 bg-stone-900/95 text-white border border-stone-600/80 rounded-full text-[11px] font-black tracking-widest uppercase shadow-xl flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Out of Stock</span>
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 items-start">
            {badgeType && <Badge type={badgeType} />}
            {discountPercent > 0 && (
              <span className="badge-ribbon bg-maroon-700 text-white font-extrabold border border-white/40">
                {discountPercent}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Right Info & Actions */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3 min-w-0">
          <div className="space-y-2">
            {/* Top row: Category, Rating & Icons */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-gold-700 dark:text-gold-400 truncate">
                {product.category} {product.subcategory ? `• ${product.subcategory}` : ''}
              </span>
              <div className="flex items-center gap-2">
                <RatingStars rating={product.rating || 4.8} reviewCount={product.reviewCount || 10} size="xs" />
                <button
                  onClick={handleWishlistClick}
                  className={`p-1.5 rounded-full transition-colors ml-1 ${isWishlisted
                      ? 'text-maroon-700 dark:text-gold-400'
                      : 'text-stone-400 hover:text-maroon-700 dark:hover:text-gold-400'
                    }`}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                {onQuickView && (
                  <button
                    onClick={handleQuickViewClick}
                    className="p-1.5 rounded-full text-stone-400 hover:text-gold-600 transition-colors"
                    aria-label="Quick view product"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Product Title */}
            <Link href={`/product/${product.slug}`} className="block">
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-ivory-100 group-hover:text-maroon-700 dark:group-hover:text-gold-400 transition-colors line-clamp-2">
                {product.name}
              </h3>
            </Link>

            {/* Description */}
            <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
              {product.short_description || product.shortDescription || product.description || 'Authentic handcrafted piece crafted by master artisans.'}
            </p>

            {/* Variant Colors */}
            {product.colors && product.colors.length > 1 && (
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-stone-500 mr-1">Colors:</span>
                {product.colors.slice(0, 5).map((col, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedColor(col);
                    }}
                    className={`w-4 h-4 rounded-full border transition-all ${selectedColor?.name === col.name
                        ? 'ring-2 ring-gold-500 ring-offset-1 scale-110'
                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                      }`}
                    style={{ backgroundColor: col.hex || '#C5A028' }}
                    title={col.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bottom Bar: Price & Add to Cart */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-gold-500/10 dark:border-stone-800">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-serif font-extrabold text-lg sm:text-xl text-maroon-800 dark:text-gold-400">
                ₹{activePrice?.toLocaleString('en-IN')}
              </span>
              {activeOriginalPrice && activeOriginalPrice > activePrice && (
                <span className="text-xs text-stone-400 line-through">
                  ₹{activeOriginalPrice?.toLocaleString('en-IN')}
                </span>
              )}
              {isOutOfStock ? (
                <span className="hidden sm:inline text-[11px] text-rose-600 font-bold ml-2">● Out of Stock</span>
              ) : remainingStock <= 10 ? (
                <span className="hidden sm:inline text-[11px] text-amber-600 font-bold ml-2 animate-pulse">● Only {remainingStock} left!</span>
              ) : (
                <span className="hidden sm:inline text-[11px] text-emerald-600 font-semibold ml-2">● In Stock</span>
              )}
              {totalSold > 0 && (
                <span className="hidden sm:inline text-[10px] text-stone-400 font-medium">({totalSold} sold)</span>
              )}
            </div>

            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className={`py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all ${isOutOfStock
                  ? 'bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-400/30'
                  : 'btn-primary active:scale-95 cursor-pointer'
                }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isOutOfStock ? 'Out of Stock' : 'Quick Add to Cart'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid View (Default)
  return (
    <div
      className="group relative ethnic-card flex flex-col h-full overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-ivory-200 dark:bg-stone-900">
        <Link href={`/product/${product.slug}`} className="block w-full h-full relative">
          <img
            src={activeImage}
            alt={product.name}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-108 ${
              hasMultipleImages ? 'opacity-100 group-hover:opacity-0' : 'opacity-100'
            } ${isOutOfStock ? 'filter grayscale contrast-125 opacity-70' : ''}`}
            loading="lazy"
          />
          {hasMultipleImages && (
            <img
              src={secondaryImage}
              alt={`${product.name} alternate view`}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-108 opacity-0 group-hover:opacity-100 pointer-events-none ${
                isOutOfStock ? 'filter grayscale contrast-125 opacity-70' : ''
              }`}
              loading="lazy"
            />
          )}
        </Link>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
            <div className="px-3.5 py-1 bg-stone-900/95 text-white border border-stone-600/80 rounded-full text-[11px] font-black tracking-widest uppercase shadow-xl flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Out of Stock</span>
            </div>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 items-start">
          {badgeType && <Badge type={badgeType} />}
          {discountPercent > 0 && (
            <span className="badge-ribbon bg-maroon-700 text-white font-extrabold border border-white/40">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Floating Action Buttons */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
          <button
            onClick={handleWishlistClick}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition-all duration-200 ${isWishlisted
                ? 'bg-maroon-700 text-white shadow-maroon-sm scale-105'
                : 'bg-white/90 dark:bg-stone-900/90 text-stone-700 dark:text-stone-300 hover:text-maroon-700 dark:hover:text-gold-400 hover:scale-110'
              }`}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>

          {onQuickView && (
            <button
              onClick={handleQuickViewClick}
              className="w-9 h-9 rounded-full bg-white/90 dark:bg-stone-900/90 text-stone-700 dark:text-stone-300 hover:text-gold-600 hover:scale-110 flex items-center justify-center backdrop-blur-md shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200"
              aria-label="Quick view product"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Add Overlay on Desktop Hover */}
        <div className="absolute inset-x-3 bottom-3 hidden sm:block opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className={`w-full py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${isOutOfStock
                ? 'bg-stone-800 text-stone-400 border border-stone-700 cursor-not-allowed'
                : 'btn-gold cursor-pointer'
              }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isOutOfStock ? 'Out of Stock' : 'Quick Add to Cart'}</span>
          </button>
        </div>
      </div>

      {/* Product Content Info */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-stone-400">
            <span className="font-semibold uppercase tracking-wider text-gold-700 dark:text-gold-400 truncate">
              {product.category}
            </span>
            <RatingStars rating={product.rating || 4.8} reviewCount={product.reviewCount || 10} size="xs" />
          </div>

          {/* Product Title */}
          <Link href={`/product/${product.slug}`} className="block mt-1">
            <h3 className="font-serif font-bold text-xs sm:text-sm text-stone-900 dark:text-ivory-100 line-clamp-2 leading-snug group-hover:text-maroon-700 dark:group-hover:text-gold-400 transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Variant Swatches (if available) */}
        {product.colors && product.colors.length > 1 && (
          <div className="flex items-center gap-1.5 pt-1">
            {product.colors.slice(0, 4).map((col, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedColor(col);
                }}
                className={`w-4 h-4 rounded-full border transition-all ${selectedColor?.name === col.name
                    ? 'ring-2 ring-gold-500 ring-offset-1 scale-110'
                    : 'opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                style={{ backgroundColor: col.hex || '#C5A028' }}
                title={col.name}
                aria-label={`Select color ${col.name}`}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-[10px] text-stone-400">+{product.colors.length - 4}</span>
            )}
          </div>
        )}

        {/* Price & Mobile Add Button */}
        <div className="pt-2 border-t border-gold-500/10 dark:border-stone-800 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-serif font-extrabold text-base sm:text-lg text-maroon-800 dark:text-gold-400">
                ₹{activePrice?.toLocaleString('en-IN')}
              </span>
              {activeOriginalPrice && activeOriginalPrice > activePrice && (
                <span className="text-xs text-stone-400 line-through">
                  ₹{activeOriginalPrice?.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isOutOfStock ? (
                <span className="text-[10px] text-rose-600 font-bold">● Out of Stock</span>
              ) : remainingStock <= 10 ? (
                <span className="text-[10px] text-amber-600 font-bold animate-pulse">● Only {remainingStock} left!</span>
              ) : (
                <span className="text-[10px] text-emerald-600 font-semibold">● In Stock</span>
              )}
              {totalSold > 0 && (
                <span className="text-[10px] text-stone-400">({totalSold} sold)</span>
              )}
            </div>
          </div>

          {/* Mobile Quick Add Button */}
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className={`sm:hidden p-2 rounded-lg transition-all ${isOutOfStock
                ? 'bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-400/30'
                : 'bg-maroon-700 text-white hover:bg-maroon-800 active:scale-95 shadow-xs cursor-pointer'
              }`}
            aria-label="Add to cart"
            title={isOutOfStock ? "Out of Stock" : "Add to cart"}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
