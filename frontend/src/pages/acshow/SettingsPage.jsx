// frontend/src/pages/acshow/SettingsPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Bell, Shield, HelpCircle, BookOpen, MessageCircle, Download, ChevronRight } from 'lucide-react';

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
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: !prev.notifications[key] }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const trialDaysLeft = user?.acshow_trial_days_left || 0;
  const isTrial = !user?.acshow_enabled && trialDaysLeft > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <button onClick={() => navigate('/acshow/dashboard')} className="text-gray-400 hover:text-gray-600 text-xs mb-1 flex items-center gap-1">
            ← Dashboard
          </button>
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Settings <span className="text-gray-400 text-sm font-normal">(সেটিংস)</span>
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Subscription */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Shield size={16} className="text-emerald-600" />
            Subscription (সাবস্ক্রিপশন)
          </h3>
          {isTrial ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎁</span>
                <span className="font-semibold text-emerald-700">Free Trial Active</span>
              </div>
              <p className="text-sm text-emerald-600 mb-2">{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining</p>
              <div className="bg-emerald-200 rounded-full h-2 mb-3">
                <div className="bg-emerald-600 rounded-full h-2" style={{ width: `${(trialDaysLeft / 14) * 100}%` }} />
              </div>
              <button className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors">
                Upgrade Now
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <span className="font-semibold text-emerald-700">AcShow Pro Active</span>
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Preferences (পছন্দ)</h3>
          <div className="space-y-2">
            <SelectRow label="Currency (মুদ্রা)" value={settings.currency} onChange={(v) => setSettings(p => ({ ...p, currency: v }))} options={[{ v: 'BDT', l: 'BDT (৳)' }, { v: 'USD', l: 'USD ($)' }]} />
            <SelectRow label="Financial Year (অর্থ বছর)" value={settings.financialYearStart} onChange={(v) => setSettings(p => ({ ...p, financialYearStart: v }))} options={[{ v: '01-01', l: 'January' }, { v: '07-01', l: 'July' }]} />
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Bell size={16} className="text-emerald-600" />
            Notifications (নোটিফিকেশন)
          </h3>
          <div className="space-y-1">
            <ToggleRow label="Payment Reminders" description="Get reminded before payments are due" checked={settings.notifications.paymentReminders} onChange={() => handleToggle('paymentReminders')} />
            <ToggleRow label="Collection Reminders" description="Get reminded to collect dues" checked={settings.notifications.collectionReminders} onChange={() => handleToggle('collectionReminders')} />
            <ToggleRow label="Low Cash Alerts" description="Get alerted when cash runs low" checked={settings.notifications.lowCashAlerts} onChange={() => handleToggle('lowCashAlerts')} />
            <ToggleRow label="Weekly Report" description="Receive weekly business summary" checked={settings.notifications.weeklyReport} onChange={() => handleToggle('weeklyReport')} />
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Lock size={16} className="text-emerald-600" />
            Security (নিরাপত্তা)
          </h3>
          <button
            onClick={() => navigate('/acshow/change-password')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🔒</span>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">Change Password</p>
                <p className="text-xs text-gray-400">পাসওয়ার্ড পরিবর্তন করুন</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Help */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <HelpCircle size={16} className="text-emerald-600" />
            Help & Support (সাহায্য)
          </h3>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
              <span className="text-lg">📖</span>
              <span className="text-sm text-gray-700">How to use AcShow</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
              <span className="text-lg">💬</span>
              <span className="text-sm text-gray-700">Contact Support</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
              <span className="text-lg">📊</span>
              <span className="text-sm text-gray-700">Data Export</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
        >
          {saving ? 'Saving...' : saved ? '✅ Settings Saved!' : 'Save Settings (সংরক্ষণ)'}
        </button>
      </div>
    </div>
  );
};

// Toggle Row
const ToggleRow = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
    <div className="flex-1 mr-4">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-gray-300'}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
    </button>
  </div>
);

// Select Row
const SelectRow = ({ label, value, onChange, options }) => (
  <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50">
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>
);

export default SettingsPage;
