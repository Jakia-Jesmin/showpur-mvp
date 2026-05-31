import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuickRecordModal from '@/pages/acshow/QuickRecordModal';
import { AlertTriangle, ChevronRight } from 'lucide-react';

// Icon + colour per transaction type (includes new sale / purchase types)
const TYPE_CONFIG = {
  income:     { icon: '↑',  bg: 'bg-emerald-100', text: 'text-emerald-600',  sign: '+' },
  sale:       { icon: '🛒', bg: 'bg-blue-100',    text: 'text-blue-600',     sign: '+' },
  receivable: { icon: '📥', bg: 'bg-amber-100',   text: 'text-amber-600',    sign: '+' },
  expense:    { icon: '↓',  bg: 'bg-rose-100',    text: 'text-rose-600',     sign: '-' },
  purchase:   { icon: '📦', bg: 'bg-purple-100',  text: 'text-purple-600',   sign: '-' },
  payable:    { icon: '📤', bg: 'bg-blue-100',    text: 'text-blue-600',     sign: '-' },
};

const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN');

const Overview = ({ metrics, activities, alerts, forecast, loading, onRefresh }) => {
  const navigate = useNavigate();
  const [showQuickRecord, setShowQuickRecord] = useState(false);
  const [quickRecordType, setQuickRecordType] = useState(null);
  const m = metrics || {};

  const handleQuickAction = (type) => {
    setQuickRecordType(type);
    setShowQuickRecord(true);
  };

  const isProfit  = (m.today_pl || 0) >= 0;
  const totalCash = (m.cash_in_hand || 0) + (m.cash_at_bank || 0);

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* ── ACCOUNT BALANCE CARDS ────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">

        {/* Cash in Hand */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-2xl p-4 shadow">
          <p className="text-xs text-emerald-200 font-semibold uppercase tracking-wider mb-1">Cash in Hand</p>
          <p className="text-2xl font-black">৳{fmt(m.cash_in_hand)}</p>
          <p className="text-[11px] text-emerald-300 mt-1">নগদ হাতে</p>
        </div>

        {/* Cash at Bank */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-4 shadow">
          <p className="text-xs text-blue-200 font-semibold uppercase tracking-wider mb-1">Cash at Bank</p>
          <p className="text-2xl font-black">৳{fmt(m.cash_at_bank)}</p>
          <p className="text-[11px] text-blue-300 mt-1">ব্যাংকে টাকা</p>
        </div>

        {/* Accounts Receivable */}
        <button
          onClick={() => navigate('/acshow/receivables')}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left hover:bg-amber-100 transition-colors"
        >
          <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-1">To Collect</p>
          <p className="text-xl font-bold text-amber-800">৳{fmt(m.accounts_receivable)}</p>
          <p className="text-[11px] text-amber-500 mt-1">গ্রাহকের কাছে পাওনা</p>
        </button>

        {/* Accounts Payable */}
        <button
          onClick={() => navigate('/acshow/payables')}
          className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-left hover:bg-rose-100 transition-colors"
        >
          <p className="text-xs text-rose-600 font-semibold uppercase tracking-wider mb-1">To Pay</p>
          <p className="text-xl font-bold text-rose-800">৳{fmt(m.accounts_payable)}</p>
          <p className="text-[11px] text-rose-500 mt-1">সরবরাহকারীকে দেনা</p>
        </button>
      </div>

      {/* ── DAILY P&L ────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Today's Profit / Loss
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-2xl font-black ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isProfit ? '+' : '-'}৳{fmt(Math.abs(m.today_pl || 0))}
              </span>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span>Revenue: <span className="text-emerald-600 font-semibold">৳{fmt(m.today_revenue)}</span></span>
              <span>COGS: <span className="text-purple-600 font-semibold">৳{fmt(m.today_cogs)}</span></span>
              <span>Opex: <span className="text-rose-600 font-semibold">৳{fmt(m.today_expenses)}</span></span>
            </div>
            {/* Progress bar */}
            {((m.today_revenue || 0) + (m.today_expenses || 0) + (m.today_cogs || 0)) > 0 && (
              <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${m.today_revenue > 0 ? (m.today_revenue / (m.today_revenue + m.today_cogs + m.today_expenses)) * 100 : 0}%` }}
                />
                <div
                  className="h-full bg-purple-400 transition-all duration-500"
                  style={{ width: `${m.today_cogs > 0 ? (m.today_cogs / (m.today_revenue + m.today_cogs + m.today_expenses)) * 100 : 0}%` }}
                />
                <div
                  className="h-full bg-rose-400 transition-all duration-500"
                  style={{ width: `${m.today_expenses > 0 ? (m.today_expenses / (m.today_revenue + m.today_cogs + m.today_expenses)) * 100 : 0}%` }}
                />
              </div>
            )}
          </div>
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl ml-4 shrink-0 ${isProfit ? 'bg-emerald-100' : 'bg-rose-100'}`}>
            {isProfit ? '📈' : '📉'}
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-5 gap-2">
          {[
            { type: 'collection', icon: '💵', label: 'Receive',  bn: 'কালেকশন', border: 'hover:border-emerald-300' },
            { type: 'payment',   icon: '💸', label: 'Pay',      bn: 'পরিশোধ',   border: 'hover:border-rose-300' },
            { type: 'sale',      icon: '🛒', label: 'Sale',     bn: 'বিক্রয়',    border: 'hover:border-blue-300' },
            { type: 'purchase',  icon: '📦', label: 'Purchase', bn: 'কেনা',      border: 'hover:border-purple-300' },
            { type: 'expense',   icon: '🧾', label: 'Expense',  bn: 'খরচ',       border: 'hover:border-orange-300' },
          ].map(({ type, icon, label, bn, border }) => (
            <button
              key={type}
              onClick={() => handleQuickAction(type)}
              className={`flex flex-col items-center justify-center gap-1.5 p-3 bg-white border border-gray-200 rounded-xl shadow-sm ${border} hover:shadow-md active:scale-95 transition-all`}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-xs font-bold text-gray-800 leading-tight">{label}</span>
              <span className="text-[10px] text-gray-400">{bn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERDUE ALERTS ───────────────────────────────── */}
      {(alerts?.overdue_receivables_count > 0) && (
        <button
          onClick={() => navigate('/acshow/receivables')}
          className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 hover:bg-amber-100 transition-colors text-left"
        >
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">
              {alerts.overdue_receivables_count} Overdue Receivable{alerts.overdue_receivables_count > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              ৳{fmt(alerts.overdue_receivables_amount)} overdue from customers
            </p>
          </div>
          <ChevronRight size={16} className="text-amber-400 mt-1" />
        </button>
      )}

      {(alerts?.overdue_payables_count > 0) && (
        <button
          onClick={() => navigate('/acshow/payables')}
          className="w-full bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 hover:bg-rose-100 transition-colors text-left"
        >
          <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-sm font-bold text-rose-900">
              {alerts.overdue_payables_count} Overdue Payment{alerts.overdue_payables_count > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-rose-700 mt-0.5">
              ৳{fmt(alerts.overdue_payables_amount)} overdue to suppliers
            </p>
          </div>
          <ChevronRight size={16} className="text-rose-400 mt-1" />
        </button>
      )}

      {/* ── 7-DAY CASHFLOW FORECAST ──────────────────────── */}
      {forecast?.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">7-Day Forecast</h3>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {forecast.map((day, i) => (
              <div
                key={day.date}
                className={`flex items-center justify-between px-4 py-2.5 text-sm ${i < forecast.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <span className="text-gray-500 w-24 shrink-0">
                  {new Date(day.date).toLocaleDateString('en-BD', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <div className="flex gap-4 text-xs">
                  {day.expected_in > 0 && (
                    <span className="text-emerald-600 font-semibold">+৳{fmt(day.expected_in)}</span>
                  )}
                  {day.expected_out > 0 && (
                    <span className="text-rose-600 font-semibold">-৳{fmt(day.expected_out)}</span>
                  )}
                  {day.expected_in === 0 && day.expected_out === 0 && (
                    <span className="text-gray-300">—</span>
                  )}
                </div>
                <span className={`text-xs font-bold w-20 text-right ${day.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {day.net >= 0 ? '+' : ''}৳{fmt(day.net)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RECENT ACTIVITY ──────────────────────────────── */}
      {activities?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Activity</h3>
            <button
              onClick={() => navigate('/acshow/transactions')}
              className="text-xs text-emerald-600 font-medium flex items-center gap-1 hover:text-emerald-700"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {activities.slice(0, 8).map((t) => {
              const cfg = TYPE_CONFIG[t.transaction_type] || TYPE_CONFIG.income;
              return (
                <div
                  key={t.id}
                  onClick={() => navigate(`/acshow/transactions/${t.id}`)}
                  className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${cfg.bg} ${cfg.text}`}>
                      {cfg.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {t.party_name || t.description}
                      </p>
                      <p className="text-xs text-gray-400">{t.transaction_type_display}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end ml-3 shrink-0">
                    <span className={`text-sm font-semibold ${cfg.text}`}>
                      {cfg.sign}৳{fmt(t.amount)}
                    </span>
                    {t.remaining_amount > 0 && (
                      <span className="text-[10px] text-amber-500">৳{fmt(t.remaining_amount)} due</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ALL CLEAR ────────────────────────────────────── */}
      {!alerts?.overdue_count && activities?.length === 0 && !loading && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="font-bold text-emerald-800">All Clear!</h3>
          <p className="text-sm text-emerald-600 mt-1">No pending issues. Start recording transactions.</p>
        </div>
      )}

      {showQuickRecord && (
        <QuickRecordModal
          type={quickRecordType}
          onClose={() => { setShowQuickRecord(false); setQuickRecordType(null); }}
          onSuccess={() => { setShowQuickRecord(false); setQuickRecordType(null); onRefresh(); }}
        />
      )}
    </div>
  );
};

export default Overview;
