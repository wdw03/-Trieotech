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

    // If user is not logged in, block and prompt authentication modal
    if (!user) {
      const pendingItem = { product, quantity, selectedColor, selectedSize };
      setPendingProduct(pendingItem);
      try {
        localStorage.setItem('trio_pending_add_to_cart', JSON.stringify(pendingItem));
      } catch (e) {
        console.error('Failed to save pending item', e);
      }
      setIsAuthModalOpen(true);
      addToast('Please sign in or register to add items to your cart', 'info');
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

  const applyCoupon = (couponCode) => {
    if (!couponCode) return { success: false, message: 'Please enter a coupon code' };
    const cleanCode = couponCode.trim().toUpperCase();
    const coupon = COUPONS[cleanCode];

    if (!coupon) {
      addToast('Invalid coupon code. Try "TRIO10" or "FESTIVE20"', 'error');
      return { success: false, message: 'Invalid coupon code' };
    }

    if (coupon.minSpend && subtotal < coupon.minSpend) {
      const msg = `Minimum spend of ₹${coupon.minSpend} required for ${cleanCode}`;
      addToast(msg, 'error');
      return { success: false, message: msg };
    }

    setAppliedCoupon(coupon);
    addToast(`Coupon "${coupon.code}" applied successfully!`, 'success');
    return { success: true, coupon };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
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

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      return Math.round((subtotal * appliedCoupon.value) / 100);
    }
    if (appliedCoupon.discountType === 'flat') {
      return Math.min(subtotal, appliedCoupon.value);
    }
    return 0;
  }, [appliedCoupon, subtotal]);

  const shipping = useMemo(() => {
    if (subtotal === 0) return 0;
    return subtotal >= 999 ? 0 : 70;
  }, [subtotal]);

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
        appliedCoupon,
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
        availableCoupons: Object.values(COUPONS),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
