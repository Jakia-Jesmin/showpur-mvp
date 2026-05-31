import { useState, useEffect, useCallback } from 'react';
import { acshowAPI } from '@/api/acshow';

export const useAcShowDashboard = () => {
  const [metrics, setMetrics]             = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [alerts, setAlerts]               = useState({
    overdue_receivables_count: 0,
    overdue_receivables_amount: 0,
    overdue_payables_count: 0,
    overdue_payables_amount: 0,
    overdue_count: 0,
  });
  const [forecast, setForecast]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // API returns { success: true, data: { account_balances, daily_pl, ... } }
      const res  = await acshowAPI.getDashboard();
      const data = res.data || res;   // baseApi returns JSON directly

      const bal = data.account_balances  || {};
      const pl  = data.daily_pl          || {};
      const pos = data.daily_cash_position || {};

      setMetrics({
        // Account balances
        cash_in_hand:        bal.cash_in_hand         || 0,
        cash_at_bank:        bal.cash_at_bank          || 0,
        accounts_receivable: bal.accounts_receivable   || 0,
        accounts_payable:    bal.accounts_payable      || 0,
        total_cash:          (bal.cash_in_hand || 0) + (bal.cash_at_bank || 0),

        // Daily P&L
        today_revenue:   pl.revenue            || 0,
        today_cogs:      pl.cogs               || 0,
        today_expenses:  pl.operating_expenses || 0,
        today_pl:        pl.net_pl             || 0,
        // legacy aliases kept for Overview.jsx
        today_income:    pl.revenue            || 0,

        // Daily cash position
        cash_opening:    pos.opening_balance   || 0,
        cash_in:         pos.cash_in           || 0,
        cash_out:        pos.cash_out          || 0,
        cash_closing:    pos.closing_balance   || 0,
        cash_status:     pos.status            || 'healthy',

        unread_alerts:   data.unread_alerts_count || 0,
      });

      setRecentActivities(data.recent_transactions || []);
      setForecast(data.cashflow_7day || []);

      setAlerts({
        overdue_receivables_count:  data.overdue_receivables_count  || 0,
        overdue_receivables_amount: data.overdue_receivables_amount || 0,
        overdue_payables_count:     data.overdue_payables_count     || 0,
        overdue_payables_amount:    data.overdue_payables_amount    || 0,
        overdue_count: (data.overdue_receivables_count || 0) + (data.overdue_payables_count || 0),
        upcoming_count: (data.cashflow_7day || []).filter(d => d.expected_out > 0).length,
      });
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    metrics, recentActivities, alerts, forecast,
    loading, error,
    refresh: fetchDashboard,
  };
};
