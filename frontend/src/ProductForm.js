// frontend/src/ProductForm.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ProductForm.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api/products/';

function ProductForm({ accessToken, isEditMode = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
    
  // 🛑 RENAMED FIELDS TO MATCH DJANGO MODEL 🛑
  const [formData, setFormData] = useState({
    name: '',
    category: '', // Kept for UI, but not in Django Product Model
    wholesale_price: '', // Replaces purchase_price
    retail_price: '',    // Replaces selling_price
    commission_rate: '', // Replaces commission_amount (must be a decimal like 0.15)
    description: ''
  });
    
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(isEditMode);

  // Fetch product data if in edit mode
  useEffect(() => {
    if (isEditMode && id && accessToken) {
      fetchProduct();
    } else if (isEditMode && !accessToken) {
        setError("Authentication required for editing.");
        setLoading(false);
    }
  }, [id, isEditMode, accessToken]);

  const fetchProduct = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      };

      const response = await fetch(`${API_BASE_URL}${id}/`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        // 🛑 MAPPING INCOMING DJANGO DATA TO STATE 🛑
        setFormData({
          name: data.name,
          category: data.category || '',
          wholesale_price: data.wholesale_price,
          retail_price: data.retail_price,
          commission_rate: data.commission_rate,
          description: data.description || ''
        });
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to fetch product: ${response.status} - ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // 🛑 VALIDATION USING CORRECT FIELD NAMES 🛑
    const wholesalePrice = parseFloat(formData.wholesale_price);
    const retailPrice = parseFloat(formData.retail_price);
    const commissionRate = parseFloat(formData.commission_rate);
    
    if (retailPrice <= wholesalePrice) {
      setError('Retail price must be greater than wholesale price.');
      setIsSubmitting(false);
      return;
    }
    
    // 🛑 VALIDATION: Commission Rate must be between 0 and 1 (0% to 100%)
    if (commissionRate < 0 || commissionRate > 1) {
        setError('Commission rate must be a decimal value between 0.00 and 1.00 (e.g., 0.15 for 15%).');
        setIsSubmitting(false);
        return;
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      };

      const url = isEditMode
        ? `${API_BASE_URL}${id}/`
        : API_BASE_URL;

      const method = isEditMode ? 'PUT' : 'POST';
      
      // 🛑 CREATE A CLEAN PAYLOAD - ONLY SEND FIELDS DJANGO EXPECTS 🛑
      const payload = {
        name: formData.name,
        description: formData.description,
        wholesale_price: formData.wholesale_price,
        retail_price: formData.retail_price,
        commission_rate: formData.commission_rate,
        // Exclude category as it's not in the Django Product model
      };

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedProduct = await response.json();
        alert(`Product ${isEditMode ? 'updated' : 'created'} successfully!`);
        navigate(`/products/${savedProduct.id}`);
      } else {
        // Log backend validation errors
        const errorData = await response.json();
        console.error('Backend Validation Errors:', errorData);
        // Display a general error or specific field errors
        const errorMessage = errorData.detail || JSON.stringify(errorData);
        throw new Error(errorMessage || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedProfit = () => {
    // 🛑 CALCULATION USING CORRECT FIELD NAMES 🛑
    const wholesale = parseFloat(formData.wholesale_price) || 0;
    const retail = parseFloat(formData.retail_price) || 0;
    return (retail - wholesale).toFixed(2);
  };
  
  // Helper to display commission rate as percentage for the user
  const displayCommissionRate = () => {
    const rate = parseFloat(formData.commission_rate) || 0;
    return (rate * 100).toFixed(2);
  };

  if (loading) {
    return <div className="loading">Loading product...</div>;
  }

  return (
    <div className="product-form-container">
      <div className="form-header">
        <h1>{isEditMode ? 'Edit Product' : 'Create New Product'}</h1>
        <p>{isEditMode ? 'Update your product details' : 'Add a new product to your catalog'}</p>
      </div>

      {error && (
        <div className="error-message">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Product Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Silk Scarf"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g., Handicrafts"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            {/* 🛑 RENAMED LABEL/NAME 🛑 */}
            <label htmlFor="wholesale_price">Wholesale Price (৳) *</label>
            <input
              type="number"
              step="0.01"
              id="wholesale_price"
              name="wholesale_price"
              value={formData.wholesale_price}
              onChange={handleChange}
              required
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            {/* 🛑 RENAMED LABEL/NAME 🛑 */}
            <label htmlFor="retail_price">Retail Price (৳) *</label>
            <input
              type="number"
              step="0.01"
              id="retail_price"
              name="retail_price"
              value={formData.retail_price}
              onChange={handleChange}
              required
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            {/* 🛑 RENAMED LABEL/NAME 🛑 */}
            <label htmlFor="commission_rate">Commission Rate (%) *</label>
            <input
              type="number"
              step="0.01"
              id="commission_rate"
              name="commission_rate"
              value={formData.commission_rate}
              onChange={handleChange}
              required
              placeholder="0.10 (for 10%)"
            />
            <small className="hint">Enter as a decimal (e.g., 0.15 for 15%)</small>
          </div>
        </div>

        {formData.wholesale_price && formData.retail_price && (
          <div className="profit-indicator">
            <strong>Calculated Profit:</strong> ৳{calculatedProfit()}
            <span className="commission-display"> | Commission: {displayCommissionRate()}%</span>
            {parseFloat(calculatedProfit()) <= 0 && (
              <span className="warning"> ⚠️ Retail price must be higher than wholesale price</span>
            )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="description">Product Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Describe your product, its features, quality, etc."
          />
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={() => navigate('/products')}
            className="btn-cancel"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-submit"
          >
            {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Product' : 'Create Product')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;
