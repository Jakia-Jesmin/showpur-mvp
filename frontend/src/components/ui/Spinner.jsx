import React from 'react';

const Spinner = ({ size = 'md', color = 'purple' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-16 w-16 border-4'
  };

  const colorClasses = {
    purple: 'border-purple-600',
    blue: 'border-blue-600',
    gray: 'border-gray-300'
  };

  return (
    <div 
      className={`animate-spin rounded-full border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// CRITICAL FIX: Add this line
export default Spinner;
