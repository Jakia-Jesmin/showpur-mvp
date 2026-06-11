import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Banknote, ArrowDownLeft, ArrowUpRight, TrendingUp, Minus, ChevronRight } from 'lucide-react';
import { useBusinessPulse } from '@/hooks/useBusinessPulse';

const fmt  = (n) => parseFloat(n || 0).toLocaleString('en-IN');
const fmtD = (n) => {
  const v = parseFloat(n || 0);
  return (v >= 0 ? '+' : '') + '৳' + Math.abs(v).toLocaleString('en-IN');
};

const Skeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-32 bg-gray-200 rounded-2xl" />
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
    </div>
    <div className="h-28 bg-gray-200 rounded-2xl" />
  </div>
);

const MetricCard = ({ label, labelBn, value, prefix = '৳', color = 'text-gray-800', bg = 'bg-white', border = 'border-gray-200', icon: Icon, iconColor }) => (
  <div className={`${bg} border ${border} rounded-2xl p-4 shadow-sm`}>
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        {labelBn && <p className="text-[10px] text-gray-300 mt-0.5">{labelBn}</p>}
        <p className={`text-xl font-black mt-2 ${color}`}>{prefix}{fmt(value)}</p>
      </div>
      {Icon && (
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ml-2 ${iconColor || 'bg-gray-100'}`}>
          <Icon size={18} className="text-current" />
        </div>
      )}
    </div>
  </div>
);

const BusinessPulsePage = () => {
  const navigate = useNavigate();
  const { pulse, loading, error, refresh } = useBusinessPulse();

  const p = pulse || {};
  const netChange    = parseFloat(p.net_cash_change || 0);
  const grossProfit  = parseFloat(p.todays_gross_profit || 0);
  const profitMargin = parseFloat(p.todays_sales || 0) > 0
    ? ((grossProfit / parseFloat(p.todays_sales)) * 100).toFixed(1)
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-gray-800">Daily Pulse</h1>
          <p className="text-xs text-gray-400">
            {p.date
              ? new Date(p.date).toLocaleDateString('en-BD', { weekday: 'long', day: 'numeric', month: 'long' })
              : 'Today'}
          </p>
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
          {/* ── CASH AVAILABLE (hero card) ───────────────────── */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-2xl p-5 shadow-lg">
            <p className="text-xs text-emerald-200 font-semibold uppercase tracking-wider">Cash Available</p>
            <p className="text-[11px] text-emerald-300 mb-2">মোট নগদ</p>
            <p className="text-4xl font-black tracking-tight">৳{fmt(p.cash_available)}</p>
            <div className="flex gap-4 mt-4 pt-4 border-t border-emerald-700">
              <div>
                <p className="text-[10px] text-emerald-300 font-semibold uppercase">Hand</p>
                <p className="text-base font-bold text-white">৳{fmt(p.cash_hand)}</p>
              </div>
              <div className="w-px bg-emerald-700" />
              <div>
                <p className="text-[10px] text-emerald-300 font-semibold uppercase">Bank</p>
                <p className="text-base font-bold text-white">৳{fmt(p.bank_balance)}</p>
              </div>
            </div>
          </div>

          {/* ── TODAY'S TRADING ──────────────────────────────── */}
          <div>
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Today's Trading</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/acshow/transactions')}
                className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm text-left hover:bg-blue-100/60 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sales</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">আজকের বিক্রয়</p>
                    <p className="text-xl font-black mt-2 text-blue-700">৳{fmt(p.todays_sales)}</p>
                  </div>
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 ml-2">
                    <TrendingUp size={18} className="text-blue-600" />
                  </div>
                </div>
                <p className="text-[10px] text-blue-400 mt-2 flex items-center gap-0.5 group-hover:text-blue-600">
                  View transactions <ChevronRight size={10} />
                </p>
              </button>
              <div className={`border rounded-2xl p-4 shadow-sm ${grossProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gross Profit</p>
                <p className="text-[10px] text-gray-300 mt-0.5">মোট মুনাফা</p>
                <p className={`text-xl font-black mt-2 ${grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  ৳{fmt(grossProfit)}
                </p>
                {profitMargin !== null && (
                  <p className={`text-[11px] font-semibold mt-1 ${grossProfit >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                    {profitMargin}% margin
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── TODAY'S CASH MOVEMENT ────────────────────────── */}
          <div>
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Today's Cash Movement</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/acshow/receivables')}
                className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 shadow-sm text-left hover:bg-emerald-100/60 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Collected</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">আদায়</p>
                    <p className="text-xl font-black mt-2 text-emerald-700">৳{fmt(p.todays_collection)}</p>
                  </div>
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0 ml-2">
                    <ArrowDownLeft size={18} className="text-emerald-600" />
                  </div>
                </div>
                <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-0.5 group-hover:text-emerald-600">
                  Manage receivables <ChevronRight size={10} />
                </p>
              </button>
              <MetricCard
                label="Withdrawn"
                labelBn="উত্তোলন"
                value={p.todays_withdrawal}
                color="text-rose-700"
                bg="bg-rose-50"
                border="border-rose-100"
                icon={ArrowUpRight}
                iconColor="bg-rose-100 text-rose-500"
              />
            </div>
          </div>

          {/* ── NET CASH CHANGE ──────────────────────────────── */}
          <div className={`rounded-2xl p-4 border shadow-sm flex items-center justify-between ${
            netChange > 0 ? 'bg-emerald-50 border-emerald-200'
            : netChange < 0 ? 'bg-rose-50 border-rose-200'
            : 'bg-gray-50 border-gray-200'
          }`}>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Net Cash Change Today</p>
              <p className="text-[10px] text-gray-300 mt-0.5">নিট নগদ পরিবর্তন</p>
              <p className={`text-2xl font-black mt-2 ${
                netChange > 0 ? 'text-emerald-700' : netChange < 0 ? 'text-rose-700' : 'text-gray-500'
              }`}>
                {fmtD(netChange)}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">Collected − Withdrawn</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${
              netChange > 0 ? 'bg-emerald-100' : netChange < 0 ? 'bg-rose-100' : 'bg-gray-100'
            }`}>
              {netChange > 0 ? '📈' : netChange < 0 ? '📉' : <Minus size={20} className="text-gray-400" />}
            </div>
          </div>

          {/* ── INSIGHT STRIP ────────────────────────────────── */}
          {parseFloat(p.todays_sales || 0) > 0 && parseFloat(p.todays_collection || 0) < parseFloat(p.todays_sales || 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 items-start">
              <span className="text-base shrink-0">⚠️</span>
              <div>
                <p className="text-xs font-bold text-amber-800">Sales vs Collection Gap</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  You sold ৳{fmt(p.todays_sales)} but only collected ৳{fmt(p.todays_collection)}.{' '}
                  ৳{fmt(parseFloat(p.todays_sales || 0) - parseFloat(p.todays_collection || 0))} is still on credit.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BusinessPulsePage;
