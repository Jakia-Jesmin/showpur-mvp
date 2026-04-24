import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { API_BASE } from '../../../api/baseApi'; // Updated import

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Endpoint aligned with Django URL patterns
      const response = await api.get('/products/products/my-products/');
      
      // Handle Django Rest Framework pagination vs simple lists
      const productsData = response.data.results || response.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/products/${productId}/`);
        setProducts(prev => prev.filter(p => p.id !== productId));
      } catch (err) {
        alert('Failed to delete product');
      }
    }
  };

  const handleToggleActive = async (product) => {
    try {
      const response = await api.patch(`/products/products/${product.id}/`, {
        is_active: !product.is_active
      });
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, is_active: response.data.is_active } : p
      ));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Helper to fix image paths from Django
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    // Removes 'api' from base if the backend serves media from root
    const rootBase = API_BASE.replace('/api', '');
    return `${rootBase}${url}`;
  };

  if (loading) return <div className="loading-container">Loading products...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div className="product-list-page">
      <div className="page-header">
        <div className="header-titles">
          <h1>My Products</h1>
          <p className="subtitle">Manage your inventory for showrooms</p>
        </div>
        <Link to="/dashboard/products/add" className="add-product-btn">
          <span>+</span> Add New Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No products yet</h3>
          <p>Get started by adding your first product to the platform.</p>
          <Link to="/dashboard/products/add" className="btn-primary">Add Product</Link>
        </div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Details</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td className="col-img">
                    <img 
                      src={getImageUrl(product.main_image) || '/placeholder.png'} 
                      alt="" 
                      className="product-thumb" 
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/50'; }}
                    />
                  </td>
                  <td className="col-details">
                    <div className="product-name">{product.name}</div>
                    <div className="product-category">{product.category_name || 'General'}</div>
                  </td>
                  <td>${parseFloat(product.price).toFixed(2)}</td>
                  <td>{product.stock_quantity} units</td>
                  <td>
                    <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}>
                      {product.is_active ? 'Live' : 'Paused'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="btn-group">
                      <Link to={`/dashboard/products/edit/${product.id}`} className="btn-icon" title="Edit">✏️</Link>
                      <button 
                        onClick={() => handleToggleActive(product)} 
                        className="btn-icon" 
                        title={product.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {product.is_active ? '⏸️' : '▶️'}
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)} 
                        className="btn-icon delete" 
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ProductList;
