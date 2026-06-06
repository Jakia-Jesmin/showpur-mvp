import apiClient from './baseApi';

export const acshowAPI = {
  // ── Dashboard ─────────────────────────────────────────────
  getDashboard:    () => apiClient.get('/acshow/dashboard/'),
  getDashboardCards: () => apiClient.get('/acshow/dashboard/cards/'),

  // ── Transactions ──────────────────────────────────────────
  getTransactions: (filters = {}) =>
    apiClient.get(`/acshow/transactions/?${new URLSearchParams(filters)}`),
  createTransaction:       (data)    => apiClient.post('/acshow/transactions/', data),
  createTransactionFormData: (fd)   => apiClient.postFormData('/acshow/transactions/', fd),
  getTransaction:          (id)      => apiClient.get(`/acshow/transactions/${id}/`),
  updateTransaction:       (id, data) => apiClient.put(`/acshow/transactions/${id}/`, data),
  patchTransaction:        (id, data) => apiClient.patch(`/acshow/transactions/${id}/`, data),
  deleteTransaction:       (id)      => apiClient.delete(`/acshow/transactions/${id}/`),
  getTransactionSummary:   ()        => apiClient.get('/acshow/transactions/summary/'),
  bulkCreateTransactions:  (list)    => apiClient.post('/acshow/transactions/bulk_create/', list),

  // Status / payment actions
  updateTransactionStatus: (id, action, paidAmount) =>
    apiClient.post(`/acshow/transactions/${id}/update_status/`, {
      action,
      paid_amount: paidAmount,
    }),

  // Maker-checker
  approveTransaction: (id)          => apiClient.post(`/acshow/transactions/${id}/approve/`),
  rejectTransaction:  (id, reason)  => apiClient.post(`/acshow/transactions/${id}/reject/`, { reason }),
  submitEdit:         (id, data)    => apiClient.put(`/acshow/transactions/${id}/submit_edit/`, data),

  // ── Quick Records ─────────────────────────────────────────
  getQuickRecords:   ()     => apiClient.get('/acshow/quick-records/'),
  createQuickRecord: (data) => apiClient.post('/acshow/quick-records/', data),
  getTodayRecords:   ()     => apiClient.get('/acshow/quick-records/today/'),

  // ── Cash Position ─────────────────────────────────────────
  getCashPositions:  ()     => apiClient.get('/acshow/cash-positions/'),
  createCashPosition:(data) => apiClient.post('/acshow/cash-positions/', data),
  getTodayCash:      ()     => apiClient.get('/acshow/cash-positions/today/'),
  getWeekSummary:    ()     => apiClient.get('/acshow/cash-positions/week_summary/'),

  // ── Alerts ────────────────────────────────────────────────
  getAlerts:       () => apiClient.get('/acshow/alerts/'),
  getUnreadCount:  () => apiClient.get('/acshow/alerts/unread_count/'),
  markAllRead:     () => apiClient.post('/acshow/alerts/mark_all_read/'),
  markRead: (ids)  => apiClient.post('/acshow/alerts/mark_read/', { alert_ids: ids }),

  // ── Business Health ───────────────────────────────────────
  getHealth: () => apiClient.get('/acshow/health/'),

  // ── Reports ───────────────────────────────────────────────
  getCashflowReport: (days = 30) =>
    apiClient.get(`/acshow/reports/cashflow/?days=${days}`),

  // ── Contacts ──────────────────────────────────────────────
  getContacts:   (type) => apiClient.get(`/acshow/contacts/${type ? `?type=${type}` : ''}`),
  createContact: (data) => apiClient.post('/acshow/contacts/', data),
  updateContact: (id, data) => apiClient.put(`/acshow/contacts/${id}/`, data),
  deleteContact: (id)   => apiClient.delete(`/acshow/contacts/${id}/`),

  // ── Chart of Accounts ─────────────────────────────────────
  getAccounts: (type) =>
    apiClient.get(`/ledger/accounts/${type ? `?type=${type}` : ''}`),
  createAccount: (data) => apiClient.post('/ledger/accounts/', data),
  updateAccount: (id, data) => apiClient.patch(`/ledger/accounts/${id}/`, data),
  deleteAccount: (id) => apiClient.delete(`/ledger/accounts/${id}/`),

  // ── Products (for sale/purchase modals) ───────────────────
  getProducts: () => apiClient.get('/products/products/'),

  // ── Trial ─────────────────────────────────────────────────
  startTrial: () => apiClient.post('/acshow/trial/start/'),
};
