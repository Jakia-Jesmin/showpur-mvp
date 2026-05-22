// frontend/src/pages/acshow/SettingsPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { acshowAPI } from '../../api/acshow';
import Spinner from '../../components/ui/Spinner';

/**
 * AcShow Settings Page
 * 
 * Configure:
 * - Financial preferences
 * - Notification settings
 * - Trial/Subscription info
 * - Default categories
 */
const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [settings, setSettings] = useState({
    currency: 'BDT',
    financialYearStart: '01-01',
    notifications: {
      paymentReminders: true,
      collectionReminders: true,
      lowCashAlerts: true,
      weeklyReport: false,
    },
    defaultCategory: 'sales',
  });
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      }
    }));
  };
  
  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };
  
  const trialDaysLeft = user?.acshow_trial_days_left || 0;
  const isTrial = !user?.acshow_enabled && trialDaysLeft > 0;
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <button 
            onClick={() => navigate('/acshow/dashboard')}
            className="text-gray-400 hover:text-gray-600 text-sm mb-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-xl font-bold text-gray-800">AcShow Settings</h1>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        
        {/* Subscription Status */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Subscription</h3>
          
          {isTrial ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎁</span>
                <span className="font-semibold text-emerald-700">Free Trial Active</span>
              </div>
              <p className="text-sm text-emerald-600 mb-2">
                {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} remaining in your trial
              </p>
              <div className="bg-emerald-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-emerald-600 rounded-full h-2"
                  style={{ width: `${(trialDaysLeft / 14) * 100}%` }}
                />
              </div>
              <button className="w-full bg-emerald-600 text-white py-2 rounded-lg font-medium text-sm">
                Upgrade Now
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <span className="font-semibold text-green-700">AcShow Pro Active</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Preferences */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Preferences</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">Currency</span>
              <select
                value={settings.currency}
                onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              >
                <option value="BDT">BDT (৳)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">Financial Year Start</span>
              <select
                value={settings.financialYearStart}
                onChange={(e) => setSettings(prev => ({ ...prev, financialYearStart: e.target.value }))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              >
                <option value="01-01">January 1</option>
                <option value="07-01">July 1</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">Default Category</span>
              <select
                value={settings.defaultCategory}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultCategory: e.target.value }))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              >
                <option value="sales">Product Sales</option>
                <option value="service">Service Income</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Notifications */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Notifications</h3>
          
          <div className="space-y-3">
            <ToggleRow
              label="Payment Reminders"
              description="Get reminded before payments are due"
              checked={settings.notifications.paymentReminders}
              onChange={() => handleToggle('paymentReminders')}
            />
            <ToggleRow
              label="Collection Reminders"
              description="Get reminded to collect dues"
              checked={settings.notifications.collectionReminders}
              onChange={() => handleToggle('collectionReminders')}
            />
            <ToggleRow
              label="Low Cash Alerts"
              description="Get alerted when cash runs low"
              checked={settings.notifications.lowCashAlerts}
              onChange={() => handleToggle('lowCashAlerts')}
            />
            <ToggleRow
              label="Weekly Report"
              description="Receive weekly business summary"
              checked={settings.notifications.weeklyReport}
              onChange={() => handleToggle('weeklyReport')}
            />
          </div>
        </div>
        
        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-emerald-600 text-white py-4 rounded-xl text-lg font-semibold
            hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Settings'}
        </button>
        
        {/* Help */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Help & Support</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 flex items-center gap-3">
              <span>📖</span>
              <span className="text-sm text-gray-700">How to use AcShow</span>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 flex items-center gap-3">
              <span>💬</span>
              <span className="text-sm text-gray-700">Contact Support</span>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 flex items-center gap-3">
              <span>📊</span>
              <span className="text-sm text-gray-700">Data Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toggle Row Component
const ToggleRow = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex-1 mr-4">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
    <button
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        checked ? 'bg-emerald-600' : 'bg-gray-300'
      }`}
    >
      <div
        className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-0.5'
        }`}
      />
    </button>
  </div>
);

export default SettingsPage;