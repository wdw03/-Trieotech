'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const isInitialized = useRef(false);

  // Safely hydrate from localStorage on client mount only
  useEffect(() => {
    try {
      const saved = localStorage.getItem('trio_recently_viewed');
      if (saved) setRecentlyViewed(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load recently viewed items', e);
    } finally {
      isInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (!isInitialized.current) return;
    try {
      localStorage.setItem('trio_recently_viewed', JSON.stringify(recentlyViewed));
    } catch (e) {
      console.error('Failed to save recently viewed items', e);
    }
  }, [recentlyViewed]);

  const addRecentlyViewed = useCallback((product) => {
    if (!product || !product.id) return;
    setRecentlyViewed(prev => {
      const filtered = prev.filter(item => item.id !== product.id);
      return [product, ...filtered].slice(0, 8); // Keep max 8 items
    });
  }, []);

  return { recentlyViewed, addRecentlyViewed };
};

export default useRecentlyViewed;
