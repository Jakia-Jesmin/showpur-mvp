// frontend/src/Header.js
import React from 'react';
import './Header.css'; // We'll create this file next

function Header() {
  return (
    <header className="site-header">
      <div className="header-content">
        <a href="/" className="logo-link">
          <h1 className="logo">Showpur</h1>
        </a>
        <nav className="main-nav">
          <a href="/" className="nav-link">Home</a>
          {/* You can add more links here later */}
        </nav>
      </div>
    </header>
  );
}

export default Header;
