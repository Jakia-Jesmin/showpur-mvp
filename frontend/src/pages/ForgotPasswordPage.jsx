import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { accountsAPI } from '@/api/accounts';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await accountsAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Check Your Email</h2>
          <p className="text-gray-500 text-sm">
            If an account exists with that email, we've sent a reset link.
          </p>
          <Link to="/login" className="block mt-6 text-purple-600 font-bold hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-gray-900">Forgot Password?</h2>
          <p className="text-gray-500 text-sm mt-2">Enter your email to receive a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-purple-500"
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-center">
              <p className="text-sm text-red-700 font-bold">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-purple-600 font-bold hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;