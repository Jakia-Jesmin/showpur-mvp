// frontend/src/ProfileCard.js

import React, { useState } from 'react'; // 🛑 ADDED useState for image fallback 🛑
import { Link } from 'react-router-dom';
import './ProfileCard.css';

// 🛑 Recommended: Replace with a local static image path (e.g., '/static/default-logo.svg')
const DEFAULT_LOGO_URL = 'https://via.placeholder.com/150?text=No+Logo'; 


function ProfileCard({ profile }) {
    // State to manage image error (used to switch to fallback)
    const [logoError, setLogoError] = useState(false);
    
    // Determine the URL to display
    let displayLogoUrl = profile.logo;

    // Use the fallback if logo is missing or if the previous image failed to load
    if (!profile.logo || logoError) {
        displayLogoUrl = DEFAULT_LOGO_URL;
    }

    // Determine the secondary detail text
    const secondaryDetail = profile.address 
        ? profile.address 
        : (profile.description 
            ? profile.description.substring(0, 50) + '...'
            : 'No address or description provided.'); // Handle completely empty profiles


    return (
        <div className="profile-card">
            {/* The entire card is wrapped in a Link for better UX/accessibility */}
            <Link to={`/profiles/${profile.id}`} className="card-link">
                
                <div className="card-logo-container">
                    {/* Display the logo */}
                    <img 
                        src={displayLogoUrl} 
                        alt={`${profile.business_name} logo`} 
                        className="card-logo" 
                        // 🛑 ADDED onError handler to gracefully handle broken image URLs 🛑
                        onError={() => setLogoError(true)}
                    />
                </div>
                
                <div className="card-content">
                    <h3 className="card-title">{profile.business_name}</h3>
                    
                    {/* Display the address or a shortened description */}
                    <p className="card-detail address">
                        {secondaryDetail}
                    </p>
                    
                    {/* Simple contact info - Consider adding mailto: link for better UX */}
                    <p className="card-detail email">
                        Email: <a 
                            href={`mailto:${profile.contact_email}`} 
                            // Stop event propagation to prevent navigating to detail page on email click
                            onClick={(e) => e.preventDefault()} 
                        >
                            {profile.contact_email}
                        </a>
                    </p>
                </div>
                
                <span className="view-details-btn">View Profile →</span>
            </Link>
        </div>
    );
}

export default ProfileCard;
