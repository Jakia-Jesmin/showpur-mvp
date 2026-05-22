import React from 'react';
import { LogOut } from 'lucide-react';

const Sidebar = ({ menuItems, activeMenu, onMenuClick, user, onLogout }) => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-20">
      {/* Brand */}
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-md">
          SP
        </div>
        <div>
          <h2 className="font-bold text-gray-800 text-base leading-tight">ShowPur</h2>
          <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">AcShow Command</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onMenuClick(item)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-emerald-700' : 'text-gray-400'} />
              <span className="leading-tight">{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-600" />}
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/80">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700 truncate">{user?.full_name || user?.username || 'User'}</p>
            <p className="text-[10px] text-gray-400">{user?.role === 'producer' ? 'Producer' : 'Showroom'}</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;