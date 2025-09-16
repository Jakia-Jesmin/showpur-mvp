// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BusinessProfileList from './BusinessProfileList';
import BusinessProfileDetail from './BusinessProfileDetail';
import BusinessProfileForm from './BusinessProfileForm';
import Register from './Register';
import Login from './Login';
import './App.css';

function App() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    accessToken: null,
  });

  // This useEffect hook runs once on initial component load
  // to check for an existing token in local storage.
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setAuth({
        isAuthenticated: true,
        accessToken: storedToken,
      });
    }
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/profiles/');
      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }
      const data = await response.json();
      setProfiles(data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreateProfile = (newProfile) => {
    setProfiles([...profiles, newProfile]);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAuth({
      isAuthenticated: false,
      accessToken: null,
    });
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <nav className="navbar">
            <div className="logo-container">
              <Link to="/" className="logo-link">Showpur Business Pages</Link>
            </div>
            <div className="nav-links">
              {auth.isAuthenticated ? (
                <>
                  <Link to="/create-profile" className="nav-link">Create Profile</Link>
                  <button onClick={handleLogout} className="nav-button">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/register" className="nav-link">Register</Link>
                  <Link to="/login" className="nav-link">Log In</Link>
                </>
              )}
            </div>
          </nav>
        </header>

        <main className="App-main">
          <Routes>
            <Route path="/" element={<BusinessProfileList profiles={profiles} loading={loading} error={error} />} />
            <Route path="/profiles/:id" element={<BusinessProfileDetail />} />
            <Route path="/create-profile" element={<BusinessProfileForm onCreate={handleCreateProfile} accessToken={auth.accessToken} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login setAuth={setAuth} />} />
          </Routes>
        </main>

        <footer className="App-footer">
          <p>© 2025 Showpur. All rights reserved.</p>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
