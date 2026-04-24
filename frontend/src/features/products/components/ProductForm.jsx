const FormField = ({ label, children, error }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    {children}
    {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
  </div>
);

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api/baseApi';
import DashboardLayout from '../../../components/layout/DashboardLayout';

function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    price: '',
    wholesale_price: '',
    category: '',
    stock_quantity: '',
    condition: 'new',
    dimensions: '',
    weight: '',
    color: '',
    material: '',
    min_commission_rate: '',
    preferred_display_fee: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/products/categories/');
      const categoriesData = response.data.results || response.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  }, []);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      const response = await api.get(`/products/products/${id}/`);
      const product = response.data;
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        short_description: product.short_description || '',
        price: product.price || '',
        wholesale_price: product.wholesale_price || '',
        category: product.category?.id || product.category || '',
        stock_quantity: product.stock_quantity || '',
        condition: product.condition || 'new',
        dimensions: product.dimensions || '',
        weight: product.weight || '',
        color: product.color || '',
        material: product.material || '',
        min_commission_rate: product.min_commission_rate || '',
        preferred_display_fee: product.preferred_display_fee || ''
      });

      if (product.main_image) setImagePreview(product.main_image);
    } catch (err) {
      setError('Failed to load product details.');
    }
  }, [id]);

  useEffect(() => {
    fetchCategories();
    fetchProduct();
  }, [fetchCategories, fetchProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image is too large. Please select an image under 2MB.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '') {
        submitData.append(key, formData[key]);
      }
    });

    if (imageFile) {
      submitData.append('main_image', imageFile);
    }

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (id) {
        await api.put(`/products/products/${id}/`, submitData, config);
      } else {
        await api.post('/products/products/', submitData, config);
      }
      navigate('/dashboard/products');
    } catch (err) {
      if (err.response?.data) {
        setFieldErrors(err.response.data);
        setError('Submission failed. Please check the fields below.');
      } else {
        setError('A network error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{id ? 'Update Product' : 'List New Product'}</h1>
          <p className="text-gray-500 mt-2">Fill in the details to showcase your product in showrooms.</p>
        </header>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Product Name *</label>
                <input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all ${fieldErrors.name ? 'border-red-500' : 'border-gray-200'}`}
                />
                {fieldErrors.name && <span className="text-xs text-red-500 mt-1">{fieldErrors.name}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select 
                  name="category" 
                  value={formData.category} 
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white transition-all"
                >
                  <option value="">Select a Category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Pricing & Stock</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Retail Price ($) *</label>
                <input 
                  type="number" 
                  name="price" 
                  value={formData.price} 
                  onChange={handleChange} 
                  step="0.01" 
                  required 
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Wholesale Price ($)</label>
                <input 
                  type="number" 
                  name="wholesale_price" 
                  value={formData.wholesale_price} 
                  onChange={handleChange} 
                  step="0.01" 
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Available Stock</label>
                <input 
                  type="number" 
                  name="stock_quantity" 
                  value={formData.stock_quantity} 
                  onChange={handleChange} 
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Media</h3>
            <div className="flex justify-center">
              <label className="w-full max-w-md aspect-video border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-purple-300 transition-all overflow-hidden relative">
                <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-6">
                    <span className="text-4xl mb-2 block">📸</span>
                    <p className="text-sm font-medium text-gray-600">Click to upload product image</p>
                    <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG (Max 2MB)</p>
                  </div>
                )}
              </label>
            </div>
          </section>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="px-6 py-2 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className={`px-8 py-2 rounded-lg font-semibold text-white transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-700 hover:bg-purple-800 shadow-md hover:shadow-lg'}`}
            >
              {loading ? 'Processing...' : (id ? 'Save Changes' : 'Publish Product')}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default ProductForm;
