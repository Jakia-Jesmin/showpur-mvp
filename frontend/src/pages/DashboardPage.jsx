import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../features/dashboard/components/StatCard';
import api from '../api/baseApi';
import { useAuth } from "../hooks/useAuth";
import Spinner from '../components/ui/Spinner';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    connections: 0,
    agreements: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats/');
        setStats(response.data);
      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-top-4 duration-700">
        {/* Welcome Header */}
        <header className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Hello, <span className="text-purple-700">{user?.first_name || 'Partner'}</span>!
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Here is what's happening with your {user?.role} business today.
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            title="Active Products" 
            value={stats.products} 
            icon="📦" 
            trend="+2 this week"
            color="purple"
          />
          <StatCard 
            title="Partners" 
            value={stats.connections} 
            icon="🤝" 
            trend="Check requests"
            color="blue"
          />
          <StatCard 
            title="Agreements" 
            value={stats.agreements} 
            icon="📄" 
            trend="1 pending"
            color="amber"
          />
          <StatCard 
            title="Total Revenue" 
            value={`৳${stats.revenue.toLocaleString()}`} 
            icon="💰" 
            trend="Lifetime"
            color="green"
          />
        </div>

        {/* Dashboard Sections - Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Recent Activity / Notifications */}
          <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Performance Overview</h3>
              <button className="text-sm font-bold text-purple-700 hover:underline">View Analytics</button>
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm italic">Analytics visualization will appear here as data populates.</p>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-xl shadow-purple-100">
              <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full py-3 bg-purple-700 hover:bg-purple-600 rounded-xl font-bold transition-all text-sm">
                  + Add New Product
                </button>
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all text-sm border border-white/10">
                  Browse Partners
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Support</h3>
              <p className="text-sm text-gray-500 mb-4">Need help with your {user?.role} account?</p>
              <button className="text-sm font-bold text-purple-700 underline">Contact Success Manager</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
