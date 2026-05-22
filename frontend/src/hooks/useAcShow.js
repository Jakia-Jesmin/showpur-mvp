import { useState, useEffect, useCallback } from 'react';
import { acshowAPI } from '../api/acshow';

export const useAcShowDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await acshowAPI.getDashboard();
      setData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refresh: fetchDashboard };
};

export const useTodayCash = () => {
  const [cashData, setCashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    acshowAPI.getTodayCash()
      .then(res => setCashData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { cashData, loading };
};

export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
    try {
      const [alertsRes, countRes] = await Promise.all([
        acshowAPI.getAlerts(),
        acshowAPI.getUnreadCount(),
      ]);
      setAlerts(alertsRes.data.results || alertsRes.data);
      setUnreadCount(countRes.data.unread_count);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const markAsRead = async (ids) => {
    await acshowAPI.markRead(ids);
    fetchAlerts();
  };

  return { alerts, unreadCount, markAsRead, refresh: fetchAlerts };
};

export const useAcShowAccess = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    acshowAPI.getDashboard()
      .then(() => setHasAccess(true))
      .catch(() => setHasAccess(false))
      .finally(() => setLoading(false));
  }, []);

  return { hasAccess, loading };
};