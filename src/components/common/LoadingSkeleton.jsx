import React from 'react';

export const ProductCardSkeleton = () => {
  return (
    <div className="ethnic-card flex flex-col h-full overflow-hidden animate-pulse">
      <div className="aspect-square w-full bg-stone-200 dark:bg-stone-800" />
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex justify-between items-center">
          <div className="h-3 w-16 bg-stone-200 dark:bg-stone-800 rounded" />
          <div className="h-3 w-12 bg-stone-200 dark:bg-stone-800 rounded" />
        </div>
        <div className="h-4 w-full bg-stone-200 dark:bg-stone-800 rounded" />
        <div className="h-4 w-2/3 bg-stone-200 dark:bg-stone-800 rounded" />
        <div className="pt-2 mt-auto border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
          <div className="h-5 w-20 bg-stone-200 dark:bg-stone-800 rounded" />
          <div className="h-8 w-8 bg-stone-200 dark:bg-stone-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const ProductGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

export default ProductCardSkeleton;
