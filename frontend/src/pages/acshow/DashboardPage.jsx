import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAcShowDashboard } from '@/hooks/useAcShowDashboard';
import { MENU_ITEMS } from '@/constants/acshowMenu';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Overview from '@/pages/acshow/components/Overview';
import OperationsOverview from '@/pages/acshow/components/OperationsOverview';
import PosTerminal from '@/pages/acshow/components/PosTerminal';
import TransactionsList from '@/pages/acshow/components/TransactionsList';
import ReportsList from '@/pages/acshow/components/ReportsList';
import SettingsView from '@/pages/acshow/components/SettingsView';
import ErrorBoundary from '@/components/ErrorBoundary';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { metrics, recentActivities, alerts, loading, error, refresh } = useAcShowDashboard();

  const activeMenuId = MENU_ITEMS.find((item) => {
    if (item.id === 'dashboard') return location.pathname === '/acshow' || location.pathname === '/acshow/';
    return location.pathname.startsWith(item.path);
  })?.id || 'dashboard';

  const handleMenuClick = (item) => navigate(item.path);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-800">
      <Sidebar menuItems={MENU_ITEMS} activeMenu={activeMenuId} onMenuClick={handleMenuClick} user={user} onLogout={handleLogout} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header user={user} onRefresh={refresh} loading={loading} alertCount={alerts.overdue_count} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
              <span className="font-medium">⚠️ Error loading data</span>
              <button onClick={refresh} className="px-4 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg font-semibold text-xs transition-colors">Retry</button>
            </div>
          )}

          <ErrorBoundary>
            <Routes>
              <Route index element={<Overview metrics={metrics} activities={recentActivities} alerts={alerts} loading={loading} onRefresh={refresh} />} />
              <Route path="operations" element={<OperationsOverview />} />
              <Route path="pos" element={<PosTerminal onRefresh={refresh} />} />
              <Route path="transactions" element={<TransactionsList />} />
              <Route path="reports" element={<ReportsList />} />
              <Route path="settings" element={<SettingsView />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;