// frontend/src/pages/acshow/products/ProductFormModal.jsx

import React, { useState, useEffect } from 'react';
import { productsAPI } from '@/api/products';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '@/api/baseApi'; // for fetching categories

const FULFILLMENT_CHOICES = [
  { value: 'physical', label: '📦 Physical Only' },
  { value: 'digital', label: '💻 Digital Only' },
  { value: 'both', label: '🔀 Both Physical & Digital' },
];

const CONDITION_CHOICES = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

const SectionHeader = ({ title, icon, section, sections, onToggle }) => (
  <div onClick={() => onToggle(section)} className="flex items-center justify-between cursor-pointer py-2">
    <span className="text-sm font-bold text-gray-700">{icon} {title}</span>
    {sections[section] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
  </div>
);

const EMPTY_FORM = {
  name: '', description: '', short_description: '',
  price: '', wholesale_price: '', minimum_order_quantity: '1',
  category: '', main_image: '', images: '[]', video_url: '',
  dimensions: '', weight: '', color: '', material: '',
  stock_quantity: '0', reserved_showroom: '0', reserved_dropship: '0',
  low_stock_threshold: '5', fulfillment_type: 'physical', condition: 'new',
  is_active: true, is_featured: false, is_approved: false,
  preferred_display_fee: '', min_commission_rate: '',
  meta_title: '', meta_description: '', meta_keywords: '',
};

const productToForm = (p) => ({
  name:                  p.name || '',
  description:           p.description || '',
  short_description:     p.short_description || '',
  price:                 p.price || '',
  wholesale_price:       p.wholesale_price || '',
  minimum_order_quantity: p.minimum_order_quantity || '1',
  category:              p.category?.id || p.category || '',
  main_image:            p.main_image || '',
  images:                p.images || '[]',
  video_url:             p.video_url || '',
  dimensions:            p.dimensions || '',
  weight:                p.weight || '',
  color:                 p.color || '',
  material:              p.material || '',
  stock_quantity:        p.stock_quantity || '0',
  reserved_showroom:     p.reserved_showroom || '0',
  reserved_dropship:     p.reserved_dropship || '0',
  low_stock_threshold:   p.low_stock_threshold || '5',
  fulfillment_type:      p.fulfillment_type || 'physical',
  condition:             p.condition || 'new',
  is_active:             p.is_active !== false,
  is_featured:           p.is_featured || false,
  is_approved:           p.is_approved || false,
  preferred_display_fee: p.preferred_display_fee || '',
  min_commission_rate:   p.min_commission_rate || '',
  meta_title:            p.meta_title || '',
  meta_description:      p.meta_description || '',
  meta_keywords:         p.meta_keywords || '',
});

const ProductFormModal = ({ product, onClose, onSuccess }) => {
  const isEdit = !!product;
  const [form, setForm] = useState(product ? productToForm(product) : EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sections, setSections] = useState({
    basic: true, pricing: true, inventory: true, details: false,
    media: false, commission: false, seo: false, status: false,
  });

  useEffect(() => {
    apiClient.get('/products/categories/')
      .then(res => setCategories(res.results || res))
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  const toggleSection = (key) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Product name is required');
    if (!form.price || Number(form.price) <= 0) return setError('Valid price is required');

    setLoading(true);
    setError('');

    try {
      const cleanedData = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        short_description: form.short_description.trim() || null,
        price: parseFloat(form.price),
        wholesale_price: form.wholesale_price ? parseFloat(form.wholesale_price) : null,
        minimum_order_quantity: parseInt(form.minimum_order_quantity) || 1,
        category: form.category ? parseInt(form.category) : null,
        main_image: form.main_image || null,
        images: form.images || '[]',
        video_url: form.video_url || null,
        dimensions: form.dimensions || null,
        weight: form.weight ? parseFloat(form.weight) : null,
        color: form.color || null,
        material: form.material || null,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        reserved_showroom: parseInt(form.reserved_showroom) || 0,
        reserved_dropship: parseInt(form.reserved_dropship) || 0,
        low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
        fulfillment_type: form.fulfillment_type,
        condition: form.condition,
        is_active: form.is_active,
        is_featured: form.is_featured,
        is_approved: form.is_approved,
        preferred_display_fee: form.preferred_display_fee ? parseFloat(form.preferred_display_fee) : null,
        min_commission_rate: form.min_commission_rate ? parseFloat(form.min_commission_rate) : null,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        meta_keywords: form.meta_keywords || null,
      };

      if (isEdit) {
        await productsAPI.update(product.id, cleanedData);
      } else {
        await productsAPI.create(cleanedData);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all";
  const labelClass = "block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          <h2 className="font-bold text-gray-800 text-lg">📦 {isEdit ? 'Edit' : 'Add'} Product</h2>
          <div className="w-5" />
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-2">

          {/* Basic Info */}
          <SectionHeader title="Basic Information" icon="📋" section="basic" sections={sections} onToggle={toggleSection} />
          {sections.basic && (
            <div className="space-y-3 pb-4 border-b border-gray-100">
              <div>
                <label className={labelClass}>Name *</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Product name" className={inputClass} autoFocus />
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
                  <option value="">---------</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon || '📁'} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Full description" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Short Description</label>
                <input type="text" name="short_description" value={form.short_description} onChange={handleChange} placeholder="Brief summary" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Min Order Quantity</label>
                <input type="number" name="minimum_order_quantity" value={form.minimum_order_quantity} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          )}

          {/* Pricing */}
          <SectionHeader title="Pricing" icon="💰" section="pricing" sections={sections} onToggle={toggleSection} />
          {sections.pricing && (
            <div className="grid grid-cols-2 gap-3 pb-4 border-b border-gray-100">
              <div>
                <label className={labelClass}>Price (৳) *</label>
                <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="0.00" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Wholesale Price (৳)</label>
                <input type="number" name="wholesale_price" value={form.wholesale_price} onChange={handleChange} placeholder="0.00" className={inputClass} />
              </div>
            </div>
          )}

          {/* Inventory */}
          <SectionHeader title="Inventory & Stock" icon="📦" section="inventory" sections={sections} onToggle={toggleSection} />
          {sections.inventory && (
            <div className="space-y-3 pb-4 border-b border-gray-100">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Stock Qty</label>
                  <input type="number" name="stock_quantity" value={form.stock_quantity} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Reserved Showroom</label>
                  <input type="number" name="reserved_showroom" value={form.reserved_showroom} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Reserved Dropship</label>
                  <input type="number" name="reserved_dropship" value={form.reserved_dropship} onChange={handleChange} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Low Stock Threshold</label>
                <input type="number" name="low_stock_threshold" value={form.low_stock_threshold} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          )}

          {/* Product Details */}
          <SectionHeader title="Product Details" icon="🔧" section="details" sections={sections} onToggle={toggleSection} />
          {sections.details && (
            <div className="space-y-3 pb-4 border-b border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Fulfillment Type</label>
                  <select name="fulfillment_type" value={form.fulfillment_type} onChange={handleChange} className={inputClass}>
                    {FULFILLMENT_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Condition</label>
                  <select name="condition" value={form.condition} onChange={handleChange} className={inputClass}>
                    {CONDITION_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Dimensions</label>
                  <input type="text" name="dimensions" value={form.dimensions} onChange={handleChange} placeholder="L x W x H in cm" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Weight (kg)</label>
                  <input type="number" name="weight" value={form.weight} onChange={handleChange} step="0.01" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Color</label>
                  <input type="text" name="color" value={form.color} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Material</label>
                  <input type="text" name="material" value={form.material} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* Media */}
          <SectionHeader title="Media" icon="🖼️" section="media" sections={sections} onToggle={toggleSection} />
          {sections.media && (
            <div className="space-y-3 pb-4 border-b border-gray-100">
              <div>
                <label className={labelClass}>Main Image URL</label>
                <input type="text" name="main_image" value={form.main_image} onChange={handleChange} placeholder="Image URL" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Additional Images (JSON)</label>
                <input type="text" name="images" value={form.images} onChange={handleChange} placeholder='["url1","url2"]' className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Video URL</label>
                <input type="url" name="video_url" value={form.video_url} onChange={handleChange} placeholder="YouTube/Vimeo URL" className={inputClass} />
              </div>
            </div>
          )}

          {/* Commission */}
          <SectionHeader title="Display & Commission" icon="🤝" section="commission" sections={sections} onToggle={toggleSection} />
          {sections.commission && (
            <div className="grid grid-cols-2 gap-3 pb-4 border-b border-gray-100">
              <div>
                <label className={labelClass}>Display Fee (৳)</label>
                <input type="number" name="preferred_display_fee" value={form.preferred_display_fee} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Min Commission (%)</label>
                <input type="number" name="min_commission_rate" value={form.min_commission_rate} onChange={handleChange} step="0.01" className={inputClass} />
              </div>
            </div>
          )}

          {/* Status */}
          <SectionHeader title="Status" icon="✅" section="status" sections={sections} onToggle={toggleSection} />
          {sections.status && (
            <div className="flex flex-wrap gap-4 pb-4 border-b border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="w-4 h-4 rounded text-emerald-600" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} className="w-4 h-4 rounded text-emerald-600" />
                <span className="text-sm text-gray-700">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_approved" checked={form.is_approved} onChange={handleChange} className="w-4 h-4 rounded text-emerald-600" />
                <span className="text-sm text-gray-700">Approved</span>
              </label>
            </div>
          )}

          {/* SEO */}
          <SectionHeader title="SEO Metadata" icon="🔍" section="seo" sections={sections} onToggle={toggleSection} />
          {sections.seo && (
            <div className="space-y-3 pb-4">
              <div>
                <label className={labelClass}>Meta Title</label>
                <input type="text" name="meta_title" value={form.meta_title} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Meta Description</label>
                <textarea name="meta_description" value={form.meta_description} onChange={handleChange} rows={2} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Meta Keywords</label>
                <input type="text" name="meta_keywords" value={form.meta_keywords} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          )}

          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 sticky bottom-0">
            {loading ? 'Saving...' : `${isEdit ? 'Update' : 'Add'} Product`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
