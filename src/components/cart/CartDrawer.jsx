import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Sparkles, ShieldCheck, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { products } from '../../data/products';

export const CartDrawer = () => {
  const navigate = useNavigate();
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
    appliedCoupon,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon
  } = useCart();

  const [couponInput, setCouponInput] = useState('');

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput);
      setCouponInput('');
    }
  };

  const handleProceedToCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  // Upsell items (random 2 popular items not in cart)
  const upsellItems = products
    .filter(p => !cartItems.some(ci => ci.productId === p.id))
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-fade-in flex justify-end">
      <div
        className="w-full max-w-md bg-white dark:bg-[#1A110B] h-full shadow-2xl flex flex-col justify-between overflow-hidden border-l border-gold-500/30 animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-gold-500/20 bg-ivory-100 dark:bg-stone-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-maroon-700 text-white flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-gold-300" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-ivory-100 leading-none">
                Shopping Cart
              </h3>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} selected
              </span>
            </div>
          </div>

          <button
            onClick={closeCart}
            className="p-1.5 rounded-lg text-stone-500 hover:text-maroon-700 dark:hover:text-gold-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="bg-gold-50 dark:bg-stone-900/90 px-4 py-2.5 border-b border-gold-500/20 text-xs">
          {freeShippingRemaining > 0 ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-stone-700 dark:text-gold-300">
                <span>Add ₹{freeShippingRemaining.toLocaleString('en-IN')} more for <strong>FREE Express Shipping</strong></span>
                <span>{Math.round(((999 - freeShippingRemaining) / 999) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold-500 to-maroon-700 transition-all duration-300"
                  style={{ width: `${Math.min(100, ((999 - freeShippingRemaining) / 999) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Congratulations! You qualify for <strong>FREE Express Shipping</strong></span>
            </div>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-gold-500/10 dark:bg-stone-800 flex items-center justify-center mx-auto text-gold-600">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="font-serif font-bold text-base text-stone-900 dark:text-ivory-100">Your cart is empty</p>
                <p className="text-xs text-stone-500">Discover authentic handcrafted ethnic items made by generational Indian karigars.</p>
              </div>
              <Link
                to="/shop"
                onClick={closeCart}
                className="btn-primary text-xs uppercase tracking-wider font-bold py-2.5 px-6 inline-flex"
              >
                Explore Crafts
              </Link>
            </div>
          ) : (
            <>
              {cartItems.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex gap-3 p-3 rounded-xl bg-ivory-50 dark:bg-stone-900/40 border border-gold-500/20 group hover:border-gold-500/40 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0 border border-stone-200 dark:border-stone-700">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <Link
                          to={`/product/${item.slug}`}
                          onClick={closeCart}
                          className="font-serif font-bold text-xs text-stone-900 dark:text-ivory-100 hover:text-maroon-700 dark:hover:text-gold-400 line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="text-stone-400 hover:text-maroon-700 p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Variant Info */}
                      {(item.color || item.size) && (
                        <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5">
                          {item.color && <span>Color: {item.color}</span>}
                          {item.color && item.size && <span>•</span>}
                          {item.size && <span>Size: {item.size}</span>}
                        </div>
                      )}
                    </div>

                    {/* Quantity Stepper & Price */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-stone-300 dark:border-stone-700 rounded-lg overflow-hidden bg-white dark:bg-stone-800">
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="p-1 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-stone-900 dark:text-ivory-100 min-w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="p-1 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-serif font-bold text-xs sm:text-sm text-maroon-800 dark:text-gold-400">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="block text-[10px] text-stone-400 line-through">
                            ₹{(item.originalPrice * item.quantity).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Upsell Row */}
              {upsellItems.length > 0 && (
                <div className="pt-4 border-t border-gold-500/20 space-y-2">
                  <span className="text-[11px] font-bold text-gold-700 dark:text-gold-400 uppercase tracking-wider">
                    You Might Also Like
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {upsellItems.map((up) => (
                      <div
                        key={up.id}
                        className="p-2 rounded-xl bg-ivory-100 dark:bg-stone-900/60 border border-gold-500/20 flex flex-col justify-between"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden mb-1.5 bg-stone-100">
                          <img src={up.images?.[0]} alt={up.name} className="w-full h-full object-cover" />
                        </div>
                        <h5 className="text-[11px] font-bold text-stone-900 dark:text-ivory-100 truncate">{up.name}</h5>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-bold text-maroon-800 dark:text-gold-400">₹{up.price}</span>
                          <Link
                            to={`/product/${up.slug}`}
                            onClick={closeCart}
                            className="text-[10px] text-gold-700 font-bold hover:underline"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Footer Summary & Checkout Button */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 bg-ivory-100 dark:bg-stone-900/90 border-t border-gold-500/30 space-y-3.5">
            {/* Coupon Code Section */}
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Coupon {appliedCoupon.code} applied ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.value}% off` : `₹${appliedCoupon.value} off`})</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-stone-400 hover:text-maroon-700 text-xs font-semibold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Coupon (e.g. FESTIVE20)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-stone-800 border border-gold-500/30 text-stone-900 dark:text-ivory-100 outline-none uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-gold-500 text-white dark:text-maroon-950 text-xs font-bold"
                >
                  Apply
                </button>
              </form>
            )}

            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-900 dark:text-ivory-100">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {productSavings > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Product Savings</span>
                  <span>-₹{productSavings.toLocaleString('en-IN')}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${shipping}`}</span>
              </div>
              <div className="flex justify-between text-sm font-serif font-extrabold text-stone-900 dark:text-ivory-100 pt-2 border-t border-gold-500/20">
                <span>Total Amount</span>
                <span className="text-base text-maroon-800 dark:text-gold-400">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Checkout & View Cart CTAs */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3 rounded-xl btn-primary text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-maroon-md"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                to="/cart"
                onClick={closeCart}
                className="block text-center py-2 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-maroon-700 dark:hover:text-gold-400 hover:underline"
              >
                View Detailed Cart Page
              </Link>
            </div>

            {/* Trust Assurance Badge */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-gold-600" />
              <span>100% Safe &amp; Encrypted Payment Guarantee</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
