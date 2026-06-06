// frontend/src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { useAcShowAccess } from '@/hooks/useAcShow';

// Pages - Public
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';

// Pages - Showpur
import BusinessProfilePage from '@/pages/BusinessProfilePage';
import ConnectionsPage from '@/pages/ConnectionsPage';
import ProductsPage from '@/pages/ProductsPage';
import AgreementsPage from '@/pages/AgreementsPage';
import SocialFeedPage from '@/pages/SocialFeedPage';
import SearchPage from '@/pages/SearchPage';

// Pages - AcShow
import AcShowDashboard from '@/pages/acshow/DashboardPage';
import AcShowTrialPage from '@/pages/acshow/TrialPage';
import TransactionsPage from '@/pages/acshow/TransactionsPage';
import TransactionDetailPage from '@/pages/acshow/TransactionDetailPage';
import CashflowPage from '@/pages/acshow/CashflowPage';
import ReceivablesPage from '@/pages/acshow/ReceivablesPage';
import PayablesPage from '@/pages/acshow/PayablesPage';
import AlertsPage from '@/pages/acshow/alerts/AlertsPage';
import HealthPage from '@/pages/acshow/HealthPage';
import SettingsPage from '@/pages/acshow/SettingsPage';
import ChartOfAccountsPage from '@/pages/acshow/ChartOfAccountsPage';

// Components
import PrivateRoute from '@/components/PrivateRoute';
import Spinner from '@/components/ui/Spinner';

// Password Reset
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';

// ============================================
// LOADING COMPONENT
// ============================================

const FullScreenLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <Spinner size="lg" />
  </div>
);

// ============================================
// PROTECTED ROUTE WRAPPERS
// ============================================

const AcShowRoute = ({ children }) => {
  const { hasAccess, loading } = useAcShowAccess();

  if (loading) return <FullScreenLoader />;
  if (!hasAccess) return <Navigate to="/acshow/trial" replace />;

  return children;
};

// ============================================
// APP ROUTES
// ============================================

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  return (
    <Routes>
      {/* ============================================ */}
      {/* PUBLIC ROUTES (No Auth Required) */}
      {/* ============================================ */}

      <Route
        path="/"
        element={!user ? <LandingPage /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/login"
        element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/register"
        element={!user ? <RegisterPage /> : <Navigate to="/dashboard" replace />}
      />

      {/* ============================================ */}
      {/* SHOWPUR PROTECTED ROUTES */}
      {/* ============================================ */}

      <Route
        path="/dashboard/*"
        element={
          <PrivateRoute>
            <AcShowDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <BusinessProfilePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/connections"
        element={
          <PrivateRoute>
            <ConnectionsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/products"
        element={
          <PrivateRoute>
            <ProductsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/agreements"
        element={
          <PrivateRoute>
            <AgreementsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/social"
        element={
          <PrivateRoute>
            <SocialFeedPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/search"
        element={
          <PrivateRoute>
            <SearchPage />
          </PrivateRoute>
        }
      />
      {/* ============================================ */}
      {/* PASSWORD RESET */}
      {/* ============================================ */}
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* ============================================ */}
      {/* ACSHOW ROUTES */}
      {/* ============================================ */}
    
      <Route
        path="/acshow/trial"
        element={
          <PrivateRoute>
            <AcShowTrialPage />
          </PrivateRoute>
        }
      />

      {/* Password Change */}
      <Route
        path="/acshow/change-password"
        element={
          <PrivateRoute>
            <ChangePasswordPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/acshow/chart-of-accounts"
        element={
          <PrivateRoute>
            <AcShowRoute>
              <ChartOfAccountsPage />
            </AcShowRoute>
          </PrivateRoute>
        }
      />

      {/* All other AcShow routes handled by DashboardPage */}
      <Route
        path="/acshow/*"
        element={
          <PrivateRoute>
            <AcShowRoute>
              <AcShowDashboard />
            </AcShowRoute>
          </PrivateRoute>
        }
      />

      {/* ============================================ */}
      {/* 404 - CATCH ALL */}
      {/* ============================================ */}

      <Route
        path="*"
        element={
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center px-4">
              <div className="text-6xl mb-4">🔍</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
              <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
              <a
                href="/"
                className="inline-block bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all"
              >
                Go Home
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

// ============================================
// APP COMPONENT
// ============================================

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
