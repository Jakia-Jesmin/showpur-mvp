import { useState, useEffect, useCallback } from 'react';
import { contactsAPI } from '@/api/contacts';

// frontend/src/hooks/useContacts.js

export const useContacts = (type) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await contactsAPI.list(type);
      const data = res.results || res;
      // Force IDs to strings to prevent UUID corruption
      const safeData = Array.isArray(data)
        ? data.map(c => ({ ...c, id: String(c.id) }))
        : [];
      setContacts(safeData);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    const init = async () => {
      await Promise.resolve();
      await fetchContacts();
    };

    init();
  }, [fetchContacts]);

  return { contacts, setContacts, loading, refresh: fetchContacts };
};