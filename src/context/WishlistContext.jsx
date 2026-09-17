'use client';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useToast } from './ToastContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const isInitialized = useRef(false);

  // Safely hydrate wishlist from localStorage on client mount only
  useEffect(() => {
    try {
      const saved = localStorage.getItem('trio_wishlist');
      if (saved) setWishlist(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load wishlist', e);
    } finally {
      isInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (!isInitialized.current) return;
    try {
      localStorage.setItem('trio_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist', e);
    }
  }, [wishlist]);

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === Number(productId));
  };

  const toggleWishlist = (product) => {
    if (!product) return;
    if (isInWishlist(product.id)) {
      setWishlist(prev => prev.filter(item => item.id !== product.id));
      addToast(`Removed "${product.name.substring(0, 30)}..." from Wishlist`, 'info');
    } else {
      setWishlist(prev => [...prev, product]);
      addToast(`Added "${product.name.substring(0, 30)}..." to Wishlist!`, 'success');
    }
  };

  const removeFromWishlist = (productId) => {
    setWishlist(prev => prev.filter(item => item.id !== Number(productId)));
    addToast('Item removed from wishlist', 'info');
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
