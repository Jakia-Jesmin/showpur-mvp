// frontend/src/components/acshow/EmptyState.jsx

import React from 'react';

/**
 * Reusable empty state component for all AcShow pages.
 * 
 * Variants:
 * - default: Neutral gray card
 * - success: Green celebration
 * - error: Red warning  
 * - inline: Simple centered text (no card)
 */
const EmptyState = ({ 
  icon = '📊', 
  title = 'Nothing here yet', 
  message = '',
  actionLabel = '',
  onAction = null,
  variant = 'default'
}) => {
  
  const variants = {
    default: {
      wrapper: 'bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100',
      iconClass: 'text-5xl mb-4',
      titleClass: 'font-bold text-gray-800 mb-1',
      messageClass: 'text-gray-500 text-sm max-w-sm mx-auto',
    },
    success: {
      wrapper: 'bg-emerald-50 rounded-2xl p-10 text-center border border-emerald-100',
      iconClass: 'text-5xl mb-4',
      titleClass: 'font-bold text-emerald-800 mb-1',
      messageClass: 'text-emerald-600 text-sm max-w-sm mx-auto',
    },
    error: {
      wrapper: 'bg-red-50 rounded-2xl p-10 text-center border border-red-100',
      iconClass: 'text-5xl mb-4',
      titleClass: 'font-bold text-red-800 mb-1',
      messageClass: 'text-red-600 text-sm max-w-sm mx-auto',
    },
    inline: {
      wrapper: '',
      iconClass: 'text-6xl mb-4',
      titleClass: 'text-lg font-semibold text-gray-800 mb-2',
      messageClass: 'text-gray-500 mb-6 max-w-md mx-auto',
    },
  };

  const styles = variants[variant] || variants.default;

  const content = (
    <>
      <div className={styles.iconClass}>{icon}</div>
      <h3 className={styles.titleClass}>{title}</h3>
      {message && <p className={styles.messageClass}>{message}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold
            hover:bg-emerald-700 active:scale-95 transition-all inline-flex items-center gap-1.5"
        >
          {actionLabel}
        </button>
      )}
    </>
  );

  // Inline variant: no wrapper card
  if (variant === 'inline') {
    return <div className="text-center py-12 px-4">{content}</div>;
  }

  return <div className={styles.wrapper}>{content}</div>;
};

export default EmptyState;