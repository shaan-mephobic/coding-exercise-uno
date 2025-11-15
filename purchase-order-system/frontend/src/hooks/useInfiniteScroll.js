import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const useInfiniteScroll = (filters = {}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [cursor, setCursor] = useState(null);
  const cacheRef = useRef(new Map());
  const observerRef = useRef(null);
  const loadingRef = useRef(false);

  const fetchOrders = useCallback(
    async (reset = false, currentCursor = null) => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      try {
        if (reset) {
          setLoading(true);
          // Don't clear orders immediately - keep showing them while loading
          setCursor(null);
        } else {
          setLoadingMore(true);
        }

        // Build query params
        const params = new URLSearchParams({
          page_size: '20',
          sort_by: filters.sortBy || 'id',
          sort_order: filters.sortOrder || 'asc',
        });

        if (filters.search) params.append('search', filters.search);
        if (filters.status) params.append('status', filters.status);
        if (filters.category) params.append('category', filters.category);
        if (filters.vendor) params.append('vendor', filters.vendor);
        if (filters.minPrice) params.append('min_price', filters.minPrice);
        if (filters.maxPrice) params.append('max_price', filters.maxPrice);
        if (filters.minDate) params.append('min_date', filters.minDate);
        if (filters.maxDate) params.append('max_date', filters.maxDate);
        if (currentCursor && !reset) params.append('cursor', currentCursor);

        // Check cache
        const cacheKey = params.toString();
        if (cacheRef.current.has(cacheKey)) {
          const cached = cacheRef.current.get(cacheKey);
          if (reset) {
            setOrders(cached.data);
            setCursor(cached.meta.cursor);
            setHasNext(cached.meta.has_next);
          } else {
            setOrders((prev) => [...prev, ...cached.data]);
            setCursor(cached.meta.cursor);
            setHasNext(cached.meta.has_next);
          }
          setError(null);
          loadingRef.current = false;
          setLoading(false);
          setLoadingMore(false);
          return;
        }

        const response = await axios.get(
          `${API_URL}/api/purchase-orders/paginated?${params.toString()}`
        );

        const { data, meta } = response.data;

        // Cache the response
        cacheRef.current.set(cacheKey, { data, meta });
        // Limit cache size
        if (cacheRef.current.size > 50) {
          const firstKey = cacheRef.current.keys().next().value;
          cacheRef.current.delete(firstKey);
        }

        // Update orders after data is fetched
        if (reset) {
          setOrders(data);
        } else {
          setOrders((prev) => [...prev, ...data]);
        }

        setCursor(meta.cursor);
        setHasNext(meta.has_next);
        setError(null);
      } catch (err) {
        setError('Failed to fetch purchase orders');
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingRef.current = false;
      }
    },
    [filters]
  );

  const loadMore = useCallback(() => {
    if (hasNext && !loadingMore && !loadingRef.current) {
      fetchOrders(false, cursor);
    }
  }, [hasNext, loadingMore, fetchOrders, cursor]);

  const reset = useCallback(() => {
    cacheRef.current.clear();
    fetchOrders(true, null);
  }, [fetchOrders]);

  // Intersection Observer for infinite scroll
  const lastOrderElementRef = useCallback(
    (node) => {
      if (loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNext) {
          loadMore();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loadingMore, hasNext, loadMore]
  );

  // Prefetch next page when near bottom
  useEffect(() => {
    if (hasNext && !loadingMore && orders.length > 0) {
      const handleScroll = () => {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop;
        const clientHeight = document.documentElement.clientHeight;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        // Prefetch when within 200px of bottom
        if (distanceFromBottom < 200 && !loadingRef.current) {
          loadMore();
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [hasNext, loadingMore, orders.length, loadMore]);

  // Initial load
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.status, filters.category, filters.vendor, filters.sortBy, filters.sortOrder, filters.minPrice, filters.maxPrice]);

  return {
    orders,
    loading,
    loadingMore,
    error,
    hasNext,
    loadMore,
    reset,
    lastOrderElementRef,
    removeOrder: (id) => {
      setOrders((prev) => prev.filter((order) => order.id !== id));
    },
  };
};

