// frontend/src/api/accounts.js
import baseApi from './baseApi';

export const accountsAPI = {
  register: (userData) => baseApi.post('/auth/register/', userData),
  
  login: (identifier, password) => baseApi.post('/auth/login/', { identifier, password }),
  
  getProfile: () => baseApi.get('/auth/profile/'),
  
  updateProfile: (data) => baseApi.put('/auth/profile/', data),
  
  changePassword: (currentPassword, newPassword, newPassword2) => 
    baseApi.post('/auth/change-password/', { 
      current_password: currentPassword, 
      new_password: newPassword,
      new_password2: newPassword2 
    }),

  forgotPassword: (email) => baseApi.post('/auth/forgot-password/', { email }),
  
  resetPassword: (token, email, newPassword) => 
    baseApi.post('/auth/reset-password/', { token, email, new_password: newPassword }),
};
