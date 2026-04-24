// frontend/src/api/accounts.js
import baseApi from './baseApi';

export const accountsAPI = {
  register: (userData) => baseApi.post('/auth/register/', userData),
  
  login: (username, password) => baseApi.post('/auth/login/', { username, password }),
  
  getProfile: () => baseApi.get('/auth/profile/'),
  
  updateProfile: (data) => baseApi.put('/auth/profile/', data),
  
  changePassword: (oldPassword, newPassword) => 
    baseApi.post('/auth/change-password/', { old_password: oldPassword, new_password: newPassword }),
};
