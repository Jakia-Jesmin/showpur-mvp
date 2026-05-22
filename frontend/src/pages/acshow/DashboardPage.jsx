// frontend/src/pages/acshow/DashboardPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcShowDashboard } from '@/hooks/useAcShow';
import { useAuth } from '@/hooks/useAuth';
import QuickRecordModal from '@/pages/acshow/QuickRecordModal';
import Spinner from '@/components/ui/Spinner';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Users, 
  TrendingUp, 
  Settings,
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  ShoppingBag,
  ChevronRight,
  Bell,
  LogOut
} from 'lucide-react';

// ============================================
// CONSTANTS
// ============================================

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard (ড্যাশবোর্ড)', icon: LayoutDashboard, path: '/acshow/dashboard' },
  { id: 'transactions', label: 'Transactions (লেনদেন)', icon: ArrowLeftRight, path: '/acshow/transactions' },
  { id: 'receivables', label: 'To Collect (পাওনা)', icon: ArrowDownLeft, path: '/acshow/receivables' },
  { id: 'payables', label: 'To Pay (দেনা)', icon: ArrowUpRight, path: '/acshow/payables' },
  { id: 'cashflow', label: 'Cashflow (ক্যাশফ্লো)', icon: TrendingUp, path: '/acshow/cashflow' },
  { id: 'health', label: 'Business Health', icon: Users, path: '/acshow/health' },
  { id: 'settings', label: 'Settings (সেটিংস)', icon: Settings, path: '/acshow/settings' },
];

// ============================================
// SUB-COMPONENTS
// ============================================

const Sidebar = ({ activeMenu, onMenuClick, user, onLogout }) => (
  <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20 shadow-sm">
    {/* Brand Header */}
    <div className="p-5 border-b border-gray-100 flex items-center gap-3">
      <div className="w-10 h-10 bg-linear-to-br from-emerald-600 to-emerald-800 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-md">
        SP
      </div>
      <div>
        <h2 className="font-bold text-gray-800 tracking-tight text-base leading-tight">ShowPur</h2>
        <p className="text-[10px] font-semibold text-emerald-700 tracking-wide uppercase">AcShow Command</p>
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {MENU_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeMenu === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onMenuClick(item)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
              isActive 
                ? 'bg-emerald-50 text-emerald-800 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <Icon size={18} className={isActive ? 'text-emerald-700' : 'text-gray-400'} />
            <span className="leading-tight">{item.label}</span>
            {isActive && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-600" />
            )}
          </button>
        );
      })}
    </nav>

    {/* User Footer */}
    <div className="p-4 border-t border-gray-100 bg-gray-50/80">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-full bg-linear-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
          {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-700 truncate">
            {user?.full_name || user?.username || 'User'}
          </p>
          <p className="text-[10px] text-gray-400">
            {user?.role === 'producer' ? 'Producer' : 'Showroom'}
          </p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <LogOut size={14} />
        Sign Out
      </button>
    </div>
  </aside>
);

const CashHeroCard = ({ cashData }) => (
  <div className="bg-linear-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl p-6 shadow-lg border border-emerald-900/20">
    <div className="flex justify-between items-center mb-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200/80">
        Today's Position (আজকের ক্যাশ পরিস্থিতি)
      </span>
      <span className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full font-medium border border-emerald-500/20">
        🟢 Active
      </span>
    </div>
    
    <h2 className="text-4xl font-black tracking-tight mb-6">
      ৳{(cashData.today_cash || 0).toLocaleString('en-IN')}
    </h2>
    
    <div className="grid grid-cols-2 gap-4 pt-5 border-t border-emerald-700/40 text-sm">
      <div className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-700/20">
        <span className="text-emerald-300 text-xs block mb-0.5">To Collect (পাওনা)</span>
        <span className="font-bold text-emerald-50 text-lg">
          +৳{(cashData.pending_collections || 0).toLocaleString('en-IN')}
        </span>
      </div>
      <div className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-700/20">
        <span className="text-emerald-300 text-xs block mb-0.5">To Pay (দেনা)</span>
        <span className="font-bold text-rose-300 text-lg">
          -৳{(cashData.pending_payments || 0).toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  </div>
);

const UrgentAlerts = ({ cashData, onNavigate }) => (
  <div className="space-y-2">
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
      Urgent Attention (জরুরি নোটিশ)
    </h3>

    {cashData.overdue_customers_count > 0 && (
      <button
        onClick={() => onNavigate('/acshow/receivables')}
        className="w-full bg-amber-50 border border-amber-200/70 rounded-xl p-4 flex items-start gap-3 hover:bg-amber-100 transition-colors text-left"
      >
        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
        <div>
          <p className="text-sm font-bold text-amber-900">
            {cashData.overdue_customers_count} Customer{cashData.overdue_customers_count > 1 ? 's' : ''} Overdue
          </p>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            ৳{(cashData.overdue_collections_amount || 0).toLocaleString('en-IN')} tied up in delayed balances (বাকির টাকা আটকে আছে).
          </p>
        </div>
        <ChevronRight size={16} className="text-amber-400 mt-1 ml-auto" />
      </button>
    )}

    {cashData.upcoming_payments_count > 0 && (
      <button
        onClick={() => onNavigate('/acshow/payables')}
        className="w-full bg-blue-50 border border-blue-200/70 rounded-xl p-4 flex items-start gap-3 hover:bg-blue-100 transition-colors text-left"
      >
        <div className="text-blue-600 shrink-0 mt-0.5 text-lg">📅</div>
        <div>
          <p className="text-sm font-bold text-blue-900">
            {cashData.upcoming_payments_count} Payment{cashData.upcoming_payments_count > 1 ? 's' : ''} Due Soon
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Plan ahead for upcoming supplier payments.
          </p>
        </div>
        <ChevronRight size={16} className="text-blue-400 mt-1 ml-auto" />
      </button>
    )}

    {!cashData.overdue_customers_count && !cashData.upcoming_payments_count && (
      <div className="bg-green-50 border border-green-200/70 rounded-xl p-4 flex items-center gap-3">
        <div className="text-green-600 text-lg">✅</div>
        <p className="text-sm font-medium text-green-800">Everything is on track. No urgent issues.</p>
      </div>
    )}
  </div>
);

const ForecastCard = ({ cashData }) => {
  const dates = cashData.cash_forecast ? Object.values(cashData.cash_forecast).slice(0, 7) : [];
  const totalIn = dates.reduce((sum, d) => sum + (d.expected_in || 0), 0);
  const totalOut = dates.reduce((sum, d) => sum + (d.expected_out || 0), 0);
  const estimatedBalance = (cashData.today_cash || 0) + totalIn - totalOut;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="text-emerald-600" size={16} />
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          7-Day Forecast (আগামী ৭ দিন)
        </h4>
      </div>
      <div className="space-y-2.5 text-xs text-gray-600 border-b border-gray-100 pb-3 mb-3">
        <div className="flex justify-between">
          <span className="text-gray-500">Expected Incoming (আসবে)</span>
          <span className="text-emerald-600 font-semibold">+৳{totalIn.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Expected Outgoing (যাবে)</span>
          <span className="text-rose-600 font-semibold">-৳{totalOut.toLocaleString('en-IN')}</span>
        </div>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-gray-800">Estimated Balance</span>
        <span className={`text-sm font-bold ${estimatedBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          ৳{estimatedBalance.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
};

const QuickActions = ({ onAction }) => (
  <div>
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
      Quick Actions (দ্রুত কাজ)
    </h3>
    <div className="grid grid-cols-2 gap-3">
      <button 
        onClick={() => onAction('collection')}
        className="flex flex-col items-start gap-2 bg-white border border-gray-200/80 p-3.5 rounded-xl shadow-sm hover:border-emerald-300 hover:shadow-md active:bg-gray-50 transition-all text-left"
      >
        <ArrowDownLeft className="text-emerald-600 bg-emerald-50 p-1.5 rounded-lg" size={28} />
        <div>
          <p className="text-sm font-semibold text-gray-800">Receive Money</p>
          <p className="text-[11px] text-gray-400">টাকা কালেকশন</p>
        </div>
      </button>

      <button 
        onClick={() => onAction('payment')}
        className="flex flex-col items-start gap-2 bg-white border border-gray-200/80 p-3.5 rounded-xl shadow-sm hover:border-rose-300 hover:shadow-md active:bg-gray-50 transition-all text-left"
      >
        <ArrowUpRight className="text-rose-600 bg-rose-50 p-1.5 rounded-lg" size={28} />
        <div>
          <p className="text-sm font-semibold text-gray-800">Pay Supplier</p>
          <p className="text-[11px] text-gray-400">সাপ্লায়ারকে পরিশোধ</p>
        </div>
      </button>

      <button 
        onClick={() => onAction('sale')}
        className="flex flex-col items-start gap-2 bg-white border border-gray-200/80 p-3.5 rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md active:bg-gray-50 transition-all text-left"
      >
        <ShoppingBag className="text-blue-600 bg-blue-50 p-1.5 rounded-lg" size={28} />
        <div>
          <p className="text-sm font-semibold text-gray-800">Record Sale</p>
          <p className="text-[11px] text-gray-400">বিক্রয় যোগ করুন</p>
        </div>
      </button>

      <button 
        onClick={() => onAction('expense')}
        className="flex flex-col items-start gap-2 bg-white border border-gray-200/80 p-3.5 rounded-xl shadow-sm hover:border-purple-300 hover:shadow-md active:bg-gray-50 transition-all text-left"
      >
        <div className="text-purple-600 bg-purple-50 p-1.5 rounded-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Add Expense</p>
          <p className="text-[11px] text-gray-400">খরচ হিসাব</p>
        </div>
      </button>
    </div>
  </div>
);

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data, loading, refresh } = useAcShowDashboard();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showQuickRecord, setShowQuickRecord] = useState(false);
  const [quickRecordType, setQuickRecordType] = useState(null);

  const handleMenuClick = (item) => {
    setActiveMenu(item.id);
    navigate(item.path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickAction = (type) => {
    setQuickRecordType(type);
    setShowQuickRecord(true);
  };

  const handleQuickRecordSuccess = () => {
    setShowQuickRecord(false);
    setQuickRecordType(null);
    refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  const cashData = data || {
    today_cash: 0,
    pending_collections: 0,
    pending_payments: 0,
    overdue_customers_count: 0,
    overdue_collections_amount: 0,
    upcoming_payments_count: 0,
    low_stock_items: 0,
  };

  return (
    <div className="flex bg-gray-50 min-h-screen text-gray-900 font-sans antialiased">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <Sidebar 
        activeMenu={activeMenu}
        onMenuClick={handleMenuClick}
        user={user}
        onLogout={handleLogout}
      />

      {/* ================= RIGHT CONTENT AREA ================= */}
      <main className="flex-1 ml-64 min-h-screen">
        
        {/* Header Ribbon */}
        <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-200/60 z-10">
          <div className="flex justify-between items-center px-8 py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Business Overview</h1>
              <p className="text-xs text-gray-400">Real-time cash position & operational insights</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/acshow/alerts')}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Bell size={20} className="text-gray-500" />
                {cashData.overdue_customers_count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cashData.overdue_customers_count}
                  </span>
                )}
              </button>
              <div className="text-right text-xs text-gray-400">
                <p className="font-medium text-gray-600">
                  {new Date().toLocaleDateString('en-BD', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p>Updated just now</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* ================= MAIN COLUMN (2/3) ================= */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Hero Cash Card */}
              <CashHeroCard cashData={cashData} />

              {/* Quick Actions */}
              <QuickActions onAction={handleQuickAction} />

              {/* Recent Transactions */}
              {cashData.recent_transactions?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Recent Activity
                    </h3>
                    <button
                      onClick={() => navigate('/acshow/transactions')}
                      className="text-xs text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1"
                    >
                      View All <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    {cashData.recent_transactions.slice(0, 5).map((t) => (
                      <div 
                        key={t.id}
                        onClick={() => navigate(`/acshow/transactions/${t.id}`)}
                        className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${
                            t.transaction_type === 'income' 
                              ? 'bg-emerald-100 text-emerald-600' 
                              : 'bg-rose-100 text-rose-600'
                          }`}>
                            {t.transaction_type === 'income' ? '↓' : '↑'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {t.party_name || t.description}
                            </p>
                            <p className="text-xs text-gray-400">
                              {t.category_display || t.transaction_type_display}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ml-3 ${
                          t.transaction_type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {t.transaction_type === 'income' ? '+' : '-'}৳{parseFloat(t.amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ================= RIGHT COLUMN (1/3) ================= */}
            <div className="space-y-4">
              
              {/* Urgent Alerts */}
              <UrgentAlerts cashData={cashData} onNavigate={navigate} />

              {/* Forecast Card */}
              <ForecastCard cashData={cashData} />

              {/* Today's Summary */}
              <div className="bg-gray-100/60 border border-gray-200/60 rounded-xl p-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Today's Summary
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-700">
                  <li className="flex items-center gap-1.5 text-emerald-800 font-medium">
                    ✅ Dashboard updated with live data
                  </li>
                  {cashData.overdue_customers_count > 0 && (
                    <li className="flex items-center gap-1.5 text-amber-800">
                      ⚠️ {cashData.overdue_customers_count} customer{cashData.overdue_customers_count > 1 ? 's' : ''} with overdue payments
                    </li>
                  )}
                  {cashData.upcoming_payments_count > 0 && (
                    <li className="flex items-center gap-1.5 text-blue-800">
                      📅 {cashData.upcoming_payments_count} payment{cashData.upcoming_payments_count > 1 ? 's' : ''} due this week
                    </li>
                  )}
                </ul>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ================= QUICK RECORD MODAL ================= */}
      {showQuickRecord && (
        <QuickRecordModal
          type={quickRecordType}
          onClose={() => {
            setShowQuickRecord(false);
            setQuickRecordType(null);
          }}
          onSuccess={handleQuickRecordSuccess}
        />
      )}
    </div>
  );
};

export default DashboardPage;
