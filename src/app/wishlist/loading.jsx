import Breadcrumb from '../../components/common/Breadcrumb';
import { ProductGridSkeleton, Skeleton } from '../../components/common/LoadingSkeleton';

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <Breadcrumb items={[{ name: 'Wishlist', url: '/wishlist' }]} />
      <div className="flex items-center justify-between border-b border-gold-500/20 pb-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-8 w-56 rounded-xl" />
        </div>
      </div>
      <ProductGridSkeleton count={4} />
    </div>
  );
}
