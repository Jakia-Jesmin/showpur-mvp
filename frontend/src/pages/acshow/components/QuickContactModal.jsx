import React, { useState } from 'react';
import { acshowAPI } from '@/api/acshow';
import { X } from 'lucide-react';

const QuickContactModal = ({ type, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const typeLabel = type === 'customer' ? 'Customer' : type === 'supplier' ? 'Supplier' : 'Agent';
  const typeIcon = type === 'customer' ? '👤' : type === 'supplier' ? '🏭' : '🤝';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    setError('');
    try {
      await acshowAPI.createContact({ contact_type: type, name, phone });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
          <h2 className="font-semibold">{typeIcon} Add {typeLabel}</h2>
          <div className="w-5" />
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={`${typeLabel} name *`} className="w-full px-4 py-3 border rounded-xl text-sm" autoFocus />
          <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full px-4 py-3 border rounded-xl text-sm" />
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold">
            {loading ? 'Saving...' : `Add ${typeLabel}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuickContactModal;