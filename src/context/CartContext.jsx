import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext();

const COUPONS = {
  'TRIO10': { code: 'TRIO10', discountType: 'percentage', value: 10, description: '10% off on all ethnic crafts' },
  'FESTIVE20': { code: 'FESTIVE20', discountType: 'percentage', value: 20, description: '20% festive special discount' },
  'FIRSTBUY': { code: 'FIRSTBUY', discountType: 'percentage', value: 15, description: '15% off on your first order' },
  'CRAFT100': { code: 'CRAFT100', discountType: 'flat', value: 100, description: 'Flat ₹100 off on orders above ₹999', minSpend: 999 },
};

export const CartProvider = ({ children }) => {
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
  const { addToast } = useToast();

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

  const addToCart = (product, quantity = 1, selectedColor = null, selectedSize = null) => {
    if (!product) return;

    // determine variant price and image
    let price = product.price;
    let originalPrice = product.originalPrice || product.price;
    let image = product.images?.[0] || '/products/shreenathji-statement-patch-1.jpg';
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

    // unique cart item key based on product id, color, and size
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
  };

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
