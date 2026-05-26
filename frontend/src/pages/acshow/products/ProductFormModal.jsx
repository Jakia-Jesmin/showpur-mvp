// frontend/src/pages/acshow/products/ProductFormModal.jsx

import React, { useState, useEffect } from 'react';
import { productsAPI } from '@/api/products';
import { X } from 'lucide-react';

const ProductFormModal = ({ product, onClose, onSuccess }) => {
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: '',
    description: '',
    short_description: '',
    price: '',
    wholesale_price: '',
    stock_quantity: '0',
    low_stock_threshold: '5',
    category: '', // 👈 If left blank, we will inject a fallback below
    condition: 'new',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        short_description: product.short_description || '',
        price: product.price || '',
        wholesale_price: product.wholesale_price || '',
        stock_quantity: product.stock_quantity || '0',
        low_stock_threshold: product.low_stock_threshold || '5',
        category: product.category || '',
        condition: product.condition || 'new',
      });
    }
  }, [product]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      setError('Valid price is required');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const data = {
        name: form.name,
        description: form.description,
        short_description: form.short_description,
        price: parseFloat(form.price),
        wholesale_price: form.wholesale_price ? parseFloat(form.wholesale_price) : null,
        condition: form.condition,
        low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
        is_active: true,
        
        // 🌟 WORKAROUND: If category is blank, pass null or a valid default primary key ID integer
        // Replace 1 with a valid active Category ID from your admin panel if required.
        category: form.category ? parseInt(form.category) : 1, 
      };

      if (isEdit) {
        await productsAPI.update(product.id, data);
      } else {
        await productsAPI.create(data);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          <h2 className="font-bold text-gray-800">📦 {isEdit ? 'Edit' : 'Add'} Product</h2>
          <div className="w-5" />
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Product Name *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Product name" className={inputClass} autoFocus />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Price (৳) *</label>
              <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="0.00" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Wholesale Price (৳)</label>
              <input type="number" name="wholesale_price" value={form.wholesale_price} onChange={handleChange} placeholder="0.00" className={inputClass} />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Short Description</label>
            <input type="text" name="short_description" value={form.short_description} onChange={handleChange} placeholder="Brief description" className={inputClass} />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Full description (optional)" rows={2} className={inputClass} />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Condition</label>
              <select name="condition" value={form.condition} onChange={handleChange} className={inputClass}>
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Low Stock Alert</label>
              <input type="number" name="low_stock_threshold" value={form.low_stock_threshold} onChange={handleChange} placeholder="5" className={inputClass} />
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50">
            {loading ? 'Saving...' : `${isEdit ? 'Update' : 'Add'} Product`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
