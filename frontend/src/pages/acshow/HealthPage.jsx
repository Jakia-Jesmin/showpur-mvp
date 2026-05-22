// frontend/src/pages/acshow/HealthPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { acshowAPI } from '@/api/acshow';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/acshow/EmptyState';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Lightbulb } from 'lucide-react';

const HealthPage = () => {
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    acshowAPI.getHealth()
      .then(res => setHealth(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20"><Spinner /></div>
    );
  }

  if (error || !health) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <button onClick={() => navigate('/acshow/dashboard')} className="text-gray-400 hover:text-gray-600 text-xs mb-1 flex items-center gap-1">
              ← Dashboard
            </button>
            <h1 className="text-lg font-bold text-gray-800">Business Health</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <EmptyState
            icon="💔"
            title="Couldn't Load Health Data"
            message="Please check your connection and try again."
            actionLabel="Try Again"
            onAction={() => window.location.reload()}
            variant="error"
          />
        </div>
      </div>
    );
  }

  const scoreColor = health.health_score >= 80
    ? 'text-emerald-600'
    : health.health_score >= 50
    ? 'text-amber-600'
    : 'text-red-600';

  const scoreBg = health.health_score >= 80
    ? 'bg-gradient-to-br from-emerald-50 to-emerald-100'
    : health.health_score >= 50
    ? 'bg-gradient-to-br from-amber-50 to-amber-100'
    : 'bg-gradient-to-br from-red-50 to-red-100';

  const scoreStroke = health.health_score >= 80
    ? '#059669'
    : health.health_score >= 50
    ? '#d97706'
    : '#dc2626';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <button onClick={() => navigate('/acshow/dashboard')} className="text-gray-400 hover:text-gray-600 text-xs mb-1 flex items-center gap-1">
            ← Dashboard
          </button>
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Activity size={18} className="text-gray-500" />
            Business Health <span className="text-gray-400 text-sm font-normal">(স্বাস্থ্য)</span>
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">

        {/* Health Score Card */}
        <div className={`${scoreBg} rounded-2xl p-6 text-center shadow-sm border`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Health Score (স্বাস্থ্য স্কোর)
          </p>

          {/* Score Circle */}
          <div className="relative w-36 h-36 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke={scoreStroke}
                strokeWidth="10"
                strokeDasharray={`${(health.health_score / 100) * 339.292} 339.292`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-black ${scoreColor}`}>{health.health_score}</span>
              <span className="text-[10px] text-gray-400">out of 100</span>
            </div>
          </div>

          <div className={`text-lg font-bold ${scoreColor}`}>
            {health.health_status_display}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Last updated: {new Date(health.last_calculated).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-600" />
            Key Metrics (মূল সূচক)
          </h3>
          <div className="space-y-1">
            <MetricRow label="Monthly Revenue (মাসিক আয়)" value={`৳${parseFloat(health.monthly_revenue).toLocaleString('en-IN')}`} color="emerald" />
            <MetricRow label="Monthly Expenses (মাসিক খরচ)" value={`৳${parseFloat(health.monthly_expenses).toLocaleString('en-IN')}`} color="rose" />
            <MetricRow label="Profit Margin (লাভের হার)" value={`${health.profit_margin}%`} color={health.profit_margin >= 20 ? 'emerald' : health.profit_margin >= 0 ? 'amber' : 'rose'} />
            <MetricRow label="Collection Rate (আদায়ের হার)" value={`${health.collection_rate}%`} color={health.collection_rate >= 80 ? 'emerald' : health.collection_rate >= 50 ? 'amber' : 'rose'} status={health.collection_rate_status} />
            <MetricRow label="Cash Buffer (নগদ reserves)" value={`${health.cash_buffer_days} days`} color={health.cash_buffer_days >= 14 ? 'emerald' : health.cash_buffer_days >= 7 ? 'amber' : 'rose'} status={health.cash_buffer_status} />
          </div>
        </div>

        {/* Pressure Indicators */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" />
            Pressure Points (চাপের জায়গা)
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <PressureCard label="Due Pressure (পাওনা)" count={health.due_pressure} description="Overdue collections" onClick={() => navigate('/acshow/receivables')} />
            <PressureCard label="Pay Pressure (দেনা)" count={health.payment_pressure} description="Urgent payments" onClick={() => navigate('/acshow/payables')} />
            <PressureCard label="Stock (স্টক)" count={health.stock_pressure} description="Low stock items" onClick={() => navigate('/products')} />
          </div>
        </div>

        {/* Recommendations */}
        {health.recommendations?.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-500" />
              Recommendations (পরামর্শ)
            </h3>
            <div className="space-y-2">
              {health.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl border ${
                    rec.priority === 'high'
                      ? 'border-red-200 bg-red-50'
                      : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-800 mb-1">{rec.message}</p>
                  {rec.action_url && (
                    <button onClick={() => navigate(rec.action_url)} className="text-xs text-emerald-600 font-semibold hover:text-emerald-700">
                      {rec.action} →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Recommendations */}
        {(!health.recommendations || health.recommendations.length === 0) && (
          <div className="bg-emerald-50 rounded-2xl p-6 text-center border border-emerald-100">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm font-semibold text-emerald-800">Your business looks healthy!</p>
            <p className="text-xs text-emerald-600 mt-0.5">No critical recommendations at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Metric Row
const MetricRow = ({ label, value, color, status }) => {
  const colors = {
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
    amber: 'text-amber-600',
  };

  return (
    <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div>
        <span className="text-sm text-gray-700 font-medium">{label}</span>
        {status && <p className="text-[10px] text-gray-400 mt-0.5">{status.label}</p>}
      </div>
      <span className={`font-bold text-sm ${colors[color] || 'text-gray-800'}`}>{value}</span>
    </div>
  );
};

// Pressure Card
const PressureCard = ({ label, count, description, onClick }) => (
  <button
    onClick={onClick}
    className={`text-center p-3 rounded-xl transition-all hover:shadow-md active:scale-95 ${
      count > 5 ? 'bg-red-50 border border-red-100' : count > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-emerald-50 border border-emerald-100'
    }`}
  >
    <div className={`text-2xl font-black mb-1 ${
      count > 5 ? 'text-red-600' : count > 0 ? 'text-amber-600' : 'text-emerald-600'
    }`}>
      {count}
    </div>
    <div className="text-[11px] font-semibold text-gray-700">{label}</div>
    <div className="text-[10px] text-gray-400">{description}</div>
  </button>
);

export default HealthPage;
