import { useState, useEffect, useCallback } from 'react';
import { acshowAPI } from '@/api/acshow';

export const useBusinessPulse = () => {
  const [pulse, setPulse]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await acshowAPI.getDashboardPulse();
      setPulse(res.data || res);
    } catch (err) {
      setError(err.message || 'Failed to load pulse data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { pulse, loading, error, refresh: fetch };
};

export const useAgingReport = () => {
  const [report, setReport]   = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [agingRes, txnRes] = await Promise.all([
        acshowAPI.getAgingReport(),
        acshowAPI.getTransactions({ overdue: '1', page_size: 50 }),
      ]);
      setReport(agingRes.data || agingRes);
      setOverdue(txnRes.results || txnRes.data?.results || []);
    } catch (err) {
      setError(err.message || 'Failed to load aging report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { report, overdue, loading, error, refresh: fetch };
};

export const useInventoryQuality = () => {
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await acshowAPI.getInventoryQuality();
      setReport(res.data || res);
    } catch (err) {
      setError(err.message || 'Failed to load inventory report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { report, loading, error, refresh: fetch };
};
