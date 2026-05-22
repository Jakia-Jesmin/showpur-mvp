// frontend/src/components/acshow/QuickActionButton.jsx

import React from 'react';

/**
 * Large, tappable action buttons for mobile use.
 * 
 * SME owners should be able to tap these easily
 * even on small screens.
 */
const QuickActionButton = ({ icon, label, onClick, variant = 'primary' }) => {
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
    secondary: 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50',
    warning: 'bg-orange-500 text-white hover:bg-orange-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        ${variants[variant]}
        w-full py-4 px-3 rounded-xl font-medium
        flex flex-col items-center justify-center gap-1
        transition-all duration-200 active:scale-95
        min-h-20 text-sm
      `}
    >
      <span className="text-2xl">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

export default QuickActionButton;