// frontend/src/pages/acshow/TransactionDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { acshowAPI } from '../../api/acshow';
import Spinner from '../../components/ui/Spinner';

/**
 * Transaction Detail Page
 * 
 * Full view of a single transaction.
 * Actions: Edit, mark complete, cancel, update payment.
 */
const TransactionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  useEffect(() => {
    fetchTransaction();
  }, [id]);
  
  const fetchTransaction = async () => {
    try {
      const res = await acshowAPI.getTransaction(id);
      setTransaction(res.data);
    } catch (err) {
      console.error('Failed to fetch transaction:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStatusUpdate = async (action, paidAmount = null) => {
    setActionLoading(true);
    try {
      await acshowAPI.updateTransactionStatus(id, action, paidAmount);
      fetchTransaction();
      setShowPaymentInput(false);
    } catch (err) {
      console.error('Failed to update:', err);
    } finally {
      setActionLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }
  
  if (!transaction) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Transaction not found</p>
      </div>
    );
  }
  
  const typeStyles = {
    income: { bg: 'bg-green-50', text: 'text-green-700', icon: '💰' },
    expense: { bg: 'bg-red-50', text: 'text-red-700', icon: '💸' },
    receivable: { bg: 'bg-orange-50', text: 'text-orange-700', icon: '📥' },
    payable: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '📤' },
  };
  
  const style = typeStyles[transaction.transaction_type] || typeStyles.income;
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Transaction Details</h1>
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        
        {/* Amount & Type Card */}
        <div className={`${style.bg} rounded-2xl p-6 text-center`}>
          <div className="text-4xl mb-2">{style.icon}</div>
          <div className={`text-3xl font-bold ${style.text} mb-1`}>
            ৳{parseFloat(transaction.amount).toLocaleString()}
          </div>
          <div className={`${style.text} font-medium`}>
            {transaction.transaction_type_display}
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="flex justify-center">
          <StatusBadge status={transaction.status} />
        </div>
        
        {/* Details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <DetailRow label="Description" value={transaction.description} />
          <DetailRow label="Category" value={transaction.category_display} />
          <DetailRow label="Party" value={transaction.party_name || 'N/A'} />
          <DetailRow label="Party Type" value={transaction.party_type} />
          <DetailRow label="Date" value={new Date(transaction.transaction_date).toLocaleDateString('en-BD')} />
          
          {transaction.due_date && (
            <DetailRow 
              label="Due Date" 
              value={new Date(transaction.due_date).toLocaleDateString('en-BD')}
              highlight={transaction.is_overdue}
            />
          )}
          
          {transaction.paid_amount > 0 && (
            <>
              <DetailRow label="Paid Amount" value={`৳${parseFloat(transaction.paid_amount).toLocaleString()}`} />
              <DetailRow label="Remaining" value={`৳${parseFloat(transaction.remaining_amount || 0).toLocaleString()}`} />
            </>
          )}
          
          {transaction.notes && (
            <DetailRow label="Notes" value={transaction.notes} />
          )}
        </div>
        
        {/* Actions */}
        {transaction.status !== 'cancelled' && transaction.status !== 'completed' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-800">Actions</h3>
            
            {/* Mark as Complete */}
            <button
              onClick={() => handleStatusUpdate('complete')}
              disabled={actionLoading}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-medium
                hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50"
            >
              ✅ Mark as Completed
            </button>
            
            {/* Update Payment (for partial payments) */}
            {!showPaymentInput ? (
              <button
                onClick={() => setShowPaymentInput(true)}
                className="w-full border-2 border-emerald-600 text-emerald-600 py-3 rounded-xl font-medium
                  hover:bg-emerald-50 active:scale-95 transition-all"
              >
                💵 Update Payment
              </button>
            ) : (
              <div className="space-y-3 p-3 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700">
                  Amount Received/Paid
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-bold text-center"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusUpdate('update_payment', paymentAmount)}
                    disabled={!paymentAmount || actionLoading}
                    className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-medium
                      hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowPaymentInput(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {/* Cancel */}
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this transaction?')) {
                  handleStatusUpdate('cancel');
                }
              }}
              disabled={actionLoading}
              className="w-full text-red-500 py-2 text-sm hover:text-red-600"
            >
              Cancel Transaction
            </button>
          </div>
        )}
        
        {/* Timestamps */}
        <div className="text-center text-xs text-gray-400 space-y-1">
          <p>Created: {new Date(transaction.created_at).toLocaleString('en-BD')}</p>
          {transaction.completed_date && (
            <p>Completed: {new Date(transaction.completed_date).toLocaleString('en-BD')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const styles = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };
  
  const icons = {
    completed: '✅',
    pending: '⏳',
    overdue: '⚠️',
    cancelled: '❌',
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium ${styles[status]}`}>
      {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Detail Row Component
const DetailRow = ({ label, value, highlight }) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className={`text-sm font-medium text-right ml-4 ${highlight ? 'text-red-600' : 'text-gray-800'}`}>
      {value}
    </span>
  </div>
);

export default TransactionDetailPage;