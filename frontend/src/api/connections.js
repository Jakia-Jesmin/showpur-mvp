import { apiRequest } from './api';

export const connectionsAPI = {
  // Send connection request
  sendRequest: (toUserId, message = '') => apiRequest('/connections/request/', {
    method: 'POST',
    body: JSON.stringify({ to_user_id: toUserId, message }),
  }),
  
  // Get incoming pending requests
  getPendingRequests: () => apiRequest('/connections/requests/pending/'),
  
  // Get outgoing sent requests
  getSentRequests: () => apiRequest('/connections/requests/sent/'),
  
  // Accept connection request
  acceptRequest: (requestId) => apiRequest(`/connections/requests/${requestId}/accept/`, {
    method: 'PUT',
  }),
  
  // Reject connection request
  rejectRequest: (requestId) => apiRequest(`/connections/requests/${requestId}/reject/`, {
    method: 'PUT',
  }),
  
  // Get active connections (accepted)
  getActiveConnections: () => apiRequest('/connections/active/'),
  
  // Discover businesses to connect with
  discoverBusinesses: () => apiRequest('/connections/discover/'),
};