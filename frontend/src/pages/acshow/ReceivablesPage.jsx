import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { acshowAPI } from '@/api/acshow';
import TransactionItem from '@/components/acshow/TransactionItem';
import Spinner from '@/components/ui/Spinner';
import { AlertTriangle, Clock, ChevronRight, X, Banknote, Building2 } from 'lucide-react';
import EmptyState from '@/components/acshow/EmptyState';

const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN');

const ReceivablesPage = () => {
  const navigate = useNavigate();
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [totalDue, setTotalDue] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [overdueAmount, setOverdueAmount] = useState(0);
  const [collectingTxn, setCollectingTxn] = useState(null);

  const fetchReceivables = useCallback(async () => {
    setLoading(true);
    try {
      const params = { type: 'receivable' };
      if (filter === 'overdue') params.status = 'overdue';
      if (filter === 'pending') params.status = 'pending';

      const res = await acshowAPI.getTransactions(params);
      const data = res.data.results || res.data;

      setReceivables(data);

      const total = data.reduce((sum, item) => sum + parseFloat(item.remaining_amount || item.amount), 0);
      const overdue = data.filter(item => item.status === 'overdue');
      const overdueAmt = overdue.reduce((sum, item) => sum + parseFloat(item.remaining_amount || item.amount), 0);

      setTotalDue(total);
      setOverdueCount(overdue.length);
      setOverdueAmount(overdueAmt);
    } catch (err) {
      console.error('Failed to fetch receivables:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReceivables();
  }, [fetchReceivables]);

  const grouped = groupByParty(receivables);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <button
            onClick={() => navigate('/acshow')}
            className="text-gray-400 hover:text-gray-600 text-xs mb-1 flex items-center gap-1"
          >
            ← Dashboard
          </button>
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            To Collect <span className="text-gray-400 text-sm font-normal">(পাওনা)</span>
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">

        {/* Summary Hero */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-100 mb-1">
            Total Outstanding (মোট বাকি)
          </p>
          <h2 className="text-3xl font-black mb-4">৳{fmt(totalDue)}</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-white/20 px-3 py-1 rounded-full font-medium">
              {grouped.length} Customer{grouped.length !== 1 ? 's' : ''}
            </span>
            {overdueCount > 0 && (
              <span className="bg-red-500/40 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                <AlertTriangle size={12} /> {overdueCount} Overdue — ৳{fmt(overdueAmount)}
              </span>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All (সব)' },
            { key: 'pending', label: '⏳ Pending (বাকি)' },
            { key: 'overdue', label: '⚠️ Overdue (সময় পার)', warning: true },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                filter === tab.key
                  ? tab.warning
                    ? 'bg-red-600 text-white'
                    : 'bg-amber-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Customer List */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-16 flex justify-center"><Spinner /></div>
          ) : grouped.length > 0 ? (
            grouped.map((group) => (
              <CustomerCard
                key={group.party}
                group={group}
                onTransactionClick={(id) => navigate(`/acshow/transactions/${id}`)}
                onCollect={setCollectingTxn}
              />
            ))
          ) : (
            <EmptyState
              icon="🎉"
              title="All Clear! (সব পরিশোধিত)"
              message="No pending collections. Great job managing your receivables!"
              variant="success"
            />
          )}
        </div>
      </div>

      {/* Collect Payment Modal */}
      {collectingTxn && (
        <CollectPaymentModal
          transaction={collectingTxn}
          onClose={() => setCollectingTxn(null)}
          onSuccess={() => {
            setCollectingTxn(null);
            fetchReceivables();
          }}
        />
      )}
    </div>
  );
};

// ============================================================
// COLLECT PAYMENT MODAL
// ============================================================

const CollectPaymentModal = ({ transaction, onClose, onSuccess }) => {
  const remaining = parseFloat(transaction.remaining_amount || transaction.amount || 0);
  const [amount, setAmount] = useState(remaining.toFixed(2));
  const [method, setMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError('Enter a valid amount.'); return; }
    if (amt > remaining) { setError(`Cannot collect more than ৳${fmt(remaining)} outstanding.`); return; }

    setLoading(true);
    setError('');
    try {
      await acshowAPI.collectPayment(transaction.id, { amount: amt, payment_method: method });
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to record collection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl">

        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-bold text-gray-800">Record Collection</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Customer & outstanding */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Customer</p>
            <p className="font-bold text-gray-800 mt-0.5">{transaction.party_name || 'Unknown'}</p>
            {transaction.description && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{transaction.description}</p>
            )}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-200">
              <span className="text-xs text-amber-700">Outstanding</span>
              <span className="font-black text-amber-800 text-base">৳{fmt(remaining)}</span>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Amount Collected (৳)
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="0.01"
              max={remaining}
              step="0.01"
              className="w-full text-2xl font-bold text-center py-4 border-2 border-amber-200 rounded-xl outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              autoFocus
            />
            {/* Quick fill */}
            <div className="flex gap-2 mt-2">
              {[remaining * 0.25, remaining * 0.5, remaining].map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAmount(v.toFixed(2))}
                  className="flex-1 py-1.5 bg-gray-100 rounded-lg text-xs font-medium hover:bg-amber-50 hover:text-amber-700 transition-colors"
                >
                  {i === 0 ? '25%' : i === 1 ? '50%' : 'Full'} ৳{fmt(v)}
                </button>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('CASH')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                  method === 'CASH'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Banknote size={16} /> Cash
              </button>
              <button
                type="button"
                onClick={() => setMethod('BANK')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                  method === 'BANK'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Building2 size={16} /> Bank / MFS
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}
        </div>

        <div className="px-4 pb-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold disabled:opacity-50 transition-all"
          >
            {loading ? 'Recording...' : `Collect ৳${fmt(parseFloat(amount) || 0)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CUSTOMER CARD
// ============================================================

const CustomerCard = ({ group, onTransactionClick, onCollect }) => {
  const [expanded, setExpanded] = useState(false);
  const daysUntilDue = group.nearestDueDate
    ? Math.ceil((new Date(group.nearestDueDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
      group.hasOverdue ? 'border-red-200' : 'border-gray-100'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
            group.hasOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {(group.party || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 truncate">
              {group.party || 'Unknown Customer'}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span>{group.transactions.length} invoice{group.transactions.length !== 1 ? 's' : ''}</span>
              {daysUntilDue !== null && daysUntilDue > 0 && !group.hasOverdue && (
                <span className="flex items-center gap-1 text-amber-600">
                  <Clock size={12} /> Due in {daysUntilDue}d
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right mr-2">
          <p className={`font-bold ${group.hasOverdue ? 'text-red-600' : 'text-amber-700'}`}>
            ৳{fmt(group.totalDue)}
          </p>
          {group.hasOverdue && (
            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              OVERDUE
            </span>
          )}
        </div>

        <ChevronRight
          size={16}
          className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          {group.transactions.map((t) => {
            const txnRemaining = parseFloat(t.remaining_amount || 0);
            return (
              <div key={t.id} className="flex items-center border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0" onClick={() => onTransactionClick(t.id)}>
                  <TransactionItem transaction={t} onClick={() => {}} />
                </div>
                {txnRemaining > 0 && (
                  <button
                    onClick={() => onCollect(t)}
                    className="shrink-0 mr-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Collect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================
// HELPERS
// ============================================================

const groupByParty = (transactions) => {
  const groups = {};
  transactions.forEach((t) => {
    const key = t.party_name || 'Unknown';
    if (!groups[key]) {
      groups[key] = {
        party: t.party_name || null,
        transactions: [],
        totalDue: 0,
        hasOverdue: false,
        nearestDueDate: null,
      };
    }
    groups[key].transactions.push(t);
    groups[key].totalDue += parseFloat(t.remaining_amount || t.amount);
    if (t.status === 'overdue') groups[key].hasOverdue = true;
    if (t.due_date) {
      if (!groups[key].nearestDueDate || new Date(t.due_date) < new Date(groups[key].nearestDueDate)) {
        groups[key].nearestDueDate = t.due_date;
      }
    }
  });
  return Object.values(groups).sort((a, b) => b.totalDue - a.totalDue);
};

export default ReceivablesPage;
