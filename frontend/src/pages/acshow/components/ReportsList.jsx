import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, FileText, Download } from 'lucide-react';

const REPORTS = [
  { icon: <TrendingUp size={20} />, title: 'Cashflow Report', desc: 'Daily cash in/out analysis', path: '/acshow/cashflow', active: true },
  { icon: <FileText size={20} />, title: 'Transaction History', desc: 'All financial records', path: '/acshow/transactions', active: true },
  { icon: <Download size={20} />, title: 'Export Data', desc: 'Download as Excel/PDF', path: null, badge: 'Coming Soon' },
];

const ReportsList = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Reports <span className="text-gray-400 text-sm font-normal">(প্রতিবেদন)</span></h2>
      <div className="grid gap-4">
        {REPORTS.map((r) => (
          <div
            key={r.title}
            onClick={() => r.active && r.path && navigate(r.path)}
            className={`flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 shadow-sm ${r.active ? 'cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all' : 'opacity-60'}`}
          >
            <div className="p-2.5 rounded-xl bg-gray-100">{r.icon}</div>
            <div className="flex-1">
              <p className="font-bold text-gray-800">{r.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
            </div>
            {r.badge && <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{r.badge}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsList;