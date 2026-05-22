// frontend/src/pages/acshow/TrialPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { acshowAPI } from '../../api/acshow';

/**
 * AcShow Trial Signup Page
 * 
 * Shown to users who haven't activated AcShow yet.
 */
const AcShowTrialPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const startTrial = async () => {
    setLoading(true);
    try {
      await acshowAPI.startTrial();
      navigate('/acshow/dashboard');
    } catch (err) {
      console.error('Failed to start trial:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 
      flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="text-6xl mb-6">💰</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">AcShow</h1>
        <p className="text-gray-600 mb-8">
          Simple accounting & cashflow tools for your business
        </p>
        
        {/* Features */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8 text-left">
          <h2 className="font-semibold text-gray-800 mb-4">
            Everything you need to manage money:
          </h2>
          <ul className="space-y-3">
            {[
              { icon: '💰', text: 'Track daily cash position' },
              { icon: '📥', text: 'Know who owes you money' },
              { icon: '📤', text: 'Never miss a payment' },
              { icon: '📊', text: 'See business health at a glance' },
              { icon: '📱', text: 'Works on mobile and desktop' },
              { icon: '🎯', text: 'No accounting knowledge needed' },
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="text-xl">{feature.icon}</span>
                <span className="text-gray-700">{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* CTA */}
        <button
          onClick={startTrial}
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-4 rounded-xl 
            text-lg font-semibold hover:bg-emerald-700 
            active:scale-95 transition-all disabled:opacity-50 mb-4"
        >
          {loading ? 'Starting Trial...' : 'Start 14-Day Free Trial'}
        </button>
        
        <p className="text-sm text-gray-500">
          No credit card required • Cancel anytime
        </p>
      </div>
    </div>
  );
};

export default AcShowTrialPage;