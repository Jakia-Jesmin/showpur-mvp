// frontend/src/RecordSaleForm.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api/api'; // 🛑 Import the custom Axios client 🛑
import './RecordSaleForm.css'; 

// 🛑 Removed accessToken and refreshAccessToken props 🛑
function RecordSaleForm() {
    const [allocationId, setAllocationId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        
        // No need to check for accessToken here, the interceptor will handle unauthorized
        
        // Ensure quantity is a safe integer before sending
        const quantitySold = parseInt(quantity);
        if (isNaN(quantitySold) || quantitySold < 1) {
            setMessage('Quantity must be a positive number.');
            setLoading(false);
            return;
        }

        const data = {
            allocation_id: allocationId,
            quantity_sold: quantitySold,
        };
        
        try {
            // 🛑 Use the api client: it handles the Authorization header and token refresh automatically. 🛑
            const response = await api.post('sales/record/', data);

            const responseData = response.data;

            // Successful 200/201 response
            setMessage(`Sale successful! Product: ${responseData.product}. Remaining Stock: ${responseData.remaining_stock}`);
            setAllocationId('');
            setQuantity(1);
            
        } catch (error) {
            console.error('Sale error:', error.response || error);
            
            const status = error.response?.status;
            const errorData = error.response?.data;
            
            if (status === 400 && errorData) {
                // Backend validation errors (e.g., allocation ID not found, insufficient stock)
                // Assuming the backend returns an 'error' field or top-level message
                const errorMessage = errorData.error || errorData.detail || errorData[Object.keys(errorData)[0]];
                setMessage(`Sale failed: ${errorMessage}`);
                
            } else if (status === 401) {
                // This means the token refresh failed (or no token existed).
                // The interceptor should have handled this, but we catch it for safety.
                setMessage('Session expired. Please log in again.');
                navigate('/login');
                
            } else if (status === 403) {
                 // Permission denied (user not a showroom manager)
                setMessage('Permission denied. You are not authorized to record sales.');
            }
            else {
                setMessage('An unexpected network error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sale-form-container">
            <h1>Record Offline Sale</h1>
            <p>Showroom managers use this to track stock sold from producer inventory.</p>
            
            <form onSubmit={handleSubmit} className="record-sale-form">
                <div className="form-group">
                    <label htmlFor="allocationId">Inventory Allocation ID:</label>
                    <input
                        type="text"
                        id="allocationId"
                        value={allocationId}
                        onChange={(e) => setAllocationId(e.target.value)}
                        required
                        placeholder="e.g., 5"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="quantity">Quantity Sold:</label>
                    <input
                        type="number"
                        id="quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)} 
                        min="1"
                        required
                        placeholder="1"
                    />
                </div>
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Recording...' : 'Record Sale'}
                </button>
                
                {/* Use ternary operator to set the status class */}
                {message && <p className={`status-message ${message.includes('successful') ? 'success' : 'error'}`}>{message}</p>}
            </form>
        </div>
    );
}

export default RecordSaleForm;
