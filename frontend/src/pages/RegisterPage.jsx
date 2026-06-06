import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

function RegisterForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    password2: '',
    role: 'producer',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (formData.password !== formData.password2) {
      setErrors({ password2: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters' });
      setLoading(false);
      return;
    }

    const result = await register(formData);
    
    if (result.success) {
      if (onSuccess) onSuccess(result.user);
    } else {
      setErrors(result.error || { general: 'Registration failed. Please try again.' });
    }
    
    setLoading(false);
  };

  const inputClass = (fieldName) => `
    w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none transition-all font-medium
    ${errors[fieldName] ? 'border-red-300 focus:ring-2 focus:ring-red-100' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-purple-500'}
  `;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-purple-100/50 p-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Join ShowPur</h2>
        <p className="text-gray-500 mt-2 font-medium">Create an account to start connecting with partners</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Role Selector */}
        <div className="space-y-4">
          <label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">I want to register as a:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'producer', title: 'Producer', desc: 'I have products to sell', emoji: '🏭' },
              { id: 'showroom', title: 'Showroom', desc: 'I have space to display', emoji: '🏪' }
            ].map((role) => (
              <label 
                key={role.id}
                className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  formData.role === role.id 
                  ? 'border-purple-600 bg-purple-50/50 ring-4 ring-purple-50' 
                  : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <input 
                  type="radio" name="role" value={role.id} 
                  checked={formData.role === role.id} 
                  onChange={handleChange} 
                  className="hidden"
                />
                <div className="text-2xl">{role.emoji}</div>
                <div>
                  <p className={`font-bold leading-tight ${formData.role === role.id ? 'text-purple-900' : 'text-gray-900'}`}>{role.title}</p>
                  <p className="text-xs text-gray-500 font-medium">{role.desc}</p>
                </div>
                {formData.role === role.id && (
                  <div className="absolute top-3 right-3 text-purple-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 ml-1">Email Address*</label>
            <input
              type="email" name="email" value={formData.email}
              onChange={handleChange} required placeholder="email@business.com"
              className={inputClass('email')}
            />
            {errors.email && <p className="text-xs text-red-500 font-bold ml-1 italic">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 ml-1">Phone Number*</label>
            <input
              type="tel" name="phone" value={formData.phone}
              onChange={handleChange} required placeholder="01XXXXXXXXX"
              className={inputClass('phone')}
            />
            {errors.phone && <p className="text-xs text-red-500 font-bold ml-1 italic">{errors.phone}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 ml-1">Password*</label>
            <input
              type="password" name="password" value={formData.password}
              onChange={handleChange} required placeholder="••••••••"
              className={inputClass('password')}
            />
            {errors.password && <p className="text-xs text-red-500 font-bold ml-1 italic">{errors.password}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 ml-1">Confirm Password*</label>
            <input
              type="password" name="password2" value={formData.password2}
              onChange={handleChange} required placeholder="••••••••"
              className={inputClass('password2')}
            />
            {errors.password2 && <p className="text-xs text-red-500 font-bold ml-1 italic">{errors.password2}</p>}
          </div>
        </div>

        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
            <span className="text-red-500">⚠️</span>
            <p className="text-sm text-red-700 font-bold">{errors.general}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all transform active:scale-[0.98] ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gray-900 hover:bg-purple-700 shadow-purple-100'
          }`}
        >
          {loading ? 'Creating Account...' : 'Get Started'}
        </button>
      </form>

      <div className="mt-10 text-center">
        <p className="text-gray-500 text-sm font-medium">
          Already have an account? <a href="/login" className="text-purple-600 font-bold hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  );
}

export default RegisterForm;
