// frontend/src/api/acshow.js

import apiClient from "./baseApi";

export const acshowAPI = {
  // Dashboard
  getDashboard: () => apiClient.get('/acshow/dashboard/'),
  getSummaryCards: () => apiClient.get('/acshow/dashboard/summary-cards/'),
  
  // Transactions
  getTransactions: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiClient.get(`/acshow/transactions/?${params}`);
  },
  createTransaction: (data) => apiClient.post('/acshow/transactions/', data),
  getTransaction: (id) => apiClient.get(`/acshow/transactions/${id}/`),
  updateTransaction: (id, data) => apiClient.put(`/acshow/transactions/${id}/`, data),
  deleteTransaction: (id) => apiClient.delete(`/acshow/transactions/${id}/`),
  updateTransactionStatus: (id, action, paidAmount) => 
    apiClient.post(`/acshow/transactions/${id}/update_status/`, {
      action,
      paid_amount: paidAmount
    }),
  bulkCreateTransactions: (transactions) => 
    apiClient.post('/acshow/transactions/bulk_create/', transactions),
  getTransactionSummary: () => apiClient.get('/acshow/transactions/summary/'),
  
  // Quick Records
  getQuickRecords: () => apiClient.get('/acshow/quick-records/'),
  createQuickRecord: (data) => apiClient.post('/acshow/quick-records/', data),
  getTodayRecords: () => apiClient.get('/acshow/quick-records/today/'),
  
  // Cash Position
  getCashPositions: () => apiClient.get('/acshow/cash-positions/'),
  createCashPosition: (data) => apiClient.post('/acshow/cash-positions/', data),
  getTodayCash: () => apiClient.get('/acshow/cash-positions/today/'),
  getWeekSummary: () => apiClient.get('/acshow/cash-positions/week_summary/'),
  
  // Alerts
  getAlerts: () => apiClient.get('/acshow/alerts/'),
  getUnreadCount: () => apiClient.get('/acshow/alerts/unread_count/'),
  markAllRead: () => apiClient.post('/acshow/alerts/mark_all_read/'),
  markRead: (ids) => apiClient.post('/acshow/alerts/mark_read/', { alert_ids: ids }),
  
  // Business Health
  getHealth: () => apiClient.get('/acshow/health/'),
  
  // Reports
  getCashflowReport: (days = 30) => 
    apiClient.get(`/acshow/reports/cashflow/?days=${days}`),
};
