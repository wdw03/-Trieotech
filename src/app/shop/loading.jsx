import { ProductGridSkeleton } from '../../components/common/LoadingSkeleton';

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <div className="h-3 w-16 skeleton-shimmer rounded" />
        <div className="h-3 w-3 skeleton-shimmer rounded" />
        <div className="h-3 w-28 skeleton-shimmer rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-8 sm:h-10 w-48 sm:w-64 skeleton-shimmer rounded-2xl" />
        <div className="h-4 w-72 skeleton-shimmer rounded-lg" />
      </div>
      <div className="pt-4">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
