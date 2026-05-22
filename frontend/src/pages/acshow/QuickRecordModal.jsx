// frontend/src/pages/acshow/QuickRecordModal.jsx

import React, { useState } from 'react';
import { acshowAPI } from '../../api/acshow';

/**
 * Quick record entry modal.
 * 
 * Ultra-simple form for recording daily transactions.
 * Optimized for mobile with large inputs.
 */
const QuickRecordModal = ({ type, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [partyName, setPartyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const typeConfig = {
    collection: {
      icon: '💰',
      title: 'Record Collection',
      entryType: 'collection',
      placeholder: 'Who paid you?',
      color: 'emerald',
    },
    payment: {
      icon: '💸',
      title: 'Record Payment',
      entryType: 'payment',
      placeholder: 'Who did you pay?',
      color: 'red',
    },
    sale: {
      icon: '🛒',
      title: 'Record Sale',
      entryType: 'sale',
      placeholder: 'What did you sell?',
      color: 'blue',
    },
    expense: {
      icon: '🧾',
      title: 'Record Expense',
      entryType: 'expense',
      placeholder: 'What was the expense?',
      color: 'orange',
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕ Cancel
          </button>
          <h2 className="font-semibold text-gray-800">
            {config.icon} {config.title}
          </h2>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Amount Input - Large & Prominent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (৳)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-3xl font-bold text-center py-4 
                border-2 border-gray-200 rounded-xl focus:border-emerald-500 
                focus:ring-2 focus:ring-emerald-200 outline-none"
              autoFocus
            />
          </div>
          
          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[100, 500, 1000, 5000].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset.toString())}
                className="py-2 px-3 bg-gray-100 rounded-lg text-sm font-medium
                  hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                ৳{preset.toLocaleString()}
              </button>
            ))}
          </div>
          
          {/* Party Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {config.placeholder}
            </label>
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="Name (optional)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this for? (optional)"
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
            />
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl text-lg font-semibold
              hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : `Save ${config.title}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuickRecordModal;