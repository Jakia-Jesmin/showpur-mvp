import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAcShowDashboard } from '@/hooks/useAcShowDashboard';
import { MENU_ITEMS } from '@/constants/acshowMenu';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Overview from '@/pages/acshow/components/Overview';
import OperationsOverview from '@/pages/acshow/components/OperationsOverview';
import PosTerminal from '@/pages/acshow/components/PosTerminal';
import ReportsList from '@/pages/acshow/components/ReportsList';
import SettingsView from '@/pages/acshow/components/SettingsView';
import QuickRecordModal from '@/pages/acshow/QuickRecordModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Bell, RefreshCw, Menu, X } from 'lucide-react';
import ContactsPage from '@/pages/acshow/contacts/ContactsPage';
import ProductsPage from '@/pages/acshow/products/ProductsPage';
import AlertsPage from '@/pages/acshow/alerts/AlertsPage';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { metrics, recentActivities, alerts, loading, error, refresh } = useAcShowDashboard();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQuickRecord, setShowQuickRecord] = useState(false);
  const [quickRecordType, setQuickRecordType] = useState(null);

  const activeMenuId = MENU_ITEMS.find((item) => {
    if (item.id === 'dashboard') return location.pathname === '/acshow' || location.pathname === '/acshow/';
    return location.pathname.startsWith(item.path);
  })?.id || 'dashboard';

  const handleMenuClick = (item) => {
    if (item.isQuick) {
      setQuickRecordType(item.id.replace('quick-', ''));
      setShowQuickRecord(true);
      return;
    }
    if (item.path) navigate(item.path);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleQuickRecordSuccess = () => {
    setShowQuickRecord(false);
    setQuickRecordType(null);
    refresh();
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-800">
      
      {/* ================= MOBILE HEADER ================= */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0 relative z-40">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1.5 hover:bg-gray-100 rounded-lg">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="w-8 h-8 bg-linear-to-br from-emerald-600 to-emerald-800 text-white rounded-lg flex items-center justify-center font-bold text-sm">SP</div>
          <h2 className="font-bold text-gray-800 text-sm">ShowPur</h2>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={refresh} className="p-2 hover:bg-gray-100 rounded-full">
            <RefreshCw size={16} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => navigate('/acshow/alerts')} className="relative p-2">
            <Bell size={16} className="text-gray-500" />
            {alerts.overdue_count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {alerts.overdue_count > 9 ? '9+' : alerts.overdue_count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ================= MOBILE SIDEBAR OVERLAY ================= */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 bg-white h-full overflow-y-auto shadow-xl animate-in slide-in-from-left">
            <Sidebar menuItems={MENU_ITEMS} activeMenu={activeMenuId} onMenuClick={handleMenuClick} user={user} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className="hidden lg:block shrink-0">
        <Sidebar menuItems={MENU_ITEMS} activeMenu={activeMenuId} onMenuClick={handleMenuClick} user={user} onLogout={handleLogout} />
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="hidden lg:block">
          <Header user={user} onRefresh={refresh} loading={loading} alertCount={alerts.overdue_count} />
        </div>

        <main className="flex-1 overflow-y-auto p-3 md:p-6 pb-24 lg:pb-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
              <span className="font-medium">⚠️ Error loading data</span>
              <button onClick={refresh} className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg font-semibold text-xs">Retry</button>
            </div>
          )}

          <ErrorBoundary>
            <Routes>
              <Route index element={<Overview metrics={metrics} activities={recentActivities} alerts={alerts} loading={loading} onRefresh={refresh} onQuickAction={(type) => { setQuickRecordType(type); setShowQuickRecord(true); }} />} />
              <Route path="operations" element={<OperationsOverview />} />
              <Route path="pos" element={<PosTerminal onRefresh={refresh} />} />
              <Route path="reports" element={<ReportsList />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="settings" element={<SettingsView />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="*" element={<div className="text-center py-12">Page not found</div>} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 flex justify-around py-1.5 safe-area-bottom">
        {MENU_ITEMS.filter(item => !item.isDivider && !item.isQuick).slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeMenuId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-w-14 ${
                isActive ? 'text-emerald-600' : 'text-gray-400'
              }`}
            >
              {Icon && <Icon size={20} />}
              <span className="text-[10px] font-medium leading-tight text-center">
                {item.label.split('(')[0].trim()}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ================= QUICK RECORD MODAL ================= */}
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

export default DashboardPage;
