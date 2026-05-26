import apiClient from './baseApi';

export const contactsAPI = {
  list: (type) => {
    const params = type ? `?type=${type}` : '';
    return apiClient.get(`/acshow/contacts/${params}`);
  },
  create: (data) => apiClient.post('/acshow/contacts/', data),
  
  // Keep the slash here; we need to let Django handle the lifecycle validation
  update: (id, data) => apiClient.put(`/acshow/contacts/${String(id)}/`, data),
  delete: (id) => apiClient.delete(`/acshow/contacts/${String(id)}/`),
};