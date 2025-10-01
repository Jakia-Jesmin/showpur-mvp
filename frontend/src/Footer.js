// frontend/src/components/Footer.js

import React from 'react';
import './Footer.css'; // We'll create this CSS next

function Footer() {
    // Dynamically get the current year for the copyright notice
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer-container">
            <div className="footer-content">
                <p className="copyright">
                    © {currentYear} Showpur. All rights reserved.
                </p>
                <div className="social-links">
                    {/* These links currently link to dummy URLs (#). Update them with your actual social media URLs. */}
                    <a href="#" target="_blank" rel="noopener noreferrer" className="social-link">
                        Facebook
                    </a>
                    <a href="#" target="_blank" rel="noopener noreferrer" className="social-link">
                        LinkedIn
                    </a>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
