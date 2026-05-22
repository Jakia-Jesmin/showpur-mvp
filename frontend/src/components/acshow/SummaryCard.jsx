// frontend/src/components/acshow/SummaryCard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Dashboard summary card component.
 * 
 * Shows key metrics like cash, dues, health score.
 * Large, clear, mobile-friendly design.
 */
const SummaryCard = ({ title, amount, subtitle, icon, color, onClick, trend }) => {
  const navigate = useNavigate();
  
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  
  const trendIcons = {
    up: '↑',
    down: '↓',
    warning: '⚠️',
    good: '✅',
    neutral: '→',
  };
  
  return (
    <div
      onClick={() => onClick && navigate(onClick)}
      className={`${colorClasses[color] || colorClasses.blue} 
        rounded-2xl p-4 border-2 cursor-pointer 
        hover:shadow-lg transition-all duration-200 
        active:scale-95 min-h-[120px]`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className="text-lg font-bold">
            {trendIcons[trend] || trend}
          </span>
        )}
      </div>
      
      <div className="text-2xl font-bold mb-1">
        {typeof amount === 'number' 
          ? `৳${amount.toLocaleString()}` 
          : amount}
      </div>
      
      <div className="text-sm font-medium opacity-80">
        {title}
      </div>
      
      {subtitle && (
        <div className="text-xs mt-1 opacity-60">
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default SummaryCard;