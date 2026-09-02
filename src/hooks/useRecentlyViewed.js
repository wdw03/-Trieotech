import { useState, useEffect, useCallback } from 'react';

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      const saved = localStorage.getItem('trio_recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
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
