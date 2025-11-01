import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import baseApi from './api/baseApi';
import { jwtDecode } from 'jwt-decode'; 
import './Login.css';


function Login({ setAuth }) {
    const location = useLocation(); 
    const [message, setMessage] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false); 
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state?.registrationSuccess) {
            setMessage('Registration successful! Please log in.');
            // Clear the state so the message doesn't reappear on refresh
            window.history.replaceState({}, document.title); 
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // 1. Initial login to get tokens
            const response = await baseApi.post('auth/token/', { username, password });
            const accessToken = response.data.access;
            const refreshToken = response.data.refresh;

            // 2. Decode Access Token to get User ID and Profile status
            const payload = jwtDecode(accessToken);
            const userId = payload.user_id; 
            const hasProfile = payload.has_profile; 

            if (!userId) {
                setError('Login failed: Invalid token received (User ID missing).');
                setLoading(false);
                return;
            }
            
            // 3. Store tokens and user ID in local storage
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            // ✅ FIX: Storing the decoded userId (CRITICAL)
            localStorage.setItem('user_id', String(userId)); 

            // 4. Update the global authentication state
            setAuth({
                isAuthenticated: true,
                userId: userId, 
            });
            
            // 5. ROLE-BASED NAVIGATION (Improved UX)
            // Navigate based on the 'has_profile' custom claim
            if (hasProfile) {
                // If user has a profile, go to dashboard
                navigate('/dashboard'); 
            } else {
                // If no profile, prompt them to create one
                navigate('/create-profile'); 
            }

        } catch (err) {
            console.error("Login submission error:", err.response || err);

            // Handle 401/400 errors (Invalid credentials)
            if (err.response && (err.response.status === 401 || err.response.status === 400)) {
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
                {message && <p className="success-message">{message}</p>}
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
