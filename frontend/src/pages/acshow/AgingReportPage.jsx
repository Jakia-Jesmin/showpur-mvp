import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ChevronRight } from 'lucide-react';
import { useAgingReport } from '@/hooks/useBusinessPulse';

const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN');

const BUCKETS = [
  {
    key:     'current',
    label:   'Current',
    labelBn: 'বর্তমান',
    sub:     'Not yet due',
    emoji:   '🟢',
    bg:      'bg-emerald-50',
    border:  'border-emerald-200',
    text:    'text-emerald-700',
    bar:     'bg-emerald-500',
  },
  {
    key:     'overdue_1_30',
    label:   '1–30 Days',
    labelBn: '১–৩০ দিন',
    sub:     'Overdue',
    emoji:   '🟡',
    bg:      'bg-amber-50',
    border:  'border-amber-200',
    text:    'text-amber-700',
    bar:     'bg-amber-400',
  },
  {
    key:     'overdue_31_60',
    label:   '31–60 Days',
    labelBn: '৩১–৬০ দিন',
    sub:     'Overdue',
    emoji:   '🟠',
    bg:      'bg-orange-50',
    border:  'border-orange-200',
    text:    'text-orange-700',
    bar:     'bg-orange-500',
  },
  {
    key:     'overdue_61_90',
    label:   '61–90 Days',
    labelBn: '৬১–৯০ দিন',
    sub:     'Overdue',
    emoji:   '🔴',
    bg:      'bg-red-50',
    border:  'border-red-200',
    text:    'text-red-700',
    bar:     'bg-red-500',
  },
  {
    key:     'overdue_90_plus',
    label:   '90+ Days',
    labelBn: '৯০+ দিন',
    sub:     'Critical',
    emoji:   '🚨',
    bg:      'bg-rose-50',
    border:  'border-rose-300',
    text:    'text-rose-800',
    bar:     'bg-rose-600',
  },
];

const Skeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-28 bg-gray-200 rounded-2xl" />
    <div className="h-10 bg-gray-200 rounded-xl" />
    {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-2xl" />)}
  </div>
);

const AgingReportPage = () => {
  const navigate = useNavigate();
  const { report, overdue, loading, error, refresh } = useAgingReport();
  const [activeFilter, setActiveFilter] = useState('all');

  const r     = report || {};
  const total = parseFloat(r.total_outstanding || 0);

  const criticalAmt = parseFloat(r.overdue_61_90 || 0) + parseFloat(r.overdue_90_plus || 0);

  const daysSince = (dateStr) => {
    if (!dateStr) return null;
    return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  };

  const filteredOverdue = activeFilter === 'all'
    ? overdue
    : overdue.filter(t => {
        const days = t.due_date ? Math.floor((Date.now() - new Date(t.due_date)) / 86400000) : 0;
        if (activeFilter === '1_30')  return days >= 1  && days <= 30;
        if (activeFilter === '31_60') return days >= 31 && days <= 60;
        if (activeFilter === '61_90') return days >= 61 && days <= 90;
        if (activeFilter === '90+')   return days > 90;
        return true;
      });

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-gray-800">Aging Report</h1>
          <p className="text-xs text-gray-400">বকেয়া বিশ্লেষণ · Receivables by age</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <RefreshCw size={16} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={refresh} className="px-3 py-1 bg-red-100 rounded-lg text-xs font-semibold">Retry</button>
        </div>
      )}

      {loading ? <Skeleton /> : (
        <>
          {/* ── TOTAL OUTSTANDING HERO ───────────────────────── */}
          <div className={`rounded-2xl p-5 shadow-lg text-white ${
            criticalAmt > 0
              ? 'bg-gradient-to-br from-rose-600 to-rose-900'
              : total > 0
                ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                : 'bg-gradient-to-br from-emerald-600 to-emerald-800'
          }`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Total Outstanding</p>
            <p className="text-[11px] opacity-60 mb-2">মোট বকেয়া</p>
            <p className="text-4xl font-black">৳{fmt(r.total_outstanding)}</p>
            <div className="mt-4 pt-4 border-t border-white/20 flex gap-6 text-xs">
              <div>
                <p className="opacity-60">Current</p>
                <p className="font-bold text-base">৳{fmt(r.current)}</p>
              </div>
              <div>
                <p className="opacity-60">Overdue</p>
                <p className="font-bold text-base">
                  ৳{fmt(total - parseFloat(r.current || 0))}
                </p>
              </div>
              <div>
                <p className="opacity-60">Critical (61d+)</p>
                <p className="font-bold text-base">৳{fmt(criticalAmt)}</p>
              </div>
            </div>

            {/* Distribution bar */}
            {total > 0 && (
              <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden flex">
                {BUCKETS.map(b => {
                  const w = ((parseFloat(r[b.key] || 0) / total) * 100).toFixed(1);
                  return parseFloat(w) > 0 ? (
                    <div key={b.key} className={`h-full ${b.bar} opacity-90`} style={{ width: `${w}%` }} />
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* ── CRITICAL ALERT ───────────────────────────────── */}
          {criticalAmt > 0 && (
            <button
              onClick={() => navigate('/acshow/receivables')}
              className="w-full bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2 items-start text-left hover:bg-rose-100 transition-colors"
            >
              <span className="text-base shrink-0">🚨</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-rose-800">Action Required</p>
                <p className="text-xs text-rose-700 mt-0.5">
                  ৳{fmt(criticalAmt)} has been outstanding for 61+ days. Follow up now before it becomes uncollectible.
                </p>
              </div>
              <ChevronRight size={16} className="text-rose-400 shrink-0 mt-0.5" />
            </button>
          )}

          {/* ── BUCKET CARDS ─────────────────────────────────── */}
          <div className="space-y-2">
            {BUCKETS.map(b => {
              const val = parseFloat(r[b.key] || 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
              return (
                <div key={b.key} className={`${b.bg} border ${b.border} rounded-2xl p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xl shrink-0">{b.emoji}</span>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold ${b.text}`}>{b.label}</p>
                        <p className="text-[11px] text-gray-400">{b.labelBn} · {b.sub}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-base font-black ${b.text}`}>৳{fmt(val)}</p>
                      <p className="text-[11px] text-gray-400">{pct}%</p>
                    </div>
                  </div>
                  {val > 0 && (
                    <div className="mt-3 h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div className={`h-full ${b.bar} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── OVERDUE TRANSACTION LIST ─────────────────────── */}
          {overdue.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Overdue ({overdue.length})
                </h2>
                {/* Quick filter pills */}
                <div className="flex gap-1">
                  {['all', '1_30', '31_60', '61_90', '90+'].map(f => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors ${
                        activeFilter === f
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {f === 'all' ? 'All' : f === '90+' ? '90+d' : `${f.replace('_', '–')}d`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {filteredOverdue.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No items in this range.</p>
                ) : (
                  filteredOverdue.map((txn, i) => {
                    const overdueDays = txn.due_date
                      ? Math.floor((Date.now() - new Date(txn.due_date)) / 86400000)
                      : null;
                    const urgency = overdueDays === null ? 'gray'
                      : overdueDays <= 30 ? 'amber'
                      : overdueDays <= 60 ? 'orange'
                      : 'rose';
                    const urgencyClasses = {
                      gray:   'bg-gray-100 text-gray-500',
                      amber:  'bg-amber-100 text-amber-700',
                      orange: 'bg-orange-100 text-orange-700',
                      rose:   'bg-rose-100 text-rose-700',
                    };

                    return (
                      <button
                        key={txn.id}
                        onClick={() => navigate(`/acshow/transactions/${txn.id}`)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                          i < filteredOverdue.length - 1 ? 'border-b border-gray-50' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {txn.party_name || txn.description || '—'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-400">{txn.transaction_type_display}</p>
                            {overdueDays !== null && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${urgencyClasses[urgency]}`}>
                                {overdueDays}d overdue
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-3 shrink-0 text-right">
                          <p className="text-sm font-bold text-gray-800">৳{fmt(txn.remaining_amount)}</p>
                          <p className="text-[11px] text-gray-400">
                            {txn.due_date
                              ? new Date(txn.due_date).toLocaleDateString('en-BD', { day: 'numeric', month: 'short' })
                              : 'No due date'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <button
                onClick={() => navigate('/acshow/receivables')}
                className="mt-2 w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center justify-center gap-1"
              >
                Go to Receivables <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* ── EMPTY STATE ──────────────────────────────────── */}
          {total === 0 && overdue.length === 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-bold text-emerald-800">All Collected!</h3>
              <p className="text-sm text-emerald-600 mt-1">No outstanding receivables. Great job!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AgingReportPage;
