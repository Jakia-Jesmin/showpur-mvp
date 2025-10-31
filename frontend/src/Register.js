// frontend/src/Register.js

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link for future consistency
import axios from 'axios';
import './Register.css';

// Create a standalone Axios instance for public (unauthenticated) requests
const publicApi = axios.create({
    baseURL: 'http://localhost:8000/api/',
    headers: {
        'Content-Type': 'application/json',
    },
});

function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false); // Added loading state
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // 🛑 Use publicApi.post for the unauthenticated registration request 🛑
            await publicApi.post('register/', {
                username,
                email,
                password,
            });

            // If successful (Axios resolves on 2xx status), navigate to login
            navigate('/login');

        } catch (err) {
            console.error("Registration error:", err.response || err);
            
            let errorMessage = 'An error occurred. Please try again later.';
            const errorData = err.response?.data;

            if (err.response && (err.response.status === 400 || err.response.status === 403) && errorData) {
                // DRF validation errors often come as an object of arrays: 
                // { "username": ["A user with that username already exists."], "password": ["This field is required."] }
                
                // Consolidate all validation errors into a single string
                errorMessage = Object.values(errorData)
                    .flat() // Flatten nested arrays (if any)
                    .join(' ');
            } else if (err.response?.status === 409) {
                // Optional: Handle 409 Conflict specifically for existing user/email
                 errorMessage = 'This username or email is already registered.';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <form onSubmit={handleSubmit} className="register-form">
                <h2>Register</h2>
                {error && <p className="error-message">{error}</p>}
                
                {/* Input Fields (Username, Email, Password) remain the same */}
                <div className="form-group">
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                
                <button type="submit" className="register-button" disabled={loading}>
                    {loading ? 'Processing...' : 'Register'}
                </button>

                 {/* Optional: Add a link back to login for better UX */}
                <p className="login-link">
                    Already have an account? <Link to="/login">Log in here</Link>
                </p>
            </form>
        </div>
    );
}

export default Register;
