// frontend/src/pages/ChangePasswordPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsAPI } from '@/api/accounts';
import { Lock, Eye, EyeOff } from 'lucide-react';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    new_password2: '',
  });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const toggleShow = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.new_password2) {
      setError('New passwords do not match.');
      return;
    }

    if (formData.new_password.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await accountsAPI.changePassword(formData.current_password, formData.new_password, formData.new_password2);
      setSuccess(true);
      setTimeout(() => navigate('/acshow/settings'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (fieldName) => `
    w-full pl-4 pr-12 py-3.5 bg-gray-50 border rounded-xl outline-none transition-all text-sm
    ${error && !fieldName ? 'border-red-300' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500'}
  `;

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-lg">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Password Changed!</h2>
          <p className="text-gray-500 text-sm">Redirecting to settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3">
          <button
            onClick={() => navigate('/acshow/settings')}
            className="text-gray-400 hover:text-gray-600 text-xs mb-1 flex items-center gap-1"
          >
            ← Settings
          </button>
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Lock size={18} className="text-gray-500" />
            Change Password <span className="text-gray-400 text-sm font-normal">(পাসওয়ার্ড)</span>
          </h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          
          {/* Old Password */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Current Password (বর্তমান পাসওয়ার্ড)</label>
            <div className="relative">
              <input
                type={showPassword.current ? 'text' : 'password'}
                name="current_password"
                value={formData.current_password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className={inputClass()}
              />
              <button type="button" onClick={() => toggleShow('current')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">New Password (নতুন পাসওয়ারড)</label>
            <div className="relative">
              <input
                type={showPassword.new ? 'text' : 'password'}
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                required
                placeholder="Min 8 characters"
                className={inputClass()}
              />
              <button type="button" onClick={() => toggleShow('new')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Confirm Password (পুনরায় লিখুন)</label>
            <div className="relative">
              <input
                type={showPassword.confirm ? 'text' : 'password'}
                name="new_password2"
                value={formData.new_password2}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className={inputClass()}
              />
              <button type="button" onClick={() => toggleShow('confirm')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-center">
              <p className="text-sm text-red-700 font-bold">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 active:scale-95"
          >
            {loading ? 'Changing...' : 'Update Password (আপডেট)'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;