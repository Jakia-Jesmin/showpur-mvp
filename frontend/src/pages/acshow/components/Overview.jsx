import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuickRecordModal from '@/pages/acshow/QuickRecordModal';
import { ArrowDownLeft, ArrowUpRight, ShoppingBag, AlertTriangle, ChevronRight, TrendingUp, Plus } from 'lucide-react';

const Overview = ({ metrics, activities, alerts, loading, onRefresh }) => {
  const navigate = useNavigate();
  const [showQuickRecord, setShowQuickRecord] = useState(false);
  const [quickRecordType, setQuickRecordType] = useState(null);
  const m = metrics || {};

  const handleQuickAction = (type) => {
    setQuickRecordType(type);
    setShowQuickRecord(true);
  };

  const handleQuickRecordSuccess = () => {
    setShowQuickRecord(false);
    setQuickRecordType(null);
    onRefresh();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* ===== HERO CASH CARD ===== */}
      <div className="bg-linear-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl p-6 shadow-lg border border-emerald-900/20">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200/80">
            Today's Position (আজকের ক্যাশ)
          </span>
          <span className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full font-medium border border-emerald-500/20">
            🟢 Active
          </span>
        </div>
        <h2 className="text-4xl font-black tracking-tight mb-6">৳{(m.today_cash || 0).toLocaleString('en-IN')}</h2>
        <div className="grid grid-cols-2 gap-4 pt-5 border-t border-emerald-700/40 text-sm">
          <div className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-700/20">
            <span className="text-emerald-300 text-xs block mb-0.5">To Collect (পাওনা)</span>
            <span className="font-bold text-emerald-50 text-lg">+৳{(m.pending_collections || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-700/20">
            <span className="text-emerald-300 text-xs block mb-0.5">To Pay (দেনা)</span>
            <span className="font-bold text-rose-300 text-lg">-৳{(m.pending_payments || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
      {/* ===== TODAY'S PROFIT / LOSS ===== */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Today's Profit/Loss (আজকের লাভ/ক্ষতি)
            </h3>
            {(() => {
              const income = m.today_income || 0;
              const expense = m.today_expenses || 0;
              const profit = income - expense;
              const margin = income > 0 ? ((profit / income) * 100) : 0;
              const isProfit = profit >= 0;

              return (
                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-black ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isProfit ? '+' : '-'}৳{Math.abs(profit).toLocaleString('en-IN')}
                    </span>
                    {income > 0 && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isProfit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {isProfit ? '↑' : '↓'} {Math.abs(margin).toFixed(1)}% margin
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>Income: <span className="text-emerald-600 font-semibold">৳{income.toLocaleString('en-IN')}</span></span>
                    <span>Expense: <span className="text-rose-600 font-semibold">৳{expense.toLocaleString('en-IN')}</span></span>
                  </div>
                  {/* Visual bar */}
                  {income > 0 || expense > 0 ? (
                    <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                        style={{ width: `${income > 0 ? (income / (income + expense)) * 100 : 0}%` }}
                      />
                      <div 
                        className="h-full bg-rose-400 rounded-r-full transition-all duration-500"
                        style={{ width: `${expense > 0 ? (expense / (income + expense)) * 100 : 0}%` }}
                      />
                    </div>
                  ) : (
                    <div className="mt-3 h-2 bg-gray-100 rounded-full" />
                  )}
                  <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                    <span>Income (আয়)</span>
                    <span>Expense (খরচ)</span>
                  </div>
                </div>
              );
            })()}
          </div>
          
          {/* Icon */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
            (m.today_income || 0) - (m.today_expenses || 0) >= 0 
              ? 'bg-emerald-100' 
              : 'bg-rose-100'
          }`}>
            {(m.today_income || 0) - (m.today_expenses || 0) >= 0 ? '📈' : '📉'}
          </div>
        </div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Actions (দ্রুত কাজ)</h3>
        <div className="grid grid-cols-5 gap-2">
          
          <button onClick={() => handleQuickAction('collection')}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-emerald-300 hover:shadow-md active:scale-95 transition-all text-center">
            <span className="text-2xl">💵</span>
            <span className="text-sm font-bold text-gray-800">Receive</span>
            <span className="text-[11px] text-gray-500 font-medium">কালেকশন</span>
          </button>

          <button onClick={() => handleQuickAction('payment')}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-rose-300 hover:shadow-md active:scale-95 transition-all text-center">
            <span className="text-2xl">💸</span>
            <span className="text-sm font-bold text-gray-800">Pay</span>
            <span className="text-[11px] text-gray-500 font-medium">পরিশোধ</span>
          </button>

          <button onClick={() => handleQuickAction('sale')}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md active:scale-95 transition-all text-center">
            <span className="text-2xl">🛒</span>
            <span className="text-sm font-bold text-gray-800">Sale</span>
            <span className="text-[11px] text-gray-500 font-medium">বিক্রয়</span>
          </button>

          <button onClick={() => handleQuickAction('purchase')}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-300 hover:shadow-md active:scale-95 transition-all text-center">
            <span className="text-2xl">📦</span>
            <span className="text-sm font-bold text-gray-800">Purchase</span>
            <span className="text-[11px] text-gray-500 font-medium">কেনা</span>
          </button>

          <button onClick={() => handleQuickAction('expense')}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-orange-300 hover:shadow-md active:scale-95 transition-all text-center">
            <span className="text-2xl">🧾</span>
            <span className="text-sm font-bold text-gray-800">Expense</span>
            <span className="text-[11px] text-gray-500 font-medium">খরচ</span>
          </button>

        </div>
      </div>

      {/* ===== ALERTS ===== */}
      {alerts.overdue_count > 0 && (
        <button onClick={() => navigate('/acshow/receivables')} className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 hover:bg-amber-100 transition-colors text-left">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">{alerts.overdue_count} Customer{alerts.overdue_count > 1 ? 's' : ''} Overdue</p>
            <p className="text-xs text-amber-700 mt-0.5">৳{(alerts.overdue_amount || 0).toLocaleString('en-IN')} tied up (বাকির টাকা আটকে আছে)</p>
          </div>
          <ChevronRight size={16} className="text-amber-400 mt-1" />
        </button>
      )}

      {alerts.upcoming_count > 0 && (
        <button onClick={() => navigate('/acshow/payables')} className="w-full bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 hover:bg-blue-100 transition-colors text-left">
          <div className="text-blue-600 text-lg">📅</div>
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-900">{alerts.upcoming_count} Payment{alerts.upcoming_count > 1 ? 's' : ''} Due Soon</p>
            <p className="text-xs text-blue-700 mt-0.5">Plan ahead for supplier payments</p>
          </div>
          <ChevronRight size={16} className="text-blue-400 mt-1" />
        </button>
      )}

      {/* ===== RECENT ACTIVITY ===== */}
      {activities?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Activity</h3>
            <button onClick={() => navigate('/acshow/transactions')} className="text-xs text-emerald-600 font-medium flex items-center gap-1 hover:text-emerald-700">
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {activities.slice(0, 5).map((t) => (
              <div
                key={t.id}
                onClick={() => navigate(`/acshow/transactions/${t.id}`)}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${
                    t.transaction_type === 'income' ? 'bg-emerald-100 text-emerald-600' : 
                    t.transaction_type === 'expense' ? 'bg-rose-100 text-rose-600' :
                    t.transaction_type === 'receivable' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {t.transaction_type === 'income' ? '↑' : 
                    t.transaction_type === 'expense' ? '↓' :
                    t.transaction_type === 'receivable' ? '📥' : '📤'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.party_name || t.description}</p>
                    <p className="text-xs text-gray-400">{t.category_display || t.transaction_type_display}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ml-3 shrink-0 ${
                  t.transaction_type === 'income' ? 'text-emerald-600' : 
                  t.transaction_type === 'expense' ? 'text-rose-600' :
                  t.transaction_type === 'receivable' ? 'text-amber-600' : 'text-blue-600'
                }`}>
                  {t.transaction_type === 'income' || t.transaction_type === 'receivable' ? '+' : '-'}৳{parseFloat(t.amount).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== ALL CLEAR STATE ===== */}
      {!alerts.overdue_count && !alerts.upcoming_count && activities?.length === 0 && !loading && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="font-bold text-emerald-800">All Clear!</h3>
          <p className="text-sm text-emerald-600 mt-1">No pending issues. Start recording transactions.</p>
        </div>
      )}

      {/* ===== QUICK RECORD MODAL ===== */}
      {showQuickRecord && (
        <QuickRecordModal
          type={quickRecordType}
          onClose={() => { setShowQuickRecord(false); setQuickRecordType(null); }}
          onSuccess={handleQuickRecordSuccess}
        />
      )}
    </div>
  );
};

export default Overview;