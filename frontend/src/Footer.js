// frontend/src/Footer.js
import React from 'react';
import './Footer.css'; // We'll create this file next

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} Showpur. All rights reserved.</p>
        <div className="social-links">
          {/* Add social media links here */}
          <a href="https://web.facebook.com/showpur" target="_blank">Facebook</a>
          <a href="https://www.linkedin.com/company/showpur" target="_blank">LinkedIn</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;