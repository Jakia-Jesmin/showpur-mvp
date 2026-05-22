import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, TrendingUp, ChevronRight } from 'lucide-react';

const OPERATIONS_CARDS = [
  { icon: <ArrowDownLeft size={24} />, title: 'To Collect', sub: 'পাওনা', desc: 'View and manage receivables', path: '/acshow/receivables', color: 'emerald' },
  { icon: <ArrowUpRight size={24} />, title: 'To Pay', sub: 'দেনা', desc: 'View and manage payables', path: '/acshow/payables', color: 'rose' },
  { icon: <TrendingUp size={24} />, title: 'Cashflow', sub: 'ক্যাশফ্লো', desc: 'Analyze cash movements', path: '/acshow/cashflow', color: 'blue' },
];

const COLOR_MAP = {
  emerald: 'bg-emerald-50 border-emerald-200 hover:border-emerald-300',
  rose: 'bg-rose-50 border-rose-200 hover:border-rose-300',
  blue: 'bg-blue-50 border-blue-200 hover:border-blue-300',
};

const ICON_BG = {
  emerald: 'bg-emerald-100 text-emerald-700',
  rose: 'bg-rose-100 text-rose-700',
  blue: 'bg-blue-100 text-blue-700',
};

const OperationsOverview = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Operations <span className="text-gray-400 text-sm font-normal">(অপারেশন)</span></h2>
      <div className="grid gap-4">
        {OPERATIONS_CARDS.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className={`flex items-center gap-5 p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all text-left ${COLOR_MAP[card.color]}`}
          >
            <div className={`p-3 rounded-xl ${ICON_BG[card.color]}`}>{card.icon}</div>
            <div className="flex-1">
              <p className="font-bold text-gray-800">{card.title} <span className="text-xs text-gray-500 font-normal">({card.sub})</span></p>
              <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default OperationsOverview;