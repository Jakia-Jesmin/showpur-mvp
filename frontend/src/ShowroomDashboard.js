// frontend/src/ShowroomDashboard.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ShowroomDashboard.css'; // Create this file for styling

function ShowroomDashboard({ accessToken }) {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // NOTE: In a real app, you'd use a token refresh utility here if the token is expired.
    // For now, we rely on the token being valid or the user being redirected to login 
    // by a centralized router logic if the token fails.

    useEffect(() => {
        if (!accessToken) {
            // User is not authenticated, navigate to login
            navigate('/login');
            return;
        }

        const fetchInventory = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/dashboard/showroom/inventory/', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.status === 401 || response.status === 403) {
                    // Unauthorized or Forbidden: token might be expired or invalid
                    setError("Session expired or access denied. Please log in again.");
                    setLoading(false);
                    // In a production app, you would call refreshAccessToken() here.
                    return; 
                }

                if (!response.ok) {
                    throw new Error(`Failed to fetch inventory: ${response.statusText}`);
                }

                const data = await response.json();
                setInventory(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchInventory();
    }, [accessToken, navigate]);

    if (loading) {
        return <div className="dashboard-container">Loading inventory...</div>;
    }

    if (error) {
        return <div className="dashboard-container error-message">Error: {error}</div>;
    }

    return (
        <div className="dashboard-container">
            <h1>Showroom Inventory Dashboard</h1>
            <p>Welcome, {inventory.length > 0 ? inventory[0].receiving_business_name : 'Manager'}. Here is the current stock allocated to your store.</p>
            
            {inventory.length === 0 ? (
                <p className="no-inventory">You currently have no consigned inventory allocated to your store.</p>
            ) : (
                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th>Producer</th>
                            <th>Allocated</th>
                            <th>Remaining Stock</th>
                            <th>Sales Count</th>
                            <th>Total Sales Value</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map((item) => (
                            <tr key={item.id}>
                                <td>{item.product_name}</td>
                                <td>{item.producer_name}</td>
                                <td>{item.quantity_allocated}</td>
                                <td className={item.quantity_remaining < 3 ? 'low-stock' : ''}>
                                    {item.quantity_remaining}
                                </td>
                                <td>{item.sales_count}</td>
                                <td>{parseFloat(item.sales_value).toFixed(2)}</td>
                                <td>
                                    {/* Link to the Record Sale Form, passing the allocation ID */}
                                    <button 
                                        className="record-sale-btn"
                                        onClick={() => navigate(`/sales/record?allocationId=${item.id}`)}
                                        disabled={item.quantity_remaining <= 0}
                                    >
                                        Record Sale
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default ShowroomDashboard;
