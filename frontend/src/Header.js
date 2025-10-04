// frontend/src/Header.js

import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css'; 

function Header({ isAuthenticated, handleLogout }) {
    return (
        <header className="navbar">
            <div className="navbar-logo">
                <Link to="/" className="logo-link">Showpur</Link>
            </div>
            <nav className="navbar-links">
                {isAuthenticated ? (
                    <>
                        {/* Links for LOGGED-IN users */}
                        <Link to="/products" className="nav-link">My Products</Link>
                        <Link to="/dashboard" className="nav-link">Dashboard</Link>
                        <Link to="/create-profile" className="nav-link">Create Profile</Link>
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
