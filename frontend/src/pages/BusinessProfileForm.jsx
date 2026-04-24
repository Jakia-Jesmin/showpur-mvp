import React, { useState, useEffect } from 'react';
import api from '../api/baseApi';
import { useAuth } from "../hooks/useAuth";
import Spinner from '../components/ui/Spinner';

function BusinessProfileForm({ onComplete }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingProfile, setExistingProfile] = useState(null);
  
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
    minimum_order_quantity: 1,
    _rawCategories: '' // Initialized to prevent undefined errors
  });

  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const response = await api.get('/auth/business-profile/');
        if (response.data) {
          setExistingProfile(response.data);
          // Ensure null values from backend are converted to empty strings
          // and numbers are handled correctly
          setFormData({
            business_name: response.data.business_name || '',
            bio: response.data.bio || '',
            location: response.data.location || '',
            address: response.data.address || '',
            website: response.data.website || '',
            phone: response.data.phone || '',
            shelf_price_per_month: response.data.shelf_price_per_month || '',
            commission_rate: response.data.commission_rate || '',
            available_shelf_space: response.data.available_shelf_space || '',
            product_categories: response.data.product_categories || [],
            minimum_order_quantity: response.data.minimum_order_quantity || 1,
            _rawCategories: (response.data.product_categories || []).join(', ')
          });
        }
      } catch (err) {
        console.log('No existing profile found.');
      } finally {
        setFetching(false);
      }
    };
    checkExistingProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoriesChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, _rawCategories: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Prepare final data
    const finalData = { ...formData };
    
    // Process categories
    if (formData._rawCategories) {
      finalData.product_categories = formData._rawCategories
        .split(',')
        .map(cat => cat.trim())
        .filter(cat => cat !== '');
    }
    
    // Clean up temporary UI fields before sending to Django
    delete finalData._rawCategories;

    try {
      let response;
      if (existingProfile) {
        response = await api.put('/auth/business-profile/', finalData);
      } else {
        response = await api.post('/auth/business-profile/create/', finalData);
      }
      
      setSuccess(existingProfile ? 'Business profile updated!' : 'Business profile created!');
      if (onComplete) setTimeout(() => onComplete(response.data), 1200);
    } catch (err) {
      // Map DRF error objects to readable strings
      const backendError = err.response?.data;
      if (typeof backendError === 'object') {
        const firstKey = Object.keys(backendError)[0];
        setError(`${firstKey}: ${backendError[firstKey]}`);
      } else {
        setError('Validation error. Please check your inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex flex-col items-center justify-center p-20">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-500 font-medium">Loading Profile Data...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          {existingProfile ? 'Business Identity' : 'Set Up Your Business'}
        </h1>
        <p className="text-gray-500 mt-2 italic font-medium">
          This information will be visible to potential {user?.role === 'producer' ? 'Showrooms' : 'Producers'}.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Section 1: Basic Info */}
          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">1</span>
              <h3 className="text-lg font-bold text-gray-800">Basic Information</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Legal Business Name *</label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Apex Manufacturing Ltd."
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">Business Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Briefly describe what your business does..."
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Contact & Reach */}
          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">2</span>
              <h3 className="text-lg font-bold text-gray-800">Contact & Location</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700">City / Region *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Dhaka, Bangladesh"
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Website</label>
                  <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://" className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Phone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Role Specifics */}
          <section className="lg:col-span-2 bg-purple-50 p-8 rounded-3xl border border-purple-100 space-y-6 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-700 text-white font-bold text-sm">3</span>
              <h3 className="text-lg font-bold text-purple-900">
                {user?.role === 'producer' ? 'Production Metrics' : 'Showroom Terms'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              {user?.role === 'showroom' ? (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold text-purple-800">Monthly Shelf Price ($)</label>
                    <input
                      type="number"
                      name="shelf_price_per_month"
                      value={formData.shelf_price_per_month}
                      onChange={handleChange}
                      step="0.01"
                      className="px-4 py-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold text-purple-800">Sales Commission (%)</label>
                    <input
                      type="number"
                      name="commission_rate"
                      value={formData.commission_rate}
                      onChange={handleChange}
                      max="100"
                      className="px-4 py-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold text-purple-800">Product Categories</label>
                    <input
                      type="text"
                      name="_rawCategories"
                      value={formData._rawCategories}
                      onChange={handleCategoriesChange}
                      placeholder="Electronics, Apparel, etc."
                      className="px-4 py-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                    />
                    <small className="text-purple-400 text-xs mt-1 font-medium">Comma separated values</small>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold text-purple-800">Minimum Order (MOQ)</label>
                    <input
                      type="number"
                      name="minimum_order_quantity"
                      value={formData.minimum_order_quantity}
                      onChange={handleChange}
                      min="1"
                      className="px-4 py-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="absolute -right-10 -bottom-10 text-9xl opacity-5 select-none pointer-events-none">🏢</div>
          </section>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <span className="font-bold text-lg">⚠️</span> {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <span className="font-bold text-lg">✅</span> {success}
          </div>
        )}

        <footer className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={loading} 
            className={`px-10 py-4 rounded-2xl font-bold text-white shadow-xl transition-all transform active:scale-[0.98] ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-700 hover:bg-purple-800 hover:-translate-y-0.5 shadow-purple-100'
            }`}
          >
            {loading ? 'Saving Changes...' : 'Save Business Profile'}
          </button>
        </footer>
      </form>
    </div>
  );
}

export default BusinessProfileForm;
