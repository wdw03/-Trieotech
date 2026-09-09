'use client';
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const COUPONS = {
  'TRIO10': { code: 'TRIO10', discountType: 'percentage', value: 10, description: '10% off on all ethnic crafts' },
  'FESTIVE20': { code: 'FESTIVE20', discountType: 'percentage', value: 20, description: '20% festive special discount' },
  'FIRSTBUY': { code: 'FIRSTBUY', discountType: 'percentage', value: 15, description: '15% off on your first order' },
  'CRAFT100': { code: 'CRAFT100', discountType: 'flat', value: 100, description: 'Flat ₹100 off on orders above ₹999', minSpend: 999 },
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('trio_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem('trio_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState(Object.values(COUPONS));

  // Dynamic Shiprocket Shipping State
  const [shippingPincode, setShippingPincode] = useState(() => {
    try {
      return localStorage.getItem('trio_pincode') || '';
    } catch {
      return '';
    }
  });
  const [shippingDetails, setShippingDetails] = useState(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  const fetchShippingRate = async (pincode, options = {}) => {
    const cleanPin = String(pincode || '').trim().replace(/\D/g, '').slice(0, 6);
    if (!cleanPin || cleanPin.length !== 6) {
      return { success: false, message: 'Please enter a valid 6-digit delivery pincode' };
    }

    setIsCalculatingShipping(true);
    try {
      const res = await fetch(`/api/shipping/rates?pincode=${cleanPin}&weight=${options.weight || 0.5}&cod=${options.cod ? '1' : '0'}`);
      const data = await res.json();
      if (data && data.available) {
        setShippingDetails(data);
        setShippingPincode(cleanPin);
        try {
          localStorage.setItem('trio_pincode', cleanPin);
        } catch (_) {}
        return { success: true, data };
      } else {
        return { success: false, message: data.message || 'Pincode not serviceable' };
      }
    } catch (err) {
      console.warn('Failed to fetch shipping rate:', err);
      return { success: false, message: 'Failed to calculate shipping rate' };
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  useEffect(() => {
    if (shippingPincode && shippingPincode.length === 6 && !shippingDetails) {
      fetchShippingRate(shippingPincode);
    }
  }, [shippingPincode]);

  // Fetch live available coupons from database
  useEffect(() => {
    let isMounted = true;
    fetch('/api/coupons/available')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && Array.isArray(data.coupons) && data.coupons.length > 0) {
          setAvailableCoupons(data.coupons);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('trio_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem('trio_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('trio_coupon');
      }
    } catch (e) {
      console.error('Failed to save coupon', e);
    }
  }, [appliedCoupon]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const openAuthModal = (productData = null) => {
    if (productData) setPendingProduct(productData);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingProduct(null);
  };

  // Direct internal add to cart (used when user is authenticated or right after login)
  const addToCartDirect = (product, quantity = 1, selectedColor = null, selectedSize = null) => {
    if (!product) return false;

    let price = product.price;
    let originalPrice = product.originalPrice || product.price;
    let image = Array.isArray(product.images) && product.images.length > 0 
      ? product.images[0] 
      : (typeof product.images === 'string' ? product.images : product.image || '/products/shreenathji-statement-patch-1.jpg');
    let colorName = selectedColor;

    if (selectedColor && product.colors && product.colors.length > 0) {
      const matchedColor = product.colors.find(c => c.name === selectedColor);
      if (matchedColor) {
        if (matchedColor.price) price = matchedColor.price;
        if (matchedColor.originalPrice) originalPrice = matchedColor.originalPrice;
        if (matchedColor.image) image = matchedColor.image;
      }
    } else if (product.colors && product.colors.length > 0) {
      colorName = product.colors[0].name;
      if (product.colors[0].image) image = product.colors[0].image;
    }

    const sizeName = selectedSize || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : null);
    const cartItemId = `${product.id}-${colorName || 'default'}-${sizeName || 'default'}`;

    setCartItems(prevItems => {
      const existingIndex = prevItems.findIndex(item => item.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prevItems,
          {
            cartItemId,
            productId: product.id,
            name: product.name,
            slug: product.slug,
            category: product.category,
            price,
            originalPrice,
            image,
            color: colorName,
            size: sizeName,
            quantity,
            product
          }
        ];
      }
    });

    addToast(`Added "${product.name.substring(0, 25)}..." to cart!`, 'success');
    return true;
  };

  // Public addToCart that requires user authentication first
  const addToCart = (product, quantity = 1, selectedColor = null, selectedSize = null) => {
    if (!product) return false;

    // If user is not logged in, block and redirect directly to login page
    if (!user) {
      const pendingItem = { product, quantity, selectedColor, selectedSize };
      setPendingProduct(pendingItem);
      try {
        localStorage.setItem('trio_pending_add_to_cart', JSON.stringify(pendingItem));
      } catch (e) {
        console.error('Failed to save pending item', e);
      }
      setIsAuthModalOpen(false);
      addToast('Please login to your account to add items to cart', 'info');

      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}&action=cart`;
      }
      return false;
    }

    return addToCartDirect(product, quantity, selectedColor, selectedSize);
  };

  // Automatically process pending cart item when user logs in or registers
  useEffect(() => {
    if (user) {
      try {
        const saved = localStorage.getItem('trio_pending_add_to_cart');
        if (saved) {
          const pending = JSON.parse(saved);
          localStorage.removeItem('trio_pending_add_to_cart');
          if (pending?.product) {
            addToCartDirect(pending.product, pending.quantity || 1, pending.selectedColor, pending.selectedSize);
            addToast(`Welcome! "${pending.product.name.substring(0, 25)}..." added to your bag!`, 'success');
            setIsAuthModalOpen(false);
            setPendingProduct(null);
            setIsCartOpen(true);
          }
        }
      } catch (e) {
        console.error('Failed to process pending cart item', e);
      }
    }
  }, [user]);

  const updateQuantity = (cartItemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const removeFromCart = (cartItemId) => {
    setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
    addToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = async (couponCode) => {
    if (!couponCode || !couponCode.trim()) {
      const msg = 'Please enter a coupon code';
      setCouponError(msg);
      return { success: false, message: msg };
    }
    const cleanCode = couponCode.trim().toUpperCase();
    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          subtotal,
          items: cartItems.map((item) => ({
            productId: item.productId || item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        const errorMsg = data.error || 'Invalid coupon code';
        setCouponError(errorMsg);
        addToast(errorMsg, 'error');
        setCouponLoading(false);
        return {
          success: false,
          message: errorMsg,
          errorType: data.errorType,
          applicableProductIds: data.applicableProductIds,
        };
      }

      setAppliedCoupon(data.coupon);
      setCouponError(null);
      addToast(`Coupon "${data.coupon.code}" applied successfully!`, 'success');
      setCouponLoading(false);
      return { success: true, coupon: data.coupon };
    } catch (err) {
      console.error('Coupon validation error:', err);
      // Fallback local check if offline
      const localCoupon = COUPONS[cleanCode];
      if (localCoupon) {
        if (localCoupon.minSpend && subtotal < localCoupon.minSpend) {
          const msg = `Minimum spend of ₹${localCoupon.minSpend} required for ${cleanCode}`;
          setCouponError(msg);
          addToast(msg, 'error');
          setCouponLoading(false);
          return { success: false, message: msg };
        }
        setAppliedCoupon(localCoupon);
        setCouponError(null);
        addToast(`Coupon "${localCoupon.code}" applied successfully!`, 'success');
        setCouponLoading(false);
        return { success: true, coupon: localCoupon };
      }
      const msg = 'Failed to validate coupon. Please try again.';
      setCouponError(msg);
      addToast(msg, 'error');
      setCouponLoading(false);
      return { success: false, message: msg };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    addToast('Coupon removed', 'info');
  };

  // Calculations
  const itemCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cartItems]);

  const originalSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.originalPrice || item.price) * item.quantity, 0);
  }, [cartItems]);

  const productSavings = useMemo(() => {
    return Math.max(0, originalSubtotal - subtotal);
  }, [originalSubtotal, subtotal]);

  // Check if applied coupon is valid for current items in cart
  const isAppliedCouponEligible = useMemo(() => {
    if (!appliedCoupon) return true;
    const applicableIds = appliedCoupon.applicableProductIds || [];
    if (!Array.isArray(applicableIds) || applicableIds.length === 0) return true;
    return cartItems.some((item) =>
      applicableIds.map(String).includes(String(item.productId || item.id || ''))
    );
  }, [appliedCoupon, cartItems]);

  // Dynamically calculate coupon discount strictly on eligible products
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;

    const applicableIds = appliedCoupon.applicableProductIds || [];
    let eligibleSubtotal = 0;

    if (Array.isArray(applicableIds) && applicableIds.length > 0) {
      const eligibleItems = cartItems.filter((item) =>
        applicableIds.map(String).includes(String(item.productId || item.id || ''))
      );

      // If user removed all eligible products, no discount applies
      if (eligibleItems.length === 0) return 0;

      eligibleSubtotal = eligibleItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    } else {
      eligibleSubtotal = subtotal;
    }

    if (appliedCoupon.discountType === 'percentage') {
      let disc = Math.round((eligibleSubtotal * appliedCoupon.value) / 100);
      if (appliedCoupon.maxDiscount) {
        disc = Math.min(disc, appliedCoupon.maxDiscount);
      }
      return disc;
    }

    if (appliedCoupon.discountType === 'flat') {
      return Math.min(eligibleSubtotal, appliedCoupon.value);
    }

    return 0;
  }, [appliedCoupon, cartItems, subtotal]);

  const shipping = useMemo(() => {
    if (subtotal === 0) return 0;
    if (shippingDetails && typeof shippingDetails.shippingFee === 'number') {
      return shippingDetails.shippingFee;
    }
    return 70;
  }, [subtotal, shippingDetails]);

  const total = useMemo(() => {
    if (subtotal === 0) return 0;
    return Math.max(0, subtotal - couponDiscount + shipping);
  }, [subtotal, couponDiscount, shipping]);

  const freeShippingRemaining = useMemo(() => {
    return Math.max(0, 999 - subtotal);
  }, [subtotal]);

  return (
    <CartContext.Provider
      value={{
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
        setShippingPincode,
        shippingDetails,
        setShippingDetails,
        isCalculatingShipping,
        fetchShippingRate,
        appliedCoupon,
        couponError,
        setCouponError,
        couponLoading,
        isAppliedCouponEligible,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        addToCartDirect,
        isAuthModalOpen,
        pendingProduct,
        openAuthModal,
        closeAuthModal,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        availableCoupons,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
