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
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl p-6 shadow-lg border border-emerald-900/20">
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

      {/* ===== QUICK ACTIONS ===== */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Actions (দ্রুত কাজ)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { type: 'collection', icon: <ArrowDownLeft size={24} />, label: 'Receive Money', sub: 'টাকা কালেকশন', color: 'emerald' },
            { type: 'payment', icon: <ArrowUpRight size={24} />, label: 'Pay Supplier', sub: 'সাপ্লায়ারকে পরিশোধ', color: 'rose' },
            { type: 'sale', icon: <ShoppingBag size={24} />, label: 'Record Sale', sub: 'বিক্রয় যোগ করুন', color: 'blue' },
            { type: 'expense', icon: <Plus size={24} />, label: 'Add Expense', sub: 'খরচ হিসাব', color: 'purple' },
          ].map((btn) => {
            const colorMap = {
              emerald: 'text-emerald-600 bg-emerald-50 hover:border-emerald-300',
              rose: 'text-rose-600 bg-rose-50 hover:border-rose-300',
              blue: 'text-blue-600 bg-blue-50 hover:border-blue-300',
              purple: 'text-purple-600 bg-purple-50 hover:border-purple-300',
            };
            return (
              <button
                key={btn.type}
                onClick={() => handleQuickAction(btn.type)}
                className={`flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all text-center ${colorMap[btn.color]}`}
              >
                <div className={`p-2 rounded-lg ${colorMap[btn.color].split(' ')[1]}`}>{btn.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{btn.label}</p>
                  <p className="text-[10px] text-gray-400">{btn.sub}</p>
                </div>
              </button>
            );
          })}
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
                    t.transaction_type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {t.transaction_type === 'income' ? '↓' : '↑'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.party_name || t.description}</p>
                    <p className="text-xs text-gray-400">{t.category_display || t.transaction_type_display}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ml-3 shrink-0 ${t.transaction_type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.transaction_type === 'income' ? '+' : '-'}৳{parseFloat(t.amount).toLocaleString('en-IN')}
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