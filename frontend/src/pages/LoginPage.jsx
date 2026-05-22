import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

function LoginForm({ onSuccess }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const result = await login(formData.username, formData.password, rememberMe);
    
    if (result.success) {
      if (onSuccess) onSuccess(result.user);
    } else {
      setErrors({ general: result.error || 'Invalid Username or Password. Please try again.' });
    }
    setLoading(false);
  };

  const inputClass = (fieldName) => `
    w-full px-5 py-4 bg-gray-50 border rounded-2xl outline-none transition-all font-medium
    ${errors[fieldName] ? 'border-red-300 focus:ring-2 focus:ring-red-100' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-purple-500'}
  `;

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-purple-100/50 p-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-6 shadow-lg shadow-purple-200 font-black">
          S
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h2>
        <p className="text-gray-500 mt-2 font-medium text-sm">Login to manage your ShowPur business</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label className="text-sm font-bold text-gray-700 ml-1">Username</label>
          <input
            type="text" name="username" value={formData.username || ''}
            onChange={handleChange} required placeholder="Username"
            className={inputClass('username')}
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center px-1">
            <label className="text-sm font-bold text-gray-700">Password</label>
            <Link to="/forgot-password" className="text-[10px] font-black text-purple-600 hover:underline uppercase tracking-widest">Forgot?</Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password" value={formData.password}
              onChange={handleChange} required placeholder="••••••••"
              className={inputClass('password')}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 font-bold ml-1">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between px-1">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-5 h-5 rounded-lg border-gray-200 text-purple-600 focus:ring-purple-500 transition-all cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">Keep me logged in</span>
          </label>
        </div>

        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-center">
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
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-10 text-center">
        <p className="text-gray-500 text-sm font-medium">
          Don't have an account? <a href="/register" className="text-purple-600 font-bold hover:underline">Register your business</a>
        </p>
      </div>
    </div>
  );
}

export default LoginForm;
