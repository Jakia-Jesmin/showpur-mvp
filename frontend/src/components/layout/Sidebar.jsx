import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = () => {
  const { isProducer, isShowroom } = useAuth();

  // Clean, professional styling for active vs inactive links
  const linkStyle = ({ isActive }) => 
    `flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 ${
      isActive 
        ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-700' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-purple-600'
    }`;

  return (
    <aside className="w-64 h-[calc(100-4rem)] bg-white border-r border-gray-200 sticky top-16 hidden md:block">
      <nav className="mt-6 flex flex-col space-y-1">
        
        <NavLink to="/dashboard" className={linkStyle}>
          <span className="mr-3 text-lg">📊</span> Dashboard
        </NavLink>

        <NavLink to="/social" className={linkStyle}>
          <span className="mr-3 text-lg">📱</span> Social Feed
        </NavLink>

        <NavLink to="/products" className={linkStyle}>
          <span className="mr-3 text-lg">📦</span> 
          {isProducer ? 'My Products' : 'Product Catalog'}
        </NavLink>

        <NavLink to="/connections" className={linkStyle}>
          <span className="mr-3 text-lg">🤝</span> Connections
        </NavLink>

        <NavLink to="/agreements" className={linkStyle}>
          <span className="mr-3 text-lg">📄</span> Agreements
        </NavLink>

        <NavLink to="/search" className={linkStyle}>
          <span className="mr-3 text-lg">🔍</span> Explore
        </NavLink>

      </nav>

      {/* Role Badge - Bottom of Sidebar */}
      <div className="absolute bottom-0 w-full p-6 bg-gray-50 border-t border-gray-100">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Account Type</p>
        <p className="text-sm font-bold text-purple-900 mt-1">
          {isProducer ? 'PRODUCER' : isShowroom ? 'SHOWROOM' : 'MEMBER'}
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
