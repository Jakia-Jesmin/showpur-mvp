// frontend/src/pages/acshow/CashflowPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { acshowAPI } from '@/api/acshow';
import Spinner from '@/components/ui/Spinner';
import { TrendingUp, TrendingDown, Minus, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import EmptyState from '@/components/acshow/EmptyState';

// ============================================
// CONSTANTS
// ============================================

const DAY_OPTIONS = [
  { value: 7, label: '7 Days (৭ দিন)' },
  { value: 14, label: '14 Days (১৪ দিন)' },
  { value: 30, label: '30 Days (৩০ দিন)' },
  { value: 90, label: '90 Days (৯০ দিন)' },
];

// ============================================
// MAIN COMPONENT
// ============================================

const CashflowPage = () => {
  const navigate = useNavigate();

  const [todayCash, setTodayCash] = useState(null);
  const [weekData, setWeekData] = useState(null);
  const [reportDays, setReportDays] = useState(30);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('week'); // week | month

  useEffect(() => {
    fetchAllData();
  }, [reportDays]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [todayRes, weekRes, reportRes] = await Promise.all([
        acshowAPI.getTodayCash(),
        acshowAPI.getWeekSummary(),
        acshowAPI.getCashflowReport(reportDays),
      ]);
      setTodayCash(todayRes.data.data);
      setWeekData(weekRes.data);
      setReport(reportRes.data);
    } catch (err) {
      console.error('Failed to fetch cashflow data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20"><Spinner /></div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <button
            onClick={() => navigate('/acshow/dashboard')}
            className="text-gray-400 hover:text-gray-600 text-xs mb-1 flex items-center gap-1"
          >
            ← Dashboard
          </button>
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Cashflow <span className="text-gray-400 text-sm font-normal">(ক্যাশফ্লো)</span>
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">

        {/* Today's Cash Hero */}
        {todayCash && (
          <div className={`rounded-2xl p-6 text-center shadow-lg ${
            todayCash.cash_position_status === 'healthy'
              ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white'
              : todayCash.cash_position_status === 'warning'
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
              : 'bg-gradient-to-br from-red-500 to-rose-600 text-white'
          }`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">
              Cash Today (আজকের ক্যাশ)
            </p>
            <h2 className="text-4xl font-black mb-4">
              ৳{parseFloat(todayCash.closing_balance).toLocaleString('en-IN')}
            </h2>
            <div className="flex justify-center gap-8 text-sm">
              <div className="text-center">
                <p className="opacity-70 text-xs mb-0.5">In (আসেছে)</p>
                <p className="font-bold">+৳{parseFloat(todayCash.total_cash_in).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-center border-l border-white/20 pl-8">
                <p className="opacity-70 text-xs mb-0.5">Out (গেছে)</p>
                <p className="font-bold">-৳{parseFloat(todayCash.total_cash_out).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex gap-2">
          {[
            { key: 'week', label: '7-Day Chart (৭ দিন)' },
            { key: 'month', label: 'Summary Report (রিপোর্ট)' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedView(tab.key)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedView === tab.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 7-DAY BAR CHART VIEW */}
        {selectedView === 'week' && weekData?.dates?.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Calendar size={16} className="text-emerald-600" />
                Last 7 Days (গত ৭ দিন)
              </h3>
              <TrendIndicator trend={weekData.trend} />
            </div>

            {/* Bar Chart */}
            <div className="space-y-3">
              {weekData.dates.map((day) => {
                const maxVal = Math.max(
                  ...weekData.dates.map(d => Math.max(d.cash_in, d.cash_out, 1))
                );
                const inWidth = (day.cash_in / maxVal) * 100;
                const outWidth = (day.cash_out / maxVal) * 100;

                return (
                  <div key={day.date} className="flex items-center gap-3">
                    {/* Date Label */}
                    <div className="w-16 shrink-0">
                      <p className="text-xs font-semibold text-gray-700">
                        {new Date(day.date).toLocaleDateString('en-BD', { weekday: 'short' })}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(day.date).getDate()}
                      </p>
                    </div>

                    {/* Bars */}
                    <div className="flex-1 space-y-1.5">
                      {/* Cash In */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-600 font-bold w-5 text-right">IN</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden relative">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-md transition-all duration-500"
                            style={{ width: `${Math.max(inWidth, 2)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-600 w-16 text-right font-medium">
                          ৳{parseFloat(day.cash_in).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Cash Out */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-rose-600 font-bold w-5 text-right">OUT</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden relative">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-400 to-rose-500 rounded-md transition-all duration-500"
                            style={{ width: `${Math.max(outWidth, 2)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-600 w-16 text-right font-medium">
                          ৳{parseFloat(day.cash_out).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-emerald-400 to-emerald-500" />
                <span className="text-[10px] font-semibold text-gray-500">Money In (আসেছে)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-rose-400 to-rose-500" />
                <span className="text-[10px] font-semibold text-gray-500">Money Out (গেছে)</span>
              </div>
            </div>
          </div>
        )}

        {/* SUMMARY REPORT VIEW */}
        {selectedView === 'month' && report && (
          <div className="space-y-4">
            {/* Period Selector */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar size={16} className="text-emerald-600" />
                  Summary (সারাংশ)
                </h3>
                <select
                  value={reportDays}
                  onChange={(e) => setReportDays(Number(e.target.value))}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold bg-gray-50"
                >
                  {DAY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ReportCard
                  icon={<ArrowUp size={14} />}
                  label="Total Income (মোট আয়)"
                  amount={report.summary.total_income}
                  color="emerald"
                />
                <ReportCard
                  icon={<ArrowDown size={14} />}
                  label="Total Expenses (মোট খরচ)"
                  amount={report.summary.total_expenses}
                  color="rose"
                />
                <ReportCard
                  icon={report.summary.net_cashflow >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  label="Net Cashflow (নেট)"
                  amount={report.summary.net_cashflow}
                  color={report.summary.net_cashflow >= 0 ? 'blue' : 'rose'}
                />
                <ReportCard
                  icon={<Minus size={14} />}
                  label="Avg Daily (দৈনিক গড়)"
                  amount={report.summary.average_daily_income}
                  color="purple"
                  isAverage
                />
              </div>
            </div>

            {/* Daily Breakdown */}
            {report.daily_data?.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-3">Daily Breakdown (দৈনিক হিসাব)</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {report.daily_data.map((day) => (
                    <div
                      key={day.date}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      <span className="text-gray-600 text-xs">
                        {new Date(day.date).toLocaleDateString('en-BD', { day: 'numeric', month: 'short' })}
                      </span>
                      <div className="flex gap-4">
                        <span className="text-emerald-600 font-medium text-xs">
                          +৳{parseFloat(day.cash_in).toLocaleString('en-IN')}
                        </span>
                        <span className="text-rose-600 font-medium text-xs">
                          -৳{parseFloat(day.cash_out).toLocaleString('en-IN')}
                        </span>
                        <span className={`font-semibold text-xs ${
                          parseFloat(day.closing_balance) >= 0 ? 'text-gray-800' : 'text-rose-600'
                        }`}>
                          ৳{parseFloat(day.closing_balance).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upcoming 7-Day Forecast */}
        {todayCash && (todayCash.upcoming_receivables > 0 || todayCash.upcoming_payables > 0) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-emerald-600" />
              Next 7 Days Forecast (আগামী ৭ দিন)
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <p className="text-emerald-600 font-bold text-sm">
                  +৳{parseFloat(todayCash.upcoming_receivables || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Expected In (আসবে)</p>
              </div>
              <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                <p className="text-rose-600 font-bold text-sm">
                  -৳{parseFloat(todayCash.upcoming_payables || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Expected Out (যাবে)</p>
              </div>
              <div className={`rounded-xl p-3 border ${
                (todayCash.upcoming_receivables || 0) - (todayCash.upcoming_payables || 0) >= 0
                  ? 'bg-blue-50 border-blue-100'
                  : 'bg-red-50 border-red-100'
              }`}>
                <p className={`font-bold text-sm ${
                  (todayCash.upcoming_receivables || 0) - (todayCash.upcoming_payables || 0) >= 0
                    ? 'text-blue-600' : 'text-red-600'
                }`}>
                  ৳{parseFloat((todayCash.upcoming_receivables || 0) - (todayCash.upcoming_payables || 0)).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Net (নেট)</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!todayCash && !loading && (
          <EmptyState
            icon="📊"
            title="No Cashflow Data Yet"
            message="Start recording transactions to see your cashflow analysis."
            variant="default"
          />
        )}
      </div>
    </div>
  );
};

// ============================================
// TREND INDICATOR
// ============================================

const TrendIndicator = ({ trend }) => {
  const config = {
    up: { icon: <TrendingUp size={14} />, label: 'Trending Up (বাড়ছে)', color: 'text-emerald-600 bg-emerald-50' },
    down: { icon: <TrendingDown size={14} />, label: 'Trending Down (কমছে)', color: 'text-rose-600 bg-rose-50' },
    stable: { icon: <Minus size={14} />, label: 'Stable (স্থিতিশীল)', color: 'text-gray-600 bg-gray-100' },
  };

  const { icon, label, color } = config[trend] || config.stable;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${color}`}>
      {icon} {label}
    </span>
  );
};

// ============================================
// REPORT CARD
// ============================================

const ReportCard = ({ icon, label, amount, color, isAverage }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };

  return (
    <div className={`${colors[color]} rounded-xl p-3 border`}>
      <div className="flex items-center gap-1.5 mb-1 opacity-70">
        {icon}
        <span className="text-[10px] font-semibold">{label}</span>
      </div>
      <div className="text-lg font-bold">
        {isAverage ? '≈' : ''}৳{parseFloat(amount).toLocaleString('en-IN')}
      </div>
    </div>
  );
};

export default CashflowPage;
