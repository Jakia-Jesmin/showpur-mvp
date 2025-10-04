// frontend/src/ProductList.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from './api/api'; // 🛑 Import the custom Axios client 🛑
import './ProductList.css';

// 🛑 REMOVED: API_BASE_URL is no longer needed since 'api' handles base URL 🛑

function ProductList() { // 🛑 Removed 'accessToken' prop 🛑
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- 1. Fetch Products (GET) ---
    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            // 🛑 CRITICAL CHANGE: Use api.get() for automatic token handling 🛑
            const response = await api.get('/products/');
            
            // Axios response data is in 'response.data'
            setProducts(response.data); 
            
        } catch (error) {
            console.error('Error fetching products:', error);
            const status = error.response?.status;
            
            if (status === 401) {
                // Interceptor should handle token refresh/logout, 
                // but this catch ensures a visible message if it fails
                setError("Session expired or unauthorized. Please log in.");
            } else if (status === 403) {
                setError("Permission denied. You must be the product owner.");
            } else {
                setError(`Failed to fetch products. Status: ${status || 'Network Error'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []); // 🛑 No dependency needed, as 'api' handles auth state internally 🛑


    // --- 2. Handle Delete (DELETE) ---
    const handleDelete = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            // 🛑 CRITICAL CHANGE: Use api.delete() 🛑
            // URL is simply the resource path, the base URL is handled by the api client
            await api.delete(`/products/${productId}/`); 

            // Remove deleted product from list on success (DRF usually returns 204 No Content)
            setProducts(products.filter(p => p.id !== productId));
            alert('Product deleted successfully!');
            
        } catch (error) {
            console.error('Error deleting product:', error);
            const status = error.response?.status;
            
            if (status === 403) {
                alert("Permission denied. You can only delete your own products.");
            } else {
                alert(`Failed to delete product. Status: ${status || 'Network Error'}`);
            }
        }
    };

    if (loading) {
        return (
            <div className="products-container">
                <div className="loading">Loading products...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="products-container">
                <div className="error-message">
                    <h2>Error Loading Products</h2>
                    <p>{error}</p>
                    <Link to="/" className="btn-link">← Back Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="products-container">
            <div className="products-header">
                <div>
                    <h1>My Products</h1>
                    <p>Manage your product catalog</p>
                </div>
                <Link to="/products/create" className="btn-primary">
                    + Add New Product
                </Link>
            </div>

            {products.length === 0 ? (
                <div className="no-products">
                    <h2>No Products Yet</h2>
                    <p>Start building your catalog by adding your first product.</p>
                    <Link to="/products/create" className="btn-primary">
                        Create Your First Product
                    </Link>
                </div>
            ) : (
                <div className="products-grid">
                    {products.map(product => {
                        // --- Price Calculations (Kept your logic) ---
                        const retailPrice = parseFloat(product.retail_price) || 0;
                        const wholesalePrice = parseFloat(product.wholesale_price) || 0;
                        const commissionRate = parseFloat(product.commission_rate) || 0;
                        
                        const commissionAmount = (retailPrice * commissionRate).toFixed(2);
                        const profitMargin = (retailPrice - wholesalePrice).toFixed(2);
                        
                        return (
                            <div key={product.id} className="product-card">
                                <div className="product-header">
                                    <h3>{product.name}</h3>
                                    <span className="product-category">{product.category || 'General'}</span>
                                </div>

                                <div className="product-details">
                                    <div className="product-info-row">
                                        <span className="label">Wholesale Price:</span>
                                        <span className="value">৳{wholesalePrice}</span> 
                                    </div>
                                    <div className="product-info-row">
                                        <span className="label">Retail Price:</span>
                                        <span className="value price-highlight">৳{retailPrice}</span>
                                    </div>
                                    <div className="product-info-row">
                                        <span className="label">Commission:</span>
                                        <span className="value">৳{commissionAmount} ({commissionRate * 100}%)</span> 
                                    </div>
                                    <div className="product-info-row">
                                        <span className="label">Profit Margin:</span>
                                        <span className="value profit">৳{profitMargin}</span> 
                                    </div>
                                </div>

                                <div className="product-actions">
                                    <Link 
                                        to={`/products/${product.id}`} 
                                        className="btn-view"
                                    >
                                        View Details
                                    </Link>
                                    <Link 
                                        to={`/products/${product.id}/edit`} 
                                        className="btn-edit"
                                    >
                                        Edit
                                    </Link>
                                    <button 
                                        onClick={() => handleDelete(product.id)}
                                        className="btn-delete"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ProductList;
