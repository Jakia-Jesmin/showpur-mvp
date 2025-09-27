// frontend/src/Login.js

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

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
      const tokenResponse = await fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!tokenResponse.ok) {
        setError('Invalid username or password');
        return;
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access;
      const refreshToken = tokenData.refresh;

      // 2. Fetch the user's ID using the new access token
      const userResponse = await fetch('http://localhost:8000/api/auth/user/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      if (!userResponse.ok) {
        // If fetching user data fails, something is wrong with the backend endpoint
        setError('Login successful, but failed to retrieve user data.');
        return;
      }

      const userData = await userResponse.json();
      const userId = userData.id; // Assuming your user detail endpoint returns { id: X, ... }

      // 3. Store tokens AND user ID in local storage
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user_id', userId); // <-- NEW: Store the user's ID

      // 4. Update the global authentication state
      setAuth({
        isAuthenticated: true,
        accessToken: accessToken,
        userId: userId, // <-- NEW: Pass the user ID to App.js state
      });
      
      navigate('/'); // Redirect to the home page

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