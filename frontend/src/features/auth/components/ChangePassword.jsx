import React, { useState } from 'react';
import api from '../../../api/baseApi'; // Updated import path

function ChangePassword() {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    new_password2: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear message when user starts typing again
    if (message) setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Client-side validation
    if (formData.new_password.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      setLoading(false);
      return;
    }

    if (formData.new_password !== formData.new_password2) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/change-password/', {
        old_password: formData.old_password,
        new_password: formData.new_password,
        new_password2: formData.new_password2
      });
      
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setFormData({ old_password: '', new_password: '', new_password2: '' });
    } catch (error) {
      const errorDetail = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          'Failed to change password. Please check your current password.';
      setMessage({ type: 'error', text: errorDetail });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <header className="page-header">
        <h1>Security</h1>
        <p className="subtitle">Update your account password to keep your business data safe.</p>
      </header>
      
      {message && (
        <div className={`alert-banner ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-card narrow-form">
        <div className="form-group">
          <label>Current Password</label>
          <input
            type="password"
            name="old_password"
            value={formData.old_password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
        </div>

        <hr className="form-divider" />

        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            name="new_password"
            value={formData.new_password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
          <small className="input-hint">Minimum 8 characters required.</small>
        </div>

        <div className="form-group">
          <label>Confirm New Password</label>
          <input
            type="password"
            name="new_password2"
            value={formData.new_password2}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="form-footer">
          <button type="submit" disabled={loading} className="btn-save">
            {loading ? 'Processing...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChangePassword;
