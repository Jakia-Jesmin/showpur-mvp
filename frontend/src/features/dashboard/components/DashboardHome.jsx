import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/baseApi'; // Updated path
import { useAuth } from '../../context/AuthContext';

function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate(); // For SPA navigation
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, [user?.role]); // Dependency added for safety

  const fetchDashboardStats = async () => {
    try {
      const endpoint = user?.role === 'producer' 
        ? '/dashboard/producer/' 
        : '/dashboard/showroom/';
      const response = await api.get(endpoint);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading stats...</div>;

  return (
    <div className="dashboard-home">
      <header className="home-header">
        <h1>Welcome back, {user?.username}!</h1>
        <span className="role-badge">{user?.role}</span>
      </header>

      {/* Producer View */}
      {user?.role === 'producer' && stats && (
        <div className="stats-grid">
          <StatCard icon="📦" value={stats.stats?.total_products} label="Total Products" />
          <StatCard icon="🏪" value={stats.stats?.active_agreements} label="Active Displays" />
          <StatCard icon="💰" value={`$${stats.stats?.total_commission_earned || 0}`} label="Commission Earned" />
          <StatCard icon="📊" value={stats.stats?.total_units_sold} label="Units Sold" />
        </div>
      )}

      {/* Showroom View */}
      {user?.role === 'showroom' && stats && (
        <div className="stats-grid">
          <StatCard icon="📦" value={stats.stats?.active_agreements} label="Products Displayed" />
          <StatCard icon="🏭" value={stats.stats?.unique_producers} label="Partner Producers" />
          <StatCard icon="💰" value={`$${stats.stats?.total_commission_earned || 0}`} label="Commission Earned" />
          <StatCard icon="📐" value={`${stats.stats?.space_utilization || 0}%`} label="Space Utilization" />
        </div>
      )}

      <section className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          {user?.role === 'producer' && (
            <>
              <button className="action-btn" onClick={() => navigate('/dashboard/products/add')}>
                ➕ Add New Product
              </button>
              <button className="action-btn" onClick={() => navigate('/dashboard/connections')}>
                🤝 Find Showrooms
              </button>
            </>
          )}
          {user?.role === 'showroom' && (
            <button className="action-btn" onClick={() => navigate('/dashboard/connections')}>
              🤝 Find Producers
            </button>
          )}
          <button className="action-btn" onClick={() => navigate('/dashboard/profile')}>
            ✏️ Edit Profile
          </button>
        </div>
      </section>
    </div>
  );
}

// Small helper component for clean code
const StatCard = ({ icon, value, label }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value || 0}</div>
    <div className="stat-label">{label}</div>
  </div>
);

export default DashboardHome;