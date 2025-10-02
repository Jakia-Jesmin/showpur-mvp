// frontend/src/Login.js

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; // 🛑 Use vanilla Axios for unauthenticated login 🛑
import { jwtDecode } from 'jwt-decode'; // 🛑 Use standard library for decoding 🛑
import './Login.css';

// Create a standalone Axios instance for UN-AUTHENTICATED requests
// to prevent the interceptor from trying to attach tokens to the login call.
const publicApi = axios.create({
    baseURL: 'http://localhost:8000/api/',
    headers: {
        'Content-Type': 'application/json',
    },
});


function Login({ setAuth }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false); // New loading state
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // 1. Initial login to get tokens using the publicApi (no interceptor)
            // The path becomes 'auth/token/' because the base URL already includes 'api/'
            const response = await publicApi.post('auth/token/', { username, password });

            const tokenData = response.data;
            const accessToken = tokenData.access;
            const refreshToken = tokenData.refresh;

            // 🛑 CRITICAL STEP 🛑
            // 2. Decode Access Token to get User ID and Profile status
            const payload = jwtDecode(accessToken);

            if (!payload || payload.user_id === undefined) {
                setError('Login failed: Invalid token received.');
                setLoading(false);
                return;
            }

            // Extract claims (check your backend for the exact names: 'user_id' and 'has_profile')
            const userId = payload.user_id; 
            const hasProfile = payload.has_profile; 
            
            // 3. Store tokens and user ID in local storage
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            // Ensure userId is stored as a number/string that can be consistently compared (number is better)
            localStorage.setItem('user_id', String(userId)); 

            // 4. Update the global authentication state
            setAuth({
                isAuthenticated: true,
                // Note: The app's interceptor will retrieve the token from local storage now
                userId: userId, 
            });
            
            // 🛑 5. ROLE-BASED NAVIGATION 🛑
            // Navigate based on the 'has_profile' custom claim
            if (hasProfile) {
                navigate('/dashboard/showroom');
            } else {
                navigate('/home'); 
            }

        } catch (err) {
            console.error("Login submission error:", err.response || err);

            // Handle common 401/400 errors from the backend
            if (err.response && (err.response.status === 401 || err.response.status === 400)) {
                // DRF Simple JWT often returns { "detail": "No active account found with the given credentials" }
                setError('Invalid username or password.');
            } else {
                setError('A network error occurred. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-form">
                <h2>Log In</h2>
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="login-button" disabled={loading}>
                    {loading ? 'Logging in...' : 'Log In'}
                </button>
                <p className="login-link">
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;
