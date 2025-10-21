// frontend/src/ProductForm.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// 🛑 CRITICAL FIX: Import the authenticated Axios instance with the interceptor
import api from './api/api'; 
import './ProductForm.css';

// Note: We no longer need to pass or rely on 'accessToken' as a prop
function ProductForm({ isEditMode = false }) {
    const navigate = useNavigate();
    const { id } = useParams();
    
    // State for form data (field names match Django Product model)
    const [formData, setFormData] = useState({
        name: '',
        category: '', // UI field only, will be excluded from payload
        wholesale_price: '', 
        retail_price: '', 
        commission_rate: '', 
        description: ''
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(isEditMode);

    // --- Data Fetching ---
    
    const fetchProduct = useCallback(async () => {
        try {
            // 🛑 FIX: Use api.get(). The token is handled by the interceptor.
            const response = await api.get(`products/${id}/`);

            const data = response.data;

            // MAPPING INCOMING DJANGO DATA TO STATE 
            setFormData({
                name: data.name,
                // FIX: Removed extra 's'
                category: data.category || '',
                wholesale_price: data.wholesale_price,
                retail_price: data.retail_price,
                commission_rate: data.commission_rate,
                description: data.description || ''
            });
        } catch (error) {
            console.error('Error fetching product:', error.response?.data || error);
            setError("Failed to load product data. Your session may have expired.");
        } finally {
            setLoading(false);
        }
    }, [id, setFormData, setError, setLoading]); // ✅ Correct dependency array

    // Fetch product data if in edit mode
    useEffect(() => {
        // We only need 'id' and 'isEditMode' now, as 'api' handles authentication check.
        if (isEditMode && id) {
            fetchProduct();
        } else if (isEditMode && !localStorage.getItem('access_token')) {
            // Manual check for better UX before API fails
            setError("Authentication required for editing.");
            setLoading(false);
        }
    }, [id, isEditMode]); // 🐛 FIX: Added missing dependency array

    // --- Handlers & Submission ---

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

        // --- Frontend Validation ---
        const wholesalePrice = parseFloat(formData.wholesale_price);
        const retailPrice = parseFloat(formData.retail_price);
        const commissionRate = parseFloat(formData.commission_rate);
        
        if (retailPrice <= wholesalePrice) {
            setError('Retail price must be greater than wholesale price.');
            setIsSubmitting(false);
            return;
        }
        
        if (commissionRate < 0 || commissionRate > 1) {
            setError('Commission rate must be a decimal value between 0.00 and 1.00 (e.g., 0.15 for 15%).');
            setIsSubmitting(false);
            return;
        }

        try {
            const url = isEditMode
                ? `products/${id}/` // Adjusted URL format for Axios instance
                : 'products/';

            // 🛑 CREATE A CLEAN PAYLOAD - Only send fields Django expects 🛑
            const payload = {
                name: formData.name,
                description: formData.description,
                wholesale_price: formData.wholesale_price,
                retail_price: formData.retail_price,
                commission_rate: formData.commission_rate,
                // Exclude 'category' as it's not a Django model field
            };

            let response;
            if (isEditMode) {
                // 🛑 FIX: Use api.put() 🛑
                response = await api.put(url, payload);
            } else {
                // 🛑 FIX: Use api.post() 🛑
                response = await api.post(url, payload);
            }
            
            const savedProduct = response.data; // Axios response data
            alert(`Product ${isEditMode ? 'updated' : 'created'} successfully!`);
            navigate(`/products/${savedProduct.id}`);

        } catch (error) {
            console.error('Error saving product:', error.response?.data || error);
            
            const errorData = error.response?.data;
            // Handle general errors or detailed field errors from the backend
            const errorMessage = errorData?.detail || JSON.stringify(errorData) || error.message;
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Calculated Values ---
    
    const calculatedProfit = () => {
        const wholesale = parseFloat(formData.wholesale_price) || 0;
        const retail = parseFloat(formData.retail_price) || 0;
        return (retail - wholesale).toFixed(2);
    };
    
    const displayCommissionRate = () => {
        const rate = parseFloat(formData.commission_rate) || 0;
        return (rate * 100).toFixed(2);
    };

    if (loading) {
        return <div className="loading">Loading product...</div>;
    }

    // --- JSX Render ---

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
