// frontend/src/pages/acshow/ReceivablesPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { acshowAPI } from '@/api/acshow';
import TransactionItem from '@/components/acshow/TransactionItem';
import Spinner from '@/components/ui/Spinner';
import { AlertTriangle, Clock, CheckCircle, ChevronRight, Phone, User } from 'lucide-react';
import EmptyState from '@/components/acshow/EmptyState';

const ReceivablesPage = () => {
  const navigate = useNavigate();
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [totalDue, setTotalDue] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [overdueAmount, setOverdueAmount] = useState(0);

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
      
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <button
            onClick={() => navigate('/acshow/dashboard')}
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

        {/* Summary Hero Card */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-100 mb-1">
            Total Outstanding (মোট বাকি)
          </p>
          <h2 className="text-3xl font-black mb-4">৳{totalDue.toLocaleString('en-IN')}</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-white/20 px-3 py-1 rounded-full font-medium">
              {grouped.length} Customer{grouped.length !== 1 ? 's' : ''}
            </span>
            {overdueCount > 0 && (
              <span className="bg-red-500/40 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                <AlertTriangle size={12} /> {overdueCount} Overdue — ৳{overdueAmount.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All (সব)' },
            { key: 'pending', label: '⏳ Pending (বাকি)' },
            { key: 'overdue', label: '⚠️ Overdue (সময় পার)', warning: true },
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
    </div>
  );
};

// ============================================
// CUSTOMER CARD COMPONENT
// ============================================

const CustomerCard = ({ group, onTransactionClick }) => {
  const [expanded, setExpanded] = useState(false);
  const daysUntilDue = group.nearestDueDate
    ? Math.ceil((new Date(group.nearestDueDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
      group.hasOverdue ? 'border-red-200' : 'border-gray-100'
    }`}>
      {/* Customer Header */}
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
              <span>{group.transactions.length} invoice{group.transactions.length > 1 ? 's' : ''}</span>
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
            ৳{group.totalDue.toLocaleString('en-IN')}
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

      {/* Expanded Transactions */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          {group.transactions.map((t) => (
            <TransactionItem
              key={t.id}
              transaction={t}
              onClick={onTransactionClick}
            />
          ))}
          <div className="px-4 py-2 text-center">
            <button
              onClick={() => onTransactionClick(group.transactions[0]?.id)}
              className="text-xs text-amber-600 font-semibold hover:text-amber-700"
            >
              Record Collection (টাকা কালেকশন) →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// HELPERS
// ============================================

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