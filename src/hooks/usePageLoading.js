'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext.jsx';

/**
 * Hook to provide skeleton loading state on page mount or global refresh.
 * Shows skeleton loading state on initial mount (450ms) or whenever
 * global data refresh occurs via refreshData().
 */
export const usePageLoading = (duration = 450) => {
  const { isLoading: globalLoading } = useAdmin();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    setPageLoading(true);
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return globalLoading || pageLoading;
};
