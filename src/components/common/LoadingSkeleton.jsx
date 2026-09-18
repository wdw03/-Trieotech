'use client';
import React from 'react';

/**
 * Base Shimmer Skeleton primitive
 */
export const Skeleton = ({ className = '', style = {}, ...props }) => (
  <div
    className={`skeleton-shimmer rounded-lg select-none ${className}`}
    style={style}
    {...props}
  />
);

/**
 * Product Card Grid Skeleton (Phone & PC)
 * Matches exact aspect ratio and dimensions of ProductCard.jsx
 */
export const ProductCardSkeleton = ({ viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return <ProductCardListSkeleton />;
  }

  return (
    <div className="ethnic-card flex flex-col h-full overflow-hidden border border-gold-500/20 rounded-2xl bg-white dark:bg-stone-900 shadow-xs">
      {/* Product Image Box */}
      <div className="relative aspect-square w-full skeleton-shimmer overflow-hidden">
        {/* Wishlist button placeholder */}
        <div className="absolute top-2.5 right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/70 dark:bg-stone-800/70 backdrop-blur-xs" />
        {/* Badge pill placeholder */}
        <div className="absolute top-2.5 left-2.5 w-16 sm:w-20 h-4.5 sm:h-5 rounded-full bg-white/70 dark:bg-stone-800/70" />
      </div>

      {/* Content Area */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2 sm:gap-2.5">
        {/* Category & Rating */}
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20 rounded" />
          <Skeleton className="h-2.5 sm:h-3 w-10 sm:w-12 rounded" />
        </div>

        {/* Product Title (2 lines) */}
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 sm:h-3.5 w-full rounded" />
          <Skeleton className="h-3 sm:h-3.5 w-3/4 rounded" />
        </div>

        {/* Price & Action Button */}
        <div className="pt-2 mt-auto border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
          <div className="space-y-1">
            <Skeleton className="h-4 sm:h-5 w-16 sm:w-20 rounded" />
            <Skeleton className="h-2.5 sm:h-3 w-10 sm:w-12 rounded opacity-60" />
          </div>
          <Skeleton className="h-8 w-8 sm:h-8 sm:w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * Product Card List View Skeleton
 */
export const ProductCardListSkeleton = () => {
  return (
    <div className="ethnic-card flex flex-col sm:flex-row items-stretch overflow-hidden border border-gold-500/20 rounded-2xl bg-white dark:bg-stone-900 p-3 sm:p-4 gap-4 shadow-xs">
      <div className="w-full sm:w-44 aspect-square sm:aspect-auto rounded-xl skeleton-shimmer shrink-0" />
      <div className="flex flex-col flex-1 justify-between gap-3 min-w-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-3 w-14 rounded" />
          </div>
          <Skeleton className="h-4 sm:h-5 w-full rounded" />
          <Skeleton className="h-4 sm:h-5 w-2/3 rounded" />
          <Skeleton className="h-3 w-4/5 rounded opacity-70" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
          <Skeleton className="h-5 sm:h-6 w-24 rounded" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * Responsive Product Grid Skeleton (Phone 2 cols, Desktop 3-4 cols)
 */
export const ProductGridSkeleton = ({ count = 8, viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardListSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Product Carousel Skeleton (for Home page strips)
 */
export const ProductCarouselSkeleton = ({ count = 4 }) => {
  return (
    <div className="py-6 sm:py-10 space-y-4 sm:space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between px-4 sm:px-0">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-6 sm:h-8 w-48 sm:w-64 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>

      {/* Grid / Horizontal Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

/**
 * Comprehensive Product Detail Page Skeleton (for /product/[slug])
 * Phone single-column stack, Desktop 2-column layout
 */
export const ProductDetailSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12 animate-in fade-in duration-300">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-14 rounded" />
        <Skeleton className="h-3 w-3 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-3 rounded" />
        <Skeleton className="h-3 w-36 rounded" />
      </div>

      {/* Main Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          {/* Main Large Image */}
          <div className="aspect-square w-full rounded-3xl skeleton-shimmer border border-gold-500/20 shadow-md relative overflow-hidden" />
          {/* Thumbnails Row */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 sm:gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl sm:rounded-2xl skeleton-shimmer border border-gold-500/10"
              />
            ))}
          </div>
        </div>

        {/* Right Column: Product Info & Actions */}
        <div className="space-y-5 sm:space-y-6">
          {/* Brand & Badge */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>

          {/* Product Title */}
          <div className="space-y-2">
            <Skeleton className="h-6 sm:h-8 w-full rounded-xl" />
            <Skeleton className="h-6 sm:h-8 w-4/5 rounded-xl" />
          </div>

          {/* Rating & Reviews */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>

          {/* Price & Discount Bar */}
          <div className="p-4 rounded-2xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/20 flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <Skeleton className="h-7 sm:h-9 w-24 sm:w-32 rounded-xl" />
              <Skeleton className="h-4 sm:h-5 w-16 rounded" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>

          {/* Color Variants Placeholder */}
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-32 rounded" />
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="w-10 h-10 rounded-full" />
            </div>
          </div>

          {/* Size / Sets Selector */}
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-28 rounded" />
            <div className="flex items-center gap-2.5 flex-wrap">
              <Skeleton className="h-10 w-28 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
          </div>

          {/* Quantity & CTA Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-28 rounded-xl" />
              <Skeleton className="h-12 flex-1 rounded-xl" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>

          {/* Delivery & Pincode Checker Skeleton */}
          <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
            <Skeleton className="h-3.5 w-36 rounded" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 w-20 rounded-xl" />
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Category Page Header Skeleton
 */
export const CategoryHeaderSkeleton = () => {
  return (
    <div className="relative py-8 sm:py-14 px-4 sm:px-8 rounded-3xl skeleton-shimmer overflow-hidden mb-8 border border-gold-500/20">
      <div className="max-w-2xl space-y-3">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-8 sm:h-12 w-3/4 rounded-2xl" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-2/3 rounded-lg" />
      </div>
    </div>
  );
};

/**
 * Shopping Cart Skeleton (for /cart)
 */
export const CartSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-500/20 pb-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-44 rounded-lg" />
        </div>
      </div>

      {/* Main Cart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Cart Items (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60"
            >
              <Skeleton className="w-full sm:w-24 h-24 rounded-xl shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-3/4 rounded-lg" />
                  <Skeleton className="h-3.5 w-1/3 rounded" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Order Summary (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl border border-gold-500/20 bg-white dark:bg-stone-900/60 space-y-5">
          <Skeleton className="h-6 w-36 rounded-lg" />
          <div className="space-y-3 pt-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          </div>
          <div className="border-t border-stone-200 dark:border-stone-800 pt-3 flex justify-between">
            <Skeleton className="h-6 w-20 rounded" />
            <Skeleton className="h-6 w-24 rounded" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * Blog List Page Skeleton (for /blog)
 */
export const BlogListSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <Skeleton className="h-4 w-32 rounded" />
      {/* Featured Blog Skeleton */}
      <div className="rounded-3xl border border-gold-500/20 bg-white dark:bg-stone-900/50 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <Skeleton className="lg:col-span-7 h-64 sm:h-96 w-full rounded-2xl" />
        <div className="lg:col-span-5 space-y-4">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-8 sm:h-10 w-full rounded-xl" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-4/5 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>
      {/* 3-Col Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-stone-200 dark:border-stone-800 p-4 space-y-3">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-5 w-3/4 rounded-lg" />
            <Skeleton className="h-3.5 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Blog Detail Page Skeleton (for /blog/[slug])
 */
export const BlogDetailSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Skeleton className="h-4 w-36 rounded" />
      <Skeleton className="h-4 w-24 rounded-full" />
      <Skeleton className="h-10 sm:h-14 w-full rounded-2xl" />
      <div className="flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>
      <Skeleton className="aspect-video w-full rounded-3xl" />
      <div className="space-y-4 pt-4">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;


