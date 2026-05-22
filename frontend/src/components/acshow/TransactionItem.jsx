// frontend/src/components/acshow/TransactionItem.jsx

import React from 'react';

/**
 * Single transaction row for lists.
 * 
 * Shows essential info at a glance:
 * - Type (income/expense)
 * - Amount
 * - Party name
 * - Status
 * - Time
 */
const TransactionItem = ({ transaction, onClick }) => {
  const typeStyles = {
    income: 'text-green-600',
    expense: 'text-red-600',
    receivable: 'text-orange-600',
    payable: 'text-blue-600',
  };
  
  const statusBadges = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };
  
  return (
    <div
      onClick={() => onClick && onClick(transaction.id)}
      className="flex items-center justify-between py-3 px-4 
        hover:bg-gray-50 cursor-pointer border-b border-gray-100
        active:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Type indicator */}
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center text-lg
          ${typeStyles[transaction.transaction_type] || 'text-gray-600'}
          bg-opacity-10 bg-current
        `}>
          {transaction.transaction_type === 'income' && '💰'}
          {transaction.transaction_type === 'expense' && '💸'}
          {transaction.transaction_type === 'receivable' && '📥'}
          {transaction.transaction_type === 'payable' && '📤'}
        </div>
        
        {/* Transaction info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 truncate">
            {transaction.party_name || transaction.description}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {transaction.category_display || transaction.description}
          </p>
        </div>
      </div>
      
      {/* Amount and status */}
      <div className="text-right ml-3">
        <p className={`font-bold ${typeStyles[transaction.transaction_type]}`}>
          {transaction.transaction_type === 'income' ? '+' : 
           transaction.transaction_type === 'expense' ? '-' : ''}
          ৳{parseFloat(transaction.amount).toLocaleString()}
        </p>
        <span className={`
          inline-block px-2 py-0.5 rounded-full text-xs font-medium
          ${statusBadges[transaction.status] || statusBadges.pending}
        `}>
          {transaction.status_display || transaction.status}
        </span>
      </div>
    </div>
  );
};

export default TransactionItem;