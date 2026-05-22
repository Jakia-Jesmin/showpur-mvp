import React from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = ({ user, onRefresh, loading, alertCount }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-10">
      <div className="flex justify-between items-center px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Business Overview</h1>
          <p className="text-xs text-gray-400">
            {new Date().toLocaleDateString('en-BD', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={18} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/acshow/alerts')}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell size={18} className="text-gray-500" />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>
          <div className="text-right text-xs text-gray-400 hidden sm:block">
            <p className="font-medium text-gray-600">{user?.full_name || user?.username}</p>
            <p>Updated just now</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;