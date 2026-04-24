import React, { useState, useEffect } from 'react';
import api from '../../../api/baseApi';
import { useAuth } from '../../../hooks/useAuth';

function ProfileManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    business_name: '',
    bio: '',
    location: '',
    address: '',
    website: '',
    phone: '',
    shelf_price_per_month: '',
    commission_rate: '',
    available_shelf_space: '',
    product_categories: [],
    minimum_order_quantity: 1
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/business-profile/');
      const data = response.data;
      setFormData({
        business_name: data.business_name || '',
        bio: data.bio || '',
        location: data.location || '',
        address: data.address || '',
        website: data.website || '',
        phone: data.phone || '',
        shelf_price_per_month: data.shelf_price_per_month || '',
        commission_rate: data.commission_rate || '',
        available_shelf_space: data.available_shelf_space || '',
        product_categories: data.product_categories || [],
        minimum_order_quantity: data.minimum_order_quantity || 1
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setMessage({ type: 'error', text: 'Could not load profile data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoriesChange = (e) => {
    // Converts comma-separated string back to array for the backend
    const categories = e.target.value.split(',').map(cat => cat.trim());
    setFormData(prev => ({ ...prev, product_categories: categories }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await api.put('/auth/business-profile/', formData);
      setMessage({ type: 'success', text: 'Business profile updated successfully!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update profile' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-state">Loading your profile...</div>;

  return (
    <div className="profile-container">
      <header className="page-header">
        <h1>Business Profile</h1>
        <p className="subtitle">This information is visible to potential partners in the network.</p>
      </header>
      
      {message && (
        <div className={`alert-banner ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-grid-form">
        {/* SECTION 1: Identity */}
        <section className="form-card">
          <h3><span className="icon">🏢</span> Identity & Contact</h3>
          <div className="input-group">
            <label>Business Name *</label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              required
              placeholder="e.g. Heritage Crafts Ltd."
            />
          </div>

          <div className="input-group">
            <label>Short Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell partners about your business mission..."
              rows="3"
            />
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Website URL</label>
              <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://..." />
            </div>
          </div>
        </section>

        {/* SECTION 2: Location */}
        <section className="form-card">
          <h3><span className="icon">📍</span> Location Details</h3>
          <div className="input-group">
            <label>City/Region *</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Physical Address</label>
            <textarea name="address" value={formData.address} onChange={handleChange} rows="2" />
          </div>
        </section>

        {/* SECTION 3: Role Specific Settings */}
        <section className="form-card highlight">
          <h3><span className="icon">⚙️</span> {user?.role === 'showroom' ? 'Showroom Terms' : 'Producer Terms'}</h3>
          
          {user?.role === 'showroom' ? (
            <div className="input-grid-3">
              <div className="input-group">
                <label>Monthly Shelf Fee ($)</label>
                <input type="number" name="shelf_price_per_month" value={formData.shelf_price_per_month} onChange={handleChange} step="0.01" />
              </div>
              <div className="input-group">
                <label>Commission (%)</label>
                <input type="number" name="commission_rate" value={formData.commission_rate} onChange={handleChange} step="0.1" />
              </div>
              <div className="input-group">
                <label>Available Space (sq ft)</label>
                <input type="number" name="available_shelf_space" value={formData.available_shelf_space} onChange={handleChange} />
              </div>
            </div>
          ) : (
            <div className="input-row">
              <div className="input-group full-width">
                <label>Target Categories</label>
                <input
                  type="text"
                  name="product_categories"
                  value={formData.product_categories.join(', ')}
                  onChange={handleCategoriesChange}
                  placeholder="e.g., Apparel, Accessories, Home"
                />
                <small className="hint">Partners search for these tags</small>
              </div>
              <div className="input-group">
                <label>Min. Order Qty</label>
                <input type="number" name="minimum_order_quantity" value={formData.minimum_order_quantity} onChange={handleChange} min="1" />
              </div>
            </div>
          )}
        </section>

        <footer className="form-footer">
          <button type="submit" disabled={saving} className="btn-save">
            {saving ? 'Updating Profile...' : 'Save All Changes'}
          </button>
        </footer>
      </form>
    </div>
  );
}

export default ProfileManagement;
