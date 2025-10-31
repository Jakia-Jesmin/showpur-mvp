// frontend/src/InventoryAllocationManager.js
import React, { useState, useEffect } from 'react';
import api from './api'; // Import your authenticated API instance
import { useNavigate } from 'react-router-dom';

function InventoryAllocationManager() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        product: '', // Will hold the product ID
        quantity_allocated: '',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // --- 1. Fetch Products for the Dropdown ---
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Fetch products that this user might want to allocate from (the source business's products)
                // You may need to adjust this URL later to filter by the user's business context.
                const response = await api.get('/products/'); 
                setProducts(response.data);
                setLoading(false);
            } catch (err) {
                setError("Failed to load products for allocation.");
                setLoading(false);
                console.error("Product fetch error:", err);
            }
        };
        fetchProducts();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // --- 2. Handle Allocation Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        // Ensure product is a number and quantity is an integer
        const payload = {
            product: parseInt(formData.product),
            quantity_allocated: parseInt(formData.quantity_allocated),
        };

        try {
            // 🛑 CORE ACTION: POST to the correct new endpoint 🛑
            const response = await api.post('/allocations/', payload);
            
            setSuccess("Inventory allocation successful!");
            setLoading(false);
            
            // Clear form or navigate after success
            setFormData({ product: '', quantity_allocated: '' });
            
            // Navigate to a success view or dashboard
            // navigate('/dashboard'); 

        } catch (err) {
            setLoading(false);
            // Extract the specific error detail from the backend (like "Insufficient stock")
            const errorMessage = err.response?.data?.non_field_errors?.[0] || 
                                 err.response?.data?.detail || 
                                 "Allocation failed due to a server error.";
            setError(errorMessage);
            console.error("Allocation submission error:", err.response || err);
        }
    };

    if (loading && products.length === 0) return <div>Loading available products...</div>;
    if (error && products.length === 0) return <div>Error: {error}</div>;


    return (
        <div className="allocation-manager">
            <h2>Create New Inventory Allocation</h2>
            
            {success && <p className="success-message">{success}</p>}
            {error && <p className="error-message">Error: {error}</p>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="product">Select Product (Source)</label>
                    <select
                        name="product"
                        id="product"
                        value={formData.product}
                        onChange={handleChange}
                        required
                    >
                        <option value="">-- Choose a Product --</option>
                        {products.map(product => (
                            <option key={product.id} value={product.id}>
                                {product.name} (Stock: {product.available_stock})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="quantity_allocated">Quantity to Allocate</label>
                    <input
                        type="number"
                        name="quantity_allocated"
                        id="quantity_allocated"
                        value={formData.quantity_allocated}
                        onChange={handleChange}
                        min="1"
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Allocating...' : 'Allocate Inventory'}
                </button>
            </form>
        </div>
    );
}

export default InventoryAllocationManager;
