import { apiRequest } from './api';

export const searchAPI = {
  // Search all
  search: (query, filters = {}) => apiRequest('/search/', {
    method: 'POST',
    body: JSON.stringify({ query, filters }),
  }),
  
  // Search products
  searchProducts: (query, category = null, minPrice = null, maxPrice = null) => {
    const params = new URLSearchParams({ q: query });
    if (category) params.append('category', category);
    if (minPrice) params.append('min_price', minPrice);
    if (maxPrice) params.append('max_price', maxPrice);
    return apiRequest(`/search/products/?${params}`);
  },
  
  // Search businesses
  searchBusinesses: (query, location = null, role = null) => {
    const params = new URLSearchParams({ q: query });
    if (location) params.append('location', location);
    if (role) params.append('role', role);
    return apiRequest(`/search/businesses/?${params}`);
  },
  
  // Get trending products
  getTrending: () => apiRequest('/search/trending/'),
  
  // Get recent searches
  getRecentSearches: () => apiRequest('/search/recent/'),
};
