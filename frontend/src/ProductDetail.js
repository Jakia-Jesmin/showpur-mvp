// frontend/src/ProductDetail.js

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './ProductDetail.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api/products/';

function ProductDetail({ accessToken }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch if token is available
    if (accessToken) {
      fetchProduct();
    } else {
        setError("Authentication required to view product details.");
        setLoading(false);
    }
  }, [id, accessToken]);

  const fetchProduct = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      };

      // 🛑 Use the explicit IP address 🛑
      const response = await fetch(`${API_BASE_URL}${id}/`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      } else if (response.status === 404) {
        setError('Product not found or you do not have permission to view it.');
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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      };

      const response = await fetch(`${API_BASE_URL}${id}/`, {
        method: 'DELETE',
        headers,
      });

      if (response.status === 204 || response.status === 200) { // DRF often returns 204 No Content
        alert('Product deleted successfully!');
        navigate('/products');
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to delete product: ${response.status} - ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading">Loading product...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <Link to="/products" className="back-link">← Back to Products</Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }
  
  // 🛑 CRITICAL CALCULATION FIXES 🛑
  const retailPrice = parseFloat(product.retail_price) || 0;
  const wholesalePrice = parseFloat(product.wholesale_price) || 0;
  const commissionRate = parseFloat(product.commission_rate) || 0;

  // 1. Profit Margin (Simple difference between retail and wholesale)
  const profitMargin = (retailPrice - wholesalePrice).toFixed(2);
  
  // 2. Commission Amount (Retail Price * Commission Rate)
  const commissionAmount = (retailPrice * commissionRate).toFixed(2);
  
  // 3. Net Profit (Profit Margin - Commission Amount)
  const netProfit = (parseFloat(profitMargin) - parseFloat(commissionAmount)).toFixed(2);
  
  // 4. Profit Percentage (Profit Margin / Wholesale Price)
  const profitPercentage = wholesalePrice > 0 ? ((profitMargin / wholesalePrice) * 100).toFixed(1) : 'N/A';
  
  // 5. Commission Rate Display
  const commissionRateDisplay = (commissionRate * 100).toFixed(1);

  return (
    <div className="product-detail-container">
      <div className="product-detail-header">
        <Link to="/products" className="back-link">← Back to Products</Link>
        <div className="header-actions">
          <Link to={`/products/${id}/edit`} className="btn-edit">
            Edit Product
          </Link>
          <button onClick={handleDelete} className="btn-delete">
            Delete Product
          </button>
        </div>
      </div>

      <div className="product-detail-content">
        <div className="product-main-info">
          <div className="product-title-section">
            <h1>{product.name}</h1>
            {product.category && (
              <span className="product-category-badge">{product.category}</span>
            )}
          </div>

          {product.description && (
            <div className="product-description-section">
              <h2>Description</h2>
              <p>{product.description}</p>
            </div>
          )}
        </div>

        <div className="product-pricing-card">
          <h2>Pricing Information</h2>
            
          <div className="pricing-grid">
            <div className="pricing-item">
              {/* 🛑 RENAMED FIELD 🛑 */}
              <span className="pricing-label">Wholesale Price (Cost)</span>
              <span className="pricing-value">৳{wholesalePrice}</span>
            </div>

            <div className="pricing-item highlight">
              {/* 🛑 RENAMED FIELD 🛑 */}
              <span className="pricing-label">Retail Price (Revenue)</span>
              <span className="pricing-value large">৳{retailPrice}</span>
            </div>

            <div className="pricing-item">
              <span className="pricing-label">Commission Rate</span>
              {/* 🛑 SHOWING RATE AND CALCULATED AMOUNT 🛑 */}
              <span className="pricing-value">{commissionRateDisplay}% (৳{commissionAmount})</span>
            </div>

            <div className="pricing-item profit">
              <span className="pricing-label">Gross Profit Margin</span>
              <span className="pricing-value">
                ৳{profitMargin}
                <span className="percentage"> ({profitPercentage}%)</span>
              </span>
            </div>
          </div>

          <div className="pricing-breakdown">
            <h3>Breakdown (Per Unit)</h3>
            <div className="breakdown-item">
              <span>Retail Price:</span>
              <span>৳{retailPrice}</span>
            </div>
            <div className="breakdown-item">
              <span>- Wholesale Price (Cost):</span>
              <span>৳{wholesalePrice}</span>
            </div>
            <div className="breakdown-item">
              <span>- Commission Fee ({commissionRateDisplay}%):</span>
              <span>৳{commissionAmount}</span>
            </div>
            <div className="breakdown-item total">
              <span><strong>Net Profit:</strong></span>
              <span><strong>৳{netProfit}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div className="product-meta-info">
        <p><strong>Product ID:</strong> #{product.id}</p>
        {/* You should format these dates */}
        <p><strong>Created:</strong> {new Date(product.created_at).toLocaleDateString()}</p>
        {product.updated_at && (
          <p><strong>Last Updated:</strong> {new Date(product.updated_at).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
}

export default ProductDetail;
