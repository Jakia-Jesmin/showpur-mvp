// frontend/src/ShowroomDashboard.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api/api'; // 🛑 Import the custom Axios client 🛑
import './ShowroomDashboard.css';

// 🛑 Removed accessToken prop 🛑
function ShowroomDashboard() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Fast-fail check: If tokens aren't even in local storage, go to login immediately.
        // The interceptor will also do this if the API call fails with 401/403.
        if (!localStorage.getItem('access_token')) {
            navigate('/login');
            return;
        }

        const fetchInventory = async () => {
            try {
                // 🛑 Use api.get: Authorization and Refresh Logic are handled by the interceptor. 🛑
                const response = await api.get('dashboard/showroom/inventory/');

                // Axios automatically throws on 4xx/5xx, so we only handle successful data here
                const data = response.data;
                setInventory(data);

            } catch (err) {
                console.error("Dashboard fetch error:", err.response || err);
                
                let errorMessage = "Failed to fetch inventory data.";
                
                // Handle 401/403 errors which typically mean the refresh token failed
                if (err.response?.status === 401 || err.response?.status === 403) {
                    errorMessage = "Session expired or access denied. Redirecting to login.";
                    // The interceptor should handle the redirection, but we set the message here
                    setTimeout(() => navigate('/login'), 1500);
                } else if (err.response?.status === 404) {
                    errorMessage = "Inventory list not found. Check API endpoint.";
                } else {
                    errorMessage = `Network error: ${err.message}`;
                }

                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchInventory();
    }, [navigate]); // Depend only on navigate, as token logic is abstracted

    if (loading) {
        return <div className="dashboard-container">Loading inventory...</div>;
    }

    if (error) {
        return <div className="dashboard-container error-message">Error: {error}</div>;
    }

    return (
        <div className="dashboard-container">
            <h1>Showroom Inventory Dashboard</h1>
            <p>Welcome, **{inventory.length > 0 ? inventory[0].receiving_business_name : 'Manager'}**. Here is the current stock allocated to your store.</p>
            
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
                                    <button 
                                        className="record-sale-btn"
                                        // Pass the allocation ID as a query parameter
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
