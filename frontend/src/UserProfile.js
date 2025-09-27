// frontend/src/UserProfile.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import refreshAccessToken from './utils/api'; 
import './UserProfile.css';

// Component receives auth tokens and setAuth function from App.js
function UserProfile({ accessToken, setAuth }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '', 
        confirmPassword: '' 
    });
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');

    // --- 1. Fetch User Data (GET) ---
    useEffect(() => {
        const fetchUser = async () => {
            if (!accessToken) {
                navigate('/login');
                return;
            }

            try {
                const response = await fetch('http://localhost:8000/api/auth/user/', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setFormData(prev => ({
                        ...prev,
                        username: data.username,
                        email: data.email,
                    }));
                } else if (response.status === 401) {
                    // Token expired, attempt refresh
                    // NOTE: You must ensure refreshAccessToken is defined in ./utils/api
                    const newAccessToken = await refreshAccessToken(); 
                    if (newAccessToken) {
                        await fetchUser(); // Retry fetch
                    } else {
                        navigate('/login');
                    }
                } else {
                    console.error("Failed to fetch user:", response.status);
                    navigate('/'); 
                }
            } catch (error) {
                console.error("Network error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [accessToken, navigate]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- 2. Handle Profile Update (PATCH) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setMessage('');
        
        if (formData.password && formData.password !== formData.confirmPassword) {
            setErrors({ confirmPassword: 'Passwords do not match.' });
            return;
        }

        const dataToSubmit = {
            username: formData.username,
            email: formData.email,
        };
        if (formData.password) {
            dataToSubmit.password = formData.password;
        }

        const makeRequest = async (token) => {
            return fetch('http://localhost:8000/api/auth/user/', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(dataToSubmit)
            });
        };

        let currentAccessToken = accessToken;

        try {
            let response = await makeRequest(currentAccessToken);

            if (response.status === 401) {
                const newAccessToken = await refreshAccessToken();
                if (newAccessToken) {
                    currentAccessToken = newAccessToken;
                    response = await makeRequest(currentAccessToken); // Retry
                }
            }

            if (response.ok) {
                setMessage('Profile updated successfully!');
                setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
                
                if (dataToSubmit.password) {
                    // Force re-login after password change for security
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user_id'); 
                    setAuth({ accessToken: null, userId: null });
                    alert("Password updated. Please log in again with your new credentials.");
                    navigate('/login');
                }
            } else {
                const errorData = await response.json();
                setErrors(errorData);
                setMessage('Failed to update profile.');
            }

        } catch (error) {
            console.error("Submission error:", error);
            setMessage('Network error during update.');
        }
    };
    
    if (loading) return <div className="profile-container">Loading user data...</div>;

    return (
        <div className="profile-container">
            <h1>My Account</h1>
            <p className={`status-message ${message.includes('successfully') ? 'success' : message ? 'error' : ''}`}>{message}</p>
            
            {/* ... (rest of the form content) ... */}
            <form onSubmit={handleSubmit} className="user-profile-form">
                
                <div className="form-group">
                    <label>Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                    {errors.username && <p className="error">{errors.username}</p>}
                </div>
                
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    {errors.email && <p className="error">{errors.email}</p>}
                </div>
                
                <hr />
                <h2 className="password-heading">Change Password (Optional)</h2>

                <div className="form-group">
                    <label>New Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Leave blank to keep current password"
                    />
                    {errors.password && <p className="error">{errors.password}</p>}
                </div>

                <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                    />
                    {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
                </div>
                
                <button type="submit">Update Profile</button>
            </form>
        </div>
    );
}

export default UserProfile;
