import React, { useState, useCallback } from 'react';
import QuickRecordModal from '@/pages/acshow/QuickRecordModal';

const POS_BUTTONS = [
  { icon: '🛒', label: 'New Sale', sub: 'বিক্রয়', type: 'sale', color: 'bg-gradient-to-br from-blue-500 to-blue-700' },
  { icon: '💰', label: 'Collection', sub: 'কালেকশন', type: 'collection', color: 'bg-gradient-to-br from-emerald-500 to-emerald-700' },
  { icon: '💸', label: 'Payment', sub: 'পরিশোধ', type: 'payment', color: 'bg-gradient-to-br from-rose-500 to-rose-700' },
  { icon: '🧾', label: 'Expense', sub: 'খরচ', type: 'expense', color: 'bg-gradient-to-br from-purple-500 to-purple-700' },
];

const PosTerminal = ({ onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState('sale');

  const openModal = useCallback((t) => {
    setType(t);
    setShowModal(true);
  }, []);

  const handleSuccess = useCallback(() => {
    setShowModal(false);
    if (onRefresh) onRefresh();
  }, [onRefresh]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800">POS Terminal</h2>
        <p className="text-xs text-gray-400 mt-1">Quick entry point (দ্রুত এন্ট্রি)</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {POS_BUTTONS.map((btn) => (
          <button
            key={btn.type}
            onClick={() => openModal(btn.type)}
            className={`${btn.color} text-white p-6 rounded-2xl text-center hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all shadow-md`}
          >
            <div className="text-4xl mb-3">{btn.icon}</div>
            <p className="font-bold text-base">{btn.label}</p>
            <p className="text-xs opacity-80 mt-0.5">{btn.sub}</p>
          </button>
        ))}
      </div>

      {showModal && (
        <QuickRecordModal
          type={type}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default PosTerminal;