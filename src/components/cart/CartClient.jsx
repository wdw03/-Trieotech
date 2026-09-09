'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import ProductCard from '../../components/common/ProductCard';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { products as fallbackProducts } from '../../data/products';
import { fetchLiveProducts, normalizeProduct } from '../../lib/api/store';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Tag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function CartClient() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const {
    cartItems,
    itemCount,
    subtotal,
    originalSubtotal,
    productSavings,
    couponDiscount,
    shipping,
    total,
    freeShippingRemaining,
    shippingPincode,
    shippingDetails,
    isCalculatingShipping,
    fetchShippingRate,
    appliedCoupon,
    couponError,
    couponLoading,
    isAppliedCouponEligible,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    availableCoupons
  } = useCart();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [pincodeInput, setPincodeInput] = useState(shippingPincode || '');
  const [allProducts, setAllProducts] = useState(() => fallbackProducts.map(normalizeProduct));

  React.useEffect(() => {
    if (shippingPincode) {
      setPincodeInput(shippingPincode);
    }
  }, [shippingPincode]);

  React.useEffect(() => {
    let isMounted = true;
    fetchLiveProducts({ limit: 20 })
      .then((data) => {
        if (isMounted && data?.products?.length) {
          setAllProducts(data.products);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (couponCodeInput.trim()) {
      const res = await applyCoupon(couponCodeInput);
      if (res?.success) {
        setCouponCodeInput('');
      }
    }
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      addToast?.('Please login to your account to proceed to checkout', 'info');
      router.push(`/login?redirect=${encodeURIComponent('/checkout')}`);
      return;
    }
    router.push('/checkout');
  };

  // Upsell crafts
  const upsellProducts = allProducts
    .filter(p => !cartItems.some(ci => ci.productId === p.id))
    .slice(0, 4);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
                <Breadcrumb items={[{ name: 'Cart', url: '/cart' }]} />
        <EmptyState
          icon={ShoppingBag}
          title="Your Handcraft Shopping Bag is Empty"
          description="Explore our authentic Indian collection of zardosi embroidery patches, pure copper drinkware, and devotional mandir decor."
          actionText="Start Shopping"
          actionUrl="/shop"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      
      <Breadcrumb items={[{ name: 'Shopping Cart', url: '/cart' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-500/20 pb-4">
        <div>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100">
            Artisan Shopping Bag ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Handcrafted with love by master Indian karigars
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-bold text-maroon-700 dark:text-gold-400 hover:underline flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All Items</span>
        </button>
      </div>

      {/* Free Shipping Progress Notification */}
      <div className="p-4 rounded-2xl bg-gold-50 dark:bg-stone-900 border border-gold-500/30 text-xs">
        {freeShippingRemaining > 0 ? (
          <div className="space-y-2">
            <div className="flex justify-between font-bold text-stone-800 dark:text-gold-300">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-maroon-700 dark:text-gold-400" />
                Add ₹{freeShippingRemaining?.toLocaleString('en-IN')} more to unlock <strong>FREE Express Shipping</strong>
              </span>
              <span>{Math.round(((999 - freeShippingRemaining) / 999) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-500 to-maroon-700 transition-all duration-300"
                style={{ width: `${Math.min(100, ((999 - freeShippingRemaining) / 999) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>You have qualified for <strong>FREE Insured Express Delivery</strong> on this order!</span>
          </div>
        )}
      </div>

      {/* Main Cart Grid: Left Items + Right Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Cart Items List (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="ethnic-card p-4 sm:p-6 rounded-3xl space-y-4 divide-y divide-gold-500/10">
            {cartItems.map((item) => (
              <div
                key={item.cartItemId}
                className="pt-4 first:pt-0 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
              >
                {/* Product Thumbnail & Details */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-20 sm:w-24 aspect-square rounded-2xl overflow-hidden bg-stone-100 shrink-0 border border-gold-500/20 shadow-xs">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700 dark:text-gold-400">
                      {item.category}
                    </span>
                    <Link
                      href={`/product/${item.slug}`}
                      className="font-serif font-bold text-xs sm:text-sm text-stone-900 dark:text-ivory-100 hover:text-maroon-700 dark:hover:text-gold-400 block line-clamp-2 leading-snug"
                    >
                      {item.name}
                    </Link>

                    {/* Color & Size Variant */}
                    <div className="flex items-center gap-3 text-[11px] text-stone-500">
                      {item.color && <span>Shade: <strong className="text-stone-700 dark:text-stone-300">{item.color}</strong></span>}
                      {item.size && <span>• Size: <strong className="text-stone-700 dark:text-stone-300">{item.size}</strong></span>}
                    </div>

                    {/* Unit Price */}
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="font-serif font-bold text-xs sm:text-sm text-maroon-800 dark:text-gold-400">
                        ₹{item.price?.toLocaleString('en-IN')}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-[11px] text-stone-400 line-through">
                          ₹{item.originalPrice?.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stepper + Subtotal + Remove */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-stone-300 dark:border-stone-700 rounded-xl overflow-hidden bg-white dark:bg-stone-900">
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      className="p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-stone-900 dark:text-ivory-100 min-w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      className="p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right min-w-20">
                    <span className="font-serif font-black text-sm sm:text-base text-stone-900 dark:text-ivory-100">
                      ₹{(item.price * item.quantity)?.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.cartItemId)}
                    className="p-2 text-stone-400 hover:text-maroon-700 rounded-lg hover:bg-maroon-50 dark:hover:bg-maroon-950/40 transition-colors"
                    aria-label="Remove item"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-maroon-700 dark:text-gold-400">
            <Link href="/shop" className="hover:underline inline-flex items-center gap-1.5">
              ← Continue Exploring Indian Handicrafts
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="ethnic-card p-6 rounded-3xl space-y-5 sticky top-28">
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-ivory-100 pb-3 border-b border-gold-500/20">
              Order Summary
            </h3>

            {/* Coupon Code Box */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-gold-600" /> Apply Coupon Code
              </span>

              {appliedCoupon ? (
                !isAppliedCouponEligible ? (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/40 text-xs text-rose-800 dark:text-rose-200 space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>This item is not eligible for this coupon code</span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs font-bold text-rose-700 hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-100 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Coupon <strong>{appliedCoupon.code}</strong> applies only to specific craft products not found in your cart.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        Code {appliedCoupon.code} Applied!
                      </span>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400">
                        {appliedCoupon.applicableProductNames?.length > 0
                          ? `Applied strictly to ${appliedCoupon.applicableProductNames.length} eligible product(s)`
                          : appliedCoupon.description}
                      </p>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs font-bold text-maroon-700 dark:text-gold-400 hover:underline ml-2"
                    >
                      Remove
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. FESTIVE20"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 uppercase text-stone-900 dark:text-ivory-100 font-mono tracking-wider outline-none focus:border-gold-500"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading}
                      className="px-4 py-2 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center justify-center min-w-[70px]"
                    >
                      {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                    </button>
                  </form>

                  {couponError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{couponError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Available Coupons List */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-gold-700 dark:text-gold-400 uppercase tracking-wider block mb-1">
                  Active Offers:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {availableCoupons.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => applyCoupon(c.code)}
                      className="px-2 py-0.5 rounded-md bg-gold-500/10 hover:bg-gold-500/20 text-gold-800 dark:text-gold-300 border border-gold-500/30 text-[10px] font-bold font-mono"
                    >
                      {c.code}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic Shipping Pincode Estimator */}
            <div className="pt-3 border-t border-gold-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-gold-600" /> Check Delivery &amp; Shipping
                </span>
                {shippingDetails?.courierName && (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[160px]">
                    via {shippingDetails.courierName}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter 6-digit Pincode"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setPincodeInput(val);
                    if (val.length === 6) {
                      fetchShippingRate(val);
                    }
                  }}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-stone-900 dark:text-ivory-100 font-mono tracking-wider outline-none focus:border-gold-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (pincodeInput.length === 6) {
                      fetchShippingRate(pincodeInput);
                    }
                  }}
                  disabled={pincodeInput.length !== 6 || isCalculatingShipping}
                  className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-gold-500 hover:bg-maroon-800 text-white dark:text-maroon-950 text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center min-w-[65px]"
                >
                  {isCalculatingShipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Check'}
                </button>
              </div>
              {shippingDetails && (
                <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                  <span>{shippingDetails.courierName ? `${shippingDetails.courierName} (${shippingDetails.etd || '2-4 days'})` : 'Live Shiprocket Rate'}</span>
                  <span className="font-bold">{shippingDetails.shippingFee === 0 ? 'FREE' : `₹${shippingDetails.shippingFee}`}</span>
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 pt-3 border-t border-gold-500/20 text-xs text-stone-600 dark:text-stone-300">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-stone-900 dark:text-ivory-100">
                  ₹{subtotal?.toLocaleString('en-IN')}
                </span>
              </div>

              {productSavings > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>Product Savings</span>
                  <span>-₹{productSavings?.toLocaleString('en-IN')}</span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount?.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="flex items-center gap-1.5">
                  Shipping Fee
                  {isCalculatingShipping && <Loader2 className="w-3 h-3 animate-spin text-gold-600" />}
                </span>
                <span>
                  {shipping === 0 ? (
                    <strong className="text-emerald-600 dark:text-emerald-400">FREE EXPRESS</strong>
                  ) : (
                    `₹${shipping}`
                  )}
                </span>
              </div>

              <div className="flex justify-between text-sm font-serif font-black text-stone-900 dark:text-ivory-100 pt-3 border-t border-gold-500/20">
                <span>Estimated Total</span>
                <span className="text-lg text-maroon-800 dark:text-gold-400">
                  ₹{total?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Checkout Action CTA */}
            <button
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 rounded-2xl btn-primary text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-maroon-md"
            >
              <span>Proceed to Secure Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Reassurances */}
            <div className="pt-2 space-y-2 text-[11px] text-stone-500 dark:text-stone-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gold-600" />
                <span>256-bit Bank Grade Encrypted Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-gold-600" />
                <span>7-Day Doorstep Replacement Guarantee</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Upsell Recommendation Row */}
      {upsellProducts.length > 0 && (
        <div className="pt-10 border-t border-gold-500/30 space-y-6">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gold-700 dark:text-gold-400">
              Pair with Your Selection
            </span>
            <h2 className="font-serif font-black text-xl sm:text-2xl text-stone-900 dark:text-ivory-100">
              Recommended Crafts for You
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {upsellProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};


