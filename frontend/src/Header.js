// frontend/src/Header.js

import React from 'react';
import { Link } from 'react-router-dom'; // Use Link for internal navigation
import './Header.css'; 

// 🛑 Component now accepts isAuthenticated and handleLogout as props 🛑
function Header({ isAuthenticated, handleLogout }) {
    return (
        <header className="navbar">
            <div className="navbar-logo">
                {/* Use <Link> instead of <a> for React routing */}
                <Link to="/" className="logo-link">Showpur</Link>
            </div>
            <nav className="navbar-links">
                {isAuthenticated ? (
                    <>
                        {/* Links for LOGGED-IN users */}
                        <Link to="/create-profile" className="nav-link">Create Profile</Link>
                        
                        {/* 🛑 User Profile Management Link 🛑 */}
                        <Link to="/profile" className="nav-link">My Account</Link> 

                        <button onClick={handleLogout} className="nav-button logout-btn">
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        {/* Links for GUEST users */}
                        <Link to="/register" className="nav-link">Register</Link>
                        <Link to="/login" className="nav-link primary-link">Log In</Link>
                    </>
                )}
            </nav>
        </header>
    );
}

export default Header;
