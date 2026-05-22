import { useState, useEffect, useCallback } from 'react';
import { acshowAPI } from '@/api/acshow';

export const useAcShowDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [alerts, setAlerts] = useState({ overdue_count: 0, overdue_amount: 0, upcoming_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await acshowAPI.getDashboard();
      const data = response.data?.data || response.data;

      setMetrics({
        today_cash: data.today_cash || 0,
        today_income: data.today_income || 0,    // ← Add this
        today_expenses: data.today_expenses || 0, // ← Add this
        pending_collections: data.pending_collections || 0,
        pending_payments: data.pending_payments || 0,
        cash_forecast: data.cash_forecast || {},
      });

      setRecentActivities(data.recent_transactions || []);

      setAlerts({
        overdue_count: data.overdue_customers_count || 0,
        overdue_amount: data.overdue_collections_amount || 0,
        upcoming_count: data.upcoming_payments_count || 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      await fetchDashboard();
    };

    void loadDashboard();
  }, [fetchDashboard]);

  return { metrics, recentActivities, alerts, loading, error, refresh: fetchDashboard };
};