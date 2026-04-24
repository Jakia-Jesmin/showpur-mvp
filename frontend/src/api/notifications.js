import { apiRequest } from './api';

export const notificationsAPI = {
  // Get all notifications
  getAll: () => apiRequest('/notifications/'),
  
  // Get unread count
  getUnreadCount: () => apiRequest('/notifications/unread-count/'),
  
  // Mark as read
  markAsRead: (id) => apiRequest(`/notifications/${id}/read/`, {
    method: 'PUT',
  }),
  
  // Mark all as read
  markAllAsRead: () => apiRequest('/notifications/mark-all-read/', {
    method: 'PUT',
  }),
  
  // Delete notification
  delete: (id) => apiRequest(`/notifications/${id}/`, {
    method: 'DELETE',
  }),
};
