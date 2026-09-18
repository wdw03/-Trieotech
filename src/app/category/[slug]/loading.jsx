import { ProductGridSkeleton, CategoryHeaderSkeleton } from '../../../components/common/LoadingSkeleton';

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <div className="h-3 w-14 skeleton-shimmer rounded" />
        <div className="h-3 w-3 skeleton-shimmer rounded" />
        <div className="h-3 w-20 skeleton-shimmer rounded" />
      </div>
      <CategoryHeaderSkeleton />
      <div className="pt-4">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
