// frontend/src/api/products.js

import apiClient from './baseApi';

export const productsAPI = {
  list: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.owner) params.append('owner', filters.owner);
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    const qs = params.toString();
    return apiClient.get(`/products/${qs ? `?${qs}` : ''}`);
  },
  
  getById: (id) => apiClient.get(`/products/${id}/`),
  
  create: (data) => apiClient.post('/products/', data),
  
  update: (id, data) => apiClient.put(`/products/${id}/`, data),
  
  delete: (id) => apiClient.delete(`/products/${id}/`),
  
  getMyProducts: () => apiClient.get('/products/my-products/'),
};