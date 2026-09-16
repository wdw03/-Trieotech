'use client';
import React from 'react';

/**
 * Base Skeleton primitive
 */
export const Skeleton = ({ className = '', style = {}, ...props }) => {
  return (
    <div
      className={`skeleton-shimmer rounded-lg select-none ${className}`}
      style={style}
      aria-hidden="true"
      {...props}
    />
  );
};

/**
 * Skeleton Circle (for avatars, icon badges, status dots)
 */
export const SkeletonCircle = ({ size = 'w-9 h-9', className = '', ...props }) => {
  return (
    <Skeleton
      className={`rounded-full shrink-0 ${size} ${className}`}
      {...props}
    />
  );
};

/**
 * KPI Metric Card Skeleton (Dashboard, Inventory, Payments, Reports)
 */
export const MetricCardSkeleton = ({ className = '' }) => {
  return (
    <div className={`admin-card p-4 space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <SkeletonCircle size="w-7 h-7" />
      </div>
      <Skeleton className="h-7 w-32 rounded-md" />
      <div className="flex items-center gap-2 pt-0.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
};

/**
 * Chart Card Skeleton (for Area, Bar, and Pie charts)
 */
export const ChartCardSkeleton = ({ height = 'h-72', title = 'Analytics' }) => {
  return (
    <div className="admin-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20 rounded-xl" />
          <Skeleton className="h-7 w-20 rounded-xl" />
        </div>
      </div>
      <div className={`${height} w-full rounded-xl bg-slate-900/60 border border-slate-800/60 p-4 flex flex-col justify-between`}>
        <div className="flex justify-between items-center opacity-40">
          <Skeleton className="h-2 w-full max-w-[90%]" />
        </div>
        <div className="flex justify-between items-center opacity-30">
          <Skeleton className="h-2 w-full max-w-[95%]" />
        </div>
        <div className="flex justify-between items-center opacity-20">
          <Skeleton className="h-2 w-full max-w-[85%]" />
        </div>
        <div className="h-24 w-full flex items-end justify-between gap-3 pt-4">
          {[40, 65, 55, 80, 70, 90, 85, 95, 60, 75, 88, 100].map((h, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-lg opacity-60"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-800/60">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-2.5 w-10" />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Orders Table Row Skeleton (10 columns matching Orders.jsx)
 */
export const OrdersTableSkeleton = ({ rows = 7 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="border-b border-slate-800/40">
          {/* Checkbox */}
          <td className="table-td text-center px-3 py-3 w-10">
            <Skeleton className="w-4 h-4 rounded mx-auto" />
          </td>
          {/* Order ID & Date */}
          <td className="table-td px-3.5 py-3 min-w-[130px]">
            <Skeleton className="h-3.5 w-20 mb-1.5" />
            <Skeleton className="h-2.5 w-28 opacity-60" />
          </td>
          {/* Customer */}
          <td className="table-td px-3.5 py-3 min-w-[160px]">
            <Skeleton className="h-3.5 w-24 mb-1" />
            <Skeleton className="h-2.5 w-20 opacity-70 mb-0.5" />
            <Skeleton className="h-2 w-16 opacity-50" />
          </td>
          {/* Items & Thumbnail */}
          <td className="table-td px-3.5 py-3 min-w-[200px]">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-2.5 w-24 opacity-60" />
              </div>
            </div>
          </td>
          {/* Qty */}
          <td className="table-td text-center px-2 py-3 w-14">
            <Skeleton className="h-3.5 w-6 mx-auto rounded" />
          </td>
          {/* Amount */}
          <td className="table-td text-right px-3.5 py-3 min-w-[95px]">
            <Skeleton className="h-3.5 w-16 ml-auto mb-1" />
            <Skeleton className="h-2 w-10 ml-auto opacity-50" />
          </td>
          {/* Payment */}
          <td className="table-td px-3.5 py-3 min-w-[105px]">
            <Skeleton className="h-5 w-20 rounded-full" />
          </td>
          {/* Status */}
          <td className="table-td px-3.5 py-3 min-w-[130px]">
            <Skeleton className="h-6 w-24 rounded-full" />
          </td>
          {/* Courier */}
          <td className="table-td px-3.5 py-3 min-w-[135px]">
            <Skeleton className="h-3.5 w-20 mb-1" />
            <Skeleton className="h-2.5 w-24 opacity-60" />
          </td>
          {/* Actions */}
          <td className="table-td text-right px-3.5 py-3 min-w-[90px]">
            <div className="flex items-center justify-end gap-1.5">
              <SkeletonCircle size="w-7 h-7" />
              <SkeletonCircle size="w-7 h-7" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

/**
 * Products Table Row Skeleton (8 columns matching Products.jsx)
 */
export const ProductsTableSkeleton = ({ rows = 7 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="border-b border-slate-800/40">
          {/* Photos */}
          <td className="table-td w-44">
            <div className="flex items-center gap-1.5">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <Skeleton className="w-7 h-7 rounded-md shrink-0 opacity-70" />
              <Skeleton className="w-7 h-7 rounded-md shrink-0 opacity-50" />
            </div>
          </td>
          {/* Product Name & Category */}
          <td className="table-td max-w-xs">
            <Skeleton className="h-3.5 w-48 mb-1.5" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-2.5 w-24 opacity-60" />
            </div>
          </td>
          {/* Material & Occasion */}
          <td className="table-td max-w-[200px]">
            <Skeleton className="h-3.5 w-32 mb-1" />
            <Skeleton className="h-2.5 w-24 opacity-60" />
          </td>
          {/* Price */}
          <td className="table-td text-right">
            <Skeleton className="h-4 w-16 ml-auto mb-1" />
            <Skeleton className="h-2.5 w-10 ml-auto opacity-50" />
          </td>
          {/* Stock */}
          <td className="table-td text-center">
            <Skeleton className="h-3.5 w-14 mx-auto rounded" />
          </td>
          {/* Badge */}
          <td className="table-td">
            <Skeleton className="h-5 w-20 rounded-full" />
          </td>
          {/* Status */}
          <td className="table-td text-center">
            <Skeleton className="h-5 w-14 mx-auto rounded-full" />
          </td>
          {/* Actions */}
          <td className="table-td text-right">
            <div className="flex items-center justify-end gap-1">
              <SkeletonCircle size="w-7 h-7" />
              <SkeletonCircle size="w-7 h-7" />
              <SkeletonCircle size="w-7 h-7" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

/**
 * Inventory Table Row Skeleton (8 columns matching Inventory.jsx)
 */
export const InventoryTableSkeleton = ({ rows = 7 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="border-b border-slate-800/40">
          {/* Product & Photo */}
          <td className="table-td">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-44" />
                <Skeleton className="h-2.5 w-28 opacity-60" />
              </div>
            </div>
          </td>
          {/* SKU */}
          <td className="table-td">
            <Skeleton className="h-3.5 w-24 rounded font-mono" />
          </td>
          {/* Category */}
          <td className="table-td">
            <Skeleton className="h-3.5 w-20" />
          </td>
          {/* In-Stock */}
          <td className="table-td text-center">
            <Skeleton className="h-4 w-12 mx-auto" />
          </td>
          {/* Reserved */}
          <td className="table-td text-center">
            <Skeleton className="h-4 w-10 mx-auto opacity-70" />
          </td>
          {/* Available */}
          <td className="table-td text-center">
            <Skeleton className="h-4 w-12 mx-auto" />
          </td>
          {/* Status */}
          <td className="table-td text-center">
            <Skeleton className="h-5 w-20 mx-auto rounded-full" />
          </td>
          {/* Actions */}
          <td className="table-td text-right">
            <Skeleton className="h-7 w-24 ml-auto rounded-xl" />
          </td>
        </tr>
      ))}
    </>
  );
};

/**
 * Customers Table Row Skeleton (8 columns matching Customers.jsx)
 */
export const CustomersTableSkeleton = ({ rows = 7 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="border-b border-slate-800/40">
          {/* Avatar & Name */}
          <td className="table-td">
            <div className="flex items-center gap-3">
              <SkeletonCircle size="w-9 h-9" />
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2.5 w-16 opacity-60" />
              </div>
            </div>
          </td>
          {/* Contact */}
          <td className="table-td">
            <Skeleton className="h-3.5 w-32 mb-1" />
            <Skeleton className="h-2.5 w-24 opacity-60" />
          </td>
          {/* Location */}
          <td className="table-td">
            <Skeleton className="h-3.5 w-24 mb-1" />
            <Skeleton className="h-2.5 w-16 opacity-50" />
          </td>
          {/* Orders */}
          <td className="table-td text-center">
            <Skeleton className="h-3.5 w-8 mx-auto" />
          </td>
          {/* Lifetime Spend */}
          <td className="table-td text-right">
            <Skeleton className="h-3.5 w-16 ml-auto" />
          </td>
          {/* Tags */}
          <td className="table-td">
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full opacity-60" />
            </div>
          </td>
          {/* Joined Date */}
          <td className="table-td">
            <Skeleton className="h-3.5 w-20" />
          </td>
          {/* Actions */}
          <td className="table-td text-right">
            <SkeletonCircle size="w-7 h-7 ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
};

/**
 * Payments Table Row Skeleton (8 columns matching Payments.jsx)
 */
export const PaymentsTableSkeleton = ({ rows = 7 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="border-b border-slate-800/40">
          <td className="table-td">
            <Skeleton className="h-3.5 w-28 mb-1" />
            <Skeleton className="h-2.5 w-20 opacity-60" />
          </td>
          <td className="table-td">
            <Skeleton className="h-3.5 w-20" />
          </td>
          <td className="table-td">
            <Skeleton className="h-3.5 w-28 mb-1" />
            <Skeleton className="h-2.5 w-20 opacity-60" />
          </td>
          <td className="table-td">
            <Skeleton className="h-3.5 w-24" />
          </td>
          <td className="table-td">
            <Skeleton className="h-5 w-16 rounded-full" />
          </td>
          <td className="table-td text-right">
            <Skeleton className="h-4 w-16 ml-auto" />
          </td>
          <td className="table-td">
            <Skeleton className="h-5 w-20 rounded-full" />
          </td>
          <td className="table-td text-right">
            <SkeletonCircle size="w-7 h-7 ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
};

/**
 * Shipping Table Row Skeleton (9 columns matching Shipping.jsx)
 */
export const ShippingTableSkeleton = ({ rows = 7 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="border-b border-slate-800/40">
          <td className="table-td text-center px-3 py-3 w-10">
            <Skeleton className="w-4 h-4 rounded mx-auto" />
          </td>
          <td className="table-td">
            <Skeleton className="h-3.5 w-20 mb-1" />
            <Skeleton className="h-2.5 w-24 opacity-60" />
          </td>
          <td className="table-td">
            <Skeleton className="h-3.5 w-28 mb-1" />
            <Skeleton className="h-2.5 w-36 opacity-60" />
          </td>
          <td className="table-td text-center">
            <Skeleton className="h-3.5 w-14 mx-auto" />
          </td>
          <td className="table-td">
            <Skeleton className="h-3.5 w-20" />
          </td>
          <td className="table-td">
            <Skeleton className="h-3.5 w-24 mb-1 font-mono" />
            <Skeleton className="h-2 w-14 opacity-50" />
          </td>
          <td className="table-td">
            <Skeleton className="h-5 w-24 rounded-full" />
          </td>
          <td className="table-td text-center">
            <Skeleton className="h-3.5 w-12 mx-auto" />
          </td>
          <td className="table-td text-right">
            <Skeleton className="h-7 w-20 ml-auto rounded-xl" />
          </td>
        </tr>
      ))}
    </>
  );
};

/**
 * Returns Table Row Skeleton (8 columns matching Returns.jsx)
 */
export const ReturnsTableSkeleton = ({ rows = 7 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="border-b border-slate-800/40">
          <td className="table-td">
            <Skeleton className="h-3.5 w-20 mb-1 font-mono" />
            <Skeleton className="h-2.5 w-24 opacity-60" />
          </td>
          <td className="table-td">
            <Skeleton className="h-3.5 w-20" />
          </td>
          <td className="table-td">
            <Skeleton className="h-3.5 w-24 mb-1" />
            <Skeleton className="h-2.5 w-20 opacity-60" />
          </td>
          <td className="table-td max-w-xs">
            <Skeleton className="h-3.5 w-40 mb-1" />
            <Skeleton className="h-2.5 w-28 opacity-60" />
          </td>
          <td className="table-td text-right">
            <Skeleton className="h-3.5 w-14 ml-auto" />
          </td>
          <td className="table-td">
            <Skeleton className="h-3.5 w-20 mb-1" />
            <Skeleton className="h-2 w-16 opacity-50" />
          </td>
          <td className="table-td">
            <Skeleton className="h-5 w-20 rounded-full" />
          </td>
          <td className="table-td text-right">
            <SkeletonCircle size="w-7 h-7 ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
};

/**
 * Coupons Grid Skeleton (matching Coupons.jsx)
 */
export const CouponsGridSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="admin-card p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <SkeletonCircle size="w-9 h-9 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-2.5 w-16 opacity-60" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-2.5 w-12" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="space-y-1 text-right">
              <Skeleton className="h-2.5 w-14 ml-auto" />
              <Skeleton className="h-4 w-12 ml-auto" />
            </div>
          </div>
          <div className="space-y-2 pt-1">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <Skeleton className="h-3 w-24" />
            <div className="flex gap-2">
              <SkeletonCircle size="w-7 h-7" />
              <SkeletonCircle size="w-7 h-7" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Categories Grid Skeleton (matching Categories.jsx)
 */
export const CategoriesGridSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="admin-card p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-2.5 w-16 opacity-60 font-mono" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full opacity-70" />
          <Skeleton className="h-3 w-3/4 opacity-50" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-2.5 w-24" />
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-6 w-16 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-lg" />
              <Skeleton className="h-6 w-14 rounded-lg" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/60">
            <Skeleton className="h-7 w-16 rounded-xl" />
            <SkeletonCircle size="w-7 h-7" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Blog Table Row Skeleton (matching BlogManagementCms.jsx)
 */
export const BlogTableSkeleton = ({ rows = 6 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="border-b border-slate-800/40">
          <td className="table-td w-20">
            <Skeleton className="w-16 h-12 rounded-xl shrink-0" />
          </td>
          <td className="table-td max-w-sm">
            <Skeleton className="h-3.5 w-56 mb-1.5" />
            <Skeleton className="h-2.5 w-28 opacity-60 font-mono" />
          </td>
          <td className="table-td">
            <Skeleton className="h-5 w-24 rounded-full" />
          </td>
          <td className="table-td">
            <div className="flex items-center gap-2">
              <SkeletonCircle size="w-6 h-6" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 w-14 opacity-50" />
              </div>
            </div>
          </td>
          <td className="table-td">
            <Skeleton className="h-3.5 w-20" />
          </td>
          <td className="table-td">
            <div className="flex gap-1">
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-4 w-12 rounded opacity-60" />
            </div>
          </td>
          <td className="table-td text-center">
            <Skeleton className="h-5 w-16 mx-auto rounded-full" />
          </td>
          <td className="table-td text-right">
            <div className="flex items-center justify-end gap-1">
              <SkeletonCircle size="w-7 h-7" />
              <SkeletonCircle size="w-7 h-7" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

/**
 * CMS Hero Slides Skeleton (matching HomePageCms.jsx)
 */
export const HeroSlidesSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-3.5">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="admin-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex flex-col gap-1">
              <Skeleton className="w-5 h-4 rounded" />
              <Skeleton className="w-5 h-4 rounded" />
            </div>
            <Skeleton className="w-24 h-16 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-64 opacity-70" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-28 opacity-60" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-16 rounded-xl" />
            <SkeletonCircle size="w-8 h-8" />
            <SkeletonCircle size="w-8 h-8" />
          </div>
        </div>
      ))}
    </div>
  );
};
