import { apiRequest } from './api';

export const displayAPI = {
  // Agreements
  getAgreements: () => apiRequest('/display/agreements/'),
  
  createAgreement: (data) => apiRequest('/display/agreements/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateAgreement: (id, data) => apiRequest(`/display/agreements/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deleteAgreement: (id) => apiRequest(`/display/agreements/${id}/`, {
    method: 'DELETE',
  }),
  
  // Displayed products
  getDisplayedProducts: () => apiRequest('/display/products/'),
  
  addDisplayedProduct: (data) => apiRequest('/display/products/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  removeDisplayedProduct: (id) => apiRequest(`/display/products/${id}/`, {
    method: 'DELETE',
  }),
};