// frontend/src/pages/acshow/AlertsPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlerts } from '@/hooks/useAcShow';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/acshow/EmptyState';
import { Bell, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';

/**
 * Alerts & Notifications Page (সতর্কতা)
 * 
 * Shows all business alerts:
 * - Payment reminders
 * - Collection reminders
 * - Low cash warnings
 * - Overdue alerts
 */
const AlertsPage = () => {
  const navigate = useNavigate();
  const { alerts, unreadCount, markAsRead } = useAlerts();
  const [filter, setFilter] = useState('all');

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.is_read;
    if (filter === 'high') return alert.priority === 'high';
    return true;
  });

  const handleMarkAsRead = async (alertId) => {
    await markAsRead([alertId]);
  };

  const handleMarkAllRead = async () => {
    const unreadIds = alerts.filter(a => !a.is_read).map(a => a.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  const priorityConfig = {
    high: { border: 'border-l-4 border-red-500', bg: 'bg-red-50', badge: '🔴 High', badgeClass: 'bg-red-100 text-red-700' },
    medium: { border: 'border-l-4 border-amber-500', bg: 'bg-amber-50', badge: '🟡 Medium', badgeClass: 'bg-amber-100 text-amber-700' },
    low: { border: 'border-l-4 border-green-500', bg: 'bg-green-50', badge: '🟢 Low', badgeClass: 'bg-green-100 text-green-700' },
  };

  const alertIcons = {
    payment_due: '📤',
    collection_due: '📥',
    low_cash: '💰',
    low_stock: '📊',
    overdue: '⚠️',
    milestone: '🎉',
  };

  const unreadHighCount = alerts.filter(a => !a.is_read && a.priority === 'high').length;

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
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Bell size={18} className="text-gray-500" />
              Alerts <span className="text-gray-400 text-sm font-normal">(সতর্কতা)</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </h1>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <CheckCircle size={14} /> Mark All Read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">

        {/* Urgent Banner */}
        {unreadHighCount > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold text-red-800 text-sm">
                {unreadHighCount} Urgent Alert{unreadHighCount > 1 ? 's' : ''} Need{unreadHighCount === 1 ? 's' : ''} Attention
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Review and take action on high-priority alerts below.
              </p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: `All (${alerts.length})` },
            { key: 'unread', label: `Unread (${alerts.filter(a => !a.is_read).length})` },
            { key: 'high', label: '🔴 High Priority', warning: true },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                filter === tab.key
                  ? tab.warning
                    ? 'bg-red-600 text-white'
                    : 'bg-emerald-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="All Clear! (সব ঠিক আছে)"
            message="No alerts right now. We'll notify you when something needs attention."
            variant="success"
          />
        ) : filteredAlerts.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No Matching Alerts"
            message="Try changing the filter to see more alerts."
            variant="default"
          />
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const priority = priorityConfig[alert.priority] || priorityConfig.medium;
              return (
                <div
                  key={alert.id}
                  className={`${priority.border} ${priority.bg} rounded-2xl p-4 transition-all ${
                    !alert.is_read ? 'shadow-md ring-1 ring-gray-100' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                      !alert.is_read ? 'bg-white shadow-sm' : 'bg-gray-100'
                    }`}>
                      {alertIcons[alert.alert_type] || '📢'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-sm font-semibold truncate ${
                          !alert.is_read ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {alert.title}
                        </h3>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${priority.badgeClass} ml-2 shrink-0`}>
                          {priority.badge}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {alert.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">{alert.time_ago}</span>
                        <div className="flex items-center gap-2">
                          {alert.is_actionable && alert.action_url && (
                            <button
                              onClick={() => navigate(alert.action_url)}
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                            >
                              {alert.action_label || 'Take Action'} <ChevronRight size={12} />
                            </button>
                          )}
                          {!alert.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(alert.id)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Unread Dot */}
                    {!alert.is_read && (
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;