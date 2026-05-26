// frontend/src/hooks/useProducts.js

import { useState, useEffect, useCallback } from 'react';
import { productsAPI } from '@/api/products';

export const useProducts = (filters = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsAPI.list(filters);
      const data = res.results || res;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return { products, loading, refresh: fetchProducts };
};