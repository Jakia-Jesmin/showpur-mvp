import { apiRequest } from './api';

export const productsAPI = {
  // Get all products for current user
  getAll: () => apiRequest('/products/'),
  
  // Get single product
  getById: (id) => apiRequest(`/products/${id}/`),
  
  // Create new product
  create: (productData) => apiRequest('/products/', {
    method: 'POST',
    body: JSON.stringify(productData),
  }),
  
  // Update product
  update: (id, productData) => apiRequest(`/products/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  }),
  
  // Delete product
  delete: (id) => apiRequest(`/products/${id}/`, {
    method: 'DELETE',
  }),
  
  // Toggle product active status
  toggleActive: (id, isActive) => apiRequest(`/products/${id}/`, {
    method: 'PUT',
    body: JSON.stringify({ is_active: isActive }),
  }),
};