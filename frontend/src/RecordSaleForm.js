// frontend/src/RecordSaleForm.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RecordSaleForm.css'; 
// NOTE: We don't need to import refreshAccessToken here if it's passed as a prop.

// 🛑 CRITICAL CHANGE: Accept refreshAccessToken as a prop 🛑
function RecordSaleForm({ accessToken, refreshAccessToken }) {
    const [allocationId, setAllocationId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!accessToken) {
            setMessage('Error: You must be logged in to record sales.');
            setLoading(false);
            return;
        }

        const data = {
            allocation_id: allocationId,
            quantity_sold: quantity,
        };
        
        // Function to make the API request
        const makeRequest = async (token) => {
            return fetch('http://localhost:8000/api/sales/record/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });
        };

        try {
            let response = await makeRequest(accessToken);

            if (response.status === 401) {
                // --- 🛑 TOKEN REFRESH LOGIC 🛑 ---
                // Attempt to get a new token using the function passed from App.js
                const newAccessToken = await refreshAccessToken(); 
                
                if (newAccessToken) {
                    // Success: Retry the original sale request with the new token
                    response = await makeRequest(newAccessToken); 
                } else {
                    // Failure: Refresh token is expired/invalid. Force logout.
                    navigate('/login'); 
                    return; // Stop execution after navigation
                }
                // The rest of the logic proceeds with the successful or retried response
            }

            // Handle the response (either the first attempt or the successful retry)
            const responseData = await response.json();

            if (response.ok) {
                setMessage(`Sale successful! Product: ${responseData.product}. Remaining Stock: ${responseData.remaining_stock}`);
                setAllocationId('');
                setQuantity(1);
            } else {
                // This handles 400 (Bad Request), 403 (Forbidden), or general errors
                setMessage(`Sale failed: ${responseData.error || 'An unexpected error occurred.'}`);
            }

        } catch (error) {
            setMessage('Network error recording sale.');
            console.error('Sale error:', error);
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
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        min="1"
                        required
                    />
                </div>
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Recording...' : 'Record Sale'}
                </button>
                
                {message && <p className={`status-message ${message.includes('successful') ? 'success' : 'error'}`}>{message}</p>}
            </form>
        </div>
    );
}

export default RecordSaleForm;
