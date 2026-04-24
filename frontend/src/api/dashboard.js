import { apiRequest } from './api';

export const dashboardAPI = {
  // Get dashboard statistics
  getStats: () => apiRequest('/dashboard/stats/'),
  
  // Get recent activity
  getRecentActivity: () => apiRequest('/dashboard/recent-activity/'),
  
  // Get charts data
  getChartsData: () => apiRequest('/dashboard/charts/'),
};
