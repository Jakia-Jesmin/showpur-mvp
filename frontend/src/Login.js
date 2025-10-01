// frontend/src/Login.js

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

// Helper function to decode the JWT payload
// Base64 decoding is safe because JWT is self-contained.
const decodeJWT = (token) => {
    try {
        // The payload is the second part of the token (index 1)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to decode JWT:", e);
        return null;
    }
};

function Login({ setAuth }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            // 1. Initial login to get tokens
            // NOTE: Ensure your backend path is correct (either 'api/token/' or 'api/auth/token/')
            const tokenResponse = await fetch('http://localhost:8000/api/auth/token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!tokenResponse.ok) {
                setError('Invalid username or password.');
                return;
            }

            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access;
            const refreshToken = tokenData.refresh;

            // 🛑 CRITICAL STEP 🛑
            // 2. Decode Access Token to get User ID and Role/Profile status
            const payload = decodeJWT(accessToken);

            if (!payload) {
                setError('Login failed: Invalid token received.');
                return;
            }

            const userId = payload.user_id; // JWT standard field
            const hasProfile = payload.has_profile; // Our custom claim from backend

            // 3. Store tokens and user ID in local storage
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            localStorage.setItem('user_id', userId); 

            // 4. Update the global authentication state
            setAuth({
                isAuthenticated: true,
                accessToken: accessToken,
                userId: userId,
            });
            
            // 🛑 5. ROLE-BASED NAVIGATION 🛑
            if (hasProfile) {
                // If the user (like AtiqulStore) has a profile, send them to the Showroom Dashboard
                navigate('/dashboard/showroom');
            } else {
                // Default route for a user with no associated profile
                navigate('/home'); 
            }

        } catch (err) {
            console.error("Login submission error:", err);
            setError('An error occurred. Please try again later.');
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
                <button type="submit" className="login-button">Log In</button>
                <p className="login-link">
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;
