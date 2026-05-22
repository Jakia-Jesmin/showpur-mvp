// frontend/src/pages/acshow/QuickRecordModal.jsx

import React, { useState } from 'react';
import { acshowAPI } from '@/api/acshow';

const QuickRecordModal = ({ type, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [partyName, setPartyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const typeConfig = {
    collection: {
      icon: '💵', title: 'Receive Money', entryType: 'collection',
      placeholder: 'Who paid you?', color: 'emerald',
      focusColor: 'focus:border-emerald-500 focus:ring-emerald-200',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700',
      quickHover: 'hover:bg-emerald-50 hover:text-emerald-600',
    },
    payment: {
      icon: '💸', title: 'Pay Supplier', entryType: 'payment',
      placeholder: 'Who did you pay?', color: 'rose',
      focusColor: 'focus:border-rose-500 focus:ring-rose-200',
      btnColor: 'bg-rose-600 hover:bg-rose-700',
      quickHover: 'hover:bg-rose-50 hover:text-rose-600',
    },
    sale: {
      icon: '🛒', title: 'Record Sale', entryType: 'sale',
      placeholder: 'What did you sell?', color: 'blue',
      focusColor: 'focus:border-blue-500 focus:ring-blue-200',
      btnColor: 'bg-blue-600 hover:bg-blue-700',
      quickHover: 'hover:bg-blue-50 hover:text-blue-600',
    },
    purchase: {
      icon: '📦', title: 'Record Purchase', entryType: 'purchase',
      placeholder: 'What did you buy?', color: 'purple',
      focusColor: 'focus:border-purple-500 focus:ring-purple-200',
      btnColor: 'bg-purple-600 hover:bg-purple-700',
      quickHover: 'hover:bg-purple-50 hover:text-purple-600',
    },
    expense: {
      icon: '🧾', title: 'Add Expense', entryType: 'expense',
      placeholder: 'What was the expense?', color: 'orange',
      focusColor: 'focus:border-orange-500 focus:ring-orange-200',
      btnColor: 'bg-orange-600 hover:bg-orange-700',
      quickHover: 'hover:bg-orange-50 hover:text-orange-600',
    },
  };

  const config = typeConfig[type] || typeConfig.collection;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await acshowAPI.createQuickRecord({
        entry_type: config.entryType,
        amount: parseFloat(amount),
        description: description || `${config.title}`,
        party_name: partyName,
        is_paid: true,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕ Cancel</button>
          <h2 className="font-semibold text-gray-800">{config.icon} {config.title}</h2>
          <div className="w-16" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (৳)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full text-3xl font-bold text-center py-4 border-2 border-gray-200 rounded-xl outline-none transition-all ${config.focusColor}`}
              autoFocus />
          </div>

          {/* Quick Amounts */}
          <div className="grid grid-cols-4 gap-2">
            {[100, 500, 1000, 5000].map(preset => (
              <button key={preset} type="button" onClick={() => setAmount(preset.toString())}
                className={`py-2 px-3 bg-gray-100 rounded-lg text-sm font-medium transition-colors ${config.quickHover}`}>
                ৳{preset.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Party Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{config.placeholder}</label>
            <input type="text" value={partyName} onChange={(e) => setPartyName(e.target.value)}
              placeholder="Name (optional)"
              className={`w-full px-4 py-3 border border-gray-200 rounded-xl outline-none transition-all ${config.focusColor}`} />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this for? (optional)" rows={2}
              className={`w-full px-4 py-3 border border-gray-200 rounded-xl outline-none resize-none transition-all ${config.focusColor}`} />
          </div>

          {/* Error */}
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

          {/* Submit */}
          <button type="submit" disabled={loading}
            className={`w-full text-white py-4 rounded-xl text-lg font-semibold active:scale-95 transition-all disabled:opacity-50 ${config.btnColor}`}>
            {loading ? 'Saving...' : `Save ${config.title}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuickRecordModal;
